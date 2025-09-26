-- Remove conflicting WAC trigger and function
-- This addresses the conflict between database-level auto-sync and application-level manual sync

-- Only drop trigger if purchases table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchases'
    ) THEN
        DROP TRIGGER IF EXISTS trigger_auto_update_wac ON public.purchases;
        RAISE NOTICE 'Dropped trigger trigger_auto_update_wac from purchases table';
    ELSE
        RAISE NOTICE 'Table purchases does not exist, skipping trigger drop';
    END IF;
END$$;

-- Drop the conflicting functions (these don't require table existence)
DROP FUNCTION IF EXISTS public.auto_update_wac_on_purchase_completion();
DROP FUNCTION IF EXISTS public.recalculate_all_existing_wac(uuid);

-- Check if update_wac_price function exists and drop it if it does
-- This function might be referenced by the trigger but may not exist or be outdated
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_proc p 
        INNER JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND p.proname = 'update_wac_price'
    ) THEN
        DROP FUNCTION public.update_wac_price;
        RAISE NOTICE 'Dropped function update_wac_price';
    ELSE
        RAISE NOTICE 'Function update_wac_price does not exist, skipping';
    END IF;
END$$;

-- Add comment explaining the removal (only if table exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'purchases'
    ) THEN
        COMMENT ON TABLE public.purchases IS 'Warehouse sync is now handled manually in the application layer via applyPurchaseToWarehouse() function to prevent race conditions and ensure consistency';
        RAISE NOTICE 'Added comment to purchases table explaining manual sync';
    ELSE
        RAISE NOTICE 'Table purchases does not exist, skipping comment';
    END IF;
END$$;
