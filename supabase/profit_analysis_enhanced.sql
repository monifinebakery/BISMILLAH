-- =====================================
-- ENHANCED PROFIT ANALYSIS
-- Views dan functions untuk tabel yang sudah ada
-- =====================================

-- =====================================
-- VIEWS FOR DASHBOARD
-- =====================================

-- 1. VIEW: Daily Profit Summary
CREATE OR REPLACE VIEW daily_profit_summary AS
SELECT 
  ft.user_id,
  ft.date,
  
  -- Revenue
  COALESCE(SUM(CASE WHEN ft.type = 'income' THEN ft.amount END), 0) as daily_revenue,
  
  -- COGS (berdasarkan kategori expense)
  COALESCE(SUM(CASE 
    WHEN ft.type = 'expense' 
    AND (ft.category ILIKE '%bahan%' OR ft.category ILIKE '%cogs%' OR ft.category ILIKE '%hpp%')
    THEN ft.amount 
  END), 0) as daily_cogs,
  
  -- Operating Expenses (expenses selain COGS)
  COALESCE(SUM(CASE 
    WHEN ft.type = 'expense' 
    AND NOT (ft.category ILIKE '%bahan%' OR ft.category ILIKE '%cogs%' OR ft.category ILIKE '%hpp%')
    THEN ft.amount 
  END), 0) as daily_opex,
  
  -- Calculations
  COALESCE(SUM(CASE WHEN ft.type = 'income' THEN ft.amount END), 0) - 
  COALESCE(SUM(CASE 
    WHEN ft.type = 'expense' 
    AND (ft.category ILIKE '%bahan%' OR ft.category ILIKE '%cogs%' OR ft.category ILIKE '%hpp%')
    THEN ft.amount 
  END), 0) as gross_profit,
  
  COALESCE(SUM(CASE WHEN ft.type = 'income' THEN ft.amount END), 0) - 
  COALESCE(SUM(CASE WHEN ft.type = 'expense' THEN ft.amount END), 0) as net_profit,
  
  -- Margins
  CASE 
    WHEN SUM(CASE WHEN ft.type = 'income' THEN ft.amount END) > 0 
    THEN ROUND(
      ((SUM(CASE WHEN ft.type = 'income' THEN ft.amount END) - 
        SUM(CASE 
          WHEN ft.type = 'expense' 
          AND (ft.category ILIKE '%bahan%' OR ft.category ILIKE '%cogs%' OR ft.category ILIKE '%hpp%')
          THEN ft.amount 
        END)) / SUM(CASE WHEN ft.type = 'income' THEN ft.amount END)) * 100, 
      2
    )
    ELSE 0 
  END as gross_margin_pct,
  
  CASE 
    WHEN SUM(CASE WHEN ft.type = 'income' THEN ft.amount END) > 0 
    THEN ROUND(
      ((SUM(CASE WHEN ft.type = 'income' THEN ft.amount END) - 
        SUM(CASE WHEN ft.type = 'expense' THEN ft.amount END)) / 
       SUM(CASE WHEN ft.type = 'income' THEN ft.amount END)) * 100, 
      2
    )
    ELSE 0 
  END as net_margin_pct

FROM financial_transactions ft
GROUP BY ft.user_id, ft.date
ORDER BY ft.date DESC;

-- 2. VIEW: Monthly Profit Summary dengan Operational Costs
CREATE OR REPLACE VIEW monthly_profit_summary AS
SELECT 
  ft.user_id,
  TO_CHAR(ft.date, 'YYYY-MM') as period,
  DATE_TRUNC('month', ft.date) as month_start,
  
  -- Revenue
  COALESCE(SUM(CASE WHEN ft.type = 'income' THEN ft.amount END), 0) as monthly_revenue,
  
  -- COGS dari transactions
  COALESCE(SUM(CASE 
    WHEN ft.type = 'expense' 
    AND (ft.category ILIKE '%bahan%' OR ft.category ILIKE '%cogs%' OR ft.category ILIKE '%hpp%')
    THEN ft.amount 
  END), 0) as monthly_cogs,
  
  -- Operating Expenses dari transactions  
  COALESCE(SUM(CASE 
    WHEN ft.type = 'expense' 
    AND NOT (ft.category ILIKE '%bahan%' OR ft.category ILIKE '%cogs%' OR ft.category ILIKE '%hpp%')
    THEN ft.amount 
  END), 0) as monthly_opex_transactions,
  
  -- Fixed costs dari operational_costs table
  COALESCE(oc.total_operational_costs, 0) as monthly_operational_costs,
  
  -- Gross & Net Profit
  COALESCE(SUM(CASE WHEN ft.type = 'income' THEN ft.amount END), 0) - 
  COALESCE(SUM(CASE 
    WHEN ft.type = 'expense' 
    AND (ft.category ILIKE '%bahan%' OR ft.category ILIKE '%cogs%' OR ft.category ILIKE '%hpp%')
    THEN ft.amount 
  END), 0) as gross_profit,
  
  COALESCE(SUM(CASE WHEN ft.type = 'income' THEN ft.amount END), 0) - 
  COALESCE(SUM(CASE WHEN ft.type = 'expense' THEN ft.amount END), 0) - 
  COALESCE(oc.total_operational_costs, 0) as final_net_profit,
  
  -- Margins
  CASE 
    WHEN SUM(CASE WHEN ft.type = 'income' THEN ft.amount END) > 0 
    THEN ROUND(
      ((SUM(CASE WHEN ft.type = 'income' THEN ft.amount END) - 
        SUM(CASE 
          WHEN ft.type = 'expense' 
          AND (ft.category ILIKE '%bahan%' OR ft.category ILIKE '%cogs%' OR ft.category ILIKE '%hpp%')
          THEN ft.amount 
        END)) / SUM(CASE WHEN ft.type = 'income' THEN ft.amount END)) * 100, 
      2
    )
    ELSE 0 
  END as gross_margin_pct,
  
  CASE 
    WHEN SUM(CASE WHEN ft.type = 'income' THEN ft.amount END) > 0 
    THEN ROUND(
      ((SUM(CASE WHEN ft.type = 'income' THEN ft.amount END) - 
        SUM(CASE WHEN ft.type = 'expense' THEN ft.amount END) - 
        COALESCE(oc.total_operational_costs, 0)) / 
       SUM(CASE WHEN ft.type = 'income' THEN ft.amount END)) * 100, 
      2
    )
    ELSE 0 
  END as final_net_margin_pct,
  
  -- Transaction count
  COUNT(CASE WHEN ft.type = 'income' THEN 1 END) as revenue_transaction_count,
  COUNT(CASE WHEN ft.type = 'expense' THEN 1 END) as expense_transaction_count

FROM financial_transactions ft
LEFT JOIN (
  SELECT 
    user_id,
    SUM(jumlah_per_bulan) as total_operational_costs
  FROM operational_costs 
  WHERE status = 'aktif'
  GROUP BY user_id
) oc ON ft.user_id = oc.user_id
GROUP BY ft.user_id, TO_CHAR(ft.date, 'YYYY-MM'), DATE_TRUNC('month', ft.date), oc.total_operational_costs
ORDER BY TO_CHAR(ft.date, 'YYYY-MM') DESC;

-- 3. VIEW: Revenue Category Breakdown
CREATE OR REPLACE VIEW revenue_category_breakdown AS
SELECT 
  ft.user_id,
  TO_CHAR(ft.date, 'YYYY-MM') as period,
  COALESCE(ft.category, 'Tidak Dikategorikan') as revenue_category,
  COUNT(*) as transaction_count,
  SUM(ft.amount) as total_amount,
  ROUND(AVG(ft.amount), 0) as avg_amount,
  MIN(ft.amount) as min_amount,
  MAX(ft.amount) as max_amount

FROM financial_transactions ft
WHERE ft.type = 'income'
GROUP BY ft.user_id, TO_CHAR(ft.date, 'YYYY-MM'), ft.category
ORDER BY TO_CHAR(ft.date, 'YYYY-MM') DESC, SUM(ft.amount) DESC;

-- =====================================
-- ENHANCED FUNCTIONS
-- =====================================

-- Function untuk auto-calculate dan store monthly profit
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
  
  -- Calculate COGS dari transactions
  SELECT COALESCE(SUM(amount), 0)
  INTO v_cogs
  FROM financial_transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND (category ILIKE '%bahan%' OR category ILIKE '%cogs%' OR category ILIKE '%hpp%')
    AND date BETWEEN v_start_date AND v_end_date;
  
  -- Calculate operational expenses dari transactions
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

-- Function untuk dashboard summary
CREATE OR REPLACE FUNCTION get_profit_dashboard_summary(p_user_id uuid)
RETURNS TABLE(
  current_month_revenue numeric,
  current_month_profit numeric,
  current_month_margin numeric,
  prev_month_revenue numeric,
  prev_month_profit numeric,
  revenue_growth numeric,
  profit_growth numeric,
  best_category text
) AS $$
BEGIN
  RETURN QUERY
  WITH current_month AS (
    SELECT 
      monthly_revenue,
      final_net_profit,
      final_net_margin_pct
    FROM monthly_profit_summary
    WHERE user_id = p_user_id 
    AND period = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    LIMIT 1
  ),
  prev_month AS (
    SELECT 
      monthly_revenue,
      final_net_profit
    FROM monthly_profit_summary
    WHERE user_id = p_user_id 
    AND period = TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM')
    LIMIT 1
  ),
  best_category AS (
    SELECT revenue_category
    FROM revenue_category_breakdown
    WHERE user_id = p_user_id
    AND period = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    ORDER BY total_amount DESC
    LIMIT 1
  )
  SELECT 
    COALESCE(cm.monthly_revenue, 0),
    COALESCE(cm.final_net_profit, 0),
    COALESCE(cm.final_net_margin_pct, 0),
    COALESCE(pm.monthly_revenue, 0),
    COALESCE(pm.final_net_profit, 0),
    CASE 
      WHEN pm.monthly_revenue > 0 
      THEN ROUND(((cm.monthly_revenue - pm.monthly_revenue) / pm.monthly_revenue) * 100, 2)
      ELSE 0 
    END,
    CASE 
      WHEN pm.final_net_profit != 0 
      THEN ROUND(((cm.final_net_profit - pm.final_net_profit) / ABS(pm.final_net_profit)) * 100, 2)
      ELSE 0 
    END,
    COALESCE(bc.revenue_category, 'N/A')
  FROM current_month cm
  CROSS JOIN prev_month pm
  CROSS JOIN best_category bc;
END;
$$ LANGUAGE plpgsql;

-- Function untuk get current month profit data
CREATE OR REPLACE FUNCTION get_current_month_profit_data(p_user_id uuid)
RETURNS TABLE(
  period text,
  revenue numeric,
  cogs numeric,
  opex numeric,
  gross_profit numeric,
  net_profit numeric,
  gross_margin_pct numeric,
  net_margin_pct numeric,
  revenue_breakdown jsonb,
  expense_breakdown jsonb
) AS $$
DECLARE
  v_current_period text;
BEGIN
  v_current_period := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  RETURN QUERY
  SELECT 
    mps.period,
    mps.monthly_revenue,
    mps.monthly_cogs,
    mps.monthly_opex_transactions + mps.monthly_operational_costs,
    mps.gross_profit,
    mps.final_net_profit,
    mps.gross_margin_pct,
    mps.final_net_margin_pct,
    get_revenue_breakdown(p_user_id, (v_current_period || '-01')::date, (DATE_TRUNC('month', (v_current_period || '-01')::date) + INTERVAL '1 month - 1 day')::date),
    get_expense_breakdown(p_user_id, (v_current_period || '-01')::date, (DATE_TRUNC('month', (v_current_period || '-01')::date) + INTERVAL '1 month - 1 day')::date)
  FROM monthly_profit_summary mps
  WHERE mps.user_id = p_user_id
  AND mps.period = v_current_period
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- COMMENTS
-- =====================================

COMMENT ON VIEW daily_profit_summary IS 'Ringkasan profit harian dengan perhitungan gross dan net profit';
COMMENT ON VIEW monthly_profit_summary IS 'Ringkasan profit bulanan dengan operational costs';
COMMENT ON VIEW revenue_category_breakdown IS 'Breakdown revenue berdasarkan kategori per bulan';

COMMENT ON FUNCTION auto_calculate_monthly_profit(uuid, text) IS 'Menghitung dan menyimpan profit analysis untuk bulan tertentu';
COMMENT ON FUNCTION get_profit_dashboard_summary(uuid) IS 'Ringkasan dashboard profit dengan growth calculations';
COMMENT ON FUNCTION get_current_month_profit_data(uuid) IS 'Data profit bulan ini lengkap dengan breakdown';
