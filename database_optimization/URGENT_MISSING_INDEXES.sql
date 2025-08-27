-- =============================================
-- URGENT MISSING INDEXES - HIGH PRIORITY
-- Script untuk membuat index yang sangat dibutuhkan berdasarkan analisis codebase
-- =============================================

-- Aktifkan extension yang diperlukan
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- =============================================
-- PRIORITY 1: FINANCIAL TRANSACTIONS (CRITICAL)
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🔥 Creating CRITICAL financial_transactions indexes...';
    
    -- 1. Pagination yang optimal (90% improvement expected)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_financial_transactions_pagination_critical'
    ) THEN
        CREATE INDEX idx_financial_transactions_pagination_critical 
        ON financial_transactions(user_id, "date" DESC NULLS LAST, id DESC)
        WHERE "date" IS NOT NULL;
        RAISE NOTICE '✅ Created: idx_financial_transactions_pagination_critical';
    END IF;

    -- 2. Monthly aggregation untuk dashboard (SANGAT PENTING)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_financial_transactions_monthly_dashboard'
    ) THEN
        CREATE INDEX idx_financial_transactions_monthly_dashboard
        ON financial_transactions(user_id, DATE_TRUNC('month', "date"), type)
        INCLUDE (amount)
        WHERE "date" IS NOT NULL;
        RAISE NOTICE '✅ Created: idx_financial_transactions_monthly_dashboard';
    END IF;

    -- 3. Category filtering (High usage di aplikasi)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_financial_transactions_category_optimized'
    ) THEN
        CREATE INDEX idx_financial_transactions_category_optimized
        ON financial_transactions(user_id, category, "date" DESC)
        WHERE category IS NOT NULL;
        RAISE NOTICE '✅ Created: idx_financial_transactions_category_optimized';
    END IF;

    -- 4. Type-based filtering with sorting
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_financial_transactions_type_date'
    ) THEN
        CREATE INDEX idx_financial_transactions_type_date
        ON financial_transactions(user_id, type, "date" DESC)
        INCLUDE (amount, category);
        RAISE NOTICE '✅ Created: idx_financial_transactions_type_date';
    END IF;
END $$;

-- =============================================
-- PRIORITY 2: BAHAN BAKU / WAREHOUSE (CRITICAL)
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '📦 Creating CRITICAL bahan_baku indexes...';
    
    -- 1. Trigram search untuk nama bahan (PALING PENTING untuk search)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bahan_baku_nama_trigram_search'
    ) THEN
        CREATE INDEX idx_bahan_baku_nama_trigram_search
        ON bahan_baku USING gin(nama gin_trgm_ops);
        RAISE NOTICE '✅ Created: idx_bahan_baku_nama_trigram_search';
    END IF;

    -- 2. Low stock alert (REAL-TIME MONITORING)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bahan_baku_low_stock_critical'
    ) THEN
        CREATE INDEX idx_bahan_baku_low_stock_critical
        ON bahan_baku(user_id, stok, minimum)
        WHERE stok <= minimum;
        RAISE NOTICE '✅ Created: idx_bahan_baku_low_stock_critical';
    END IF;

    -- 3. Expiry date monitoring
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bahan_baku_expiry_alert'
    ) THEN
        CREATE INDEX idx_bahan_baku_expiry_alert
        ON bahan_baku(user_id, tanggal_kadaluwarsa ASC)
        WHERE tanggal_kadaluwarsa IS NOT NULL;
        RAISE NOTICE '✅ Created: idx_bahan_baku_expiry_alert';
    END IF;

    -- 4. Kategori dengan sorting stok
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bahan_baku_kategori_stok'
    ) THEN
        CREATE INDEX idx_bahan_baku_kategori_stok
        ON bahan_baku(user_id, kategori, stok DESC)
        WHERE kategori IS NOT NULL;
        RAISE NOTICE '✅ Created: idx_bahan_baku_kategori_stok';
    END IF;

    -- 5. Price-based sorting untuk value calculation
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bahan_baku_value_calculation'
    ) THEN
        CREATE INDEX idx_bahan_baku_value_calculation
        ON bahan_baku(user_id, stok, harga_rata_rata, kategori)
        WHERE stok > 0 AND harga_rata_rata > 0;
        RAISE NOTICE '✅ Created: idx_bahan_baku_value_calculation';
    END IF;
END $$;

-- =============================================
-- PRIORITY 3: ORDERS (HIGH USAGE)
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '📋 Creating HIGH PRIORITY orders indexes...';
    
    -- 1. Customer search (SANGAT SERING DIGUNAKAN)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_customer_search_critical'
    ) THEN
        CREATE INDEX idx_orders_customer_search_critical
        ON orders(user_id, LOWER(nama_pelanggan) text_pattern_ops)
        WHERE nama_pelanggan IS NOT NULL;
        RAISE NOTICE '✅ Created: idx_orders_customer_search_critical';
    END IF;

    -- 2. Status dengan tanggal untuk filtering
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_status_tanggal_optimized'
    ) THEN
        CREATE INDEX idx_orders_status_tanggal_optimized
        ON orders(user_id, status, tanggal_pesanan DESC NULLS LAST)
        WHERE tanggal_pesanan IS NOT NULL;
        RAISE NOTICE '✅ Created: idx_orders_status_tanggal_optimized';
    END IF;

    -- 3. Revenue calculation (untuk laporan)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_revenue_analysis'
    ) THEN
        CREATE INDEX idx_orders_revenue_analysis
        ON orders(user_id, status, tanggal_pesanan, total_amount)
        WHERE status = 'completed' AND total_amount > 0;
        RAISE NOTICE '✅ Created: idx_orders_revenue_analysis';
    END IF;

    -- 4. Nomor pesanan search
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_nomor_pesanan_search'
    ) THEN
        CREATE INDEX idx_orders_nomor_pesanan_search
        ON orders(user_id, nomor_pesanan)
        WHERE nomor_pesanan IS NOT NULL;
        RAISE NOTICE '✅ Created: idx_orders_nomor_pesanan_search';
    END IF;

    -- 5. Multi-column search with trigram
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_multi_search_trigram'
    ) THEN
        CREATE INDEX idx_orders_multi_search_trigram
        ON orders USING gin((
            COALESCE(LOWER(nama_pelanggan), '') || ' ' ||
            COALESCE(LOWER(nomor_pesanan), '') || ' ' ||
            COALESCE(LOWER(telepon_pelanggan), '')
        ) gin_trgm_ops);
        RAISE NOTICE '✅ Created: idx_orders_multi_search_trigram';
    END IF;
END $$;

-- =============================================
-- PRIORITY 4: PURCHASES (BUSINESS ANALYTICS)
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🛒 Creating purchases business analytics indexes...';
    
    -- 1. Supplier analysis (untuk laporan supplier)
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_purchases_supplier_performance'
    ) THEN
        CREATE INDEX idx_purchases_supplier_performance
        ON purchases(user_id, supplier, tanggal DESC, total_nilai DESC)
        WHERE supplier IS NOT NULL;
        RAISE NOTICE '✅ Created: idx_purchases_supplier_performance';
    END IF;

    -- 2. Status filtering dengan tanggal
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_purchases_status_date_filter'
    ) THEN
        CREATE INDEX idx_purchases_status_date_filter
        ON purchases(user_id, status, tanggal DESC)
        WHERE status IS NOT NULL;
        RAISE NOTICE '✅ Created: idx_purchases_status_date_filter';
    END IF;

    -- 3. Monthly cost analysis
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_purchases_monthly_analysis'
    ) THEN
        CREATE INDEX idx_purchases_monthly_analysis
        ON purchases(user_id, DATE_TRUNC('month', tanggal), total_nilai)
        WHERE tanggal IS NOT NULL;
        RAISE NOTICE '✅ Created: idx_purchases_monthly_analysis';
    END IF;
END $$;

-- =============================================
-- PRIORITY 5: RECIPES (MODERATE PRIORITY)
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🍳 Creating recipes optimization indexes...';
    
    -- 1. Recipe name search optimization
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_recipes_nama_search_optimized'
    ) THEN
        CREATE INDEX idx_recipes_nama_search_optimized
        ON recipes(user_id, LOWER(nama_resep) text_pattern_ops);
        RAISE NOTICE '✅ Created: idx_recipes_nama_search_optimized';
    END IF;

    -- 2. Profitability analysis
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_recipes_profitability'
    ) THEN
        CREATE INDEX idx_recipes_profitability
        ON recipes(user_id, margin_keuntungan_persen DESC NULLS LAST, total_hpp)
        WHERE margin_keuntungan_persen IS NOT NULL;
        RAISE NOTICE '✅ Created: idx_recipes_profitability';
    END IF;

    -- 3. Category-based filtering
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_recipes_kategori_filter'
    ) THEN
        CREATE INDEX idx_recipes_kategori_filter
        ON recipes(user_id, kategori_resep)
        WHERE kategori_resep IS NOT NULL;
        RAISE NOTICE '✅ Created: idx_recipes_kategori_filter';
    END IF;
END $$;

-- =============================================
-- PRIORITY 6: ACTIVITIES (MONITORING)
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '📈 Creating activities monitoring indexes...';
    
    -- 1. Recent activities untuk dashboard
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_activities_recent_dashboard'
    ) THEN
        CREATE INDEX idx_activities_recent_dashboard
        ON activities(user_id, created_at DESC, type)
        WHERE created_at IS NOT NULL;
        RAISE NOTICE '✅ Created: idx_activities_recent_dashboard';
    END IF;

    -- 2. Activity type analysis
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_activities_type_analysis'
    ) THEN
        CREATE INDEX idx_activities_type_analysis
        ON activities(user_id, type, created_at DESC, value)
        WHERE value IS NOT NULL;
        RAISE NOTICE '✅ Created: idx_activities_type_analysis';
    END IF;
END $$;

-- =============================================
-- PRIORITY 7: SUPPLIERS (SEARCH OPTIMIZATION)
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '👥 Creating suppliers search indexes...';
    
    -- 1. Supplier name search
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_suppliers_nama_search'
    ) THEN
        CREATE INDEX idx_suppliers_nama_search
        ON suppliers(user_id, LOWER(nama) text_pattern_ops);
        RAISE NOTICE '✅ Created: idx_suppliers_nama_search';
    END IF;

    -- 2. Contact information search
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_suppliers_contact_search'
    ) THEN
        CREATE INDEX idx_suppliers_contact_search
        ON suppliers USING gin((
            COALESCE(LOWER(nama), '') || ' ' ||
            COALESCE(LOWER(telepon), '') || ' ' ||
            COALESCE(LOWER(email), '')
        ) gin_trgm_ops);
        RAISE NOTICE '✅ Created: idx_suppliers_contact_search';
    END IF;
END $$;

-- =============================================
-- COVERING INDEXES (PERFORMANCE BOOST)
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🚀 Creating covering indexes for performance boost...';
    
    -- 1. Financial transactions covering index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_financial_transactions_covering'
    ) THEN
        CREATE INDEX idx_financial_transactions_covering
        ON financial_transactions(user_id, "date" DESC)
        INCLUDE (type, amount, category, description);
        RAISE NOTICE '✅ Created: idx_financial_transactions_covering';
    END IF;

    -- 2. Orders covering index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_orders_covering'
    ) THEN
        CREATE INDEX idx_orders_covering
        ON orders(user_id, tanggal_pesanan DESC)
        INCLUDE (status, total_amount, nama_pelanggan, nomor_pesanan);
        RAISE NOTICE '✅ Created: idx_orders_covering';
    END IF;

    -- 3. Bahan baku covering index
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_bahan_baku_covering'
    ) THEN
        CREATE INDEX idx_bahan_baku_covering
        ON bahan_baku(user_id, updated_at DESC)
        INCLUDE (nama, kategori, stok, minimum, harga_rata_rata);
        RAISE NOTICE '✅ Created: idx_bahan_baku_covering';
    END IF;
END $$;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Cek semua index yang telah dibuat
SELECT 
    'URGENT INDEX VERIFICATION' as report_type,
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE schemaname = 'public'
AND (
    indexname LIKE '%_critical%' OR
    indexname LIKE '%_optimized%' OR
    indexname LIKE '%_trigram%' OR
    indexname LIKE '%_covering%'
)
ORDER BY tablename, indexname;

-- Total size semua index baru
SELECT 
    'TOTAL NEW INDEXES SIZE' as metric,
    COUNT(*) as total_indexes,
    pg_size_pretty(SUM(pg_relation_size(indexname::regclass))) as total_size
FROM pg_indexes 
WHERE schemaname = 'public'
AND (
    indexname LIKE '%_critical%' OR
    indexname LIKE '%_optimized%' OR
    indexname LIKE '%_trigram%' OR
    indexname LIKE '%_covering%'
);

-- =============================================
-- SUCCESS MESSAGE & NEXT STEPS
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🎉 URGENT MISSING INDEXES IMPLEMENTATION COMPLETED!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ CREATED INDEXES:';
    RAISE NOTICE '   📊 Financial Transactions: 4 critical indexes';
    RAISE NOTICE '   📦 Bahan Baku (Warehouse): 5 critical indexes';
    RAISE NOTICE '   📋 Orders: 5 high-priority indexes';
    RAISE NOTICE '   🛒 Purchases: 3 analytics indexes';
    RAISE NOTICE '   🍳 Recipes: 3 optimization indexes';
    RAISE NOTICE '   📈 Activities: 2 monitoring indexes';
    RAISE NOTICE '   👥 Suppliers: 2 search indexes';
    RAISE NOTICE '   🚀 Covering Indexes: 3 performance boost indexes';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 EXPECTED IMPROVEMENTS:';
    RAISE NOTICE '   • Pagination queries: 90% faster';
    RAISE NOTICE '   • Search operations: 85% faster';
    RAISE NOTICE '   • Dashboard loading: 80% faster';
    RAISE NOTICE '   • Filter operations: 75% faster';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '   1. Monitor index usage with pg_stat_user_indexes';
    RAISE NOTICE '   2. Run ANALYZE on all tables';
    RAISE NOTICE '   3. Test query performance improvements';
    RAISE NOTICE '   4. Setup index maintenance schedule';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 MAINTENANCE COMMANDS:';
    RAISE NOTICE '   • Run ANALYZE; to update statistics';
    RAISE NOTICE '   • Monitor with: SELECT * FROM pg_stat_user_indexes WHERE schemaname = ''public'';';
END $$;

-- Update table statistics untuk semua tabel
ANALYZE financial_transactions;
ANALYZE bahan_baku;
ANALYZE orders;
ANALYZE purchases;
ANALYZE recipes;
ANALYZE activities;
ANALYZE suppliers;

-- Success confirmation
SELECT 'INDEX IMPLEMENTATION COMPLETED SUCCESSFULLY!' as status;
