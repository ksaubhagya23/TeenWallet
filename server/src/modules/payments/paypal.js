// Small PayPal Orders v2 client. Only the calls the wallet needs.
// fetchImpl is injectable so tests can run without the network.
const crypto = require('node:crypto');
const { HttpError } = require('../../errors');

function createPayPal({ baseUrl, clientId, secret, fetchImpl = fetch }) {
  let cached = { token: null, expiresAt: 0 };

  async function call(path, { method = 'GET', headers = {}, body } = {}) {
    const res = await fetchImpl(`${baseUrl}${path}`, { method, headers, body });
    const text = await res.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
    if (!res.ok) {
      const issue = data.details && data.details[0] && data.details[0].issue;
      const err = new HttpError(
        502,
        'PAYPAL_ERROR',
        `PayPal said ${data.name || res.status}${issue ? ` (${issue})` : ''}${data.debug_id ? `, debug id ${data.debug_id}` : ''}`
      );
      err.paypalIssue = issue || null;
      throw err;
    }
    return data;
  }

  async function getAccessToken() {
    if (cached.token && Date.now() < cached.expiresAt - 60_000) return cached.token;
    if (!clientId || !secret) throw new HttpError(500, 'PAYPAL_NOT_CONFIGURED', 'PayPal keys are missing on the server.');
    const basic = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const data = await call('/v1/oauth2/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=client_credentials',
    });
    cached = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
    return cached.token;
  }

  async function authed(path, opts = {}) {
    const token = await getAccessToken();
    return call(path, { ...opts, headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` } });
  }

  // usdValue is a string like "10.00". Returns { id, approveUrl }.
  async function createOrder({ usdValue, referenceId, returnUrl, cancelUrl }) {
    const order = await authed('/v2/checkout/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'PayPal-Request-Id': crypto.randomUUID() },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{ reference_id: referenceId, amount: { currency_code: 'USD', value: usdValue } }],
        payment_source: {
          paypal: { experience_context: { return_url: returnUrl, cancel_url: cancelUrl, user_action: 'PAY_NOW' } },
        },
      }),
    });
    const link = (order.links || []).find((l) => l.rel === 'payer-action' || l.rel === 'approve');
    if (!link) throw new HttpError(502, 'PAYPAL_ERROR', 'PayPal did not return an approval link.');
    return { id: order.id, approveUrl: link.href };
  }

  // Capture is sent with no body and no Content-Type, as PayPal's docs show.
  async function captureOrder(orderId) {
    const data = await authed(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, { method: 'POST' });
    return { status: data.status, raw: data };
  }

  async function getOrder(orderId) {
    return authed(`/v2/checkout/orders/${encodeURIComponent(orderId)}`);
  }

  // Asks PayPal whether a webhook call really came from PayPal.
  async function verifyWebhook({ headers, event, webhookId }) {
    const data = await authed('/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: event,
      }),
    });
    return data.verification_status === 'SUCCESS';
  }

  return { getAccessToken, createOrder, captureOrder, getOrder, verifyWebhook };
}

module.exports = { createPayPal };
