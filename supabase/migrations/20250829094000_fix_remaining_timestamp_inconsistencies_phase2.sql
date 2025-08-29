-- PHASE 2: Remaining Timestamp Inconsistencies
-- This migration fixes the remaining date columns and audit trail issues

-- ==================================================================================
-- PHASE 2A: BUSINESS DATE COLUMNS (High Priority)
-- ==================================================================================

-- 1. ASSETS.tanggal_beli (Asset management)
-- Impact: Depreciation calculations, asset tracking
ALTER TABLE public.assets 
  ALTER COLUMN tanggal_beli TYPE timestamptz 
  USING tanggal_beli::timestamptz;

COMMENT ON COLUMN public.assets.tanggal_beli IS 'Asset purchase timestamp with timezone for accurate depreciation';

-- 2. DEBT_TRACKING.due_date (Debt management)
-- Impact: Payment reminders, debt tracking accuracy
ALTER TABLE public.debt_tracking 
  ALTER COLUMN due_date TYPE timestamptz 
  USING due_date::timestamptz;

COMMENT ON COLUMN public.debt_tracking.due_date IS 'Debt due timestamp with timezone for accurate payment tracking';

-- 3. PROMOS date fields (Promo management)
-- Impact: Promo activation/deactivation automation
ALTER TABLE public.promos 
  ALTER COLUMN tanggal_mulai TYPE timestamptz 
  USING CASE 
    WHEN tanggal_mulai IS NULL THEN NULL 
    ELSE tanggal_mulai::timestamptz 
  END,
  ALTER COLUMN tanggal_selesai TYPE timestamptz 
  USING CASE 
    WHEN tanggal_selesai IS NULL THEN NULL 
    ELSE tanggal_selesai::timestamptz 
  END;

COMMENT ON COLUMN public.promos.tanggal_mulai IS 'Promo start timestamp with timezone';
COMMENT ON COLUMN public.promos.tanggal_selesai IS 'Promo end timestamp with timezone';

-- ==================================================================================
-- PHASE 2B: INVENTORY & MATERIAL DATE COLUMNS
-- ==================================================================================

-- Handle materialized view dependencies first
DROP MATERIALIZED VIEW IF EXISTS public.pemakaian_bahan_daily_mv CASCADE;

-- 4. BAHAN_BAKU.tanggal_kadaluwarsa (Material expiry)
-- Impact: Expiry alerts, inventory management
ALTER TABLE public.bahan_baku 
  ALTER COLUMN tanggal_kadaluwarsa TYPE timestamptz 
  USING CASE 
    WHEN tanggal_kadaluwarsa IS NULL THEN NULL 
    ELSE tanggal_kadaluwarsa::timestamptz 
  END;

COMMENT ON COLUMN public.bahan_baku.tanggal_kadaluwarsa IS 'Material expiry timestamp with timezone for accurate alerts';

-- 5. PEMAKAIAN_BAHAN.tanggal (Material usage)
-- Impact: Usage tracking, cost allocation
ALTER TABLE public.pemakaian_bahan 
  ALTER COLUMN tanggal TYPE timestamptz 
  USING tanggal::timestamptz;

COMMENT ON COLUMN public.pemakaian_bahan.tanggal IS 'Material usage timestamp with timezone for accurate cost tracking';

-- 6. OPERATIONAL_COSTS.effective_date (Cost effectiveness)
-- Impact: Cost calculations, period-based costing
ALTER TABLE public.operational_costs 
  ALTER COLUMN effective_date TYPE timestamptz 
  USING CASE 
    WHEN effective_date IS NULL THEN NULL 
    ELSE effective_date::timestamptz 
  END;

COMMENT ON COLUMN public.operational_costs.effective_date IS 'Cost effective timestamp with timezone';

-- ==================================================================================
-- PHASE 2C: AUDIT TRAIL FIXES FOR REMAINING TABLES
-- ==================================================================================

-- Fix devices audit trail
UPDATE public.devices 
SET last_active = COALESCE(last_active, now()),
    created_at = COALESCE(created_at, now())
WHERE last_active IS NULL OR created_at IS NULL;

ALTER TABLE public.devices 
  ALTER COLUMN last_active SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL;

-- Fix profit_analysis audit trail
UPDATE public.profit_analysis 
SET calculation_date = COALESCE(calculation_date, now()),
    created_at = COALESCE(created_at, now()),
    updated_at = COALESCE(updated_at, now())
WHERE calculation_date IS NULL OR created_at IS NULL OR updated_at IS NULL;

ALTER TABLE public.profit_analysis 
  ALTER COLUMN calculation_date SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

-- Create auto-update triggers for tables that are frequently updated

-- Devices trigger
CREATE OR REPLACE FUNCTION public.update_devices_last_active()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_active = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS devices_update_last_active ON public.devices;
CREATE TRIGGER devices_update_last_active
    BEFORE UPDATE ON public.devices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_devices_last_active();

-- Profit analysis trigger
CREATE OR REPLACE FUNCTION public.update_profit_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profit_analysis_update_updated_at ON public.profit_analysis;
CREATE TRIGGER profit_analysis_update_updated_at
    BEFORE UPDATE ON public.profit_analysis
    FOR EACH ROW
    EXECUTE FUNCTION public.update_profit_analysis_updated_at();

-- ==================================================================================
-- PHASE 2D: PERFORMANCE INDEXES FOR NEW TIMESTAMP COLUMNS
-- ==================================================================================

-- Asset management indexes
CREATE INDEX IF NOT EXISTS idx_assets_tanggal_beli_user 
ON public.assets (user_id, tanggal_beli DESC);

-- Debt tracking indexes
CREATE INDEX IF NOT EXISTS idx_debt_tracking_due_date_user 
ON public.debt_tracking (user_id, due_date DESC);

CREATE INDEX IF NOT EXISTS idx_debt_tracking_due_date_status 
ON public.debt_tracking (due_date DESC, status, user_id);

-- Promo management indexes
CREATE INDEX IF NOT EXISTS idx_promos_tanggal_user 
ON public.promos (user_id, tanggal_mulai DESC, tanggal_selesai DESC);

-- Material management indexes  
CREATE INDEX IF NOT EXISTS idx_bahan_baku_kadaluwarsa 
ON public.bahan_baku (user_id, tanggal_kadaluwarsa DESC) 
WHERE tanggal_kadaluwarsa IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pemakaian_bahan_tanggal_user 
ON public.pemakaian_bahan (user_id, tanggal DESC);

-- Operational costs indexes
CREATE INDEX IF NOT EXISTS idx_operational_costs_effective_date 
ON public.operational_costs (user_id, effective_date DESC) 
WHERE effective_date IS NOT NULL;

-- ==================================================================================
-- VERIFICATION
-- ==================================================================================

DO $$
BEGIN
    RAISE NOTICE 'PHASE 2 MIGRATION VERIFICATION:';
    
    -- Check critical conversions
    RAISE NOTICE 'Checking assets.tanggal_beli...';
    PERFORM 1 FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'tanggal_beli' AND data_type = 'timestamp with time zone';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to convert assets.tanggal_beli to timestamptz';
    END IF;
    
    RAISE NOTICE 'Checking debt_tracking.due_date...';
    PERFORM 1 FROM information_schema.columns 
    WHERE table_name = 'debt_tracking' AND column_name = 'due_date' AND data_type = 'timestamp with time zone';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to convert debt_tracking.due_date to timestamptz';
    END IF;
    
    RAISE NOTICE 'Checking bahan_baku.tanggal_kadaluwarsa...';
    PERFORM 1 FROM information_schema.columns 
    WHERE table_name = 'bahan_baku' AND column_name = 'tanggal_kadaluwarsa' AND data_type = 'timestamp with time zone';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to convert bahan_baku.tanggal_kadaluwarsa to timestamptz';
    END IF;
    
    RAISE NOTICE 'Phase 2 migration completed successfully!';
END $$;

-- Show summary of all timestamp columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_default IS NULL THEN 'No default'
    WHEN column_default LIKE '%now()%' THEN 'Auto timestamp'
    ELSE 'Custom default'
  END as default_type
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND data_type IN ('timestamp with time zone', 'date')
  AND table_name IN ('assets', 'debt_tracking', 'promos', 'bahan_baku', 'pemakaian_bahan', 'operational_costs')
ORDER BY table_name, column_name;
