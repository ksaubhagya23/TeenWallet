const express = require('express');
const { z } = require('zod');
const { query } = require('../../db');
const { HttpError, asyncHandler } = require('../../errors');
const { requireAuth, requireRole } = require('../../middleware/auth');

const router = express.Router();
// The parent links an existing teen account by the teen's email.
router.post('/links', requireAuth, requireRole('parent'), asyncHandler(async (req, res) => {
  const { teenEmail } = z.object({ teenEmail: z.string().trim().toLowerCase().email() }).parse(req.body);
  const t = await query(`SELECT id, name, email FROM users WHERE email = $1 AND role = 'teen'`, [teenEmail]);
  if (t.rowCount === 0) throw new HttpError(404, 'TEEN_NOT_FOUND', 'No teen account with that email. Ask them to register first.');
  await query('INSERT INTO parent_teen_links (parent_id, teen_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, t.rows[0].id]);
  res.status(201).json({ teen: t.rows[0] });
}));

router.get('/links', requireAuth, requireRole('parent'), asyncHandler(async (req, res) => {
  const r = await query(
    `SELECT u.id, u.name, u.email FROM parent_teen_links l JOIN users u ON u.id = l.teen_id WHERE l.parent_id = $1 ORDER BY u.name`,
    [req.user.id]
  );
  res.json({ teens: r.rows });
}));

module.exports = router;
