-- ==============================================
-- FIX: COMPLETE ORDER COGS TRACKING
-- Add pemakaian_bahan recording to complete_order_and_deduct_stock function
-- This is critical for accurate profit analysis COGS calculation
-- ==============================================

-- Drop and recreate the complete_order_and_deduct_stock function with pemakaian_bahan tracking
DROP FUNCTION IF EXISTS complete_order_and_deduct_stock(UUID);

CREATE OR REPLACE FUNCTION complete_order_and_deduct_stock(order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_ingredient RECORD;
    v_user_id UUID;
    v_total_amount NUMERIC;
    v_financial_transaction_id UUID;
    v_insufficient_stock TEXT[] := '{}';
    v_updated_items INTEGER := 0;
    v_pemakaian_items INTEGER := 0;
    v_result JSON;
    v_completion_date DATE := CURRENT_DATE;
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
        
        -- Process each ingredient: reduce stock AND record pemakaian
        FOR v_ingredient IN 
            SELECT * FROM get_recipe_ingredients_for_order(order_id)
        LOOP
            -- Update warehouse stock
            UPDATE bahan_baku 
            SET 
                stok = stok - v_ingredient.total_required,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_ingredient.warehouse_item_id;
            
            v_updated_items := v_updated_items + 1;
            
            -- ✅ NEW: Record pemakaian bahan for profit analysis COGS calculation
            INSERT INTO pemakaian_bahan (
                id,
                user_id,
                bahan_baku_id,
                qty_base,
                satuan,
                tanggal,
                source_type,
                source_id,
                harga_efektif,
                hpp_value,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                v_user_id,
                v_ingredient.warehouse_item_id,
                v_ingredient.total_required,
                v_ingredient.satuan,
                v_completion_date,
                'order',
                order_id,
                -- Use current effective price from bahan_baku
                COALESCE(
                    (SELECT COALESCE(harga_rata_rata, harga_satuan, 0) 
                     FROM bahan_baku 
                     WHERE id = v_ingredient.warehouse_item_id), 
                    0
                ),
                -- Calculate HPP value (qty * effective_price)
                v_ingredient.total_required * COALESCE(
                    (SELECT COALESCE(harga_rata_rata, harga_satuan, 0) 
                     FROM bahan_baku 
                     WHERE id = v_ingredient.warehouse_item_id), 
                    0
                ),
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
            
            v_pemakaian_items := v_pemakaian_items + 1;
            
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
            v_completion_date,
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
            format('Pesanan #%s selesai. Stok diperbarui, COGS dicatat.', v_order.nomor_pesanan),
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
        
        -- ✅ NEW: Log COGS recording in activities
        INSERT INTO activities (id, user_id, title, description, type, value, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            v_user_id,
            'COGS Dicatat',
            format('Pemakaian bahan untuk pesanan #%s dicatat (%s item)', 
                   v_order.nomor_pesanan, v_pemakaian_items::TEXT),
            'profit',
            NULL,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
        
        -- Build success response
        v_result := json_build_object(
            'success', true,
            'message', 'Order completed successfully with COGS tracking',
            'order_id', order_id,
            'order_number', v_order.nomor_pesanan,
            'total_amount', v_total_amount,
            'stock_items_updated', v_updated_items,
            'pemakaian_items_recorded', v_pemakaian_items,
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

-- Create indexes for better performance on pemakaian_bahan table
CREATE INDEX IF NOT EXISTS idx_pemakaian_bahan_user_date ON pemakaian_bahan(user_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_pemakaian_bahan_source ON pemakaian_bahan(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_pemakaian_bahan_bahan_date ON pemakaian_bahan(bahan_baku_id, tanggal);

-- Refresh materialized view if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'pemakaian_bahan_daily_mv') THEN
        REFRESH MATERIALIZED VIEW pemakaian_bahan_daily_mv;
        RAISE NOTICE 'Refreshed pemakaian_bahan_daily_mv for accurate profit analysis';
    END IF;
END $$;

-- Success message
SELECT 'complete_order_and_deduct_stock function updated with COGS tracking for accurate profit analysis!' as success_message;
