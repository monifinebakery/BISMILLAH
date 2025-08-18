-- Ensure consistent index naming on purchases.user_id
DROP INDEX IF EXISTS idx_purchases_user;
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
