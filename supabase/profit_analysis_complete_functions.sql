-- =====================================
-- COMPLETE PROFIT ANALYSIS FUNCTIONS
-- Functions untuk semua tabel existing yang berhubungan dengan profit analysis
-- =====================================

-- =====================================
-- 1. FINANCIAL TRANSACTIONS FUNCTIONS
-- =====================================

-- Function untuk get revenue per period
CREATE OR REPLACE FUNCTION get_revenue_by_period(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE(
  total_revenue numeric,
  revenue_breakdown jsonb,
  transaction_count integer
) AS $$
DECLARE
  v_revenue numeric := 0;
  v_breakdown jsonb;
  v_count integer := 0;
BEGIN
  -- Get total revenue
  SELECT COALESCE(SUM(amount), 0), COUNT(*)
  INTO v_revenue, v_count
  FROM financial_transactions
  WHERE user_id = p_user_id
    AND type = 'income'
    AND date BETWEEN p_start_date AND p_end_date;
  
  -- Get breakdown by category
  SELECT jsonb_agg(
    jsonb_build_object(
      'category', COALESCE(category, 'Tidak Dikategorikan'),
      'amount', category_total,
      'percentage', CASE WHEN v_revenue > 0 THEN ROUND((category_total / v_revenue) * 100, 2) ELSE 0 END,
      'count', category_count
    )
  )
  INTO v_breakdown
  FROM (
    SELECT 
      COALESCE(category, 'Tidak Dikategorikan') as category,
      SUM(amount) as category_total,
      COUNT(*) as category_count
    FROM financial_transactions
    WHERE user_id = p_user_id
      AND type = 'income'
      AND date BETWEEN p_start_date AND p_end_date
    GROUP BY COALESCE(category, 'Tidak Dikategorikan')
    ORDER BY category_total DESC
  ) breakdown_data;
  
  RETURN QUERY SELECT v_revenue, COALESCE(v_breakdown, '[]'::jsonb), v_count;
END;
$$ LANGUAGE plpgsql;

-- Function untuk get expenses per period dengan COGS detection
CREATE OR REPLACE FUNCTION get_expenses_by_period(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE(
  total_expenses numeric,
  cogs_total numeric,
  opex_total numeric,
  expense_breakdown jsonb
) AS $$
DECLARE
  v_total_expenses numeric := 0;
  v_cogs numeric := 0;
  v_opex numeric := 0;
  v_breakdown jsonb;
BEGIN
  -- Calculate totals
  SELECT 
    COALESCE(SUM(amount), 0) as total,
    COALESCE(SUM(CASE 
      WHEN category ILIKE '%bahan%' OR category ILIKE '%cogs%' OR category ILIKE '%hpp%' OR category ILIKE '%material%'
      THEN amount ELSE 0 
    END), 0) as cogs,
    COALESCE(SUM(CASE 
      WHEN NOT (category ILIKE '%bahan%' OR category ILIKE '%cogs%' OR category ILIKE '%hpp%' OR category ILIKE '%material%')
      THEN amount ELSE 0 
    END), 0) as opex
  INTO v_total_expenses, v_cogs, v_opex
  FROM financial_transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND date BETWEEN p_start_date AND p_end_date;
  
  -- Get breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'category', category_name,
      'type', expense_type,
      'amount', category_total,
      'percentage', CASE WHEN v_total_expenses > 0 THEN ROUND((category_total / v_total_expenses) * 100, 2) ELSE 0 END,
      'count', category_count
    )
  )
  INTO v_breakdown
  FROM (
    SELECT 
      COALESCE(category, 'Tidak Dikategorikan') as category_name,
      CASE 
        WHEN category ILIKE '%bahan%' OR category ILIKE '%cogs%' OR category ILIKE '%hpp%' OR category ILIKE '%material%'
        THEN 'COGS'
        ELSE 'Operating Expense'
      END as expense_type,
      SUM(amount) as category_total,
      COUNT(*) as category_count
    FROM financial_transactions
    WHERE user_id = p_user_id
      AND type = 'expense'
      AND date BETWEEN p_start_date AND p_end_date
    GROUP BY COALESCE(category, 'Tidak Dikategorikan')
    ORDER BY category_total DESC
  ) breakdown_data;
  
  RETURN QUERY SELECT v_total_expenses, v_cogs, v_opex, COALESCE(v_breakdown, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 2. BAHAN BAKU (WAREHOUSE) FUNCTIONS
-- =====================================

-- Function untuk calculate material cost dengan WAC
CREATE OR REPLACE FUNCTION calculate_material_costs_wac(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE(
  total_material_cost numeric,
  wac_based_cost numeric,
  material_breakdown jsonb,
  low_stock_alerts jsonb
) AS $$
DECLARE
  v_total_cost numeric := 0;
  v_wac_cost numeric := 0;
  v_breakdown jsonb;
  v_alerts jsonb;
BEGIN
  -- Calculate total material cost using WAC
  SELECT 
    COALESCE(SUM(stok * harga_satuan), 0) as total_cost,
    COALESCE(SUM(stok * COALESCE(harga_rata_rata, harga_satuan)), 0) as wac_cost
  INTO v_total_cost, v_wac_cost
  FROM bahan_baku
  WHERE user_id = p_user_id
    AND status = 'aktif';
  
  -- Get material breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'nama', nama,
      'stok', stok,
      'satuan', satuan,
      'harga_satuan', harga_satuan,
      'harga_wac', COALESCE(harga_rata_rata, harga_satuan),
      'total_value', stok * COALESCE(harga_rata_rata, harga_satuan),
      'kategori', kategori,
      'status_stok', CASE 
        WHEN stok <= minimum THEN 'Menipis'
        WHEN stok <= minimum * 2 THEN 'Perhatian'
        ELSE 'Aman'
      END
    )
  )
  INTO v_breakdown
  FROM bahan_baku
  WHERE user_id = p_user_id
    AND status = 'aktif'
  ORDER BY (stok * COALESCE(harga_rata_rata, harga_satuan)) DESC;
  
  -- Get low stock alerts
  SELECT jsonb_agg(
    jsonb_build_object(
      'nama', nama,
      'stok_sekarang', stok,
      'minimum', minimum,
      'satuan', satuan,
      'perlu_beli', GREATEST(minimum * 2 - stok, 0),
      'kategori', kategori
    )
  )
  INTO v_alerts
  FROM bahan_baku
  WHERE user_id = p_user_id
    AND status = 'aktif'
    AND stok <= minimum;
  
  RETURN QUERY SELECT 
    v_total_cost, 
    v_wac_cost, 
    COALESCE(v_breakdown, '[]'::jsonb),
    COALESCE(v_alerts, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Function untuk update WAC price
CREATE OR REPLACE FUNCTION update_wac_price(
  p_user_id uuid,
  p_bahan_id uuid,
  p_new_qty numeric,
  p_new_price numeric
)
RETURNS TABLE(
  success boolean,
  old_wac numeric,
  new_wac numeric,
  new_stock numeric
) AS $$
DECLARE
  v_current_stock numeric;
  v_current_wac numeric;
  v_new_wac numeric;
  v_new_stock numeric;
BEGIN
  -- Get current data
  SELECT stok, COALESCE(harga_rata_rata, harga_satuan)
  INTO v_current_stock, v_current_wac
  FROM bahan_baku
  WHERE id = p_bahan_id AND user_id = p_user_id;
  
  IF v_current_stock IS NULL THEN
    RETURN QUERY SELECT false, 0::numeric, 0::numeric, 0::numeric;
    RETURN;
  END IF;
  
  -- Calculate new WAC
  IF v_current_stock = 0 THEN
    v_new_wac := p_new_price;
  ELSE
    v_new_wac := ((v_current_stock * v_current_wac) + (p_new_qty * p_new_price)) / (v_current_stock + p_new_qty);
  END IF;
  
  v_new_stock := v_current_stock + p_new_qty;
  
  -- Update bahan baku
  UPDATE bahan_baku 
  SET 
    stok = v_new_stock,
    harga_rata_rata = v_new_wac,
    updated_at = now()
  WHERE id = p_bahan_id AND user_id = p_user_id;
  
  RETURN QUERY SELECT true, v_current_wac, v_new_wac, v_new_stock;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 3. OPERATIONAL COSTS FUNCTIONS
-- =====================================

-- Function untuk get operational costs dengan cost allocation
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
  -- Calculate totals
  SELECT 
    COALESCE(SUM(jumlah_per_bulan), 0) as total,
    COALESCE(SUM(CASE WHEN jenis = 'tetap' THEN jumlah_per_bulan ELSE 0 END), 0) as fixed,
    COALESCE(SUM(CASE WHEN jenis = 'variabel' THEN jumlah_per_bulan ELSE 0 END), 0) as variable,
    COALESCE(SUM(CASE WHEN "group" ILIKE '%hpp%' THEN jumlah_per_bulan ELSE 0 END), 0) as hpp,
    COALESCE(SUM(CASE WHEN "group" ILIKE '%operasional%' THEN jumlah_per_bulan ELSE 0 END), 0) as ops
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
-- 4. HPP RECIPES FUNCTIONS
-- =====================================

-- Function untuk calculate recipe cost dengan WAC integration
CREATE OR REPLACE FUNCTION calculate_recipe_cost_with_wac(
  p_user_id uuid,
  p_recipe_id uuid
)
RETURNS TABLE(
  recipe_name text,
  total_hpp numeric,
  hpp_per_porsi numeric,
  material_cost numeric,
  labor_cost numeric,
  overhead_cost numeric,
  suggested_price numeric,
  margin_percentage numeric,
  cost_breakdown jsonb
) AS $$
DECLARE
  v_recipe record;
  v_material_cost numeric := 0;
  v_total_hpp numeric := 0;
  v_suggested_price numeric := 0;
  v_breakdown jsonb;
BEGIN
  -- Get recipe data
  SELECT * INTO v_recipe
  FROM hpp_recipes
  WHERE id = p_recipe_id AND user_id = p_user_id;
  
  IF v_recipe IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate material costs using WAC
  SELECT COALESCE(SUM(
    CASE 
      WHEN bb.harga_rata_rata IS NOT NULL AND bb.harga_rata_rata > 0 
      THEN bb.harga_rata_rata * (ingredient->>'qty')::numeric
      ELSE bb.harga_satuan * (ingredient->>'qty')::numeric
    END
  ), 0)
  INTO v_material_cost
  FROM jsonb_array_elements(v_recipe.ingredients) as ingredient
  JOIN bahan_baku bb ON bb.id = (ingredient->>'bahan_baku_id')::uuid
  WHERE bb.user_id = p_user_id AND bb.status = 'aktif';
  
  -- Get cost breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'bahan_nama', bb.nama,
      'qty', (ingredient->>'qty')::numeric,
      'satuan', bb.satuan,
      'harga_satuan', bb.harga_satuan,
      'harga_wac', COALESCE(bb.harga_rata_rata, bb.harga_satuan),
      'total_cost', COALESCE(bb.harga_rata_rata, bb.harga_satuan) * (ingredient->>'qty')::numeric
    )
  )
  INTO v_breakdown
  FROM jsonb_array_elements(v_recipe.ingredients) as ingredient
  JOIN bahan_baku bb ON bb.id = (ingredient->>'bahan_baku_id')::uuid
  WHERE bb.user_id = p_user_id AND bb.status = 'aktif';
  
  -- Calculate total HPP
  v_total_hpp := v_material_cost + 
                 COALESCE(v_recipe.biaya_tenaga_kerja, 0) + 
                 COALESCE(v_recipe.biaya_overhead, 0);
  
  -- Calculate suggested price (with 30% margin)
  v_suggested_price := v_total_hpp * 1.3;
  
  -- Update recipe
  UPDATE hpp_recipes
  SET 
    total_hpp = v_total_hpp,
    hpp_per_porsi = v_total_hpp / GREATEST(v_recipe.porsi, 1),
    updated_at = now()
  WHERE id = p_recipe_id AND user_id = p_user_id;
  
  RETURN QUERY SELECT
    v_recipe.nama_resep,
    v_total_hpp,
    v_total_hpp / GREATEST(v_recipe.porsi, 1),
    v_material_cost,
    COALESCE(v_recipe.biaya_tenaga_kerja, 0),
    COALESCE(v_recipe.biaya_overhead, 0),
    v_suggested_price,
    CASE WHEN v_total_hpp > 0 THEN ((v_suggested_price - v_total_hpp) / v_total_hpp) * 100 ELSE 0 END,
    COALESCE(v_breakdown, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 5. ORDERS INTEGRATION FUNCTIONS
-- =====================================

-- Function untuk get sales data dari orders
CREATE OR REPLACE FUNCTION get_sales_from_orders(
  p_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS TABLE(
  total_sales numeric,
  completed_orders integer,
  pending_orders integer,
  cancelled_orders integer,
  average_order_value numeric,
  sales_breakdown jsonb
) AS $$
DECLARE
  v_total_sales numeric := 0;
  v_completed integer := 0;
  v_pending integer := 0;
  v_cancelled integer := 0;
  v_avg_order numeric := 0;
  v_breakdown jsonb;
BEGIN
  -- Get order statistics
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0),
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::integer,
    COUNT(CASE WHEN status = 'pending' OR status = 'processing' THEN 1 END)::integer,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::integer
  INTO v_total_sales, v_completed, v_pending, v_cancelled
  FROM orders
  WHERE user_id = p_user_id
    AND tanggal_pesanan BETWEEN p_start_date AND p_end_date;
  
  -- Calculate average order value
  v_avg_order := CASE WHEN v_completed > 0 THEN v_total_sales / v_completed ELSE 0 END;
  
  -- Get breakdown by status and payment
  SELECT jsonb_agg(
    jsonb_build_object(
      'status', status,
      'payment_status', payment_status,
      'count', status_count,
      'total_amount', total_amount_by_status,
      'percentage', CASE WHEN v_total_sales > 0 THEN ROUND((total_amount_by_status / v_total_sales) * 100, 2) ELSE 0 END
    )
  )
  INTO v_breakdown
  FROM (
    SELECT 
      status,
      payment_status,
      COUNT(*) as status_count,
      SUM(total_amount) as total_amount_by_status
    FROM orders
    WHERE user_id = p_user_id
      AND tanggal_pesanan BETWEEN p_start_date AND p_end_date
    GROUP BY status, payment_status
    ORDER BY total_amount_by_status DESC
  ) breakdown_data;
  
  RETURN QUERY SELECT 
    v_total_sales, 
    v_completed, 
    v_pending, 
    v_cancelled, 
    v_avg_order,
    COALESCE(v_breakdown, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 6. APP SETTINGS FUNCTIONS
-- =====================================

-- Function untuk get atau create app settings
CREATE OR REPLACE FUNCTION get_or_create_app_settings(p_user_id uuid)
RETURNS TABLE(
  target_produksi_per_bulan numeric,
  overhead_per_pcs numeric,
  operasional_per_pcs numeric,
  settings_exist boolean
) AS $$
DECLARE
  v_settings record;
  v_exists boolean := false;
BEGIN
  -- Try to get existing settings
  SELECT * INTO v_settings
  FROM app_settings
  WHERE user_id = p_user_id;
  
  IF v_settings IS NOT NULL THEN
    v_exists := true;
  ELSE
    -- Create default settings
    INSERT INTO app_settings (user_id, target_produksi_per_bulan, overhead_per_pcs, operasional_per_pcs)
    VALUES (p_user_id, 1000, 500, 300)
    ON CONFLICT (user_id) DO UPDATE SET
      target_produksi_per_bulan = EXCLUDED.target_produksi_per_bulan,
      overhead_per_pcs = EXCLUDED.overhead_per_pcs,
      operasional_per_pcs = EXCLUDED.operasional_per_pcs
    RETURNING * INTO v_settings;
    
    v_exists := false; -- Was created, not existed
  END IF;
  
  RETURN QUERY SELECT 
    v_settings.target_produksi_per_bulan,
    v_settings.overhead_per_pcs,
    v_settings.operasional_per_pcs,
    v_exists;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- 7. COMPREHENSIVE PROFIT CALCULATION
-- =====================================

-- Function untuk comprehensive profit calculation using all tables
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
-- 8. PROFIT DASHBOARD SUMMARY
-- =====================================

-- Function untuk dashboard summary dengan semua data sources
CREATE OR REPLACE FUNCTION get_comprehensive_dashboard_summary(p_user_id uuid)
RETURNS TABLE(
  -- Current month
  current_month_revenue numeric,
  current_month_cogs numeric,
  current_month_opex numeric,
  current_month_profit numeric,
  current_month_margin numeric,
  
  -- Previous month comparison
  prev_month_revenue numeric,
  prev_month_profit numeric,
  revenue_growth_pct numeric,
  profit_growth_pct numeric,
  
  -- YTD
  ytd_revenue numeric,
  ytd_profit numeric,
  ytd_avg_margin numeric,
  
  -- Key metrics
  total_orders_this_month integer,
  total_active_materials integer,
  total_operational_costs numeric,
  low_stock_items integer,
  
  -- Status indicators
  business_health_score numeric,
  top_revenue_source text,
  biggest_expense text,
  recommendations jsonb
) AS $$
DECLARE
  v_current_start date;
  v_current_end date;
  v_prev_start date;
  v_prev_end date;
  v_current_data record;
  v_prev_data record;
  v_ytd_data record;
  v_orders integer;
  v_materials integer;
  v_low_stock integer;
  v_op_costs numeric;
  v_health_score numeric;
  v_top_source text;
  v_biggest_expense text;
  v_recommendations jsonb;
BEGIN
  -- Set date ranges
  v_current_start := DATE_TRUNC('month', CURRENT_DATE);
  v_current_end := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day';
  v_prev_start := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
  v_prev_end := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '1 month - 1 day';
  
  -- Get current month data
  SELECT * INTO v_current_data
  FROM calculate_comprehensive_profit(p_user_id, v_current_start, v_current_end);
  
  -- Get previous month data
  SELECT * INTO v_prev_data
  FROM calculate_comprehensive_profit(p_user_id, v_prev_start, v_prev_end);
  
  -- Get YTD data
  SELECT 
    SUM(total_revenue) as ytd_revenue,
    SUM(net_profit) as ytd_profit,
    AVG(net_margin_pct) as ytd_avg_margin
  INTO v_ytd_data
  FROM (
    SELECT 
      total_revenue,
      net_profit,
      net_margin_pct
    FROM calculate_comprehensive_profit(
      p_user_id, 
      DATE_TRUNC('year', CURRENT_DATE),
      CURRENT_DATE
    )
  ) ytd_calc;
  
  -- Get additional metrics
  SELECT COUNT(*) INTO v_orders
  FROM orders
  WHERE user_id = p_user_id
    AND tanggal_pesanan BETWEEN v_current_start AND v_current_end
    AND status = 'completed';
  
  SELECT COUNT(*) INTO v_materials
  FROM bahan_baku
  WHERE user_id = p_user_id AND status = 'aktif';
  
  SELECT COUNT(*) INTO v_low_stock
  FROM bahan_baku
  WHERE user_id = p_user_id AND status = 'aktif' AND stok <= minimum;
  
  SELECT COALESCE(total_monthly_costs, 0) INTO v_op_costs
  FROM get_operational_costs_allocated(p_user_id);
  
  -- Calculate business health score
  v_health_score := COALESCE(v_current_data.cost_efficiency_score, 0);
  
  -- Get top revenue source and biggest expense
  SELECT revenue_breakdown->>0->>'category' INTO v_top_source
  FROM (SELECT v_current_data.revenue_breakdown as revenue_breakdown) rb
  WHERE jsonb_array_length(revenue_breakdown) > 0;
  
  SELECT opex_breakdown->>0->>'nama_biaya' INTO v_biggest_expense
  FROM (SELECT v_current_data.opex_breakdown as opex_breakdown) ob
  WHERE jsonb_array_length(opex_breakdown) > 0;
  
  -- Generate recommendations
  v_recommendations := jsonb_build_array();
  
  IF v_current_data.net_profit < 0 THEN
    v_recommendations := v_recommendations || jsonb_build_object(
      'type', 'alert',
      'message', 'Bisnis mengalami kerugian bulan ini',
      'action', 'Review biaya operasional dan tingkatkan penjualan'
    );
  END IF;
  
  IF v_low_stock > 0 THEN
    v_recommendations := v_recommendations || jsonb_build_object(
      'type', 'warning',
      'message', v_low_stock || ' bahan baku stoknya menipis',
      'action', 'Segera lakukan pembelian bahan baku'
    );
  END IF;
  
  IF v_current_data.net_margin_pct > 20 THEN
    v_recommendations := v_recommendations || jsonb_build_object(
      'type', 'success',
      'message', 'Margin profit sangat sehat (' || ROUND(v_current_data.net_margin_pct, 1) || '%)',
      'action', 'Pertimbangkan untuk ekspansi bisnis'
    );
  END IF;
  
  RETURN QUERY SELECT
    -- Current month
    COALESCE(v_current_data.total_revenue, 0),
    COALESCE(v_current_data.total_cogs, 0),
    COALESCE(v_current_data.total_opex, 0),
    COALESCE(v_current_data.net_profit, 0),
    COALESCE(v_current_data.net_margin_pct, 0),
    
    -- Previous month
    COALESCE(v_prev_data.total_revenue, 0),
    COALESCE(v_prev_data.net_profit, 0),
    CASE 
      WHEN v_prev_data.total_revenue > 0 THEN 
        ROUND(((v_current_data.total_revenue - v_prev_data.total_revenue) / v_prev_data.total_revenue) * 100, 2)
      ELSE 0 
    END,
    CASE 
      WHEN v_prev_data.net_profit != 0 THEN 
        ROUND(((v_current_data.net_profit - v_prev_data.net_profit) / ABS(v_prev_data.net_profit)) * 100, 2)
      ELSE 0 
    END,
    
    -- YTD
    COALESCE(v_ytd_data.ytd_revenue, 0),
    COALESCE(v_ytd_data.ytd_profit, 0),
    COALESCE(v_ytd_data.ytd_avg_margin, 0),
    
    -- Key metrics
    COALESCE(v_orders, 0),
    COALESCE(v_materials, 0),
    COALESCE(v_op_costs, 0),
    COALESCE(v_low_stock, 0),
    
    -- Status indicators
    COALESCE(v_health_score, 0),
    COALESCE(v_top_source, 'N/A'),
    COALESCE(v_biggest_expense, 'N/A'),
    COALESCE(v_recommendations, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- COMMENTS
-- =====================================

COMMENT ON FUNCTION get_revenue_by_period(uuid, date, date) IS 'Get revenue dengan breakdown kategori dari financial_transactions';
COMMENT ON FUNCTION get_expenses_by_period(uuid, date, date) IS 'Get expenses dengan deteksi COGS otomatis dari financial_transactions';
COMMENT ON FUNCTION calculate_material_costs_wac(uuid, date, date) IS 'Hitung material costs menggunakan WAC dari bahan_baku';
COMMENT ON FUNCTION update_wac_price(uuid, uuid, numeric, numeric) IS 'Update WAC price untuk bahan baku';
COMMENT ON FUNCTION get_operational_costs_allocated(uuid, integer) IS 'Get operational costs dengan alokasi harian/periode';
COMMENT ON FUNCTION calculate_recipe_cost_with_wac(uuid, uuid) IS 'Hitung recipe cost dengan integrasi WAC dari warehouse';
COMMENT ON FUNCTION get_sales_from_orders(uuid, date, date) IS 'Get sales data dari orders table';
COMMENT ON FUNCTION get_or_create_app_settings(uuid) IS 'Get atau create default app settings';
COMMENT ON FUNCTION calculate_comprehensive_profit(uuid, date, date) IS 'Kalkulasi profit comprehensive menggunakan semua tabel';
COMMENT ON FUNCTION get_comprehensive_dashboard_summary(uuid) IS 'Dashboard summary lengkap dengan semua data sources';
