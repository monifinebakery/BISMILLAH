-- =====================================
-- PROFIT ANALYSIS VIEWS & DASHBOARDS
-- SQL Views untuk memudahkan profit analysis
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

-- 2. VIEW: Monthly Profit Summary
CREATE OR REPLACE VIEW monthly_profit_summary AS
SELECT 
  ft.user_id,
  TO_CHAR(ft.date, 'YYYY-MM') as period,
  DATE_TRUNC('month', ft.date) as month_start,
  
  -- Revenue
  COALESCE(SUM(CASE WHEN ft.type = 'income' THEN ft.amount END), 0) as monthly_revenue,
  
  -- COGS
  COALESCE(SUM(CASE 
    WHEN ft.type = 'expense' 
    AND (ft.category ILIKE '%bahan%' OR ft.category ILIKE '%cogs%' OR ft.category ILIKE '%hpp%')
    THEN ft.amount 
  END), 0) as monthly_cogs,
  
  -- Operational Expenses dari transactions
  COALESCE(SUM(CASE 
    WHEN ft.type = 'expense' 
    AND NOT (ft.category ILIKE '%bahan%' OR ft.category ILIKE '%cogs%' OR ft.category ILIKE '%hpp%')
    THEN ft.amount 
  END), 0) as monthly_opex_transactions,
  
  -- Gross & Net Profit
  COALESCE(SUM(CASE WHEN ft.type = 'income' THEN ft.amount END), 0) - 
  COALESCE(SUM(CASE 
    WHEN ft.type = 'expense' 
    AND (ft.category ILIKE '%bahan%' OR ft.category ILIKE '%cogs%' OR ft.category ILIKE '%hpp%')
    THEN ft.amount 
  END), 0) as gross_profit,
  
  COALESCE(SUM(CASE WHEN ft.type = 'income' THEN ft.amount END), 0) - 
  COALESCE(SUM(CASE WHEN ft.type = 'expense' THEN ft.amount END), 0) as net_profit_before_fixed_costs,
  
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
  
  -- Transaction count for insights
  COUNT(CASE WHEN ft.type = 'income' THEN 1 END) as revenue_transaction_count,
  COUNT(CASE WHEN ft.type = 'expense' THEN 1 END) as expense_transaction_count,
  
  -- Average per transaction
  CASE 
    WHEN COUNT(CASE WHEN ft.type = 'income' THEN 1 END) > 0
    THEN ROUND(SUM(CASE WHEN ft.type = 'income' THEN ft.amount END) / COUNT(CASE WHEN ft.type = 'income' THEN 1 END), 0)
    ELSE 0
  END as avg_revenue_per_transaction

FROM financial_transactions ft
GROUP BY ft.user_id, TO_CHAR(ft.date, 'YYYY-MM'), DATE_TRUNC('month', ft.date)
ORDER BY TO_CHAR(ft.date, 'YYYY-MM') DESC;

-- 3. VIEW: Comprehensive Monthly Profit (dengan operational costs)
CREATE OR REPLACE VIEW comprehensive_monthly_profit AS
SELECT 
  mps.*,
  
  -- Fixed operational costs from operational_costs table
  COALESCE(oc.total_fixed_costs, 0) as fixed_operational_costs,
  COALESCE(oc.total_variable_costs, 0) as variable_operational_costs,
  COALESCE(oc.total_operational_costs, 0) as total_operational_costs,
  
  -- Final calculations
  mps.gross_profit - COALESCE(oc.total_operational_costs, 0) as final_net_profit,
  
  CASE 
    WHEN mps.monthly_revenue > 0 
    THEN ROUND(
      ((mps.gross_profit - COALESCE(oc.total_operational_costs, 0)) / mps.monthly_revenue) * 100, 
      2
    )
    ELSE 0 
  END as final_net_margin_pct

FROM monthly_profit_summary mps
LEFT JOIN (
  SELECT 
    user_id,
    SUM(CASE WHEN jenis = 'tetap' THEN jumlah_per_bulan ELSE 0 END) as total_fixed_costs,
    SUM(CASE WHEN jenis = 'variabel' THEN jumlah_per_bulan ELSE 0 END) as total_variable_costs,
    SUM(jumlah_per_bulan) as total_operational_costs
  FROM operational_costs 
  WHERE status = 'aktif'
  GROUP BY user_id
) oc ON mps.user_id = oc.user_id;

-- 4. VIEW: Revenue Category Breakdown
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

-- 5. VIEW: Expense Category Breakdown
CREATE OR REPLACE VIEW expense_category_breakdown AS
SELECT 
  ft.user_id,
  TO_CHAR(ft.date, 'YYYY-MM') as period,
  COALESCE(ft.category, 'Tidak Dikategorikan') as expense_category,
  CASE 
    WHEN ft.category ILIKE '%bahan%' OR ft.category ILIKE '%cogs%' OR ft.category ILIKE '%hpp%'
    THEN 'COGS'
    ELSE 'Operating Expense'
  END as expense_type,
  COUNT(*) as transaction_count,
  SUM(ft.amount) as total_amount,
  ROUND(AVG(ft.amount), 0) as avg_amount

FROM financial_transactions ft
WHERE ft.type = 'expense'
GROUP BY ft.user_id, TO_CHAR(ft.date, 'YYYY-MM'), ft.category
ORDER BY TO_CHAR(ft.date, 'YYYY-MM') DESC, SUM(ft.amount) DESC;

-- 6. VIEW: Profit Trend Analysis
CREATE OR REPLACE VIEW profit_trend_analysis AS
WITH monthly_data AS (
  SELECT *,
    LAG(monthly_revenue) OVER (PARTITION BY user_id ORDER BY period) as prev_revenue,
    LAG(gross_profit) OVER (PARTITION BY user_id ORDER BY period) as prev_gross_profit,
    LAG(final_net_profit) OVER (PARTITION BY user_id ORDER BY period) as prev_net_profit
  FROM comprehensive_monthly_profit
)
SELECT 
  *,
  
  -- Growth calculations
  CASE 
    WHEN prev_revenue IS NOT NULL AND prev_revenue > 0
    THEN ROUND(((monthly_revenue - prev_revenue) / prev_revenue) * 100, 2)
    ELSE NULL
  END as revenue_growth_pct,
  
  CASE 
    WHEN prev_gross_profit IS NOT NULL AND prev_gross_profit != 0
    THEN ROUND(((gross_profit - prev_gross_profit) / ABS(prev_gross_profit)) * 100, 2)
    ELSE NULL
  END as gross_profit_growth_pct,
  
  CASE 
    WHEN prev_net_profit IS NOT NULL AND prev_net_profit != 0
    THEN ROUND(((final_net_profit - prev_net_profit) / ABS(prev_net_profit)) * 100, 2)
    ELSE NULL
  END as net_profit_growth_pct,
  
  -- Performance indicators
  CASE 
    WHEN monthly_revenue > COALESCE(prev_revenue, 0) THEN 'Growing'
    WHEN monthly_revenue < COALESCE(prev_revenue, monthly_revenue) THEN 'Declining'
    ELSE 'Stable'
  END as revenue_trend,
  
  CASE 
    WHEN final_net_profit > 0 THEN 'Profitable'
    WHEN final_net_profit = 0 THEN 'Break Even'
    ELSE 'Loss'
  END as profitability_status

FROM monthly_data
ORDER BY user_id, period DESC;

-- 7. VIEW: Top Performing Categories
CREATE OR REPLACE VIEW top_performing_categories AS
SELECT 
  user_id,
  'Revenue' as metric_type,
  revenue_category as category,
  SUM(total_amount) as total_amount,
  COUNT(DISTINCT period) as periods_active,
  ROUND(AVG(total_amount), 0) as avg_monthly_amount
FROM revenue_category_breakdown
GROUP BY user_id, revenue_category

UNION ALL

SELECT 
  user_id,
  'Expense' as metric_type,
  expense_category as category,
  SUM(total_amount) as total_amount,
  COUNT(DISTINCT period) as periods_active,
  ROUND(AVG(total_amount), 0) as avg_monthly_amount
FROM expense_category_breakdown
GROUP BY user_id, expense_category

ORDER BY user_id, metric_type, total_amount DESC;

-- =====================================
-- MATERIALIZED VIEWS (Opsional)
-- Untuk performance yang lebih baik
-- =====================================

-- Uncomment jika ingin menggunakan materialized views
-- CREATE MATERIALIZED VIEW mv_monthly_profit_summary AS
-- SELECT * FROM monthly_profit_summary;

-- CREATE UNIQUE INDEX ON mv_monthly_profit_summary (user_id, period);

-- =====================================
-- COMMENTS
-- =====================================

COMMENT ON VIEW daily_profit_summary IS 'Ringkasan profit harian dengan perhitungan gross dan net profit';
COMMENT ON VIEW monthly_profit_summary IS 'Ringkasan profit bulanan dari financial transactions';
COMMENT ON VIEW comprehensive_monthly_profit IS 'Profit bulanan lengkap termasuk biaya operasional tetap';
COMMENT ON VIEW revenue_category_breakdown IS 'Breakdown revenue berdasarkan kategori per bulan';
COMMENT ON VIEW expense_category_breakdown IS 'Breakdown expense berdasarkan kategori dan tipe';
COMMENT ON VIEW profit_trend_analysis IS 'Analisis trend profit dengan growth calculations';
COMMENT ON VIEW top_performing_categories IS 'Kategori revenue dan expense dengan performa terbaik';
