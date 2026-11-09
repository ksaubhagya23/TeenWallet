const express = require('express');
const { z } = require('zod');
const { query } = require('../../db');
const { asyncHandler } = require('../../errors');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { buildAnswer, toOrQuery } = require('./service');

const router = express.Router();

const askSchema = z.object({ question: z.string().trim().min(2).max(300) });

// The teen asks a money question. We find the best matching lesson with Postgres full-text search.
router.post('/ai/ask', requireAuth, requireRole('teen'), asyncHandler(async (req, res) => {
  const { question } = askSchema.parse(req.body);
  const l = !toOrQuery(question) ? { rows: [] } : await query(
    `SELECT id, title, topic, body,
            ts_rank(to_tsvector('english', title || ' ' || COALESCE(topic, '') || ' ' || body), q) AS rank
       FROM lessons, to_tsquery('english', $1) AS q
      WHERE to_tsvector('english', title || ' ' || COALESCE(topic, '') || ' ' || body) @@ q
      ORDER BY rank DESC LIMIT 1`,
    [toOrQuery(question)]
  );
  const g = await query(
    'SELECT title, target_paise, saved_paise FROM goals WHERE teen_id = $1 AND saved_paise < target_paise ORDER BY created_at DESC LIMIT 1',
    [req.user.id]
  );
  res.json({ question, ...buildAnswer({ lesson: l.rows[0] || null, goal: g.rows[0] || null }) });
}));

module.exports = router;
