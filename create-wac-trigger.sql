-- CREATE TRIGGER UNTUK AUTO-UPDATE WAC SAAT PURCHASE COMPLETED
-- Copy paste ke Supabase SQL Editor

-- 1. CREATE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION auto_update_wac_on_purchase_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    purchase_item JSONB;
    item_id UUID;
    item_qty NUMERIC;
    item_price NUMERIC;
    wac_result RECORD;
BEGIN
    -- Log trigger execution
    RAISE NOTICE 'WAC Trigger executed for purchase: %', COALESCE(NEW.id, OLD.id);
    
    -- Only process when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        RAISE NOTICE 'Processing purchase completion: %', NEW.id;
        
        -- Process each item in the purchase
        IF NEW.items IS NOT NULL AND jsonb_typeof(NEW.items) = 'array' THEN
            
            FOR purchase_item IN SELECT * FROM jsonb_array_elements(NEW.items)
            LOOP
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
                
                RAISE NOTICE 'Processing item: % qty: % price: %', item_id, item_qty, item_price;
                
                -- Only update if we have valid data
                IF item_id IS NOT NULL AND item_qty > 0 AND item_price > 0 THEN
                    
                    -- Call the existing update_wac_price function
                    SELECT * INTO wac_result 
                    FROM update_wac_price(item_id, NEW.user_id, item_qty, item_price);
                    
                    IF wac_result IS NOT NULL THEN
                        RAISE NOTICE 'WAC updated for item %: success=%', item_id, wac_result;
                    ELSE
                        RAISE WARNING 'WAC update failed for item: %', item_id;
                    END IF;
                    
                ELSE
                    RAISE WARNING 'Skipping invalid item data: id=% qty=% price=%', item_id, item_qty, item_price;
                END IF;
                
            END LOOP;
            
        ELSE
            RAISE WARNING 'No valid items array found in purchase: %', NEW.id;
        END IF;
        
    -- Handle status change from 'completed' to other status (reverse WAC)
    ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
        
        RAISE NOTICE 'Reversing purchase completion: %', NEW.id;
        
        -- Process each item for reversal
        IF OLD.items IS NOT NULL AND jsonb_typeof(OLD.items) = 'array' THEN
            
            FOR purchase_item IN SELECT * FROM jsonb_array_elements(OLD.items)
            LOOP
                -- Extract item data
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
                
                -- Reverse the quantity (subtract)
                IF item_id IS NOT NULL AND item_qty > 0 AND item_price > 0 THEN
                    
                    SELECT * INTO wac_result 
                    FROM update_wac_price(item_id, NEW.user_id, -item_qty, item_price);
                    
                    RAISE NOTICE 'WAC reversed for item %: success=%', item_id, wac_result;
                    
                END IF;
                
            END LOOP;
            
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$$;

-- 2. CREATE THE TRIGGER
DROP TRIGGER IF EXISTS trigger_auto_update_wac ON purchases;

CREATE TRIGGER trigger_auto_update_wac
    AFTER UPDATE ON purchases
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION auto_update_wac_on_purchase_completion();

-- 3. ENABLE LOGGING (optional - untuk debugging)
-- ALTER FUNCTION auto_update_wac_on_purchase_completion() SET log_statement = 'all';

-- Test the trigger dengan comment ini:
-- UPDATE purchases SET status = 'completed' WHERE id = 'your-purchase-id';

RAISE NOTICE 'WAC Auto-Update Trigger has been created successfully!';
RAISE NOTICE 'Trigger will fire when purchase status changes to/from completed';
RAISE NOTICE 'Check logs for debugging information';
