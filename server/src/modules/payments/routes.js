const express = require('express');
const crypto = require('node:crypto');
const { z } = require('zod');
const config = require('../../config');
const { query, withTx } = require('../../db');
const { HttpError, asyncHandler } = require('../../errors');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { assertParentOfTeen } = require('../family/access');
const { getWalletState } = require('../wallet/service');
const { paiseToUsd, formatRupees } = require('../../money');
const { createPayPal } = require('./paypal');
const { creditOrder } = require('./service');

const paypal = createPayPal(config.paypal);
const MIN_PAISE = 1_000;      // Rs 10
const MAX_PAISE = 1_000_000;  // Rs 10,000 (demo limit)

const api = express.Router();       // mounted at /api
const pages = express.Router();     // mounted at / (PayPal redirects the parent's browser here)

const createSchema = z.object({
  teenId: z.string().uuid(),
  amountPaise: z.number().int().min(MIN_PAISE).max(MAX_PAISE),
});

// 1. The parent asks to add money. We create a PayPal order and return the approval link.
api.post('/topup/orders', requireAuth, requireRole('parent'), asyncHandler(async (req, res) => {
  const { teenId, amountPaise } = createSchema.parse(req.body);
  await assertParentOfTeen(req.user.id, teenId);

  const usdValue = paiseToUsd(amountPaise, config.inrPerUsd);
  const order = await paypal.createOrder({
    usdValue,
    referenceId: crypto.randomUUID(),
    returnUrl: `${config.publicBaseUrl}/paypal/return`,
    cancelUrl: `${config.publicBaseUrl}/paypal/cancel`,
  });
  await query(
    `INSERT INTO paypal_orders (order_id, parent_id, teen_id, amount_paise, usd_value) VALUES ($1, $2, $3, $4, $5)`,
    [order.id, req.user.id, teenId, amountPaise, usdValue]
  );
  res.status(201).json({
    orderId: order.id,
    approvalUrl: order.approveUrl,
    amountPaise,
    display: `${formatRupees(amountPaise)} (about $${usdValue})`,
  });
}));

// 2. After the parent approves in PayPal, the app calls this to take the money and credit the wallet.
api.post('/topup/orders/:orderId/capture', requireAuth, requireRole('parent'), asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const o = await query('SELECT * FROM paypal_orders WHERE order_id = $1 AND parent_id = $2', [orderId, req.user.id]);
  if (o.rowCount === 0) throw new HttpError(404, 'ORDER_NOT_FOUND', 'No such top-up order.');
  const order = o.rows[0];

  if (order.status !== 'captured') {
    let status;
    try {
      status = (await paypal.captureOrder(orderId)).status;
    } catch (err) {
      if (err.paypalIssue === 'ORDER_ALREADY_CAPTURED') status = (await paypal.getOrder(orderId)).status;
      else if (err.paypalIssue === 'ORDER_NOT_APPROVED') {
        throw new HttpError(409, 'ORDER_NOT_APPROVED', 'The payment was not approved in PayPal yet.');
      } else throw err;
    }
    if (status !== 'COMPLETED') throw new HttpError(409, 'NOT_COMPLETED', `PayPal order status is ${status}.`);
    await withTx((client) => creditOrder(client, orderId));
  }

  const state = await getWalletState({ query }, order.teen_id);
  res.json({ status: 'COMPLETED', addedPaise: Number(order.amount_paise), balancePaise: state.balancePaise });
}));

// Backup path: PayPal tells us a payment finished, even if the app never called capture.
api.post('/paypal/webhook', asyncHandler(async (req, res) => {
  if (!config.paypal.webhookId) throw new HttpError(503, 'WEBHOOK_NOT_CONFIGURED', 'PAYPAL_WEBHOOK_ID is not set.');
  const ok = await paypal.verifyWebhook({ headers: req.headers, event: req.body, webhookId: config.paypal.webhookId });
  if (!ok) throw new HttpError(400, 'BAD_SIGNATURE', 'Webhook signature check failed.');
  const event = req.body;
  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const orderId = event.resource && event.resource.supplementary_data && event.resource.supplementary_data.related_ids
      && event.resource.supplementary_data.related_ids.order_id;
    if (orderId) await withTx((client) => creditOrder(client, orderId));
  }
  res.json({ received: true });
}));

// PayPal sends the parent's browser here; we bounce them back into the app.
const back = (flag) => (req, res) => {
  const url = new URL(config.appDeepLink);
  if (req.query.token) url.searchParams.set('token', String(req.query.token));
  if (flag) url.searchParams.set('cancelled', '1');
  res.redirect(302, url.toString());
};
pages.get('/paypal/return', back(false));
pages.get('/paypal/cancel', back(true));

module.exports = { api, pages };
