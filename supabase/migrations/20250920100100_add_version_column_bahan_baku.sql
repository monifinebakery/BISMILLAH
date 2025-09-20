-- Add version column to bahan_baku table for optimistic locking
-- This helps prevent race conditions when updating WAC values concurrently

-- Add version column with default value
ALTER TABLE bahan_baku 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Add comment to explain the column
COMMENT ON COLUMN bahan_baku.version 
IS 'Version number for optimistic locking to prevent race conditions in WAC updates';

-- Create index on version column for better performance
CREATE INDEX IF NOT EXISTS idx_bahan_baku_version ON bahan_baku(version);