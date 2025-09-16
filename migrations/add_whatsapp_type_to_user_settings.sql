-- Migration: Add whatsapp_type column to user_settings table
-- Date: 2024-12-19
-- Description: Add support for choosing between WhatsApp Personal and Business

-- Add whatsapp_type column with default value 'personal'
ALTER TABLE user_settings 
ADD COLUMN whatsapp_type VARCHAR(20) DEFAULT 'personal';

-- Add constraint to only allow 'personal' or 'business' values
ALTER TABLE user_settings 
ADD CONSTRAINT check_whatsapp_type 
CHECK (whatsapp_type IN ('personal', 'business'));

-- Add comment for documentation
COMMENT ON COLUMN user_settings.whatsapp_type IS 'WhatsApp type preference: personal or business';

-- Update any existing NULL values to default
UPDATE user_settings 
SET whatsapp_type = 'personal' 
WHERE whatsapp_type IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE user_settings 
ALTER COLUMN whatsapp_type SET NOT NULL;