// Reads a teen's wallet state. Everything is derived from the ledger.
const config = require('../../config');
const { HttpError } = require('../../errors');

// client = a pg client or pool. Pass lock = true inside a transaction to serialise spends.
async function getWalletState(client, teenId, { lock = false } = {}) {
  const w = await client.query(`SELECT id FROM wallets WHERE teen_id = $1${lock ? ' FOR UPDATE' : ''}`, [teenId]);
  if (w.rowCount === 0) throw new HttpError(404, 'NO_WALLET', 'This teen has no wallet.');
  const walletId = w.rows[0].id;

  const bal = await client.query('SELECT COALESCE(SUM(amount_paise), 0)::bigint AS balance FROM ledger_entries WHERE wallet_id = $1', [walletId]);
  const spent = await client.query(
    `SELECT COALESCE(-SUM(amount_paise), 0)::bigint AS spent FROM ledger_entries
      WHERE wallet_id = $1 AND type = 'spend'
        AND (created_at AT TIME ZONE $2)::date = (now() AT TIME ZONE $2)::date`,
    [walletId, config.timezone]
  );
  const rules = await client.query('SELECT daily_limit_paise, blocked_categories FROM spending_rules WHERE teen_id = $1', [teenId]);
  const r = rules.rows[0];

  return {
    teenId,
    walletId,
    currency: 'INR',
    balancePaise: Number(bal.rows[0].balance),
    spentTodayPaise: Number(spent.rows[0].spent),
    dailyLimitPaise: r ? Number(r.daily_limit_paise) : 50000,
    blockedCategories: r ? r.blocked_categories : [],
  };
}

module.exports = { getWalletState };
