-- CHECK SUPABASE TRIGGERS - Run di Supabase SQL Editor
-- Cek apakah ada trigger function untuk WAC calculation

-- 1. CEK SEMUA TRIGGER FUNCTIONS
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type,
    pg_get_function_arguments(p.oid) as arguments,
    p.prosrc as function_body
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname ILIKE '%trigger%'
OR p.proname ILIKE '%wac%'
OR p.proname ILIKE '%purchase%'
OR p.proname ILIKE '%warehouse%'
ORDER BY p.proname;

-- 2. CEK SEMUA TRIGGERS YANG AKTIF
SELECT 
    t.tgname as trigger_name,
    c.relname as table_name,
    p.proname as function_name,
    CASE t.tgtype & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as trigger_timing,
    CASE t.tgtype & 28
        WHEN 4 THEN 'INSERT'
        WHEN 8 THEN 'DELETE'
        WHEN 16 THEN 'UPDATE'
        WHEN 12 THEN 'INSERT, DELETE'
        WHEN 20 THEN 'INSERT, UPDATE'
        WHEN 24 THEN 'DELETE, UPDATE'
        WHEN 28 THEN 'INSERT, DELETE, UPDATE'
    END as trigger_events
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE NOT t.tgisinternal
AND c.relname IN ('purchases', 'bahan_baku')
ORDER BY c.relname, t.tgname;

-- 3. CEK ISI FUNCTION YANG HANDLE WAC
SELECT 
    p.proname as function_name,
    p.prosrc as function_body
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (
    p.prosrc ILIKE '%harga_rata_rata%'
    OR p.prosrc ILIKE '%wac%'
    OR p.prosrc ILIKE '%weighted%average%'
    OR p.prosrc ILIKE '%purchase%'
);

-- 4. CEK POLICIES YANG MUNGKIN BLOCK UPDATE
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('purchases', 'bahan_baku')
ORDER BY tablename, policyname;
