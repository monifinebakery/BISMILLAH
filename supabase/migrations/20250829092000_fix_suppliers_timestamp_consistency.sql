-- Fix suppliers table timestamp consistency
-- Ensures updated_at column has proper defaults and constraints

-- First, update any existing rows with NULL updated_at values
UPDATE public.suppliers 
SET updated_at = COALESCE(created_at, now()) 
WHERE updated_at IS NULL;

-- Then, update updated_at column to have consistent behavior with created_at
ALTER TABLE public.suppliers 
  ALTER COLUMN updated_at SET DEFAULT now();

-- Finally, set NOT NULL constraint
ALTER TABLE public.suppliers 
  ALTER COLUMN updated_at SET NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.suppliers.updated_at IS 'Timestamp ketika supplier terakhir diupdate, otomatis diperbarui';

-- Create or replace trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row changes
DROP TRIGGER IF EXISTS suppliers_update_updated_at ON public.suppliers;
CREATE TRIGGER suppliers_update_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_suppliers_updated_at();

-- Add index for better performance on timestamp queries
CREATE INDEX IF NOT EXISTS idx_suppliers_timestamps 
ON public.suppliers (created_at DESC, updated_at DESC);

-- Verify the changes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'suppliers' 
  AND table_schema = 'public'
  AND column_name IN ('created_at', 'updated_at');
