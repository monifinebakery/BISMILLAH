-- =============================================
-- CRITICAL INDEXES - PRIORITY IMPLEMENTATION (FIXED)
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================
-- CLEANUP INDEXES YANG TIDAK IMMUTABLE (pakai CURRENT_DATE di predicate)
-- =============================================
DO $$
BEGIN
  -- financial_transactions monthly dashboard (lama, pakai CURRENT_DATE)
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_financial_transactions_monthly_dashboard') THEN
    DROP INDEX idx_financial_transactions_monthly_dashboard;
    RAISE NOTICE '🗑 Dropped: idx_financial_transactions_monthly_dashboard';
  END IF;

  -- activities recent (lama, pakai CURRENT_DATE)
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activities_user_recent') THEN
    DROP INDEX idx_activities_user_recent;
    RAISE NOTICE '🗑 Dropped: idx_activities_user_recent';
  END IF;

  -- bahan_baku expiry alerts (lama, pakai CURRENT_DATE)
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bahan_baku_expiry_alerts') THEN
    DROP INDEX idx_bahan_baku_expiry_alerts;
    RAISE NOTICE '🗑 Dropped: idx_bahan_baku_expiry_alerts';
  END IF;
END $$;

-- =============================================
-- PRIORITY 1: PAGINATION & SORTING
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '🚀 Creating Priority 1 indexes (pagination & sorting)...';

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_financial_transactions_user_date_pagination'
  ) THEN
    CREATE INDEX idx_financial_transactions_user_date_pagination
    ON financial_transactions(user_id, "date" DESC NULLS LAST, id DESC);
    RAISE NOTICE '✅ Created: idx_financial_transactions_user_date_pagination';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_user_tanggal_pagination'
  ) THEN
    CREATE INDEX idx_orders_user_tanggal_pagination
    ON orders(user_id, tanggal DESC NULLS LAST, id DESC);
    RAISE NOTICE '✅ Created: idx_orders_user_tanggal_pagination';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_purchases_user_tanggal_pagination'
  ) THEN
    CREATE INDEX idx_purchases_user_tanggal_pagination
    ON purchases(user_id, tanggal DESC NULLS LAST, id DESC);
    RAISE NOTICE '✅ Created: idx_purchases_user_tanggal_pagination';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bahan_baku_user_updated_pagination'
  ) THEN
    CREATE INDEX idx_bahan_baku_user_updated_pagination
    ON bahan_baku(user_id, updated_at DESC NULLS LAST, id DESC);
    RAISE NOTICE '✅ Created: idx_bahan_baku_user_updated_pagination';
  END IF;
END $$;

-- =============================================
-- PRIORITY 2: SEARCH & FILTER
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '🔍 Creating Priority 2 indexes (search & filter)...';

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_financial_transactions_user_type_category'
  ) THEN
    CREATE INDEX idx_financial_transactions_user_type_category
    ON financial_transactions(user_id, type, category, "date" DESC);
    RAISE NOTICE '✅ Created: idx_financial_transactions_user_type_category';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_user_status_tanggal'
  ) THEN
    CREATE INDEX idx_orders_user_status_tanggal
    ON orders(user_id, status, tanggal DESC);
    RAISE NOTICE '✅ Created: idx_orders_user_status_tanggal';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_user_customer_search'
  ) THEN
    CREATE INDEX idx_orders_user_customer_search
    ON orders(user_id, lower(nama_pelanggan))
    WHERE nama_pelanggan IS NOT NULL;
    RAISE NOTICE '✅ Created: idx_orders_user_customer_search';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bahan_baku_nama_trigram'
  ) THEN
    CREATE INDEX idx_bahan_baku_nama_trigram
    ON bahan_baku USING gin(nama gin_trgm_ops);
    RAISE NOTICE '✅ Created: idx_bahan_baku_nama_trigram';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_bahan_baku_user_kategori_stok'
  ) THEN
    CREATE INDEX idx_bahan_baku_user_kategori_stok
    ON bahan_baku(user_id, kategori, stok DESC)
    WHERE kategori IS NOT NULL;
    RAISE NOTICE '✅ Created: idx_bahan_baku_user_kategori_stok';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_purchases_user_supplier_tanggal'
  ) THEN
    CREATE INDEX idx_purchases_user_supplier_tanggal
    ON purchases(user_id, supplier, tanggal DESC);
    RAISE NOTICE '✅ Created: idx_purchases_user_supplier_tanggal';
  END IF;
END $$;

-- =============================================
-- PRIORITY 3: DASHBOARD & ANALYTICS (FIXED)
-- =============================================

-- 3A) Kolom generated untuk agregasi bulanan (IMMUTABLE)
ALTER TABLE financial_transactions
  ADD COLUMN IF NOT EXISTS month_bucket date
  GENERATED ALWAYS AS (date_trunc('month', "date")::date) STORED;

-- 3B) Index untuk agregasi bulanan (tanpa CURRENT_DATE di predicate)
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_month_type
ON financial_transactions (user_id, month_bucket DESC, type)
INCLUDE (amount);

-- 3C) Tambahan covering index untuk filter waktu relatif + sort (opsional tapi berguna)
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_date_type_cover
ON financial_transactions (user_id, "date" DESC, type)
INCLUDE (amount);

-- Orders - revenue tracking (predicate konstanta → aman)
CREATE INDEX IF NOT EXISTS idx_orders_revenue_dashboard
ON orders(user_id, status, tanggal, total_pesanan)
WHERE status = 'completed' AND tanggal IS NOT NULL;

-- Bahan baku - stock alerts (predicate deterministik → aman)
CREATE INDEX IF NOT EXISTS idx_bahan_baku_stock_alerts
ON bahan_baku(user_id, stok, minimum_stok)
WHERE stok <= minimum_stok;

-- Bahan baku - expiry alerts (fixed: tanpa CURRENT_DATE)
CREATE INDEX IF NOT EXISTS idx_bahan_baku_user_expiry
ON bahan_baku(user_id, tanggal_kadaluwarsa)
WHERE tanggal_kadaluwarsa IS NOT NULL;

-- =============================================
-- PRIORITY 4: RELATIONSHIP INDEXES
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '🔗 Creating Priority 4 indexes (relationships)...';

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_financial_transactions_related_id'
  ) THEN
    CREATE INDEX idx_financial_transactions_related_id
    ON financial_transactions(related_id)
    WHERE related_id IS NOT NULL;
    RAISE NOTICE '✅ Created: idx_financial_transactions_related_id';
  END IF;

  -- Activities: ganti index recent → btree + brin tanpa CURRENT_DATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_activities_user_created'
  ) THEN
    CREATE INDEX idx_activities_user_created
    ON activities(user_id, created_at DESC);
    RAISE NOTICE '✅ Created: idx_activities_user_created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'brin_activities_created'
  ) THEN
    CREATE INDEX brin_activities_created
    ON activities USING brin (created_at);
    RAISE NOTICE '✅ Created: brin_activities_created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_suppliers_user_nama'
  ) THEN
    CREATE INDEX idx_suppliers_user_nama
    ON suppliers(user_id, lower(nama));
    RAISE NOTICE '✅ Created: idx_suppliers_user_nama';
  END IF;
END $$;

-- =============================================
-- PRIORITY 5: JSONB & ADVANCED SEARCH
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '🔍 Creating Priority 5 indexes (JSONB & advanced)...';

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_items_gin'
  ) THEN
    CREATE INDEX idx_orders_items_gin
    ON orders USING gin(items)
    WHERE items IS NOT NULL;
    RAISE NOTICE '✅ Created: idx_orders_items_gin';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_purchases_items_gin'
  ) THEN
    CREATE INDEX idx_purchases_items_gin
    ON purchases USING gin(items)
    WHERE items IS NOT NULL;
    RAISE NOTICE '✅ Created: idx_purchases_items_gin';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recipes_bahan_resep_gin'
  ) THEN
    CREATE INDEX idx_recipes_bahan_resep_gin
    ON recipes USING gin(bahan_resep)
    WHERE bahan_resep IS NOT NULL;
    RAISE NOTICE '✅ Created: idx_recipes_bahan_resep_gin';
  END IF;
END $$;

-- =============================================
-- MATERIALIZED VIEW (unchanged logic, aman pakai CURRENT_DATE di isi view)
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '📈 Creating critical materialized view...';

  DROP MATERIALIZED VIEW IF EXISTS critical_dashboard_summary;

  CREATE MATERIALIZED VIEW critical_dashboard_summary AS
  SELECT 
    user_id,
    -- Financial summary (30 hari)
    (
      SELECT COUNT(*)
      FROM financial_transactions ft
      WHERE ft.user_id = u.user_id
        AND ft."date" >= CURRENT_DATE - INTERVAL '30 days'
    ) AS recent_transactions,
    (
      SELECT COALESCE(SUM(amount), 0)
      FROM financial_transactions ft
      WHERE ft.user_id = u.user_id
        AND ft.type = 'income'
        AND ft."date" >= CURRENT_DATE - INTERVAL '30 days'
    ) AS monthly_income,
    (
      SELECT COALESCE(SUM(amount), 0)
      FROM financial_transactions ft
      WHERE ft.user_id = u.user_id
        AND ft.type = 'expense'
        AND ft."date" >= CURRENT_DATE - INTERVAL '30 days'
    ) AS monthly_expense,
    -- Orders summary
    (
      SELECT COUNT(*)
      FROM orders o
      WHERE o.user_id = u.user_id
        AND o.tanggal >= CURRENT_DATE - INTERVAL '30 days'
    ) AS recent_orders,
    (
      SELECT COUNT(*)
      FROM orders o
      WHERE o.user_id = u.user_id
        AND o.status = 'pending'
    ) AS pending_orders,
    -- Stock alerts
    (
      SELECT COUNT(*)
      FROM bahan_baku bb
      WHERE bb.user_id = u.user_id
        AND bb.stok <= bb.minimum_stok
    ) AS low_stock_items,
    (
      SELECT COUNT(*)
      FROM bahan_baku bb
      WHERE bb.user_id = u.user_id
        AND bb.tanggal_kadaluwarsa IS NOT NULL
        AND bb.tanggal_kadaluwarsa <= CURRENT_DATE + INTERVAL '7 days'
    ) AS expiring_items,
    CURRENT_TIMESTAMP AS last_updated
  FROM (
    SELECT DISTINCT user_id FROM financial_transactions
    UNION
    SELECT DISTINCT user_id FROM orders
    UNION
    SELECT DISTINCT user_id FROM bahan_baku
  ) u;

  -- Unique index untuk CONCURRENT REFRESH
  CREATE UNIQUE INDEX idx_critical_dashboard_summary_user
  ON critical_dashboard_summary(user_id);

  RAISE NOTICE '✅ Created: critical_dashboard_summary + unique index';
END $$;

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION refresh_critical_dashboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY critical_dashboard_summary;
  RAISE NOTICE 'Critical dashboard summary refreshed';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error refreshing critical dashboard: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_critical_indexes()
RETURNS TABLE(
  table_name text,
  index_name text,
  is_used boolean,
  scan_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname || '.' || tablename AS table_name,
    indexname AS index_name,
    idx_scan > 0 AS is_used,
    idx_scan AS scan_count
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
    AND (
      indexname LIKE '%pagination%' OR
      indexname LIKE '%dashboard%' OR
      indexname LIKE '%user_%' OR
      indexname LIKE '%search%' OR
      indexname LIKE '%alerts%'
    )
  ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VERIFICATION (optional)
-- =============================================
-- Total critical indexes
SELECT 
  'Critical Index Check' AS check_type,
  COUNT(*) AS total_indexes
FROM pg_indexes 
WHERE schemaname = 'public'
  AND (
    indexname LIKE '%pagination%' OR
    indexname LIKE '%dashboard%' OR
    indexname LIKE '%search%' OR
    indexname LIKE '%alerts%'
  );

-- Total index size
SELECT 
  'Total Index Size' AS metric,
  pg_size_pretty(SUM(pg_relation_size(indexname::regclass))) AS total_size
FROM pg_indexes 
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%';

-- Test pagination plan (opsional)
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, "date", amount, type
FROM financial_transactions
WHERE user_id = '00000000-0000-0000-0000-000000000000'
ORDER BY "date" DESC NULLS LAST, id DESC
LIMIT 20;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
DO $$
BEGIN
  RAISE NOTICE '🎉 CRITICAL INDEXES IMPLEMENTATION COMPLETED (fixed & idempotent)!';
  RAISE NOTICE '✅ Pagination & Sorting';
  RAISE NOTICE '✅ Search & Filtering';
  RAISE NOTICE '✅ Dashboard & Analytics (IMMUTABLE-safe)';
  RAISE NOTICE '✅ Relationships';
  RAISE NOTICE '✅ JSONB / Advanced';
  RAISE NOTICE 'Next: SELECT refresh_critical_dashboard();  -- when needed';
END $$;
