-- Fix for pemakaian_bahan_daily_mv materialized view
-- Error: relation "public.pemakaian_bahan_daily_mv" does not exist
-- This happens when the materialized view is created WITH NO DATA and never refreshed

-- First, let's check if the materialized view exists
DO $$
BEGIN
    -- Check if the materialized view exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pemakaian_bahan_daily_mv'
        AND table_type = 'VIEW'
    ) THEN
        RAISE NOTICE 'Materialized view pemakaian_bahan_daily_mv exists';
        
        -- Try to refresh it with data
        BEGIN
            REFRESH MATERIALIZED VIEW public.pemakaian_bahan_daily_mv;
            RAISE NOTICE 'Successfully refreshed materialized view with data';
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Failed to refresh materialized view: %', SQLERRM;
                
                -- If refresh fails, recreate the materialized view
                DROP MATERIALIZED VIEW IF EXISTS public.pemakaian_bahan_daily_mv CASCADE;
                
                CREATE MATERIALIZED VIEW public.pemakaian_bahan_daily_mv AS
                SELECT 
                    user_id,
                    tanggal AS date,
                    sum(hpp_value) AS total_hpp,
                    count(*) AS usage_count,
                    string_agg(DISTINCT source_type::text, ', ') AS source_types
                FROM public.pemakaian_bahan
                GROUP BY user_id, tanggal
                WITH DATA;
                
                -- Recreate the unique index
                CREATE UNIQUE INDEX idx_pemakaian_daily_mv_user_date 
                ON public.pemakaian_bahan_daily_mv 
                USING btree (user_id, date);
                
                RAISE NOTICE 'Recreated materialized view with data and index';
        END;
    ELSE
        RAISE NOTICE 'Materialized view does not exist, creating it...';
        
        -- Create the materialized view from scratch
        CREATE MATERIALIZED VIEW public.pemakaian_bahan_daily_mv AS
        SELECT 
            user_id,
            tanggal AS date,
            sum(hpp_value) AS total_hpp,
            count(*) AS usage_count,
            string_agg(DISTINCT source_type::text, ', ') AS source_types
        FROM public.pemakaian_bahan
        GROUP BY user_id, tanggal
        WITH DATA;
        
        -- Create the unique index
        CREATE UNIQUE INDEX idx_pemakaian_daily_mv_user_date 
        ON public.pemakaian_bahan_daily_mv 
        USING btree (user_id, date);
        
        RAISE NOTICE 'Created materialized view with data and index';
    END IF;
END
$$;
