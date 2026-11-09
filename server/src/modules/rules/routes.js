const express = require('express');
const { z } = require('zod');
const { pool } = require('../../db');
const { HttpError, asyncHandler } = require('../../errors');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { isParentOf } = require('../family/access');
const { getRules, updateRules, RulesError } = require('../../rulesEngine');

const router = express.Router();

const STATUS = { NOT_YOUR_TEEN: 403, WALLET_NOT_FOUND: 404 };
const toHttp = (err) => (err instanceof RulesError ? new HttpError(STATUS[err.code] || 400, err.code, err.message) : err);

// A parent can read their teen's rules; so can the teen themselves.
router.get('/rules/:teenId', requireAuth, asyncHandler(async (req, res) => {
  const { teenId } = req.params;
  const allowed = req.user.id === teenId || (req.user.role === 'parent' && (await isParentOf(req.user.id, teenId)));
  if (!allowed) throw new HttpError(403, 'FORBIDDEN', 'You cannot see these rules.');
  res.json({ teenId, ...(await getRules(pool, teenId)) });
}));

const putSchema = z.object({
  dailyLimitPaise: z.number().int().min(0).max(10_000_000).optional(),
  blockedCategories: z.array(z.string().trim().min(1).max(30)).max(30).optional(),
});

// Only a linked parent sets the limit and blocked categories. Send only the fields to change.
router.put('/rules/:teenId', requireAuth, requireRole('parent'), asyncHandler(async (req, res) => {
  const body = putSchema.parse(req.body);
  try {
    res.json({ teenId: req.params.teenId, ...(await updateRules(pool, req.user.id, req.params.teenId, body)) });
  } catch (err) {
    throw toHttp(err);
  }
}));

module.exports = router;
