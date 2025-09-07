-- Quick Create: pemakaian_bahan_daily_mv
-- Copy and paste this directly into Supabase SQL Editor

-- Drop if exists
DROP MATERIALIZED VIEW IF EXISTS public.pemakaian_bahan_daily_mv CASCADE;

-- Create materialized view
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
    SUM(pb.qty_base) as total_quantity,
    AVG(pb.harga_efektif) as avg_effective_price,
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

-- Create indexes
CREATE UNIQUE INDEX idx_pemakaian_daily_mv_user_date ON public.pemakaian_bahan_daily_mv (user_id, date);
CREATE INDEX idx_pemakaian_daily_mv_date ON public.pemakaian_bahan_daily_mv (date);

-- Enable RLS
ALTER MATERIALIZED VIEW public.pemakaian_bahan_daily_mv ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY pemakaian_daily_mv_user_policy ON public.pemakaian_bahan_daily_mv
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT ON public.pemakaian_bahan_daily_mv TO authenticated;
GRANT SELECT ON public.pemakaian_bahan_daily_mv TO service_role;

-- Refresh function
CREATE OR REPLACE FUNCTION public.refresh_pemakaian_daily_mv()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.pemakaian_bahan_daily_mv;
    RAISE NOTICE 'pemakaian_bahan_daily_mv refreshed successfully';
END;
$$;

-- Grant function permission
GRANT EXECUTE ON FUNCTION public.refresh_pemakaian_daily_mv() TO service_role;

-- Test query (optional - remove if you want)
SELECT 
    'Materialized view created successfully!' as status,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(date) as earliest_date,
    MAX(date) as latest_date
FROM public.pemakaian_bahan_daily_mv;
