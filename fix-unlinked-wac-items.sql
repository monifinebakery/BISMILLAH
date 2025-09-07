-- FIX ITEMS YANG WAC MASIH 0 - TARGETED APPROACH
-- Jalankan ini setelah debug untuk fix items yang tidak ter-link

-- 1. MANUAL WAC FIX UNTUK ITEMS YANG TIDAK ADA DI PURCHASES
-- Set WAC = harga_satuan untuk items yang tidak punya purchase history
UPDATE bahan_baku 
SET 
    harga_rata_rata = COALESCE(harga_satuan, 0),
    updated_at = NOW()
WHERE user_id = 'your-user-id'::uuid
AND (harga_rata_rata IS NULL OR harga_rata_rata = 0)
AND harga_satuan IS NOT NULL 
AND harga_satuan > 0
-- Only update items that don't appear in any completed purchases
AND NOT EXISTS (
    SELECT 1 FROM purchases p 
    WHERE p.status = 'completed' 
    AND p.user_id = bahan_baku.user_id
    AND (
        jsonb_path_exists(p.items, ('$[*] ? (@.bahanBakuId == "' || bahan_baku.id || '")')::jsonpath) OR
        jsonb_path_exists(p.items, ('$[*] ? (@.bahan_baku_id == "' || bahan_baku.id || '")')::jsonpath) OR
        jsonb_path_exists(p.items, ('$[*] ? (@.id == "' || bahan_baku.id || '")')::jsonpath)
    )
);

-- 2. ALTERNATIVE - FUZZY MATCHING BY NAME
-- Try to link items by name similarity if exact ID matching failed
CREATE OR REPLACE FUNCTION fix_wac_by_name_matching(p_user_id UUID)
RETURNS TABLE (
    updated_items integer,
    matched_by_name integer,
    processing_log text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    warehouse_item RECORD;
    purchase_item RECORD;
    updated_count INTEGER := 0;
    matched_count INTEGER := 0;
    processing_log TEXT[] := ARRAY[]::TEXT[];
    total_qty NUMERIC;
    total_value NUMERIC;
    avg_price NUMERIC;
BEGIN
    processing_log := array_append(processing_log, 'Starting name-based WAC matching...');
    
    -- Process each zero-WAC warehouse item
    FOR warehouse_item IN 
        SELECT id, nama, harga_satuan
        FROM bahan_baku 
        WHERE user_id = p_user_id
        AND (harga_rata_rata IS NULL OR harga_rata_rata = 0)
    LOOP
        total_qty := 0;
        total_value := 0;
        
        -- Look for purchases with similar item names
        FOR purchase_item IN
            SELECT DISTINCT
                (item->>'kuantitas')::numeric as qty,
                COALESCE(
                    (item->>'hargaSatuan')::numeric,
                    (item->>'harga_per_satuan')::numeric,
                    (item->>'harga_satuan')::numeric
                ) as price,
                item->>'nama' as item_name
            FROM purchases p,
                 jsonb_array_elements(p.items) as item
            WHERE p.status = 'completed'
            AND p.user_id = p_user_id
            AND (
                -- Exact name match
                LOWER(TRIM(item->>'nama')) = LOWER(TRIM(warehouse_item.nama))
                OR
                -- Partial name match (at least 80% similarity)
                similarity(LOWER(TRIM(item->>'nama')), LOWER(TRIM(warehouse_item.nama))) > 0.8
            )
            AND COALESCE(
                (item->>'kuantitas')::numeric,
                (item->>'jumlah')::numeric
            ) > 0
            AND COALESCE(
                (item->>'hargaSatuan')::numeric,
                (item->>'harga_per_satuan')::numeric,
                (item->>'harga_satuan')::numeric
            ) > 0
        LOOP
            IF purchase_item.qty > 0 AND purchase_item.price > 0 THEN
                total_qty := total_qty + purchase_item.qty;
                total_value := total_value + (purchase_item.qty * purchase_item.price);
                matched_count := matched_count + 1;
                
                processing_log := array_append(processing_log,
                    format('Matched %s: %s x %s', warehouse_item.nama, purchase_item.qty, purchase_item.price));
            END IF;
        END LOOP;
        
        -- Update WAC if we found matching purchases
        IF total_qty > 0 AND total_value > 0 THEN
            avg_price := total_value / total_qty;
            
            UPDATE bahan_baku 
            SET 
                harga_rata_rata = avg_price,
                updated_at = NOW()
            WHERE id = warehouse_item.id;
            
            updated_count := updated_count + 1;
            processing_log := array_append(processing_log,
                format('Updated WAC for %s: %s (from %s purchases)', 
                    warehouse_item.nama, avg_price, matched_count));
        ELSE
            -- Fallback to harga_satuan if no matches found
            IF warehouse_item.harga_satuan > 0 THEN
                UPDATE bahan_baku 
                SET 
                    harga_rata_rata = warehouse_item.harga_satuan,
                    updated_at = NOW()
                WHERE id = warehouse_item.id;
                
                updated_count := updated_count + 1;
                processing_log := array_append(processing_log,
                    format('Fallback WAC for %s: %s (using harga_satuan)', 
                        warehouse_item.nama, warehouse_item.harga_satuan));
            END IF;
        END IF;
    END LOOP;
    
    processing_log := array_append(processing_log, 'Name-based WAC matching completed!');
    processing_log := array_append(processing_log,
        format('Updated %s items, %s name matches found', updated_count, matched_count));
    
    RETURN QUERY SELECT updated_count, matched_count, processing_log;
END;
$$;

-- 3. ENABLE pg_trgm EXTENSION FOR NAME SIMILARITY (if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 4. JALANKAN NAME-BASED MATCHING
-- SELECT * FROM fix_wac_by_name_matching('your-user-id'::uuid);

-- 5. SIMPLE FALLBACK - SET WAC = HARGA_SATUAN FOR REMAINING ITEMS
UPDATE bahan_baku 
SET 
    harga_rata_rata = GREATEST(harga_satuan, 1), -- Minimum 1 to avoid 0
    updated_at = NOW()
WHERE user_id = 'your-user-id'::uuid
AND (harga_rata_rata IS NULL OR harga_rata_rata = 0)
AND harga_satuan IS NOT NULL;

-- 6. FINAL CHECK - COUNT REMAINING ZERO WAC ITEMS
SELECT 
    COUNT(*) as total_items,
    COUNT(CASE WHEN harga_rata_rata IS NULL OR harga_rata_rata = 0 THEN 1 END) as zero_wac_items,
    COUNT(CASE WHEN harga_rata_rata IS NOT NULL AND harga_rata_rata > 0 THEN 1 END) as valid_wac_items
FROM bahan_baku
WHERE user_id = 'your-user-id'::uuid;

-- INSTRUCTIONS:
-- 1. Ganti 'your-user-id' dengan User ID Anda
-- 2. Jalankan query 1 untuk update items yang tidak ada di purchases
-- 3. Jalankan query 4 untuk name-based matching (optional)
-- 4. Jalankan query 5 sebagai fallback terakhir
-- 5. Jalankan query 6 untuk final check
