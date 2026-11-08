// Tests the PayPal client against a fake PayPal (no network needed).
const test = require('node:test');
const assert = require('node:assert');
const { createPayPal } = require('../src/modules/payments/paypal');

function fakeFetch(routes, log) {
  return async (url, opts) => {
    log.push({ url, opts });
    const key = `${opts.method || 'GET'} ${new URL(url).pathname}`;
    const r = routes[key];
    if (!r) throw new Error(`unexpected call ${key}`);
    return { ok: r.status < 400, status: r.status, text: async () => JSON.stringify(r.body) };
  };
}
const make = (routes, log = []) => createPayPal({ baseUrl: 'https://pp.test', clientId: 'id', secret: 'sec', fetchImpl: fakeFetch(routes, log) });
const TOKEN = { 'POST /v1/oauth2/token': { status: 200, body: { access_token: 'tok', expires_in: 32400 } } };

test('gets a token with Basic auth and caches it', async () => {
  const log = [];
  const pp = make(TOKEN, log);
  assert.strictEqual(await pp.getAccessToken(), 'tok');
  await pp.getAccessToken();
  assert.strictEqual(log.length, 1);
  assert.strictEqual(log[0].opts.headers.Authorization, `Basic ${Buffer.from('id:sec').toString('base64')}`);
  assert.strictEqual(log[0].opts.body, 'grant_type=client_credentials');
});

test('creates an order and returns the approval link', async () => {
  const log = [];
  const pp = make({ ...TOKEN, 'POST /v2/checkout/orders': { status: 201, body: { id: 'ORD1', links: [{ rel: 'self', href: 'x' }, { rel: 'payer-action', href: 'https://pp/approve' }] } } }, log);
  const o = await pp.createOrder({ usdValue: '10.00', referenceId: 'r1', returnUrl: 'https://api/paypal/return', cancelUrl: 'https://api/paypal/cancel' });
  assert.deepStrictEqual(o, { id: 'ORD1', approveUrl: 'https://pp/approve' });
  const sent = JSON.parse(log[1].opts.body);
  assert.strictEqual(sent.intent, 'CAPTURE');
  assert.strictEqual(sent.purchase_units[0].amount.value, '10.00');
  assert.strictEqual(sent.payment_source.paypal.experience_context.return_url, 'https://api/paypal/return');
  assert.strictEqual(log[1].opts.headers.Authorization, 'Bearer tok');
});

test('capture sends an empty JSON body with Content-Type application/json', async () => {
  const log = [];
  const pp = make({ ...TOKEN, 'POST /v2/checkout/orders/ORD1/capture': { status: 201, body: { status: 'COMPLETED' } } }, log);
  assert.strictEqual((await pp.captureOrder('ORD1')).status, 'COMPLETED');
  assert.strictEqual(log[1].opts.body, '{}');
  assert.strictEqual(log[1].opts.headers['Content-Type'], 'application/json');
});

test('turns PayPal errors into a readable error with the issue code', async () => {
  const pp = make({ ...TOKEN, 'POST /v2/checkout/orders/ORD1/capture': { status: 422, body: { name: 'UNPROCESSABLE_ENTITY', debug_id: 'abc', details: [{ issue: 'ORDER_NOT_APPROVED' }] } } });
  await assert.rejects(() => pp.captureOrder('ORD1'), (e) => e.status === 502 && e.paypalIssue === 'ORDER_NOT_APPROVED' && /abc/.test(e.message));
});

test('verifies a webhook through PayPal', async () => {
  const log = [];
  const pp = make({ ...TOKEN, 'POST /v1/notifications/verify-webhook-signature': { status: 200, body: { verification_status: 'SUCCESS' } } }, log);
  const ok = await pp.verifyWebhook({ headers: { 'paypal-transmission-id': 't1' }, event: { id: 'E1' }, webhookId: 'W1' });
  assert.strictEqual(ok, true);
  assert.strictEqual(JSON.parse(log[1].opts.body).webhook_id, 'W1');
});
