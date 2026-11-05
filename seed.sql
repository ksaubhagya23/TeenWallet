-- db/seed.sql  (sample data only; password_hash is a placeholder, not a real login)
-- Fixed UUIDs so the data is easy to reference.

INSERT INTO users (id, email, password_hash, name, role) VALUES
 ('11111111-1111-1111-1111-111111111111', 'parent@example.com', 'PLACEHOLDER_HASH', 'Asha Parent', 'parent'),
 ('22222222-2222-2222-2222-222222222222', 'teen@example.com',   'PLACEHOLDER_HASH', 'Riya Teen',   'teen');

INSERT INTO parent_teen_links (parent_id, teen_id) VALUES
 ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');

INSERT INTO wallets (id, teen_id) VALUES
 ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222');

INSERT INTO spending_rules (teen_id, daily_limit_paise, blocked_categories) VALUES
 ('22222222-2222-2222-2222-222222222222', 30000, ARRAY['games']);  -- Rs 300/day, games blocked

INSERT INTO ledger_entries (wallet_id, amount_paise, type, category, merchant, paypal_order_id, created_at) VALUES
 ('33333333-3333-3333-3333-333333333333', 100000, 'topup', NULL,    'PayPal',     'SEED-ORDER-001', now() - interval '3 days'),
 ('33333333-3333-3333-3333-333333333333',  -8000, 'spend', 'food',  'Canteen',    NULL,             now() - interval '2 days'),
 ('33333333-3333-3333-3333-333333333333', -25000, 'spend', 'books', 'Book Store', NULL,             now() - interval '1 day'),
 ('33333333-3333-3333-3333-333333333333',  -5000, 'spend', 'food',  'Canteen',    NULL,             now() - interval '2 hours');
-- Balance after seed: 100000 - 8000 - 25000 - 5000 = 62000 paise (Rs 620)
