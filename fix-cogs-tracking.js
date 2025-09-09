// ==============================================
// CLIENT-SIDE COGS TRACKING FIX
// Fix complete_order_and_deduct_stock function to record pemakaian_bahan
// Run this script in browser console at localhost:5174
// ==============================================

console.log('🔧 Starting COGS Tracking Fix...');

const sql = `
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
`;

async function fixCOGSTracking() {
  try {
    console.log('🔧 Executing COGS tracking fix...');
    
    if (!window.supabase) {
      console.error('❌ Supabase not available. Run this in the app context.');
      return;
    }

    const { data, error } = await window.supabase.rpc('exec', { sql });
    
    if (error) {
      console.error('❌ Error executing COGS tracking fix:', error);
      return;
    }
    
    console.log('✅ COGS tracking fix executed successfully!');
    console.log('🎯 Now order completions will record pemakaian_bahan for accurate profit analysis');
    
    // Refresh materialized view if exists
    try {
      await window.supabase.rpc('refresh_materialized_view', { view_name: 'pemakaian_bahan_daily_mv' });
      console.log('✅ Refreshed materialized view for immediate effect');
    } catch (mvError) {
      console.warn('⚠️ Could not refresh materialized view (non-critical):', mvError);
    }
    
    return { success: true, message: 'COGS tracking fix applied successfully' };
    
  } catch (error) {
    console.error('❌ Critical error in COGS tracking fix:', error);
    return { success: false, error: error.message };
  }
}

// Export for manual execution
window.fixCOGSTracking = fixCOGSTracking;

// Auto-run if in development environment
if (window.location.hostname === 'localhost') {
  console.log('🚀 Auto-executing COGS tracking fix in development mode...');
  fixCOGSTracking().then(result => {
    if (result?.success) {
      console.log('🎉 COGS tracking fix completed successfully!');
    } else {
      console.error('💥 COGS tracking fix failed:', result?.error);
    }
  });
} else {
  console.log('📋 COGS tracking fix loaded. Run window.fixCOGSTracking() to execute.');
}

export { fixCOGSTracking };
