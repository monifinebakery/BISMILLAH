-- Test Manual Linking for Error 250901EYIRBGB Debug
-- Jalankan di Supabase SQL Editor atau psql

-- ======================
-- STEP 1: CEK DATA PAYMENT
-- ======================

-- Ganti 'YOUR_ORDER_ID' dengan Order ID yang bermasalah
SELECT 
    id,
    user_id,
    order_id, 
    name,
    email,
    payment_status,
    is_paid,
    pg_reference_id,
    created_at,
    updated_at,
    workspace_id
FROM user_payments 
WHERE order_id = 'YOUR_ORDER_ID';

-- ======================
-- STEP 2: CEK USER YANG LOGIN
-- ======================

-- Ganti 'user@email.com' dengan email user yang bermasalah
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'user@email.com';

-- ======================
-- STEP 3: TEST CONDITIONS SATU-SATU
-- ======================

-- Test apakah order exist
SELECT COUNT(*) as order_exists
FROM user_payments 
WHERE order_id = 'YOUR_ORDER_ID';

-- Test apakah user_id null
SELECT COUNT(*) as user_id_is_null
FROM user_payments 
WHERE order_id = 'YOUR_ORDER_ID'
  AND user_id IS NULL;

-- Test apakah is_paid true
SELECT COUNT(*) as is_paid_true
FROM user_payments 
WHERE order_id = 'YOUR_ORDER_ID'
  AND is_paid = true;

-- Test apakah status settled
SELECT COUNT(*) as status_settled
FROM user_payments 
WHERE order_id = 'YOUR_ORDER_ID'
  AND payment_status = 'settled';

-- Test semua kondisi sekaligus
SELECT COUNT(*) as all_conditions_match
FROM user_payments 
WHERE order_id = 'YOUR_ORDER_ID'
  AND user_id IS NULL
  AND is_paid = true
  AND payment_status = 'settled';

-- ======================
-- STEP 4: CEK RLS POLICIES
-- ======================

-- Cek RLS policies untuk UPDATE
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'user_payments'
  AND cmd = 'UPDATE';

-- ======================
-- STEP 5: CEK CONSTRAINTS
-- ======================

-- Cek constraint yang mungkin mencegah update
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'user_payments'
  AND tc.table_schema = 'public'
  AND tc.constraint_type IN ('UNIQUE', 'CHECK', 'FOREIGN KEY');

-- ======================
-- STEP 6: CEK TRIGGERS
-- ======================

-- Cek triggers yang mungkin mencegah update
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'user_payments'
  AND event_object_schema = 'public';

-- ======================
-- STEP 7: TEST MANUAL UPDATE
-- ======================

-- HATI-HATI: Backup data dulu sebelum test!
-- Ganti 'YOUR_ORDER_ID' dan 'USER_UUID' dengan nilai yang benar

-- Test update manual (DRY RUN - lihat apa yang akan di-update)
SELECT 
    id,
    user_id,
    order_id,
    email,
    'AKAN_DIUBAH_KE_USER_UUID' as new_user_id,
    'AKAN_DIUBAH_KE_USER_EMAIL' as new_email
FROM user_payments 
WHERE order_id = 'YOUR_ORDER_ID'
  AND user_id IS NULL
  AND is_paid = true
  AND payment_status = 'settled';

-- ======================
-- STEP 8: ACTUAL UPDATE TEST (HATI-HATI!)
-- ======================

-- UNCOMMENT dan jalankan HANYA jika yakin data sudah benar
-- Ganti nilai sesuai dengan data real

/*
UPDATE user_payments 
SET 
    user_id = 'USER_UUID_FROM_AUTH_USERS',
    email = 'user@email.com',
    updated_at = NOW()
WHERE order_id = 'YOUR_ORDER_ID'
  AND user_id IS NULL
  AND is_paid = true
  AND payment_status = 'settled'
RETURNING 
    id,
    user_id,
    order_id,
    email,
    updated_at;
*/

-- ======================
-- STEP 9: VERIFY RESULT
-- ======================

-- Cek apakah update berhasil
SELECT 
    id,
    user_id,
    order_id,
    email,
    payment_status,
    is_paid,
    updated_at
FROM user_payments 
WHERE order_id = 'YOUR_ORDER_ID';

-- ======================
-- DEBUGGING NOTES
-- ======================

/*
KEMUNGKINAN PENYEBAB ERROR 250901:

1. RLS POLICY ISSUE
   - Policy mencegah user update row yang user_id = null
   - Policy hanya allow user update row milik mereka sendiri
   - Solution: Disable RLS temporary atau update policy

2. CONSTRAINT VIOLATION
   - Unique constraint user_payments_email_user_unique
   - User sudah punya payment lain dengan email sama
   - Solution: Cek constraint dan handle di aplikasi

3. TRIGGER ISSUE
   - Trigger tr_user_payments_normalize mengubah data
   - Trigger tr_set_workspace_id error
   - Solution: Check trigger logic

4. DATA TYPE ISSUE
   - user_id format tidak valid (bukan UUID)
   - email format tidak valid
   - Solution: Validate data format

5. TRANSACTION ISSUE
   - Update dalam transaction yang di-rollback
   - Deadlock atau lock timeout
   - Solution: Check transaction isolation

LANGKAH DEBUG:
1. Jalankan STEP 1-6 untuk investigasi
2. Cek hasil setiap query
3. Identifikasi mana yang return 0 atau error
4. Fix issue yang ditemukan
5. Test manual update (STEP 8)
6. Verify dengan STEP 9
*/
