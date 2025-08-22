-- =====================================
-- Create pemakaian_bahan table for Supabase
-- Table untuk tracking pemakaian bahan baku dalam analisis profit dan COGS
-- =====================================

-- Create the main pemakaian_bahan table
CREATE TABLE IF NOT EXISTS public.pemakaian_bahan (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User reference (required for RLS)
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Bahan baku reference
    bahan_baku_id UUID NOT NULL REFERENCES public.bahan_baku(id) ON DELETE CASCADE,
    
    -- Quantity used (base unit)
    qty_base NUMERIC(15,4) NOT NULL DEFAULT 0 CHECK (qty_base >= 0),
    
    -- Date when the material was used
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Effective price at time of usage (for historical accuracy)
    harga_efektif NUMERIC(15,2) DEFAULT 0 CHECK (harga_efektif >= 0),
    
    -- Calculated HPP value (qty_base * harga_efektif)
    hpp_value NUMERIC(15,2) GENERATED ALWAYS AS (qty_base * harga_efektif) STORED,
    
    -- Optional metadata
    keterangan TEXT,
    source_type VARCHAR(50) DEFAULT 'manual' CHECK (source_type IN ('manual', 'recipe', 'order', 'production')),
    source_id UUID, -- Reference to order, recipe, or other source
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comments for documentation
COMMENT ON TABLE public.pemakaian_bahan IS 'Material usage tracking for COGS and profit analysis';
COMMENT ON COLUMN public.pemakaian_bahan.user_id IS 'User who owns this material usage record';
COMMENT ON COLUMN public.pemakaian_bahan.bahan_baku_id IS 'Reference to the material used from bahan_baku table';
COMMENT ON COLUMN public.pemakaian_bahan.qty_base IS 'Quantity used in base unit (matches bahan_baku.satuan)';
COMMENT ON COLUMN public.pemakaian_bahan.tanggal IS 'Date when the material was used';
COMMENT ON COLUMN public.pemakaian_bahan.harga_efektif IS 'Effective price per unit at time of usage (WAC or current price)';
COMMENT ON COLUMN public.pemakaian_bahan.hpp_value IS 'Calculated COGS value (qty_base * harga_efektif) - auto-calculated';
COMMENT ON COLUMN public.pemakaian_bahan.source_type IS 'Source of usage: manual, recipe, order, production';
COMMENT ON COLUMN public.pemakaian_bahan.source_id IS 'Optional reference to source record (order_id, recipe_id, etc.)';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pemakaian_bahan_user_id ON public.pemakaian_bahan(user_id);
CREATE INDEX IF NOT EXISTS idx_pemakaian_bahan_user_date ON public.pemakaian_bahan(user_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_pemakaian_bahan_user_bahan_date ON public.pemakaian_bahan(user_id, bahan_baku_id, tanggal DESC);
CREATE INDEX IF NOT EXISTS idx_pemakaian_bahan_source ON public.pemakaian_bahan(source_type, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pemakaian_bahan_tanggal ON public.pemakaian_bahan(tanggal);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_pemakaian_bahan_updated_at ON public.pemakaian_bahan;
CREATE TRIGGER update_pemakaian_bahan_updated_at
    BEFORE UPDATE ON public.pemakaian_bahan
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create materialized view for daily COGS aggregates (referenced in code)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.pemakaian_bahan_daily_mv AS
SELECT 
    user_id,
    tanggal::DATE as date,
    SUM(hpp_value) as total_hpp,
    COUNT(*) as usage_count,
    STRING_AGG(DISTINCT source_type, ', ') as source_types
FROM public.pemakaian_bahan
GROUP BY user_id, tanggal::DATE;

-- Create unique index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_pemakaian_daily_mv_user_date 
ON public.pemakaian_bahan_daily_mv(user_id, date);

-- Add comment for the materialized view
COMMENT ON MATERIALIZED VIEW public.pemakaian_bahan_daily_mv IS 'Daily aggregated COGS data for fast profit analysis queries';

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION public.refresh_pemakaian_daily_mv()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.pemakaian_bahan_daily_mv;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically refresh materialized view when pemakaian_bahan changes
CREATE OR REPLACE FUNCTION public.trigger_refresh_pemakaian_mv()
RETURNS TRIGGER AS $$
BEGIN
    -- Schedule a refresh in a background job (simplified version)
    -- In production, you might want to use pg_cron or similar
    PERFORM public.refresh_pemakaian_daily_mv();
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply the refresh trigger
DROP TRIGGER IF EXISTS trigger_refresh_pemakaian_mv ON public.pemakaian_bahan;
CREATE TRIGGER trigger_refresh_pemakaian_mv
    AFTER INSERT OR UPDATE OR DELETE ON public.pemakaian_bahan
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.trigger_refresh_pemakaian_mv();

-- Row Level Security (RLS) policies
ALTER TABLE public.pemakaian_bahan ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own pemakaian records
CREATE POLICY "Users can view own pemakaian_bahan"
    ON public.pemakaian_bahan FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own pemakaian records
CREATE POLICY "Users can insert own pemakaian_bahan"
    ON public.pemakaian_bahan FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own pemakaian records
CREATE POLICY "Users can update own pemakaian_bahan"
    ON public.pemakaian_bahan FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own pemakaian records
CREATE POLICY "Users can delete own pemakaian_bahan"
    ON public.pemakaian_bahan FOR DELETE
    USING (auth.uid() = user_id);

-- RLS for materialized view
ALTER MATERIALIZED VIEW public.pemakaian_bahan_daily_mv OWNER TO postgres;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pemakaian_bahan TO authenticated;
GRANT SELECT ON public.pemakaian_bahan_daily_mv TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_pemakaian_daily_mv() TO authenticated;

-- Create some helper functions for common operations

-- Function to record material usage (wrapper for common insert pattern)
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
    -- Get current user
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Auto-calculate effective price if not provided
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
    
    -- Insert the usage record
    INSERT INTO public.pemakaian_bahan (
        user_id,
        bahan_baku_id,
        qty_base,
        tanggal,
        harga_efektif,
        source_type,
        source_id,
        keterangan
    ) VALUES (
        auth.uid(),
        p_bahan_baku_id,
        p_qty_base,
        p_tanggal,
        v_effective_price,
        p_source_type,
        p_source_id,
        p_keterangan
    ) RETURNING id INTO v_usage_id;
    
    RETURN v_usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get COGS for a date range (helper for API)
CREATE OR REPLACE FUNCTION public.get_cogs_for_period(
    p_start_date DATE,
    p_end_date DATE,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    tanggal DATE,
    total_hpp NUMERIC,
    usage_count BIGINT,
    bahan_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pb.tanggal,
        SUM(pb.hpp_value) as total_hpp,
        COUNT(*) as usage_count,
        JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'bahan_baku_id', pb.bahan_baku_id,
                'nama', bb.nama,
                'qty_base', pb.qty_base,
                'harga_efektif', pb.harga_efektif,
                'hpp_value', pb.hpp_value
            )
        ) as bahan_breakdown
    FROM public.pemakaian_bahan pb
    JOIN public.bahan_baku bb ON bb.id = pb.bahan_baku_id
    WHERE pb.user_id = p_user_id
        AND pb.tanggal >= p_start_date
        AND pb.tanggal <= p_end_date
    GROUP BY pb.tanggal
    ORDER BY pb.tanggal;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION public.record_material_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cogs_for_period TO authenticated;

-- Initial refresh of materialized view
SELECT public.refresh_pemakaian_daily_mv();

-- Verification queries
SELECT 
    'pemakaian_bahan table created successfully' as status,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'pemakaian_bahan' AND table_schema = 'public';

SELECT 
    'Indexes created' as status,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE tablename = 'pemakaian_bahan' AND schemaname = 'public';

SELECT 
    'RLS policies created' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'pemakaian_bahan' AND schemaname = 'public';

-- Show the final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    is_generated
FROM information_schema.columns 
WHERE table_name = 'pemakaian_bahan' AND table_schema = 'public'
ORDER BY ordinal_position;