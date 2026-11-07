const test = require('node:test');
const assert = require('node:assert');
const { paiseToUsd, formatRupees } = require('../src/money');

test('Rs 850 at 85 per dollar is $10.00', () => assert.strictEqual(paiseToUsd(85000, 85), '10.00'));
test('rounds to the nearest cent', () => assert.strictEqual(paiseToUsd(10000, 85), '1.18')); // Rs 100 -> 1.176...
test('never goes below one cent', () => assert.strictEqual(paiseToUsd(1, 85), '0.01'));
test('rejects bad input', () => {
  assert.throws(() => paiseToUsd(0, 85));
  assert.throws(() => paiseToUsd(10.5, 85));
  assert.throws(() => paiseToUsd(100, 0));
});
test('formats rupees', () => assert.strictEqual(formatRupees(62000), '₹620.00'));
