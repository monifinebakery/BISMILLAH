-- Improve complete_order_and_deduct_stock function with explicit locking to prevent race conditions

-- Drop the existing function
DROP FUNCTION IF EXISTS complete_order_and_deduct_stock(UUID);

-- Create the improved function with explicit locking
CREATE OR REPLACE FUNCTION complete_order_and_deduct_stock(order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_order RECORD;
    v_ingredient RECORD;
    v_user_id UUID;
    v_total_amount NUMERIC;
    v_financial_transaction_id UUID;
    v_insufficient_stock TEXT[] := '{}';
    v_updated_items INTEGER := 0;
    v_result JSON;
    v_warehouse_item_ids UUID[]; -- Array to hold warehouse item IDs for locking
BEGIN
    -- Start transaction
    BEGIN
        -- Get order details
        SELECT * INTO v_order 
        FROM orders 
        WHERE id = order_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Order not found: %', order_id;
        END IF;
        
        -- Check if order is already completed
        IF v_order.status = 'completed' THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Order is already completed',
                'order_id', order_id
            );
        END IF;
        
        v_user_id := v_order.user_id;
        v_total_amount := v_order.total_pesanan;
        
        -- Collect warehouse item IDs for locking
        SELECT ARRAY(
            SELECT DISTINCT (ingredient_data->>'warehouseId')::UUID
            FROM (
                SELECT json_array_elements(hr.bahan_resep) as ingredient_data
                FROM (
                    SELECT json_array_elements(o.items) as item_data
                    FROM orders o 
                    WHERE o.id = order_id
                ) oi
                JOIN hpp_recipes hr ON hr.id = (oi.item_data->>'recipeId')::UUID
                WHERE (oi.item_data->>'isFromRecipe')::BOOLEAN = true
                AND oi.item_data->>'recipeId' IS NOT NULL
            ) sub
            WHERE ingredient_data->>'warehouseId' IS NOT NULL
        ) INTO v_warehouse_item_ids;
        
        -- Explicitly lock the warehouse items to prevent race conditions
        -- This ensures no other process can modify these items concurrently
        IF array_length(v_warehouse_item_ids, 1) > 0 THEN
            PERFORM * FROM bahan_baku 
            WHERE id = ANY(v_warehouse_item_ids)
            FOR UPDATE; -- Row-level exclusive lock
        END IF;
        
        -- Check stock availability for all ingredients
        FOR v_ingredient IN 
            SELECT * FROM get_recipe_ingredients_for_order(order_id)
        LOOP
            IF v_ingredient.current_stock < v_ingredient.total_required THEN
                v_insufficient_stock := v_insufficient_stock || 
                    format('%s: butuh %s, tersedia %s %s', 
                           v_ingredient.bahan_nama,
                           v_ingredient.total_required::TEXT,
                           v_ingredient.current_stock::TEXT,
                           v_ingredient.satuan);
            END IF;
        END LOOP;
        
        -- If insufficient stock, return error
        IF array_length(v_insufficient_stock, 1) > 0 THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Insufficient stock',
                'details', v_insufficient_stock,
                'order_id', order_id
            );
        END IF;
        
        -- Update warehouse stock
        FOR v_ingredient IN 
            SELECT * FROM get_recipe_ingredients_for_order(order_id)
        LOOP
            UPDATE bahan_baku 
            SET 
                stok = stok - v_ingredient.total_required,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_ingredient.warehouse_item_id;
            
            v_updated_items := v_updated_items + 1;
            
            -- Log stock reduction in activities
            INSERT INTO activities (id, user_id, title, description, type, value, created_at, updated_at)
            VALUES (
                gen_random_uuid(),
                v_user_id,
                'Stok Berkurang',
                format('Stok %s berkurang %s %s untuk pesanan #%s', 
                       v_ingredient.bahan_nama,
                       v_ingredient.total_required::TEXT,
                       v_ingredient.satuan,
                       v_order.nomor_pesanan),
                'stok',
                v_ingredient.total_required::TEXT,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END LOOP;
        
        -- Create financial transaction (income)
        INSERT INTO financial_transactions (
            id, user_id, type, category, amount, description, date, 
            notes, related_id, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_user_id,
            'income',
            'Penjualan Produk',
            v_total_amount,
            format('Penjualan dari pesanan #%s', v_order.nomor_pesanan),
            CURRENT_TIMESTAMP::DATE,
            format('Order completion untuk %s', v_order.nama_pelanggan),
            order_id,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) RETURNING id INTO v_financial_transaction_id;
        
        -- Update order status to completed
        UPDATE orders 
        SET 
            status = 'completed',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = order_id;
        
        -- Log order completion in activities
        INSERT INTO activities (id, user_id, title, description, type, value, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            v_user_id,
            'Pesanan Selesai',
            format('Pesanan #%s lunas, stok diperbarui.', v_order.nomor_pesanan),
            'order',
            NULL,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        -- Log financial transaction in activities
        INSERT INTO activities (id, user_id, title, description, type, value, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            v_user_id,
            'Transaksi Keuangan Ditambahkan',
            format('Pemasukan Rp %s', 
                   TRIM(TO_CHAR(v_total_amount, '999,999,999,999.00'))),
            'keuangan',
            NULL,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        -- Build success response
        v_result := json_build_object(
            'success', true,
            'message', 'Order completed successfully',
            'order_id', order_id,
            'order_number', v_order.nomor_pesanan,
            'total_amount', v_total_amount,
            'stock_items_updated', v_updated_items,
            'financial_transaction_id', v_financial_transaction_id
        );
        
        RETURN v_result;
        
    EXCEPTION WHEN OTHERS THEN
        -- Rollback is automatic in function
        RAISE EXCEPTION 'Failed to complete order: %', SQLERRM;
    END;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION complete_order_and_deduct_stock(UUID) TO authenticated;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_bahan_baku_id ON bahan_baku(id);