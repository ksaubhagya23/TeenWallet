// src/checkPayment.js
// Decides whether a teen's payment is allowed. All money is in paise.
//
// teen = {
//   balancePaise:       number  (SUM of ledger_entries for their wallet)
//   spentTodayPaise:    number  (total spent today, as a positive number)
//   dailyLimitPaise:    number  (from spending_rules)
//   blockedCategories:  string[] (from spending_rules)
// }
// amount   = positive whole number of paise being charged
// category = e.g. 'food', 'books', 'games'

function checkPayment(teen, amount, category) {
  if (!Number.isInteger(amount) || amount <= 0) {
    return { approved: false, reason: 'INVALID_AMOUNT' };
  }

  // 1. Balance first
  if (teen.balancePaise < amount) {
    return { approved: false, reason: 'INSUFFICIENT_BALANCE' };
  }

  // 2. Daily limit
  if (teen.spentTodayPaise + amount > teen.dailyLimitPaise) {
    return { approved: false, reason: 'DAILY_LIMIT_EXCEEDED' };
  }

  // 3. Blocked category
  const blocked = (teen.blockedCategories || []).map((c) => c.toLowerCase());
  if (category && blocked.includes(String(category).toLowerCase())) {
    return { approved: false, reason: 'CATEGORY_BLOCKED' };
  }

  return { approved: true, reason: null };
}

module.exports = { checkPayment };
