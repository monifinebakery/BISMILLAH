-- Enhanced Profit Analysis Table Migration
-- =========================================
-- This migration enhances the profit_analysis table to support the improved dashboard

-- 1. Add new columns for enhanced analysis
ALTER TABLE public.profit_analysis 
ADD COLUMN IF NOT EXISTS data_quality_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS health_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS health_status text CHECK (health_status IN ('excellent', 'good', 'warning', 'critical')),
ADD COLUMN IF NOT EXISTS issues jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS recommendations jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS cogs_method text CHECK (cogs_method IN ('wac', 'transaction', 'estimated')),
ADD COLUMN IF NOT EXISTS revenue_growth numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS break_even_point numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_per_day numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_per_transaction numeric DEFAULT 0;

-- 2. Create enhanced profit calculation function
CREATE OR REPLACE FUNCTION public.calculate_enhanced_profit(
    p_user_id uuid,
    p_period text,
    p_period_type text DEFAULT 'monthly'
) RETURNS TABLE (
    period text,
    total_revenue numeric,
    total_cogs numeric,
    total_opex numeric,
    gross_profit numeric,
    net_profit numeric,
    health_score numeric,
    health_status text,
    cogs_method text,
    data_quality_score numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date date;
    v_end_date date;
    v_revenue numeric := 0;
    v_cogs numeric := 0;
    v_cogs_wac numeric := 0;
    v_cogs_transaction numeric := 0;
    v_opex numeric := 0;
    v_gross_profit numeric;
    v_net_profit numeric;
    v_gross_margin numeric;
    v_net_margin numeric;
    v_health_score numeric := 100;
    v_health_status text;
    v_cogs_method text;
    v_data_quality numeric := 100;
    v_revenue_breakdown jsonb;
    v_issues jsonb := '[]'::jsonb;
    v_recommendations jsonb := '[]'::jsonb;
    v_prev_revenue numeric := 0;
    v_revenue_growth numeric := 0;
BEGIN
    -- Parse period to get date range
    IF p_period_type = 'monthly' THEN
        v_start_date := to_date(p_period || '-01', 'YYYY-MM-DD');
        v_end_date := (v_start_date + interval '1 month' - interval '1 day')::date;
    ELSIF p_period_type = 'daily' THEN
        v_start_date := to_date(p_period, 'YYYY-MM-DD');
        v_end_date := v_start_date;
    ELSE
        RAISE EXCEPTION 'Unsupported period type: %', p_period_type;
    END IF;

    -- Calculate Revenue
    SELECT COALESCE(SUM(amount), 0)
    INTO v_revenue
    FROM public.financial_transactions
    WHERE user_id = p_user_id 
        AND type = 'income'
        AND date::date BETWEEN v_start_date AND v_end_date;

    -- Calculate COGS using WAC method (preferred)
    SELECT COALESCE(SUM(pb.hpp_value), 0)
    INTO v_cogs_wac
    FROM public.pemakaian_bahan pb
    WHERE pb.user_id = p_user_id
        AND pb.tanggal::date BETWEEN v_start_date AND v_end_date;

    -- Calculate COGS using transaction method (fallback)
    SELECT COALESCE(SUM(p.total_nilai), 0)
    INTO v_cogs_transaction
    FROM public.purchases p
    WHERE p.user_id = p_user_id
        AND p.tanggal BETWEEN v_start_date AND v_end_date
        AND p.status = 'completed';

    -- Determine which COGS to use
    IF v_cogs_wac > 0 THEN
        v_cogs := v_cogs_wac;
        v_cogs_method := 'wac';
    ELSIF v_cogs_transaction > 0 THEN
        v_cogs := v_cogs_transaction;
        v_cogs_method := 'transaction';
        v_data_quality := v_data_quality - 10;
    ELSE
        -- Estimate COGS at 35% of revenue (F&B industry standard)
        v_cogs := v_revenue * 0.35;
        v_cogs_method := 'estimated';
        v_data_quality := v_data_quality - 20;
    END IF;

    -- Calculate OpEx
    SELECT COALESCE(SUM(jumlah_per_bulan), 0)
    INTO v_opex
    FROM public.operational_costs
    WHERE user_id = p_user_id AND status = 'aktif';

    -- If monthly opex, prorate for daily
    IF p_period_type = 'daily' THEN
        v_opex := v_opex / 30;
    END IF;

    -- Calculate profits
    v_gross_profit := v_revenue - v_cogs;
    v_net_profit := v_gross_profit - v_opex;
    
    -- Calculate margins
    v_gross_margin := CASE WHEN v_revenue > 0 THEN (v_gross_profit / v_revenue) * 100 ELSE 0 END;
    v_net_margin := CASE WHEN v_revenue > 0 THEN (v_net_profit / v_revenue) * 100 ELSE 0 END;

    -- Calculate revenue growth (vs previous period)
    IF p_period_type = 'monthly' THEN
        SELECT COALESCE(SUM(amount), 0)
        INTO v_prev_revenue
        FROM public.financial_transactions
        WHERE user_id = p_user_id 
            AND type = 'income'
            AND date::date BETWEEN (v_start_date - interval '1 month')::date 
            AND (v_start_date - interval '1 day')::date;
        
        IF v_prev_revenue > 0 THEN
            v_revenue_growth := ((v_revenue - v_prev_revenue) / v_prev_revenue) * 100;
        END IF;
    END IF;

    -- Health Score Calculation
    -- Check gross margin (target: 60-70% for F&B)
    IF v_gross_margin < 50 THEN
        v_health_score := v_health_score - 20;
        v_issues := v_issues || jsonb_build_array('Margin kotor terlalu rendah');
        v_recommendations := v_recommendations || jsonb_build_array('Evaluasi harga jual atau negosiasi ulang dengan supplier');
    ELSIF v_gross_margin < 60 THEN
        v_health_score := v_health_score - 10;
        v_issues := v_issues || jsonb_build_array('Margin kotor perlu ditingkatkan');
        v_recommendations := v_recommendations || jsonb_build_array('Optimasi porsi atau cari supplier alternatif');
    END IF;

    -- Check net margin (target: 15-20% for F&B)
    IF v_net_margin < 5 THEN
        v_health_score := v_health_score - 25;
        v_issues := v_issues || jsonb_build_array('Margin bersih sangat rendah');
        v_recommendations := v_recommendations || jsonb_build_array('Perlu evaluasi menyeluruh struktur biaya');
    ELSIF v_net_margin < 10 THEN
        v_health_score := v_health_score - 15;
        v_issues := v_issues || jsonb_build_array('Margin bersih belum optimal');
        v_recommendations := v_recommendations || jsonb_build_array('Kurangi biaya operasional yang tidak perlu');
    END IF;

    -- Check COGS efficiency
    IF v_revenue > 0 AND (v_cogs / v_revenue) > 0.5 THEN
        v_health_score := v_health_score - 15;
        v_issues := v_issues || jsonb_build_array('Efisiensi bahan baku rendah');
        v_recommendations := v_recommendations || jsonb_build_array('Kontrol porsi dan kurangi waste');
    END IF;

    -- Check revenue growth
    IF v_revenue_growth < 0 THEN
        v_health_score := v_health_score - 10;
        v_issues := v_issues || jsonb_build_array('Penjualan menurun dibanding periode sebelumnya');
        v_recommendations := v_recommendations || jsonb_build_array('Tingkatkan marketing atau tambah menu baru');
    END IF;

    -- Check data quality
    IF v_revenue = 0 THEN
        v_data_quality := v_data_quality - 40;
        v_issues := v_issues || jsonb_build_array('Data penjualan tidak ditemukan');
    END IF;
    
    IF v_opex = 0 THEN
        v_data_quality := v_data_quality - 30;
        v_issues := v_issues || jsonb_build_array('Data biaya operasional tidak ditemukan');
    END IF;

    -- Determine health status
    v_health_score := GREATEST(0, v_health_score);
    
    IF v_health_score >= 80 THEN
        v_health_status := 'excellent';
    ELSIF v_health_score >= 60 THEN
        v_health_status := 'good';
    ELSIF v_health_score >= 40 THEN
        v_health_status := 'warning';
    ELSE
        v_health_status := 'critical';
    END IF;

    -- Get revenue breakdown
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'category', COALESCE(category, 'Uncategorized'),
                'amount', total,
                'percentage', CASE WHEN v_revenue > 0 THEN (total / v_revenue) * 100 ELSE 0 END,
                'transactions', cnt
            ) ORDER BY total DESC
        ), '[]'::jsonb
    ) INTO v_revenue_breakdown
    FROM (
        SELECT category, SUM(amount) AS total, COUNT(*) AS cnt
        FROM public.financial_transactions
        WHERE user_id = p_user_id 
            AND type = 'income'
            AND date::date BETWEEN v_start_date AND v_end_date
        GROUP BY category
    ) s;

    -- Store results in profit_analysis table
    INSERT INTO public.profit_analysis (
        user_id, period, period_type,
        total_revenue, revenue_breakdown,
        total_cogs, cogs_method,
        total_opex,
        gross_profit, net_profit,
        gross_margin, net_margin,
        health_score, health_status,
        data_quality_score,
        issues, recommendations,
        revenue_growth,
        metadata
    ) VALUES (
        p_user_id, p_period, p_period_type,
        v_revenue, v_revenue_breakdown,
        v_cogs, v_cogs_method,
        v_opex,
        v_gross_profit, v_net_profit,
        v_gross_margin, v_net_margin,
        v_health_score, v_health_status,
        v_data_quality,
        v_issues, v_recommendations,
        v_revenue_growth,
        jsonb_build_object(
            'calculation_method', 'enhanced',
            'cogs_wac', v_cogs_wac,
            'cogs_transaction', v_cogs_transaction,
            'start_date', v_start_date,
            'end_date', v_end_date
        )
    )
    ON CONFLICT (user_id, period, period_type) 
    DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        revenue_breakdown = EXCLUDED.revenue_breakdown,
        total_cogs = EXCLUDED.total_cogs,
        cogs_method = EXCLUDED.cogs_method,
        total_opex = EXCLUDED.total_opex,
        gross_profit = EXCLUDED.gross_profit,
        net_profit = EXCLUDED.net_profit,
        gross_margin = EXCLUDED.gross_margin,
        net_margin = EXCLUDED.net_margin,
        health_score = EXCLUDED.health_score,
        health_status = EXCLUDED.health_status,
        data_quality_score = EXCLUDED.data_quality_score,
        issues = EXCLUDED.issues,
        recommendations = EXCLUDED.recommendations,
        revenue_growth = EXCLUDED.revenue_growth,
        metadata = EXCLUDED.metadata,
        updated_at = now();

    -- Return summary
    RETURN QUERY SELECT
        p_period,
        v_revenue,
        v_cogs,
        v_opex,
        v_gross_profit,
        v_net_profit,
        v_health_score,
        v_health_status,
        v_cogs_method,
        v_data_quality;
END;
$$;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profit_analysis_user_period 
ON public.profit_analysis(user_id, period DESC);

CREATE INDEX IF NOT EXISTS idx_profit_analysis_health 
ON public.profit_analysis(user_id, health_score DESC);

-- 4. Add RLS policies if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profit_analysis' 
        AND policyname = 'Users can view their own profit analysis'
    ) THEN
        CREATE POLICY "Users can view their own profit analysis" 
        ON public.profit_analysis 
        FOR SELECT 
        TO authenticated 
        USING (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profit_analysis' 
        AND policyname = 'Users can insert their own profit analysis'
    ) THEN
        CREATE POLICY "Users can insert their own profit analysis" 
        ON public.profit_analysis 
        FOR INSERT 
        TO authenticated 
        WITH CHECK (user_id = auth.uid());
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profit_analysis' 
        AND policyname = 'Users can update their own profit analysis'
    ) THEN
        CREATE POLICY "Users can update their own profit analysis" 
        ON public.profit_analysis 
        FOR UPDATE 
        TO authenticated 
        USING (user_id = auth.uid());
    END IF;
END $$;

-- 5. Grant permissions
GRANT ALL ON public.profit_analysis TO authenticated;
GRANT ALL ON FUNCTION public.calculate_enhanced_profit TO authenticated;

-- 6. Add comment
COMMENT ON FUNCTION public.calculate_enhanced_profit IS 'Enhanced profit calculation with health scoring and data quality monitoring for improved dashboard';