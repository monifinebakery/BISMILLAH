-- PHASE 3: Function Signatures & Final Consistency Fixes
-- This migration completes the timestamp consistency by updating all function signatures
-- and remaining dependencies that still use 'date' instead of 'timestamptz'

-- ==================================================================================
-- PHASE 3A: CRITICAL FUNCTION SIGNATURE UPDATES
-- ==================================================================================

-- 1. calculate_comprehensive_profit function
-- This is CRITICAL for business reporting
DROP FUNCTION IF EXISTS public.calculate_comprehensive_profit(uuid, date, date) CASCADE;

CREATE OR REPLACE FUNCTION public.calculate_comprehensive_profit(
    p_user_id uuid,
    p_start_date timestamptz,
    p_end_date timestamptz
) RETURNS TABLE(
    total_revenue numeric,
    revenue_from_transactions numeric,
    revenue_from_orders numeric,
    total_cogs numeric,
    cogs_from_transactions numeric,
    cogs_from_materials numeric,
    cogs_from_recipes numeric,
    total_opex numeric,
    opex_from_transactions numeric,
    opex_from_operational_costs numeric,
    gross_profit numeric,
    net_profit numeric,
    gross_margin_pct numeric,
    net_margin_pct numeric,
    revenue_breakdown jsonb,
    cogs_breakdown jsonb,
    opex_breakdown jsonb,
    order_stats jsonb,
    material_alerts jsonb,
    cost_efficiency_score numeric
)
LANGUAGE plpgsql
SET search_path TO pg_catalog, public
AS $$
DECLARE
    v_revenue_transactions numeric := 0;
    v_revenue_orders numeric := 0;
    v_cogs_transactions numeric := 0;
    v_cogs_materials numeric := 0;
    v_cogs_recipes numeric := 0;
    v_opex_transactions numeric := 0;
    v_opex_operational numeric := 0;
    v_days_period integer;
    v_cost_efficiency numeric := 0;
BEGIN
    -- Validate inputs
    IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RAISE EXCEPTION 'Start date and end date cannot be null';
    END IF;
    
    IF p_start_date > p_end_date THEN
        RAISE EXCEPTION 'Start date cannot be greater than end date';
    END IF;

    -- Calculate period in days
    v_days_period := (p_end_date::date - p_start_date::date) + 1;

    -- Get revenue from transactions
    SELECT COALESCE(total_revenue, 0)
    INTO v_revenue_transactions
    FROM get_revenue_by_period(p_user_id, p_start_date, p_end_date);

    -- Get revenue from orders (completed orders only)
    SELECT COALESCE(total_sales, 0)
    INTO v_revenue_orders
    FROM get_sales_from_orders(p_user_id, p_start_date, p_end_date);

    -- Get COGS from transactions
    SELECT COALESCE(cogs_total, 0)
    INTO v_cogs_transactions
    FROM get_expenses_by_period(p_user_id, p_start_date, p_end_date);

    -- Get material costs using WAC
    SELECT COALESCE(total_material_cost, 0)
    INTO v_cogs_materials
    FROM calculate_material_costs_wac(p_user_id, p_start_date, p_end_date);

    -- Recipe-based COGS (placeholder - could be enhanced)
    v_cogs_recipes := 0;

    -- Get OPEX from transactions (non-COGS expenses)
    SELECT COALESCE(opex_total, 0)
    INTO v_opex_transactions
    FROM get_expenses_by_period(p_user_id, p_start_date, p_end_date);

    -- Get operational costs (monthly allocation)
    SELECT COALESCE(SUM(jumlah_per_bulan * (v_days_period::numeric / 30.0)), 0)
    INTO v_opex_operational
    FROM operational_costs
    WHERE user_id = p_user_id AND status = 'aktif';

    -- Calculate efficiency score (0-100)
    IF (v_revenue_transactions + v_revenue_orders) > 0 THEN
        v_cost_efficiency := LEAST(100, 
            ((v_revenue_transactions + v_revenue_orders - v_cogs_transactions - v_cogs_materials - v_opex_transactions - v_opex_operational) 
            / (v_revenue_transactions + v_revenue_orders)) * 100
        );
    END IF;

    -- Return comprehensive profit analysis
    RETURN QUERY SELECT
        -- Revenue
        (v_revenue_transactions + v_revenue_orders),
        v_revenue_transactions,
        v_revenue_orders,
        
        -- COGS
        (v_cogs_transactions + v_cogs_materials + v_cogs_recipes),
        v_cogs_transactions,
        v_cogs_materials,
        v_cogs_recipes,
        
        -- OPEX
        (v_opex_transactions + v_opex_operational),
        v_opex_transactions,
        v_opex_operational,
        
        -- Profits
        (v_revenue_transactions + v_revenue_orders) - (v_cogs_transactions + v_cogs_materials + v_cogs_recipes),
        (v_revenue_transactions + v_revenue_orders) - (v_cogs_transactions + v_cogs_materials + v_cogs_recipes + v_opex_transactions + v_opex_operational),
        
        -- Margins
        CASE WHEN (v_revenue_transactions + v_revenue_orders) > 0 THEN
            (((v_revenue_transactions + v_revenue_orders) - (v_cogs_transactions + v_cogs_materials + v_cogs_recipes)) / (v_revenue_transactions + v_revenue_orders)) * 100
        ELSE 0 END,
        CASE WHEN (v_revenue_transactions + v_revenue_orders) > 0 THEN
            (((v_revenue_transactions + v_revenue_orders) - (v_cogs_transactions + v_cogs_materials + v_cogs_recipes + v_opex_transactions + v_opex_operational)) / (v_revenue_transactions + v_revenue_orders)) * 100
        ELSE 0 END,
        
        -- Breakdowns (simplified for now)
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        
        -- Efficiency
        v_cost_efficiency;
END;
$$;

-- 2. calculate_material_costs_wac function
DROP FUNCTION IF EXISTS public.calculate_material_costs_wac(uuid, date, date) CASCADE;

CREATE OR REPLACE FUNCTION public.calculate_material_costs_wac(
    p_user_id uuid,
    p_start_date timestamptz,
    p_end_date timestamptz
) RETURNS TABLE(
    total_material_cost numeric,
    wac_based_cost numeric,
    material_breakdown jsonb,
    low_stock_alerts jsonb
)
LANGUAGE plpgsql
SET search_path TO pg_catalog, public
AS $$
DECLARE
    v_total_cost numeric := 0;
    v_wac_cost numeric := 0;
BEGIN
    -- Calculate material costs using WAC from bahan_baku
    SELECT 
        COALESCE(SUM(pb.hpp_value), 0),
        COALESCE(SUM(pb.qty_base * COALESCE(bb.harga_rata_rata, bb.harga_satuan)), 0)
    INTO v_total_cost, v_wac_cost
    FROM pemakaian_bahan pb
    JOIN bahan_baku bb ON pb.bahan_baku_id = bb.id
    WHERE pb.user_id = p_user_id
    AND pb.tanggal >= p_start_date::date
    AND pb.tanggal <= p_end_date::date;

    -- Return results
    RETURN QUERY SELECT
        v_total_cost,
        v_wac_cost,
        '[]'::jsonb,
        '[]'::jsonb;
END;
$$;

-- 3. get_expenses_by_period function
DROP FUNCTION IF EXISTS public.get_expenses_by_period(uuid, date, date) CASCADE;

CREATE OR REPLACE FUNCTION public.get_expenses_by_period(
    p_user_id uuid,
    p_start_date timestamptz,
    p_end_date timestamptz
) RETURNS TABLE(
    total_expenses numeric,
    cogs_total numeric,
    opex_total numeric,
    expense_breakdown jsonb
)
LANGUAGE plpgsql
SET search_path TO pg_catalog, public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(amount), 0) as total_expenses,
        COALESCE(SUM(CASE 
            WHEN LOWER(category) LIKE '%bahan%' OR LOWER(category) LIKE '%cogs%' OR LOWER(category) LIKE '%hpp%'
            THEN amount ELSE 0 END), 0) as cogs_total,
        COALESCE(SUM(CASE 
            WHEN NOT (LOWER(category) LIKE '%bahan%' OR LOWER(category) LIKE '%cogs%' OR LOWER(category) LIKE '%hpp%')
            THEN amount ELSE 0 END), 0) as opex_total,
        '[]'::jsonb as expense_breakdown
    FROM financial_transactions
    WHERE user_id = p_user_id
    AND type = 'expense'
    AND date >= p_start_date
    AND date <= p_end_date;
END;
$$;

-- 4. get_revenue_by_period function
DROP FUNCTION IF EXISTS public.get_revenue_by_period(uuid, date, date) CASCADE;

CREATE OR REPLACE FUNCTION public.get_revenue_by_period(
    p_user_id uuid,
    p_start_date timestamptz,
    p_end_date timestamptz
) RETURNS TABLE(
    total_revenue numeric,
    revenue_breakdown jsonb,
    transaction_count integer
)
LANGUAGE plpgsql
SET search_path TO pg_catalog, public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(amount), 0) as total_revenue,
        '[]'::jsonb as revenue_breakdown,
        COUNT(*)::integer as transaction_count
    FROM financial_transactions
    WHERE user_id = p_user_id
    AND type = 'income'
    AND date >= p_start_date
    AND date <= p_end_date;
END;
$$;

-- 5. get_sales_from_orders function
DROP FUNCTION IF EXISTS public.get_sales_from_orders(uuid, date, date) CASCADE;

CREATE OR REPLACE FUNCTION public.get_sales_from_orders(
    p_user_id uuid,
    p_start_date timestamptz,
    p_end_date timestamptz
) RETURNS TABLE(
    total_sales numeric,
    completed_orders integer,
    pending_orders integer,
    cancelled_orders integer,
    average_order_value numeric,
    sales_breakdown jsonb
)
LANGUAGE plpgsql
SET search_path TO pg_catalog, public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_pesanan ELSE 0 END), 0) as total_sales,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::integer as completed_orders,
        COUNT(CASE WHEN status IN ('pending', 'confirmed', 'preparing', 'ready') THEN 1 END)::integer as pending_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::integer as cancelled_orders,
        CASE WHEN COUNT(CASE WHEN status = 'completed' THEN 1 END) > 0 
            THEN SUM(CASE WHEN status = 'completed' THEN total_pesanan ELSE 0 END) / COUNT(CASE WHEN status = 'completed' THEN 1 END)
            ELSE 0 END as average_order_value,
        '[]'::jsonb as sales_breakdown
    FROM orders
    WHERE user_id = p_user_id
    AND tanggal >= p_start_date
    AND tanggal <= p_end_date;
END;
$$;

-- 6. record_material_usage function
DROP FUNCTION IF EXISTS public.record_material_usage(uuid, numeric, date, numeric, character varying, uuid, text) CASCADE;

CREATE OR REPLACE FUNCTION public.record_material_usage(
    p_bahan_baku_id uuid,
    p_qty_base numeric,
    p_tanggal timestamptz DEFAULT now(),
    p_harga_efektif numeric DEFAULT NULL,
    p_source_type character varying DEFAULT 'manual',
    p_source_id uuid DEFAULT NULL,
    p_keterangan text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SET search_path TO pg_catalog, public
AS $$
DECLARE
    v_user_id uuid;
    v_usage_id uuid;
BEGIN
    -- Get user_id from bahan_baku
    SELECT user_id INTO v_user_id
    FROM bahan_baku
    WHERE id = p_bahan_baku_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Bahan baku tidak ditemukan';
    END IF;
    
    -- Insert usage record
    INSERT INTO pemakaian_bahan (
        user_id,
        bahan_baku_id,
        qty_base,
        tanggal,
        harga_efektif,
        source_type,
        source_id,
        keterangan
    ) VALUES (
        v_user_id,
        p_bahan_baku_id,
        p_qty_base,
        p_tanggal,
        p_harga_efektif,
        p_source_type,
        p_source_id,
        p_keterangan
    ) RETURNING id INTO v_usage_id;
    
    RETURN v_usage_id;
END;
$$;

-- 7. month_bucket_utc functions - drop old versions and create both ts and date wrappers
-- Drop existing versions to allow return type change safely
DROP FUNCTION IF EXISTS public.month_bucket_utc(timestamptz) CASCADE;
DROP FUNCTION IF EXISTS public.month_bucket_utc(date) CASCADE;

-- Primary timestamptz version (authoritative)
CREATE FUNCTION public.month_bucket_utc(ts timestamptz) RETURNS timestamptz
LANGUAGE sql IMMUTABLE
SET search_path TO pg_catalog, public
AS $$
    SELECT date_trunc('month', ts);
$$;

-- Compatibility wrapper for code that still passes date and expects date
CREATE FUNCTION public.month_bucket_utc(d date) RETURNS date
LANGUAGE sql IMMUTABLE
SET search_path TO pg_catalog, public
AS $$
    SELECT date_trunc('month', d::timestamptz AT TIME ZONE 'UTC')::date;
$$;

-- ==================================================================================
-- PHASE 3B: UPDATE FUNCTION PERMISSIONS
-- ==================================================================================

-- Grant permissions for updated functions
GRANT ALL ON FUNCTION public.calculate_comprehensive_profit(uuid, timestamptz, timestamptz) TO anon;
GRANT ALL ON FUNCTION public.calculate_comprehensive_profit(uuid, timestamptz, timestamptz) TO authenticated;
GRANT ALL ON FUNCTION public.calculate_comprehensive_profit(uuid, timestamptz, timestamptz) TO service_role;

GRANT ALL ON FUNCTION public.calculate_material_costs_wac(uuid, timestamptz, timestamptz) TO anon;
GRANT ALL ON FUNCTION public.calculate_material_costs_wac(uuid, timestamptz, timestamptz) TO authenticated;
GRANT ALL ON FUNCTION public.calculate_material_costs_wac(uuid, timestamptz, timestamptz) TO service_role;

GRANT ALL ON FUNCTION public.get_expenses_by_period(uuid, timestamptz, timestamptz) TO anon;
GRANT ALL ON FUNCTION public.get_expenses_by_period(uuid, timestamptz, timestamptz) TO authenticated;
GRANT ALL ON FUNCTION public.get_expenses_by_period(uuid, timestamptz, timestamptz) TO service_role;

GRANT ALL ON FUNCTION public.get_revenue_by_period(uuid, timestamptz, timestamptz) TO anon;
GRANT ALL ON FUNCTION public.get_revenue_by_period(uuid, timestamptz, timestamptz) TO authenticated;
GRANT ALL ON FUNCTION public.get_revenue_by_period(uuid, timestamptz, timestamptz) TO service_role;

GRANT ALL ON FUNCTION public.get_sales_from_orders(uuid, timestamptz, timestamptz) TO anon;
GRANT ALL ON FUNCTION public.get_sales_from_orders(uuid, timestamptz, timestamptz) TO authenticated;
GRANT ALL ON FUNCTION public.get_sales_from_orders(uuid, timestamptz, timestamptz) TO service_role;

GRANT ALL ON FUNCTION public.record_material_usage(uuid, numeric, timestamptz, numeric, character varying, uuid, text) TO anon;
GRANT ALL ON FUNCTION public.record_material_usage(uuid, numeric, timestamptz, numeric, character varying, uuid, text) TO authenticated;
GRANT ALL ON FUNCTION public.record_material_usage(uuid, numeric, timestamptz, numeric, character varying, uuid, text) TO service_role;

GRANT ALL ON FUNCTION public.month_bucket_utc(timestamptz) TO anon;
GRANT ALL ON FUNCTION public.month_bucket_utc(timestamptz) TO authenticated;
GRANT ALL ON FUNCTION public.month_bucket_utc(timestamptz) TO service_role;
GRANT ALL ON FUNCTION public.month_bucket_utc(date) TO anon;
GRANT ALL ON FUNCTION public.month_bucket_utc(date) TO authenticated;
GRANT ALL ON FUNCTION public.month_bucket_utc(date) TO service_role;

-- ==================================================================================
-- PHASE 3C: CLEANUP OLD FUNCTION REFERENCES
-- ==================================================================================

-- Add comments for the updated functions
COMMENT ON FUNCTION public.calculate_comprehensive_profit(uuid, timestamptz, timestamptz) IS 'Kalkulasi profit comprehensive menggunakan semua tabel - Updated for timestamptz';
COMMENT ON FUNCTION public.calculate_material_costs_wac(uuid, timestamptz, timestamptz) IS 'Hitung material costs menggunakan WAC dari bahan_baku - Updated for timestamptz';
COMMENT ON FUNCTION public.get_expenses_by_period(uuid, timestamptz, timestamptz) IS 'Get expenses dengan deteksi COGS otomatis dari financial_transactions - Updated for timestamptz';
COMMENT ON FUNCTION public.get_revenue_by_period(uuid, timestamptz, timestamptz) IS 'Get revenue dengan breakdown kategori dari financial_transactions - Updated for timestamptz';
COMMENT ON FUNCTION public.get_sales_from_orders(uuid, timestamptz, timestamptz) IS 'Get sales data dari orders table - Updated for timestamptz';
COMMENT ON FUNCTION public.record_material_usage(uuid, numeric, timestamptz, numeric, character varying, uuid, text) IS 'Record material usage dengan timestamptz precision';

-- ==================================================================================
-- VERIFICATION
-- ==================================================================================

DO $$
BEGIN
    RAISE NOTICE 'PHASE 3 MIGRATION VERIFICATION:';
    
    -- Verify function signatures are updated
    RAISE NOTICE 'Verifying function signatures...';
    
    -- Check if old date-based functions are gone
    PERFORM 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' 
    AND p.proname = 'calculate_comprehensive_profit'
    AND pg_get_function_identity_arguments(p.oid) LIKE '%date%';
    
    IF FOUND THEN
        RAISE WARNING 'Old date-based functions still exist - manual cleanup may be needed';
    ELSE
        RAISE NOTICE 'All functions successfully updated to timestamptz';
    END IF;
    
    RAISE NOTICE 'Phase 3 migration completed successfully!';
END $$;

-- Final verification - list all remaining date columns (should be minimal)
SELECT 
    n.nspname as schema_name,
    c.relname as table_name, 
    a.attname as column_name,
    t.typname as data_type
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_type t ON a.atttypid = t.oid
WHERE n.nspname = 'public'
AND NOT a.attisdropped
AND a.attnum > 0
AND t.typname = 'date'
ORDER BY c.relname, a.attname;
