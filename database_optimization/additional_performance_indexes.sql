-- =============================================
-- ADDITIONAL PERFORMANCE INDEXES
-- Index tambahan berdasarkan analisis pola query aplikasi
-- =============================================

-- Aktifkan extension untuk monitoring performa
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================
-- 1. FINANCIAL TRANSACTIONS - INDEX TAMBAHAN
-- =============================================

DO $$
BEGIN
    -- Index untuk query range tanggal dengan kategori (sering digunakan di dashboard)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_financial_transactions_user_category_date_range'
    ) THEN
        CREATE INDEX idx_financial_transactions_user_category_date_range 
        ON financial_transactions(user_id, category, date DESC) 
        WHERE date IS NOT NULL;
        RAISE NOTICE 'Created index: idx_financial_transactions_user_category_date_range';
    END IF;

    -- Index untuk query monthly aggregation (dashboard analytics)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_financial_transactions_monthly_agg'
    ) THEN
        CREATE INDEX idx_financial_transactions_monthly_agg 
        ON financial_transactions(user_id, type, DATE_TRUNC('month', date), amount) 
        WHERE date >= CURRENT_DATE - INTERVAL '24 months';
        RAISE NOTICE 'Created index: idx_financial_transactions_monthly_agg';
    END IF;

    -- Index untuk query berdasarkan related_id (link ke orders/purchases)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_financial_transactions_related_id'
    ) THEN
        CREATE INDEX idx_financial_transactions_related_id 
        ON financial_transactions(related_id) 
        WHERE related_id IS NOT NULL;
        RAISE NOTICE 'Created index: idx_financial_transactions_related_id';
    END IF;

    -- Index untuk pencarian berdasarkan description
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_financial_transactions_description_search'
    ) THEN
        CREATE INDEX idx_financial_transactions_description_search 
        ON financial_transactions USING gin(to_tsvector('indonesian', description)) 
        WHERE description IS NOT NULL;
        RAISE NOTICE 'Created index: idx_financial_transactions_description_search';
    END IF;
END $$;

-- =============================================
-- 2. BAHAN BAKU - INDEX TAMBAHAN
-- =============================================

DO $$
BEGIN
    -- Index untuk query expiry date monitoring
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bahan_baku_expiry_monitoring'
    ) THEN
        CREATE INDEX idx_bahan_baku_expiry_monitoring 
        ON bahan_baku(user_id, tanggal_kadaluwarsa ASC) 
        WHERE tanggal_kadaluwarsa IS NOT NULL 
        AND tanggal_kadaluwarsa >= CURRENT_DATE;
        RAISE NOTICE 'Created index: idx_bahan_baku_expiry_monitoring';
    END IF;

    -- Index untuk query stock value calculation
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bahan_baku_stock_value'
    ) THEN
        CREATE INDEX idx_bahan_baku_stock_value 
        ON bahan_baku(user_id, kategori, stok, harga_rata_rata) 
        WHERE stok > 0;
        RAISE NOTICE 'Created index: idx_bahan_baku_stock_value';
    END IF;

    -- Index untuk supplier analysis
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bahan_baku_supplier_analysis'
    ) THEN
        CREATE INDEX idx_bahan_baku_supplier_analysis 
        ON bahan_baku(user_id, supplier, updated_at DESC) 
        WHERE supplier IS NOT NULL;
        RAISE NOTICE 'Created index: idx_bahan_baku_supplier_analysis';
    END IF;
END $$;

-- =============================================
-- 3. ORDERS - INDEX TAMBAHAN
-- =============================================

DO $$
BEGIN
    -- Index untuk customer analytics
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_customer_analytics'
    ) THEN
        CREATE INDEX idx_orders_customer_analytics 
        ON orders(user_id, lower(nama_pelanggan), total_pesanan DESC, tanggal DESC) 
        WHERE nama_pelanggan IS NOT NULL;
        RAISE NOTICE 'Created index: idx_orders_customer_analytics';
    END IF;

    -- Index untuk revenue tracking by date range
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_revenue_tracking'
    ) THEN
        CREATE INDEX idx_orders_revenue_tracking 
        ON orders(user_id, tanggal, total_pesanan) 
        WHERE status = 'completed' AND tanggal IS NOT NULL;
        RAISE NOTICE 'Created index: idx_orders_revenue_tracking';
    END IF;

    -- Index untuk order completion time analysis
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_completion_analysis'
    ) THEN
        CREATE INDEX idx_orders_completion_analysis 
        ON orders(user_id, status, created_at, updated_at) 
        WHERE status IN ('completed', 'cancelled');
        RAISE NOTICE 'Created index: idx_orders_completion_analysis';
    END IF;

    -- Index untuk JSONB items search (recipe analysis)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_items_recipe_analysis'
    ) THEN
        CREATE INDEX idx_orders_items_recipe_analysis 
        ON orders USING gin((items -> 'recipe_id')) 
        WHERE items IS NOT NULL;
        RAISE NOTICE 'Created index: idx_orders_items_recipe_analysis';
    END IF;
END $$;

-- =============================================
-- 4. PURCHASES - INDEX TAMBAHAN
-- =============================================

DO $$
BEGIN
    -- Index untuk supplier performance analysis
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_purchases_supplier_performance'
    ) THEN
        CREATE INDEX idx_purchases_supplier_performance 
        ON purchases(user_id, supplier, status, tanggal DESC, total_nilai DESC);
        RAISE NOTICE 'Created index: idx_purchases_supplier_performance';
    END IF;

    -- Index untuk cost analysis by calculation method
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_purchases_cost_analysis'
    ) THEN
        CREATE INDEX idx_purchases_cost_analysis 
        ON purchases(user_id, metode_perhitungan, tanggal DESC) 
        WHERE metode_perhitungan IS NOT NULL;
        RAISE NOTICE 'Created index: idx_purchases_cost_analysis';
    END IF;

    -- Index untuk monthly purchase summary
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_purchases_monthly_summary'
    ) THEN
        CREATE INDEX idx_purchases_monthly_summary 
        ON purchases(user_id, DATE_TRUNC('month', tanggal), total_nilai) 
        WHERE tanggal IS NOT NULL;
        RAISE NOTICE 'Created index: idx_purchases_monthly_summary';
    END IF;
END $$;

-- =============================================
-- 5. RECIPES - INDEX TAMBAHAN
-- =============================================

DO $$
BEGIN
    -- Index untuk recipe profitability analysis
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_recipes_profitability'
    ) THEN
        CREATE INDEX idx_recipes_profitability 
        ON recipes(user_id, margin_keuntungan_persen DESC, total_hpp ASC) 
        WHERE margin_keuntungan_persen IS NOT NULL;
        RAISE NOTICE 'Created index: idx_recipes_profitability';
    END IF;

    -- Index untuk recipe cost tracking
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_recipes_cost_tracking'
    ) THEN
        CREATE INDEX idx_recipes_cost_tracking 
        ON recipes(user_id, updated_at DESC, total_hpp, hpp_per_porsi) 
        WHERE total_hpp IS NOT NULL;
        RAISE NOTICE 'Created index: idx_recipes_cost_tracking';
    END IF;

    -- Index untuk JSONB bahan_resep search
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_recipes_ingredients_search'
    ) THEN
        CREATE INDEX idx_recipes_ingredients_search 
        ON recipes USING gin(bahan_resep) 
        WHERE bahan_resep IS NOT NULL;
        RAISE NOTICE 'Created index: idx_recipes_ingredients_search';
    END IF;
END $$;

-- =============================================
-- 6. ACTIVITIES - INDEX TAMBAHAN
-- =============================================

DO $$
BEGIN
    -- Index untuk activity analytics by value
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_activities_value_analytics'
    ) THEN
        CREATE INDEX idx_activities_value_analytics 
        ON activities(user_id, type, value, created_at DESC) 
        WHERE value IS NOT NULL;
        RAISE NOTICE 'Created index: idx_activities_value_analytics';
    END IF;

    -- Index untuk recent activities dashboard
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_activities_recent_dashboard'
    ) THEN
        CREATE INDEX idx_activities_recent_dashboard 
        ON activities(user_id, created_at DESC) 
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
        RAISE NOTICE 'Created index: idx_activities_recent_dashboard';
    END IF;
END $$;

-- =============================================
-- 7. SUPPLIERS - INDEX TAMBAHAN
-- =============================================

DO $$
BEGIN
    -- Index untuk supplier contact search
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_suppliers_contact_search'
    ) THEN
        CREATE INDEX idx_suppliers_contact_search 
        ON suppliers USING gin(to_tsvector('indonesian', 
            COALESCE(nama, '') || ' ' || 
            COALESCE(telepon, '') || ' ' || 
            COALESCE(email, '') || ' ' || 
            COALESCE(alamat, '')
        ));
        RAISE NOTICE 'Created index: idx_suppliers_contact_search';
    END IF;

    -- Index untuk supplier performance tracking
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_suppliers_performance'
    ) THEN
        CREATE INDEX idx_suppliers_performance 
        ON suppliers(user_id, updated_at DESC, created_at DESC);
        RAISE NOTICE 'Created index: idx_suppliers_performance';
    END IF;
END $$;

-- =============================================
-- 8. CROSS-TABLE ANALYTICS INDEXES
-- =============================================

DO $$
BEGIN
    -- Index untuk user activity summary
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_user_activity_summary'
    ) THEN
        -- Composite index untuk user analytics across tables
        CREATE INDEX idx_user_activity_summary 
        ON activities(user_id, type, DATE_TRUNC('day', created_at)) 
        WHERE created_at >= CURRENT_DATE - INTERVAL '90 days';
        RAISE NOTICE 'Created index: idx_user_activity_summary';
    END IF;
END $$;

-- =============================================
-- 9. MATERIALIZED VIEWS TAMBAHAN
-- =============================================

-- Materialized view untuk supplier performance
DROP MATERIALIZED VIEW IF EXISTS supplier_performance_summary;
CREATE MATERIALIZED VIEW supplier_performance_summary AS
SELECT 
    s.user_id,
    s.id as supplier_id,
    s.nama as supplier_name,
    COUNT(p.id) as total_purchases,
    COALESCE(SUM(p.total_nilai), 0) as total_purchase_value,
    COALESCE(AVG(p.total_nilai), 0) as avg_purchase_value,
    MAX(p.tanggal) as last_purchase_date,
    COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as completed_purchases,
    COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_purchases
FROM suppliers s
LEFT JOIN purchases p ON s.id = p.supplier
GROUP BY s.user_id, s.id, s.nama;

CREATE UNIQUE INDEX idx_supplier_performance_summary_unique 
ON supplier_performance_summary(user_id, supplier_id);

-- Materialized view untuk customer analytics
DROP MATERIALIZED VIEW IF EXISTS customer_analytics_summary;
CREATE MATERIALIZED VIEW customer_analytics_summary AS
SELECT 
    user_id,
    lower(nama_pelanggan) as customer_name_lower,
    nama_pelanggan as customer_name,
    COUNT(*) as total_orders,
    COALESCE(SUM(total_pesanan), 0) as total_revenue,
    COALESCE(AVG(total_pesanan), 0) as avg_order_value,
    MAX(tanggal) as last_order_date,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders
FROM orders 
WHERE nama_pelanggan IS NOT NULL
GROUP BY user_id, lower(nama_pelanggan), nama_pelanggan;

CREATE UNIQUE INDEX idx_customer_analytics_summary_unique 
ON customer_analytics_summary(user_id, customer_name_lower);

-- =============================================
-- 10. UTILITY FUNCTIONS TAMBAHAN
-- =============================================

-- Function untuk refresh semua materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    -- Refresh existing views
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_financial_summary;
    
    -- Refresh new views
    REFRESH MATERIALIZED VIEW CONCURRENTLY supplier_performance_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY customer_analytics_summary;
    
    RAISE NOTICE 'All materialized views refreshed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error refreshing materialized views: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function untuk monitoring index usage
CREATE OR REPLACE FUNCTION check_index_usage()
RETURNS TABLE(
    table_name text,
    index_name text,
    index_scans bigint,
    tuples_read bigint,
    tuples_fetched bigint,
    usage_ratio numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        indexname as index_name,
        idx_scan as index_scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        CASE 
            WHEN idx_scan = 0 THEN 0
            ELSE ROUND((idx_tup_fetch::numeric / idx_tup_read::numeric) * 100, 2)
        END as usage_ratio
    FROM pg_stat_user_indexes 
    WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
    ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Function untuk analisis slow queries
CREATE OR REPLACE FUNCTION analyze_slow_queries(min_duration_ms integer DEFAULT 1000)
RETURNS TABLE(
    query_text text,
    calls bigint,
    total_time numeric,
    mean_time numeric,
    max_time numeric,
    rows_affected bigint
) AS $$
BEGIN
    -- Requires pg_stat_statements extension
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
        RAISE NOTICE 'pg_stat_statements extension not installed';
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        query as query_text,
        calls,
        total_exec_time as total_time,
        mean_exec_time as mean_time,
        max_exec_time as max_time,
        rows
    FROM pg_stat_statements 
    WHERE mean_exec_time > min_duration_ms
    AND query NOT LIKE '%pg_stat_statements%'
    ORDER BY mean_exec_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 11. MAINTENANCE SCHEDULE
-- =============================================

-- Function untuk maintenance harian
CREATE OR REPLACE FUNCTION daily_maintenance()
RETURNS void AS $$
BEGIN
    -- Update table statistics
    ANALYZE financial_transactions;
    ANALYZE bahan_baku;
    ANALYZE purchases;
    ANALYZE orders;
    ANALYZE recipes;
    ANALYZE activities;
    ANALYZE suppliers;
    
    -- Refresh materialized views
    PERFORM refresh_all_materialized_views();
    
    RAISE NOTICE 'Daily maintenance completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Function untuk maintenance mingguan
CREATE OR REPLACE FUNCTION weekly_maintenance()
RETURNS void AS $$
BEGIN
    -- Vacuum analyze semua tabel utama
    VACUUM ANALYZE financial_transactions;
    VACUUM ANALYZE bahan_baku;
    VACUUM ANALYZE purchases;
    VACUUM ANALYZE orders;
    VACUUM ANALYZE recipes;
    VACUUM ANALYZE activities;
    VACUUM ANALYZE suppliers;
    
    -- Clean up old activities (older than 6 months)
    DELETE FROM activities 
    WHERE created_at < CURRENT_DATE - INTERVAL '6 months';
    
    -- Reset pg_stat_statements if needed
    SELECT pg_stat_statements_reset();
    
    RAISE NOTICE 'Weekly maintenance completed successfully';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Query untuk melihat semua index yang baru dibuat
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
AND indexname NOT IN (
    SELECT indexname FROM pg_indexes 
    WHERE indexname LIKE 'idx_financial_transactions_user_date'
    OR indexname LIKE 'idx_bahan_baku_user_nama_lower'
    OR indexname LIKE 'idx_purchases_user_status_tanggal_desc'
    OR indexname LIKE 'idx_orders_user_tanggal_desc'
)
ORDER BY tablename, indexname;

-- Query untuk melihat ukuran index baru
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
    RAISE NOTICE '✅ Additional performance indexes have been successfully implemented!';
    RAISE NOTICE '📊 Total new indexes created: ~25 additional indexes';
    RAISE NOTICE '🔧 Schedule daily_maintenance() and weekly_maintenance() for optimal performance';
    RAISE NOTICE '📈 Use check_index_usage() and analyze_slow_queries() for monitoring';
    RAISE NOTICE '🎯 Focus areas: Financial analytics, Customer analytics, Supplier performance, Recipe profitability';
END $$;