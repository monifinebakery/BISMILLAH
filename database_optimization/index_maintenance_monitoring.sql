-- =============================================
-- INDEX MAINTENANCE & MONITORING
-- Script untuk maintenance dan monitoring index database
-- =============================================

-- Aktifkan extension yang diperlukan
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_buffercache;

-- =============================================
-- INDEX HEALTH MONITORING FUNCTIONS
-- =============================================

-- Function untuk cek index yang tidak terpakai
CREATE OR REPLACE FUNCTION get_unused_indexes()
RETURNS TABLE(
    schema_name text,
    table_name text,
    index_name text,
    index_size text,
    index_scans bigint,
    table_scans bigint,
    recommendation text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        psi.schemaname::text as schema_name,
        psi.tablename::text as table_name,
        psi.indexname::text as index_name,
        pg_size_pretty(pg_relation_size(psi.indexname::regclass))::text as index_size,
        psi.idx_scan as index_scans,
        pst.seq_scan as table_scans,
        CASE 
            WHEN psi.idx_scan = 0 AND pst.seq_scan > 1000 THEN 'CONSIDER DROPPING - Never used but table frequently scanned'
            WHEN psi.idx_scan = 0 THEN 'CONSIDER DROPPING - Never used'
            WHEN psi.idx_scan < 10 AND pst.seq_scan > 1000 THEN 'REVIEW - Rarely used but table frequently scanned'
            WHEN psi.idx_scan < 100 THEN 'MONITOR - Low usage'
            ELSE 'KEEP - Good usage'
        END::text as recommendation
    FROM pg_stat_user_indexes psi
    JOIN pg_stat_user_tables pst ON psi.relid = pst.relid
    WHERE psi.schemaname = 'public'
    AND psi.indexname NOT LIKE '%_pkey'
    ORDER BY psi.idx_scan ASC, pg_relation_size(psi.indexname::regclass) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function untuk cek index yang duplikat atau redundant
CREATE OR REPLACE FUNCTION get_duplicate_indexes()
RETURNS TABLE(
    table_name text,
    index1_name text,
    index1_definition text,
    index2_name text,
    index2_definition text,
    recommendation text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t1.tablename::text as table_name,
        i1.indexname::text as index1_name,
        pg_get_indexdef(i1.indexname::regclass)::text as index1_definition,
        i2.indexname::text as index2_name,
        pg_get_indexdef(i2.indexname::regclass)::text as index2_definition,
        'POTENTIAL DUPLICATE - Review if both indexes are needed'::text as recommendation
    FROM pg_indexes i1
    JOIN pg_indexes i2 ON i1.tablename = i2.tablename
    JOIN pg_tables t1 ON i1.tablename = t1.tablename
    WHERE i1.schemaname = 'public'
    AND i2.schemaname = 'public'
    AND i1.indexname < i2.indexname
    AND i1.indexname NOT LIKE '%_pkey'
    AND i2.indexname NOT LIKE '%_pkey'
    AND (
        -- Check for similar column patterns
        pg_get_indexdef(i1.indexname::regclass) SIMILAR TO pg_get_indexdef(i2.indexname::regclass) || '%'
        OR pg_get_indexdef(i2.indexname::regclass) SIMILAR TO pg_get_indexdef(i1.indexname::regclass) || '%'
    );
END;
$$ LANGUAGE plpgsql;

-- Function untuk cek index bloat
CREATE OR REPLACE FUNCTION get_index_bloat()
RETURNS TABLE(
    schema_name text,
    table_name text,
    index_name text,
    index_size text,
    bloat_ratio numeric,
    wasted_space text,
    recommendation text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::text as schema_name,
        tablename::text as table_name,
        indexname::text as index_name,
        pg_size_pretty(pg_relation_size(indexname::regclass))::text as index_size,
        CASE 
            WHEN pg_relation_size(indexname::regclass) = 0 THEN 0::numeric
            ELSE ROUND(
                (pg_relation_size(indexname::regclass)::numeric / 
                GREATEST(pg_relation_size(tablename::regclass)::numeric, 1)) * 100, 2
            )
        END as bloat_ratio,
        CASE 
            WHEN pg_relation_size(indexname::regclass) > 100 * 1024 * 1024 THEN -- > 100MB
                pg_size_pretty(pg_relation_size(indexname::regclass) * 0.2)  -- Estimate 20% bloat
            ELSE 'N/A'
        END::text as wasted_space,
        CASE 
            WHEN pg_relation_size(indexname::regclass) > 500 * 1024 * 1024 THEN -- > 500MB
                'REINDEX RECOMMENDED - Large index, likely bloated'
            WHEN pg_relation_size(indexname::regclass) > 100 * 1024 * 1024 THEN -- > 100MB
                'MONITOR - Consider reindexing if performance issues'
            ELSE 'OK - Index size acceptable'
        END::text as recommendation
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname NOT LIKE '%_pkey'
    ORDER BY pg_relation_size(indexname::regclass) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function untuk cek index usage efficiency
CREATE OR REPLACE FUNCTION get_index_efficiency()
RETURNS TABLE(
    table_name text,
    index_name text,
    index_scans bigint,
    tuples_read bigint,
    tuples_fetched bigint,
    hit_ratio numeric,
    efficiency_score text,
    recommendation text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        psi.tablename::text as table_name,
        psi.indexname::text as index_name,
        psi.idx_scan as index_scans,
        psi.idx_tup_read as tuples_read,
        psi.idx_tup_fetch as tuples_fetched,
        CASE 
            WHEN psi.idx_tup_read = 0 THEN 0::numeric
            ELSE ROUND((psi.idx_tup_fetch::numeric / psi.idx_tup_read::numeric) * 100, 2)
        END as hit_ratio,
        CASE 
            WHEN psi.idx_scan = 0 THEN 'UNUSED'
            WHEN psi.idx_tup_read = 0 THEN 'NO DATA'
            WHEN (psi.idx_tup_fetch::numeric / GREATEST(psi.idx_tup_read::numeric, 1)) > 0.9 THEN 'EXCELLENT'
            WHEN (psi.idx_tup_fetch::numeric / GREATEST(psi.idx_tup_read::numeric, 1)) > 0.7 THEN 'GOOD'
            WHEN (psi.idx_tup_fetch::numeric / GREATEST(psi.idx_tup_read::numeric, 1)) > 0.5 THEN 'FAIR'
            ELSE 'POOR'
        END::text as efficiency_score,
        CASE 
            WHEN psi.idx_scan = 0 THEN 'Consider dropping if consistently unused'
            WHEN psi.idx_tup_read > 0 AND (psi.idx_tup_fetch::numeric / psi.idx_tup_read::numeric) < 0.5 THEN 
                'Low efficiency - Review index design'
            WHEN psi.idx_scan < 10 THEN 'Monitor usage - May need optimization'
            ELSE 'Index performing well'
        END::text as recommendation
    FROM pg_stat_user_indexes psi
    WHERE psi.schemaname = 'public'
    AND psi.indexname NOT LIKE '%_pkey'
    ORDER BY psi.idx_scan DESC, hit_ratio DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- MAINTENANCE PROCEDURES
-- =============================================

-- Procedure untuk reindex table tertentu
CREATE OR REPLACE FUNCTION reindex_table_safely(
    p_table_name text,
    p_concurrent boolean DEFAULT true
)
RETURNS text AS $$
DECLARE
    index_record record;
    result_message text := '';
    start_time timestamp;
    end_time timestamp;
BEGIN
    start_time := clock_timestamp();
    
    -- Validate table exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' AND tablename = p_table_name
    ) THEN
        RETURN 'ERROR: Table ' || p_table_name || ' does not exist';
    END IF;
    
    result_message := 'Reindexing table: ' || p_table_name || E'\n';
    
    -- Reindex each index individually for better control
    FOR index_record IN 
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = p_table_name
        AND indexname NOT LIKE '%_pkey'
    LOOP
        BEGIN
            IF p_concurrent THEN
                EXECUTE 'REINDEX INDEX CONCURRENTLY ' || index_record.indexname;
                result_message := result_message || '✅ Reindexed (concurrent): ' || index_record.indexname || E'\n';
            ELSE
                EXECUTE 'REINDEX INDEX ' || index_record.indexname;
                result_message := result_message || '✅ Reindexed: ' || index_record.indexname || E'\n';
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                result_message := result_message || '❌ Failed to reindex: ' || index_record.indexname || ' - ' || SQLERRM || E'\n';
        END;
    END LOOP;
    
    end_time := clock_timestamp();
    result_message := result_message || 'Completed in: ' || (end_time - start_time) || E'\n';
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- Procedure untuk maintenance harian
CREATE OR REPLACE FUNCTION daily_index_maintenance()
RETURNS text AS $$
DECLARE
    result_message text := '';
    table_record record;
BEGIN
    result_message := '🔧 DAILY INDEX MAINTENANCE STARTED: ' || CURRENT_TIMESTAMP || E'\n\n';
    
    -- Update table statistics
    result_message := result_message || '📊 Updating table statistics...' || E'\n';
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN (
            'financial_transactions', 'orders', 'purchases', 
            'bahan_baku', 'recipes', 'suppliers', 'activities',
            'operational_costs'
        )
    LOOP
        EXECUTE 'ANALYZE ' || table_record.tablename;
        result_message := result_message || '  ✅ Analyzed: ' || table_record.tablename || E'\n';
    END LOOP;
    
    -- Refresh materialized views
    result_message := result_message || E'\n📈 Refreshing materialized views...' || E'\n';
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY critical_dashboard_summary;
        result_message := result_message || '  ✅ Refreshed: critical_dashboard_summary' || E'\n';
    EXCEPTION
        WHEN OTHERS THEN
            result_message := result_message || '  ❌ Failed to refresh critical_dashboard_summary: ' || SQLERRM || E'\n';
    END;
    
    -- Check for unused indexes
    result_message := result_message || E'\n🔍 Checking for unused indexes...' || E'\n';
    IF EXISTS (
        SELECT 1 FROM get_unused_indexes() 
        WHERE recommendation LIKE 'CONSIDER DROPPING%'
    ) THEN
        result_message := result_message || '  ⚠️  Found unused indexes - Run get_unused_indexes() for details' || E'\n';
    ELSE
        result_message := result_message || '  ✅ All indexes are being used' || E'\n';
    END IF;
    
    result_message := result_message || E'\n🎉 DAILY MAINTENANCE COMPLETED: ' || CURRENT_TIMESTAMP || E'\n';
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- Procedure untuk maintenance mingguan
CREATE OR REPLACE FUNCTION weekly_index_maintenance()
RETURNS text AS $$
DECLARE
    result_message text := '';
    bloated_index record;
BEGIN
    result_message := '🔧 WEEKLY INDEX MAINTENANCE STARTED: ' || CURRENT_TIMESTAMP || E'\n\n';
    
    -- Run daily maintenance first
    result_message := result_message || daily_index_maintenance() || E'\n';
    
    -- Check index bloat and reindex if needed
    result_message := result_message || '🗜️  Checking index bloat...' || E'\n';
    FOR bloated_index IN 
        SELECT table_name, index_name 
        FROM get_index_bloat() 
        WHERE recommendation LIKE 'REINDEX RECOMMENDED%'
        LIMIT 3  -- Limit to prevent long maintenance windows
    LOOP
        result_message := result_message || '  🔄 Reindexing bloated index: ' || bloated_index.index_name || E'\n';
        BEGIN
            EXECUTE 'REINDEX INDEX CONCURRENTLY ' || bloated_index.index_name;
            result_message := result_message || '    ✅ Successfully reindexed: ' || bloated_index.index_name || E'\n';
        EXCEPTION
            WHEN OTHERS THEN
                result_message := result_message || '    ❌ Failed to reindex: ' || bloated_index.index_name || ' - ' || SQLERRM || E'\n';
        END;
    END LOOP;
    
    -- Vacuum analyze critical tables
    result_message := result_message || E'\n🧹 Running VACUUM ANALYZE on critical tables...' || E'\n';
    EXECUTE 'VACUUM ANALYZE financial_transactions';
    result_message := result_message || '  ✅ VACUUM ANALYZE: financial_transactions' || E'\n';
    
    EXECUTE 'VACUUM ANALYZE orders';
    result_message := result_message || '  ✅ VACUUM ANALYZE: orders' || E'\n';
    
    EXECUTE 'VACUUM ANALYZE bahan_baku';
    result_message := result_message || '  ✅ VACUUM ANALYZE: bahan_baku' || E'\n';
    
    result_message := result_message || E'\n🎉 WEEKLY MAINTENANCE COMPLETED: ' || CURRENT_TIMESTAMP || E'\n';
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PERFORMANCE MONITORING VIEWS
-- =============================================

-- View untuk monitoring index performance
CREATE OR REPLACE VIEW v_index_performance_summary AS
SELECT 
    psi.schemaname,
    psi.tablename,
    psi.indexname,
    pg_size_pretty(pg_relation_size(psi.indexname::regclass)) as index_size,
    psi.idx_scan as scans,
    psi.idx_tup_read as tuples_read,
    psi.idx_tup_fetch as tuples_fetched,
    CASE 
        WHEN psi.idx_tup_read = 0 THEN 0
        ELSE ROUND((psi.idx_tup_fetch::numeric / psi.idx_tup_read::numeric) * 100, 2)
    END as hit_ratio_percent,
    CASE 
        WHEN psi.idx_scan = 0 THEN 'UNUSED'
        WHEN psi.idx_scan < 10 THEN 'LOW_USAGE'
        WHEN psi.idx_scan < 100 THEN 'MODERATE_USAGE'
        ELSE 'HIGH_USAGE'
    END as usage_category,
    pg_stat_get_last_analyze_time(psi.relid) as last_analyzed
FROM pg_stat_user_indexes psi
WHERE psi.schemaname = 'public'
AND psi.indexname NOT LIKE '%_pkey'
ORDER BY psi.idx_scan DESC;

-- View untuk monitoring table scan patterns
CREATE OR REPLACE VIEW v_table_scan_patterns AS
SELECT 
    schemaname,
    tablename,
    seq_scan as sequential_scans,
    seq_tup_read as sequential_tuples_read,
    idx_scan as index_scans,
    idx_tup_fetch as index_tuples_fetched,
    CASE 
        WHEN (seq_scan + idx_scan) = 0 THEN 0
        ELSE ROUND((idx_scan::numeric / (seq_scan + idx_scan)::numeric) * 100, 2)
    END as index_usage_ratio,
    CASE 
        WHEN seq_scan > idx_scan * 2 THEN 'NEEDS_MORE_INDEXES'
        WHEN idx_scan > seq_scan * 10 THEN 'WELL_INDEXED'
        ELSE 'BALANCED'
    END as indexing_status,
    n_tup_ins + n_tup_upd + n_tup_del as total_modifications,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as total_size
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY (seq_scan + idx_scan) DESC;

-- =============================================
-- AUTOMATED MONITORING ALERTS
-- =============================================

-- Function untuk generate alerts
CREATE OR REPLACE FUNCTION generate_index_alerts()
RETURNS TABLE(
    alert_type text,
    severity text,
    object_name text,
    message text,
    recommendation text
) AS $$
BEGIN
    -- Alert untuk unused indexes
    RETURN QUERY
    SELECT 
        'UNUSED_INDEX'::text as alert_type,
        'WARNING'::text as severity,
        ui.index_name::text as object_name,
        ('Index ' || ui.index_name || ' has not been used (0 scans)')::text as message,
        ui.recommendation::text as recommendation
    FROM get_unused_indexes() ui
    WHERE ui.index_scans = 0
    AND ui.index_name NOT LIKE '%_pkey';
    
    -- Alert untuk large indexes dengan low usage
    RETURN QUERY
    SELECT 
        'LOW_EFFICIENCY_INDEX'::text as alert_type,
        'INFO'::text as severity,
        ie.index_name::text as object_name,
        ('Index ' || ie.index_name || ' has low efficiency: ' || ie.efficiency_score)::text as message,
        ie.recommendation::text as recommendation
    FROM get_index_efficiency() ie
    WHERE ie.efficiency_score IN ('POOR', 'FAIR')
    AND ie.index_scans > 0;
    
    -- Alert untuk bloated indexes
    RETURN QUERY
    SELECT 
        'BLOATED_INDEX'::text as alert_type,
        'WARNING'::text as severity,
        ib.index_name::text as object_name,
        ('Index ' || ib.index_name || ' may be bloated (size: ' || ib.index_size || ')')::text as message,
        ib.recommendation::text as recommendation
    FROM get_index_bloat() ib
    WHERE ib.recommendation LIKE 'REINDEX RECOMMENDED%';
    
    -- Alert untuk tables dengan high sequential scan ratio
    RETURN QUERY
    SELECT 
        'HIGH_SEQUENTIAL_SCANS'::text as alert_type,
        'INFO'::text as severity,
        tsp.tablename::text as object_name,
        ('Table ' || tsp.tablename || ' has high sequential scan ratio: ' || 
         ROUND((tsp.sequential_scans::numeric / GREATEST(tsp.sequential_scans + tsp.index_scans, 1)::numeric) * 100, 1) || '%')::text as message,
        'Consider adding indexes for frequently filtered columns'::text as recommendation
    FROM v_table_scan_patterns tsp
    WHERE tsp.indexing_status = 'NEEDS_MORE_INDEXES'
    AND tsp.sequential_scans > 100;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- REPORTING FUNCTIONS
-- =============================================

-- Function untuk generate comprehensive index report
CREATE OR REPLACE FUNCTION generate_index_report()
RETURNS text AS $$
DECLARE
    report_text text := '';
    total_indexes integer;
    total_size text;
    unused_count integer;
    bloated_count integer;
BEGIN
    -- Header
    report_text := '📊 DATABASE INDEX PERFORMANCE REPORT' || E'\n';
    report_text := report_text || 'Generated: ' || CURRENT_TIMESTAMP || E'\n';
    report_text := report_text || '================================================' || E'\n\n';
    
    -- Summary statistics
    SELECT COUNT(*), pg_size_pretty(SUM(pg_relation_size(indexname::regclass)))
    INTO total_indexes, total_size
    FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname NOT LIKE '%_pkey';
    
    SELECT COUNT(*) INTO unused_count
    FROM get_unused_indexes() 
    WHERE index_scans = 0;
    
    SELECT COUNT(*) INTO bloated_count
    FROM get_index_bloat() 
    WHERE recommendation LIKE 'REINDEX RECOMMENDED%';
    
    report_text := report_text || '📈 SUMMARY STATISTICS' || E'\n';
    report_text := report_text || '  Total Indexes: ' || total_indexes || E'\n';
    report_text := report_text || '  Total Size: ' || total_size || E'\n';
    report_text := report_text || '  Unused Indexes: ' || unused_count || E'\n';
    report_text := report_text || '  Bloated Indexes: ' || bloated_count || E'\n\n';
    
    -- Top performing indexes
    report_text := report_text || '🏆 TOP PERFORMING INDEXES' || E'\n';
    report_text := report_text || '  (Most frequently used)' || E'\n';
    FOR rec IN 
        SELECT index_name, scans, hit_ratio_percent
        FROM v_index_performance_summary 
        WHERE usage_category = 'HIGH_USAGE'
        ORDER BY scans DESC 
        LIMIT 5
    LOOP
        report_text := report_text || '  ✅ ' || rec.index_name || ' - ' || rec.scans || ' scans, ' || rec.hit_ratio_percent || '% hit ratio' || E'\n';
    END LOOP;
    
    -- Alerts summary
    report_text := report_text || E'\n🚨 ALERTS SUMMARY' || E'\n';
    FOR rec IN 
        SELECT alert_type, COUNT(*) as alert_count
        FROM generate_index_alerts()
        GROUP BY alert_type
        ORDER BY alert_count DESC
    LOOP
        report_text := report_text || '  ⚠️  ' || rec.alert_type || ': ' || rec.alert_count || ' issues' || E'\n';
    END LOOP;
    
    report_text := report_text || E'\n================================================' || E'\n';
    report_text := report_text || '💡 Run specific monitoring functions for detailed analysis:' || E'\n';
    report_text := report_text || '  - SELECT * FROM get_unused_indexes();' || E'\n';
    report_text := report_text || '  - SELECT * FROM get_index_efficiency();' || E'\n';
    report_text := report_text || '  - SELECT * FROM get_index_bloat();' || E'\n';
    report_text := report_text || '  - SELECT * FROM generate_index_alerts();' || E'\n';
    
    RETURN report_text;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SCHEDULED MAINTENANCE SETUP
-- =============================================

-- Function untuk setup automated maintenance (requires pg_cron extension)
CREATE OR REPLACE FUNCTION setup_automated_maintenance()
RETURNS text AS $$
BEGIN
    -- Note: This requires pg_cron extension to be installed
    -- Daily maintenance at 2 AM
    -- SELECT cron.schedule('daily-index-maintenance', '0 2 * * *', 'SELECT daily_index_maintenance();');
    
    -- Weekly maintenance on Sunday at 3 AM
    -- SELECT cron.schedule('weekly-index-maintenance', '0 3 * * 0', 'SELECT weekly_index_maintenance();');
    
    RETURN 'Automated maintenance setup instructions:' || E'\n' ||
           '1. Install pg_cron extension' || E'\n' ||
           '2. Run: SELECT cron.schedule(''daily-index-maintenance'', ''0 2 * * *'', ''SELECT daily_index_maintenance();'');' || E'\n' ||
           '3. Run: SELECT cron.schedule(''weekly-index-maintenance'', ''0 3 * * 0'', ''SELECT weekly_index_maintenance();'');' || E'\n';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- INITIAL MONITORING SETUP
-- =============================================

-- Reset statistics untuk fresh monitoring
SELECT pg_stat_reset();

-- Update table statistics
SELECT update_table_statistics();

-- Generate initial report
SELECT generate_index_report();

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '🎉 INDEX MAINTENANCE & MONITORING SETUP COMPLETED!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Available monitoring functions:';
    RAISE NOTICE '   - get_unused_indexes() - Find unused indexes';
    RAISE NOTICE '   - get_duplicate_indexes() - Find duplicate indexes';
    RAISE NOTICE '   - get_index_bloat() - Check index bloat';
    RAISE NOTICE '   - get_index_efficiency() - Analyze index efficiency';
    RAISE NOTICE '   - generate_index_alerts() - Get performance alerts';
    RAISE NOTICE '   - generate_index_report() - Comprehensive report';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Available maintenance functions:';
    RAISE NOTICE '   - daily_index_maintenance() - Daily maintenance routine';
    RAISE NOTICE '   - weekly_index_maintenance() - Weekly maintenance routine';
    RAISE NOTICE '   - reindex_table_safely(table_name) - Safe table reindexing';
    RAISE NOTICE '';
    RAISE NOTICE '📈 Available monitoring views:';
    RAISE NOTICE '   - v_index_performance_summary - Index performance overview';
    RAISE NOTICE '   - v_table_scan_patterns - Table scan analysis';
    RAISE NOTICE '';
    RAISE NOTICE '⏰ To setup automated maintenance:';
    RAISE NOTICE '   - SELECT setup_automated_maintenance();';
END $$;