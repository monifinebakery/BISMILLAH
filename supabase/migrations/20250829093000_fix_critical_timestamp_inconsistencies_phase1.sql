-- PHASE 1: Critical Business Operations Timestamp Fixes
-- This migration addresses the most critical date/timestamp inconsistencies
-- affecting financial reporting, order management, and inventory tracking

-- ==================================================================================
-- BACKUP & SAFETY CHECKS
-- ==================================================================================

-- Check for any NULL values that would break the migration
DO $$ 
BEGIN
    -- Check critical tables for NULL values
    PERFORM 1 FROM financial_transactions WHERE date IS NULL;
    IF FOUND THEN
        RAISE EXCEPTION 'Found NULL dates in financial_transactions. Please fix before migration.';
    END IF;
    
    PERFORM 1 FROM orders WHERE tanggal IS NULL;
    IF FOUND THEN
        RAISE EXCEPTION 'Found NULL dates in orders. Please fix before migration.';
    END IF;
    
    PERFORM 1 FROM purchases WHERE tanggal IS NULL;
    IF FOUND THEN
        RAISE EXCEPTION 'Found NULL dates in purchases. Please fix before migration.';
    END IF;
END $$;

-- ==================================================================================
-- PHASE 1A: CRITICAL BUSINESS DATE COLUMNS
-- ==================================================================================

-- First, handle view dependencies that reference the columns we're changing

-- Drop views that depend on financial_transactions.date
DROP VIEW IF EXISTS public.daily_profit_summary CASCADE;
DROP VIEW IF EXISTS public.monthly_profit_summary CASCADE;
DROP VIEW IF EXISTS public.revenue_category_breakdown CASCADE;

-- Drop materialized views that might depend on date columns
DROP MATERIALIZED VIEW IF EXISTS public.dashboard_financial_summary CASCADE;

-- 1. FINANCIAL_TRANSACTIONS.date (MOST CRITICAL)
-- Impact: All financial reports, profit analysis, dashboard summaries
ALTER TABLE public.financial_transactions 
  ALTER COLUMN date TYPE timestamptz 
  USING date::timestamptz;

-- Add comment for clarity
COMMENT ON COLUMN public.financial_transactions.date IS 'Transaction timestamp with timezone - critical for accurate financial reporting';

-- 2. ORDERS.tanggal (CRITICAL for order management)
-- Impact: Order fulfillment, delivery tracking, customer notifications
ALTER TABLE public.orders 
  ALTER COLUMN tanggal TYPE timestamptz 
  USING tanggal::timestamptz;

-- Handle tanggal_selesai (can be NULL, so handle carefully)
ALTER TABLE public.orders 
  ALTER COLUMN tanggal_selesai TYPE timestamptz 
  USING CASE 
    WHEN tanggal_selesai IS NULL THEN NULL 
    ELSE tanggal_selesai::timestamptz 
  END;

-- Add comments
COMMENT ON COLUMN public.orders.tanggal IS 'Order timestamp with timezone - critical for fulfillment tracking';
COMMENT ON COLUMN public.orders.tanggal_selesai IS 'Order completion timestamp with timezone';

-- 3. PURCHASES.tanggal (CRITICAL for inventory & costing)
-- Impact: Inventory valuation, cost calculations, supplier management
ALTER TABLE public.purchases 
  ALTER COLUMN tanggal TYPE timestamptz 
  USING tanggal::timestamptz;

-- Add comment
COMMENT ON COLUMN public.purchases.tanggal IS 'Purchase timestamp with timezone - critical for inventory and costing accuracy';

-- ==================================================================================
-- PHASE 1B: AUDIT TRAIL CONSISTENCY FIXES
-- ==================================================================================

-- Fix purchases.updated_at (missing DEFAULT and NOT NULL)
-- First update NULL values, then set constraints
UPDATE public.purchases 
SET updated_at = COALESCE(created_at, now()) 
WHERE updated_at IS NULL;

-- Then set the constraints
ALTER TABLE public.purchases 
  ALTER COLUMN updated_at SET DEFAULT now();
  
ALTER TABLE public.purchases 
  ALTER COLUMN updated_at SET NOT NULL;

-- Create trigger for purchases auto-update
CREATE OR REPLACE FUNCTION public.update_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS purchases_update_updated_at ON public.purchases;
CREATE TRIGGER purchases_update_updated_at
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW
    EXECUTE FUNCTION public.update_purchases_updated_at();

-- Fix app_settings audit trail
-- First update NULL values
UPDATE public.app_settings 
SET created_at = COALESCE(created_at, now()),
    updated_at = COALESCE(updated_at, now())
WHERE created_at IS NULL OR updated_at IS NULL;

-- Then set constraints
ALTER TABLE public.app_settings 
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

-- Create trigger for app_settings auto-update
CREATE OR REPLACE FUNCTION public.update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_settings_update_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_update_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_app_settings_updated_at();

-- ==================================================================================
-- PHASE 1C: PERFORMANCE INDEXES FOR TIMESTAMP QUERIES
-- ==================================================================================

-- Critical indexes for timestamp-based queries
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date_user 
ON public.financial_transactions (user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_orders_tanggal_user 
ON public.orders (user_id, tanggal DESC);

CREATE INDEX IF NOT EXISTS idx_purchases_tanggal_user 
ON public.purchases (user_id, tanggal DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date_type 
ON public.financial_transactions (date DESC, type, user_id);

CREATE INDEX IF NOT EXISTS idx_orders_tanggal_status 
ON public.orders (tanggal DESC, status, user_id);

-- ==================================================================================
-- PHASE 1D: VIEWS THAT NEED UPDATING
-- ==================================================================================

-- Update views that reference the changed columns
-- Note: Most views should automatically adapt, but let's refresh them

-- Refresh materialized views that might be affected
-- Note: PostgreSQL doesn't support IF EXISTS in REFRESH MATERIALIZED VIEW
-- So we'll use DO blocks to check existence first
DO $$
BEGIN
    -- Refresh dashboard_financial_summary if it exists
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'dashboard_financial_summary') THEN
        REFRESH MATERIALIZED VIEW public.dashboard_financial_summary;
    END IF;
    
    -- Refresh pemakaian_bahan_daily_mv if it exists
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'pemakaian_bahan_daily_mv') THEN
        REFRESH MATERIALIZED VIEW public.pemakaian_bahan_daily_mv;
    END IF;
END $$;

-- ==================================================================================
-- VERIFICATION QUERIES
-- ==================================================================================

-- Verify the changes
DO $$
BEGIN
    RAISE NOTICE 'PHASE 1 MIGRATION VERIFICATION:';
    
    -- Check data types
    RAISE NOTICE 'Checking financial_transactions.date type...';
    PERFORM 1 FROM information_schema.columns 
    WHERE table_name = 'financial_transactions' 
      AND column_name = 'date' 
      AND data_type = 'timestamp with time zone';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to convert financial_transactions.date to timestamptz';
    END IF;
    
    RAISE NOTICE 'Checking orders.tanggal type...';
    PERFORM 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
      AND column_name = 'tanggal' 
      AND data_type = 'timestamp with time zone';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to convert orders.tanggal to timestamptz';
    END IF;
    
    RAISE NOTICE 'Checking purchases.tanggal type...';
    PERFORM 1 FROM information_schema.columns 
    WHERE table_name = 'purchases' 
      AND column_name = 'tanggal' 
      AND data_type = 'timestamp with time zone';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to convert purchases.tanggal to timestamptz';
    END IF;
    
    RAISE NOTICE 'Phase 1 migration completed successfully!';
END $$;

-- Final verification query
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name IN ('financial_transactions', 'orders', 'purchases', 'app_settings')
  AND column_name IN ('date', 'tanggal', 'tanggal_selesai', 'created_at', 'updated_at')
ORDER BY table_name, column_name;
