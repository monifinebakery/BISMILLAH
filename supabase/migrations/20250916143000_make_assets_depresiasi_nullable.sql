-- Migration to make depresiasi column nullable in assets table
-- This allows users to leave depreciation field empty when creating assets

-- Remove NOT NULL constraint from depresiasi column
ALTER TABLE public.assets ALTER COLUMN depresiasi DROP NOT NULL;

-- Update the constraint to allow NULL values while keeping the non-negative check
ALTER TABLE public.assets DROP CONSTRAINT IF EXISTS assets_nonnegatives;

-- Recreate the constraint with NULL-safe checks
ALTER TABLE public.assets ADD CONSTRAINT assets_nonnegatives 
  CHECK (
    (nilai_awal >= 0::numeric) 
    AND (nilai_sekarang >= 0::numeric) 
    AND (depresiasi IS NULL OR depresiasi >= 0::numeric)
  );

-- Add comment for documentation
COMMENT ON COLUMN public.assets.depresiasi IS 'Persentase depresiasi aset (optional, NULL jika tidak ada depresiasi)';