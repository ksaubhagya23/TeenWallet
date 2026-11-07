const express = require('express');
const { z } = require('zod');
const { query, pool } = require('../../db');
const { asyncHandler, HttpError } = require('../../errors');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { resolveTeenId } = require('../family/access');
const { getWalletState } = require('./service');
const { processPayment, RulesError } = require('../../rulesEngine');

const router = express.Router();

const MESSAGES = {
  INSUFFICIENT_BALANCE: 'Not enough balance.',
  DAILY_LIMIT_EXCEEDED: 'Daily limit reached.',
  CATEGORY_BLOCKED: 'Blocked by your parent.',
  INVALID_AMOUNT: 'That amount is not valid.',
};

// Balance, today's spending and the parent's rules for one teen.
router.get('/wallet', requireAuth, asyncHandler(async (req, res) => {
  const teenId = await resolveTeenId(req.user, req.query.teenId);
  res.json(await getWalletState({ query }, teenId));
}));

// Newest first. Optional ?category=food&limit=50
router.get('/transactions', requireAuth, asyncHandler(async (req, res) => {
  const teenId = await resolveTeenId(req.user, req.query.teenId);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const params = [teenId, limit];
  let categoryFilter = '';
  if (req.query.category) { params.push(String(req.query.category).toLowerCase()); categoryFilter = 'AND lower(l.category) = $3'; }
  const r = await query(
    `SELECT l.id, l.amount_paise, l.type, l.category, l.merchant, l.created_at
       FROM ledger_entries l JOIN wallets w ON w.id = l.wallet_id
      WHERE w.teen_id = $1 ${categoryFilter}
      ORDER BY l.created_at DESC LIMIT $2`,
    params
  );
  res.json({ transactions: r.rows.map((x) => ({ ...x, amount_paise: Number(x.amount_paise) })) });
}));

const spendSchema = z.object({
  amountPaise: z.number().int().positive().max(10_000_000),
  category: z.string().trim().min(1).max(30),
  merchant: z.string().trim().min(1).max(60),
});

// The teen pays a (simulated) merchant. The rules engine (src/rulesEngine.js) decides and
// writes the ledger row in one locked transaction.
// A declined payment is a normal answer (200 with approved: false), not an error.
router.post('/transactions', requireAuth, requireRole('teen'), asyncHandler(async (req, res) => {
  const { amountPaise, category, merchant } = spendSchema.parse(req.body);
  try {
    const result = await processPayment(pool, { teenId: req.user.id, amountPaise, category, merchant });
    res.json(result.approved ? result : { ...result, message: MESSAGES[result.reason] });
  } catch (err) {
    if (err instanceof RulesError) throw new HttpError(err.code === 'WALLET_NOT_FOUND' ? 404 : 400, err.code, err.message);
    throw err;
  }
}));

module.exports = router;
