-- Implementation Script for Database Performance Optimization
-- Script untuk mengimplementasikan indeks optimasi performa database

-- =============================================
-- BACKUP EXISTING INDEXES (untuk rollback jika diperlukan)
-- =============================================

-- Simpan informasi indeks yang ada sebelum menambah yang baru
-- SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;

-- =============================================
-- 1. FINANCIAL TRANSACTIONS OPTIMIZATION
-- =============================================

DO $$
BEGIN
    -- Indeks untuk filter berdasarkan type dan user_id dengan sorting date
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_financial_transactions_user_type_date'
    ) THEN
        CREATE INDEX idx_financial_transactions_user_type_date 
        ON financial_transactions(user_id, type, date DESC);
        RAISE NOTICE 'Created index: idx_financial_transactions_user_type_date';
    END IF;

    -- Indeks untuk filter berdasarkan category dan user_id dengan sorting date
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_financial_transactions_user_category_date'
    ) THEN
        CREATE INDEX idx_financial_transactions_user_category_date 
        ON financial_transactions(user_id, category, date DESC)
        WHERE category IS NOT NULL;
        RAISE NOTICE 'Created index: idx_financial_transactions_user_category_date';
    END IF;

    -- Indeks untuk query range tanggal yang optimal
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_financial_transactions_date_range_optimized'
    ) THEN
        CREATE INDEX idx_financial_transactions_date_range_optimized 
        ON financial_transactions(date DESC, user_id) 
        WHERE date IS NOT NULL;
        RAISE NOTICE 'Created index: idx_financial_transactions_date_range_optimized';
    END IF;

    -- Indeks untuk bulk operations berdasarkan related_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_financial_transactions_related_user'
    ) THEN
        CREATE INDEX idx_financial_transactions_related_user 
        ON financial_transactions(related_id, user_id) 
        WHERE related_id IS NOT NULL;
        RAISE NOTICE 'Created index: idx_financial_transactions_related_user';
    END IF;
END $$;

-- =============================================
-- 2. BAHAN BAKU (WAREHOUSE) OPTIMIZATION
-- =============================================

DO $$
BEGIN
    -- Aktifkan pg_trgm extension untuk fuzzy search jika belum ada
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
    
    -- Indeks trigram untuk pencarian nama bahan baku yang fuzzy
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bahan_baku_nama_trgm'
    ) THEN
        CREATE INDEX idx_bahan_baku_nama_trgm 
        ON bahan_baku USING gin(nama gin_trgm_ops);
        RAISE NOTICE 'Created index: idx_bahan_baku_nama_trgm';
    END IF;

    -- Indeks untuk pencarian case-insensitive dengan user_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bahan_baku_user_nama_lower'
    ) THEN
        CREATE INDEX idx_bahan_baku_user_nama_lower 
        ON bahan_baku(user_id, lower(nama));
        RAISE NOTICE 'Created index: idx_bahan_baku_user_nama_lower';
    END IF;

    -- Indeks composite untuk filter kategori + stok rendah
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bahan_baku_user_kategori_stok_low'
    ) THEN
        CREATE INDEX idx_bahan_baku_user_kategori_stok_low 
        ON bahan_baku(user_id, kategori, stok) 
        WHERE stok <= minimum;
        RAISE NOTICE 'Created index: idx_bahan_baku_user_kategori_stok_low';
    END IF;

    -- Indeks untuk sorting berdasarkan harga dengan user_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bahan_baku_user_harga_sort'
    ) THEN
        CREATE INDEX idx_bahan_baku_user_harga_sort 
        ON bahan_baku(user_id, harga_rata_rata DESC, nama);
        RAISE NOTICE 'Created index: idx_bahan_baku_user_harga_sort';
    END IF;

    -- Indeks untuk filter berdasarkan tanggal kadaluwarsa
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bahan_baku_user_expiry'
    ) THEN
        CREATE INDEX idx_bahan_baku_user_expiry 
        ON bahan_baku(user_id, tanggal_kadaluwarsa) 
        WHERE tanggal_kadaluwarsa IS NOT NULL 
        AND tanggal_kadaluwarsa <= CURRENT_DATE + INTERVAL '30 days';
        RAISE NOTICE 'Created index: idx_bahan_baku_user_expiry';
    END IF;
END $$;

-- =============================================
-- 3. PURCHASES OPTIMIZATION
-- =============================================

DO $$
BEGIN
    -- Indeks untuk sorting berdasarkan tanggal dengan user_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_purchases_user_tanggal_desc'
    ) THEN
        CREATE INDEX idx_purchases_user_tanggal_desc 
        ON purchases(user_id, tanggal DESC);
        RAISE NOTICE 'Created index: idx_purchases_user_tanggal_desc';
    END IF;

    -- Indeks untuk filter supplier dengan user_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_purchases_user_supplier_tanggal'
    ) THEN
        CREATE INDEX idx_purchases_user_supplier_tanggal 
        ON purchases(user_id, supplier, tanggal DESC);
        RAISE NOTICE 'Created index: idx_purchases_user_supplier_tanggal';
    END IF;

    -- Indeks untuk filter status + tanggal dengan user_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_purchases_user_status_tanggal_desc'
    ) THEN
        CREATE INDEX idx_purchases_user_status_tanggal_desc 
        ON purchases(user_id, status, tanggal DESC);
        RAISE NOTICE 'Created index: idx_purchases_user_status_tanggal_desc';
    END IF;

    -- Indeks untuk pencarian berdasarkan total nilai
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_purchases_user_total_nilai'
    ) THEN
        CREATE INDEX idx_purchases_user_total_nilai 
        ON purchases(user_id, total_nilai DESC, tanggal DESC);
        RAISE NOTICE 'Created index: idx_purchases_user_total_nilai';
    END IF;

    -- Indeks untuk JSONB items dengan path expressions yang sering digunakan
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_purchases_items_nama'
    ) THEN
        CREATE INDEX idx_purchases_items_nama 
        ON purchases USING gin((items -> 'nama'));
        RAISE NOTICE 'Created index: idx_purchases_items_nama';
    END IF;
END $$;

-- =============================================
-- 4. ORDERS OPTIMIZATION
-- =============================================

DO $$
BEGIN
    -- Indeks untuk sorting berdasarkan tanggal dengan user_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_user_tanggal_desc'
    ) THEN
        CREATE INDEX idx_orders_user_tanggal_desc 
        ON orders(user_id, tanggal DESC);
        RAISE NOTICE 'Created index: idx_orders_user_tanggal_desc';
    END IF;

    -- Indeks untuk filter status + tanggal dengan user_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_user_status_tanggal_desc'
    ) THEN
        CREATE INDEX idx_orders_user_status_tanggal_desc 
        ON orders(user_id, status, tanggal DESC);
        RAISE NOTICE 'Created index: idx_orders_user_status_tanggal_desc';
    END IF;

    -- Indeks untuk pencarian berdasarkan nama pelanggan
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_user_customer_name'
    ) THEN
        CREATE INDEX idx_orders_user_customer_name 
        ON orders(user_id, lower(nama_pelanggan));
        RAISE NOTICE 'Created index: idx_orders_user_customer_name';
    END IF;

    -- Indeks untuk filter berdasarkan total pesanan
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_user_total_desc'
    ) THEN
        CREATE INDEX idx_orders_user_total_desc 
        ON orders(user_id, total_pesanan DESC, tanggal DESC);
        RAISE NOTICE 'Created index: idx_orders_user_total_desc';
    END IF;

    -- Indeks untuk nomor pesanan (sering digunakan untuk pencarian)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_user_nomor_pesanan'
    ) THEN
        CREATE INDEX idx_orders_user_nomor_pesanan 
        ON orders(user_id, nomor_pesanan);
        RAISE NOTICE 'Created index: idx_orders_user_nomor_pesanan';
    END IF;
END $$;

-- =============================================
-- 5. OPERATIONAL COSTS OPTIMIZATION
-- =============================================

DO $$
BEGIN
    -- Indeks untuk query tanggal range dengan status active
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_operational_costs_user_effective_active'
    ) THEN
        CREATE INDEX idx_operational_costs_user_effective_active 
        ON operational_costs(user_id, effective_date DESC) 
        WHERE status = 'active';
        RAISE NOTICE 'Created index: idx_operational_costs_user_effective_active';
    END IF;

    -- Indeks untuk filter berdasarkan jenis dan group
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_operational_costs_user_jenis_group'
    ) THEN
        CREATE INDEX idx_operational_costs_user_jenis_group 
        ON operational_costs(user_id, jenis, "group", effective_date DESC);
        RAISE NOTICE 'Created index: idx_operational_costs_user_jenis_group';
    END IF;
END $$;

-- =============================================
-- 6. ACTIVITIES OPTIMIZATION
-- =============================================

DO $$
BEGIN
    -- Indeks untuk filter berdasarkan tipe aktivitas dengan sorting
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_activities_user_type_created_desc'
    ) THEN
        CREATE INDEX idx_activities_user_type_created_desc 
        ON activities(user_id, type, created_at DESC);
        RAISE NOTICE 'Created index: idx_activities_user_type_created_desc';
    END IF;

    -- Indeks untuk cleanup aktivitas lama (berdasarkan created_at)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_activities_created_at_cleanup'
    ) THEN
        CREATE INDEX idx_activities_created_at_cleanup 
        ON activities(created_at) 
        WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
        RAISE NOTICE 'Created index: idx_activities_created_at_cleanup';
    END IF;
END $$;

-- =============================================
-- 7. RECIPES OPTIMIZATION
-- =============================================

DO $$
BEGIN
    -- Indeks untuk pencarian nama resep dengan user_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_recipes_user_nama_lower'
    ) THEN
        CREATE INDEX idx_recipes_user_nama_lower 
        ON recipes(user_id, lower(nama_resep));
        RAISE NOTICE 'Created index: idx_recipes_user_nama_lower';
    END IF;

    -- Indeks untuk filter berdasarkan kategori resep
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_recipes_user_kategori'
    ) THEN
        CREATE INDEX idx_recipes_user_kategori 
        ON recipes(user_id, kategori_resep) 
        WHERE kategori_resep IS NOT NULL;
        RAISE NOTICE 'Created index: idx_recipes_user_kategori';
    END IF;
END $$;

-- =============================================
-- 8. SUPPLIERS OPTIMIZATION
-- =============================================

DO $$
BEGIN
    -- Indeks untuk pencarian nama supplier
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_suppliers_user_nama_lower'
    ) THEN
        CREATE INDEX idx_suppliers_user_nama_lower 
        ON suppliers(user_id, lower(nama));
        RAISE NOTICE 'Created index: idx_suppliers_user_nama_lower';
    END IF;

    -- Indeks untuk filter berdasarkan kontak supplier
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_suppliers_user_kontak'
    ) THEN
        CREATE INDEX idx_suppliers_user_kontak 
        ON suppliers(user_id, telepon, email) 
        WHERE telepon IS NOT NULL OR email IS NOT NULL;
        RAISE NOTICE 'Created index: idx_suppliers_user_kontak';
    END IF;
END $$;

-- =============================================
-- 9. MATERIALIZED VIEW UNTUK DASHBOARD
-- =============================================

DO $$
BEGIN
    -- Drop existing materialized view jika ada
    DROP MATERIALIZED VIEW IF EXISTS dashboard_financial_summary;
    
    -- Buat materialized view untuk dashboard analytics
    CREATE MATERIALIZED VIEW dashboard_financial_summary AS
    SELECT 
        user_id,
        DATE_TRUNC('month', date) as month_year,
        COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as net_profit,
        COUNT(*) as total_transactions,
        AVG(CASE WHEN type = 'income' THEN amount END) as avg_income,
        AVG(CASE WHEN type = 'expense' THEN amount END) as avg_expense
    FROM financial_transactions 
    WHERE date >= CURRENT_DATE - INTERVAL '24 months'
      AND date IS NOT NULL
    GROUP BY user_id, DATE_TRUNC('month', date);
    
    -- Buat indeks untuk materialized view
    CREATE UNIQUE INDEX idx_dashboard_financial_summary_user_month 
    ON dashboard_financial_summary(user_id, month_year);
    
    CREATE INDEX idx_dashboard_financial_summary_month 
    ON dashboard_financial_summary(month_year DESC);
    
    RAISE NOTICE 'Created materialized view: dashboard_financial_summary';
END $$;

-- =============================================
-- 10. UTILITY FUNCTIONS UNTUK MONITORING
-- =============================================

-- Function untuk mendapatkan estimated count (untuk pagination yang cepat)
CREATE OR REPLACE FUNCTION get_table_estimated_count(
    table_name text, 
    where_clause text DEFAULT ''
)
RETURNS bigint AS $$
DECLARE
    result bigint;
    exact_count bigint;
    estimated_count bigint;
BEGIN
    -- Dapatkan estimated count dari pg_class
    SELECT reltuples::bigint INTO estimated_count
    FROM pg_class 
    WHERE relname = table_name;
    
    -- Jika tabel kecil (< 10000 rows), gunakan exact count
    IF estimated_count < 10000 THEN
        IF where_clause = '' THEN
            EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO exact_count;
        ELSE
            EXECUTE format('SELECT COUNT(*) FROM %I WHERE %s', table_name, where_clause) INTO exact_count;
        END IF;
        RETURN exact_count;
    ELSE
        -- Untuk tabel besar, gunakan estimated count
        RETURN estimated_count;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function untuk refresh materialized views
CREATE OR REPLACE FUNCTION refresh_dashboard_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_financial_summary;
    RAISE NOTICE 'Dashboard materialized views refreshed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error refreshing materialized views: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 11. MAINTENANCE PROCEDURES
-- =============================================

-- Procedure untuk maintenance rutin
CREATE OR REPLACE FUNCTION database_maintenance()
RETURNS void AS $$
BEGIN
    -- Vacuum analyze tabel utama
    VACUUM ANALYZE financial_transactions;
    VACUUM ANALYZE bahan_baku;
    VACUUM ANALYZE purchases;
    VACUUM ANALYZE orders;
    VACUUM ANALYZE operational_costs;
    VACUUM ANALYZE activities;
    VACUUM ANALYZE recipes;
    VACUUM ANALYZE suppliers;
    
    -- Refresh materialized views
    PERFORM refresh_dashboard_views();
    
    -- Update table statistics
    ANALYZE;
    
    RAISE NOTICE 'Database maintenance completed successfully';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SUMMARY DAN VERIFICATION
-- =============================================

-- Query untuk verifikasi indeks yang telah dibuat
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Query untuk melihat ukuran indeks
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Pesan sukses
DO $$
BEGIN
    RAISE NOTICE '✅ Database optimization indexes have been successfully implemented!';
    RAISE NOTICE '📊 Run the verification queries above to check the created indexes';
    RAISE NOTICE '🔧 Schedule database_maintenance() to run daily for optimal performance';
    RAISE NOTICE '📈 Monitor query performance using pg_stat_statements extension';
END $$;