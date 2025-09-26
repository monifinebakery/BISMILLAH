-- Chatbot Analytics & Monitoring
CREATE OR REPLACE VIEW chatbot_analytics AS
SELECT
    DATE_TRUNC('day', created_at) as date,
    user_id,
    COUNT(*) as total_interactions,
    COUNT(CASE WHEN type = 'query' THEN 1 END) as queries,
    COUNT(CASE WHEN type = 'action' THEN 1 END) as actions,
    COUNT(CASE WHEN type = 'error' THEN 1 END) as errors,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_response_time
FROM chatbot_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), user_id
ORDER BY date DESC, total_interactions DESC;

-- Quick Stock Alerts for Chatbot
CREATE OR REPLACE VIEW chatbot_stock_alerts AS
SELECT
    bb.nama as bahan_nama,
    bb.stok as current_stock,
    bb.minimum as minimum_stock,
    CASE
        WHEN bb.stok <= 0 THEN 'HABIS'
        WHEN bb.stok <= bb.minimum THEN 'KRITIS'
        WHEN bb.stok <= (bb.minimum * 1.5) THEN 'PERINGATAN'
        ELSE 'AMAN'
    END as status,
    bb.satuan,
    bb.harga,
    u.business_name as user_business
FROM bahan_baku bb
JOIN user_settings u ON bb.user_id = u.user_id
WHERE bb.stok <= (bb.minimum * 2) OR bb.stok <= 0
ORDER BY
    CASE
        WHEN bb.stok <= 0 THEN 1
        WHEN bb.stok <= bb.minimum THEN 2
        WHEN bb.stok <= (bb.minimum * 1.5) THEN 3
        ELSE 4
    END,
    bb.stok ASC;

-- Smart Order Suggestions for Chatbot
CREATE OR REPLACE VIEW chatbot_order_suggestions AS
WITH recent_orders AS (
    SELECT
        user_id,
        nama_pelanggan,
        total_pesanan,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
    FROM orders
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
),
customer_stats AS (
    SELECT
        user_id,
        nama_pelanggan,
        COUNT(*) as order_count,
        AVG(total_pesanan) as avg_order_value,
        MAX(created_at) as last_order_date,
        SUM(total_pesanan) as total_spent
    FROM recent_orders
    WHERE rn <= 10
    GROUP BY user_id, nama_pelanggan
)
SELECT
    cs.*,
    CASE
        WHEN cs.last_order_date < CURRENT_DATE - INTERVAL '3 days' THEN 'READY_TO_REORDER'
        WHEN cs.avg_order_value > 500000 THEN 'HIGH_VALUE_CUSTOMER'
        WHEN cs.order_count >= 5 THEN 'FREQUENT_CUSTOMER'
        ELSE 'REGULAR_CUSTOMER'
    END as customer_segment,
    u.business_name
FROM customer_stats cs
JOIN user_settings u ON cs.user_id = u.user_id
ORDER BY cs.total_spent DESC, cs.last_order_date DESC;

-- Automated Chatbot Responses Function
CREATE OR REPLACE FUNCTION get_chatbot_response(
    p_user_id UUID,
    p_message TEXT,
    p_intent TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    stock_count INTEGER;
    low_stock_count INTEGER;
    pending_orders INTEGER;
BEGIN
    -- Handle different intents
    CASE LOWER(COALESCE(p_intent, 'unknown'))
        WHEN 'stock_status' THEN
            SELECT COUNT(*), COUNT(CASE WHEN stok <= minimum THEN 1 END)
            INTO stock_count, low_stock_count
            FROM bahan_baku
            WHERE user_id = p_user_id;

            result := json_build_object(
                'type', 'stock_summary',
                'text', FORMAT('📦 Status Stok: %s bahan total, %s perlu restock', stock_count, low_stock_count),
                'data', json_build_object(
                    'total_items', stock_count,
                    'low_stock_items', low_stock_count
                )
            );

        WHEN 'sales_today' THEN
            SELECT COUNT(*)
            INTO pending_orders
            FROM orders
            WHERE user_id = p_user_id
            AND DATE(created_at) = CURRENT_DATE;

            result := json_build_object(
                'type', 'sales_summary',
                'text', FORMAT('💰 Penjualan Hari Ini: %s pesanan', pending_orders),
                'data', json_build_object('orders_today', pending_orders)
            );

        WHEN 'urgent_alerts' THEN
            SELECT COUNT(*)
            INTO low_stock_count
            FROM bahan_baku
            WHERE user_id = p_user_id AND stok <= minimum;

            SELECT COUNT(*)
            INTO pending_orders
            FROM orders
            WHERE user_id = p_user_id AND status = 'draft';

            result := json_build_object(
                'type', 'urgent_alerts',
                'text', CASE
                    WHEN low_stock_count > 0 AND pending_orders > 0 THEN
                        FORMAT('🚨 %s bahan stok rendah, %s pesanan pending!', low_stock_count, pending_orders)
                    WHEN low_stock_count > 0 THEN
                        FORMAT('🚨 %s bahan perlu restock segera!', low_stock_count)
                    WHEN pending_orders > 0 THEN
                        FORMAT('📋 %s pesanan menunggu konfirmasi!', pending_orders)
                    ELSE '✅ Semua dalam kondisi baik!'
                END,
                'data', json_build_object(
                    'low_stock_count', low_stock_count,
                    'pending_orders', pending_orders
                )
            );

        ELSE
            result := json_build_object(
                'type', 'general_response',
                'text', 'Halo! Saya bisa membantu Anda dengan informasi stok, penjualan, dan operasional bisnis. Apa yang ingin Anda ketahui?'
            );
    END CASE;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Chatbot Logging Function
CREATE OR REPLACE FUNCTION log_chatbot_interaction(
    p_user_id UUID,
    p_message TEXT,
    p_response TEXT,
    p_intent TEXT DEFAULT NULL,
    p_response_time DECIMAL DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO chatbot_logs (
        user_id,
        message,
        response,
        intent,
        response_time,
        success,
        created_at
    ) VALUES (
        p_user_id,
        p_message,
        p_response,
        p_intent,
        p_response_time,
        p_success,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automated Stock Reorder Suggestions
CREATE OR REPLACE FUNCTION suggest_stock_reorders(p_user_id UUID)
RETURNS TABLE (
    bahan_nama TEXT,
    current_stock DECIMAL,
    minimum_stock DECIMAL,
    suggested_order DECIMAL,
    priority TEXT,
    estimated_cost DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bb.nama,
        bb.stok,
        bb.minimum,
        GREATEST(bb.minimum * 2 - bb.stok, 0) as suggested_order,
        CASE
            WHEN bb.stok <= 0 THEN 'CRITICAL'
            WHEN bb.stok <= bb.minimum THEN 'HIGH'
            WHEN bb.stok <= (bb.minimum * 1.5) THEN 'MEDIUM'
            ELSE 'LOW'
        END as priority,
        GREATEST(bb.minimum * 2 - bb.stok, 0) * bb.harga as estimated_cost
    FROM bahan_baku bb
    WHERE bb.user_id = p_user_id
    AND bb.stok <= (bb.minimum * 2)
    ORDER BY
        CASE
            WHEN bb.stok <= 0 THEN 1
            WHEN bb.stok <= bb.minimum THEN 2
            WHEN bb.stok <= (bb.minimum * 1.5) THEN 3
            ELSE 4
        END,
        bb.stok ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Predictive Sales Forecasting (Simple)
CREATE OR REPLACE FUNCTION predict_daily_sales(p_user_id UUID, p_days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
    forecast_date DATE,
    predicted_orders INTEGER,
    confidence TEXT,
    based_on_days INTEGER
) AS $$
DECLARE
    avg_daily_orders DECIMAL;
    total_days INTEGER;
BEGIN
    -- Calculate average from last 30 days
    SELECT
        AVG(daily_orders)::DECIMAL,
        COUNT(*)::INTEGER
    INTO avg_daily_orders, total_days
    FROM (
        SELECT DATE(created_at) as order_date, COUNT(*) as daily_orders
        FROM orders
        WHERE user_id = p_user_id
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
    ) daily_stats;

    -- Generate forecast
    RETURN QUERY
    SELECT
        (CURRENT_DATE + (n || ' days')::INTERVAL)::DATE as forecast_date,
        ROUND(avg_daily_orders)::INTEGER as predicted_orders,
        CASE
            WHEN total_days >= 20 THEN 'HIGH'
            WHEN total_days >= 10 THEN 'MEDIUM'
            ELSE 'LOW'
        END as confidence,
        total_days as based_on_days
    FROM generate_series(1, p_days_ahead) n;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create chatbot_logs table if not exists
CREATE TABLE IF NOT EXISTS chatbot_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT,
    intent TEXT,
    response_time DECIMAL,
    success BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_user_id ON chatbot_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_created_at ON chatbot_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_intent ON chatbot_logs(intent);

-- Add RLS policies
ALTER TABLE chatbot_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chatbot logs" ON chatbot_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chatbot logs" ON chatbot_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_chatbot_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chatbot_logs_updated_at
    BEFORE UPDATE ON chatbot_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_chatbot_logs_updated_at();
