
-- Perbaiki function dengan security yang benar
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Drop semua triggers dulu, lalu recreate (tanpa IF NOT EXISTS)
DROP TRIGGER IF EXISTS update_bahan_baku_updated_at ON public.bahan_baku;
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
DROP TRIGGER IF EXISTS update_hpp_recipes_updated_at ON public.hpp_recipes;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;

-- Create semua triggers
CREATE TRIGGER update_bahan_baku_updated_at 
    BEFORE UPDATE ON public.bahan_baku
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at 
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at 
    BEFORE UPDATE ON public.purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hpp_recipes_updated_at 
    BEFORE UPDATE ON public.hpp_recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
