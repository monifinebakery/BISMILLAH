-- Check financial transactions table structure and data
-- Run this in Supabase SQL Editor

-- 1. Check if financial_transactions table exists
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'financial_transactions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check existing financial transactions
SELECT 
    id,
    user_id, 
    type,
    category,
    amount,
    description,
    date,
    created_at
FROM public.financial_transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check for any order-related financial transactions
SELECT 
    id,
    type,
    category,
    amount,
    description,
    date
FROM public.financial_transactions 
WHERE description LIKE 'Pesanan %'
ORDER BY created_at DESC;

-- 4. Check if there are any completed orders without financial sync
SELECT 
    o.id,
    o.nomor_pesanan,
    o.status,
    o.total_pesanan,
    o.tanggal,
    CASE 
        WHEN ft.id IS NOT NULL THEN 'Has Financial Transaction'
        ELSE 'Missing Financial Transaction'
    END as sync_status
FROM public.orders o
LEFT JOIN public.financial_transactions ft 
    ON ft.description = 'Pesanan ' || o.nomor_pesanan 
    AND ft.type = 'income'
    AND ft.user_id = o.user_id
WHERE o.status = 'completed'
ORDER BY o.created_at DESC;
