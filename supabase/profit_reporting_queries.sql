-- =====================================
-- PROFIT REPORTING QUERIES
-- Ready-to-use queries untuk laporan bisnis
-- =====================================

-- =====================================
-- 1. EXECUTIVE DASHBOARD QUERIES
-- =====================================

-- Executive Summary - Current Month vs Previous Month
-- Usage: Ganti 'your-user-id' dengan user_id yang sebenarnya
SELECT 
  'Executive Summary' as report_type,
  current_month_revenue,
  current_month_profit,
  current_month_margin,
  revenue_growth,
  profit_growth,
  CASE 
    WHEN revenue_growth > 0 AND profit_growth > 0 THEN 'Growing'
    WHEN revenue_growth > 0 AND profit_growth <= 0 THEN 'Revenue Growth, Profit Concern'
    WHEN revenue_growth <= 0 AND profit_growth > 0 THEN 'Revenue Concern, Profit Efficiency'
    ELSE 'Needs Attention'
  END as business_health
FROM get_dashboard_summary('your-user-id');

-- YTD Performance Summary
WITH ytd_summary AS (
  SELECT 
    SUM(monthly_revenue) as ytd_revenue,
    SUM(final_net_profit) as ytd_profit,
    AVG(final_net_margin_pct) as avg_margin,
    COUNT(*) as months_data,
    MAX(monthly_revenue) as best_month_revenue,
    MIN(monthly_revenue) as worst_month_revenue
  FROM comprehensive_monthly_profit
  WHERE user_id = 'your-user-id'
  AND EXTRACT(YEAR FROM month_start) = EXTRACT(YEAR FROM CURRENT_DATE)
)
SELECT 
  'Year to Date Summary' as report_type,
  ytd_revenue,
  ytd_profit,
  ROUND(ytd_revenue / GREATEST(months_data, 1), 0) as avg_monthly_revenue,
  ROUND(ytd_profit / GREATEST(months_data, 1), 0) as avg_monthly_profit,
  ROUND(avg_margin, 2) as avg_net_margin_pct,
  best_month_revenue,
  worst_month_revenue,
  CASE 
    WHEN ytd_profit > 0 THEN 'Profitable'
    WHEN ytd_profit = 0 THEN 'Break Even'
    ELSE 'Loss Making'
  END as ytd_status
FROM ytd_summary;

-- =====================================
-- 2. FINANCIAL PERFORMANCE REPORTS
-- =====================================

-- Monthly P&L Statement (Last 12 months)
SELECT 
  period,
  monthly_revenue as revenue,
  monthly_cogs as cost_of_goods_sold,
  (monthly_revenue - monthly_cogs) as gross_profit,
  monthly_opex_transactions as variable_expenses,
  fixed_operational_costs as fixed_expenses,
  (monthly_opex_transactions + fixed_operational_costs) as total_operating_expenses,
  final_net_profit as net_profit,
  ROUND(gross_margin_pct, 2) as gross_margin_percent,
  ROUND(final_net_margin_pct, 2) as net_margin_percent
FROM comprehensive_monthly_profit
WHERE user_id = 'your-user-id'
AND period >= TO_CHAR(CURRENT_DATE - INTERVAL '12 months', 'YYYY-MM')
ORDER BY period DESC;

-- Revenue Trend Analysis (Last 6 months with growth rates)
SELECT 
  period,
  monthly_revenue,
  revenue_growth_pct,
  gross_profit,
  gross_profit_growth_pct,
  final_net_profit as net_profit,
  net_profit_growth_pct,
  revenue_trend,
  profitability_status,
  CASE 
    WHEN revenue_growth_pct > 10 THEN 'Strong Growth'
    WHEN revenue_growth_pct > 0 THEN 'Moderate Growth'
    WHEN revenue_growth_pct > -10 THEN 'Slight Decline'
    ELSE 'Significant Decline'
  END as growth_category
FROM profit_trend_analysis
WHERE user_id = 'your-user-id'
ORDER BY period DESC
LIMIT 6;

-- =====================================
-- 3. OPERATIONAL REPORTS
-- =====================================

-- Daily Performance Report (Last 30 days)
SELECT 
  date,
  TO_CHAR(date, 'Day') as day_name,
  daily_revenue,
  daily_cogs,
  daily_opex,
  net_profit as daily_profit,
  ROUND(net_margin_pct, 2) as profit_margin_pct,
  CASE 
    WHEN EXTRACT(DOW FROM date) IN (0, 6) THEN 'Weekend'
    ELSE 'Weekday'
  END as day_type,
  CASE 
    WHEN daily_revenue > 0 THEN ROUND(net_profit / daily_revenue * 100, 2)
    ELSE 0
  END as profit_margin
FROM daily_profit_summary
WHERE user_id = 'your-user-id'
AND date >= CURRENT_DATE - 30
ORDER BY date DESC;

-- Weekly Performance Summary (Last 8 weeks)
WITH weekly_data AS (
  SELECT 
    DATE_TRUNC('week', date) as week_start,
    SUM(daily_revenue) as weekly_revenue,
    SUM(net_profit) as weekly_profit,
    COUNT(*) as active_days
  FROM daily_profit_summary
  WHERE user_id = 'your-user-id'
  AND date >= CURRENT_DATE - INTERVAL '8 weeks'
  GROUP BY DATE_TRUNC('week', date)
)
SELECT 
  TO_CHAR(week_start, 'YYYY-MM-DD') as week_starting,
  weekly_revenue,
  weekly_profit,
  active_days,
  ROUND(weekly_revenue / GREATEST(active_days, 1), 0) as avg_daily_revenue,
  ROUND(weekly_profit / GREATEST(active_days, 1), 0) as avg_daily_profit,
  CASE 
    WHEN weekly_revenue > 0 THEN ROUND(weekly_profit / weekly_revenue * 100, 2)
    ELSE 0
  END as weekly_margin_pct
FROM weekly_data
ORDER BY week_start DESC;

-- =====================================
-- 4. CATEGORY PERFORMANCE REPORTS
-- =====================================

-- Top Revenue Categories (Last 3 months)
SELECT 
  revenue_category,
  SUM(total_amount) as total_revenue,
  ROUND(AVG(total_amount), 0) as avg_monthly_revenue,
  COUNT(DISTINCT period) as active_months,
  SUM(transaction_count) as total_transactions,
  ROUND(SUM(total_amount) / SUM(transaction_count), 0) as avg_per_transaction,
  ROUND(SUM(total_amount) * 100.0 / SUM(SUM(total_amount)) OVER (), 2) as percentage_of_total
FROM revenue_category_breakdown
WHERE user_id = 'your-user-id'
AND period >= TO_CHAR(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM')
GROUP BY revenue_category
ORDER BY total_revenue DESC;

-- Expense Analysis by Category (Last 3 months)
SELECT 
  expense_category,
  expense_type,
  SUM(total_amount) as total_expenses,
  ROUND(AVG(total_amount), 0) as avg_monthly_expenses,
  COUNT(DISTINCT period) as active_months,
  SUM(transaction_count) as total_transactions,
  ROUND(SUM(total_amount) * 100.0 / SUM(SUM(total_amount)) OVER (), 2) as percentage_of_total_expenses
FROM expense_category_breakdown
WHERE user_id = 'your-user-id'
AND period >= TO_CHAR(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM')
GROUP BY expense_category, expense_type
ORDER BY total_expenses DESC;

-- =====================================
-- 5. CASHFLOW REPORTS
-- =====================================

-- Daily Cashflow Trend (Last 30 days)
SELECT 
  date,
  daily_revenue as inflow,
  daily_expenses as outflow,
  daily_cashflow as net_cashflow,
  cumulative_cashflow,
  CASE 
    WHEN daily_cashflow > 0 THEN 'Positive'
    WHEN daily_cashflow = 0 THEN 'Neutral'
    ELSE 'Negative'
  END as cashflow_status
FROM daily_cashflow
WHERE user_id = 'your-user-id'
AND date >= CURRENT_DATE - 30
ORDER BY date DESC;

-- Monthly Cashflow Summary
WITH monthly_cashflow AS (
  SELECT 
    TO_CHAR(date, 'YYYY-MM') as period,
    SUM(daily_revenue) as monthly_inflow,
    SUM(daily_expenses) as monthly_outflow,
    SUM(daily_cashflow) as net_monthly_cashflow
  FROM daily_cashflow
  WHERE user_id = 'your-user-id'
  AND date >= CURRENT_DATE - INTERVAL '12 months'
  GROUP BY TO_CHAR(date, 'YYYY-MM')
)
SELECT 
  period,
  monthly_inflow,
  monthly_outflow,
  net_monthly_cashflow,
  CASE 
    WHEN monthly_outflow > 0 THEN ROUND(monthly_inflow / monthly_outflow, 2)
    ELSE NULL
  END as inflow_outflow_ratio,
  CASE 
    WHEN net_monthly_cashflow > monthly_inflow * 0.2 THEN 'Excellent'
    WHEN net_monthly_cashflow > monthly_inflow * 0.1 THEN 'Good'
    WHEN net_monthly_cashflow > 0 THEN 'Moderate'
    ELSE 'Poor'
  END as cashflow_health
FROM monthly_cashflow
ORDER BY period DESC;

-- =====================================
-- 6. COMPARATIVE REPORTS
-- =====================================

-- Month-over-Month Comparison (Last 6 months vs Previous 6 months)
WITH current_period AS (
  SELECT 
    AVG(monthly_revenue) as avg_revenue,
    AVG(final_net_profit) as avg_profit,
    AVG(final_net_margin_pct) as avg_margin
  FROM comprehensive_monthly_profit
  WHERE user_id = 'your-user-id'
  AND month_start >= CURRENT_DATE - INTERVAL '6 months'
),
previous_period AS (
  SELECT 
    AVG(monthly_revenue) as avg_revenue,
    AVG(final_net_profit) as avg_profit,
    AVG(final_net_margin_pct) as avg_margin
  FROM comprehensive_monthly_profit
  WHERE user_id = 'your-user-id'
  AND month_start BETWEEN CURRENT_DATE - INTERVAL '12 months' AND CURRENT_DATE - INTERVAL '6 months'
)
SELECT 
  'Last 6 Months' as period,
  ROUND(cp.avg_revenue, 0) as avg_monthly_revenue,
  ROUND(cp.avg_profit, 0) as avg_monthly_profit,
  ROUND(cp.avg_margin, 2) as avg_margin_pct,
  ROUND(pp.avg_revenue, 0) as prev_avg_monthly_revenue,
  ROUND(pp.avg_profit, 0) as prev_avg_monthly_profit,
  ROUND(pp.avg_margin, 2) as prev_avg_margin_pct,
  CASE 
    WHEN pp.avg_revenue > 0 THEN ROUND(((cp.avg_revenue - pp.avg_revenue) / pp.avg_revenue) * 100, 2)
    ELSE 0
  END as revenue_improvement_pct,
  CASE 
    WHEN pp.avg_profit != 0 THEN ROUND(((cp.avg_profit - pp.avg_profit) / ABS(pp.avg_profit)) * 100, 2)
    ELSE 0
  END as profit_improvement_pct
FROM current_period cp
CROSS JOIN previous_period pp;

-- =====================================
-- 7. KEY PERFORMANCE INDICATORS (KPI)
-- =====================================

-- Business KPI Dashboard
WITH kpi_data AS (
  SELECT 
    -- Revenue KPIs
    SUM(CASE WHEN period = TO_CHAR(CURRENT_DATE, 'YYYY-MM') THEN monthly_revenue ELSE 0 END) as current_month_revenue,
    SUM(CASE WHEN period = TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM') THEN monthly_revenue ELSE 0 END) as prev_month_revenue,
    
    -- Profit KPIs
    SUM(CASE WHEN period = TO_CHAR(CURRENT_DATE, 'YYYY-MM') THEN final_net_profit ELSE 0 END) as current_month_profit,
    AVG(CASE WHEN month_start >= CURRENT_DATE - INTERVAL '6 months' THEN final_net_margin_pct END) as avg_profit_margin,
    
    -- Growth KPIs
    AVG(CASE WHEN month_start >= CURRENT_DATE - INTERVAL '12 months' THEN monthly_revenue END) as avg_monthly_revenue_12m,
    COUNT(*) as total_months_data
  FROM comprehensive_monthly_profit
  WHERE user_id = 'your-user-id'
)
SELECT 
  'Business KPIs' as report_type,
  current_month_revenue,
  prev_month_revenue,
  CASE 
    WHEN prev_month_revenue > 0 THEN ROUND(((current_month_revenue - prev_month_revenue) / prev_month_revenue) * 100, 2)
    ELSE 0
  END as mom_revenue_growth_pct,
  current_month_profit,
  ROUND(avg_profit_margin, 2) as avg_profit_margin_6m,
  ROUND(avg_monthly_revenue_12m, 0) as avg_monthly_revenue_12m,
  CASE 
    WHEN avg_monthly_revenue_12m > 0 THEN ROUND((current_month_revenue / avg_monthly_revenue_12m) * 100, 2)
    ELSE 0
  END as current_vs_12m_avg_pct,
  total_months_data
FROM kpi_data;

-- =====================================
-- 8. SEASONAL ANALYSIS REPORTS
-- =====================================

-- Seasonal Performance Pattern
SELECT * FROM analyze_seasonal_patterns('your-user-id');

-- Best and Worst Performing Days
SELECT * FROM get_top_revenue_days('your-user-id', 10, 3);

-- =====================================
-- 9. GOAL TRACKING REPORTS
-- =====================================

-- Monthly Goal Achievement Report
-- Note: Sesuaikan target revenue dan profit sesuai kebutuhan
SELECT * FROM track_profit_goals('your-user-id', 10000000, 2000000); -- 10M revenue, 2M profit target

-- =====================================
-- 10. SUMMARY EXPORT QUERIES
-- =====================================

-- Complete Monthly Summary for Export (Last 12 months)
SELECT 
  cmp.period,
  cmp.monthly_revenue as "Revenue",
  cmp.monthly_cogs as "COGS", 
  cmp.gross_profit as "Gross Profit",
  cmp.total_operational_costs as "Operating Expenses",
  cmp.final_net_profit as "Net Profit",
  ROUND(cmp.gross_margin_pct, 2) as "Gross Margin %",
  ROUND(cmp.final_net_margin_pct, 2) as "Net Margin %",
  cmp.revenue_transaction_count as "Revenue Transactions",
  cmp.expense_transaction_count as "Expense Transactions",
  CASE 
    WHEN cmp.final_net_profit > 0 THEN 'Profitable'
    WHEN cmp.final_net_profit = 0 THEN 'Break Even' 
    ELSE 'Loss'
  END as "Status"
FROM comprehensive_monthly_profit cmp
WHERE cmp.user_id = 'your-user-id'
AND cmp.period >= TO_CHAR(CURRENT_DATE - INTERVAL '12 months', 'YYYY-MM')
ORDER BY cmp.period DESC;

-- Business Health Check Summary
WITH health_metrics AS (
  SELECT 
    COUNT(*) as months_with_data,
    COUNT(CASE WHEN final_net_profit > 0 THEN 1 END) as profitable_months,
    AVG(final_net_margin_pct) as avg_margin,
    STDDEV(monthly_revenue) as revenue_volatility,
    MAX(monthly_revenue) as peak_revenue,
    MIN(monthly_revenue) as lowest_revenue
  FROM comprehensive_monthly_profit
  WHERE user_id = 'your-user-id'
  AND period >= TO_CHAR(CURRENT_DATE - INTERVAL '12 months', 'YYYY-MM')
)
SELECT 
  'Business Health Check' as report_name,
  months_with_data,
  profitable_months,
  ROUND((profitable_months::numeric / GREATEST(months_with_data, 1)) * 100, 2) as profitability_rate_pct,
  ROUND(avg_margin, 2) as avg_net_margin_pct,
  ROUND(revenue_volatility, 0) as revenue_volatility,
  peak_revenue,
  lowest_revenue,
  CASE 
    WHEN (profitable_months::numeric / GREATEST(months_with_data, 1)) >= 0.8 THEN 'Excellent'
    WHEN (profitable_months::numeric / GREATEST(months_with_data, 1)) >= 0.6 THEN 'Good'
    WHEN (profitable_months::numeric / GREATEST(months_with_data, 1)) >= 0.4 THEN 'Fair'
    ELSE 'Needs Improvement'
  END as health_rating
FROM health_metrics;

-- =====================================
-- USAGE NOTES
-- =====================================

/*
CARA PENGGUNAAN:

1. Ganti 'your-user-id' dengan UUID user yang sebenarnya
2. Sesuaikan target di goal tracking sesuai kebutuhan bisnis
3. Ubah periode waktu sesuai kebutuhan (3 months, 6 months, 12 months)
4. Untuk export ke Excel/CSV, gunakan query "Complete Monthly Summary for Export"

CONTOH PENGGUNAAN:
-- Dashboard summary
SELECT * FROM get_dashboard_summary('123e4567-e89b-12d3-a456-426614174000');

-- Monthly profit calculation
SELECT * FROM auto_calculate_monthly_profit('123e4567-e89b-12d3-a456-426614174000');

-- Bulk calculation for last 6 months
SELECT * FROM bulk_calculate_profit('123e4567-e89b-12d3-a456-426614174000', 6);
*/
