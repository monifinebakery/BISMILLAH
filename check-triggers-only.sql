-- JALANKAN QUERY INI SATU PER SATU DI SUPABASE SQL EDITOR

-- 1. CEK APAKAH ADA TRIGGER FUNCTIONS
SELECT 
    p.proname as function_name,
    p.prosrc as function_body
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (
    p.proname ILIKE '%trigger%'
    OR p.proname ILIKE '%wac%'
    OR p.proname ILIKE '%purchase%'
    OR p.proname ILIKE '%warehouse%'
    OR p.prosrc ILIKE '%harga_rata_rata%'
);

-- 2. CEK SEMUA TRIGGERS AKTIF
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
        WHEN 28 THEN 'INSERT, DELETE, UPDATE'
    END as trigger_events
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- 3. CEK SEMUA FUNCTIONS YANG MENTION 'purchases' atau 'bahan_baku'
SELECT 
    p.proname as function_name,
    LEFT(p.prosrc, 200) as function_preview
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND (
    p.prosrc ILIKE '%purchases%'
    OR p.prosrc ILIKE '%bahan_baku%'
    OR p.prosrc ILIKE '%completed%'
    OR p.prosrc ILIKE '%status%'
);
