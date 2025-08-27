-- Database Query Performance Analysis and Optimization
-- Analisis performa query dan optimasi indeks untuk aplikasi UMKM

-- =============================================
-- ANALISIS QUERY YANG SERING DIGUNAKAN
-- =============================================

-- 1. FINANCIAL TRANSACTIONS - Query paling sering digunakan
-- Query pagination dengan filter user_id dan sorting by date
-- Current query: SELECT * FROM financial_transactions WHERE user_id = ? ORDER BY date DESC LIMIT ? OFFSET ?

-- Indeks yang sudah ada:
-- idx_financial_transactions_user_date (user_id, date DESC) ✅
-- idx_fin_tx_user (user_id) ✅
-- idx_fin_tx_date (date) ✅
-- idx_fin_tx_type (type) ✅

-- Rekomendasi indeks tambahan untuk optimasi:
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_type_date 
ON financial_transactions(user_id, type, date DESC);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_category_date 
ON financial_transactions(user_id, category, date DESC);

-- Indeks untuk query range tanggal yang sering digunakan
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date_range 
ON financial_transactions(date) WHERE date IS NOT NULL;

-- =============================================
-- 2. BAHAN BAKU (WAREHOUSE) - Query inventory
-- =============================================

-- Query yang sering digunakan:
-- - Pagination dengan user_id
-- - Filter berdasarkan kategori
-- - Pencarian berdasarkan nama
-- - Filter stok rendah (stok <= minimum)

-- Indeks yang sudah ada:
-- idx_bahan_baku_user_id (user_id) ✅
-- idx_bahan_baku_user_kategori (user_id, kategori) ✅
-- idx_bahan_baku_stok (stok) WHERE stok <= minimum ✅
-- idx_bahan_baku_nama (nama) ✅

-- Rekomendasi indeks tambahan:
CREATE INDEX IF NOT EXISTS idx_bahan_baku_nama_trgm 
ON bahan_baku USING gin(nama gin_trgm_ops);

-- Indeks untuk pencarian case-insensitive
CREATE INDEX IF NOT EXISTS idx_bahan_baku_nama_lower 
ON bahan_baku(user_id, lower(nama));

-- Indeks composite untuk filter kategori + stok rendah
CREATE INDEX IF NOT EXISTS idx_bahan_baku_user_kategori_stok 
ON bahan_baku(user_id, kategori, stok) WHERE stok <= minimum;

-- =============================================
-- 3. PURCHASES - Query pembelian
-- =============================================

-- Query yang sering digunakan:
-- - Pagination dengan user_id
-- - Filter berdasarkan status
-- - Filter berdasarkan supplier
-- - Pencarian dalam items (JSONB)
-- - Sorting berdasarkan tanggal

-- Indeks yang sudah ada:
-- idx_purchases_user_id (user_id) ✅
-- idx_purchases_user_status (user_id, status) ✅
-- idx_purchases_status (status) ✅
-- idx_purchases_supplier (supplier) ✅
-- idx_purchases_tanggal (tanggal) ✅
-- idx_purchases_items_gin (items) USING gin ✅

-- Rekomendasi indeks tambahan:
CREATE INDEX IF NOT EXISTS idx_purchases_user_tanggal_desc 
ON purchases(user_id, tanggal DESC);

-- Indeks untuk pencarian supplier dengan user_id
CREATE INDEX IF NOT EXISTS idx_purchases_user_supplier 
ON purchases(user_id, supplier);

-- Indeks untuk filter status + tanggal
CREATE INDEX IF NOT EXISTS idx_purchases_user_status_tanggal 
ON purchases(user_id, status, tanggal DESC);

-- =============================================
-- 4. ORDERS - Query pesanan
-- =============================================

-- Query yang sering digunakan:
-- - Pagination dengan user_id
-- - Filter berdasarkan status
-- - Sorting berdasarkan tanggal
-- - Pencarian dalam items (JSONB)

-- Indeks yang sudah ada:
-- idx_orders_user_id (user_id) ✅
-- idx_orders_user_status (user_id, status) ✅
-- idx_orders_status (status) ✅
-- idx_orders_tanggal (tanggal) ✅
-- idx_orders_items_gin (items) USING gin ✅

-- Rekomendasi indeks tambahan:
CREATE INDEX IF NOT EXISTS idx_orders_user_tanggal_desc 
ON orders(user_id, tanggal DESC);

-- Indeks untuk filter status + tanggal
CREATE INDEX IF NOT EXISTS idx_orders_user_status_tanggal 
ON orders(user_id, status, tanggal DESC);

-- =============================================
-- 5. OPERATIONAL COSTS - Query biaya operasional
-- =============================================

-- Indeks yang sudah ada cukup baik:
-- idx_operational_costs_user_status_effective (user_id, status, effective_date) ✅
-- idx_operational_costs_user_group (user_id, group) ✅
-- idx_operational_costs_group_status (group, status) ✅

-- Rekomendasi indeks tambahan untuk query tanggal range:
CREATE INDEX IF NOT EXISTS idx_operational_costs_user_effective_date 
ON operational_costs(user_id, effective_date DESC) WHERE status = 'active';

-- =============================================
-- 6. ACTIVITIES - Query aktivitas/log
-- =============================================

-- Indeks yang sudah ada:
-- idx_activities_user_date (user_id, created_at DESC) ✅
-- idx_activities_user_id (user_id) ✅

-- Rekomendasi indeks tambahan untuk filter berdasarkan tipe aktivitas:
CREATE INDEX IF NOT EXISTS idx_activities_user_type_date 
ON activities(user_id, type, created_at DESC);

-- =============================================
-- OPTIMASI QUERY KHUSUS
-- =============================================

-- 1. Optimasi untuk count queries (pagination)
-- Gunakan estimated count untuk tabel besar
CREATE OR REPLACE FUNCTION get_estimated_count(table_name text, where_clause text DEFAULT '')
RETURNS bigint AS $$
DECLARE
    result bigint;
    query_text text;
BEGIN
    -- Untuk tabel kecil (< 10000 rows), gunakan COUNT exact
    query_text := format('SELECT reltuples::bigint FROM pg_class WHERE relname = %L', table_name);
    EXECUTE query_text INTO result;
    
    IF result < 10000 THEN
        IF where_clause = '' THEN
            query_text := format('SELECT COUNT(*) FROM %I', table_name);
        ELSE
            query_text := format('SELECT COUNT(*) FROM %I WHERE %s', table_name, where_clause);
        END IF;
        EXECUTE query_text INTO result;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Materialized view untuk dashboard analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_stats AS
SELECT 
    user_id,
    COUNT(CASE WHEN type = 'income' THEN 1 END) as total_income_transactions,
    COUNT(CASE WHEN type = 'expense' THEN 1 END) as total_expense_transactions,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
    DATE_TRUNC('month', date) as month_year
FROM financial_transactions 
WHERE date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY user_id, DATE_TRUNC('month', date);

CREATE UNIQUE INDEX idx_dashboard_stats_user_month 
ON dashboard_stats(user_id, month_year);

-- Refresh materialized view secara berkala
-- Jalankan setiap hari pada jam 2 pagi
-- REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;

-- =============================================
-- MONITORING QUERY PERFORMANCE
-- =============================================

-- Query untuk memonitor slow queries
-- Aktifkan pg_stat_statements extension terlebih dahulu
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Query untuk melihat query yang paling lambat
/*
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query LIKE '%financial_transactions%' 
   OR query LIKE '%bahan_baku%'
   OR query LIKE '%purchases%'
   OR query LIKE '%orders%'
ORDER BY mean_time DESC 
LIMIT 10;
*/

-- Query untuk melihat index usage
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/

-- =============================================
-- VACUUM DAN ANALYZE RECOMMENDATIONS
-- =============================================

-- Jalankan VACUUM ANALYZE secara berkala untuk tabel yang sering diupdate
-- VACUUM ANALYZE financial_transactions;
-- VACUUM ANALYZE bahan_baku;
-- VACUUM ANALYZE purchases;
-- VACUUM ANALYZE orders;
-- VACUUM ANALYZE operational_costs;

-- =============================================
-- CONNECTION POOLING RECOMMENDATIONS
-- =============================================

-- Untuk aplikasi dengan banyak concurrent users:
-- 1. Gunakan connection pooling (PgBouncer)
-- 2. Set max_connections sesuai kebutuhan
-- 3. Gunakan prepared statements untuk query yang sering digunakan
-- 4. Implementasi query result caching di aplikasi level

-- =============================================
-- PARTITIONING RECOMMENDATIONS
-- =============================================

-- Untuk tabel yang sangat besar (> 1 juta rows), pertimbangkan partitioning:
-- Contoh partitioning financial_transactions berdasarkan tanggal:

/*
-- Buat tabel parent
CREATE TABLE financial_transactions_partitioned (
    LIKE financial_transactions INCLUDING ALL
) PARTITION BY RANGE (date);

-- Buat partisi per bulan
CREATE TABLE financial_transactions_2024_01 
PARTITION OF financial_transactions_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE financial_transactions_2024_02 
PARTITION OF financial_transactions_partitioned
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Dan seterusnya...
*/

-- =============================================
-- SUMMARY OPTIMASI YANG DIIMPLEMENTASIKAN
-- =============================================

/*
RINGKASAN OPTIMASI:

1. INDEKS TAMBAHAN:
   - Composite indexes untuk query filtering yang kompleks
   - GIN indexes untuk full-text search
   - Partial indexes untuk kondisi WHERE yang spesifik

2. MATERIALIZED VIEWS:
   - Dashboard statistics untuk analytics
   - Refresh berkala untuk data yang tidak real-time

3. QUERY OPTIMIZATION:
   - Estimated count untuk pagination
   - Selective column fetching
   - Proper ORDER BY dengan matching indexes

4. MONITORING:
   - pg_stat_statements untuk slow query detection
   - Index usage monitoring
   - Regular VACUUM ANALYZE

5. FUTURE CONSIDERATIONS:
   - Connection pooling
   - Query result caching
   - Table partitioning untuk data besar
   - Read replicas untuk scaling
*/