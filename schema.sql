-- db/schema.sql  (PostgreSQL)
-- Money is always stored as whole paise (1 rupee = 100 paise). Never floats.

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- for gen_random_uuid()

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('parent', 'teen')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE parent_teen_links (
  parent_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teen_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (parent_id, teen_id)
);

CREATE TABLE wallets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teen_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  currency   TEXT NOT NULL DEFAULT 'INR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The key table. Balance = SUM(amount_paise) for a wallet.
-- Positive = money in (topup), negative = money out (spend).
CREATE TABLE ledger_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id       UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount_paise    BIGINT NOT NULL CHECK (amount_paise <> 0),
  type            TEXT NOT NULL CHECK (type IN ('topup', 'spend')),
  category        TEXT,
  merchant        TEXT,
  paypal_order_id TEXT UNIQUE,           -- NULL for spends; unique for topups
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- topup must be positive, spend must be negative
  CONSTRAINT sign_matches_type CHECK (
    (type = 'topup' AND amount_paise > 0) OR
    (type = 'spend' AND amount_paise < 0)
  )
);
CREATE INDEX idx_ledger_wallet_time ON ledger_entries (wallet_id, created_at DESC);

CREATE TABLE spending_rules (
  teen_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_limit_paise   BIGINT NOT NULL DEFAULT 50000 CHECK (daily_limit_paise >= 0),
  blocked_categories  TEXT[] NOT NULL DEFAULT '{}',
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE goals (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teen_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  target_paise       BIGINT NOT NULL CHECK (target_paise > 0),
  saved_paise        BIGINT NOT NULL DEFAULT 0 CHECK (saved_paise >= 0),
  product_name       TEXT,        -- from Channel3
  product_image_url  TEXT,
  product_link       TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lessons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  topic       TEXT,
  quiz        JSONB,             -- questions, options, correct answer
  position    INT NOT NULL DEFAULT 0
);

CREATE TABLE lesson_progress (
  teen_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id    UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed    BOOLEAN NOT NULL DEFAULT false,
  quiz_score   INT,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (teen_id, lesson_id)
);

CREATE TABLE badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teen_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code       TEXT NOT NULL,      -- e.g. 'first_topup', 'first_goal'
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (teen_id, code)
);

-- Handy view: current balance per wallet
CREATE VIEW wallet_balances AS
SELECT w.id AS wallet_id, w.teen_id, COALESCE(SUM(l.amount_paise), 0) AS balance_paise
FROM wallets w LEFT JOIN ledger_entries l ON l.wallet_id = w.id
GROUP BY w.id, w.teen_id;
