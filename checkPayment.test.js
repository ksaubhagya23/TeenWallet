// Run with: node --test
const test = require('node:test');
const assert = require('node:assert');
const { checkPayment } = require('../src/checkPayment');

const teen = {
  balancePaise: 62000,
  spentTodayPaise: 5000,
  dailyLimitPaise: 30000,
  blockedCategories: ['games'],
};

test('approves a normal payment', () => {
  assert.deepStrictEqual(checkPayment(teen, 10000, 'food'), { approved: true, reason: null });
});

test('declines when balance is too low', () => {
  const r = checkPayment({ ...teen, balancePaise: 2000 }, 10000, 'food');
  assert.deepStrictEqual(r, { approved: false, reason: 'INSUFFICIENT_BALANCE' });
});

test('declines when over the daily limit', () => {
  const r = checkPayment(teen, 26000, 'food'); // 5000 + 26000 > 30000
  assert.deepStrictEqual(r, { approved: false, reason: 'DAILY_LIMIT_EXCEEDED' });
});

test('declines a blocked category', () => {
  const r = checkPayment(teen, 1000, 'games');
  assert.deepStrictEqual(r, { approved: false, reason: 'CATEGORY_BLOCKED' });
});

test('checks balance before limit before category', () => {
  const broke = { ...teen, balancePaise: 0 };
  assert.strictEqual(checkPayment(broke, 99999, 'games').reason, 'INSUFFICIENT_BALANCE');
  assert.strictEqual(checkPayment(teen, 40000, 'games').reason, 'DAILY_LIMIT_EXCEEDED'); // within balance, over limit, blocked too
});

test('rejects invalid amounts', () => {
  assert.strictEqual(checkPayment(teen, 0, 'food').reason, 'INVALID_AMOUNT');
  assert.strictEqual(checkPayment(teen, -5, 'food').reason, 'INVALID_AMOUNT');
  assert.strictEqual(checkPayment(teen, 10.5, 'food').reason, 'INVALID_AMOUNT');
});
