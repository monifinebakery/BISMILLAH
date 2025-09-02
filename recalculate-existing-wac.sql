-- RECALCULATE WAC UNTUK SEMUA PURCHASE YANG SUDAH COMPLETED
-- Jalankan ini SETELAH create trigger untuk handle existing data

-- 1. RESET SEMUA WAC KE NULL (opsional - untuk clean slate)
-- UPDATE bahan_baku SET harga_rata_rata = NULL WHERE user_id = 'your-user-id';

-- 2. FUNCTION UNTUK RECALCULATE WAC DARI EXISTING PURCHASES
CREATE OR REPLACE FUNCTION recalculate_all_existing_wac(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    processed_purchases integer,
    processed_items integer,
    updated_materials integer,
    errors_count integer,
    processing_log text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    purchase_record RECORD;
    purchase_item JSONB;
    item_id UUID;
    item_qty NUMERIC;
    item_price NUMERIC;
    wac_result RECORD;
    processed_purchases_count INTEGER := 0;
    processed_items_count INTEGER := 0;
    updated_materials_count INTEGER := 0;
    errors_count INTEGER := 0;
    processing_log TEXT[] := ARRAY[]::TEXT[];
    target_user_id UUID;
BEGIN
    -- If no user_id provided, process all users (admin only)
    target_user_id := p_user_id;
    
    processing_log := array_append(processing_log, 'Starting WAC recalculation process...');
    
    -- Process all completed purchases
    FOR purchase_record IN 
        SELECT id, user_id, items, supplier, total_nilai, tanggal
        FROM purchases 
        WHERE status = 'completed'
        AND (target_user_id IS NULL OR user_id = target_user_id)
        ORDER BY tanggal ASC, created_at ASC
    LOOP
        processed_purchases_count := processed_purchases_count + 1;
        processing_log := array_append(processing_log, 
            format('Processing purchase %s (%s items)', purchase_record.id, 
                CASE WHEN purchase_record.items IS NOT NULL THEN jsonb_array_length(purchase_record.items) ELSE 0 END));
        
        -- Process each item in the purchase
        IF purchase_record.items IS NOT NULL AND jsonb_typeof(purchase_record.items) = 'array' THEN
            
            FOR purchase_item IN SELECT * FROM jsonb_array_elements(purchase_record.items)
            LOOP
                processed_items_count := processed_items_count + 1;
                
                -- Extract item data with flexible field matching
                item_id := COALESCE(
                    (purchase_item->>'bahanBakuId')::UUID,
                    (purchase_item->>'bahan_baku_id')::UUID,
                    (purchase_item->>'id')::UUID
                );
                
                item_qty := COALESCE(
                    (purchase_item->>'kuantitas')::NUMERIC,
                    (purchase_item->>'jumlah')::NUMERIC,
                    0
                );
                
                item_price := COALESCE(
                    (purchase_item->>'hargaSatuan')::NUMERIC,
                    (purchase_item->>'harga_per_satuan')::NUMERIC,
                    (purchase_item->>'harga_satuan')::NUMERIC,
                    0
                );
                
                -- Only update if we have valid data
                IF item_id IS NOT NULL AND item_qty > 0 AND item_price > 0 THEN
                    
                    BEGIN
                        -- Call the existing update_wac_price function
                        SELECT * INTO wac_result 
                        FROM update_wac_price(item_id, purchase_record.user_id, item_qty, item_price);
                        
                        IF wac_result IS NOT NULL AND wac_result.success THEN
                            updated_materials_count := updated_materials_count + 1;
                            processing_log := array_append(processing_log,
                                format('Updated WAC for item %s: %s -> %s', 
                                    item_id, wac_result.old_wac, wac_result.new_wac));
                        ELSE
                            errors_count := errors_count + 1;
                            processing_log := array_append(processing_log,
                                format('Failed to update WAC for item: %s', item_id));
                        END IF;
                        
                    EXCEPTION WHEN OTHERS THEN
                        errors_count := errors_count + 1;
                        processing_log := array_append(processing_log,
                            format('Error updating item %s: %s', item_id, SQLERRM));
                    END;
                    
                ELSE
                    processing_log := array_append(processing_log,
                        format('Skipping invalid item data: id=%s qty=%s price=%s', 
                            item_id, item_qty, item_price));
                END IF;
                
            END LOOP;
            
        END IF;
        
    END LOOP;
    
    processing_log := array_append(processing_log, 'WAC recalculation process completed!');
    processing_log := array_append(processing_log,
        format('Summary - Purchases: %s, Items: %s, Updated: %s, Errors: %s',
            processed_purchases_count, processed_items_count, updated_materials_count, errors_count));
    
    RETURN QUERY SELECT 
        processed_purchases_count,
        processed_items_count, 
        updated_materials_count,
        errors_count,
        processing_log;
END;
$$;

-- 3. JALANKAN RECALCULATION UNTUK USER TERTENTU
-- Ganti 'your-user-id' dengan UUID user Anda
-- SELECT * FROM recalculate_all_existing_wac('your-user-id'::uuid);

-- 4. CEK HASIL SEBELUM DAN SESUDAH
-- SEBELUM:
SELECT 
    COUNT(*) as total_items,
    COUNT(CASE WHEN harga_rata_rata IS NULL OR harga_rata_rata = 0 THEN 1 END) as zero_wac_items,
    COUNT(CASE WHEN harga_rata_rata IS NOT NULL AND harga_rata_rata > 0 THEN 1 END) as valid_wac_items
FROM bahan_baku
WHERE user_id = 'your-user-id'::uuid;

-- SESUDAH (jalankan setelah recalculation):
-- Same query as above to compare results

-- 5. DETAILED CHECK WAC VALUES
SELECT 
    bb.nama,
    bb.stok,
    bb.harga_satuan,
    bb.harga_rata_rata,
    bb.updated_at,
    -- Count related purchases
    (SELECT COUNT(*) FROM purchases p 
     WHERE p.status = 'completed' 
     AND p.user_id = bb.user_id
     AND jsonb_path_exists(p.items, ('$[*] ? (@.bahanBakuId == "' || bb.id || '" || @.bahan_baku_id == "' || bb.id || '" || @.id == "' || bb.id || '")')::jsonpath)
    ) as related_purchases
FROM bahan_baku bb
WHERE bb.user_id = 'your-user-id'::uuid
ORDER BY bb.nama;

-- INSTRUCTIONS:
-- 1. Ganti 'your-user-id' dengan UUID user Anda di queries 3, 4, dan 5
-- 2. Jalankan query 4 untuk lihat status WAC sebelum recalculation
-- 3. Jalankan query 3 untuk recalculate WAC dari existing purchases
-- 4. Jalankan query 4 lagi untuk lihat perubahan
-- 5. Jalankan query 5 untuk detailed check per item
