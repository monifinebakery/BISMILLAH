# Profit Analysis System Documentation

Sistem analisis profit komprehensif untuk Supabase dengan fitur lengkap untuk tracking, analisis, dan reporting profit bisnis.

## 📁 File Structure

```
supabase/
├── migrations/
│   ├── 20250124000000_create_profit_analysis_schema.sql    # Schema lengkap
│   └── 20250124100000_profit_analysis_only.sql            # Schema sederhana
├── profit_analysis_views.sql                              # Views untuk dashboard
├── advanced_profit_queries.sql                            # Advanced analysis queries
├── profit_procedures.sql                                  # Stored procedures
├── profit_reporting_queries.sql                           # Ready-to-use reports
└── README_PROFIT_ANALYSIS.md                             # Dokumentasi ini
```

## 🗄️ Database Schema

### Core Tables

#### 1. `financial_transactions`
Tabel utama untuk tracking semua transaksi keuangan:
- **Income**: Penjualan, pendapatan jasa, dll
- **Expense**: Pembelian bahan baku, biaya operasional, dll

```sql
CREATE TABLE financial_transactions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  type text CHECK (type IN ('income', 'expense')),
  category text,
  amount numeric NOT NULL,
  description text,
  date date NOT NULL,
  notes text
);
```

#### 2. `operational_costs`
Biaya operasional tetap dan variabel bulanan:

```sql
CREATE TABLE operational_costs (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  nama_biaya text NOT NULL,
  jumlah_per_bulan numeric NOT NULL,
  jenis text CHECK (jenis IN ('tetap', 'variabel')),
  status text DEFAULT 'aktif'
);
```

#### 3. `profit_analysis`
Hasil kalkulasi profit per periode:

```sql
CREATE TABLE profit_analysis (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  period text NOT NULL,
  period_type text CHECK (period_type IN ('daily', 'monthly', 'quarterly', 'yearly')),
  total_revenue numeric DEFAULT 0,
  total_cogs numeric DEFAULT 0,
  total_opex numeric DEFAULT 0,
  gross_profit numeric DEFAULT 0,
  net_profit numeric DEFAULT 0,
  gross_margin numeric DEFAULT 0,
  net_margin numeric DEFAULT 0
);
```

### Supporting Tables

- `bahan_baku`: Master data bahan baku dengan WAC support
- `hpp_recipes`: Recipe costing untuk calculate COGS
- `orders`: Data penjualan/pesanan
- `purchases`: Data pembelian bahan baku
- `suppliers`: Master data supplier
- `activities`: Audit trail dan logging

## 📊 Views & Dashboard

### 1. Daily Profit Summary
```sql
SELECT * FROM daily_profit_summary 
WHERE user_id = 'your-user-id' 
AND date >= CURRENT_DATE - 30;
```

### 2. Monthly Profit Summary
```sql
SELECT * FROM monthly_profit_summary 
WHERE user_id = 'your-user-id'
ORDER BY period DESC;
```

### 3. Comprehensive Monthly Profit (dengan operational costs)
```sql
SELECT * FROM comprehensive_monthly_profit 
WHERE user_id = 'your-user-id'
ORDER BY period DESC;
```

### 4. Profit Trend Analysis (dengan growth calculations)
```sql
SELECT * FROM profit_trend_analysis 
WHERE user_id = 'your-user-id'
ORDER BY period DESC;
```

## 🔧 Functions & Procedures

### Dashboard Functions

#### 1. `get_dashboard_summary(user_id)`
Ringkasan lengkap untuk dashboard profit analysis:

```sql
SELECT * FROM get_dashboard_summary('your-user-id');
```

Returns:
- Current month revenue & profit
- Previous month comparison
- Growth percentages
- YTD numbers
- Best/worst performing categories

#### 2. `compare_profit_periods(user_id, period1, period2)`
Membandingkan profit antara dua periode:

```sql
SELECT * FROM compare_profit_periods('your-user-id', '2024-01', '2024-02');
```

### Calculation Functions

#### 3. `auto_calculate_monthly_profit(user_id, month)`
Menghitung dan menyimpan profit analysis untuk bulan tertentu:

```sql
SELECT * FROM auto_calculate_monthly_profit('your-user-id', '2024-01');
```

#### 4. `bulk_calculate_profit(user_id, months_back)`
Menghitung profit untuk beberapa bulan sekaligus:

```sql
SELECT * FROM bulk_calculate_profit('your-user-id', 12);
```

### Analysis Functions

#### 5. `calculate_breakeven_analysis(user_id)`
Analisis break-even berdasarkan biaya tetap dan margin:

```sql
SELECT * FROM calculate_breakeven_analysis('your-user-id');
```

#### 6. `analyze_seasonal_patterns(user_id)`
Analisis pola musiman profit dan revenue:

```sql
SELECT * FROM analyze_seasonal_patterns('your-user-id');
```

#### 7. `get_top_revenue_days(user_id, limit, months_back)`
Hari-hari dengan revenue tertinggi:

```sql
SELECT * FROM get_top_revenue_days('your-user-id', 10, 3);
```

### Utility Functions

#### 8. `auto_categorize_transactions(user_id)`
Otomatis mengkategorikan transaksi berdasarkan deskripsi:

```sql
SELECT * FROM auto_categorize_transactions('your-user-id');
```

#### 9. `generate_profit_report(user_id, start_period, end_period)`
Generate laporan profit untuk periode tertentu:

```sql
SELECT * FROM generate_profit_report('your-user-id', '2024-01', '2024-06');
```

## 📈 Ready-to-Use Reports

### Executive Dashboard
```sql
-- Executive Summary
SELECT * FROM get_dashboard_summary('your-user-id');

-- YTD Performance
WITH ytd_summary AS (
  SELECT 
    SUM(monthly_revenue) as ytd_revenue,
    SUM(final_net_profit) as ytd_profit,
    AVG(final_net_margin_pct) as avg_margin
  FROM comprehensive_monthly_profit
  WHERE user_id = 'your-user-id'
  AND EXTRACT(YEAR FROM month_start) = EXTRACT(YEAR FROM CURRENT_DATE)
)
SELECT * FROM ytd_summary;
```

### Financial Performance
```sql
-- Monthly P&L Statement (Last 12 months)
SELECT 
  period,
  monthly_revenue as revenue,
  monthly_cogs as cost_of_goods_sold,
  gross_profit,
  total_operational_costs as operating_expenses,
  final_net_profit as net_profit,
  ROUND(final_net_margin_pct, 2) as net_margin_percent
FROM comprehensive_monthly_profit
WHERE user_id = 'your-user-id'
AND period >= TO_CHAR(CURRENT_DATE - INTERVAL '12 months', 'YYYY-MM')
ORDER BY period DESC;
```

### Category Analysis
```sql
-- Top Revenue Categories (Last 3 months)
SELECT 
  revenue_category,
  SUM(total_amount) as total_revenue,
  ROUND(AVG(total_amount), 0) as avg_monthly_revenue,
  ROUND(SUM(total_amount) * 100.0 / SUM(SUM(total_amount)) OVER (), 2) as percentage_of_total
FROM revenue_category_breakdown
WHERE user_id = 'your-user-id'
AND period >= TO_CHAR(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM')
GROUP BY revenue_category
ORDER BY total_revenue DESC;
```

### Cashflow Reports
```sql
-- Daily Cashflow (Last 30 days)
SELECT 
  date,
  daily_revenue as inflow,
  daily_expenses as outflow,
  daily_cashflow as net_cashflow,
  cumulative_cashflow
FROM daily_cashflow
WHERE user_id = 'your-user-id'
AND date >= CURRENT_DATE - 30
ORDER BY date DESC;
```

## 🚀 Quick Start

### 1. Setup Database
```sql
-- Run the main migration
\i 20250124000000_create_profit_analysis_schema.sql

-- Create views
\i profit_analysis_views.sql

-- Create advanced functions
\i advanced_profit_queries.sql

-- Create procedures
\i profit_procedures.sql
```

### 2. Insert Sample Data
```sql
-- Insert sample data for testing
SELECT seed_profit_analysis_sample_data('your-user-id');
```

### 3. Calculate Initial Profit Data
```sql
-- Calculate profit for last 6 months
SELECT * FROM bulk_calculate_profit('your-user-id', 6);
```

### 4. View Dashboard
```sql
-- Get dashboard summary
SELECT * FROM get_dashboard_summary('your-user-id');

-- View monthly trends
SELECT * FROM quick_profit_summary WHERE user_id = 'your-user-id';
```

## 💡 Usage Examples

### Basic Profit Tracking

1. **Add Income Transaction**:
```sql
INSERT INTO financial_transactions (user_id, type, category, amount, description, date)
VALUES ('your-user-id', 'income', 'Penjualan', 500000, 'Penjualan kue hari ini', CURRENT_DATE);
```

2. **Add Expense Transaction**:
```sql
INSERT INTO financial_transactions (user_id, type, category, amount, description, date)
VALUES ('your-user-id', 'expense', 'Bahan Baku', 150000, 'Beli tepung dan gula', CURRENT_DATE);
```

3. **Calculate Monthly Profit**:
```sql
SELECT * FROM auto_calculate_monthly_profit('your-user-id');
```

### Advanced Analysis

1. **Seasonal Analysis**:
```sql
SELECT * FROM analyze_seasonal_patterns('your-user-id');
```

2. **Break-even Analysis**:
```sql
SELECT * FROM calculate_breakeven_analysis('your-user-id');
```

3. **Goal Tracking**:
```sql
-- Track against 10M revenue, 2M profit target
SELECT * FROM track_profit_goals('your-user-id', 10000000, 2000000);
```

### Reporting

1. **Monthly Report Export**:
```sql
SELECT 
  period,
  monthly_revenue as "Revenue",
  final_net_profit as "Net Profit",
  ROUND(final_net_margin_pct, 2) as "Net Margin %"
FROM comprehensive_monthly_profit
WHERE user_id = 'your-user-id'
ORDER BY period DESC;
```

2. **Business Health Check**:
```sql
WITH health_metrics AS (
  SELECT 
    COUNT(*) as months_with_data,
    COUNT(CASE WHEN final_net_profit > 0 THEN 1 END) as profitable_months,
    AVG(final_net_margin_pct) as avg_margin
  FROM comprehensive_monthly_profit
  WHERE user_id = 'your-user-id'
  AND period >= TO_CHAR(CURRENT_DATE - INTERVAL '12 months', 'YYYY-MM')
)
SELECT 
  months_with_data,
  profitable_months,
  ROUND((profitable_months::numeric / GREATEST(months_with_data, 1)) * 100, 2) as profitability_rate_pct,
  ROUND(avg_margin, 2) as avg_net_margin_pct
FROM health_metrics;
```

## 🔐 Security

### Row Level Security (RLS)
Semua tabel menggunakan RLS untuk memastikan user hanya bisa akses data mereka sendiri:

```sql
-- Example policy
CREATE POLICY "Users can manage their own financial transactions" ON financial_transactions
  FOR ALL USING (auth.uid() = user_id);
```

### API Usage dengan Supabase JS

```javascript
// Get dashboard summary
const { data, error } = await supabase
  .rpc('get_dashboard_summary', {
    p_user_id: user.id
  });

// Calculate monthly profit
const { data, error } = await supabase
  .rpc('auto_calculate_monthly_profit', {
    p_user_id: user.id,
    p_month: '2024-01'
  });

// Get monthly profit data
const { data, error } = await supabase
  .from('comprehensive_monthly_profit')
  .select('*')
  .eq('user_id', user.id)
  .order('period', { ascending: false })
  .limit(12);
```

## 📊 Key Metrics

### Financial KPIs
- **Revenue Growth**: Month-over-month dan year-over-year
- **Profit Margins**: Gross margin dan net margin
- **Break-even Point**: Berdasarkan fixed costs dan margin
- **Cashflow**: Daily, weekly, monthly trends

### Operational KPIs
- **Average Revenue per Transaction**
- **Cost Structure Analysis** (COGS vs OpEx)
- **Seasonal Patterns**
- **Category Performance**

### Business Health Indicators
- **Profitability Rate**: Percentage of profitable months
- **Revenue Volatility**: Standard deviation of monthly revenue
- **Growth Trajectory**: Trend analysis
- **Goal Achievement**: Target vs actual performance

## 🛠️ Maintenance

### Automated Tasks
```sql
-- Daily profit calculation (can be scheduled)
SELECT daily_profit_calculation();

-- Cleanup old data (run monthly)
SELECT * FROM cleanup_profit_data('your-user-id', 24); -- Keep 24 months
```

### Data Quality
```sql
-- Auto-categorize uncategorized transactions
SELECT * FROM auto_categorize_transactions('your-user-id');

-- Update material costs with WAC
SELECT * FROM update_material_wac('your-user-id', 'bahan-id', 10, 12000);
```

## 🎯 Best Practices

1. **Regular Data Entry**: Input transaksi secara konsisten setiap hari
2. **Proper Categorization**: Gunakan kategori yang konsisten untuk revenue dan expense
3. **Monthly Calculation**: Jalankan `auto_calculate_monthly_profit` setiap akhir bulan
4. **Monitor Trends**: Review profit trend analysis secara berkala
5. **Set Goals**: Gunakan goal tracking untuk monitoring target
6. **Backup Data**: Regular backup untuk financial data

## 🆘 Troubleshooting

### Common Issues

1. **Missing Profit Data**:
```sql
-- Recalculate missing months
SELECT * FROM bulk_calculate_profit('your-user-id', 12);
```

2. **Incorrect Categories**:
```sql
-- Fix categorization
UPDATE financial_transactions 
SET category = 'Bahan Baku'
WHERE user_id = 'your-user-id' 
AND category = 'Bahan';
```

3. **Performance Issues**:
```sql
-- Check index usage
EXPLAIN ANALYZE SELECT * FROM comprehensive_monthly_profit WHERE user_id = 'your-user-id';

-- Update statistics
ANALYZE financial_transactions;
```

## 📞 Support

Untuk pertanyaan atau issues:
1. Check dokumentasi ini terlebih dahulu
2. Review sample queries di `profit_reporting_queries.sql`
3. Test dengan sample data menggunakan `seed_profit_analysis_sample_data()`

---

**Created**: January 2025  
**Version**: 1.0  
**Compatible**: Supabase PostgreSQL 15+
