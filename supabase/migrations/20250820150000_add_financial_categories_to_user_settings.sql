-- Add financial_categories column to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS financial_categories jsonb;

-- Add comment for documentation
COMMENT ON COLUMN user_settings.financial_categories IS 'Custom financial categories for income and expense tracking';