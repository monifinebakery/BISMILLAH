-- Add currency_code column to user_settings table for cross-device currency sync
ALTER TABLE user_settings ADD COLUMN currency_code TEXT DEFAULT 'IDR';

-- Add comment for documentation
COMMENT ON COLUMN user_settings.currency_code IS 'User preferred currency code for cross-device synchronization';
