const express = require('express');
const { z } = require('zod');
const { query, withTx } = require('../../db');
const { asyncHandler } = require('../../errors');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { resolveTeenId } = require('../family/access');
const { getWalletState } = require('./service');
const { checkPayment } = require('../../checkPayment');

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

// The teen pays a (simulated) merchant. The rules engine decides; the ledger records it.
// A declined payment is a normal answer (200 with approved: false), not an error.
router.post('/transactions', requireAuth, requireRole('teen'), asyncHandler(async (req, res) => {
  const { amountPaise, category, merchant } = spendSchema.parse(req.body);
  const result = await withTx(async (client) => {
    const state = await getWalletState(client, req.user.id, { lock: true }); // lock stops two spends racing
    const decision = checkPayment(state, amountPaise, category);
    if (!decision.approved) return { approved: false, reason: decision.reason, message: MESSAGES[decision.reason] };
    await client.query(
      `INSERT INTO ledger_entries (wallet_id, amount_paise, type, category, merchant) VALUES ($1, $2, 'spend', $3, $4)`,
      [state.walletId, -amountPaise, category.toLowerCase(), merchant]
    );
    return { approved: true, reason: null, balancePaise: state.balancePaise - amountPaise };
  });
  res.json(result);
}));

module.exports = router;
