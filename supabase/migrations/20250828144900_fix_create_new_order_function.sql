-- Fix create_new_order function to include nomor_pesanan field
-- This fixes the "null value in column nomor_pesanan" error

DROP FUNCTION IF EXISTS public.create_new_order(jsonb);

CREATE OR REPLACE FUNCTION public.create_new_order(order_data jsonb) 
RETURNS jsonb
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_result RECORD;
BEGIN
    -- Generate new order ID
    v_order_id := gen_random_uuid();
    
    -- Generate order number if not provided
    v_order_number := COALESCE(
        order_data->>'nomor_pesanan', 
        'ORD' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || LPAD(EXTRACT(EPOCH FROM NOW())::TEXT, 3, '0')
    );
    
    -- Insert new order with ALL required fields
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        INSERT INTO public.orders (
            id,
            user_id,
            nomor_pesanan,          -- ✅ FIXED: Include nomor_pesanan
            nama_pelanggan,
            telepon_pelanggan,
            email_pelanggan,
            alamat_pengiriman,
            total_pesanan,
            items,
            status,
            tanggal,
            catatan,
            subtotal,
            pajak,
            created_at,
            updated_at
        ) VALUES (
            v_order_id,
            auth.uid(),
            v_order_number,         -- ✅ FIXED: Use generated order number
            order_data->>'nama_pelanggan',
            COALESCE(order_data->>'telepon_pelanggan', ''),
            order_data->>'email_pelanggan',
            order_data->>'alamat_pengiriman',
            COALESCE((order_data->>'total_pesanan')::NUMERIC, 0),
            COALESCE(order_data->'items', '[]'::jsonb),
            COALESCE(order_data->>'status', 'pending'),
            COALESCE((order_data->>'tanggal')::DATE, CURRENT_DATE),
            order_data->>'catatan',
            COALESCE((order_data->>'subtotal')::NUMERIC, 0),
            COALESCE((order_data->>'pajak')::NUMERIC, 0),
            NOW(),
            NOW()
        );
        
        -- Get the created order
        SELECT * INTO v_result
        FROM public.orders 
        WHERE id = v_order_id;
        
        -- Return the complete order data
        RETURN to_jsonb(v_result);
    END IF;
    
    -- Fallback return
    RETURN jsonb_build_object('error', 'Orders table not found');
END;
$$;

ALTER FUNCTION public.create_new_order(jsonb) OWNER TO postgres;
COMMENT ON FUNCTION public.create_new_order(jsonb) IS 'Create a new order with given data - FIXED to include nomor_pesanan';
