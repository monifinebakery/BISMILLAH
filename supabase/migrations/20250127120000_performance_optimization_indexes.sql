-- Performance Optimization Indexes
-- This migration adds optimized indexes for better query performance

-- Financial Transactions Optimizations
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_date_type 
ON financial_transactions(user_id, date DESC, type);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_amount_range 
ON financial_transactions(amount) WHERE amount > 0;

CREATE INDEX IF NOT EXISTS idx_financial_transactions_category_date 
ON financial_transactions(category, date DESC) WHERE category IS NOT NULL;

-- Bahan Baku Optimizations
CREATE INDEX IF NOT EXISTS idx_bahan_baku_user_kategori_stok 
ON bahan_baku(user_id, kategori, stok);

CREATE INDEX IF NOT EXISTS idx_bahan_baku_low_stock 
ON bahan_baku(user_id, stok, minimum) WHERE stok <= minimum;

CREATE INDEX IF NOT EXISTS idx_bahan_baku_search 
ON bahan_baku USING gin(to_tsvector('indonesian', nama));

-- Purchases Optimizations
CREATE INDEX IF NOT EXISTS idx_purchases_user_tanggal_status 
ON purchases(user_id, tanggal DESC, status);

CREATE INDEX IF NOT EXISTS idx_purchases_supplier_date 
ON purchases(supplier, tanggal DESC) WHERE supplier IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchases_total_nilai 
ON purchases(total_nilai) WHERE total_nilai > 0;

-- Orders Optimizations
CREATE INDEX IF NOT EXISTS idx_orders_user_created_status 
ON orders(user_id, created_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_items_gin 
ON orders USING gin(items);

-- Operational Costs Optimizations
CREATE INDEX IF NOT EXISTS idx_operational_costs_user_created_jenis 
ON operational_costs(user_id, created_at DESC, jenis);

CREATE INDEX IF NOT EXISTS idx_operational_costs_jumlah_range 
ON operational_costs(jumlah_per_bulan) WHERE jumlah_per_bulan > 0;

-- Activities Optimizations
CREATE INDEX IF NOT EXISTS idx_activities_user_type_created 
ON activities(user_id, type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activities_type_value 
ON activities(type, value) WHERE value IS NOT NULL;

-- Recipes Optimizations
CREATE INDEX IF NOT EXISTS idx_recipes_user_nama_resep 
ON recipes(user_id, nama_resep);

CREATE INDEX IF NOT EXISTS idx_recipes_bahan_gin 
ON recipes USING gin(bahan_resep);

-- Suppliers Optimizations
CREATE INDEX IF NOT EXISTS idx_suppliers_user_nama 
ON suppliers(user_id, nama);

CREATE INDEX IF NOT EXISTS idx_suppliers_kontak 
ON suppliers(user_id, kontak);

-- Create materialized view for dashboard financial summary
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_financial_summary AS
SELECT 
    user_id,
    DATE_TRUNC('month', date) as month,
    type,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount
FROM financial_transactions 
WHERE date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY user_id, DATE_TRUNC('month', date), type;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_financial_summary_unique 
ON dashboard_financial_summary(user_id, month, type);

-- Function for estimated count (faster than COUNT(*))
CREATE OR REPLACE FUNCTION estimated_count(table_name text)
RETURNS bigint AS $$
DECLARE
    result bigint;
BEGIN
    EXECUTE format('SELECT reltuples::bigint FROM pg_class WHERE relname = %L', table_name) INTO result;
    RETURN COALESCE(result, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW dashboard_financial_summary;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to refresh materialized views (requires pg_cron extension)
-- This will run daily at 2 AM
-- SELECT cron.schedule('refresh-dashboard-views', '0 2 * * *', 'SELECT refresh_dashboard_views();');

COMMIT;