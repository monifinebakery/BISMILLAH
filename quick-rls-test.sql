-- QUICK RLS TEST untuk Error 250901EYIRBGB
-- Jalankan di Supabase SQL Editor sebagai admin/postgres user

-- ======================
-- 1. CEK RLS STATUS
-- ======================
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_payments' 
  AND schemaname = 'public';

-- ======================
-- 2. CEK SEMUA RLS POLICIES
-- ======================
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
ORDER BY cmd, policyname;

-- ======================
-- 3. TEMPORARY DISABLE RLS (HATI-HATI!)
-- ======================

-- UNCOMMENT untuk test disable RLS
-- ALTER TABLE public.user_payments DISABLE ROW LEVEL SECURITY;

-- ======================
-- 4. TEST UPDATE TANPA RLS
-- ======================

-- Ganti dengan data real
-- YOUR_ORDER_ID = Order ID yang bermasalah
-- USER_UUID = UUID dari auth.users untuk user yang login 
-- USER_EMAIL = Email user yang login

/*
UPDATE public.user_payments 
SET 
    user_id = 'USER_UUID',
    email = 'USER_EMAIL',
    updated_at = NOW()
WHERE order_id = 'YOUR_ORDER_ID'
  AND user_id IS NULL
  AND is_paid = true
  AND payment_status = 'settled'
RETURNING *;
*/

-- ======================
-- 5. RE-ENABLE RLS SETELAH TEST
-- ======================

-- UNCOMMENT untuk re-enable RLS setelah test
-- ALTER TABLE public.user_payments ENABLE ROW LEVEL SECURITY;

-- ======================
-- 6. ALTERNATIVE: FIX RLS POLICY
-- ======================

-- Jika masalah memang RLS, buat policy yang allow auto-linking
-- UNCOMMENT dan sesuaikan policy ini

/*
-- Policy untuk allow user link payment yang email-nya match
CREATE POLICY "Allow users to link payments with their email" ON public.user_payments
FOR UPDATE 
TO authenticated 
USING (
    -- User can update payment if:
    -- 1. Payment currently has no user_id (unlinked)
    -- 2. Payment email matches user's email
    user_id IS NULL 
    AND email = auth.email()
)
WITH CHECK (
    -- After update, user_id should be the current user
    user_id = auth.uid()
);
*/

-- ======================
-- 7. SIMPLE FIX - BYPASS RLS UNTUK AUTO-LINKING
-- ======================

-- Buat stored function yang bypass RLS untuk auto-linking
/*
CREATE OR REPLACE FUNCTION public.link_payment_to_user(
    p_order_id text,
    p_user_id uuid,
    p_user_email text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER  -- Run as function owner (bypasses RLS)
AS $$
DECLARE
    result_row user_payments%ROWTYPE;
BEGIN
    -- Update the payment record
    UPDATE public.user_payments 
    SET 
        user_id = p_user_id,
        email = p_user_email,
        updated_at = NOW()
    WHERE order_id = p_order_id
      AND user_id IS NULL
      AND is_paid = true
      AND payment_status = 'settled'
    RETURNING * INTO result_row;
    
    -- Check if update was successful
    IF result_row.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No rows updated - payment may not exist or conditions not met',
            'error_code', '250901EYIRBGB'
        );
    END IF;
    
    -- Return success with updated data
    RETURN json_build_object(
        'success', true,
        'data', row_to_json(result_row)
    );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.link_payment_to_user TO authenticated;
*/

-- ======================
-- 8. TEST FUNCTION
-- ======================

-- Test function yang bypass RLS
-- SELECT public.link_payment_to_user('YOUR_ORDER_ID', 'USER_UUID', 'USER_EMAIL');

-- ======================
-- NOTES
-- ======================

/*
DIAGNOSIS PENYEBAB ERROR 250901:

Jika status = 'settled' dan is_paid = true sudah benar, 
kemungkinan besar masalahnya adalah:

1. RLS POLICY - Policy tidak allow user update row yang user_id = null
   Solution: Disable temporary / create proper policy / use SECURITY DEFINER function

2. UNIQUE CONSTRAINT - User sudah punya payment lain 
   Solution: Check existing payments untuk user tersebut

3. TRIGGER ERROR - Trigger gagal execute saat update
   Solution: Check trigger functions dan disable if necessary

RECOMMENDED APPROACH:
1. Jalankan step 1-2 untuk diagnose RLS
2. Jika RLS adalah masalah, gunakan SECURITY DEFINER function (step 7)
3. Call function dari aplikasi instead of direct UPDATE
4. Function akan bypass RLS dan execute as admin

QUICK TEST:
1. Disable RLS temporary (step 3)
2. Test manual UPDATE (step 4) 
3. Jika berhasil = masalahnya RLS
4. Re-enable RLS (step 5)
5. Implement function solution (step 7)
*/
