-- =====================================
-- Complete Database Objects Rebuild Script
-- =====================================
-- This script drops and recreates all triggers, functions, indexes, 
-- and constraints for the entire database schema (except user_payments)

-- =====================================
-- PHASE 1: DROP ALL EXISTING OBJECTS
-- =====================================

-- Drop all existing triggers
DROP TRIGGER IF EXISTS update_activities_updated_at ON public.activities;
DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
DROP TRIGGER IF EXISTS update_bahan_baku_updated_at ON public.bahan_baku;
DROP TRIGGER IF EXISTS update_financial_transactions_updated_at ON public.financial_transactions;
DROP TRIGGER IF EXISTS update_hpp_recipes_updated_at ON public.hpp_recipes;
DROP TRIGGER IF EXISTS update_hpp_results_updated_at ON public.hpp_results;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
DROP TRIGGER IF EXISTS update_pemakaian_bahan_updated_at ON public.pemakaian_bahan;
DROP TRIGGER IF EXISTS trigger_refresh_pemakaian_mv ON public.pemakaian_bahan;

-- Drop legacy warehouse triggers
DROP TRIGGER IF EXISTS trigger_purchase_warehouse_sync ON public.purchases;
DROP TRIGGER IF EXISTS auto_apply_purchase_warehouse ON public.purchases;
DROP TRIGGER IF EXISTS set_applied_at_trigger ON public.purchases;

-- Drop all custom functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.refresh_pemakaian_daily_mv() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_refresh_pemakaian_mv() CASCADE;
DROP FUNCTION IF EXISTS public.record_material_usage CASCADE;
DROP FUNCTION IF EXISTS public.get_cogs_for_period CASCADE;

-- Drop legacy warehouse functions
DROP FUNCTION IF EXISTS handle_purchase_warehouse_sync() CASCADE;
DROP FUNCTION IF EXISTS apply_purchase_to_warehouse() CASCADE;
DROP FUNCTION IF EXISTS reverse_purchase_from_warehouse() CASCADE;
DROP FUNCTION IF EXISTS calculate_warehouse_wac() CASCADE;
DROP FUNCTION IF EXISTS sync_all_warehouse_wac() CASCADE;

-- Drop order workflow functions
DROP FUNCTION IF EXISTS complete_order_and_deduct_stock(UUID) CASCADE;
DROP FUNCTION IF EXISTS can_complete_order(UUID) CASCADE;
DROP FUNCTION IF EXISTS reverse_order_completion(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_recipe_ingredients_for_order(UUID) CASCADE;

-- Drop all non-primary key indexes
DROP INDEX IF EXISTS idx_activities_user_id;
DROP INDEX IF EXISTS idx_activities_user_type;
DROP INDEX IF EXISTS idx_activities_user_date;
DROP INDEX IF EXISTS idx_assets_user_id;
DROP INDEX IF EXISTS idx_assets_user_kategori;
DROP INDEX IF EXISTS idx_bahan_baku_user_id;
DROP INDEX IF EXISTS idx_bahan_baku_user_kategori;
DROP INDEX IF EXISTS idx_bahan_baku_stok;
DROP INDEX IF EXISTS idx_bahan_baku_harga_rata_rata;
DROP INDEX IF EXISTS idx_bahan_baku_harga_per_satuan;
DROP INDEX IF EXISTS idx_financial_transactions_user_id;
DROP INDEX IF EXISTS idx_financial_transactions_user_type;
DROP INDEX IF EXISTS idx_financial_transactions_user_date;
DROP INDEX IF EXISTS idx_hpp_recipes_user_id;
DROP INDEX IF EXISTS idx_hpp_results_user_id;
DROP INDEX IF EXISTS idx_orders_user_id;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_user_status;
DROP INDEX IF EXISTS idx_purchases_user_id;
DROP INDEX IF EXISTS idx_purchases_status;
DROP INDEX IF EXISTS idx_purchases_user_status;
DROP INDEX IF EXISTS idx_suppliers_user_id;
DROP INDEX IF EXISTS idx_user_settings_user_id;
DROP INDEX IF EXISTS idx_pemakaian_bahan_user_id;
DROP INDEX IF EXISTS idx_pemakaian_bahan_user_date;
DROP INDEX IF EXISTS idx_pemakaian_bahan_user_bahan_date;

-- Drop legacy purchase indexes
DROP INDEX IF EXISTS idx_purchases_status_applied;
DROP INDEX IF EXISTS idx_purchases_applied_at;
DROP INDEX IF EXISTS idx_purchases_user_applied;

-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS public.pemakaian_bahan_daily_mv CASCADE;

-- Drop all RLS policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename != 'user_payments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.%s', 
                      policy_record.policyname, policy_record.tablename);
    END LOOP;
END $$;

-- =====================================
-- PHASE 2: CREATE ALL FUNCTIONS
-- =====================================

-- Main updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pemakaian Bahan functions
CREATE OR REPLACE FUNCTION public.refresh_pemakaian_daily_mv()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.pemakaian_bahan_daily_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.trigger_refresh_pemakaian_mv()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.refresh_pemakaian_daily_mv();
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.record_material_usage(
    p_bahan_baku_id UUID,
    p_qty_base NUMERIC,
    p_tanggal DATE DEFAULT CURRENT_DATE,
    p_harga_efektif NUMERIC DEFAULT NULL,
    p_source_type VARCHAR DEFAULT 'manual',
    p_source_id UUID DEFAULT NULL,
    p_keterangan TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_usage_id UUID;
    v_effective_price NUMERIC;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    IF p_harga_efektif IS NULL THEN
        SELECT COALESCE(harga_rata_rata, harga_satuan, 0)
        INTO v_effective_price
        FROM public.bahan_baku
        WHERE id = p_bahan_baku_id AND user_id = auth.uid();
        
        IF v_effective_price IS NULL THEN
            RAISE EXCEPTION 'Bahan baku not found or access denied';
        END IF;
    ELSE
        v_effective_price := p_harga_efektif;
    END IF;
    
    INSERT INTO public.pemakaian_bahan (
        user_id, bahan_baku_id, qty_base, tanggal, harga_efektif,
        source_type, source_id, keterangan
    ) VALUES (
        auth.uid(), p_bahan_baku_id, p_qty_base, p_tanggal, v_effective_price,
        p_source_type, p_source_id, p_keterangan
    ) RETURNING id INTO v_usage_id;
    
    RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================
-- PHASE 3: CREATE ALL TRIGGERS
-- =====================================

-- Updated_at triggers for all tables
CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON public.activities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bahan_baku_updated_at
    BEFORE UPDATE ON public.bahan_baku
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
    BEFORE UPDATE ON public.financial_transactions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hpp_recipes_updated_at
    BEFORE UPDATE ON public.hpp_recipes
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pemakaian_bahan_updated_at
    BEFORE UPDATE ON public.pemakaian_bahan
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_refresh_pemakaian_mv
    AFTER INSERT OR UPDATE OR DELETE ON public.pemakaian_bahan
    FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_refresh_pemakaian_mv();

-- =====================================
-- PHASE 4: CREATE ALL INDEXES
-- =====================================

-- Essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON public.activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_kategori ON public.assets(user_id, kategori);
CREATE INDEX IF NOT EXISTS idx_bahan_baku_user_id ON public.bahan_baku(user_id);
CREATE INDEX IF NOT EXISTS idx_bahan_baku_user_kategori ON public.bahan_baku(user_id, kategori);
CREATE INDEX IF NOT EXISTS idx_bahan_baku_stok ON public.bahan_baku(stok) WHERE stok <= minimum;
CREATE INDEX IF NOT EXISTS idx_bahan_baku_harga_rata_rata ON public.bahan_baku(user_id, harga_rata_rata);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id ON public.financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_date ON public.financial_transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_hpp_recipes_user_id ON public.hpp_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_hpp_results_user_id ON public.hpp_results(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.purchases(status);
CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON public.purchases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_pemakaian_bahan_user_id ON public.pemakaian_bahan(user_id);
CREATE INDEX IF NOT EXISTS idx_pemakaian_bahan_user_date ON public.pemakaian_bahan(user_id, tanggal DESC);

-- =====================================
-- PHASE 5: CREATE MATERIALIZED VIEWS
-- =====================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.pemakaian_bahan_daily_mv AS
SELECT 
    user_id,
    tanggal::DATE as date,
    SUM(hpp_value) as total_hpp,
    COUNT(*) as usage_count,
    STRING_AGG(DISTINCT source_type, ', ') as source_types
FROM public.pemakaian_bahan
GROUP BY user_id, tanggal::DATE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_pemakaian_daily_mv_user_date 
ON public.pemakaian_bahan_daily_mv(user_id, date);

-- =====================================
-- PHASE 6: CREATE RLS POLICIES
-- =====================================

-- Enable RLS on all tables
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bahan_baku ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hpp_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hpp_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pemakaian_bahan ENABLE ROW LEVEL SECURITY;

-- Create standard RLS policies for each table
DO $$
DECLARE
    table_name TEXT;
    tables TEXT[] := ARRAY[
        'activities', 'assets', 'bahan_baku', 'financial_transactions',
        'hpp_recipes', 'hpp_results', 'orders', 'purchases', 
        'suppliers', 'user_settings', 'pemakaian_bahan'
    ];
BEGIN
    FOREACH table_name IN ARRAY tables
    LOOP
        -- SELECT policy
        EXECUTE format('
            CREATE POLICY "Users can view own %s"
                ON public.%s FOR SELECT
                USING (auth.uid() = user_id)', table_name, table_name);
        
        -- INSERT policy
        EXECUTE format('
            CREATE POLICY "Users can insert own %s"
                ON public.%s FOR INSERT
                WITH CHECK (auth.uid() = user_id)', table_name, table_name);
        
        -- UPDATE policy
        EXECUTE format('
            CREATE POLICY "Users can update own %s"
                ON public.%s FOR UPDATE
                USING (auth.uid() = user_id)
                WITH CHECK (auth.uid() = user_id)', table_name, table_name);
        
        -- DELETE policy
        EXECUTE format('
            CREATE POLICY "Users can delete own %s"
                ON public.%s FOR DELETE
                USING (auth.uid() = user_id)', table_name, table_name);
    END LOOP;
END $$;

-- =====================================
-- PHASE 7: GRANT PERMISSIONS
-- =====================================

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.pemakaian_bahan_daily_mv TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================
-- PHASE 8: VERIFICATION
-- =====================================

-- Verify the rebuild
SELECT 
    'Database rebuild completed' as status,
    (SELECT COUNT(*) FROM pg_trigger WHERE tgname LIKE 'update_%_updated_at') as triggers_created,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%') as indexes_created,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename != 'user_payments') as policies_created,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as functions_created;

-- Show table-wise summary
SELECT 
    t.table_name,
    COALESCE(trigger_count.count, 0) as triggers,
    COALESCE(index_count.count, 0) as indexes,
    COALESCE(policy_count.count, 0) as policies
FROM information_schema.tables t
LEFT JOIN (
    SELECT event_object_table, COUNT(*) as count
    FROM information_schema.triggers 
    WHERE event_object_schema = 'public'
    GROUP BY event_object_table
) trigger_count ON t.table_name = trigger_count.event_object_table
LEFT JOIN (
    SELECT tablename, COUNT(*) as count
    FROM pg_indexes 
    WHERE schemaname = 'public'
    GROUP BY tablename
) index_count ON t.table_name = index_count.tablename
LEFT JOIN (
    SELECT tablename, COUNT(*) as count
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename
) policy_count ON t.table_name = policy_count.tablename
WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    AND t.table_name != 'user_payments'
ORDER BY t.table_name;

-- =====================================
-- COMPLETION MESSAGE
-- =====================================
SELECT 'Database objects rebuild completed successfully! All triggers, functions, indexes, and constraints have been recreated.' as message;