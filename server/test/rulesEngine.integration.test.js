// Runs against a REAL Postgres that already has schema.sql + seed.sql loaded.
//   DATABASE_URL=postgres://... node --test test/rulesEngine.integration.test.js
// Needs:  npm install pg
// It changes data (adds spends), so use your local test database, not a shared one.
const test = require('node:test');
const assert = require('node:assert');

const url = process.env.DATABASE_URL;
const TEEN = '22222222-2222-2222-2222-222222222222';
const PARENT = '11111111-1111-1111-1111-111111111111';

test('real database: approve, then decline on limit, balance and category', { skip: !url }, async () => {
  const { Pool } = require('pg');
  const { processPayment, getRules } = require('../src/rulesEngine');
  const db = new Pool({ connectionString: url });
  try {
    const rules = await getRules(db, TEEN);
    assert.ok(rules.blockedCategories.includes('games'), 'seed.sql should be loaded');

    assert.strictEqual((await processPayment(db, { teenId: TEEN, amountPaise: 1000, category: 'food', merchant: 'Canteen' })).approved, true);
    assert.strictEqual((await processPayment(db, { teenId: TEEN, amountPaise: 1000, category: 'games' })).reason, 'CATEGORY_BLOCKED');
    assert.strictEqual((await processPayment(db, { teenId: TEEN, amountPaise: 99999999, category: 'food' })).reason, 'INSUFFICIENT_BALANCE');
    assert.strictEqual((await processPayment(db, { teenId: TEEN, amountPaise: 29000, category: 'food' })).reason, 'DAILY_LIMIT_EXCEEDED');

    // Two payments at the same moment must not both pass
    const [a, b] = await Promise.all([
      processPayment(db, { teenId: TEEN, amountPaise: 20000, category: 'food' }),
      processPayment(db, { teenId: TEEN, amountPaise: 20000, category: 'food' }),
    ]);
    assert.strictEqual([a, b].filter((x) => x.approved).length <= 1, true);
  } finally {
    await db.end();
  }
});
