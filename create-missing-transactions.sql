-- Manual SQL untuk membuat financial transactions yang missing
-- Jalankan ini untuk fix purchases yang tidak punya financial transactions

-- IMPORTANT: Ganti USER_ID dengan user ID yang sebenarnya
-- Jalankan query ini untuk mendapatkan user_id: SELECT DISTINCT user_id FROM purchases LIMIT 1;

-- Create financial transactions untuk purchases yang missing
INSERT INTO financial_transactions (
    user_id,
    type,
    category,
    amount,
    description,
    date,
    related_id,
    created_at,
    updated_at
)
SELECT 
    p.user_id,
    'expense' as type,
    'Pembelian Bahan Baku' as category,
    p.total_nilai as amount,
    CONCAT('Pembelian dari ', p.supplier) as description,
    p.tanggal as date,
    p.id::text as related_id,
    NOW() as created_at,
    NOW() as updated_at
FROM purchases p
LEFT JOIN financial_transactions ft ON p.id::text = ft.related_id AND ft.type = 'expense'
WHERE p.status = 'completed'
    AND ft.id IS NULL  -- Only insert for purchases without financial transactions
    AND p.updated_at >= '2025-08-27 11:54:32'  -- Only the bulk operation purchases
    AND p.updated_at <= '2025-08-27 11:54:33'
    -- Add user_id filter if needed: AND p.user_id = 'your-user-id-here'
;

-- Verify the insertions
SELECT 
    p.id as purchase_id,
    p.supplier,
    p.total_nilai as purchase_amount,
    ft.id as financial_id,
    ft.amount as transaction_amount,
    ft.category,
    ft.created_at as transaction_created
FROM purchases p
INNER JOIN financial_transactions ft ON p.id::text = ft.related_id
WHERE p.updated_at >= '2025-08-27 11:54:32'
    AND p.updated_at <= '2025-08-27 11:54:33'
    AND ft.created_at >= NOW() - INTERVAL '5 minutes'  -- Recently created transactions
ORDER BY ft.created_at DESC;

-- Check final count
SELECT 
    COUNT(CASE WHEN ft.id IS NOT NULL THEN 1 END) as with_transactions,
    COUNT(CASE WHEN ft.id IS NULL THEN 1 END) as without_transactions,
    COUNT(*) as total_completed_purchases
FROM purchases p
LEFT JOIN financial_transactions ft ON p.id::text = ft.related_id AND ft.type = 'expense'  
WHERE p.status = 'completed'
    AND p.updated_at >= '2025-08-27 11:54:32'
    AND p.updated_at <= '2025-08-27 11:54:33';
