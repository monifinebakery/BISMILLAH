-- Emergency Debug: Check what happened with bulk operations at 11:54:32

-- 1. Check if any financial transactions were attempted around that time
SELECT 
    id,
    type,
    category,
    amount,
    description,
    related_id,
    created_at,
    date as transaction_date
FROM financial_transactions 
WHERE created_at >= '2025-08-27 11:54:00'
AND created_at <= '2025-08-27 11:55:00'
ORDER BY created_at DESC;

-- 2. Get the exact purchases from bulk operation 
SELECT 
    id as purchase_id,
    supplier,
    status,
    total_nilai,
    updated_at,
    user_id
FROM purchases 
WHERE updated_at >= '2025-08-27 11:54:32'
AND updated_at <= '2025-08-27 11:54:33'
ORDER BY updated_at DESC;

-- 3. Check if there are any error logs or failed transactions
-- (This might not exist but worth checking)
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name LIKE '%log%' OR table_name LIKE '%error%';

-- 4. Check if there's a user_id mismatch issue
SELECT DISTINCT user_id 
FROM purchases 
WHERE updated_at >= '2025-08-27 11:54:32'
AND updated_at <= '2025-08-27 11:54:33';

-- 5. Try to find any financial transactions with these purchase IDs
SELECT 
    p.id as purchase_id,
    p.total_nilai,
    p.updated_at,
    ft.id as financial_id,
    ft.created_at,
    ft.amount,
    ft.category
FROM purchases p
LEFT JOIN financial_transactions ft ON p.id::text = ft.related_id
WHERE p.id IN (
    '16226eaa-6e96-4939-941a-18b2206e43d0',
    '5ade721d-45ae-4cc3-aa97-e3bc7e436c93', 
    '4e9923f4-33a5-49f4-817a-6f205b1ab9b2',
    '160a8db3-2947-4836-b2e3-d45c4af4d57e',
    '4f74fd8a-742e-4fd0-9099-8c4c616bffd9',
    '0d0f3e01-2bed-4ed5-8be9-e0536474201b',
    '1313b81d-3a5f-4074-875a-74dfc32b6f35',
    '5c1d4ec3-bfce-4e2b-8674-95e01b5ff6fd',
    'd944f705-dda5-4b7d-87b6-c9e3c13b9663',
    '81bfbc8d-b660-4a21-a58f-88a2ea750934'
);
