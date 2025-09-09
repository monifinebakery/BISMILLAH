-- Fix for the migration order issue in pemakaian_bahan_daily
-- This script first drops the problematic function, creates the view, then recreates the function

BEGIN;

-- 1. Drop the function that's causing the error
DROP FUNCTION IF EXISTS public.pemakaian_bahan_daily_get();

-- 2. Create the materialized view first
CREATE MATERIALIZED VIEW IF NOT EXISTS public.pemakaian_bahan_daily_mv AS 
SELECT 
    user_id,
    (tanggal)::date AS date,
    sum((COALESCE(hpp_value, (0)::numeric) + COALESCE((qty_base * harga_efektif), (0)::numeric))) AS total_hpp,
    count(*) AS usage_count,
    count(DISTINCT bahan_baku_id) AS unique_materials,
    sum(qty_base) AS total_quantity,
    avg(harga_efektif) AS avg_effective_price,
    now() AS materialized_at
FROM pemakaian_bahan pb
WHERE ((tanggal IS NOT NULL) AND (user_id IS NOT NULL) AND ((hpp_value > (0)::numeric) OR ((qty_base > (0)::numeric) AND (harga_efektif > (0)::numeric))))
GROUP BY user_id, ((tanggal)::date)
ORDER BY user_id, ((tanggal)::date) DESC;

-- 3. Create unique index for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_pemakaian_daily_mv_user_date 
ON public.pemakaian_bahan_daily_mv USING btree (user_id, date);

-- 4. Create additional index for performance  
CREATE INDEX IF NOT EXISTS idx_pemakaian_daily_mv_date 
ON public.pemakaian_bahan_daily_mv USING btree (date);

-- 5. Create the view that depends on the materialized view
CREATE OR REPLACE VIEW public.pemakaian_bahan_daily AS 
SELECT 
    user_id,
    date,
    total_hpp,
    usage_count,
    unique_materials,
    total_quantity,
    avg_effective_price,
    materialized_at
FROM pemakaian_bahan_daily_mv
WHERE (user_id = auth.uid());

-- 6. Now create the function that returns SETOF pemakaian_bahan_daily
CREATE OR REPLACE FUNCTION public.pemakaian_bahan_daily_get()
RETURNS SETOF pemakaian_bahan_daily
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT *
  FROM public.pemakaian_bahan_daily
  WHERE user_id = (SELECT auth.uid());
$function$;

-- 7. Create the refresh function
CREATE OR REPLACE FUNCTION public.refresh_pemakaian_daily_mv()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Use CONCURRENTLY because we have a unique index
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.pemakaian_bahan_daily_mv;
  RAISE NOTICE 'pemakaian_bahan_daily_mv refreshed successfully';
END;
$function$;

-- 8. Grant necessary permissions
GRANT ALL ON TABLE public.pemakaian_bahan_daily_mv TO anon;
GRANT ALL ON TABLE public.pemakaian_bahan_daily_mv TO authenticated; 
GRANT ALL ON TABLE public.pemakaian_bahan_daily_mv TO service_role;

COMMIT;
