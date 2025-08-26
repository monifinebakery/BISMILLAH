-- =====================================
-- ADVANCED PROFIT ANALYSIS QUERIES
-- Query SQL untuk analisis profit mendalam
-- =====================================

-- 1. QUERY: Profit Analysis Dashboard Summary
-- Usage: SELECT * FROM get_dashboard_summary('user_id');
CREATE OR REPLACE FUNCTION get_dashboard_summary(p_user_id uuid)
RETURNS TABLE(
  current_month_revenue numeric,
  current_month_profit numeric,
  current_month_margin numeric,
  prev_month_revenue numeric,
  prev_month_profit numeric,
  revenue_growth numeric,
  profit_growth numeric,
  ytd_revenue numeric,
  ytd_profit numeric,
  best_performing_category text,
  worst_performing_category text
) AS $$
BEGIN
  RETURN QUERY
  WITH current_month AS (
    SELECT 
      monthly_revenue,
      final_net_profit,
      final_net_margin_pct
    FROM comprehensive_monthly_profit
    WHERE user_id = p_user_id 
    AND period = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  ),
  prev_month AS (
    SELECT 
      monthly_revenue,
      final_net_profit
    FROM comprehensive_monthly_profit
    WHERE user_id = p_user_id 
    AND period = TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM')
  ),
  ytd_data AS (
    SELECT 
      SUM(monthly_revenue) as ytd_revenue,
      SUM(final_net_profit) as ytd_profit
    FROM comprehensive_monthly_profit
    WHERE user_id = p_user_id 
    AND EXTRACT(YEAR FROM month_start) = EXTRACT(YEAR FROM CURRENT_DATE)
  ),
  best_category AS (
    SELECT revenue_category
    FROM revenue_category_breakdown
    WHERE user_id = p_user_id
    AND period = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    ORDER BY total_amount DESC
    LIMIT 1
  ),
  worst_category AS (
    SELECT expense_category
    FROM expense_category_breakdown
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
    COALESCE(yd.ytd_revenue, 0),
    COALESCE(yd.ytd_profit, 0),
    COALESCE(bc.revenue_category, 'N/A'),
    COALESCE(wc.expense_category, 'N/A')
  FROM current_month cm
  CROSS JOIN prev_month pm
  CROSS JOIN ytd_data yd
  CROSS JOIN best_category bc
  CROSS JOIN worst_category wc;
END;
$$ LANGUAGE plpgsql;

-- 2. QUERY: Profit Comparison by Period
-- Membandingkan profit antara periode berbeda
CREATE OR REPLACE FUNCTION compare_profit_periods(
  p_user_id uuid,
  p_period1 text, -- format: 'YYYY-MM'
  p_period2 text  -- format: 'YYYY-MM'
)
RETURNS TABLE(
  metric text,
  period1_value numeric,
  period2_value numeric,
  difference numeric,
  percentage_change numeric,
  trend text
) AS $$
BEGIN
  RETURN QUERY
  WITH period_data AS (
    SELECT 
      period,
      monthly_revenue,
      gross_profit,
      final_net_profit,
      gross_margin_pct,
      final_net_margin_pct
    FROM comprehensive_monthly_profit
    WHERE user_id = p_user_id
    AND period IN (p_period1, p_period2)
  ),
  p1 AS (SELECT * FROM period_data WHERE period = p_period1),
  p2 AS (SELECT * FROM period_data WHERE period = p_period2)
  
  SELECT 
    'Revenue'::text,
    COALESCE(p1.monthly_revenue, 0),
    COALESCE(p2.monthly_revenue, 0),
    COALESCE(p2.monthly_revenue, 0) - COALESCE(p1.monthly_revenue, 0),
    CASE WHEN p1.monthly_revenue > 0 
         THEN ROUND(((p2.monthly_revenue - p1.monthly_revenue) / p1.monthly_revenue) * 100, 2)
         ELSE 0 END,
    CASE WHEN p2.monthly_revenue > p1.monthly_revenue THEN 'Up'
         WHEN p2.monthly_revenue < p1.monthly_revenue THEN 'Down'
         ELSE 'Flat' END
  FROM p1 CROSS JOIN p2
  
  UNION ALL
  
  SELECT 
    'Gross Profit'::text,
    COALESCE(p1.gross_profit, 0),
    COALESCE(p2.gross_profit, 0),
    COALESCE(p2.gross_profit, 0) - COALESCE(p1.gross_profit, 0),
    CASE WHEN p1.gross_profit != 0 
         THEN ROUND(((p2.gross_profit - p1.gross_profit) / ABS(p1.gross_profit)) * 100, 2)
         ELSE 0 END,
    CASE WHEN p2.gross_profit > p1.gross_profit THEN 'Up'
         WHEN p2.gross_profit < p1.gross_profit THEN 'Down'
         ELSE 'Flat' END
  FROM p1 CROSS JOIN p2
  
  UNION ALL
  
  SELECT 
    'Net Profit'::text,
    COALESCE(p1.final_net_profit, 0),
    COALESCE(p2.final_net_profit, 0),
    COALESCE(p2.final_net_profit, 0) - COALESCE(p1.final_net_profit, 0),
    CASE WHEN p1.final_net_profit != 0 
         THEN ROUND(((p2.final_net_profit - p1.final_net_profit) / ABS(p1.final_net_profit)) * 100, 2)
         ELSE 0 END,
    CASE WHEN p2.final_net_profit > p1.final_net_profit THEN 'Up'
         WHEN p2.final_net_profit < p1.final_net_profit THEN 'Down'
         ELSE 'Flat' END
  FROM p1 CROSS JOIN p2;
END;
$$ LANGUAGE plpgsql;

-- 3. QUERY: Break-Even Analysis
CREATE OR REPLACE FUNCTION calculate_breakeven_analysis(p_user_id uuid)
RETURNS TABLE(
  monthly_fixed_costs numeric,
  avg_gross_margin_pct numeric,
  breakeven_revenue numeric,
  current_month_revenue numeric,
  revenue_gap numeric,
  breakeven_status text
) AS $$
DECLARE
  v_fixed_costs numeric;
  v_avg_margin numeric;
  v_current_revenue numeric;
  v_breakeven_revenue numeric;
BEGIN
  -- Get monthly fixed costs
  SELECT SUM(jumlah_per_bulan)
  INTO v_fixed_costs
  FROM operational_costs
  WHERE user_id = p_user_id 
  AND status = 'aktif'
  AND jenis = 'tetap';
  
  -- Get average gross margin from last 6 months
  SELECT AVG(gross_margin_pct)
  INTO v_avg_margin
  FROM comprehensive_monthly_profit
  WHERE user_id = p_user_id
  AND month_start >= CURRENT_DATE - INTERVAL '6 months'
  AND gross_margin_pct > 0;
  
  -- Get current month revenue
  SELECT COALESCE(monthly_revenue, 0)
  INTO v_current_revenue
  FROM comprehensive_monthly_profit
  WHERE user_id = p_user_id
  AND period = TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  -- Calculate breakeven revenue
  IF v_avg_margin > 0 THEN
    v_breakeven_revenue := v_fixed_costs / (v_avg_margin / 100);
  ELSE
    v_breakeven_revenue := 0;
  END IF;
  
  RETURN QUERY SELECT
    COALESCE(v_fixed_costs, 0),
    COALESCE(v_avg_margin, 0),
    COALESCE(v_breakeven_revenue, 0),
    COALESCE(v_current_revenue, 0),
    COALESCE(v_breakeven_revenue, 0) - COALESCE(v_current_revenue, 0),
    CASE 
      WHEN v_current_revenue >= v_breakeven_revenue THEN 'Above Breakeven'
      WHEN v_current_revenue > 0 THEN 'Below Breakeven'
      ELSE 'No Revenue'
    END;
END;
$$ LANGUAGE plpgsql;

-- 4. QUERY: Top Revenue Days Analysis
CREATE OR REPLACE FUNCTION get_top_revenue_days(
  p_user_id uuid,
  p_limit integer DEFAULT 10,
  p_months_back integer DEFAULT 3
)
RETURNS TABLE(
  transaction_date date,
  daily_revenue numeric,
  daily_profit numeric,
  transaction_count integer,
  avg_per_transaction numeric,
  day_of_week text,
  is_weekend boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dps.date,
    dps.daily_revenue,
    dps.net_profit,
    COUNT(ft.id)::integer,
    CASE WHEN COUNT(ft.id) > 0 
         THEN ROUND(dps.daily_revenue / COUNT(ft.id), 0)
         ELSE 0 END,
    TO_CHAR(dps.date, 'Day'),
    EXTRACT(DOW FROM dps.date) IN (0, 6)
  FROM daily_profit_summary dps
  LEFT JOIN financial_transactions ft ON ft.user_id = dps.user_id 
    AND ft.date = dps.date 
    AND ft.type = 'income'
  WHERE dps.user_id = p_user_id
    AND dps.date >= CURRENT_DATE - (p_months_back || ' months')::INTERVAL
    AND dps.daily_revenue > 0
  GROUP BY dps.date, dps.daily_revenue, dps.net_profit
  ORDER BY dps.daily_revenue DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 5. QUERY: Expense Pattern Analysis
CREATE OR REPLACE FUNCTION analyze_expense_patterns(
  p_user_id uuid,
  p_months_back integer DEFAULT 6
)
RETURNS TABLE(
  expense_category text,
  total_amount numeric,
  avg_monthly_amount numeric,
  transaction_count integer,
  avg_per_transaction numeric,
  expense_type text,
  percentage_of_total numeric,
  trend text
) AS $$
BEGIN
  RETURN QUERY
  WITH expense_data AS (
    SELECT 
      ecb.*,
      SUM(ecb.total_amount) OVER () as grand_total
    FROM expense_category_breakdown ecb
    WHERE ecb.user_id = p_user_id
    AND ecb.period >= TO_CHAR(CURRENT_DATE - (p_months_back || ' months')::INTERVAL, 'YYYY-MM')
  ),
  aggregated AS (
    SELECT 
      expense_category,
      SUM(total_amount) as total_amount,
      ROUND(AVG(total_amount), 0) as avg_monthly_amount,
      SUM(transaction_count) as transaction_count,
      ROUND(AVG(avg_amount), 0) as avg_per_transaction,
      expense_type,
      ROUND((SUM(total_amount) / MAX(grand_total)) * 100, 2) as percentage_of_total,
      CASE 
        WHEN COUNT(*) >= 3 THEN
          CASE 
            WHEN AVG(total_amount) OVER (
              ORDER BY expense_category 
              ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
            ) > AVG(total_amount) OVER (
              ORDER BY expense_category 
              ROWS BETWEEN UNBOUNDED PRECEDING AND 3 PRECEDING
            ) THEN 'Increasing'
            ELSE 'Decreasing'
          END
        ELSE 'Insufficient Data'
      END as trend
    FROM expense_data
    GROUP BY expense_category, expense_type
  )
  SELECT * FROM aggregated
  ORDER BY total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- 6. QUERY: Seasonal Profit Analysis
CREATE OR REPLACE FUNCTION analyze_seasonal_patterns(p_user_id uuid)
RETURNS TABLE(
  month_name text,
  month_number integer,
  avg_revenue numeric,
  avg_profit numeric,
  avg_margin numeric,
  data_points integer,
  revenue_rank integer,
  profit_rank integer
) AS $$
BEGIN
  RETURN QUERY
  WITH monthly_averages AS (
    SELECT 
      EXTRACT(MONTH FROM month_start) as month_number,
      TO_CHAR(month_start, 'Month') as month_name,
      ROUND(AVG(monthly_revenue), 0) as avg_revenue,
      ROUND(AVG(final_net_profit), 0) as avg_profit,
      ROUND(AVG(final_net_margin_pct), 2) as avg_margin,
      COUNT(*) as data_points
    FROM comprehensive_monthly_profit
    WHERE user_id = p_user_id
    GROUP BY EXTRACT(MONTH FROM month_start), TO_CHAR(month_start, 'Month')
  )
  SELECT 
    ma.month_name,
    ma.month_number::integer,
    ma.avg_revenue,
    ma.avg_profit,
    ma.avg_margin,
    ma.data_points::integer,
    ROW_NUMBER() OVER (ORDER BY ma.avg_revenue DESC)::integer,
    ROW_NUMBER() OVER (ORDER BY ma.avg_profit DESC)::integer
  FROM monthly_averages ma
  ORDER BY ma.month_number;
END;
$$ LANGUAGE plpgsql;

-- 7. QUERY: Profit Goal Tracking
CREATE OR REPLACE FUNCTION track_profit_goals(
  p_user_id uuid,
  p_monthly_revenue_goal numeric,
  p_monthly_profit_goal numeric
)
RETURNS TABLE(
  period text,
  revenue_goal numeric,
  actual_revenue numeric,
  revenue_achievement numeric,
  profit_goal numeric,
  actual_profit numeric,
  profit_achievement numeric,
  overall_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cmp.period,
    p_monthly_revenue_goal,
    cmp.monthly_revenue,
    ROUND((cmp.monthly_revenue / p_monthly_revenue_goal) * 100, 2),
    p_monthly_profit_goal,
    cmp.final_net_profit,
    CASE 
      WHEN p_monthly_profit_goal != 0 
      THEN ROUND((cmp.final_net_profit / p_monthly_profit_goal) * 100, 2)
      ELSE 0 
    END,
    CASE 
      WHEN cmp.monthly_revenue >= p_monthly_revenue_goal 
       AND cmp.final_net_profit >= p_monthly_profit_goal THEN 'Goals Achieved'
      WHEN cmp.monthly_revenue >= p_monthly_revenue_goal THEN 'Revenue Goal Achieved'
      WHEN cmp.final_net_profit >= p_monthly_profit_goal THEN 'Profit Goal Achieved'
      ELSE 'Goals Not Met'
    END
  FROM comprehensive_monthly_profit cmp
  WHERE cmp.user_id = p_user_id
  ORDER BY cmp.period DESC
  LIMIT 12;
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- UTILITY QUERIES
-- =====================================

-- Quick Profit Summary Query
-- Usage: SELECT * FROM quick_profit_summary WHERE user_id = 'your-user-id';
CREATE OR REPLACE VIEW quick_profit_summary AS
SELECT 
  user_id,
  period,
  monthly_revenue,
  gross_profit,
  final_net_profit,
  final_net_margin_pct,
  revenue_growth_pct,
  profitability_status
FROM profit_trend_analysis
WHERE period >= TO_CHAR(CURRENT_DATE - INTERVAL '12 months', 'YYYY-MM')
ORDER BY user_id, period DESC;

-- Revenue vs Expenses Daily
CREATE OR REPLACE VIEW daily_cashflow AS
SELECT 
  user_id,
  date,
  daily_revenue,
  (daily_cogs + daily_opex) as daily_expenses,
  net_profit as daily_cashflow,
  SUM(net_profit) OVER (
    PARTITION BY user_id 
    ORDER BY date 
    ROWS UNBOUNDED PRECEDING
  ) as cumulative_cashflow
FROM daily_profit_summary
ORDER BY user_id, date;

-- =====================================
-- COMMENTS
-- =====================================

COMMENT ON FUNCTION get_dashboard_summary(uuid) IS 'Ringkasan lengkap untuk dashboard profit analysis';
COMMENT ON FUNCTION compare_profit_periods(uuid, text, text) IS 'Membandingkan profit antara dua periode';
COMMENT ON FUNCTION calculate_breakeven_analysis(uuid) IS 'Analisis break-even berdasarkan biaya tetap dan margin';
COMMENT ON FUNCTION get_top_revenue_days(uuid, integer, integer) IS 'Hari-hari dengan revenue tertinggi';
COMMENT ON FUNCTION analyze_expense_patterns(uuid, integer) IS 'Analisis pola pengeluaran berdasarkan kategori';
COMMENT ON FUNCTION analyze_seasonal_patterns(uuid) IS 'Analisis pola musiman profit dan revenue';
COMMENT ON FUNCTION track_profit_goals(uuid, numeric, numeric) IS 'Tracking pencapaian target profit dan revenue';
