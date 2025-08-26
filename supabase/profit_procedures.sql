-- =====================================
-- PROFIT ANALYSIS STORED PROCEDURES
-- Procedures untuk kalkulasi dan maintenance profit analysis
-- =====================================

-- 1. PROCEDURE: Auto Calculate and Store Monthly Profit
-- Menghitung dan menyimpan profit analysis untuk bulan tertentu
CREATE OR REPLACE FUNCTION auto_calculate_monthly_profit(
  p_user_id uuid,
  p_month text DEFAULT NULL -- format: 'YYYY-MM', NULL untuk bulan ini
)
RETURNS TABLE(
  period text,
  revenue numeric,
  cogs numeric,
  opex numeric,
  gross_profit numeric,
  net_profit numeric,
  status text
) AS $$
DECLARE
  v_period text;
  v_start_date date;
  v_end_date date;
  v_revenue numeric;
  v_cogs numeric;
  v_opex_transactions numeric;
  v_opex_fixed numeric;
  v_gross_profit numeric;
  v_net_profit numeric;
  v_gross_margin numeric;
  v_net_margin numeric;
  v_revenue_breakdown jsonb;
  v_expense_breakdown jsonb;
BEGIN
  -- Set period
  v_period := COALESCE(p_month, TO_CHAR(CURRENT_DATE, 'YYYY-MM'));
  v_start_date := (v_period || '-01')::date;
  v_end_date := (DATE_TRUNC('month', v_start_date) + INTERVAL '1 month - 1 day')::date;
  
  -- Calculate revenue
  SELECT COALESCE(SUM(amount), 0)
  INTO v_revenue
  FROM financial_transactions
  WHERE user_id = p_user_id
    AND type = 'income'
    AND date BETWEEN v_start_date AND v_end_date;
  
  -- Calculate COGS from transactions
  SELECT COALESCE(SUM(amount), 0)
  INTO v_cogs
  FROM financial_transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND (category ILIKE '%bahan%' OR category ILIKE '%cogs%' OR category ILIKE '%hpp%')
    AND date BETWEEN v_start_date AND v_end_date;
  
  -- Calculate operational expenses from transactions
  SELECT COALESCE(SUM(amount), 0)
  INTO v_opex_transactions
  FROM financial_transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND NOT (category ILIKE '%bahan%' OR category ILIKE '%cogs%' OR category ILIKE '%hpp%')
    AND date BETWEEN v_start_date AND v_end_date;
  
  -- Calculate fixed operational costs
  SELECT COALESCE(SUM(jumlah_per_bulan), 0)
  INTO v_opex_fixed
  FROM operational_costs
  WHERE user_id = p_user_id
    AND status = 'aktif';
  
  -- Calculate profits
  v_gross_profit := v_revenue - v_cogs;
  v_net_profit := v_gross_profit - v_opex_transactions - v_opex_fixed;
  
  -- Calculate margins
  v_gross_margin := CASE 
    WHEN v_revenue > 0 THEN (v_gross_profit / v_revenue) * 100 
    ELSE 0 
  END;
  v_net_margin := CASE 
    WHEN v_revenue > 0 THEN (v_net_profit / v_revenue) * 100 
    ELSE 0 
  END;
  
  -- Get revenue breakdown
  SELECT get_revenue_breakdown(p_user_id, v_start_date, v_end_date)
  INTO v_revenue_breakdown;
  
  -- Get expense breakdown
  SELECT get_expense_breakdown(p_user_id, v_start_date, v_end_date)
  INTO v_expense_breakdown;
  
  -- Insert or update profit analysis
  INSERT INTO profit_analysis (
    user_id, period, period_type,
    total_revenue, revenue_breakdown,
    total_cogs, total_opex,
    cogs_breakdown, opex_breakdown,
    gross_profit, net_profit,
    gross_margin, net_margin
  )
  VALUES (
    p_user_id, v_period, 'monthly',
    v_revenue, v_revenue_breakdown,
    v_cogs, v_opex_transactions + v_opex_fixed,
    '[]'::jsonb, v_expense_breakdown,
    v_gross_profit, v_net_profit,
    v_gross_margin, v_net_margin
  )
  ON CONFLICT (user_id, period, period_type) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    revenue_breakdown = EXCLUDED.revenue_breakdown,
    total_cogs = EXCLUDED.total_cogs,
    total_opex = EXCLUDED.total_opex,
    cogs_breakdown = EXCLUDED.cogs_breakdown,
    opex_breakdown = EXCLUDED.opex_breakdown,
    gross_profit = EXCLUDED.gross_profit,
    net_profit = EXCLUDED.net_profit,
    gross_margin = EXCLUDED.gross_margin,
    net_margin = EXCLUDED.net_margin,
    updated_at = now();
  
  -- Return results
  RETURN QUERY SELECT
    v_period,
    v_revenue,
    v_cogs,
    v_opex_transactions + v_opex_fixed,
    v_gross_profit,
    v_net_profit,
    'Success'::text;
END;
$$ LANGUAGE plpgsql;

-- 2. PROCEDURE: Bulk Calculate Profit for Multiple Months
CREATE OR REPLACE FUNCTION bulk_calculate_profit(
  p_user_id uuid,
  p_months_back integer DEFAULT 12
)
RETURNS TABLE(
  period text,
  status text,
  revenue numeric,
  net_profit numeric
) AS $$
DECLARE
  v_month_record record;
  v_result record;
BEGIN
  -- Loop through months
  FOR v_month_record IN 
    SELECT TO_CHAR(generate_series(
      CURRENT_DATE - (p_months_back || ' months')::INTERVAL,
      CURRENT_DATE,
      '1 month'::INTERVAL
    ), 'YYYY-MM') as month_period
  LOOP
    -- Calculate profit for each month
    SELECT * INTO v_result
    FROM auto_calculate_monthly_profit(p_user_id, v_month_record.month_period)
    LIMIT 1;
    
    RETURN QUERY SELECT 
      v_result.period,
      v_result.status,
      v_result.revenue,
      v_result.net_profit;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 3. PROCEDURE: Update WAC (Weighted Average Cost) for Materials
CREATE OR REPLACE FUNCTION update_material_wac(
  p_user_id uuid,
  p_bahan_id uuid,
  p_quantity numeric,
  p_price numeric
)
RETURNS TABLE(
  bahan_id uuid,
  old_price numeric,
  new_price numeric,
  old_stock numeric,
  new_stock numeric,
  status text
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
  
  -- Calculate new WAC
  IF v_current_stock = 0 THEN
    v_new_wac := p_price;
  ELSE
    v_new_wac := ((v_current_stock * v_current_wac) + (p_quantity * p_price)) / (v_current_stock + p_quantity);
  END IF;
  
  v_new_stock := v_current_stock + p_quantity;
  
  -- Update bahan baku
  UPDATE bahan_baku 
  SET 
    stok = v_new_stock,
    harga_rata_rata = v_new_wac,
    updated_at = now()
  WHERE id = p_bahan_id AND user_id = p_user_id;
  
  -- Log activity
  INSERT INTO activities (
    user_id, title, description, type, value, related_id
  ) VALUES (
    p_user_id,
    'WAC Update',
    'Weighted Average Cost updated for material',
    'stok',
    jsonb_build_object(
      'old_wac', v_current_wac,
      'new_wac', v_new_wac,
      'quantity_added', p_quantity
    )::text,
    p_bahan_id
  );
  
  RETURN QUERY SELECT
    p_bahan_id,
    v_current_wac,
    v_new_wac,
    v_current_stock,
    v_new_stock,
    'WAC Updated Successfully'::text;
END;
$$ LANGUAGE plpgsql;

-- 4. PROCEDURE: Calculate Recipe Cost (HPP)
CREATE OR REPLACE FUNCTION calculate_recipe_cost(
  p_user_id uuid,
  p_recipe_id uuid
)
RETURNS TABLE(
  recipe_id uuid,
  recipe_name text,
  material_cost numeric,
  labor_cost numeric,
  overhead_cost numeric,
  total_hpp numeric,
  hpp_per_portion numeric,
  status text
) AS $$
DECLARE
  v_recipe record;
  v_ingredient record;
  v_total_material_cost numeric := 0;
  v_app_settings record;
BEGIN
  -- Get recipe data
  SELECT * INTO v_recipe
  FROM hpp_recipes
  WHERE id = p_recipe_id AND user_id = p_user_id;
  
  IF v_recipe IS NULL THEN
    RETURN QUERY SELECT 
      p_recipe_id, 'Recipe not found'::text, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 0::numeric, 'Error'::text;
    RETURN;
  END IF;
  
  -- Calculate material costs
  FOR v_ingredient IN 
    SELECT 
      (ingredient->>'bahan_baku_id')::uuid as bahan_id,
      (ingredient->>'qty')::numeric as quantity
    FROM jsonb_array_elements(v_recipe.ingredients) as ingredient
    WHERE ingredient->>'bahan_baku_id' IS NOT NULL
  LOOP
    SELECT v_total_material_cost + 
           (COALESCE(bb.harga_rata_rata, bb.harga_satuan, 0) * v_ingredient.quantity)
    INTO v_total_material_cost
    FROM bahan_baku bb
    WHERE bb.id = v_ingredient.bahan_id AND bb.user_id = p_user_id;
  END LOOP;
  
  -- Get app settings for overhead calculation
  SELECT * INTO v_app_settings
  FROM app_settings
  WHERE user_id = p_user_id;
  
  -- Calculate total HPP
  UPDATE hpp_recipes
  SET 
    total_hpp = v_total_material_cost + 
                COALESCE(biaya_tenaga_kerja, 0) + 
                COALESCE(v_app_settings.overhead_per_pcs * porsi, biaya_overhead, 0),
    hpp_per_porsi = (v_total_material_cost + 
                     COALESCE(biaya_tenaga_kerja, 0) + 
                     COALESCE(v_app_settings.overhead_per_pcs * porsi, biaya_overhead, 0)) / GREATEST(porsi, 1),
    updated_at = now()
  WHERE id = p_recipe_id AND user_id = p_user_id;
  
  -- Return results
  RETURN QUERY SELECT
    p_recipe_id,
    v_recipe.nama_resep,
    v_total_material_cost,
    COALESCE(v_recipe.biaya_tenaga_kerja, 0),
    COALESCE(v_app_settings.overhead_per_pcs * v_recipe.porsi, v_recipe.biaya_overhead, 0),
    v_total_material_cost + 
    COALESCE(v_recipe.biaya_tenaga_kerja, 0) + 
    COALESCE(v_app_settings.overhead_per_pcs * v_recipe.porsi, v_recipe.biaya_overhead, 0),
    (v_total_material_cost + 
     COALESCE(v_recipe.biaya_tenaga_kerja, 0) + 
     COALESCE(v_app_settings.overhead_per_pcs * v_recipe.porsi, v_recipe.biaya_overhead, 0)) / GREATEST(v_recipe.porsi, 1),
    'Recipe cost calculated successfully'::text;
END;
$$ LANGUAGE plpgsql;

-- 5. PROCEDURE: Auto-categorize Transactions
CREATE OR REPLACE FUNCTION auto_categorize_transactions(p_user_id uuid)
RETURNS TABLE(
  transaction_id uuid,
  old_category text,
  new_category text,
  confidence text
) AS $$
BEGIN
  RETURN QUERY
  WITH categorization AS (
    SELECT 
      ft.id,
      ft.category as old_category,
      CASE 
        -- Revenue categorization
        WHEN ft.type = 'income' THEN
          CASE 
            WHEN ft.description ILIKE '%jual%' OR ft.description ILIKE '%order%' THEN 'Penjualan'
            WHEN ft.description ILIKE '%konsul%' OR ft.description ILIKE '%service%' THEN 'Jasa'
            WHEN ft.description ILIKE '%bunga%' OR ft.description ILIKE '%interest%' THEN 'Pendapatan Lain'
            ELSE 'Penjualan'
          END
        -- Expense categorization  
        WHEN ft.type = 'expense' THEN
          CASE 
            WHEN ft.description ILIKE '%beli%' OR ft.description ILIKE '%bahan%' OR ft.description ILIKE '%tepung%' 
                 OR ft.description ILIKE '%gula%' OR ft.description ILIKE '%telur%' THEN 'Bahan Baku'
            WHEN ft.description ILIKE '%sewa%' OR ft.description ILIKE '%rent%' THEN 'Sewa'
            WHEN ft.description ILIKE '%listrik%' OR ft.description ILIKE '%electricity%' THEN 'Listrik'
            WHEN ft.description ILIKE '%gas%' OR ft.description ILIKE '%fuel%' THEN 'Gas'
            WHEN ft.description ILIKE '%gaji%' OR ft.description ILIKE '%salary%' OR ft.description ILIKE '%upah%' THEN 'Tenaga Kerja'
            WHEN ft.description ILIKE '%transport%' OR ft.description ILIKE '%bensin%' OR ft.description ILIKE '%ongkir%' THEN 'Transportasi'
            WHEN ft.description ILIKE '%internet%' OR ft.description ILIKE '%phone%' OR ft.description ILIKE '%komunikasi%' THEN 'Komunikasi'
            WHEN ft.description ILIKE '%maintain%' OR ft.description ILIKE '%repair%' OR ft.description ILIKE '%service%' THEN 'Maintenance'
            ELSE 'Operasional'
          END
        ELSE ft.category
      END as new_category,
      CASE 
        WHEN ft.description IS NOT NULL AND LENGTH(ft.description) > 5 THEN 'High'
        WHEN ft.description IS NOT NULL THEN 'Medium'
        ELSE 'Low'
      END as confidence
    FROM financial_transactions ft
    WHERE ft.user_id = p_user_id
      AND (ft.category IS NULL OR ft.category = '')
  )
  UPDATE financial_transactions ft
  SET 
    category = cat.new_category,
    updated_at = now()
  FROM categorization cat
  WHERE ft.id = cat.id
  RETURNING ft.id, cat.old_category, cat.new_category, cat.confidence;
END;
$$ LANGUAGE plpgsql;

-- 6. PROCEDURE: Generate Profit Report
CREATE OR REPLACE FUNCTION generate_profit_report(
  p_user_id uuid,
  p_start_period text, -- 'YYYY-MM'
  p_end_period text    -- 'YYYY-MM'
)
RETURNS TABLE(
  report_period text,
  total_months integer,
  avg_monthly_revenue numeric,
  total_revenue numeric,
  avg_monthly_profit numeric,
  total_profit numeric,
  best_month text,
  worst_month text,
  revenue_trend text,
  profit_trend text
) AS $$
DECLARE
  v_total_months integer;
  v_best_month record;
  v_worst_month record;
BEGIN
  -- Calculate total months
  SELECT DATE_PART('month', AGE((p_end_period || '-01')::date, (p_start_period || '-01')::date)) + 1
  INTO v_total_months;
  
  -- Find best and worst months
  SELECT period, monthly_revenue INTO v_best_month
  FROM comprehensive_monthly_profit
  WHERE user_id = p_user_id 
    AND period BETWEEN p_start_period AND p_end_period
  ORDER BY monthly_revenue DESC
  LIMIT 1;
  
  SELECT period, monthly_revenue INTO v_worst_month
  FROM comprehensive_monthly_profit
  WHERE user_id = p_user_id 
    AND period BETWEEN p_start_period AND p_end_period
  ORDER BY monthly_revenue ASC
  LIMIT 1;
  
  RETURN QUERY
  WITH report_data AS (
    SELECT 
      COUNT(*) as months_with_data,
      AVG(monthly_revenue) as avg_revenue,
      SUM(monthly_revenue) as total_revenue,
      AVG(final_net_profit) as avg_profit,
      SUM(final_net_profit) as total_profit,
      -- Simple trend calculation
      CASE 
        WHEN AVG(monthly_revenue) OVER (ORDER BY period ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) >
             AVG(monthly_revenue) OVER (ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND 3 PRECEDING)
        THEN 'Upward'
        ELSE 'Downward'
      END as revenue_trend,
      CASE 
        WHEN AVG(final_net_profit) OVER (ORDER BY period ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) >
             AVG(final_net_profit) OVER (ORDER BY period ROWS BETWEEN UNBOUNDED PRECEDING AND 3 PRECEDING)
        THEN 'Upward'
        ELSE 'Downward'
      END as profit_trend
    FROM comprehensive_monthly_profit
    WHERE user_id = p_user_id 
      AND period BETWEEN p_start_period AND p_end_period
  )
  SELECT 
    p_start_period || ' to ' || p_end_period,
    v_total_months,
    ROUND(rd.avg_revenue, 0),
    ROUND(rd.total_revenue, 0),
    ROUND(rd.avg_profit, 0),
    ROUND(rd.total_profit, 0),
    COALESCE(v_best_month.period, 'N/A'),
    COALESCE(v_worst_month.period, 'N/A'),
    COALESCE(rd.revenue_trend, 'Unknown'),
    COALESCE(rd.profit_trend, 'Unknown')
  FROM report_data rd
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 7. PROCEDURE: Data Maintenance and Cleanup
CREATE OR REPLACE FUNCTION cleanup_profit_data(
  p_user_id uuid,
  p_months_to_keep integer DEFAULT 24
)
RETURNS TABLE(
  table_name text,
  records_deleted integer,
  status text
) AS $$
DECLARE
  v_cutoff_date date;
  v_deleted_count integer;
BEGIN
  v_cutoff_date := CURRENT_DATE - (p_months_to_keep || ' months')::INTERVAL;
  
  -- Clean old profit analysis records
  DELETE FROM profit_analysis
  WHERE user_id = p_user_id 
    AND calculation_date < v_cutoff_date;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN QUERY SELECT 'profit_analysis'::text, v_deleted_count, 'Cleaned'::text;
  
  -- Clean old activities
  DELETE FROM activities
  WHERE user_id = p_user_id 
    AND created_at < v_cutoff_date;
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN QUERY SELECT 'activities'::text, v_deleted_count, 'Cleaned'::text;
  
  -- Update statistics
  ANALYZE profit_analysis;
  ANALYZE financial_transactions;
  ANALYZE operational_costs;
  
  RETURN QUERY SELECT 'statistics'::text, 0, 'Updated'::text;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- SCHEDULED PROCEDURES (for automation)
-- =====================================

-- Daily procedure to auto-calculate yesterday's profit
CREATE OR REPLACE FUNCTION daily_profit_calculation()
RETURNS void AS $$
DECLARE
  v_user record;
BEGIN
  FOR v_user IN 
    SELECT DISTINCT user_id FROM financial_transactions
    WHERE date = CURRENT_DATE - 1
  LOOP
    PERFORM auto_calculate_monthly_profit(
      v_user.user_id, 
      TO_CHAR(CURRENT_DATE - 1, 'YYYY-MM')
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- COMMENTS
-- =====================================

COMMENT ON FUNCTION auto_calculate_monthly_profit(uuid, text) IS 'Menghitung dan menyimpan profit analysis untuk bulan tertentu';
COMMENT ON FUNCTION bulk_calculate_profit(uuid, integer) IS 'Menghitung profit untuk beberapa bulan sekaligus';
COMMENT ON FUNCTION update_material_wac(uuid, uuid, numeric, numeric) IS 'Update Weighted Average Cost untuk bahan baku';
COMMENT ON FUNCTION calculate_recipe_cost(uuid, uuid) IS 'Menghitung HPP untuk resep tertentu';
COMMENT ON FUNCTION auto_categorize_transactions(uuid) IS 'Otomatis mengkategorikan transaksi berdasarkan deskripsi';
COMMENT ON FUNCTION generate_profit_report(uuid, text, text) IS 'Generate laporan profit untuk periode tertentu';
COMMENT ON FUNCTION cleanup_profit_data(uuid, integer) IS 'Pembersihan data lama untuk maintenance';
COMMENT ON FUNCTION daily_profit_calculation() IS 'Procedure harian untuk kalkulasi profit otomatis';
