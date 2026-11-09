const express = require('express');
const { z } = require('zod');
const { query, withTx } = require('../../db');
const { asyncHandler, HttpError } = require('../../errors');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { resolveTeenId } = require('../family/access');
const { getWalletState } = require('../wallet/service');
const { goalView } = require('./service');

const router = express.Router();

const createSchema = z.object({
  title: z.string().trim().min(1).max(60),
  targetPaise: z.number().int().min(100).max(100_000_000),
  teenId: z.string().uuid().optional(),
  productName: z.string().trim().max(120).optional(),
  productImageUrl: z.string().url().max(500).optional(),
  productLink: z.string().url().max(500).optional(),
});

// A teen creates their own goal; a linked parent can create one for a teen with teenId.
router.post('/goals', requireAuth, asyncHandler(async (req, res) => {
  const b = createSchema.parse(req.body);
  const teenId = await resolveTeenId(req.user, b.teenId);
  const goal = await withTx(async (client) => {
    const r = await client.query(
      `INSERT INTO goals (teen_id, title, target_paise, product_name, product_image_url, product_link)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [teenId, b.title, b.targetPaise, b.productName || null, b.productImageUrl || null, b.productLink || null]
    );
    await client.query("INSERT INTO badges (teen_id, code) VALUES ($1, 'first_goal') ON CONFLICT DO NOTHING", [teenId]);
    return r.rows[0];
  });
  res.status(201).json(goalView(goal));
}));

router.get('/goals', requireAuth, asyncHandler(async (req, res) => {
  const teenId = await resolveTeenId(req.user, req.query.teenId);
  const r = await query('SELECT * FROM goals WHERE teen_id = $1 ORDER BY created_at DESC', [teenId]);
  res.json({ goals: r.rows.map(goalView) });
}));

const contributeSchema = z.object({ amountPaise: z.number().int().min(100).max(100_000_000) });

// The teen moves money from the wallet into a goal. It is a "save" row in the ledger,
// so the balance drops but the daily spending limit is not used up.
router.post('/goals/:id/contribute', requireAuth, requireRole('teen'), asyncHandler(async (req, res) => {
  const { amountPaise } = contributeSchema.parse(req.body);
  const result = await withTx(async (client) => {
    const state = await getWalletState(client, req.user.id, { lock: true });
    const g = await client.query('SELECT * FROM goals WHERE id = $1 AND teen_id = $2 FOR UPDATE', [req.params.id, req.user.id]);
    if (g.rowCount === 0) throw new HttpError(404, 'GOAL_NOT_FOUND', 'No such goal.');
    const goal = g.rows[0];
    const room = Number(goal.target_paise) - Number(goal.saved_paise);
    if (room <= 0) throw new HttpError(409, 'GOAL_ALREADY_REACHED', 'This goal is already fully saved.');
    if (amountPaise > room) throw new HttpError(400, 'TOO_MUCH', `Only ${room} paise left to reach this goal.`);
    if (amountPaise > state.balancePaise) throw new HttpError(400, 'INSUFFICIENT_BALANCE', 'Not enough balance.');

    await client.query(
      `INSERT INTO ledger_entries (wallet_id, amount_paise, type, category, merchant) VALUES ($1, $2, 'save', 'savings', $3)`,
      [state.walletId, -amountPaise, `Goal: ${goal.title}`]
    );
    const u = await client.query('UPDATE goals SET saved_paise = saved_paise + $2 WHERE id = $1 RETURNING *', [goal.id, amountPaise]);
    const updated = u.rows[0];
    const newBadges = [];
    if (Number(updated.saved_paise) >= Number(updated.target_paise)) {
      const b = await client.query("INSERT INTO badges (teen_id, code) VALUES ($1, 'goal_reached') ON CONFLICT DO NOTHING RETURNING code", [req.user.id]);
      if (b.rowCount) newBadges.push('goal_reached');
    }
    return { goal: goalView(updated), balancePaise: state.balancePaise - amountPaise, newBadges };
  });
  res.json(result);
}));

module.exports = router;
