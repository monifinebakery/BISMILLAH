-- Improve reverse_order_completion function with explicit locking to prevent race conditions

-- Drop the existing function
DROP FUNCTION IF EXISTS reverse_order_completion(UUID);

-- Create the improved function with explicit locking
CREATE OR REPLACE FUNCTION reverse_order_completion(order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_order RECORD;
    v_ingredient RECORD;
    v_user_id UUID;
    v_reversed_items INTEGER := 0;
    v_warehouse_item_ids UUID[]; -- Array to hold warehouse item IDs for locking
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
GRANT EXECUTE ON FUNCTION reverse_order_completion(UUID) TO authenticated;