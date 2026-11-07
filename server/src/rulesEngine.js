// src/rulesEngine.js
// Connects checkPayment() to the real database (PostgreSQL via the `pg` package).
// `db` is a pg Pool. All money is in paise.

const { checkPayment } = require('./checkPayment');

const DEFAULT_DAILY_LIMIT_PAISE = 50000; // Rs 500, matches schema default

// Start of "today" in India time, as a timestamptz
const START_OF_TODAY_IST = `(date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')`;

class RulesError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code;
  }
}

// Loads the four numbers checkPayment needs. `client` can be a Pool or a transaction client.
async function loadTeenState(client, walletId, teenId) {
  const bal = await client.query(
    `SELECT COALESCE(SUM(amount_paise), 0)::bigint AS balance
       FROM ledger_entries WHERE wallet_id = $1`,
    [walletId]
  );
  const spent = await client.query(
    `SELECT COALESCE(-SUM(amount_paise), 0)::bigint AS spent
       FROM ledger_entries
      WHERE wallet_id = $1 AND type = 'spend' AND created_at >= ${START_OF_TODAY_IST}`,
    [walletId]
  );
  const rules = await client.query(
    `SELECT daily_limit_paise, blocked_categories FROM spending_rules WHERE teen_id = $1`,
    [teenId]
  );
  const r = rules.rows[0];
  return {
    balancePaise: Number(bal.rows[0].balance),
    spentTodayPaise: Number(spent.rows[0].spent),
    dailyLimitPaise: r ? Number(r.daily_limit_paise) : DEFAULT_DAILY_LIMIT_PAISE,
    blockedCategories: r ? r.blocked_categories : [],
  };
}

// Try to make a payment. Approved payments are written to the ledger as a negative row.
// Everything happens in one transaction with the wallet locked, so two payments
// at the same moment cannot both pass the balance/limit check.
async function processPayment(db, { teenId, amountPaise, category, merchant }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const w = await client.query(
      `SELECT id FROM wallets WHERE teen_id = $1 FOR UPDATE`,
      [teenId]
    );
    if (w.rows.length === 0) throw new RulesError('WALLET_NOT_FOUND', 'No wallet for this teen');
    const walletId = w.rows[0].id;

    const state = await loadTeenState(client, walletId, teenId);
    const decision = checkPayment(state, amountPaise, category);

    if (!decision.approved) {
      await client.query('ROLLBACK');
      return { approved: false, reason: decision.reason, balancePaise: state.balancePaise };
    }

    await client.query(
      `INSERT INTO ledger_entries (wallet_id, amount_paise, type, category, merchant)
       VALUES ($1, $2, 'spend', $3, $4)`,
      [walletId, -amountPaise, category ? String(category).toLowerCase() : null, merchant || null]
    );
    await client.query('COMMIT');
    return {
      approved: true,
      reason: null,
      balancePaise: state.balancePaise - amountPaise,
    };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* ignore */ }
    throw err;
  } finally {
    client.release();
  }
}

// ---- Parent: view and change a teen's rules ----

async function assertParentOfTeen(db, parentId, teenId) {
  const r = await db.query(
    `SELECT 1 FROM parent_teen_links WHERE parent_id = $1 AND teen_id = $2`,
    [parentId, teenId]
  );
  if (r.rows.length === 0) throw new RulesError('NOT_YOUR_TEEN', 'You are not linked to this teen');
}

async function getRules(db, teenId) {
  const r = await db.query(
    `SELECT daily_limit_paise, blocked_categories FROM spending_rules WHERE teen_id = $1`,
    [teenId]
  );
  if (r.rows.length === 0) {
    return { dailyLimitPaise: DEFAULT_DAILY_LIMIT_PAISE, blockedCategories: [] };
  }
  return {
    dailyLimitPaise: Number(r.rows[0].daily_limit_paise),
    blockedCategories: r.rows[0].blocked_categories,
  };
}

// Only a linked parent can change rules. Pass only the fields you want to change.
async function updateRules(db, parentId, teenId, { dailyLimitPaise, blockedCategories }) {
  await assertParentOfTeen(db, parentId, teenId);

  if (dailyLimitPaise !== undefined &&
      (!Number.isInteger(dailyLimitPaise) || dailyLimitPaise < 0)) {
    throw new RulesError('INVALID_LIMIT', 'Daily limit must be a whole number of paise, 0 or more');
  }
  if (blockedCategories !== undefined && !Array.isArray(blockedCategories)) {
    throw new RulesError('INVALID_CATEGORIES', 'blockedCategories must be a list');
  }

  const current = await getRules(db, teenId);
  const newLimit = dailyLimitPaise !== undefined ? dailyLimitPaise : current.dailyLimitPaise;
  const newBlocked = blockedCategories !== undefined
    ? [...new Set(blockedCategories.map((c) => String(c).trim().toLowerCase()).filter(Boolean))]
    : current.blockedCategories;

  await db.query(
    `INSERT INTO spending_rules (teen_id, daily_limit_paise, blocked_categories, updated_at)
     VALUES ($1, $2, $3, now())
     ON CONFLICT (teen_id) DO UPDATE
       SET daily_limit_paise = EXCLUDED.daily_limit_paise,
           blocked_categories = EXCLUDED.blocked_categories,
           updated_at = now()`,
    [teenId, newLimit, newBlocked]
  );
  return { dailyLimitPaise: newLimit, blockedCategories: newBlocked };
}

module.exports = { processPayment, loadTeenState, getRules, updateRules, RulesError };
