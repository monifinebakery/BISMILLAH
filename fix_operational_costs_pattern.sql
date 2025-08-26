-- =====================================
-- ANALISIS MASALAH PATTERN MATCHING ILIKE
-- =====================================

-- MASALAH TERIDENTIFIKASI:
-- Di fungsi get_operational_costs_allocated, menggunakan:
-- CASE WHEN "group" ILIKE '%operasional%' THEN jumlah_per_bulan ELSE 0 END
-- 
-- Tapi di schema, constraint hanya menerima nilai 'HPP' atau 'OPERASIONAL' (uppercase).
-- Pattern '%operasional%' (lowercase) tidak akan match dengan 'OPERASIONAL' (uppercase).

-- =====================================
-- TEST PATTERN MATCHING ISSUE
-- =====================================

-- Test dengan data sample
SELECT 
  'OPERASIONAL' as group_value,
  'OPERASIONAL' ILIKE '%operasional%' as ilike_lowercase, -- FALSE!
  'OPERASIONAL' ILIKE '%OPERASIONAL%' as ilike_uppercase, -- TRUE
  'OPERASIONAL' ILIKE '%Operasional%' as ilike_mixed, -- FALSE!
  LOWER('OPERASIONAL') LIKE '%operasional%' as lower_match; -- TRUE

-- Result: ilike_lowercase = FALSE, yang menyebabkan SUM = 0!

-- =====================================
-- SOLUSI 1: PERBAIKI FUNGSI get_operational_costs_allocated
-- =====================================

CREATE OR REPLACE FUNCTION get_operational_costs_allocated(
  p_user_id uuid,
  p_days_in_period integer DEFAULT 30
)
RETURNS TABLE(
  total_monthly_costs numeric,
  total_daily_costs numeric,
  fixed_costs numeric,
  variable_costs numeric,
  hpp_costs numeric,
  operational_costs_only numeric,
  cost_breakdown jsonb
) AS $$
DECLARE
  v_total_monthly numeric := 0;
  v_fixed numeric := 0;
  v_variable numeric := 0;
  v_hpp numeric := 0;
  v_operational numeric := 0;
  v_breakdown jsonb;
BEGIN
  -- Calculate totals - FIXED: Gunakan UPPER() untuk case-insensitive matching
  SELECT 
    COALESCE(SUM(jumlah_per_bulan), 0) as total,
    COALESCE(SUM(CASE WHEN jenis = 'tetap' THEN jumlah_per_bulan ELSE 0 END), 0) as fixed,
    COALESCE(SUM(CASE WHEN jenis = 'variabel' THEN jumlah_per_bulan ELSE 0 END), 0) as variable,
    -- FIXED: Gunakan UPPER() atau exact match
    COALESCE(SUM(CASE WHEN UPPER("group") = 'HPP' THEN jumlah_per_bulan ELSE 0 END), 0) as hpp,
    COALESCE(SUM(CASE WHEN UPPER("group") = 'OPERASIONAL' THEN jumlah_per_bulan ELSE 0 END), 0) as ops
  INTO v_total_monthly, v_fixed, v_variable, v_hpp, v_operational
  FROM operational_costs
  WHERE user_id = p_user_id
    AND status = 'aktif';
  
  -- Get breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'nama_biaya', nama_biaya,
      'jumlah_per_bulan', jumlah_per_bulan,
      'jumlah_per_hari', ROUND(jumlah_per_bulan * p_days_in_period / 30.0, 2),
      'jenis', jenis,
      'group', "group",
      'cost_category', cost_category,
      'percentage', CASE WHEN v_total_monthly > 0 THEN ROUND((jumlah_per_bulan / v_total_monthly) * 100, 2) ELSE 0 END
    )
  )
  INTO v_breakdown
  FROM operational_costs
  WHERE user_id = p_user_id
    AND status = 'aktif'
  ORDER BY jumlah_per_bulan DESC;
  
  RETURN QUERY SELECT 
    v_total_monthly,
    ROUND(v_total_monthly * p_days_in_period / 30.0, 2),
    v_fixed,
    v_variable,
    v_hpp,
    v_operational,
    COALESCE(v_breakdown, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- SOLUSI 2: PERBAIKI FUNGSI calculate_comprehensive_profit
-- =====================================

-- Update bagian yang menggunakan ILIKE pattern juga
CREATE OR REPLACE FUNCTION calculate_comprehensive_profit(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE(
  -- Revenue
  total_revenue numeric,
  revenue_from_transactions numeric,
  revenue_from_orders numeric,
  
  -- COGS
  total_cogs numeric,
  cogs_from_transactions numeric,
  cogs_from_materials numeric,
  cogs_from_recipes numeric,
  
  -- OpEx
  total_opex numeric,
  opex_from_transactions numeric,
  opex_from_operational_costs numeric,
  
  -- Profit
  gross_profit numeric,
  net_profit numeric,
  gross_margin_pct numeric,
  net_margin_pct numeric,
  
  -- Breakdowns
  revenue_breakdown jsonb,
  cogs_breakdown jsonb,
  opex_breakdown jsonb,
  
  -- Additional insights
  order_stats jsonb,
  material_alerts jsonb,
  cost_efficiency_score numeric
) AS $$
DECLARE
  v_days_period integer;
  v_revenue_trx numeric := 0;
  v_revenue_orders numeric := 0;
  v_total_revenue numeric := 0;
  v_cogs_trx numeric := 0;
  v_cogs_materials numeric := 0;
  v_total_cogs numeric := 0;
  v_opex_trx numeric := 0;
  v_opex_ops numeric := 0;
  v_total_opex numeric := 0;
  v_revenue_breakdown jsonb;
  v_cogs_breakdown jsonb;
  v_opex_breakdown jsonb;
  v_order_stats jsonb;
  v_material_alerts jsonb;
  v_efficiency_score numeric := 0;
BEGIN
  v_days_period := p_end_date - p_start_date + 1;
  
  -- 1. Get revenue data
  SELECT total_revenue, revenue_breakdown
  INTO v_revenue_trx, v_revenue_breakdown
  FROM get_revenue_by_period(p_user_id, p_start_date, p_end_date);
  
  SELECT total_sales
  INTO v_revenue_orders
  FROM get_sales_from_orders(p_user_id, p_start_date, p_end_date);
  
  v_total_revenue := GREATEST(v_revenue_trx, v_revenue_orders);
  
  -- 2. Get COGS data
  SELECT cogs_total
  INTO v_cogs_trx
  FROM get_expenses_by_period(p_user_id, p_start_date, p_end_date);
  
  SELECT wac_based_cost, material_breakdown, low_stock_alerts
  INTO v_cogs_materials, v_cogs_breakdown, v_material_alerts
  FROM calculate_material_costs_wac(p_user_id, p_start_date, p_end_date);
  
  -- Use transaction COGS if available, otherwise use material costs
  v_total_cogs := CASE 
    WHEN v_cogs_trx > 0 THEN v_cogs_trx 
    ELSE v_cogs_materials * 0.3 -- Estimate 30% material usage per period
  END;
  
  -- 3. Get OpEx data
  SELECT opex_total
  INTO v_opex_trx
  FROM get_expenses_by_period(p_user_id, p_start_date, p_end_date);
  
  -- FIXED: Gunakan fungsi yang sudah diperbaiki
  SELECT total_daily_costs, cost_breakdown
  INTO v_opex_ops, v_opex_breakdown
  FROM get_operational_costs_allocated(p_user_id, v_days_period);
  
  v_total_opex := v_opex_trx + v_opex_ops;
  
  -- 4. Get order statistics
  SELECT jsonb_build_object(
    'total_sales', total_sales,
    'completed_orders', completed_orders,
    'pending_orders', pending_orders,
    'average_order_value', average_order_value,
    'sales_breakdown', sales_breakdown
  )
  INTO v_order_stats
  FROM get_sales_from_orders(p_user_id, p_start_date, p_end_date);
  
  -- 5. Calculate efficiency score (0-100)
  v_efficiency_score := CASE
    WHEN v_total_revenue > 0 THEN
      LEAST(100, 
        -- Revenue efficiency (40 points max)
        LEAST(40, (v_total_revenue / 1000000) * 40) +
        -- COGS efficiency (30 points max) - lower COGS ratio is better
        LEAST(30, 30 - ((v_total_cogs / GREATEST(v_total_revenue, 1)) * 50)) +
        -- OpEx efficiency (30 points max) - lower OpEx ratio is better
        LEAST(30, 30 - ((v_total_opex / GREATEST(v_total_revenue, 1)) * 60))
      )
    ELSE 0
  END;
  
  RETURN QUERY SELECT
    -- Revenue
    v_total_revenue,
    v_revenue_trx,
    v_revenue_orders,
    
    -- COGS
    v_total_cogs,
    v_cogs_trx,
    v_cogs_materials,
    0::numeric, -- cogs_from_recipes (would need recipe usage data)
    
    -- OpEx
    v_total_opex,
    v_opex_trx,
    v_opex_ops,
    
    -- Profit
    v_total_revenue - v_total_cogs, -- gross_profit
    v_total_revenue - v_total_cogs - v_total_opex, -- net_profit
    CASE WHEN v_total_revenue > 0 THEN ((v_total_revenue - v_total_cogs) / v_total_revenue) * 100 ELSE 0 END, -- gross_margin_pct
    CASE WHEN v_total_revenue > 0 THEN ((v_total_revenue - v_total_cogs - v_total_opex) / v_total_revenue) * 100 ELSE 0 END, -- net_margin_pct
    
    -- Breakdowns
    COALESCE(v_revenue_breakdown, '[]'::jsonb),
    COALESCE(v_cogs_breakdown, '[]'::jsonb),
    COALESCE(v_opex_breakdown, '[]'::jsonb),
    
    -- Additional insights
    COALESCE(v_order_stats, '{}'::jsonb),
    COALESCE(v_material_alerts, '[]'::jsonb),
    v_efficiency_score;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- SOLUSI 3: TEST SEBELUM DAN SESUDAH PERBAIKAN
-- =====================================

-- Test dengan user_id yang ada
WITH test_user AS (
  SELECT user_id 
  FROM operational_costs 
  WHERE status = 'aktif' 
  LIMIT 1
)
SELECT 
  'Before Fix - Old Pattern' as test_name,
  tu.user_id,
  -- Test pattern lama (akan return 0)
  SUM(CASE WHEN oc."group" ILIKE '%operasional%' THEN oc.jumlah_per_bulan ELSE 0 END) as old_pattern_result,
  -- Test pattern baru (akan return nilai yang benar)
  SUM(CASE WHEN UPPER(oc."group") = 'OPERASIONAL' THEN oc.jumlah_per_bulan ELSE 0 END) as new_pattern_result,
  -- Raw data untuk referensi
  COUNT(*) as total_records,
  SUM(oc.jumlah_per_bulan) as total_amount
FROM test_user tu
JOIN operational_costs oc ON oc.user_id = tu.user_id
WHERE oc.status = 'aktif'
GROUP BY tu.user_id;

-- =====================================
-- SOLUSI 4: ALTERNATIF QUICK FIX (JIKA TIDAK BISA UPDATE FUNGSI)
-- =====================================

-- Jika tidak bisa update fungsi, bisa update data agar cocok dengan pattern:
/*
-- Option A: Update semua 'OPERASIONAL' menjadi 'operasional' (lowercase)  
UPDATE operational_costs 
SET "group" = 'operasional'
WHERE "group" = 'OPERASIONAL';

-- Option B: Update semua 'HPP' menjadi 'hpp' (lowercase)
UPDATE operational_costs 
SET "group" = 'hpp' 
WHERE "group" = 'HPP';

-- Tapi ini tidak recommended karena melanggar constraint!
-- Constraint: "group" = any (array['HPP'::text, 'OPERASIONAL'::text])
*/

-- =====================================
-- VERIFIKASI SOLUSI
-- =====================================

-- Test fungsi yang sudah diperbaiki
WITH test_user AS (
  SELECT user_id 
  FROM operational_costs 
  WHERE status = 'aktif' 
  LIMIT 1
)
SELECT 
  'After Fix Test' as test_name,
  tu.user_id,
  opc.*
FROM test_user tu
CROSS JOIN get_operational_costs_allocated(tu.user_id) opc;

-- Expected: operational_costs_only > 0 (bukan 0 lagi!)

-- =====================================
-- KOMENTAR PENTING
-- =====================================

/*
ROOT CAUSE: 
Fungsi menggunakan ILIKE '%operasional%' tapi data di database adalah 'OPERASIONAL' (uppercase).
PostgreSQL ILIKE adalah case-insensitive untuk character, tapi 'OPERASIONAL' tidak mengandung 
substring 'operasional' karena beda case.

SOLUSI YANG BENAR:
1. Ganti ILIKE '%operasional%' dengan UPPER("group") = 'OPERASIONAL' 
2. Atau ganti dengan "group" = 'OPERASIONAL' (exact match)
3. Atau gunakan LOWER("group") LIKE '%operasional%'

LESSON LEARNED:
Selalu pastikan pattern matching sesuai dengan data yang ada di database.
*/
