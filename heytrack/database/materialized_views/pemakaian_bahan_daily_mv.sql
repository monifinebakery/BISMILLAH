-- ==============================================
-- MATERIALIZED VIEW: pemakaian_bahan_daily_mv
-- Purpose: Daily aggregation of material usage for profit analysis
-- ==============================================

-- Drop existing materialized view if exists
DROP MATERIALIZED VIEW IF EXISTS public.pemakaian_bahan_daily_mv CASCADE;

-- Create materialized view for daily COGS aggregation
CREATE MATERIALIZED VIEW public.pemakaian_bahan_daily_mv AS
SELECT 
    pb.user_id,
    pb.tanggal::date as date,
    SUM(
        COALESCE(pb.hpp_value, 0) + 
        COALESCE(pb.qty_base * pb.harga_efektif, 0)
    ) as total_hpp,
    COUNT(*) as usage_count,
    COUNT(DISTINCT pb.bahan_baku_id) as unique_materials,
    -- Additional aggregations for analysis
    SUM(pb.qty_base) as total_quantity,
    AVG(pb.harga_efektif) as avg_effective_price,
    MIN(pb.tanggal) as first_usage_time,
    MAX(pb.tanggal) as last_usage_time,
    -- Date formatting for easy filtering
    EXTRACT(YEAR FROM pb.tanggal) as year,
    EXTRACT(MONTH FROM pb.tanggal) as month,
    EXTRACT(DAY FROM pb.tanggal) as day,
    TO_CHAR(pb.tanggal, 'YYYY-MM') as period_month,
    TO_CHAR(pb.tanggal, 'YYYY-"Q"Q') as period_quarter,
    -- Metadata
    NOW() as materialized_at
FROM public.pemakaian_bahan pb
WHERE 
    pb.tanggal IS NOT NULL 
    AND pb.user_id IS NOT NULL
    AND (
        pb.hpp_value > 0 
        OR (pb.qty_base > 0 AND pb.harga_efektif > 0)
    )
GROUP BY 
    pb.user_id,
    pb.tanggal::date
ORDER BY 
    pb.user_id,
    pb.tanggal::date DESC;

-- Add comments for documentation
COMMENT ON MATERIALIZED VIEW public.pemakaian_bahan_daily_mv IS 'Daily aggregation of material usage for profit analysis - provides fast COGS calculation per day per user';

-- Create indexes for performance
CREATE UNIQUE INDEX idx_pemakaian_daily_mv_user_date ON public.pemakaian_bahan_daily_mv (user_id, date);
CREATE INDEX idx_pemakaian_daily_mv_date ON public.pemakaian_bahan_daily_mv (date);
CREATE INDEX idx_pemakaian_daily_mv_user ON public.pemakaian_bahan_daily_mv (user_id);
CREATE INDEX idx_pemakaian_daily_mv_period_month ON public.pemakaian_bahan_daily_mv (period_month);
CREATE INDEX idx_pemakaian_daily_mv_total_hpp ON public.pemakaian_bahan_daily_mv (total_hpp) WHERE total_hpp > 0;

-- Add RLS (Row Level Security) if needed
ALTER MATERIALIZED VIEW public.pemakaian_bahan_daily_mv ENABLE ROW LEVEL SECURITY;

-- Create RLS policy to ensure users only see their own data
CREATE POLICY pemakaian_daily_mv_user_policy ON public.pemakaian_bahan_daily_mv
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT ON public.pemakaian_bahan_daily_mv TO authenticated;
GRANT SELECT ON public.pemakaian_bahan_daily_mv TO service_role;

-- ==============================================
-- REFRESH FUNCTION
-- ==============================================

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION public.refresh_pemakaian_daily_mv()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Refresh the materialized view concurrently if possible
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.pemakaian_bahan_daily_mv;
        RAISE NOTICE 'Successfully refreshed pemakaian_bahan_daily_mv concurrently';
    EXCEPTION 
        WHEN OTHERS THEN
            -- Fallback to non-concurrent refresh
            REFRESH MATERIALIZED VIEW public.pemakaian_bahan_daily_mv;
            RAISE NOTICE 'Refreshed pemakaian_bahan_daily_mv (non-concurrent fallback)';
    END;
END;
$$;

-- Grant execute permission on refresh function
GRANT EXECUTE ON FUNCTION public.refresh_pemakaian_daily_mv() TO service_role;

-- ==============================================
-- AUTO-REFRESH TRIGGER (Optional)
-- ==============================================

-- Function to auto-refresh materialized view when pemakaian_bahan is updated
CREATE OR REPLACE FUNCTION public.trigger_refresh_pemakaian_daily_mv()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Schedule refresh in background (use pg_cron if available, or manual refresh)
    -- For now, we'll just log the event - manual refresh recommended
    RAISE NOTICE 'pemakaian_bahan updated - consider refreshing pemakaian_bahan_daily_mv';
    RETURN NULL;
END;
$$;

-- Create trigger on pemakaian_bahan table (optional - can be resource intensive)
-- Uncomment if you want auto-refresh (recommended for development only)
/*
CREATE TRIGGER trigger_pemakaian_daily_mv_refresh
    AFTER INSERT OR UPDATE OR DELETE ON public.pemakaian_bahan
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_refresh_pemakaian_daily_mv();
*/

-- ==============================================
-- INITIAL DATA POPULATION
-- ==============================================

-- Populate the materialized view with initial data
SELECT public.refresh_pemakaian_daily_mv();

-- ==============================================
-- USAGE EXAMPLES
-- ==============================================

/*
-- Example 1: Get daily COGS for a user in date range
SELECT 
    date,
    total_hpp,
    usage_count,
    unique_materials
FROM public.pemakaian_bahan_daily_mv 
WHERE user_id = 'user-id-here'
    AND date >= '2024-01-01'
    AND date <= '2024-01-31'
ORDER BY date;

-- Example 2: Get monthly COGS summary
SELECT 
    period_month,
    SUM(total_hpp) as monthly_cogs,
    AVG(total_hpp) as avg_daily_cogs,
    COUNT(*) as active_days
FROM public.pemakaian_bahan_daily_mv 
WHERE user_id = 'user-id-here'
    AND period_month = '2024-01'
GROUP BY period_month;

-- Example 3: Get COGS trend over time
SELECT 
    date,
    total_hpp,
    LAG(total_hpp) OVER (ORDER BY date) as prev_day_hpp,
    total_hpp - LAG(total_hpp) OVER (ORDER BY date) as daily_change
FROM public.pemakaian_bahan_daily_mv 
WHERE user_id = 'user-id-here'
    AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date;

-- Manual refresh command (run when needed):
-- SELECT public.refresh_pemakaian_daily_mv();
*/
