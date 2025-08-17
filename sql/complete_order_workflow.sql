-- ================================================================
-- COMPLETE ORDER WORKFLOW STORED PROCEDURE
-- ================================================================
-- Handles order completion with:
-- 1. Stock reduction based on recipe ingredients
-- 2. Financial transaction recording  
-- 3. Activity logging
-- 4. Proper error handling and rollback
-- ================================================================

-- Create function to get recipe ingredients for stock calculation
CREATE OR REPLACE FUNCTION get_recipe_ingredients_for_order(order_id UUID)
RETURNS TABLE (
    warehouse_item_id UUID,
    bahan_nama TEXT,
    total_required NUMERIC,
    satuan TEXT,
    current_stock NUMERIC
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH order_items AS (
        SELECT 
            json_array_elements(o.items) as item_data
        FROM orders o 
        WHERE o.id = order_id
    ),
    recipe_items AS (
        SELECT 
            (item_data->>'recipeId')::UUID as recipe_id,
            (item_data->>'quantity')::INTEGER as order_quantity,
            (item_data->>'isFromRecipe')::BOOLEAN as is_from_recipe
        FROM order_items
        WHERE (item_data->>'isFromRecipe')::BOOLEAN = true
        AND item_data->>'recipeId' IS NOT NULL
    ),
    recipe_ingredients AS (
        SELECT 
            ri.recipe_id,
            ri.order_quantity,
            json_array_elements(hr.bahan_resep) as ingredient_data
        FROM recipe_items ri
        JOIN hpp_recipes hr ON hr.id = ri.recipe_id
    ),
    ingredient_requirements AS (
        SELECT 
            (ingredient_data->>'warehouseId')::UUID as warehouse_item_id,
            ingredient_data->>'nama' as bahan_nama,
            (ingredient_data->>'jumlah')::NUMERIC * order_quantity as total_required,
            ingredient_data->>'satuan' as satuan
        FROM recipe_ingredients
        WHERE ingredient_data->>'warehouseId' IS NOT NULL
    )
    SELECT 
        ir.warehouse_item_id,
        ir.bahan_nama,
        SUM(ir.total_required) as total_required,
        ir.satuan,
        COALESCE(bb.stok, 0) as current_stock
    FROM ingredient_requirements ir
    LEFT JOIN bahan_baku bb ON bb.id = ir.warehouse_item_id
    GROUP BY ir.warehouse_item_id, ir.bahan_nama, ir.satuan, bb.stok;
END;
$$;

-- Main stored procedure for completing orders
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

-- Create function to validate order can be completed (check stock)
CREATE OR REPLACE FUNCTION can_complete_order(order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_ingredient RECORD;
    v_insufficient_stock TEXT[] := '{}';
    v_total_items INTEGER := 0;
    v_available_items INTEGER := 0;
BEGIN
    -- Check stock availability for all ingredients
    FOR v_ingredient IN 
        SELECT * FROM get_recipe_ingredients_for_order(order_id)
    LOOP
        v_total_items := v_total_items + 1;
        
        IF v_ingredient.current_stock >= v_ingredient.total_required THEN
            v_available_items := v_available_items + 1;
        ELSE
            v_insufficient_stock := v_insufficient_stock || 
                json_build_object(
                    'item', v_ingredient.bahan_nama,
                    'required', v_ingredient.total_required,
                    'available', v_ingredient.current_stock,
                    'unit', v_ingredient.satuan,
                    'shortage', v_ingredient.total_required - v_ingredient.current_stock
                )::TEXT;
        END IF;
    END LOOP;
    
    RETURN json_build_object(
        'can_complete', array_length(v_insufficient_stock, 1) IS NULL OR array_length(v_insufficient_stock, 1) = 0,
        'total_ingredients', v_total_items,
        'available_ingredients', v_available_items,
        'insufficient_stock', v_insufficient_stock
    );
END;
$$;

-- Create function to reverse order completion (if needed)
CREATE OR REPLACE FUNCTION reverse_order_completion(order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_order RECORD;
    v_ingredient RECORD;
    v_user_id UUID;
    v_reversed_items INTEGER := 0;
BEGIN
    -- Get order details
    SELECT * INTO v_order 
    FROM orders 
    WHERE id = order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found: %', order_id;
    END IF;
    
    IF v_order.status != 'completed' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Order is not completed, cannot reverse'
        );
    END IF;
    
    v_user_id := v_order.user_id;
    
    -- Restore warehouse stock
    FOR v_ingredient IN 
        SELECT * FROM get_recipe_ingredients_for_order(order_id)
    LOOP
        UPDATE bahan_baku 
        SET 
            stok = stok + v_ingredient.total_required,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_ingredient.warehouse_item_id;
        
        v_reversed_items := v_reversed_items + 1;
    END LOOP;
    
    -- Update order status back to ready or previous status
    UPDATE orders 
    SET 
        status = 'ready',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = order_id;
    
    -- Mark related financial transaction as reversed (don't delete)
    UPDATE financial_transactions 
    SET 
        description = description || ' [REVERSED]',
        notes = COALESCE(notes, '') || format(' - Order completion reversed on %s', CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
    WHERE related_id = order_id 
    AND type = 'income';
    
    -- Log reversal
    INSERT INTO activities (id, user_id, title, description, type, value, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        v_user_id,
        'Pesanan Direverse',
        format('Pesanan #%s completion dibatalkan, stok dikembalikan.', v_order.nomor_pesanan),
        'order',
        NULL,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Order completion reversed successfully',
        'order_id', order_id,
        'stock_items_restored', v_reversed_items
    );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION complete_order_and_deduct_stock(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_complete_order(UUID) TO authenticated;  
GRANT EXECUTE ON FUNCTION reverse_order_completion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recipe_ingredients_for_order(UUID) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_related ON financial_transactions(related_id);
CREATE INDEX IF NOT EXISTS idx_bahan_baku_stok ON bahan_baku(stok) WHERE stok <= minimum;

-- Example usage:
-- SELECT can_complete_order('your-order-id-here');
-- SELECT complete_order_and_deduct_stock('your-order-id-here');  
-- SELECT reverse_order_completion('your-order-id-here');
