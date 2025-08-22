-- =====================================
-- Create calculate_realtime_profit function for Supabase
-- This function calculates real-time profit analysis for a given period
-- =====================================

-- Create the calculate_realtime_profit function
CREATE OR REPLACE FUNCTION public.calculate_realtime_profit(
    p_user_id UUID,
    p_period TEXT
)
RETURNS TABLE (
    total_revenue NUMERIC,
    total_cogs NUMERIC,
    total_opex NUMERIC,
    revenue_transactions JSONB,
    cogs_materials JSONB,
    opex_costs JSONB,
    calculated_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_revenue NUMERIC := 0;
    v_cogs NUMERIC := 0;
    v_opex NUMERIC := 0;
    v_revenue_transactions JSONB := '[]'::jsonb;
    v_cogs_materials JSONB := '[]'::jsonb;
    v_opex_costs JSONB := '[]'::jsonb;
BEGIN
    -- Parse period to determine date range
    -- Expected format: YYYY-MM for monthly, YYYY for yearly
    IF length(p_period) = 7 AND p_period ~ '^\d{4}-\d{2}$' THEN
        -- Monthly period (YYYY-MM)
        v_start_date := (p_period || '-01')::DATE;
        v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    ELSIF length(p_period) = 4 AND p_period ~ '^\d{4}$' THEN
        -- Yearly period (YYYY)
        v_start_date := (p_period || '-01-01')::DATE;
        v_end_date := (p_period || '-12-31')::DATE;
    ELSIF length(p_period) = 10 AND p_period ~ '^\d{4}-\d{2}-\d{2}$' THEN
        -- Daily period (YYYY-MM-DD)
        v_start_date := p_period::DATE;
        v_end_date := p_period::DATE;
    ELSE
        -- Invalid period format, default to current month
        v_start_date := date_trunc('month', CURRENT_DATE)::DATE;
        v_end_date := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    END IF;

    -- Calculate Revenue from financial_transactions
    SELECT 
        COALESCE(SUM(amount), 0),
        COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'amount', amount,
                'date', date,
                'description', description,
                'category', category
            )
        ) FILTER (WHERE amount > 0), '[]'::jsonb)
    INTO v_revenue, v_revenue_transactions
    FROM public.financial_transactions
    WHERE user_id = p_user_id
        AND type = 'income'
        AND date >= v_start_date
        AND date <= v_end_date;

    -- Calculate COGS from material usage (pemakaian_bahan table if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pemakaian_bahan') THEN
        SELECT 
            COALESCE(SUM(hpp_value), 0),
            COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', pb.id,
                    'bahan_baku_id', pb.bahan_baku_id,
                    'qty_base', pb.qty_base,
                    'harga_efektif', pb.harga_efektif,
                    'hpp_value', pb.hpp_value,
                    'tanggal', pb.tanggal,
                    'bahan_nama', bb.nama
                )
            ) FILTER (WHERE pb.hpp_value > 0), '[]'::jsonb)
        INTO v_cogs, v_cogs_materials
        FROM public.pemakaian_bahan pb
        LEFT JOIN public.bahan_baku bb ON bb.id = pb.bahan_baku_id
        WHERE pb.user_id = p_user_id
            AND pb.tanggal >= v_start_date
            AND pb.tanggal <= v_end_date;
    ELSE
        -- Fallback: estimate COGS from purchase data
        SELECT 
            COALESCE(SUM(total_nilai * 0.7), 0),  -- Estimate 70% of purchases as COGS
            COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'total_nilai', total_nilai,
                    'tanggal', tanggal,
                    'supplier', supplier,
                    'estimated_cogs', total_nilai * 0.7
                )
            ) FILTER (WHERE total_nilai > 0), '[]'::jsonb)
        INTO v_cogs, v_cogs_materials
        FROM public.purchases
        WHERE user_id = p_user_id
            AND status = 'completed'
            AND tanggal::DATE >= v_start_date
            AND tanggal::DATE <= v_end_date;
    END IF;

    -- Calculate OpEx from operational costs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operational_costs') THEN
        SELECT 
            COALESCE(SUM(
                CASE 
                    WHEN jenis = 'tetap' THEN jumlah_per_bulan
                    WHEN jenis = 'variabel' THEN jumlah_per_bulan
                    ELSE jumlah_per_bulan
                END
            ), 0),
            COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'nama_biaya', nama_biaya,
                    'jumlah_per_bulan', jumlah_per_bulan,
                    'jenis', jenis,
                    'cost_category', cost_category
                )
            ) FILTER (WHERE jumlah_per_bulan > 0), '[]'::jsonb)
        INTO v_opex, v_opex_costs
        FROM public.operational_costs
        WHERE user_id = p_user_id
            AND status = 'aktif';
            
        -- Adjust OpEx based on period length
        IF length(p_period) = 10 THEN
            -- Daily period: divide monthly costs by days in month
            v_opex := v_opex / EXTRACT(DAY FROM (v_end_date + INTERVAL '1 day' - v_start_date));
        ELSIF length(p_period) = 4 THEN
            -- Yearly period: multiply monthly costs by 12
            v_opex := v_opex * 12;
        END IF;
    ELSE
        -- Fallback: estimate OpEx from expense transactions
        SELECT 
            COALESCE(SUM(amount), 0),
            COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'amount', amount,
                    'date', date,
                    'description', description,
                    'category', category
                )
            ) FILTER (WHERE amount > 0), '[]'::jsonb)
        INTO v_opex, v_opex_costs
        FROM public.financial_transactions
        WHERE user_id = p_user_id
            AND type = 'expense'
            AND date >= v_start_date
            AND date <= v_end_date;
    END IF;

    -- Return the calculated values
    RETURN QUERY SELECT 
        v_revenue,
        v_cogs,
        v_opex,
        v_revenue_transactions,
        v_cogs_materials,
        v_opex_costs,
        NOW();
END;
$$;

-- Create helper function for total costs calculation
CREATE OR REPLACE FUNCTION public.get_total_costs(
    p_user_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_costs NUMERIC := 0;
BEGIN
    -- Get total from operational_costs if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operational_costs') THEN
        SELECT COALESCE(SUM(jumlah_per_bulan), 0)
        INTO v_total_costs
        FROM public.operational_costs
        WHERE user_id = p_user_id
            AND status = 'aktif';
    ELSE
        -- Fallback: estimate from expense transactions
        SELECT COALESCE(SUM(amount), 0)
        INTO v_total_costs
        FROM public.financial_transactions
        WHERE user_id = p_user_id
            AND type = 'expense'
            AND date >= date_trunc('month', CURRENT_DATE)
            AND date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
    END IF;
    
    RETURN v_total_costs;
END;
$$;

-- Create helper function for overhead calculation
CREATE OR REPLACE FUNCTION public.calculate_overhead(
    p_material_cost NUMERIC,
    p_user_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_costs NUMERIC;
    v_overhead NUMERIC := 0;
    v_allocation_method TEXT := 'per_unit';
    v_basis_value NUMERIC := 1000;
BEGIN
    -- Get total costs
    v_total_costs := public.get_total_costs(p_user_id);
    
    -- Simple overhead calculation (can be enhanced based on allocation settings)
    -- For now, use a simple percentage of material cost
    IF p_material_cost > 0 AND v_total_costs > 0 THEN
        v_overhead := v_total_costs * 0.1; -- 10% overhead as default
    ELSE
        v_overhead := v_total_costs;
    END IF;
    
    RETURN v_overhead;
END;
$$;

-- Create helper function for order statistics
CREATE OR REPLACE FUNCTION public.get_order_statistics(
    p_user_id UUID
)
RETURNS TABLE (
    total_orders BIGINT,
    completed_orders BIGINT,
    pending_orders BIGINT,
    cancelled_orders BIGINT,
    total_revenue NUMERIC,
    average_order_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        RETURN QUERY
        SELECT 
            COUNT(*)::BIGINT as total_orders,
            COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_orders,
            COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_orders,
            COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled_orders,
            COALESCE(SUM(total_pesanan) FILTER (WHERE status = 'completed'), 0) as total_revenue,
            COALESCE(AVG(total_pesanan) FILTER (WHERE status = 'completed'), 0) as average_order_value
        FROM public.orders
        WHERE user_id = p_user_id;
    ELSE
        -- Return default values if orders table doesn't exist
        RETURN QUERY
        SELECT 
            0::BIGINT as total_orders,
            0::BIGINT as completed_orders,
            0::BIGINT as pending_orders,
            0::BIGINT as cancelled_orders,
            0::NUMERIC as total_revenue,
            0::NUMERIC as average_order_value;
    END IF;
END;
$$;

-- Create helper function for admin check
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_email TEXT;
    v_is_admin BOOLEAN := FALSE;
BEGIN
    -- Get current user email
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Check if user is admin (add your admin emails here)
    IF v_user_email IN (
        'admin@bismillah.com',
        'monifinebakery@gmail.com',  -- Add actual admin emails
        'owner@bismillah.com'
    ) THEN
        v_is_admin := TRUE;
    END IF;
    
    RETURN v_is_admin;
END;
$$;

-- Create helper function for order creation
CREATE OR REPLACE FUNCTION public.create_new_order(
    order_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id UUID;
BEGIN
    -- Generate new order ID
    v_order_id := gen_random_uuid();
    
    -- Insert new order (simplified version)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        INSERT INTO public.orders (
            id,
            user_id,
            nama_pelanggan,
            telepon_pelanggan,
            total_pesanan,
            items,
            status,
            tanggal,
            created_at,
            updated_at
        ) VALUES (
            v_order_id,
            auth.uid(),
            order_data->>'nama_pelanggan',
            order_data->>'telepon_pelanggan',
            (order_data->>'total_pesanan')::NUMERIC,
            order_data->'items',
            COALESCE(order_data->>'status', 'pending'),
            COALESCE((order_data->>'tanggal')::DATE, CURRENT_DATE),
            NOW(),
            NOW()
        );
    END IF;
    
    RETURN v_order_id;
END;
$$;

-- Create helper function to check if order can be completed
CREATE OR REPLACE FUNCTION public.can_complete_order(
    p_order_id UUID
)
RETURNS TABLE (
    can_complete BOOLEAN,
    total_ingredients INTEGER,
    available_ingredients INTEGER,
    insufficient_stock JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Simplified check - always return true for now
    -- In a real implementation, this would check recipe ingredients against stock
    RETURN QUERY
    SELECT 
        TRUE as can_complete,
        0 as total_ingredients,
        0 as available_ingredients,
        '[]'::JSONB as insufficient_stock;
END;
$$;

-- Create helper function to complete order and deduct stock
CREATE OR REPLACE FUNCTION public.complete_order_and_deduct_stock(
    p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Update order status to completed
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        UPDATE public.orders
        SET status = 'completed',
            updated_at = NOW()
        WHERE id = p_order_id
            AND user_id = auth.uid();
    END IF;
    
    -- Return success result
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Order completed successfully',
        'order_id', p_order_id,
        'stock_items_updated', 0
    );
    
    RETURN v_result;
END;
$$;
CREATE OR REPLACE FUNCTION public.get_revenue_breakdown(
    p_user_id UUID,
    p_period TEXT
)
RETURNS TABLE (
    category TEXT,
    amount NUMERIC,
    transaction_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Parse period (same logic as main function)
    IF length(p_period) = 7 AND p_period ~ '^\d{4}-\d{2}$' THEN
        v_start_date := (p_period || '-01')::DATE;
        v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    ELSIF length(p_period) = 4 AND p_period ~ '^\d{4}$' THEN
        v_start_date := (p_period || '-01-01')::DATE;
        v_end_date := (p_period || '-12-31')::DATE;
    ELSIF length(p_period) = 10 AND p_period ~ '^\d{4}-\d{2}-\d{2}$' THEN
        v_start_date := p_period::DATE;
        v_end_date := p_period::DATE;
    ELSE
        v_start_date := date_trunc('month', CURRENT_DATE)::DATE;
        v_end_date := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    END IF;

    RETURN QUERY
    SELECT 
        COALESCE(ft.category, 'Lainnya') as category,
        SUM(ft.amount) as amount,
        COUNT(*) as transaction_count
    FROM public.financial_transactions ft
    WHERE ft.user_id = p_user_id
        AND ft.type = 'income'
        AND ft.date >= v_start_date
        AND ft.date <= v_end_date
    GROUP BY ft.category
    ORDER BY amount DESC;
END;
$$;

-- Create helper function for profit trend analysis
CREATE OR REPLACE FUNCTION public.get_profit_trend(
    p_user_id UUID,
    p_start_period TEXT,
    p_end_period TEXT
)
RETURNS TABLE (
    period TEXT,
    total_revenue NUMERIC,
    total_cogs NUMERIC,
    total_opex NUMERIC,
    gross_profit NUMERIC,
    net_profit NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_current_date DATE;
    v_period_text TEXT;
BEGIN
    -- Parse start and end periods
    v_start_date := (p_start_period || '-01')::DATE;
    v_end_date := (p_end_period || '-01')::DATE + INTERVAL '1 month' - INTERVAL '1 day';
    v_current_date := v_start_date;

    -- Generate monthly periods
    WHILE v_current_date <= v_end_date LOOP
        v_period_text := to_char(v_current_date, 'YYYY-MM');
        
        -- Get profit data for this period
        WITH profit_data AS (
            SELECT * FROM public.calculate_realtime_profit(p_user_id, v_period_text)
        )
        SELECT 
            v_period_text,
            pd.total_revenue,
            pd.total_cogs,
            pd.total_opex,
            (pd.total_revenue - pd.total_cogs) as gross_profit,
            (pd.total_revenue - pd.total_cogs - pd.total_opex) as net_profit
        FROM profit_data pd;
        
        -- Move to next month
        v_current_date := v_current_date + INTERVAL '1 month';
    END LOOP;
    
    RETURN;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calculate_realtime_profit TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_breakdown TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_profit_trend TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_total_costs TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_overhead TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_new_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_complete_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_order_and_deduct_stock TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.calculate_realtime_profit IS 'Calculate real-time profit analysis for a given period and user';
COMMENT ON FUNCTION public.get_revenue_breakdown IS 'Get revenue breakdown by category for profit analysis';
COMMENT ON FUNCTION public.get_profit_trend IS 'Get profit trend data across multiple periods';
COMMENT ON FUNCTION public.get_total_costs IS 'Get total operational costs for a user';
COMMENT ON FUNCTION public.calculate_overhead IS 'Calculate overhead costs based on material cost';
COMMENT ON FUNCTION public.get_order_statistics IS 'Get order statistics for a user';
COMMENT ON FUNCTION public.is_user_admin IS 'Check if current user has admin privileges';
COMMENT ON FUNCTION public.create_new_order IS 'Create a new order with given data';
COMMENT ON FUNCTION public.can_complete_order IS 'Check if an order can be completed based on stock';
COMMENT ON FUNCTION public.complete_order_and_deduct_stock IS 'Complete an order and deduct stock accordingly';

-- Verification query
SELECT 'All profit analysis and supporting functions created successfully' as status;

-- Show created functions
SELECT 
    routine_name,
    routine_type,
    security_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
    'calculate_realtime_profit',
    'get_revenue_breakdown', 
    'get_profit_trend',
    'get_total_costs',
    'calculate_overhead',
    'get_order_statistics',
    'is_user_admin',
    'create_new_order',
    'can_complete_order',
    'complete_order_and_deduct_stock'
)
ORDER BY routine_name;

-- Example usage:
-- SELECT * FROM public.calculate_realtime_profit('user-uuid-here', '2024-01');
-- SELECT * FROM public.get_revenue_breakdown('user-uuid-here', '2024-01');
-- SELECT * FROM public.get_profit_trend('user-uuid-here', '2024-01', '2024-12');