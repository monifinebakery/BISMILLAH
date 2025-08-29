-- Check function signatures that have been updated to timestamptz
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    obj_description(p.oid, 'pg_proc') as description
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
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);
