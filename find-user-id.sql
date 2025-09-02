-- CARI USER ID ANDA - Jalankan ini dulu untuk dapatkan User ID

-- 1. CEK SEMUA USERS (jika table users ada)
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
ORDER BY last_sign_in_at DESC NULLS LAST
LIMIT 10;

-- 2. ATAU CEK DARI DATA YANG ADA (pakai table purchases)
SELECT 
    user_id,
    COUNT(*) as purchase_count,
    MAX(created_at) as latest_purchase
FROM purchases
GROUP BY user_id
ORDER BY latest_purchase DESC;

-- 3. CEK DARI WAREHOUSE DATA
SELECT 
    user_id,
    COUNT(*) as warehouse_items,
    MAX(updated_at) as latest_update
FROM bahan_baku
GROUP BY user_id
ORDER BY latest_update DESC;

-- 4. CROSS CHECK - CARI USER ID YANG PUNYA DATA
SELECT 
    p.user_id,
    COUNT(DISTINCT p.id) as purchases,
    COUNT(DISTINCT bb.id) as warehouse_items,
    -- Try to get email if possible
    COALESCE(au.email, 'Email not accessible') as email
FROM purchases p
LEFT JOIN bahan_baku bb ON p.user_id = bb.user_id
LEFT JOIN auth.users au ON p.user_id = au.id
GROUP BY p.user_id, au.email
ORDER BY purchases DESC;

-- 5. JIKA EMAIL ACCESSIBLE, CARI BY EMAIL
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- COPY USER ID YANG DITEMUKAN, LALU GANTI 'your-user-id' DI SCRIPT RECALCULATE
