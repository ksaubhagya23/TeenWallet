-- db/migrations/002_paypal_orders.sql
-- Remembers which PayPal order belongs to which parent, teen and amount,
-- so a capture (or a late webhook) can credit the right wallet exactly once.
CREATE TABLE IF NOT EXISTS paypal_orders (
  order_id     TEXT PRIMARY KEY,
  parent_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  teen_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  usd_value    TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'captured')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  captured_at  TIMESTAMPTZ
);
