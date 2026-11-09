const express = require('express');
const { z } = require('zod');
const { query, withTx } = require('../../db');
const { asyncHandler, HttpError } = require('../../errors');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { resolveTeenId } = require('../family/access');
const { publicQuiz, gradeQuiz } = require('./service');

const router = express.Router();

async function award(client, teenId, code) {
  const r = await client.query('INSERT INTO badges (teen_id, code) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING code', [teenId, code]);
  return r.rowCount > 0 ? code : null;
}

// All lessons in order, with this teen's progress. A parent adds ?teenId=...
router.get('/lessons', requireAuth, asyncHandler(async (req, res) => {
  const teenId = await resolveTeenId(req.user, req.query.teenId);
  const r = await query(
    `SELECT l.id, l.title, l.topic, l.position, COALESCE(p.completed, false) AS completed, p.quiz_score
       FROM lessons l LEFT JOIN lesson_progress p ON p.lesson_id = l.id AND p.teen_id = $1
      ORDER BY l.position`,
    [teenId]
  );
  const lessons = r.rows.map((x) => ({ id: x.id, title: x.title, topic: x.topic, completed: x.completed, quizScore: x.quiz_score }));
  res.json({ completed: lessons.filter((l) => l.completed).length, total: lessons.length, lessons });
}));

// One lesson: the text and the quiz questions (answers are not included).
router.get('/lessons/:id', requireAuth, asyncHandler(async (req, res) => {
  const r = await query('SELECT id, title, topic, body, quiz FROM lessons WHERE id = $1', [req.params.id]);
  if (r.rowCount === 0) throw new HttpError(404, 'LESSON_NOT_FOUND', 'No such lesson.');
  const l = r.rows[0];
  res.json({ id: l.id, title: l.title, topic: l.topic, body: l.body, questions: publicQuiz(l.quiz) });
}));

const answerSchema = z.object({ answers: z.array(z.number().int().min(0).max(10)).min(1).max(30) });

// The teen sends one answer number per question. 60% or more completes the lesson.
router.post('/lessons/:id/quiz', requireAuth, requireRole('teen'), asyncHandler(async (req, res) => {
  const { answers } = answerSchema.parse(req.body);
  const l = await query('SELECT quiz FROM lessons WHERE id = $1', [req.params.id]);
  if (l.rowCount === 0) throw new HttpError(404, 'LESSON_NOT_FOUND', 'No such lesson.');
  const graded = gradeQuiz(l.rows[0].quiz, answers);
  if (!graded) throw new HttpError(400, 'WRONG_ANSWER_COUNT', 'Send one answer for every question.');

  const newBadges = await withTx(async (client) => {
    const badges = [];
    await client.query(
      `INSERT INTO lesson_progress (teen_id, lesson_id, completed, quiz_score, completed_at)
       VALUES ($1, $2, $3, $4, CASE WHEN $3 THEN now() END)
       ON CONFLICT (teen_id, lesson_id) DO UPDATE SET
         quiz_score = GREATEST(COALESCE(lesson_progress.quiz_score, 0), EXCLUDED.quiz_score),
         completed = lesson_progress.completed OR EXCLUDED.completed,
         completed_at = COALESCE(lesson_progress.completed_at, EXCLUDED.completed_at)`,
      [req.user.id, req.params.id, graded.passed, graded.score]
    );
    if (graded.passed) {
      const first = await award(client, req.user.id, 'first_lesson');
      if (first) badges.push(first);
      const done = await client.query(
        `SELECT (SELECT COUNT(*) FROM lessons) AS total,
                (SELECT COUNT(*) FROM lesson_progress WHERE teen_id = $1 AND completed) AS done`,
        [req.user.id]
      );
      if (Number(done.rows[0].done) >= Number(done.rows[0].total)) {
        const all = await award(client, req.user.id, 'all_lessons');
        if (all) badges.push(all);
      }
    }
    return badges;
  });

  res.json({ ...graded, newBadges });
}));

// Badges earned so far.
router.get('/badges', requireAuth, asyncHandler(async (req, res) => {
  const teenId = await resolveTeenId(req.user, req.query.teenId);
  const r = await query('SELECT code, awarded_at FROM badges WHERE teen_id = $1 ORDER BY awarded_at', [teenId]);
  res.json({ badges: r.rows.map((b) => ({ code: b.code, awardedAt: b.awarded_at })) });
}));

module.exports = router;
