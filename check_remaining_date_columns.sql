-- Check remaining date columns after Phase 3 migration
SELECT 
    n.nspname as schema_name,
    c.relname as table_name, 
    a.attname as column_name,
    t.typname as data_type,
    CASE c.relkind
        WHEN 'r' THEN 'table'
        WHEN 'v' THEN 'view'
        WHEN 'm' THEN 'materialized_view'
        WHEN 'f' THEN 'foreign_table'
        WHEN 'p' THEN 'partitioned_table'
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
ORDER BY 
    CASE c.relkind
        WHEN 'r' THEN 1  -- tables first
        WHEN 'm' THEN 2  -- then mat views
        WHEN 'v' THEN 3  -- then views
        ELSE 4
    END,
    c.relname, 
    a.attname;
