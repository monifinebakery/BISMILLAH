-- DEBUG ITEMS YANG WAC MASIH 0 SETELAH RECALCULATION
-- Jalankan ini untuk cari tahu kenapa 75 items masih WAC = 0

-- 1. LIHAT ITEMS YANG WAC MASIH 0
SELECT 
    bb.id,
    bb.nama,
    bb.stok,
    bb.harga_satuan,
    bb.harga_rata_rata,
    bb.created_at,
    bb.updated_at
FROM bahan_baku bb
WHERE bb.user_id = 'your-user-id'::uuid
AND (bb.harga_rata_rata IS NULL OR bb.harga_rata_rata = 0)
ORDER BY bb.nama
LIMIT 10;

-- 2. CEK APAKAH ITEMS INI ADA DI PURCHASES
SELECT 
    bb.nama as bahan_nama,
    bb.id as bahan_id,
    bb.harga_rata_rata as current_wac,
    -- Check if this item appears in any completed purchases
    (SELECT COUNT(*) 
     FROM purchases p 
     WHERE p.status = 'completed' 
     AND p.user_id = bb.user_id
     AND (
         jsonb_path_exists(p.items, ('$[*] ? (@.bahanBakuId == "' || bb.id || '")')::jsonpath) OR
         jsonb_path_exists(p.items, ('$[*] ? (@.bahan_baku_id == "' || bb.id || '")')::jsonpath) OR
         jsonb_path_exists(p.items, ('$[*] ? (@.id == "' || bb.id || '")')::jsonpath)
     )
    ) as appears_in_purchases,
    -- Get sample purchase data for this item
    (SELECT json_agg(
        json_build_object(
            'purchase_id', p.id,
            'purchase_date', p.tanggal,
            'item_data', item_data
        )
     )
     FROM purchases p,
          jsonb_array_elements(p.items) as item_data
     WHERE p.status = 'completed' 
     AND p.user_id = bb.user_id
     AND (
         (item_data->>'bahanBakuId')::uuid = bb.id OR
         (item_data->>'bahan_baku_id')::uuid = bb.id OR
         (item_data->>'id')::uuid = bb.id
     )
     LIMIT 3
    ) as sample_purchases
FROM bahan_baku bb
WHERE bb.user_id = 'your-user-id'::uuid
AND (bb.harga_rata_rata IS NULL OR bb.harga_rata_rata = 0)
ORDER BY bb.nama
LIMIT 15;

-- 3. CEK STRUCTURE PURCHASE ITEMS UNTUK DEBUG FIELD MATCHING
SELECT 
    p.id as purchase_id,
    p.tanggal,
    jsonb_array_length(p.items) as items_count,
    -- Show first item structure
    (p.items->0) as first_item_structure,
    -- Extract all possible ID fields from first item
    (p.items->0->>'bahanBakuId') as bahanBakuId,
    (p.items->0->>'bahan_baku_id') as bahan_baku_id,
    (p.items->0->>'id') as id_field,
    -- Extract all possible qty fields
    (p.items->0->>'kuantitas') as kuantitas,
    (p.items->0->>'jumlah') as jumlah,
    -- Extract all possible price fields
    (p.items->0->>'hargaSatuan') as hargaSatuan,
    (p.items->0->>'harga_per_satuan') as harga_per_satuan,
    (p.items->0->>'harga_satuan') as harga_satuan
FROM purchases p
WHERE p.status = 'completed'
AND p.user_id = 'your-user-id'::uuid
AND p.items IS NOT NULL
AND jsonb_array_length(p.items) > 0
ORDER BY p.tanggal DESC
LIMIT 5;

-- 4. MANUAL TEST UPDATE WAC untuk 1 item yang bermasalah
-- Ambil item_id dari query #1, lalu test manual:
/*
SELECT * FROM update_wac_price(
    'item-id-dari-query-1'::uuid,
    'your-user-id'::uuid,
    10,  -- test quantity
    5000 -- test price
);
*/

-- 5. CEK APAKAH ITEMS ZERO-WAC PUNYA LINKING ISSUE
WITH zero_wac_items AS (
    SELECT id, nama 
    FROM bahan_baku 
    WHERE user_id = 'your-user-id'::uuid
    AND (harga_rata_rata IS NULL OR harga_rata_rata = 0)
),
purchase_item_ids AS (
    SELECT DISTINCT
        COALESCE(
            (item->>'bahanBakuId')::uuid,
            (item->>'bahan_baku_id')::uuid,
            (item->>'id')::uuid
        ) as extracted_id,
        item->>'nama' as item_name,
        (item->>'kuantitas')::numeric as qty,
        (item->>'hargaSatuan')::numeric as price
    FROM purchases p,
         jsonb_array_elements(p.items) as item
    WHERE p.status = 'completed'
    AND p.user_id = 'your-user-id'::uuid
    AND (
        (item->>'kuantitas')::numeric > 0 OR
        (item->>'jumlah')::numeric > 0
    )
    AND (
        (item->>'hargaSatuan')::numeric > 0 OR
        (item->>'harga_per_satuan')::numeric > 0 OR
        (item->>'harga_satuan')::numeric > 0
    )
)
SELECT 
    zwi.nama as warehouse_item,
    zwi.id as warehouse_id,
    CASE 
        WHEN pii.extracted_id IS NOT NULL THEN 'LINKED'
        ELSE 'NOT_LINKED'
    END as linking_status,
    pii.item_name as purchase_item_name,
    pii.qty,
    pii.price
FROM zero_wac_items zwi
LEFT JOIN purchase_item_ids pii ON pii.extracted_id = zwi.id
ORDER BY linking_status, zwi.nama
LIMIT 20;

-- INSTRUCTIONS:
-- 1. Ganti semua 'your-user-id' dengan User ID Anda
-- 2. Jalankan query 1-3 untuk analisis
-- 3. Share hasil queries untuk diagnosa masalah
-- 4. Query 5 akan show linking issues antara warehouse dan purchases
