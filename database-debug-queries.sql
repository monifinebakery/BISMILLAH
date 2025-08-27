-- Database Debug Queries for Financial Transactions Issue
-- Run these queries to debug the bulk operations financial sync issue

-- 1. Check recent purchases that were completed
SELECT 
    id,
    supplier,
    status,
    total_nilai as amount,
    tanggal as purchase_date,
    updated_at,
    user_id
FROM purchases 
WHERE status = 'completed'
AND updated_at > NOW() - INTERVAL '2 hours'
ORDER BY updated_at DESC
LIMIT 10;

-- 2. Check recent financial transactions
SELECT 
    id,
    type,
    category,
    amount,
    description,
    date as transaction_date,
    related_id,
    created_at,
    user_id
FROM financial_transactions 
WHERE created_at > NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check specifically for "Pembelian Bahan Baku" transactions
SELECT 
    id,
    type,
    category,
    amount,
    description,
    date as transaction_date,
    related_id,
    created_at,
    user_id
FROM financial_transactions 
WHERE category = 'Pembelian Bahan Baku'
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check for any relationship between recent purchases and financial transactions
SELECT 
    p.id as purchase_id,
    p.supplier,
    p.status,
    p.total_nilai as purchase_amount,
    p.updated_at as purchase_updated,
    ft.id as financial_id,
    ft.type,
    ft.category,
    ft.amount as transaction_amount,
    ft.description,
    ft.related_id,
    ft.created_at as transaction_created,
    CASE 
        WHEN p.id::text = ft.related_id THEN 'MATCH'
        ELSE 'NO MATCH' 
    END as relation_status
FROM purchases p
LEFT JOIN financial_transactions ft ON p.id::text = ft.related_id
WHERE p.status = 'completed'
AND p.updated_at > NOW() - INTERVAL '2 hours'
ORDER BY p.updated_at DESC
LIMIT 20;

-- 5. Check data types compatibility
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('purchases', 'financial_transactions')
AND column_name IN ('id', 'related_id', 'user_id')
ORDER BY table_name, column_name;

-- 6. Test query for current month filtering (like in UMKMExpenseCategories)
SELECT 
    category,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM financial_transactions 
WHERE type = 'expense'
AND date >= DATE_TRUNC('month', CURRENT_DATE)
AND date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
GROUP BY category
ORDER BY total_amount DESC;

-- 7. Check if there are any failed financial transaction creations
-- (Look for purchases with status = completed but no related financial transaction)
SELECT 
    p.id as purchase_id,
    p.supplier,
    p.status,
    p.total_nilai,
    p.updated_at,
    CASE 
        WHEN ft.id IS NULL THEN 'MISSING FINANCIAL TRANSACTION'
        ELSE 'HAS FINANCIAL TRANSACTION'
    END as sync_status
FROM purchases p
LEFT JOIN financial_transactions ft ON p.id::text = ft.related_id AND ft.type = 'expense'
WHERE p.status = 'completed'
AND p.updated_at > NOW() - INTERVAL '24 hours'
ORDER BY p.updated_at DESC
LIMIT 20;

-- 8. Check for any duplicate financial transactions
SELECT 
    related_id,
    category,
    COUNT(*) as duplicate_count,
    SUM(amount) as total_amount,
    ARRAY_AGG(id) as transaction_ids,
    ARRAY_AGG(created_at ORDER BY created_at) as creation_times
FROM financial_transactions 
WHERE type = 'expense'
AND category = 'Pembelian Bahan Baku'
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY related_id, category
HAVING COUNT(*) > 1;

-- 9. Get user_id for testing (replace with your actual user ID)
-- SELECT id, email FROM auth.users LIMIT 5;
