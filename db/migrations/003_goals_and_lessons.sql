-- Lets a teen move money from the wallet into a savings goal.
-- A "save" ledger row is negative (money leaves the spendable balance) but does NOT count as spending,
-- so it does not use up the parent's daily limit.
ALTER TABLE ledger_entries DROP CONSTRAINT IF EXISTS ledger_entries_type_check;
ALTER TABLE ledger_entries DROP CONSTRAINT IF EXISTS sign_matches_type;
ALTER TABLE ledger_entries ADD CONSTRAINT ledger_entries_type_check CHECK (type IN ('topup', 'spend', 'save'));
ALTER TABLE ledger_entries ADD CONSTRAINT sign_matches_type CHECK (
  (type = 'topup' AND amount_paise > 0) OR
  (type IN ('spend', 'save') AND amount_paise < 0)
);
