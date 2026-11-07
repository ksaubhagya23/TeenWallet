const express = require('express');
const { z } = require('zod');
const { query } = require('../../db');
const { HttpError, asyncHandler } = require('../../errors');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { assertParentOfTeen, isParentOf } = require('../family/access');

const router = express.Router();

const shape = (r) => ({ teenId: r.teen_id, dailyLimitPaise: Number(r.daily_limit_paise), blockedCategories: r.blocked_categories });

// A parent can read their teen's rules; so can the teen themselves.
router.get('/rules/:teenId', requireAuth, asyncHandler(async (req, res) => {
  const { teenId } = req.params;
  const allowed = req.user.id === teenId || (req.user.role === 'parent' && (await isParentOf(req.user.id, teenId)));
  if (!allowed) throw new HttpError(403, 'FORBIDDEN', 'You cannot see these rules.');
  const r = await query('SELECT teen_id, daily_limit_paise, blocked_categories FROM spending_rules WHERE teen_id = $1', [teenId]);
  if (r.rowCount === 0) throw new HttpError(404, 'NO_RULES', 'No rules found for this teen.');
  res.json(shape(r.rows[0]));
}));

const putSchema = z.object({
  dailyLimitPaise: z.number().int().min(0).max(10_000_000),
  blockedCategories: z.array(z.string().trim().min(1).max(30)).max(30),
});

// Only the parent sets the limit and the blocked categories.
router.put('/rules/:teenId', requireAuth, requireRole('parent'), asyncHandler(async (req, res) => {
  const { teenId } = req.params;
  await assertParentOfTeen(req.user.id, teenId);
  const body = putSchema.parse(req.body);
  const blocked = [...new Set(body.blockedCategories.map((c) => c.toLowerCase()))];
  const r = await query(
    `INSERT INTO spending_rules (teen_id, daily_limit_paise, blocked_categories) VALUES ($1, $2, $3)
     ON CONFLICT (teen_id) DO UPDATE SET daily_limit_paise = EXCLUDED.daily_limit_paise,
       blocked_categories = EXCLUDED.blocked_categories, updated_at = now()
     RETURNING teen_id, daily_limit_paise, blocked_categories`,
    [teenId, body.dailyLimitPaise, blocked]
  );
  res.json(shape(r.rows[0]));
}));

module.exports = router;
