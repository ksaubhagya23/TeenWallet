// Run with: node --test
// Uses a tiny fake database so the logic can be tested without Postgres.
const test = require('node:test');
const assert = require('node:assert');
const { processPayment, updateRules, getRules, RulesError } = require('../src/rulesEngine');

function fakeDb({ balance = 62000, spent = 5000, limit = 30000, blocked = ['games'], linked = true } = {}) {
  const log = [];
  let rules = { daily_limit_paise: limit, blocked_categories: blocked };
  const handle = async (sql, params) => {
    log.push(sql.trim().split(/\s+/).slice(0, 3).join(' '));
    if (/FROM wallets/.test(sql)) return { rows: [{ id: 'w1' }] };
    if (/SUM\(amount_paise\), 0\)::bigint AS balance/.test(sql)) return { rows: [{ balance }] };
    if (/AS spent/.test(sql)) return { rows: [{ spent }] };
    if (/FROM spending_rules/.test(sql)) return { rows: rules ? [rules] : [] };
    if (/FROM parent_teen_links/.test(sql)) return { rows: linked ? [{}] : [] };
    if (/INSERT INTO ledger_entries/.test(sql)) { log.push(`LEDGER ${params[1]}`); return { rows: [] }; }
    if (/INSERT INTO spending_rules/.test(sql)) {
      rules = { daily_limit_paise: params[1], blocked_categories: params[2] };
      return { rows: [] };
    }
    return { rows: [] }; // BEGIN / COMMIT / ROLLBACK
  };
  const client = { query: handle, release() { log.push('RELEASE'); } };
  return { query: handle, connect: async () => client, log };
}

test('approved payment writes a negative ledger row and commits', async () => {
  const db = fakeDb();
  const r = await processPayment(db, { teenId: 't', amountPaise: 10000, category: 'Food', merchant: 'Canteen' });
  assert.deepStrictEqual(r, { approved: true, reason: null, balancePaise: 52000 });
  assert.ok(db.log.includes('LEDGER -10000'));
  assert.ok(db.log.includes('COMMIT'));
});

test('no balance: declined, nothing written', async () => {
  const db = fakeDb({ balance: 2000 });
  const r = await processPayment(db, { teenId: 't', amountPaise: 10000, category: 'food' });
  assert.strictEqual(r.reason, 'INSUFFICIENT_BALANCE');
  assert.ok(!db.log.some((l) => l.startsWith('LEDGER')));
  assert.ok(db.log.includes('ROLLBACK'));
});

test('over daily limit: declined', async () => {
  const db = fakeDb();
  const r = await processPayment(db, { teenId: 't', amountPaise: 26000, category: 'food' });
  assert.strictEqual(r.reason, 'DAILY_LIMIT_EXCEEDED');
});

test('blocked category: declined', async () => {
  const db = fakeDb();
  const r = await processPayment(db, { teenId: 't', amountPaise: 1000, category: 'GAMES' });
  assert.strictEqual(r.reason, 'CATEGORY_BLOCKED');
});

test('client is always released', async () => {
  const db = fakeDb();
  await processPayment(db, { teenId: 't', amountPaise: 1000, category: 'food' });
  assert.ok(db.log.includes('RELEASE'));
});

test('parent can update limit and categories (normalised, de-duplicated)', async () => {
  const db = fakeDb();
  const r = await updateRules(db, 'p', 't', { dailyLimitPaise: 20000, blockedCategories: [' Games ', 'games', 'Snacks'] });
  assert.deepStrictEqual(r, { dailyLimitPaise: 20000, blockedCategories: ['games', 'snacks'] });
});

test('updating only the limit keeps existing blocked categories', async () => {
  const db = fakeDb();
  const r = await updateRules(db, 'p', 't', { dailyLimitPaise: 10000 });
  assert.deepStrictEqual(r.blockedCategories, ['games']);
});

test('parent not linked to the teen is refused', async () => {
  const db = fakeDb({ linked: false });
  await assert.rejects(() => updateRules(db, 'p', 't', { dailyLimitPaise: 100 }),
    (e) => e instanceof RulesError && e.code === 'NOT_YOUR_TEEN');
});

test('bad limit is refused', async () => {
  const db = fakeDb();
  await assert.rejects(() => updateRules(db, 'p', 't', { dailyLimitPaise: -5 }),
    (e) => e.code === 'INVALID_LIMIT');
  await assert.rejects(() => updateRules(db, 'p', 't', { dailyLimitPaise: 10.5 }),
    (e) => e.code === 'INVALID_LIMIT');
});
