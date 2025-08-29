-- Verify all migrations were successful
-- Show function signatures that have been updated
\echo '--- UPDATED FUNCTION SIGNATURES ---'
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN (
    'calculate_comprehensive_profit',
    'calculate_material_costs_wac', 
    'get_expenses_by_period',
    'get_revenue_by_period',
    'get_sales_from_orders',
    'record_material_usage',
    'month_bucket_utc'
)
ORDER BY p.proname;

\echo '--- REMAINING DATE COLUMNS ---'
SELECT 
    n.nspname as schema_name,
    c.relname as table_name, 
    a.attname as column_name,
    t.typname as data_type,
    CASE c.relkind
        WHEN 'r' THEN 'table'
        WHEN 'v' THEN 'view'
        WHEN 'm' THEN 'materialized_view'
        ELSE 'other'
    END as object_type
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_type t ON a.atttypid = t.oid
WHERE n.nspname = 'public'
AND NOT a.attisdropped
AND a.attnum > 0
AND t.typname = 'date'
ORDER BY c.relname, a.attname;

\echo '--- CRITICAL TABLES TIMESTAMPTZ CHECK ---'
SELECT 
    c.relname as table_name,
    a.attname as column_name,
    t.typname as data_type
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_type t ON a.atttypid = t.oid
WHERE n.nspname = 'public'
AND c.relkind = 'r'
AND NOT a.attisdropped
AND a.attnum > 0
AND c.relname IN ('financial_transactions', 'orders', 'purchases', 'assets', 'production_logs', 'stock_adjustments', 'customer_debt')
AND a.attname IN ('date', 'tanggal', 'tanggal_beli', 'tanggal_pinjam', 'tanggal_bayar', 'jatuh_tempo')
ORDER BY c.relname, a.attname;
