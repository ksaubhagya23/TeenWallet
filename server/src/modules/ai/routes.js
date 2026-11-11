const express = require('express');
const { z } = require('zod');
const config = require('../../config');
const { query } = require('../../db');
const { asyncHandler } = require('../../errors');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { buildAnswer, toOrQuery } = require('./service');
const { createLlm } = require('./llm');

const router = express.Router();
const llm = createLlm(config.ai);

const askSchema = z.object({ question: z.string().trim().min(2).max(300) });

// The teen asks a money question.
// 1. Postgres full-text search finds the best lesson (context for the model).
// 2. The language model writes the answer from the question, that lesson and the teen's goal.
// 3. If the model is not configured or fails, the answer comes straight from the lesson instead.
router.post('/ai/ask', requireAuth, requireRole('teen'), asyncHandler(async (req, res) => {
  const { question } = askSchema.parse(req.body);
  const search = toOrQuery(question);
  const l = !search ? { rows: [] } : await query(
    `SELECT id, title, topic, body,
            ts_rank(to_tsvector('english', title || ' ' || COALESCE(topic, '') || ' ' || body), q) AS rank
       FROM lessons, to_tsquery('english', $1) AS q
      WHERE to_tsvector('english', title || ' ' || COALESCE(topic, '') || ' ' || body) @@ q
      ORDER BY rank DESC LIMIT 1`,
    [search]
  );
  const g = await query(
    'SELECT title, target_paise, saved_paise FROM goals WHERE teen_id = $1 AND saved_paise < target_paise ORDER BY created_at DESC LIMIT 1',
    [req.user.id]
  );
  const lesson = l.rows[0] || null;
  const goal = g.rows[0] || null;

  if (llm.enabled) {
    try {
      const answer = await llm.ask({ question, lesson, goal });
      return res.json({ question, answer, lessonId: lesson ? lesson.id : null, source: 'ai', model: llm.model });
    } catch (err) {
      console.error('AI tutor fell back to lessons:', err.message);
    }
  }
  res.json({ question, ...buildAnswer({ lesson, goal }) });
}));

module.exports = router;
