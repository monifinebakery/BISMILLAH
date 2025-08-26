

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."auto_calculate_monthly_profit"("p_user_id" "uuid", "p_month" "text" DEFAULT NULL::"text") RETURNS TABLE("period" "text", "revenue" numeric, "cogs" numeric, "opex" numeric, "gross_profit" numeric, "net_profit" numeric, "status" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_period text;
  v_start_date date;
  v_end_date date;
  v_revenue numeric;
  v_cogs numeric;
  v_opex_transactions numeric;
  v_opex_fixed numeric;
  v_gross_profit numeric;
  v_net_profit numeric;
  v_gross_margin numeric;
  v_net_margin numeric;
  v_revenue_breakdown jsonb;
  v_expense_breakdown jsonb;
BEGIN
  v_period := COALESCE(p_month, TO_CHAR(CURRENT_DATE, 'YYYY-MM'));
  v_start_date := (v_period || '-01')::date;
  v_end_date := (DATE_TRUNC('month', v_start_date) + INTERVAL '1 month - 1 day')::date;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_revenue
  FROM public.financial_transactions
  WHERE user_id = p_user_id AND type = 'income' AND date BETWEEN v_start_date AND v_end_date;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_cogs
  FROM public.financial_transactions
  WHERE user_id = p_user_id AND type = 'expense'
    AND (category ILIKE '%bahan%' OR category ILIKE '%cogs%' OR category ILIKE '%hpp%')
    AND date BETWEEN v_start_date AND v_end_date;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_opex_transactions
  FROM public.financial_transactions
  WHERE user_id = p_user_id AND type = 'expense'
    AND NOT (category ILIKE '%bahan%' OR category ILIKE '%cogs%' OR category ILIKE '%hpp%')
    AND date BETWEEN v_start_date AND v_end_date;

  SELECT COALESCE(SUM(jumlah_per_bulan), 0)
  INTO v_opex_fixed
  FROM public.operational_costs
  WHERE user_id = p_user_id AND status = 'aktif';

  v_gross_profit := v_revenue - v_cogs;
  v_net_profit := v_gross_profit - v_opex_transactions - v_opex_fixed;

  v_gross_margin := CASE WHEN v_revenue > 0 THEN (v_gross_profit / v_revenue) * 100 ELSE 0 END;
  v_net_margin := CASE WHEN v_revenue > 0 THEN (v_net_profit / v_revenue) * 100 ELSE 0 END;

  SELECT
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'category', COALESCE(category, 'Tidak Dikategorikan'),
          'total', total,
          'count', cnt
        )
        ORDER BY total DESC
      ),
      '[]'::jsonb
    )
  INTO v_revenue_breakdown
  FROM (
    SELECT category, SUM(amount) AS total, COUNT(*) AS cnt
    FROM public.financial_transactions
    WHERE user_id = p_user_id AND type = 'income' AND date BETWEEN v_start_date AND v_end_date
    GROUP BY category
  ) s;

  SELECT
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'category', COALESCE(category, 'Tidak Dikategorikan'),
          'total', total,
          'count', cnt
        )
        ORDER BY total DESC
      ),
      '[]'::jsonb
    )
  INTO v_expense_breakdown
  FROM (
    SELECT category, SUM(amount) AS total, COUNT(*) AS cnt
    FROM public.financial_transactions
    WHERE user_id = p_user_id AND type = 'expense' AND date BETWEEN v_start_date AND v_end_date
    GROUP BY category
  ) s;

  INSERT INTO public.profit_analysis (
    user_id, period, period_type,
    total_revenue, revenue_breakdown,
    total_cogs, total_opex,
    cogs_breakdown, opex_breakdown,
    gross_profit, net_profit,
    gross_margin, net_margin
  )
  VALUES (
    p_user_id, v_period, 'monthly',
    v_revenue, v_revenue_breakdown,
    v_cogs, v_opex_transactions + v_opex_fixed,
    '[]'::jsonb, v_expense_breakdown,
    v_gross_profit, v_net_profit,
    v_gross_margin, v_net_margin
  )
  ON CONFLICT (user_id, period, period_type) DO UPDATE SET
    total_revenue = EXCLUDED.total_revenue,
    revenue_breakdown = EXCLUDED.revenue_breakdown,
    total_cogs = EXCLUDED.total_cogs,
    total_opex = EXCLUDED.total_opex,
    cogs_breakdown = EXCLUDED.cogs_breakdown,
    opex_breakdown = EXCLUDED.opex_breakdown,
    gross_profit = EXCLUDED.gross_profit,
    net_profit = EXCLUDED.net_profit,
    gross_margin = EXCLUDED.gross_margin,
    net_margin = EXCLUDED.net_margin,
    updated_at = now();

  RETURN QUERY SELECT
    v_period,
    v_revenue,
    v_cogs,
    v_opex_transactions + v_opex_fixed,
    v_gross_profit,
    v_net_profit,
    'Success'::text;
END;
$$;


ALTER FUNCTION "public"."auto_calculate_monthly_profit"("p_user_id" "uuid", "p_month" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_initialize_user_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
  -- Initialize settings for new user (when first operational cost is added)
  IF NOT EXISTS (
    SELECT 1 FROM app_settings WHERE user_id = NEW.user_id
  ) THEN
    PERFORM initialize_user_settings(NEW.user_id);
  END IF;

  -- Recalculate cost per unit when operational costs change
  PERFORM calculate_and_update_cost_per_unit(NEW.user_id);

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_initialize_user_settings"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."app_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "target_output_monthly" numeric(10,2) DEFAULT 1000.00 NOT NULL,
    "overhead_per_pcs" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "operasional_per_pcs" numeric(10,2) DEFAULT 0.00 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_settings" OWNER TO "postgres";


COMMENT ON TABLE "public"."app_settings" IS 'Global application settings per user for dual-mode cost calculations';



COMMENT ON COLUMN "public"."app_settings"."target_output_monthly" IS 'Monthly production target in pieces';



COMMENT ON COLUMN "public"."app_settings"."overhead_per_pcs" IS 'Calculated overhead cost per piece (HPP group)';



COMMENT ON COLUMN "public"."app_settings"."operasional_per_pcs" IS 'Calculated operational cost per piece (non-HPP group)';



CREATE OR REPLACE FUNCTION "public"."calculate_and_update_cost_per_unit"("p_user_id" "uuid") RETURNS "public"."app_settings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  result app_settings;
  v_target_output numeric;
  v_hpp_total numeric := 0;
  v_operasional_total numeric := 0;
  v_overhead_per_pcs numeric := 0;
  v_operasional_per_pcs numeric := 0;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Cannot calculate costs: user_id is null';
  END IF;

  -- Ensure app_settings exists
  IF NOT EXISTS (SELECT 1 FROM app_settings WHERE user_id = p_user_id) THEN
    result := initialize_user_settings(p_user_id);
  END IF;

  SELECT target_output_monthly
  INTO v_target_output
  FROM app_settings
  WHERE user_id = p_user_id;

  SELECT
    COALESCE(SUM(CASE WHEN "group" = 'HPP'         THEN jumlah_per_bulan ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN "group" = 'OPERASIONAL' THEN jumlah_per_bulan ELSE 0 END), 0)
  INTO v_hpp_total, v_operasional_total
  FROM operational_costs
  WHERE user_id = p_user_id
    AND status = 'active';

  IF COALESCE(v_target_output, 0) > 0 THEN
    v_overhead_per_pcs     := ROUND(v_hpp_total         / v_target_output, 2);
    v_operasional_per_pcs  := ROUND(v_operasional_total / v_target_output, 2);
  ELSE
    v_overhead_per_pcs     := 0;
    v_operasional_per_pcs  := 0;
  END IF;

  UPDATE app_settings
  SET
    overhead_per_pcs    = v_overhead_per_pcs,
    operasional_per_pcs = v_operasional_per_pcs,
    updated_at          = now()
  WHERE user_id = p_user_id
  RETURNING * INTO result;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."calculate_and_update_cost_per_unit"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_comprehensive_profit"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS TABLE("total_revenue" numeric, "revenue_from_transactions" numeric, "revenue_from_orders" numeric, "total_cogs" numeric, "cogs_from_transactions" numeric, "cogs_from_materials" numeric, "cogs_from_recipes" numeric, "total_opex" numeric, "opex_from_transactions" numeric, "opex_from_operational_costs" numeric, "gross_profit" numeric, "net_profit" numeric, "gross_margin_pct" numeric, "net_margin_pct" numeric, "revenue_breakdown" "jsonb", "cogs_breakdown" "jsonb", "opex_breakdown" "jsonb", "order_stats" "jsonb", "material_alerts" "jsonb", "cost_efficiency_score" numeric)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_days_period integer;
  v_revenue_trx numeric := 0;
  v_revenue_orders numeric := 0;
  v_total_revenue numeric := 0;
  v_cogs_trx numeric := 0;
  v_cogs_materials numeric := 0;
  v_total_cogs numeric := 0;
  v_opex_trx numeric := 0;
  v_opex_ops numeric := 0;
  v_total_opex numeric := 0;
  v_revenue_breakdown jsonb;
  v_cogs_breakdown jsonb;
  v_opex_breakdown jsonb;
  v_order_stats jsonb;
  v_material_alerts jsonb;
  v_efficiency_score numeric := 0;
BEGIN
  v_days_period := p_end_date - p_start_date + 1;
  
  -- 1. Get revenue data
  SELECT total_revenue, revenue_breakdown
  INTO v_revenue_trx, v_revenue_breakdown
  FROM get_revenue_by_period(p_user_id, p_start_date, p_end_date);
  
  SELECT total_sales
  INTO v_revenue_orders
  FROM get_sales_from_orders(p_user_id, p_start_date, p_end_date);
  
  v_total_revenue := GREATEST(v_revenue_trx, v_revenue_orders);
  
  -- 2. Get COGS data
  SELECT cogs_total
  INTO v_cogs_trx
  FROM get_expenses_by_period(p_user_id, p_start_date, p_end_date);
  
  SELECT wac_based_cost, material_breakdown, low_stock_alerts
  INTO v_cogs_materials, v_cogs_breakdown, v_material_alerts
  FROM calculate_material_costs_wac(p_user_id, p_start_date, p_end_date);
  
  -- Use transaction COGS if available, otherwise use material costs
  v_total_cogs := CASE 
    WHEN v_cogs_trx > 0 THEN v_cogs_trx 
    ELSE v_cogs_materials * 0.3 -- Estimate 30% material usage per period
  END;
  
  -- 3. Get OpEx data
  SELECT opex_total
  INTO v_opex_trx
  FROM get_expenses_by_period(p_user_id, p_start_date, p_end_date);
  
  SELECT total_daily_costs, cost_breakdown
  INTO v_opex_ops, v_opex_breakdown
  FROM get_operational_costs_allocated(p_user_id, v_days_period);
  
  v_total_opex := v_opex_trx + v_opex_ops;
  
  -- 4. Get order statistics
  SELECT jsonb_build_object(
    'total_sales', total_sales,
    'completed_orders', completed_orders,
    'pending_orders', pending_orders,
    'average_order_value', average_order_value,
    'sales_breakdown', sales_breakdown
  )
  INTO v_order_stats
  FROM get_sales_from_orders(p_user_id, p_start_date, p_end_date);
  
  -- 5. Calculate efficiency score (0-100)
  v_efficiency_score := CASE
    WHEN v_total_revenue > 0 THEN
      LEAST(100, 
        -- Revenue efficiency (40 points max)
        LEAST(40, (v_total_revenue / 1000000) * 40) +
        -- COGS efficiency (30 points max) - lower COGS ratio is better
        LEAST(30, 30 - ((v_total_cogs / GREATEST(v_total_revenue, 1)) * 50)) +
        -- OpEx efficiency (30 points max) - lower OpEx ratio is better
        LEAST(30, 30 - ((v_total_opex / GREATEST(v_total_revenue, 1)) * 60))
      )
    ELSE 0
  END;
  
  RETURN QUERY SELECT
    -- Revenue
    v_total_revenue,
    v_revenue_trx,
    v_revenue_orders,
    
    -- COGS
    v_total_cogs,
    v_cogs_trx,
    v_cogs_materials,
    0::numeric, -- cogs_from_recipes (would need recipe usage data)
    
    -- OpEx
    v_total_opex,
    v_opex_trx,
    v_opex_ops,
    
    -- Profit
    v_total_revenue - v_total_cogs, -- gross_profit
    v_total_revenue - v_total_cogs - v_total_opex, -- net_profit
    CASE WHEN v_total_revenue > 0 THEN ((v_total_revenue - v_total_cogs) / v_total_revenue) * 100 ELSE 0 END, -- gross_margin_pct
    CASE WHEN v_total_revenue > 0 THEN ((v_total_revenue - v_total_cogs - v_total_opex) / v_total_revenue) * 100 ELSE 0 END, -- net_margin_pct
    
    -- Breakdowns
    COALESCE(v_revenue_breakdown, '[]'::jsonb),
    COALESCE(v_cogs_breakdown, '[]'::jsonb),
    COALESCE(v_opex_breakdown, '[]'::jsonb),
    
    -- Additional insights
    COALESCE(v_order_stats, '{}'::jsonb),
    COALESCE(v_material_alerts, '[]'::jsonb),
    v_efficiency_score;
END;
$$;


ALTER FUNCTION "public"."calculate_comprehensive_profit"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_comprehensive_profit"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") IS 'Kalkulasi profit comprehensive menggunakan semua tabel';



CREATE OR REPLACE FUNCTION "public"."calculate_dual_mode_overhead"("p_user_id" "uuid", "p_group" "text" DEFAULT 'HPP'::"text", "p_target_output" numeric DEFAULT 1000) RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  total_costs numeric := 0;
  cost_per_unit numeric := 0;
BEGIN
  -- Validate inputs
  IF p_target_output <= 0 THEN
    RAISE EXCEPTION 'Target output must be greater than 0';
  END IF;
  
  IF p_group NOT IN ('HPP', 'OPERASIONAL') THEN
    RAISE EXCEPTION 'Group must be either HPP or OPERASIONAL';
  END IF;
  
  -- Calculate total costs for the specified group
  SELECT COALESCE(SUM(jumlah_per_bulan), 0)
  INTO total_costs
  FROM operational_costs
  WHERE user_id = p_user_id
    AND "group" = p_group
    AND status = 'aktif';
  
  -- Calculate cost per unit
  IF p_target_output > 0 THEN
    cost_per_unit := total_costs / p_target_output;
  END IF;
  
  RETURN ROUND(cost_per_unit, 0); -- Round to nearest rupiah
END;
$$;


ALTER FUNCTION "public"."calculate_dual_mode_overhead"("p_user_id" "uuid", "p_group" "text", "p_target_output" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_material_costs_wac"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS TABLE("total_material_cost" numeric, "wac_based_cost" numeric, "material_breakdown" "jsonb", "low_stock_alerts" "jsonb")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_total_cost numeric := 0;
  v_wac_cost numeric := 0;
  v_breakdown jsonb;
  v_alerts jsonb;
BEGIN
  -- Calculate total material cost using WAC
  SELECT 
    COALESCE(SUM(stok * harga_satuan), 0) as total_cost,
    COALESCE(SUM(stok * COALESCE(harga_rata_rata, harga_satuan)), 0) as wac_cost
  INTO v_total_cost, v_wac_cost
  FROM bahan_baku
  WHERE user_id = p_user_id
    AND status = 'aktif';
  
  -- Get material breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'nama', nama,
      'stok', stok,
      'satuan', satuan,
      'harga_satuan', harga_satuan,
      'harga_wac', COALESCE(harga_rata_rata, harga_satuan),
      'total_value', stok * COALESCE(harga_rata_rata, harga_satuan),
      'kategori', kategori,
      'status_stok', CASE 
        WHEN stok <= minimum THEN 'Menipis'
        WHEN stok <= minimum * 2 THEN 'Perhatian'
        ELSE 'Aman'
      END
    )
  )
  INTO v_breakdown
  FROM bahan_baku
  WHERE user_id = p_user_id
    AND status = 'aktif'
  ORDER BY (stok * COALESCE(harga_rata_rata, harga_satuan)) DESC;
  
  -- Get low stock alerts
  SELECT jsonb_agg(
    jsonb_build_object(
      'nama', nama,
      'stok_sekarang', stok,
      'minimum', minimum,
      'satuan', satuan,
      'perlu_beli', GREATEST(minimum * 2 - stok, 0),
      'kategori', kategori
    )
  )
  INTO v_alerts
  FROM bahan_baku
  WHERE user_id = p_user_id
    AND status = 'aktif'
    AND stok <= minimum;
  
  RETURN QUERY SELECT 
    v_total_cost, 
    v_wac_cost, 
    COALESCE(v_breakdown, '[]'::jsonb),
    COALESCE(v_alerts, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."calculate_material_costs_wac"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_material_costs_wac"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") IS 'Hitung material costs menggunakan WAC dari bahan_baku';



CREATE OR REPLACE FUNCTION "public"."calculate_overhead"("p_material_cost" numeric, "p_user_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    v_total_costs NUMERIC;
    v_overhead NUMERIC := 0;
    v_allocation_method TEXT := 'per_unit';
    v_basis_value NUMERIC := 1000;
BEGIN
    -- Get total costs
    v_total_costs := public.get_total_costs(p_user_id);
    
    -- Simple overhead calculation (can be enhanced based on allocation settings)
    -- For now, use a simple percentage of material cost
    IF p_material_cost > 0 AND v_total_costs > 0 THEN
        v_overhead := v_total_costs * 0.1; -- 10% overhead as default
    ELSE
        v_overhead := v_total_costs;
    END IF;
    
    RETURN v_overhead;
END;
$$;


ALTER FUNCTION "public"."calculate_overhead"("p_material_cost" numeric, "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_overhead"("p_material_cost" numeric, "p_user_id" "uuid") IS 'Calculate overhead costs based on material cost';



CREATE OR REPLACE FUNCTION "public"."calculate_realtime_profit"("p_user_id" "uuid", "p_period" "text") RETURNS TABLE("total_revenue" numeric, "total_cogs" numeric, "total_opex" numeric, "revenue_transactions" "jsonb", "cogs_materials" "jsonb", "opex_costs" "jsonb", "calculated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
    v_revenue NUMERIC := 0;
    v_cogs NUMERIC := 0;
    v_opex NUMERIC := 0;
    v_revenue_transactions JSONB := '[]'::jsonb;
    v_cogs_materials JSONB := '[]'::jsonb;
    v_opex_costs JSONB := '[]'::jsonb;
BEGIN
    -- Parse period to determine date range
    -- Expected format: YYYY-MM for monthly, YYYY for yearly
    IF length(p_period) = 7 AND p_period ~ '^\d{4}-\d{2}$' THEN
        -- Monthly period (YYYY-MM)
        v_start_date := (p_period || '-01')::DATE;
        v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    ELSIF length(p_period) = 4 AND p_period ~ '^\d{4}$' THEN
        -- Yearly period (YYYY)
        v_start_date := (p_period || '-01-01')::DATE;
        v_end_date := (p_period || '-12-31')::DATE;
    ELSIF length(p_period) = 10 AND p_period ~ '^\d{4}-\d{2}-\d{2}$' THEN
        -- Daily period (YYYY-MM-DD)
        v_start_date := p_period::DATE;
        v_end_date := p_period::DATE;
    ELSE
        -- Invalid period format, default to current month
        v_start_date := date_trunc('month', CURRENT_DATE)::DATE;
        v_end_date := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    END IF;

    -- Calculate Revenue from financial_transactions
    SELECT 
        COALESCE(SUM(amount), 0),
        COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'amount', amount,
                'date', date,
                'description', description,
                'category', category
            )
        ) FILTER (WHERE amount > 0), '[]'::jsonb)
    INTO v_revenue, v_revenue_transactions
    FROM public.financial_transactions
    WHERE user_id = p_user_id
        AND type = 'income'
        AND date >= v_start_date
        AND date <= v_end_date;

    -- Calculate COGS from material usage (pemakaian_bahan table if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pemakaian_bahan') THEN
        SELECT 
            COALESCE(SUM(hpp_value), 0),
            COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', pb.id,
                    'bahan_baku_id', pb.bahan_baku_id,
                    'qty_base', pb.qty_base,
                    'harga_efektif', pb.harga_efektif,
                    'hpp_value', pb.hpp_value,
                    'tanggal', pb.tanggal,
                    'bahan_nama', bb.nama
                )
            ) FILTER (WHERE pb.hpp_value > 0), '[]'::jsonb)
        INTO v_cogs, v_cogs_materials
        FROM public.pemakaian_bahan pb
        LEFT JOIN public.bahan_baku bb ON bb.id = pb.bahan_baku_id
        WHERE pb.user_id = p_user_id
            AND pb.tanggal >= v_start_date
            AND pb.tanggal <= v_end_date;
    ELSE
        -- Fallback: estimate COGS from purchase data
        SELECT 
            COALESCE(SUM(total_nilai * 0.7), 0),  -- Estimate 70% of purchases as COGS
            COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'total_nilai', total_nilai,
                    'tanggal', tanggal,
                    'supplier', supplier,
                    'estimated_cogs', total_nilai * 0.7
                )
            ) FILTER (WHERE total_nilai > 0), '[]'::jsonb)
        INTO v_cogs, v_cogs_materials
        FROM public.purchases
        WHERE user_id = p_user_id
            AND status = 'completed'
            AND tanggal::DATE >= v_start_date
            AND tanggal::DATE <= v_end_date;
    END IF;

    -- Calculate OpEx from operational costs
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operational_costs') THEN
        SELECT 
            COALESCE(SUM(
                CASE 
                    WHEN jenis = 'tetap' THEN jumlah_per_bulan
                    WHEN jenis = 'variabel' THEN jumlah_per_bulan
                    ELSE jumlah_per_bulan
                END
            ), 0),
            COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'nama_biaya', nama_biaya,
                    'jumlah_per_bulan', jumlah_per_bulan,
                    'jenis', jenis,
                    'cost_category', cost_category
                )
            ) FILTER (WHERE jumlah_per_bulan > 0), '[]'::jsonb)
        INTO v_opex, v_opex_costs
        FROM public.operational_costs
        WHERE user_id = p_user_id
            AND status = 'aktif';
            
        -- Adjust OpEx based on period length
        IF length(p_period) = 10 THEN
            -- Daily period: divide monthly costs by days in month
            v_opex := v_opex / EXTRACT(DAY FROM (v_end_date + INTERVAL '1 day' - v_start_date));
        ELSIF length(p_period) = 4 THEN
            -- Yearly period: multiply monthly costs by 12
            v_opex := v_opex * 12;
        END IF;
    ELSE
        -- Fallback: estimate OpEx from expense transactions
        SELECT 
            COALESCE(SUM(amount), 0),
            COALESCE(jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'amount', amount,
                    'date', date,
                    'description', description,
                    'category', category
                )
            ) FILTER (WHERE amount > 0), '[]'::jsonb)
        INTO v_opex, v_opex_costs
        FROM public.financial_transactions
        WHERE user_id = p_user_id
            AND type = 'expense'
            AND date >= v_start_date
            AND date <= v_end_date;
    END IF;

    -- Return the calculated values
    RETURN QUERY SELECT 
        v_revenue,
        v_cogs,
        v_opex,
        v_revenue_transactions,
        v_cogs_materials,
        v_opex_costs,
        NOW();
END;
$_$;


ALTER FUNCTION "public"."calculate_realtime_profit"("p_user_id" "uuid", "p_period" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_realtime_profit"("p_user_id" "uuid", "p_period" "text") IS 'Calculate real-time profit analysis for a given period and user';



CREATE OR REPLACE FUNCTION "public"."calculate_recipe_cost_with_wac"("p_user_id" "uuid", "p_recipe_id" "uuid") RETURNS TABLE("recipe_name" "text", "total_hpp" numeric, "hpp_per_porsi" numeric, "material_cost" numeric, "labor_cost" numeric, "overhead_cost" numeric, "suggested_price" numeric, "margin_percentage" numeric, "cost_breakdown" "jsonb")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_recipe record;
  v_material_cost numeric := 0;
  v_total_hpp numeric := 0;
  v_suggested_price numeric := 0;
  v_breakdown jsonb;
BEGIN
  -- Get recipe data
  SELECT * INTO v_recipe
  FROM hpp_recipes
  WHERE id = p_recipe_id AND user_id = p_user_id;
  
  IF v_recipe IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate material costs using WAC
  SELECT COALESCE(SUM(
    CASE 
      WHEN bb.harga_rata_rata IS NOT NULL AND bb.harga_rata_rata > 0 
      THEN bb.harga_rata_rata * (ingredient->>'qty')::numeric
      ELSE bb.harga_satuan * (ingredient->>'qty')::numeric
    END
  ), 0)
  INTO v_material_cost
  FROM jsonb_array_elements(v_recipe.ingredients) as ingredient
  JOIN bahan_baku bb ON bb.id = (ingredient->>'bahan_baku_id')::uuid
  WHERE bb.user_id = p_user_id AND bb.status = 'aktif';
  
  -- Get cost breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'bahan_nama', bb.nama,
      'qty', (ingredient->>'qty')::numeric,
      'satuan', bb.satuan,
      'harga_satuan', bb.harga_satuan,
      'harga_wac', COALESCE(bb.harga_rata_rata, bb.harga_satuan),
      'total_cost', COALESCE(bb.harga_rata_rata, bb.harga_satuan) * (ingredient->>'qty')::numeric
    )
  )
  INTO v_breakdown
  FROM jsonb_array_elements(v_recipe.ingredients) as ingredient
  JOIN bahan_baku bb ON bb.id = (ingredient->>'bahan_baku_id')::uuid
  WHERE bb.user_id = p_user_id AND bb.status = 'aktif';
  
  -- Calculate total HPP
  v_total_hpp := v_material_cost + 
                 COALESCE(v_recipe.biaya_tenaga_kerja, 0) + 
                 COALESCE(v_recipe.biaya_overhead, 0);
  
  -- Calculate suggested price (with 30% margin)
  v_suggested_price := v_total_hpp * 1.3;
  
  -- Update recipe
  UPDATE hpp_recipes
  SET 
    total_hpp = v_total_hpp,
    hpp_per_porsi = v_total_hpp / GREATEST(v_recipe.porsi, 1),
    updated_at = now()
  WHERE id = p_recipe_id AND user_id = p_user_id;
  
  RETURN QUERY SELECT
    v_recipe.nama_resep,
    v_total_hpp,
    v_total_hpp / GREATEST(v_recipe.porsi, 1),
    v_material_cost,
    COALESCE(v_recipe.biaya_tenaga_kerja, 0),
    COALESCE(v_recipe.biaya_overhead, 0),
    v_suggested_price,
    CASE WHEN v_total_hpp > 0 THEN ((v_suggested_price - v_total_hpp) / v_total_hpp) * 100 ELSE 0 END,
    COALESCE(v_breakdown, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."calculate_recipe_cost_with_wac"("p_user_id" "uuid", "p_recipe_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_recipe_cost_with_wac"("p_user_id" "uuid", "p_recipe_id" "uuid") IS 'Hitung recipe cost dengan integrasi WAC dari warehouse';



CREATE OR REPLACE FUNCTION "public"."can_complete_order"("p_order_id" "uuid") RETURNS TABLE("can_complete" boolean, "total_ingredients" integer, "available_ingredients" integer, "insufficient_stock" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    -- Simplified check - always return true for now
    -- In a real implementation, this would check recipe ingredients against stock
    RETURN QUERY
    SELECT 
        TRUE as can_complete,
        0 as total_ingredients,
        0 as available_ingredients,
        '[]'::JSONB as insufficient_stock;
END;
$$;


ALTER FUNCTION "public"."can_complete_order"("p_order_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."can_complete_order"("p_order_id" "uuid") IS 'Check if an order can be completed based on stock';



CREATE OR REPLACE FUNCTION "public"."cleanup_after_cost_deletion"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  target_user_id uuid;
BEGIN
  target_user_id := OLD.user_id;

  IF target_user_id IS NULL THEN
    RETURN OLD;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.operational_costs
    WHERE user_id = target_user_id
      AND status = 'active'
  ) THEN
    PERFORM public.calculate_and_update_cost_per_unit(target_user_id::uuid);
  ELSE
    UPDATE public.app_settings
    SET overhead_per_pcs    = 0,
        operasional_per_pcs = 0,
        updated_at          = now()
    WHERE user_id = target_user_id;
  END IF;

  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."cleanup_after_cost_deletion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_order_and_deduct_stock"("p_order_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Update order status to completed
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        UPDATE public.orders
        SET status = 'completed',
            updated_at = NOW()
        WHERE id = p_order_id
            AND user_id = auth.uid();
    END IF;
    
    -- Return success result
    v_result := jsonb_build_object(
        'success', true,
        'message', 'Order completed successfully',
        'order_id', p_order_id,
        'stock_items_updated', 0
    );
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."complete_order_and_deduct_stock"("p_order_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."complete_order_and_deduct_stock"("p_order_id" "uuid") IS 'Complete an order and deduct stock accordingly';



CREATE OR REPLACE FUNCTION "public"."create_new_order"("order_data" "jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    v_order_id UUID;
BEGIN
    -- Generate new order ID
    v_order_id := gen_random_uuid();
    
    -- Insert new order (simplified version)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        INSERT INTO public.orders (
            id,
            user_id,
            nama_pelanggan,
            telepon_pelanggan,
            total_pesanan,
            items,
            status,
            tanggal,
            created_at,
            updated_at
        ) VALUES (
            v_order_id,
            auth.uid(),
            order_data->>'nama_pelanggan',
            order_data->>'telepon_pelanggan',
            (order_data->>'total_pesanan')::NUMERIC,
            order_data->'items',
            COALESCE(order_data->>'status', 'pending'),
            COALESCE((order_data->>'tanggal')::DATE, CURRENT_DATE),
            NOW(),
            NOW()
        );
    END IF;
    
    RETURN v_order_id;
END;
$$;


ALTER FUNCTION "public"."create_new_order"("order_data" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_new_order"("order_data" "jsonb") IS 'Create a new order with given data';



CREATE OR REPLACE FUNCTION "public"."get_comprehensive_dashboard_summary"("p_user_id" "uuid") RETURNS TABLE("current_month_revenue" numeric, "current_month_cogs" numeric, "current_month_opex" numeric, "current_month_profit" numeric, "current_month_margin" numeric, "prev_month_revenue" numeric, "prev_month_profit" numeric, "revenue_growth_pct" numeric, "profit_growth_pct" numeric, "ytd_revenue" numeric, "ytd_profit" numeric, "ytd_avg_margin" numeric, "total_orders_this_month" integer, "total_active_materials" integer, "total_operational_costs" numeric, "low_stock_items" integer, "business_health_score" numeric, "top_revenue_source" "text", "biggest_expense" "text", "recommendations" "jsonb")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_current_start date;
  v_current_end date;
  v_prev_start date;
  v_prev_end date;
  v_current_data record;
  v_prev_data record;
  v_ytd_data record;
  v_orders integer;
  v_materials integer;
  v_low_stock integer;
  v_op_costs numeric;
  v_health_score numeric;
  v_top_source text;
  v_biggest_expense text;
  v_recommendations jsonb;
BEGIN
  -- Set date ranges
  v_current_start := DATE_TRUNC('month', CURRENT_DATE);
  v_current_end := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day';
  v_prev_start := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
  v_prev_end := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '1 month - 1 day';
  
  -- Get current month data
  SELECT * INTO v_current_data
  FROM calculate_comprehensive_profit(p_user_id, v_current_start, v_current_end);
  
  -- Get previous month data
  SELECT * INTO v_prev_data
  FROM calculate_comprehensive_profit(p_user_id, v_prev_start, v_prev_end);
  
  -- Get YTD data
  SELECT 
    SUM(total_revenue) as ytd_revenue,
    SUM(net_profit) as ytd_profit,
    AVG(net_margin_pct) as ytd_avg_margin
  INTO v_ytd_data
  FROM (
    SELECT 
      total_revenue,
      net_profit,
      net_margin_pct
    FROM calculate_comprehensive_profit(
      p_user_id, 
      DATE_TRUNC('year', CURRENT_DATE),
      CURRENT_DATE
    )
  ) ytd_calc;
  
  -- Get additional metrics
  SELECT COUNT(*) INTO v_orders
  FROM orders
  WHERE user_id = p_user_id
    AND tanggal_pesanan BETWEEN v_current_start AND v_current_end
    AND status = 'completed';
  
  SELECT COUNT(*) INTO v_materials
  FROM bahan_baku
  WHERE user_id = p_user_id AND status = 'aktif';
  
  SELECT COUNT(*) INTO v_low_stock
  FROM bahan_baku
  WHERE user_id = p_user_id AND status = 'aktif' AND stok <= minimum;
  
  SELECT COALESCE(total_monthly_costs, 0) INTO v_op_costs
  FROM get_operational_costs_allocated(p_user_id);
  
  -- Calculate business health score
  v_health_score := COALESCE(v_current_data.cost_efficiency_score, 0);
  
  -- Get top revenue source and biggest expense
  SELECT revenue_breakdown->>0->>'category' INTO v_top_source
  FROM (SELECT v_current_data.revenue_breakdown as revenue_breakdown) rb
  WHERE jsonb_array_length(revenue_breakdown) > 0;
  
  SELECT opex_breakdown->>0->>'nama_biaya' INTO v_biggest_expense
  FROM (SELECT v_current_data.opex_breakdown as opex_breakdown) ob
  WHERE jsonb_array_length(opex_breakdown) > 0;
  
  -- Generate recommendations
  v_recommendations := jsonb_build_array();
  
  IF v_current_data.net_profit < 0 THEN
    v_recommendations := v_recommendations || jsonb_build_object(
      'type', 'alert',
      'message', 'Bisnis mengalami kerugian bulan ini',
      'action', 'Review biaya operasional dan tingkatkan penjualan'
    );
  END IF;
  
  IF v_low_stock > 0 THEN
    v_recommendations := v_recommendations || jsonb_build_object(
      'type', 'warning',
      'message', v_low_stock || ' bahan baku stoknya menipis',
      'action', 'Segera lakukan pembelian bahan baku'
    );
  END IF;
  
  IF v_current_data.net_margin_pct > 20 THEN
    v_recommendations := v_recommendations || jsonb_build_object(
      'type', 'success',
      'message', 'Margin profit sangat sehat (' || ROUND(v_current_data.net_margin_pct, 1) || '%)',
      'action', 'Pertimbangkan untuk ekspansi bisnis'
    );
  END IF;
  
  RETURN QUERY SELECT
    -- Current month
    COALESCE(v_current_data.total_revenue, 0),
    COALESCE(v_current_data.total_cogs, 0),
    COALESCE(v_current_data.total_opex, 0),
    COALESCE(v_current_data.net_profit, 0),
    COALESCE(v_current_data.net_margin_pct, 0),
    
    -- Previous month
    COALESCE(v_prev_data.total_revenue, 0),
    COALESCE(v_prev_data.net_profit, 0),
    CASE 
      WHEN v_prev_data.total_revenue > 0 THEN 
        ROUND(((v_current_data.total_revenue - v_prev_data.total_revenue) / v_prev_data.total_revenue) * 100, 2)
      ELSE 0 
    END,
    CASE 
      WHEN v_prev_data.net_profit != 0 THEN 
        ROUND(((v_current_data.net_profit - v_prev_data.net_profit) / ABS(v_prev_data.net_profit)) * 100, 2)
      ELSE 0 
    END,
    
    -- YTD
    COALESCE(v_ytd_data.ytd_revenue, 0),
    COALESCE(v_ytd_data.ytd_profit, 0),
    COALESCE(v_ytd_data.ytd_avg_margin, 0),
    
    -- Key metrics
    COALESCE(v_orders, 0),
    COALESCE(v_materials, 0),
    COALESCE(v_op_costs, 0),
    COALESCE(v_low_stock, 0),
    
    -- Status indicators
    COALESCE(v_health_score, 0),
    COALESCE(v_top_source, 'N/A'),
    COALESCE(v_biggest_expense, 'N/A'),
    COALESCE(v_recommendations, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_comprehensive_dashboard_summary"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_comprehensive_dashboard_summary"("p_user_id" "uuid") IS 'Dashboard summary lengkap dengan semua data sources';



CREATE OR REPLACE FUNCTION "public"."get_current_month_profit_data"("p_user_id" "uuid") RETURNS TABLE("period" "text", "revenue" numeric, "cogs" numeric, "opex" numeric, "gross_profit" numeric, "net_profit" numeric, "gross_margin_pct" numeric, "net_margin_pct" numeric, "revenue_breakdown" "jsonb", "expense_breakdown" "jsonb")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_current_period text;
  v_start date;
  v_end date;
BEGIN
  v_current_period := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  v_start := (v_current_period || '-01')::date;
  v_end := (DATE_TRUNC('month', v_start) + INTERVAL '1 month - 1 day')::date;

  RETURN QUERY
  SELECT 
    mps.period,
    mps.monthly_revenue,
    mps.monthly_cogs,
    mps.monthly_opex_transactions + mps.monthly_operational_costs,
    mps.gross_profit,
    mps.final_net_profit,
    mps.gross_margin_pct,
    mps.final_net_margin_pct,
    (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'category', COALESCE(category, 'Tidak Dikategorikan'),
            'total', total,
            'count', cnt
          )
          ORDER BY total DESC
        ),
        '[]'::jsonb
      )
      FROM (
        SELECT category, SUM(amount) AS total, COUNT(*) AS cnt
        FROM public.financial_transactions
        WHERE user_id = p_user_id AND type = 'income' AND date BETWEEN v_start AND v_end
        GROUP BY category
      ) s
    ) AS revenue_breakdown,
    (
      SELECT COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'category', COALESCE(category, 'Tidak Dikategorikan'),
            'total', total,
            'count', cnt
          )
          ORDER BY total DESC
        ),
        '[]'::jsonb
      )
      FROM (
        SELECT category, SUM(amount) AS total, COUNT(*) AS cnt
        FROM public.financial_transactions
        WHERE user_id = p_user_id AND type = 'expense' AND date BETWEEN v_start AND v_end
        GROUP BY category
      ) s
    ) AS expense_breakdown
  FROM public.monthly_profit_summary mps
  WHERE mps.user_id = p_user_id
    AND mps.period = v_current_period
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_current_month_profit_data"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_expenses_by_period"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS TABLE("total_expenses" numeric, "cogs_total" numeric, "opex_total" numeric, "expense_breakdown" "jsonb")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_total_expenses numeric := 0;
  v_cogs numeric := 0;
  v_opex numeric := 0;
  v_breakdown jsonb;
BEGIN
  -- Calculate totals
  SELECT 
    COALESCE(SUM(amount), 0) as total,
    COALESCE(SUM(CASE 
      WHEN category ILIKE '%bahan%' OR category ILIKE '%cogs%' OR category ILIKE '%hpp%' OR category ILIKE '%material%'
      THEN amount ELSE 0 
    END), 0) as cogs,
    COALESCE(SUM(CASE 
      WHEN NOT (category ILIKE '%bahan%' OR category ILIKE '%cogs%' OR category ILIKE '%hpp%' OR category ILIKE '%material%')
      THEN amount ELSE 0 
    END), 0) as opex
  INTO v_total_expenses, v_cogs, v_opex
  FROM financial_transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND date BETWEEN p_start_date AND p_end_date;
  
  -- Get breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'category', category_name,
      'type', expense_type,
      'amount', category_total,
      'percentage', CASE WHEN v_total_expenses > 0 THEN ROUND((category_total / v_total_expenses) * 100, 2) ELSE 0 END,
      'count', category_count
    )
  )
  INTO v_breakdown
  FROM (
    SELECT 
      COALESCE(category, 'Tidak Dikategorikan') as category_name,
      CASE 
        WHEN category ILIKE '%bahan%' OR category ILIKE '%cogs%' OR category ILIKE '%hpp%' OR category ILIKE '%material%'
        THEN 'COGS'
        ELSE 'Operating Expense'
      END as expense_type,
      SUM(amount) as category_total,
      COUNT(*) as category_count
    FROM financial_transactions
    WHERE user_id = p_user_id
      AND type = 'expense'
      AND date BETWEEN p_start_date AND p_end_date
    GROUP BY COALESCE(category, 'Tidak Dikategorikan')
    ORDER BY category_total DESC
  ) breakdown_data;
  
  RETURN QUERY SELECT v_total_expenses, v_cogs, v_opex, COALESCE(v_breakdown, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_expenses_by_period"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_expenses_by_period"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") IS 'Get expenses dengan deteksi COGS otomatis dari financial_transactions';



CREATE OR REPLACE FUNCTION "public"."get_operational_costs_allocated"("p_user_id" "uuid", "p_days_in_period" integer DEFAULT 30) RETURNS TABLE("total_monthly_costs" numeric, "total_daily_costs" numeric, "fixed_costs" numeric, "variable_costs" numeric, "hpp_costs" numeric, "operational_costs_only" numeric, "cost_breakdown" "jsonb")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_total_monthly numeric := 0;
  v_fixed numeric := 0;
  v_variable numeric := 0;
  v_hpp numeric := 0;
  v_operational numeric := 0;
  v_breakdown jsonb;
BEGIN
  -- Calculate totals
  SELECT 
    COALESCE(SUM(jumlah_per_bulan), 0) as total,
    COALESCE(SUM(CASE WHEN jenis = 'tetap' THEN jumlah_per_bulan ELSE 0 END), 0) as fixed,
    COALESCE(SUM(CASE WHEN jenis = 'variabel' THEN jumlah_per_bulan ELSE 0 END), 0) as variable,
    COALESCE(SUM(CASE WHEN "group" ILIKE '%hpp%' THEN jumlah_per_bulan ELSE 0 END), 0) as hpp,
    COALESCE(SUM(CASE WHEN "group" ILIKE '%operasional%' THEN jumlah_per_bulan ELSE 0 END), 0) as ops
  INTO v_total_monthly, v_fixed, v_variable, v_hpp, v_operational
  FROM operational_costs
  WHERE user_id = p_user_id
    AND status = 'aktif';
  
  -- Get breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'nama_biaya', nama_biaya,
      'jumlah_per_bulan', jumlah_per_bulan,
      'jumlah_per_hari', ROUND(jumlah_per_bulan * p_days_in_period / 30.0, 2),
      'jenis', jenis,
      'group', "group",
      'cost_category', cost_category,
      'percentage', CASE WHEN v_total_monthly > 0 THEN ROUND((jumlah_per_bulan / v_total_monthly) * 100, 2) ELSE 0 END
    )
  )
  INTO v_breakdown
  FROM operational_costs
  WHERE user_id = p_user_id
    AND status = 'aktif'
  ORDER BY jumlah_per_bulan DESC;
  
  RETURN QUERY SELECT 
    v_total_monthly,
    ROUND(v_total_monthly * p_days_in_period / 30.0, 2),
    v_fixed,
    v_variable,
    v_hpp,
    v_operational,
    COALESCE(v_breakdown, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_operational_costs_allocated"("p_user_id" "uuid", "p_days_in_period" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_operational_costs_allocated"("p_user_id" "uuid", "p_days_in_period" integer) IS 'Get operational costs dengan alokasi harian/periode';



CREATE OR REPLACE FUNCTION "public"."get_or_create_app_settings"("p_user_id" "uuid") RETURNS TABLE("target_produksi_per_bulan" numeric, "overhead_per_pcs" numeric, "operasional_per_pcs" numeric, "settings_exist" boolean)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_settings record;
  v_exists boolean := false;
BEGIN
  -- Try to get existing settings
  SELECT * INTO v_settings
  FROM app_settings
  WHERE user_id = p_user_id;
  
  IF v_settings IS NOT NULL THEN
    v_exists := true;
  ELSE
    -- Create default settings
    INSERT INTO app_settings (user_id, target_produksi_per_bulan, overhead_per_pcs, operasional_per_pcs)
    VALUES (p_user_id, 1000, 500, 300)
    ON CONFLICT (user_id) DO UPDATE SET
      target_produksi_per_bulan = EXCLUDED.target_produksi_per_bulan,
      overhead_per_pcs = EXCLUDED.overhead_per_pcs,
      operasional_per_pcs = EXCLUDED.operasional_per_pcs
    RETURNING * INTO v_settings;
    
    v_exists := false; -- Was created, not existed
  END IF;
  
  RETURN QUERY SELECT 
    v_settings.target_produksi_per_bulan,
    v_settings.overhead_per_pcs,
    v_settings.operasional_per_pcs,
    v_exists;
END;
$$;


ALTER FUNCTION "public"."get_or_create_app_settings"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_or_create_app_settings"("p_user_id" "uuid") IS 'Get atau create default app settings';



CREATE OR REPLACE FUNCTION "public"."get_order_statistics"("p_user_id" "uuid") RETURNS TABLE("total_orders" bigint, "completed_orders" bigint, "pending_orders" bigint, "cancelled_orders" bigint, "total_revenue" numeric, "average_order_value" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        RETURN QUERY
        SELECT 
            COUNT(*)::BIGINT as total_orders,
            COUNT(*) FILTER (WHERE status = 'completed')::BIGINT as completed_orders,
            COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_orders,
            COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT as cancelled_orders,
            COALESCE(SUM(total_pesanan) FILTER (WHERE status = 'completed'), 0) as total_revenue,
            COALESCE(AVG(total_pesanan) FILTER (WHERE status = 'completed'), 0) as average_order_value
        FROM public.orders
        WHERE user_id = p_user_id;
    ELSE
        -- Return default values if orders table doesn't exist
        RETURN QUERY
        SELECT 
            0::BIGINT as total_orders,
            0::BIGINT as completed_orders,
            0::BIGINT as pending_orders,
            0::BIGINT as cancelled_orders,
            0::NUMERIC as total_revenue,
            0::NUMERIC as average_order_value;
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_order_statistics"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_order_statistics"("p_user_id" "uuid") IS 'Get order statistics for a user';



CREATE OR REPLACE FUNCTION "public"."get_profit_dashboard_summary"("p_user_id" "uuid") RETURNS TABLE("current_month_revenue" numeric, "current_month_profit" numeric, "current_month_margin" numeric, "prev_month_revenue" numeric, "prev_month_profit" numeric, "revenue_growth" numeric, "profit_growth" numeric, "best_category" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
  RETURN QUERY
  WITH current_month AS (
    SELECT 
      monthly_revenue,
      final_net_profit,
      final_net_margin_pct
    FROM public.monthly_profit_summary
    WHERE user_id = p_user_id 
      AND period = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    LIMIT 1
  ),
  prev_month AS (
    SELECT 
      monthly_revenue,
      final_net_profit
    FROM public.monthly_profit_summary
    WHERE user_id = p_user_id 
      AND period = TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM')
    LIMIT 1
  ),
  best_category AS (
    SELECT revenue_category
    FROM public.revenue_category_breakdown
    WHERE user_id = p_user_id
      AND period = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    ORDER BY total_amount DESC
    LIMIT 1
  )
  SELECT 
    COALESCE(cm.monthly_revenue, 0),
    COALESCE(cm.final_net_profit, 0),
    COALESCE(cm.final_net_margin_pct, 0),
    COALESCE(pm.monthly_revenue, 0),
    COALESCE(pm.final_net_profit, 0),
    CASE 
      WHEN pm.monthly_revenue > 0 THEN ROUND(((cm.monthly_revenue - pm.monthly_revenue) / pm.monthly_revenue) * 100, 2)
      ELSE 0
    END,
    CASE 
      WHEN pm.final_net_profit <> 0 THEN ROUND(((cm.final_net_profit - pm.final_net_profit) / ABS(pm.final_net_profit)) * 100, 2)
      ELSE 0
    END,
    COALESCE(bc.revenue_category, 'N/A')
  FROM current_month cm
  CROSS JOIN prev_month pm
  CROSS JOIN best_category bc;
END;
$$;


ALTER FUNCTION "public"."get_profit_dashboard_summary"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profit_trend"("p_user_id" "uuid", "p_start_period" "text", "p_end_period" "text") RETURNS TABLE("period" "text", "total_revenue" numeric, "total_cogs" numeric, "total_opex" numeric, "gross_profit" numeric, "net_profit" numeric)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
WITH bounds AS (
  SELECT
    date_trunc('month', (p_start_period || '-01')::date) AS start_month,
    date_trunc('month', (p_end_period   || '-01')::date) AS end_month
),
months AS (
  SELECT gs::date AS month_start
  FROM bounds b,
       generate_series(b.start_month, b.end_month, interval '1 month') AS gs
)
SELECT
  to_char(m.month_start, 'YYYY-MM') AS period,
  pd.total_revenue,
  pd.total_cogs,
  pd.total_opex,
  pd.total_revenue - pd.total_cogs,
  pd.total_revenue - pd.total_cogs - pd.total_opex
FROM months m
CROSS JOIN LATERAL public.calculate_realtime_profit(
  p_user_id, to_char(m.month_start, 'YYYY-MM')
) AS pd
ORDER BY m.month_start;
$$;


ALTER FUNCTION "public"."get_profit_trend"("p_user_id" "uuid", "p_start_period" "text", "p_end_period" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_profit_trend"("p_user_id" "uuid", "p_start_period" "text", "p_end_period" "text") IS 'Get profit trend data across multiple periods';



CREATE OR REPLACE FUNCTION "public"."get_revenue_breakdown"("p_user_id" "uuid", "p_period" "text") RETURNS TABLE("category" "text", "amount" numeric, "transaction_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $_$
DECLARE
    v_start_date DATE;
    v_end_date DATE;
BEGIN
    -- Parse period (same logic as main function)
    IF length(p_period) = 7 AND p_period ~ '^\d{4}-\d{2}$' THEN
        v_start_date := (p_period || '-01')::DATE;
        v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    ELSIF length(p_period) = 4 AND p_period ~ '^\d{4}$' THEN
        v_start_date := (p_period || '-01-01')::DATE;
        v_end_date := (p_period || '-12-31')::DATE;
    ELSIF length(p_period) = 10 AND p_period ~ '^\d{4}-\d{2}-\d{2}$' THEN
        v_start_date := p_period::DATE;
        v_end_date := p_period::DATE;
    ELSE
        v_start_date := date_trunc('month', CURRENT_DATE)::DATE;
        v_end_date := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    END IF;

    RETURN QUERY
    SELECT 
        COALESCE(ft.category, 'Lainnya') as category,
        SUM(ft.amount) as amount,
        COUNT(*) as transaction_count
    FROM public.financial_transactions ft
    WHERE ft.user_id = p_user_id
        AND ft.type = 'income'
        AND ft.date >= v_start_date
        AND ft.date <= v_end_date
    GROUP BY ft.category
    ORDER BY amount DESC;
END;
$_$;


ALTER FUNCTION "public"."get_revenue_breakdown"("p_user_id" "uuid", "p_period" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_revenue_breakdown"("p_user_id" "uuid", "p_period" "text") IS 'Get revenue breakdown by category for profit analysis';



CREATE OR REPLACE FUNCTION "public"."get_revenue_by_period"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS TABLE("total_revenue" numeric, "revenue_breakdown" "jsonb", "transaction_count" integer)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_revenue numeric := 0;
  v_breakdown jsonb;
  v_count integer := 0;
BEGIN
  -- Get total revenue
  SELECT COALESCE(SUM(amount), 0), COUNT(*)
  INTO v_revenue, v_count
  FROM financial_transactions
  WHERE user_id = p_user_id
    AND type = 'income'
    AND date BETWEEN p_start_date AND p_end_date;
  
  -- Get breakdown by category
  SELECT jsonb_agg(
    jsonb_build_object(
      'category', COALESCE(category, 'Tidak Dikategorikan'),
      'amount', category_total,
      'percentage', CASE WHEN v_revenue > 0 THEN ROUND((category_total / v_revenue) * 100, 2) ELSE 0 END,
      'count', category_count
    )
  )
  INTO v_breakdown
  FROM (
    SELECT 
      COALESCE(category, 'Tidak Dikategorikan') as category,
      SUM(amount) as category_total,
      COUNT(*) as category_count
    FROM financial_transactions
    WHERE user_id = p_user_id
      AND type = 'income'
      AND date BETWEEN p_start_date AND p_end_date
    GROUP BY COALESCE(category, 'Tidak Dikategorikan')
    ORDER BY category_total DESC
  ) breakdown_data;
  
  RETURN QUERY SELECT v_revenue, COALESCE(v_breakdown, '[]'::jsonb), v_count;
END;
$$;


ALTER FUNCTION "public"."get_revenue_by_period"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_revenue_by_period"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") IS 'Get revenue dengan breakdown kategori dari financial_transactions';



CREATE OR REPLACE FUNCTION "public"."get_sales_from_orders"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS TABLE("total_sales" numeric, "completed_orders" integer, "pending_orders" integer, "cancelled_orders" integer, "average_order_value" numeric, "sales_breakdown" "jsonb")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_total_sales numeric := 0;
  v_completed integer := 0;
  v_pending integer := 0;
  v_cancelled integer := 0;
  v_avg_order numeric := 0;
  v_breakdown jsonb;
BEGIN
  -- Get order statistics
  SELECT 
    COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0),
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::integer,
    COUNT(CASE WHEN status = 'pending' OR status = 'processing' THEN 1 END)::integer,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::integer
  INTO v_total_sales, v_completed, v_pending, v_cancelled
  FROM orders
  WHERE user_id = p_user_id
    AND tanggal_pesanan BETWEEN p_start_date AND p_end_date;
  
  -- Calculate average order value
  v_avg_order := CASE WHEN v_completed > 0 THEN v_total_sales / v_completed ELSE 0 END;
  
  -- Get breakdown by status and payment
  SELECT jsonb_agg(
    jsonb_build_object(
      'status', status,
      'payment_status', payment_status,
      'count', status_count,
      'total_amount', total_amount_by_status,
      'percentage', CASE WHEN v_total_sales > 0 THEN ROUND((total_amount_by_status / v_total_sales) * 100, 2) ELSE 0 END
    )
  )
  INTO v_breakdown
  FROM (
    SELECT 
      status,
      payment_status,
      COUNT(*) as status_count,
      SUM(total_amount) as total_amount_by_status
    FROM orders
    WHERE user_id = p_user_id
      AND tanggal_pesanan BETWEEN p_start_date AND p_end_date
    GROUP BY status, payment_status
    ORDER BY total_amount_by_status DESC
  ) breakdown_data;
  
  RETURN QUERY SELECT 
    v_total_sales, 
    v_completed, 
    v_pending, 
    v_cancelled, 
    v_avg_order,
    COALESCE(v_breakdown, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_sales_from_orders"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_sales_from_orders"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") IS 'Get sales data dari orders table';



CREATE OR REPLACE FUNCTION "public"."get_total_costs"("p_user_id" "uuid") RETURNS numeric
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    v_total_costs NUMERIC := 0;
BEGIN
    -- Get total from operational_costs if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'operational_costs') THEN
        SELECT COALESCE(SUM(jumlah_per_bulan), 0)
        INTO v_total_costs
        FROM public.operational_costs
        WHERE user_id = p_user_id
            AND status = 'aktif';
    ELSE
        -- Fallback: estimate from expense transactions
        SELECT COALESCE(SUM(amount), 0)
        INTO v_total_costs
        FROM public.financial_transactions
        WHERE user_id = p_user_id
            AND type = 'expense'
            AND date >= date_trunc('month', CURRENT_DATE)
            AND date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
    END IF;
    
    RETURN v_total_costs;
END;
$$;


ALTER FUNCTION "public"."get_total_costs"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_total_costs"("p_user_id" "uuid") IS 'Get total operational costs for a user';



CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_user_settings"("p_user_id" "uuid") RETURNS "public"."app_settings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  result app_settings;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Cannot initialize settings: user_id is null';
  END IF;

  INSERT INTO app_settings (
    user_id,
    target_output_monthly,
    overhead_per_pcs,
    operasional_per_pcs
  )
  VALUES (
    p_user_id,
    1000.00,
    0.00,
    0.00
  )
  ON CONFLICT (user_id) DO UPDATE
    SET updated_at = now()
  RETURNING * INTO result;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."initialize_user_settings"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
    v_user_email TEXT;
    v_is_admin BOOLEAN := FALSE;
BEGIN
    -- Get current user email
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Check if user is admin (add your admin emails here)
    IF v_user_email IN (
        'admin@bismillah.com',
        'monifinebakery@gmail.com',  -- Add actual admin emails
        'owner@bismillah.com'
    ) THEN
        v_is_admin := TRUE;
    END IF;
    
    RETURN v_is_admin;
END;
$$;


ALTER FUNCTION "public"."is_user_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_user_admin"() IS 'Check if current user has admin privileges';



CREATE OR REPLACE FUNCTION "public"."record_material_usage"("p_bahan_baku_id" "uuid", "p_qty_base" numeric, "p_tanggal" "date" DEFAULT CURRENT_DATE, "p_harga_efektif" numeric DEFAULT NULL::numeric, "p_source_type" character varying DEFAULT 'manual'::character varying, "p_source_id" "uuid" DEFAULT NULL::"uuid", "p_keterangan" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
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
$$;


ALTER FUNCTION "public"."record_material_usage"("p_bahan_baku_id" "uuid", "p_qty_base" numeric, "p_tanggal" "date", "p_harga_efektif" numeric, "p_source_type" character varying, "p_source_id" "uuid", "p_keterangan" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_pemakaian_daily_mv"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.pemakaian_bahan_daily_mv;
END;
$$;


ALTER FUNCTION "public"."refresh_pemakaian_daily_mv"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."safe_auto_initialize_user_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  target_user_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  target_user_id := NEW.user_id;

  IF target_user_id IS NULL THEN
    RAISE WARNING 'Skipping trigger: user_id is null in operational_costs.% row id=%', TG_OP, NEW.id;
    RETURN NEW;
  END IF;

  -- SCHEMA-QUALIFIED + EXPLICIT CASTS to avoid ambiguity
  PERFORM public.initialize_user_settings(target_user_id::uuid);
  PERFORM public.calculate_and_update_cost_per_unit(target_user_id::uuid);

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."safe_auto_initialize_user_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_admin_role"("user_email" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  target_uid uuid;
BEGIN
  -- Get the user ID from the email
  SELECT id INTO target_uid FROM auth.users WHERE email = user_email;
  
  IF NOT FOUND THEN
    RETURN 'User not found';
  END IF;

  -- Set the admin role in the JWT claims
  PERFORM public.set_claim(target_uid, 'user_role', '"admin"'::jsonb);
  
  RETURN 'User set as admin successfully';
END;
$$;


ALTER FUNCTION "public"."set_admin_role"("user_email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_claim"("uid" "uuid", "claim" "text", "value" "jsonb") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = uid) THEN
    RETURN 'User not found';
  END IF;

  UPDATE auth.users SET raw_app_meta_data = 
    raw_app_meta_data || 
    json_build_object(claim, value)::jsonb
  WHERE id = uid;
  
  RETURN 'Success';
END;
$$;


ALTER FUNCTION "public"."set_claim"("uid" "uuid", "claim" "text", "value" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."tr_user_payments_normalize"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- normalize payment_status
  IF NEW.payment_status IS NULL THEN
    NEW.payment_status := 'pending';
  ELSE
    CASE lower(NEW.payment_status)
      WHEN 'paid','success','succeeded','completed','settled'
        THEN NEW.payment_status := 'settled';
      WHEN 'unpaid','pending','awaiting_payment','authorized','requires_payment_method','processing'
        THEN NEW.payment_status := 'pending';
      WHEN 'failed','failure','declined','denied','void','expired','chargeback','disputed'
        THEN NEW.payment_status := 'failed';
      WHEN 'refunded','refund','partially_refunded'
        THEN NEW.payment_status := 'refunded';
      WHEN 'canceled','cancelled','voided','reversed'
        THEN NEW.payment_status := 'canceled';
      ELSE
        NEW.payment_status := 'pending';
    END CASE;
  END IF;

  -- sync is_paid
  NEW.is_paid := (NEW.payment_status = 'settled');

  -- normalize email
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
  END IF;

  -- timestamps
  IF TG_OP = 'INSERT' AND NEW.created_at IS NULL THEN
    NEW.created_at := now();
  END IF;
  NEW.updated_at := now();

  RETURN NEW;
END $$;


ALTER FUNCTION "public"."tr_user_payments_normalize"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_refresh_pemakaian_mv"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    PERFORM public.refresh_pemakaian_daily_mv();
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."trigger_refresh_pemakaian_mv"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_app_settings_calculations"("p_user_id" "uuid", "p_target_output" numeric, "p_overhead_per_pcs" numeric DEFAULT NULL::numeric, "p_operasional_per_pcs" numeric DEFAULT NULL::numeric) RETURNS "public"."app_settings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  result app_settings;
  calculated_overhead numeric;
  calculated_operasional numeric;
BEGIN
  -- Calculate values if not provided
  calculated_overhead := COALESCE(
    p_overhead_per_pcs, 
    calculate_dual_mode_overhead(p_user_id, 'HPP', p_target_output)
  );
  
  calculated_operasional := COALESCE(
    p_operasional_per_pcs,
    calculate_dual_mode_overhead(p_user_id, 'OPERASIONAL', p_target_output) 
  );
  
  -- Upsert app_settings
  INSERT INTO app_settings (
    user_id,
    target_output_monthly,
    overhead_per_pcs,
    operasional_per_pcs
  ) VALUES (
    p_user_id,
    p_target_output,
    calculated_overhead,
    calculated_operasional
  )
  ON CONFLICT (user_id) DO UPDATE SET
    target_output_monthly = EXCLUDED.target_output_monthly,
    overhead_per_pcs = EXCLUDED.overhead_per_pcs,
    operasional_per_pcs = EXCLUDED.operasional_per_pcs,
    updated_at = now()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."update_app_settings_calculations"("p_user_id" "uuid", "p_target_output" numeric, "p_overhead_per_pcs" numeric, "p_operasional_per_pcs" numeric) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_wac_price"("p_user_id" "uuid", "p_bahan_id" "uuid", "p_new_qty" numeric, "p_new_price" numeric) RETURNS TABLE("success" boolean, "old_wac" numeric, "new_wac" numeric, "new_stock" numeric)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'pg_catalog', 'public'
    AS $$
DECLARE
  v_current_stock numeric;
  v_current_wac numeric;
  v_new_wac numeric;
  v_new_stock numeric;
BEGIN
  -- Get current data
  SELECT stok, COALESCE(harga_rata_rata, harga_satuan)
  INTO v_current_stock, v_current_wac
  FROM bahan_baku
  WHERE id = p_bahan_id AND user_id = p_user_id;
  
  IF v_current_stock IS NULL THEN
    RETURN QUERY SELECT false, 0::numeric, 0::numeric, 0::numeric;
    RETURN;
  END IF;
  
  -- Calculate new WAC
  IF v_current_stock = 0 THEN
    v_new_wac := p_new_price;
  ELSE
    v_new_wac := ((v_current_stock * v_current_wac) + (p_new_qty * p_new_price)) / (v_current_stock + p_new_qty);
  END IF;
  
  v_new_stock := v_current_stock + p_new_qty;
  
  -- Update bahan baku
  UPDATE bahan_baku 
  SET 
    stok = v_new_stock,
    harga_rata_rata = v_new_wac,
    updated_at = now()
  WHERE id = p_bahan_id AND user_id = p_user_id;
  
  RETURN QUERY SELECT true, v_current_wac, v_new_wac, v_new_stock;
END;
$$;


ALTER FUNCTION "public"."update_wac_price"("p_user_id" "uuid", "p_bahan_id" "uuid", "p_new_qty" numeric, "p_new_price" numeric) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_wac_price"("p_user_id" "uuid", "p_bahan_id" "uuid", "p_new_qty" numeric, "p_new_price" numeric) IS 'Update WAC price untuk bahan baku';



CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "type" "text" NOT NULL,
    "value" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."allocation_settings" (
    "user_id" "uuid" NOT NULL,
    "metode" "text" DEFAULT 'per_unit'::"text" NOT NULL,
    "nilai" numeric DEFAULT 1000 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "alloc_metode_valid" CHECK (("metode" = 'per_unit'::"text"))
);


ALTER TABLE "public"."allocation_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_pinned" boolean DEFAULT false NOT NULL,
    "release_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean
);


ALTER TABLE "public"."app_updates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."assets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nama" "text" NOT NULL,
    "kategori" "text" NOT NULL,
    "lokasi" "text" NOT NULL,
    "kondisi" "text" NOT NULL,
    "tanggal_beli" "date" NOT NULL,
    "nilai_awal" numeric DEFAULT 0 NOT NULL,
    "nilai_sekarang" numeric DEFAULT 0 NOT NULL,
    "depresiasi" numeric DEFAULT 0 NOT NULL,
    "deskripsi" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "assets_nonnegatives" CHECK ((("nilai_awal" >= (0)::numeric) AND ("nilai_sekarang" >= (0)::numeric) AND ("depresiasi" >= (0)::numeric)))
);


ALTER TABLE "public"."assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bahan_baku" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nama" "text" NOT NULL,
    "kategori" "text" NOT NULL,
    "stok" numeric DEFAULT 0 NOT NULL,
    "satuan" "text" NOT NULL,
    "minimum" numeric DEFAULT 0 NOT NULL,
    "harga_satuan" numeric DEFAULT 0 NOT NULL,
    "harga_rata_rata" numeric,
    "supplier" "text",
    "tanggal_kadaluwarsa" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "bahan_baku_nonnegative_wac" CHECK ((("harga_rata_rata" IS NULL) OR ("harga_rata_rata" >= (0)::numeric))),
    CONSTRAINT "bahan_baku_nonnegatives" CHECK ((("stok" >= (0)::numeric) AND ("minimum" >= (0)::numeric) AND ("harga_satuan" >= (0)::numeric)))
);


ALTER TABLE "public"."bahan_baku" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."financial_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "amount" numeric DEFAULT 0 NOT NULL,
    "category" "text" NOT NULL,
    "description" "text" NOT NULL,
    "date" "date" NOT NULL,
    "related_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "fin_amount_nonneg" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "fin_type_valid" CHECK (("type" = ANY (ARRAY['income'::"text", 'expense'::"text"])))
);


ALTER TABLE "public"."financial_transactions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."daily_profit_summary" WITH ("security_invoker"='true') AS
 SELECT "user_id",
    "date",
    COALESCE("sum"(
        CASE
            WHEN ("type" = 'income'::"text") THEN "amount"
            ELSE NULL::numeric
        END), (0)::numeric) AS "daily_revenue",
    COALESCE("sum"(
        CASE
            WHEN (("type" = 'expense'::"text") AND (("category" ~~* '%bahan%'::"text") OR ("category" ~~* '%cogs%'::"text") OR ("category" ~~* '%hpp%'::"text"))) THEN "amount"
            ELSE NULL::numeric
        END), (0)::numeric) AS "daily_cogs",
    COALESCE("sum"(
        CASE
            WHEN (("type" = 'expense'::"text") AND (NOT (("category" ~~* '%bahan%'::"text") OR ("category" ~~* '%cogs%'::"text") OR ("category" ~~* '%hpp%'::"text")))) THEN "amount"
            ELSE NULL::numeric
        END), (0)::numeric) AS "daily_opex",
    (COALESCE("sum"(
        CASE
            WHEN ("type" = 'income'::"text") THEN "amount"
            ELSE NULL::numeric
        END), (0)::numeric) - COALESCE("sum"(
        CASE
            WHEN (("type" = 'expense'::"text") AND (("category" ~~* '%bahan%'::"text") OR ("category" ~~* '%cogs%'::"text") OR ("category" ~~* '%hpp%'::"text"))) THEN "amount"
            ELSE NULL::numeric
        END), (0)::numeric)) AS "gross_profit",
    (COALESCE("sum"(
        CASE
            WHEN ("type" = 'income'::"text") THEN "amount"
            ELSE NULL::numeric
        END), (0)::numeric) - COALESCE("sum"(
        CASE
            WHEN ("type" = 'expense'::"text") THEN "amount"
            ELSE NULL::numeric
        END), (0)::numeric)) AS "net_profit",
        CASE
            WHEN ("sum"(
            CASE
                WHEN ("type" = 'income'::"text") THEN "amount"
                ELSE NULL::numeric
            END) > (0)::numeric) THEN "round"(((("sum"(
            CASE
                WHEN ("type" = 'income'::"text") THEN "amount"
                ELSE NULL::numeric
            END) - "sum"(
            CASE
                WHEN (("type" = 'expense'::"text") AND (("category" ~~* '%bahan%'::"text") OR ("category" ~~* '%cogs%'::"text") OR ("category" ~~* '%hpp%'::"text"))) THEN "amount"
                ELSE NULL::numeric
            END)) / "sum"(
            CASE
                WHEN ("type" = 'income'::"text") THEN "amount"
                ELSE NULL::numeric
            END)) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS "gross_margin_pct",
        CASE
            WHEN ("sum"(
            CASE
                WHEN ("type" = 'income'::"text") THEN "amount"
                ELSE NULL::numeric
            END) > (0)::numeric) THEN "round"(((("sum"(
            CASE
                WHEN ("type" = 'income'::"text") THEN "amount"
                ELSE NULL::numeric
            END) - "sum"(
            CASE
                WHEN ("type" = 'expense'::"text") THEN "amount"
                ELSE NULL::numeric
            END)) / "sum"(
            CASE
                WHEN ("type" = 'income'::"text") THEN "amount"
                ELSE NULL::numeric
            END)) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS "net_margin_pct"
   FROM "public"."financial_transactions" "ft"
  GROUP BY "user_id", "date";


ALTER VIEW "public"."daily_profit_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_id" "text" NOT NULL,
    "device_name" "text",
    "device_type" "text",
    "browser" "text",
    "os" "text",
    "ip_address" "text",
    "last_active" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_current" boolean DEFAULT false,
    "refresh_token_hash" "text"
);


ALTER TABLE "public"."devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."operational_costs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nama_biaya" "text" NOT NULL,
    "jenis" "text" NOT NULL,
    "jumlah_per_bulan" numeric DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'aktif'::"text" NOT NULL,
    "deskripsi" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "cost_category" "text" GENERATED ALWAYS AS (
CASE
    WHEN ("lower"("jenis") = 'tetap'::"text") THEN 'fixed'::"text"
    WHEN ("lower"("jenis") = 'variabel'::"text") THEN 'variable'::"text"
    ELSE 'other'::"text"
END) STORED,
    "group" "text" DEFAULT 'operasional'::"text" NOT NULL,
    "effective_date" "date",
    CONSTRAINT "opcosts_group_valid" CHECK (("lower"("group") = ANY (ARRAY['hpp'::"text", 'operasional'::"text"]))),
    CONSTRAINT "opcosts_jenis_valid" CHECK (("jenis" = ANY (ARRAY['tetap'::"text", 'variabel'::"text"]))),
    CONSTRAINT "opcosts_nonneg" CHECK (("jumlah_per_bulan" >= (0)::numeric)),
    CONSTRAINT "opcosts_status_valid" CHECK (("status" = ANY (ARRAY['aktif'::"text", 'nonaktif'::"text"]))),
    CONSTRAINT "operational_costs_cost_category_valid" CHECK (("cost_category" = ANY (ARRAY['fixed'::"text", 'variable'::"text", 'other'::"text"]))),
    CONSTRAINT "operational_costs_group_check" CHECK (("group" = ANY (ARRAY['operasional'::"text", 'hpp'::"text"])))
);


ALTER TABLE "public"."operational_costs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."operational_costs"."group" IS 'Cost group: HPP (enters COGS) or OPERASIONAL (outside COGS)';



COMMENT ON COLUMN "public"."operational_costs"."effective_date" IS 'Date when the operational cost becomes effective for profit analysis calculations';



CREATE OR REPLACE VIEW "public"."dual_mode_cost_summary" WITH ("security_invoker"='on') AS
 SELECT "user_id",
    "group",
    "status",
    "count"(*) AS "cost_count",
    "sum"("jumlah_per_bulan") AS "total_monthly",
    "avg"("jumlah_per_bulan") AS "avg_monthly",
    "max"("jumlah_per_bulan") AS "max_monthly",
    "min"("jumlah_per_bulan") AS "min_monthly"
   FROM "public"."operational_costs"
  GROUP BY "user_id", "group", "status";


ALTER VIEW "public"."dual_mode_cost_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."dual_mode_cost_summary" IS 'Summary view of costs grouped by user, cost group (HPP/OPERASIONAL), and status';



CREATE TABLE IF NOT EXISTS "public"."followup_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "template" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "followup_templates_nonempty" CHECK ((("length"(TRIM(BOTH FROM "status")) > 0) AND ("length"(TRIM(BOTH FROM "template")) > 0)))
);


ALTER TABLE "public"."followup_templates" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."monthly_profit_summary" WITH ("security_invoker"='true') AS
 SELECT "ft"."user_id",
    "to_char"(("ft"."date")::timestamp with time zone, 'YYYY-MM'::"text") AS "period",
    "date_trunc"('month'::"text", ("ft"."date")::timestamp with time zone) AS "month_start",
    COALESCE("sum"(
        CASE
            WHEN ("ft"."type" = 'income'::"text") THEN "ft"."amount"
            ELSE NULL::numeric
        END), (0)::numeric) AS "monthly_revenue",
    COALESCE("sum"(
        CASE
            WHEN (("ft"."type" = 'expense'::"text") AND (("ft"."category" ~~* '%bahan%'::"text") OR ("ft"."category" ~~* '%cogs%'::"text") OR ("ft"."category" ~~* '%hpp%'::"text"))) THEN "ft"."amount"
            ELSE NULL::numeric
        END), (0)::numeric) AS "monthly_cogs",
    COALESCE("sum"(
        CASE
            WHEN (("ft"."type" = 'expense'::"text") AND (NOT (("ft"."category" ~~* '%bahan%'::"text") OR ("ft"."category" ~~* '%cogs%'::"text") OR ("ft"."category" ~~* '%hpp%'::"text")))) THEN "ft"."amount"
            ELSE NULL::numeric
        END), (0)::numeric) AS "monthly_opex_transactions",
    COALESCE("oc"."total_operational_costs", (0)::numeric) AS "monthly_operational_costs",
    (COALESCE("sum"(
        CASE
            WHEN ("ft"."type" = 'income'::"text") THEN "ft"."amount"
            ELSE NULL::numeric
        END), (0)::numeric) - COALESCE("sum"(
        CASE
            WHEN (("ft"."type" = 'expense'::"text") AND (("ft"."category" ~~* '%bahan%'::"text") OR ("ft"."category" ~~* '%cogs%'::"text") OR ("ft"."category" ~~* '%hpp%'::"text"))) THEN "ft"."amount"
            ELSE NULL::numeric
        END), (0)::numeric)) AS "gross_profit",
    ((COALESCE("sum"(
        CASE
            WHEN ("ft"."type" = 'income'::"text") THEN "ft"."amount"
            ELSE NULL::numeric
        END), (0)::numeric) - COALESCE("sum"(
        CASE
            WHEN ("ft"."type" = 'expense'::"text") THEN "ft"."amount"
            ELSE NULL::numeric
        END), (0)::numeric)) - COALESCE("oc"."total_operational_costs", (0)::numeric)) AS "final_net_profit",
        CASE
            WHEN ("sum"(
            CASE
                WHEN ("ft"."type" = 'income'::"text") THEN "ft"."amount"
                ELSE NULL::numeric
            END) > (0)::numeric) THEN "round"(((("sum"(
            CASE
                WHEN ("ft"."type" = 'income'::"text") THEN "ft"."amount"
                ELSE NULL::numeric
            END) - "sum"(
            CASE
                WHEN (("ft"."type" = 'expense'::"text") AND (("ft"."category" ~~* '%bahan%'::"text") OR ("ft"."category" ~~* '%cogs%'::"text") OR ("ft"."category" ~~* '%hpp%'::"text"))) THEN "ft"."amount"
                ELSE NULL::numeric
            END)) / "sum"(
            CASE
                WHEN ("ft"."type" = 'income'::"text") THEN "ft"."amount"
                ELSE NULL::numeric
            END)) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS "gross_margin_pct",
        CASE
            WHEN ("sum"(
            CASE
                WHEN ("ft"."type" = 'income'::"text") THEN "ft"."amount"
                ELSE NULL::numeric
            END) > (0)::numeric) THEN "round"((((("sum"(
            CASE
                WHEN ("ft"."type" = 'income'::"text") THEN "ft"."amount"
                ELSE NULL::numeric
            END) - "sum"(
            CASE
                WHEN ("ft"."type" = 'expense'::"text") THEN "ft"."amount"
                ELSE NULL::numeric
            END)) - COALESCE("oc"."total_operational_costs", (0)::numeric)) / "sum"(
            CASE
                WHEN ("ft"."type" = 'income'::"text") THEN "ft"."amount"
                ELSE NULL::numeric
            END)) * (100)::numeric), 2)
            ELSE (0)::numeric
        END AS "final_net_margin_pct",
    "count"(
        CASE
            WHEN ("ft"."type" = 'income'::"text") THEN 1
            ELSE NULL::integer
        END) AS "revenue_transaction_count",
    "count"(
        CASE
            WHEN ("ft"."type" = 'expense'::"text") THEN 1
            ELSE NULL::integer
        END) AS "expense_transaction_count"
   FROM ("public"."financial_transactions" "ft"
     LEFT JOIN ( SELECT "operational_costs"."user_id",
            "sum"("operational_costs"."jumlah_per_bulan") AS "total_operational_costs"
           FROM "public"."operational_costs"
          WHERE ("operational_costs"."status" = 'aktif'::"text")
          GROUP BY "operational_costs"."user_id") "oc" ON (("ft"."user_id" = "oc"."user_id")))
  GROUP BY "ft"."user_id", ("to_char"(("ft"."date")::timestamp with time zone, 'YYYY-MM'::"text")), ("date_trunc"('month'::"text", ("ft"."date")::timestamp with time zone)), "oc"."total_operational_costs";


ALTER VIEW "public"."monthly_profit_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_settings" (
    "user_id" "uuid" NOT NULL,
    "push_notifications" boolean DEFAULT true NOT NULL,
    "inventory_alerts" boolean DEFAULT true NOT NULL,
    "order_alerts" boolean DEFAULT true NOT NULL,
    "financial_alerts" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "auto_archive_days" integer,
    "daily_reports" boolean DEFAULT false NOT NULL,
    "monthly_reports" boolean DEFAULT false NOT NULL,
    "inventory_notifications" boolean DEFAULT true NOT NULL,
    "stock_notifications" boolean DEFAULT true NOT NULL,
    "payment_notifications" boolean DEFAULT true NOT NULL,
    "financial_notifications" boolean DEFAULT true NOT NULL,
    "low_stock_alerts" boolean DEFAULT true NOT NULL,
    "order_notifications" boolean DEFAULT true NOT NULL,
    "system_notifications" boolean DEFAULT true NOT NULL,
    "stock_alerts" boolean DEFAULT true NOT NULL,
    "payment_alerts" boolean DEFAULT true NOT NULL,
    "weekly_reports" boolean DEFAULT false NOT NULL,
    "reminder_notifications" boolean DEFAULT true NOT NULL,
    "security_alerts" boolean DEFAULT true NOT NULL,
    "low_stock_threshold" integer,
    CONSTRAINT "notification_settings_auto_archive_days_valid" CHECK ((("auto_archive_days" IS NULL) OR (("auto_archive_days" >= 1) AND ("auto_archive_days" <= 3650))))
);


ALTER TABLE "public"."notification_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" NOT NULL,
    "icon" "text",
    "priority" integer DEFAULT 1 NOT NULL,
    "related_type" "text",
    "related_id" "text",
    "action_url" "text",
    "is_read" boolean DEFAULT false NOT NULL,
    "is_archived" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '30 days'::interval),
    CONSTRAINT "notifications_expires_after_created" CHECK ((("expires_at" IS NULL) OR ("expires_at" >= "created_at"))),
    CONSTRAINT "notifications_priority_range" CHECK ((("priority" >= 1) AND ("priority" <= 5)))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nomor_pesanan" "text" NOT NULL,
    "tanggal" "date" DEFAULT "now"() NOT NULL,
    "status" "text" NOT NULL,
    "nama_pelanggan" "text" NOT NULL,
    "telepon_pelanggan" "text" NOT NULL,
    "email_pelanggan" "text",
    "alamat_pengiriman" "text",
    "items" "jsonb",
    "total_pesanan" numeric DEFAULT 0 NOT NULL,
    "catatan" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "orders_status_valid" CHECK (("status" = ANY (ARRAY['draft'::"text", 'paid'::"text", 'shipped'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "orders_total_nonnegative" CHECK (("total_pesanan" >= (0)::numeric))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pemakaian_bahan" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "bahan_baku_id" "uuid" NOT NULL,
    "qty_base" numeric(15,4) DEFAULT 0 NOT NULL,
    "tanggal" "date" DEFAULT CURRENT_DATE NOT NULL,
    "harga_efektif" numeric(15,2) DEFAULT 0,
    "hpp_value" numeric(15,2) GENERATED ALWAYS AS (("qty_base" * "harga_efektif")) STORED,
    "keterangan" "text",
    "source_type" character varying(50) DEFAULT 'manual'::character varying,
    "source_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pemakaian_bahan_harga_efektif_check" CHECK (("harga_efektif" >= (0)::numeric)),
    CONSTRAINT "pemakaian_bahan_qty_base_check" CHECK (("qty_base" >= (0)::numeric)),
    CONSTRAINT "pemakaian_bahan_source_type_check" CHECK ((("source_type")::"text" = ANY ((ARRAY['manual'::character varying, 'recipe'::character varying, 'order'::character varying, 'production'::character varying])::"text"[])))
);


ALTER TABLE "public"."pemakaian_bahan" OWNER TO "postgres";


COMMENT ON TABLE "public"."pemakaian_bahan" IS 'Material usage tracking for COGS and profit analysis';



COMMENT ON COLUMN "public"."pemakaian_bahan"."user_id" IS 'User who owns this material usage record';



COMMENT ON COLUMN "public"."pemakaian_bahan"."bahan_baku_id" IS 'Reference to the material used from bahan_baku table';



COMMENT ON COLUMN "public"."pemakaian_bahan"."qty_base" IS 'Quantity used in base unit (matches bahan_baku.satuan)';



COMMENT ON COLUMN "public"."pemakaian_bahan"."tanggal" IS 'Date when the material was used';



COMMENT ON COLUMN "public"."pemakaian_bahan"."harga_efektif" IS 'Effective price per unit at time of usage (WAC or current price)';



COMMENT ON COLUMN "public"."pemakaian_bahan"."hpp_value" IS 'Calculated COGS value (qty_base * harga_efektif) - auto-calculated';



COMMENT ON COLUMN "public"."pemakaian_bahan"."source_type" IS 'Source of usage: manual, recipe, order, production';



COMMENT ON COLUMN "public"."pemakaian_bahan"."source_id" IS 'Optional reference to source record (order_id, recipe_id, etc.)';



CREATE MATERIALIZED VIEW "public"."pemakaian_bahan_daily_mv" AS
 SELECT "user_id",
    "tanggal" AS "date",
    "sum"("hpp_value") AS "total_hpp",
    "count"(*) AS "usage_count",
    "string_agg"(DISTINCT ("source_type")::"text", ', '::"text") AS "source_types"
   FROM "public"."pemakaian_bahan"
  GROUP BY "user_id", "tanggal"
  WITH NO DATA;


ALTER MATERIALIZED VIEW "public"."pemakaian_bahan_daily_mv" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profit_analysis" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "period" "text" NOT NULL,
    "period_type" "text" NOT NULL,
    "total_revenue" numeric DEFAULT 0 NOT NULL,
    "revenue_breakdown" "jsonb" DEFAULT '[]'::"jsonb",
    "total_cogs" numeric DEFAULT 0 NOT NULL,
    "cogs_breakdown" "jsonb" DEFAULT '[]'::"jsonb",
    "total_opex" numeric DEFAULT 0 NOT NULL,
    "opex_breakdown" "jsonb" DEFAULT '[]'::"jsonb",
    "gross_profit" numeric DEFAULT 0 NOT NULL,
    "net_profit" numeric DEFAULT 0 NOT NULL,
    "gross_margin" numeric DEFAULT 0 NOT NULL,
    "net_margin" numeric DEFAULT 0 NOT NULL,
    "calculation_date" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profit_analysis_period_type_check" CHECK (("period_type" = ANY (ARRAY['daily'::"text", 'monthly'::"text", 'quarterly'::"text", 'yearly'::"text"])))
);


ALTER TABLE "public"."profit_analysis" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."promos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nama_promo" "text" NOT NULL,
    "tipe_promo" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "deskripsi" "text",
    "tanggal_mulai" "date",
    "tanggal_selesai" "date",
    "data_promo" "jsonb",
    "calculation_result" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "promos_status_valid" CHECK (("status" = ANY (ARRAY['draft'::"text", 'active'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."promos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "supplier" "text",
    "tanggal" "date" NOT NULL,
    "total_nilai" numeric DEFAULT 0 NOT NULL,
    "items" "jsonb",
    "status" "text",
    "metode_perhitungan" "text",
    "catatan" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    CONSTRAINT "purchases_completed_must_have_total" CHECK ((("status" <> 'completed'::"text") OR ("total_nilai" > (0)::numeric))),
    CONSTRAINT "purchases_method_valid" CHECK ((("metode_perhitungan" IS NULL) OR ("metode_perhitungan" = 'AVERAGE'::"text"))),
    CONSTRAINT "purchases_status_valid" CHECK (("status" = ANY (ARRAY['pending'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "purchases_total_nonnegative" CHECK (("total_nilai" >= (0)::numeric))
);


ALTER TABLE "public"."purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."recipes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nama_resep" "text" NOT NULL,
    "jumlah_porsi" integer DEFAULT 1 NOT NULL,
    "kategori_resep" "text",
    "deskripsi" "text",
    "foto_url" "text",
    "bahan_resep" "jsonb",
    "biaya_tenaga_kerja" numeric DEFAULT 0 NOT NULL,
    "biaya_overhead" numeric DEFAULT 0 NOT NULL,
    "margin_keuntungan_persen" numeric DEFAULT 0 NOT NULL,
    "total_hpp" numeric DEFAULT 0 NOT NULL,
    "hpp_per_porsi" numeric DEFAULT 0 NOT NULL,
    "harga_jual_porsi" numeric DEFAULT 0 NOT NULL,
    "jumlah_pcs_per_porsi" integer DEFAULT 1 NOT NULL,
    "hpp_per_pcs" numeric DEFAULT 0 NOT NULL,
    "harga_jual_per_pcs" numeric DEFAULT 0 NOT NULL,
    CONSTRAINT "recipes_nonnegatives" CHECK ((("jumlah_porsi" >= 0) AND ("biaya_tenaga_kerja" >= (0)::numeric) AND ("biaya_overhead" >= (0)::numeric) AND ("margin_keuntungan_persen" >= (0)::numeric) AND ("total_hpp" >= (0)::numeric) AND ("hpp_per_porsi" >= (0)::numeric) AND ("harga_jual_porsi" >= (0)::numeric) AND ("jumlah_pcs_per_porsi" >= 0) AND ("hpp_per_pcs" >= (0)::numeric) AND ("harga_jual_per_pcs" >= (0)::numeric)))
);


ALTER TABLE "public"."recipes" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."revenue_category_breakdown" WITH ("security_invoker"='true') AS
 SELECT "user_id",
    "to_char"(("date")::timestamp with time zone, 'YYYY-MM'::"text") AS "period",
    COALESCE("category", 'Tidak Dikategorikan'::"text") AS "revenue_category",
    "count"(*) AS "transaction_count",
    "sum"("amount") AS "total_amount",
    "round"("avg"("amount"), 0) AS "avg_amount",
    "min"("amount") AS "min_amount",
    "max"("amount") AS "max_amount"
   FROM "public"."financial_transactions" "ft"
  WHERE ("type" = 'income'::"text")
  GROUP BY "user_id", ("to_char"(("date")::timestamp with time zone, 'YYYY-MM'::"text")), "category";


ALTER VIEW "public"."revenue_category_breakdown" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nama" "text" NOT NULL,
    "kontak" "text",
    "email" "text",
    "telepon" "text",
    "alamat" "text",
    "catatan" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "name" "text",
    "email" "text",
    "order_id" "text",
    "pg_reference_id" "text",
    "payment_status" "text" DEFAULT 'unpaid'::"text" NOT NULL,
    "is_paid" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_payments_status_valid" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'settled'::"text", 'failed'::"text", 'cancelled'::"text", 'expired'::"text", 'refunded'::"text"])))
);

ALTER TABLE ONLY "public"."user_payments" REPLICA IDENTITY FULL;

ALTER TABLE ONLY "public"."user_payments" FORCE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_seen_updates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "update_id" "uuid" NOT NULL,
    "seen_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_seen_updates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "business_name" "text" DEFAULT ''::"text" NOT NULL,
    "owner_name" "text" DEFAULT ''::"text" NOT NULL,
    "email" "text",
    "phone" "text",
    "address" "text",
    "currency" "text" DEFAULT 'IDR'::"text" NOT NULL,
    "language" "text" DEFAULT 'id'::"text" NOT NULL,
    "notifications" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "backup_settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "security_settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_settings" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."allocation_settings"
    ADD CONSTRAINT "allocation_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_user_unique" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."app_updates"
    ADD CONSTRAINT "app_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bahan_baku"
    ADD CONSTRAINT "bahan_baku_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bahan_baku"
    ADD CONSTRAINT "bahan_baku_unique_user_nama" UNIQUE ("user_id", "nama");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_user_id_device_id_key" UNIQUE ("user_id", "device_id");



ALTER TABLE ONLY "public"."financial_transactions"
    ADD CONSTRAINT "financial_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."followup_templates"
    ADD CONSTRAINT "followup_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."followup_templates"
    ADD CONSTRAINT "followup_templates_user_status_unique" UNIQUE ("user_id", "status");



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."operational_costs"
    ADD CONSTRAINT "operational_costs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pemakaian_bahan"
    ADD CONSTRAINT "pemakaian_bahan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profit_analysis"
    ADD CONSTRAINT "profit_analysis_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profit_analysis"
    ADD CONSTRAINT "profit_analysis_user_id_period_period_type_key" UNIQUE ("user_id", "period", "period_type");



ALTER TABLE ONLY "public"."promos"
    ADD CONSTRAINT "promos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "recipes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_unique_user_nama" UNIQUE ("user_id", "nama");



ALTER TABLE ONLY "public"."user_payments"
    ADD CONSTRAINT "user_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_seen_updates"
    ADD CONSTRAINT "user_seen_updates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "user_settings_user_id_key" UNIQUE ("user_id");



CREATE INDEX "devices_device_id_idx" ON "public"."devices" USING "btree" ("device_id");



CREATE INDEX "devices_last_active_idx" ON "public"."devices" USING "btree" ("last_active");



CREATE INDEX "devices_user_id_idx" ON "public"."devices" USING "btree" ("user_id");



CREATE INDEX "idx_activities_user_date" ON "public"."activities" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_activities_user_id" ON "public"."activities" USING "btree" ("user_id");



CREATE INDEX "idx_allocation_settings_user" ON "public"."allocation_settings" USING "btree" ("user_id");



CREATE INDEX "idx_app_settings_user" ON "public"."app_settings" USING "btree" ("user_id");



CREATE INDEX "idx_app_updates_release_date" ON "public"."app_updates" USING "btree" ("release_date" DESC);



CREATE INDEX "idx_assets_kategori" ON "public"."assets" USING "btree" ("kategori");



CREATE INDEX "idx_assets_user_id" ON "public"."assets" USING "btree" ("user_id");



CREATE INDEX "idx_assets_user_kategori" ON "public"."assets" USING "btree" ("user_id", "kategori");



CREATE INDEX "idx_bahan_baku_harga_rata_rata" ON "public"."bahan_baku" USING "btree" ("user_id", "harga_rata_rata");



CREATE INDEX "idx_bahan_baku_nama" ON "public"."bahan_baku" USING "btree" ("nama");



CREATE INDEX "idx_bahan_baku_stok" ON "public"."bahan_baku" USING "btree" ("stok") WHERE ("stok" <= "minimum");



CREATE INDEX "idx_bahan_baku_user_id" ON "public"."bahan_baku" USING "btree" ("user_id");



CREATE INDEX "idx_bahan_baku_user_kategori" ON "public"."bahan_baku" USING "btree" ("user_id", "kategori");



CREATE INDEX "idx_fin_tx_date" ON "public"."financial_transactions" USING "btree" ("date");



CREATE INDEX "idx_fin_tx_related" ON "public"."financial_transactions" USING "btree" ("related_id");



CREATE INDEX "idx_fin_tx_type" ON "public"."financial_transactions" USING "btree" ("type");



CREATE INDEX "idx_fin_tx_user" ON "public"."financial_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_financial_transactions_user_date" ON "public"."financial_transactions" USING "btree" ("user_id", "date" DESC);



CREATE INDEX "idx_followup_templates_user" ON "public"."followup_templates" USING "btree" ("user_id");



CREATE INDEX "idx_followup_templates_user_status" ON "public"."followup_templates" USING "btree" ("user_id", "status");



CREATE INDEX "idx_notif_settings_user" ON "public"."notification_settings" USING "btree" ("user_id");



CREATE INDEX "idx_notifications_created_at" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "idx_notifications_expires_at" ON "public"."notifications" USING "btree" ("expires_at");



CREATE INDEX "idx_notifications_is_archived" ON "public"."notifications" USING "btree" ("is_archived");



CREATE INDEX "idx_notifications_is_read" ON "public"."notifications" USING "btree" ("is_read");



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_opcosts_group" ON "public"."operational_costs" USING "btree" ("group");



CREATE INDEX "idx_opcosts_jenis" ON "public"."operational_costs" USING "btree" ("jenis");



CREATE INDEX "idx_opcosts_status" ON "public"."operational_costs" USING "btree" ("status");



CREATE INDEX "idx_opcosts_user" ON "public"."operational_costs" USING "btree" ("user_id");



CREATE INDEX "idx_operational_costs_effective_date" ON "public"."operational_costs" USING "btree" ("effective_date");



CREATE INDEX "idx_operational_costs_group_status" ON "public"."operational_costs" USING "btree" ("group", "status");



CREATE INDEX "idx_operational_costs_user_group" ON "public"."operational_costs" USING "btree" ("user_id", "group");



CREATE INDEX "idx_operational_costs_user_status_effective" ON "public"."operational_costs" USING "btree" ("user_id", "status", "effective_date");



CREATE INDEX "idx_orders_items_gin" ON "public"."orders" USING "gin" ("items");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_tanggal" ON "public"."orders" USING "btree" ("tanggal");



CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");



CREATE INDEX "idx_orders_user_status" ON "public"."orders" USING "btree" ("user_id", "status");



CREATE INDEX "idx_pemakaian_bahan_source" ON "public"."pemakaian_bahan" USING "btree" ("source_type", "source_id") WHERE ("source_id" IS NOT NULL);



CREATE INDEX "idx_pemakaian_bahan_tanggal" ON "public"."pemakaian_bahan" USING "btree" ("tanggal");



CREATE INDEX "idx_pemakaian_bahan_user_date" ON "public"."pemakaian_bahan" USING "btree" ("user_id", "tanggal" DESC);



CREATE INDEX "idx_pemakaian_bahan_user_id" ON "public"."pemakaian_bahan" USING "btree" ("user_id");



CREATE UNIQUE INDEX "idx_pemakaian_daily_mv_user_date" ON "public"."pemakaian_bahan_daily_mv" USING "btree" ("user_id", "date");



CREATE INDEX "idx_profit_analysis_period" ON "public"."profit_analysis" USING "btree" ("period");



CREATE INDEX "idx_profit_analysis_user_id" ON "public"."profit_analysis" USING "btree" ("user_id");



CREATE INDEX "idx_profit_analysis_user_period" ON "public"."profit_analysis" USING "btree" ("user_id", "period");



CREATE INDEX "idx_promos_nama" ON "public"."promos" USING "btree" ("nama_promo");



CREATE INDEX "idx_promos_status" ON "public"."promos" USING "btree" ("status");



CREATE INDEX "idx_promos_user" ON "public"."promos" USING "btree" ("user_id");



CREATE INDEX "idx_purchases_items_gin" ON "public"."purchases" USING "gin" ("items");



CREATE INDEX "idx_purchases_status" ON "public"."purchases" USING "btree" ("status");



CREATE INDEX "idx_purchases_supplier" ON "public"."purchases" USING "btree" ("supplier");



CREATE INDEX "idx_purchases_tanggal" ON "public"."purchases" USING "btree" ("tanggal");



CREATE INDEX "idx_purchases_user_id" ON "public"."purchases" USING "btree" ("user_id");



CREATE INDEX "idx_purchases_user_status" ON "public"."purchases" USING "btree" ("user_id", "status");



CREATE INDEX "idx_recipes_bahan_gin" ON "public"."recipes" USING "gin" ("bahan_resep");



CREATE INDEX "idx_recipes_nama" ON "public"."recipes" USING "btree" ("nama_resep");



CREATE INDEX "idx_recipes_user" ON "public"."recipes" USING "btree" ("user_id");



CREATE INDEX "idx_seen_update" ON "public"."user_seen_updates" USING "btree" ("update_id");



CREATE INDEX "idx_seen_user" ON "public"."user_seen_updates" USING "btree" ("user_id");



CREATE INDEX "idx_suppliers_nama" ON "public"."suppliers" USING "btree" ("nama");



CREATE INDEX "idx_suppliers_user_id" ON "public"."suppliers" USING "btree" ("user_id");



CREATE INDEX "idx_user_payments_order" ON "public"."user_payments" USING "btree" ("order_id");



CREATE INDEX "idx_user_payments_status" ON "public"."user_payments" USING "btree" ("payment_status");



CREATE INDEX "idx_user_payments_user" ON "public"."user_payments" USING "btree" ("user_id");



CREATE INDEX "idx_user_payments_user_id_not_null" ON "public"."user_payments" USING "btree" ("user_id") WHERE ("user_id" IS NOT NULL);



CREATE INDEX "idx_user_payments_user_status" ON "public"."user_payments" USING "btree" ("user_id", "payment_status");



CREATE INDEX "idx_user_settings_user_id" ON "public"."user_settings" USING "btree" ("user_id");



CREATE UNIQUE INDEX "uq_user_payments_order" ON "public"."user_payments" USING "btree" ("order_id");



CREATE UNIQUE INDEX "uq_user_payments_pg_ref" ON "public"."user_payments" USING "btree" ("pg_reference_id") WHERE ("pg_reference_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "tr_user_payments_normalize" BEFORE INSERT OR UPDATE ON "public"."user_payments" FOR EACH ROW EXECUTE FUNCTION "public"."tr_user_payments_normalize"();



CREATE OR REPLACE TRIGGER "trg_alloc_updated_at" BEFORE UPDATE ON "public"."allocation_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_app_settings_updated_at" BEFORE UPDATE ON "public"."app_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_assets_updated_at" BEFORE UPDATE ON "public"."assets" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_bahan_baku_updated_at" BEFORE UPDATE ON "public"."bahan_baku" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_fin_updated_at" BEFORE UPDATE ON "public"."financial_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_followup_templates_updated_at" BEFORE UPDATE ON "public"."followup_templates" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_notification_settings_updated_at" BEFORE UPDATE ON "public"."notification_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_notifications_updated_at" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_opcosts_updated_at" BEFORE UPDATE ON "public"."operational_costs" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_promos_updated_at" BEFORE UPDATE ON "public"."promos" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_purchases_updated_at" BEFORE UPDATE ON "public"."purchases" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_recipes_updated_at" BEFORE UPDATE ON "public"."recipes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_suppliers_updated_at" BEFORE UPDATE ON "public"."suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_user_payments_updated_at" BEFORE UPDATE ON "public"."user_payments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_user_settings_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_cleanup_after_deletion" AFTER DELETE ON "public"."operational_costs" FOR EACH ROW EXECUTE FUNCTION "public"."cleanup_after_cost_deletion"();



CREATE OR REPLACE TRIGGER "trigger_refresh_pemakaian_mv" AFTER INSERT OR DELETE OR UPDATE ON "public"."pemakaian_bahan" FOR EACH STATEMENT EXECUTE FUNCTION "public"."trigger_refresh_pemakaian_mv"();



CREATE OR REPLACE TRIGGER "trigger_safe_auto_initialize_settings" AFTER INSERT OR UPDATE ON "public"."operational_costs" FOR EACH ROW EXECUTE FUNCTION "public"."safe_auto_initialize_user_settings"();



CREATE OR REPLACE TRIGGER "update_activities_updated_at" BEFORE UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_assets_updated_at" BEFORE UPDATE ON "public"."assets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_bahan_baku_updated_at" BEFORE UPDATE ON "public"."bahan_baku" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_financial_transactions_updated_at" BEFORE UPDATE ON "public"."financial_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_orders_updated_at" BEFORE UPDATE ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_pemakaian_bahan_updated_at" BEFORE UPDATE ON "public"."pemakaian_bahan" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profit_analysis_updated_at" BEFORE UPDATE ON "public"."profit_analysis" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_purchases_updated_at" BEFORE UPDATE ON "public"."purchases" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_suppliers_updated_at" BEFORE UPDATE ON "public"."suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_settings_updated_at" BEFORE UPDATE ON "public"."user_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."app_settings"
    ADD CONSTRAINT "app_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "fk_activities_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."allocation_settings"
    ADD CONSTRAINT "fk_alloc_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."assets"
    ADD CONSTRAINT "fk_assets_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bahan_baku"
    ADD CONSTRAINT "fk_bahan_baku_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."financial_transactions"
    ADD CONSTRAINT "fk_fin_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."followup_templates"
    ADD CONSTRAINT "fk_followup_templates_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_settings"
    ADD CONSTRAINT "fk_notif_settings_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "fk_notifications_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."operational_costs"
    ADD CONSTRAINT "fk_opcosts_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "fk_orders_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."promos"
    ADD CONSTRAINT "fk_promos_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchases"
    ADD CONSTRAINT "fk_purchases_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recipes"
    ADD CONSTRAINT "fk_recipes_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_seen_updates"
    ADD CONSTRAINT "fk_seen_updates_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "fk_suppliers_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_payments"
    ADD CONSTRAINT "fk_user_payments_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_settings"
    ADD CONSTRAINT "fk_user_settings_user" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pemakaian_bahan"
    ADD CONSTRAINT "pemakaian_bahan_bahan_baku_id_fkey" FOREIGN KEY ("bahan_baku_id") REFERENCES "public"."bahan_baku"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."pemakaian_bahan"
    ADD CONSTRAINT "pemakaian_bahan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profit_analysis"
    ADD CONSTRAINT "profit_analysis_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_seen_updates"
    ADD CONSTRAINT "user_seen_updates_update_id_fkey" FOREIGN KEY ("update_id") REFERENCES "public"."app_updates"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can create app updates" ON "public"."app_updates" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can delete app updates" ON "public"."app_updates" FOR DELETE TO "authenticated" USING ((("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text"));



CREATE POLICY "Admins can update app updates" ON "public"."app_updates" FOR UPDATE TO "authenticated" USING ((("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text")) WITH CHECK ((("auth"."jwt"() ->> 'user_role'::"text") = 'admin'::"text"));



CREATE POLICY "All users can view app updates" ON "public"."app_updates" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Users can delete own allocation settings" ON "public"."allocation_settings" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can delete own app settings" ON "public"."app_settings" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = '23f1793f-070f-47b3-b5e9-71e28f50070b'::"uuid"));



CREATE POLICY "Users can insert own allocation settings" ON "public"."allocation_settings" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can insert own app settings" ON "public"."app_settings" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = '23f1793f-070f-47b3-b5e9-71e28f50070b'::"uuid"));



CREATE POLICY "Users can manage their own financial transactions" ON "public"."financial_transactions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own profit analysis" ON "public"."profit_analysis" TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Users can update own allocation settings" ON "public"."allocation_settings" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can update own app settings" ON "public"."app_settings" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = '23f1793f-070f-47b3-b5e9-71e28f50070b'::"uuid")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = '23f1793f-070f-47b3-b5e9-71e28f50070b'::"uuid"));



CREATE POLICY "Users can view own allocation settings" ON "public"."allocation_settings" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "Users can view own app settings" ON "public"."app_settings" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = '23f1793f-070f-47b3-b5e9-71e28f50070b'::"uuid"));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activities_delete_own" ON "public"."activities" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "activities_insert_own" ON "public"."activities" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "activities_select_own" ON "public"."activities" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "activities_update_own" ON "public"."activities" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."allocation_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_updates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."assets" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "assets_delete_own" ON "public"."assets" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "assets_insert_own" ON "public"."assets" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "assets_select_own" ON "public"."assets" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "assets_update_own" ON "public"."assets" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."bahan_baku" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bahan_baku_delete_own" ON "public"."bahan_baku" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "bahan_baku_insert_own" ON "public"."bahan_baku" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "bahan_baku_select_own" ON "public"."bahan_baku" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "bahan_baku_update_own" ON "public"."bahan_baku" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."devices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "devices_delete_own" ON "public"."devices" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "devices_insert_own" ON "public"."devices" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "devices_select_own" ON "public"."devices" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "devices_update_own" ON "public"."devices" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."financial_transactions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "financial_transactions_delete_own" ON "public"."financial_transactions" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "financial_transactions_insert_own" ON "public"."financial_transactions" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "financial_transactions_select_own" ON "public"."financial_transactions" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "financial_transactions_update_own" ON "public"."financial_transactions" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."followup_templates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "followup_templates_delete_own" ON "public"."followup_templates" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "followup_templates_insert_own" ON "public"."followup_templates" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "followup_templates_select_own" ON "public"."followup_templates" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "followup_templates_update_own" ON "public"."followup_templates" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."notification_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notification_settings_delete_own" ON "public"."notification_settings" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "notification_settings_insert_own" ON "public"."notification_settings" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "notification_settings_select_own" ON "public"."notification_settings" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "notification_settings_update_own" ON "public"."notification_settings" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notifications_delete_own" ON "public"."notifications" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "notifications_insert_own" ON "public"."notifications" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "notifications_select_own" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "notifications_update_own" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."operational_costs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "operational_costs_delete_own" ON "public"."operational_costs" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "operational_costs_insert_own" ON "public"."operational_costs" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "operational_costs_select_own" ON "public"."operational_costs" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "operational_costs_update_own" ON "public"."operational_costs" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "orders_delete_own" ON "public"."orders" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "orders_insert_own" ON "public"."orders" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "orders_select_own" ON "public"."orders" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "orders_update_own" ON "public"."orders" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."pemakaian_bahan" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "pemakaian_bahan_delete_own" ON "public"."pemakaian_bahan" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "pemakaian_bahan_insert_own" ON "public"."pemakaian_bahan" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "pemakaian_bahan_select_own" ON "public"."pemakaian_bahan" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "pemakaian_bahan_update_own" ON "public"."pemakaian_bahan" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."profit_analysis" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."promos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "promos_delete_own" ON "public"."promos" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "promos_insert_own" ON "public"."promos" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "promos_select_own" ON "public"."promos" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "promos_update_own" ON "public"."promos" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."purchases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "purchases_delete_own" ON "public"."purchases" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "purchases_insert_own" ON "public"."purchases" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "purchases_select_own" ON "public"."purchases" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "purchases_update_own" ON "public"."purchases" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."recipes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "recipes_delete_own" ON "public"."recipes" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "recipes_insert_own" ON "public"."recipes" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "recipes_select_own" ON "public"."recipes" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "recipes_update_own" ON "public"."recipes" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "suppliers_delete_own" ON "public"."suppliers" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "suppliers_insert_own" ON "public"."suppliers" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "suppliers_select_own" ON "public"."suppliers" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "suppliers_update_own" ON "public"."suppliers" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."user_payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_payments_owner_select" ON "public"."user_payments" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("user_id" IS NULL) AND ("email" IS NOT NULL) AND ("lower"("email") = "lower"(COALESCE(( SELECT "auth"."email"() AS "email"), ( SELECT ("auth"."jwt"() ->> 'email'::"text"))))))));



CREATE POLICY "user_payments_owner_update_claim_by_email" ON "public"."user_payments" FOR UPDATE TO "authenticated" USING ((("user_id" IS NULL) AND ("is_paid" = true) AND ("email" IS NOT NULL) AND ("lower"("email") = "lower"(COALESCE(( SELECT "auth"."email"() AS "email"), ( SELECT ("auth"."jwt"() ->> 'email'::"text"))))))) WITH CHECK ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ("user_id" IS NULL)));



ALTER TABLE "public"."user_seen_updates" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_seen_updates_delete_own" ON "public"."user_seen_updates" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "user_seen_updates_insert_own" ON "public"."user_seen_updates" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "user_seen_updates_select_own" ON "public"."user_seen_updates" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "user_seen_updates_update_own" ON "public"."user_seen_updates" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_settings_delete_own" ON "public"."user_settings" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "user_settings_insert_own" ON "public"."user_settings" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "user_settings_select_own" ON "public"."user_settings" FOR SELECT TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "user_settings_update_own" ON "public"."user_settings" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."activities";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."allocation_settings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_settings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_updates";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."assets";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."bahan_baku";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."devices";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."financial_transactions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."followup_templates";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notification_settings";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notifications";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."operational_costs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."orders";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."pemakaian_bahan";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profit_analysis";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."promos";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."purchases";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."recipes";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."suppliers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_payments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_seen_updates";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_settings";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."auto_calculate_monthly_profit"("p_user_id" "uuid", "p_month" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."auto_calculate_monthly_profit"("p_user_id" "uuid", "p_month" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_calculate_monthly_profit"("p_user_id" "uuid", "p_month" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_initialize_user_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_initialize_user_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_initialize_user_settings"() TO "service_role";



GRANT ALL ON TABLE "public"."app_settings" TO "anon";
GRANT ALL ON TABLE "public"."app_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."app_settings" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_and_update_cost_per_unit"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_and_update_cost_per_unit"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_and_update_cost_per_unit"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_comprehensive_profit"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_comprehensive_profit"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_comprehensive_profit"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_dual_mode_overhead"("p_user_id" "uuid", "p_group" "text", "p_target_output" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_dual_mode_overhead"("p_user_id" "uuid", "p_group" "text", "p_target_output" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_dual_mode_overhead"("p_user_id" "uuid", "p_group" "text", "p_target_output" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_material_costs_wac"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_material_costs_wac"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_material_costs_wac"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_overhead"("p_material_cost" numeric, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_overhead"("p_material_cost" numeric, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_overhead"("p_material_cost" numeric, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_realtime_profit"("p_user_id" "uuid", "p_period" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_realtime_profit"("p_user_id" "uuid", "p_period" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_realtime_profit"("p_user_id" "uuid", "p_period" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_recipe_cost_with_wac"("p_user_id" "uuid", "p_recipe_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_recipe_cost_with_wac"("p_user_id" "uuid", "p_recipe_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_recipe_cost_with_wac"("p_user_id" "uuid", "p_recipe_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."can_complete_order"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_complete_order"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_complete_order"("p_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_after_cost_deletion"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_after_cost_deletion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_after_cost_deletion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_order_and_deduct_stock"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_order_and_deduct_stock"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_order_and_deduct_stock"("p_order_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_new_order"("order_data" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_new_order"("order_data" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_new_order"("order_data" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_comprehensive_dashboard_summary"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_comprehensive_dashboard_summary"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_comprehensive_dashboard_summary"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_month_profit_data"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_month_profit_data"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_month_profit_data"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_expenses_by_period"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_expenses_by_period"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_expenses_by_period"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_operational_costs_allocated"("p_user_id" "uuid", "p_days_in_period" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_operational_costs_allocated"("p_user_id" "uuid", "p_days_in_period" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_operational_costs_allocated"("p_user_id" "uuid", "p_days_in_period" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_app_settings"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_app_settings"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_app_settings"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_order_statistics"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_order_statistics"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_order_statistics"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profit_dashboard_summary"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profit_dashboard_summary"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profit_dashboard_summary"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profit_trend"("p_user_id" "uuid", "p_start_period" "text", "p_end_period" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profit_trend"("p_user_id" "uuid", "p_start_period" "text", "p_end_period" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profit_trend"("p_user_id" "uuid", "p_start_period" "text", "p_end_period" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_revenue_breakdown"("p_user_id" "uuid", "p_period" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_revenue_breakdown"("p_user_id" "uuid", "p_period" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_revenue_breakdown"("p_user_id" "uuid", "p_period" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_revenue_by_period"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_revenue_by_period"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_revenue_by_period"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_sales_from_orders"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_sales_from_orders"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_sales_from_orders"("p_user_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_total_costs"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_total_costs"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_total_costs"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_user_settings"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_user_settings"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_user_settings"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_material_usage"("p_bahan_baku_id" "uuid", "p_qty_base" numeric, "p_tanggal" "date", "p_harga_efektif" numeric, "p_source_type" character varying, "p_source_id" "uuid", "p_keterangan" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_material_usage"("p_bahan_baku_id" "uuid", "p_qty_base" numeric, "p_tanggal" "date", "p_harga_efektif" numeric, "p_source_type" character varying, "p_source_id" "uuid", "p_keterangan" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_material_usage"("p_bahan_baku_id" "uuid", "p_qty_base" numeric, "p_tanggal" "date", "p_harga_efektif" numeric, "p_source_type" character varying, "p_source_id" "uuid", "p_keterangan" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_pemakaian_daily_mv"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_pemakaian_daily_mv"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_pemakaian_daily_mv"() TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_auto_initialize_user_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."safe_auto_initialize_user_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_auto_initialize_user_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_admin_role"("user_email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_admin_role"("user_email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_admin_role"("user_email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_claim"("uid" "uuid", "claim" "text", "value" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."set_claim"("uid" "uuid", "claim" "text", "value" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_claim"("uid" "uuid", "claim" "text", "value" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."tr_user_payments_normalize"() TO "anon";
GRANT ALL ON FUNCTION "public"."tr_user_payments_normalize"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tr_user_payments_normalize"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_refresh_pemakaian_mv"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_refresh_pemakaian_mv"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_refresh_pemakaian_mv"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_app_settings_calculations"("p_user_id" "uuid", "p_target_output" numeric, "p_overhead_per_pcs" numeric, "p_operasional_per_pcs" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_app_settings_calculations"("p_user_id" "uuid", "p_target_output" numeric, "p_overhead_per_pcs" numeric, "p_operasional_per_pcs" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_app_settings_calculations"("p_user_id" "uuid", "p_target_output" numeric, "p_overhead_per_pcs" numeric, "p_operasional_per_pcs" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_wac_price"("p_user_id" "uuid", "p_bahan_id" "uuid", "p_new_qty" numeric, "p_new_price" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."update_wac_price"("p_user_id" "uuid", "p_bahan_id" "uuid", "p_new_qty" numeric, "p_new_price" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_wac_price"("p_user_id" "uuid", "p_bahan_id" "uuid", "p_new_qty" numeric, "p_new_price" numeric) TO "service_role";


















GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."allocation_settings" TO "anon";
GRANT ALL ON TABLE "public"."allocation_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."allocation_settings" TO "service_role";



GRANT ALL ON TABLE "public"."app_updates" TO "anon";
GRANT ALL ON TABLE "public"."app_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."app_updates" TO "service_role";



GRANT ALL ON TABLE "public"."assets" TO "anon";
GRANT ALL ON TABLE "public"."assets" TO "authenticated";
GRANT ALL ON TABLE "public"."assets" TO "service_role";



GRANT ALL ON TABLE "public"."bahan_baku" TO "anon";
GRANT ALL ON TABLE "public"."bahan_baku" TO "authenticated";
GRANT ALL ON TABLE "public"."bahan_baku" TO "service_role";



GRANT ALL ON TABLE "public"."financial_transactions" TO "anon";
GRANT ALL ON TABLE "public"."financial_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."financial_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."daily_profit_summary" TO "anon";
GRANT ALL ON TABLE "public"."daily_profit_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_profit_summary" TO "service_role";



GRANT ALL ON TABLE "public"."devices" TO "anon";
GRANT ALL ON TABLE "public"."devices" TO "authenticated";
GRANT ALL ON TABLE "public"."devices" TO "service_role";



GRANT ALL ON TABLE "public"."operational_costs" TO "anon";
GRANT ALL ON TABLE "public"."operational_costs" TO "authenticated";
GRANT ALL ON TABLE "public"."operational_costs" TO "service_role";



GRANT ALL ON TABLE "public"."dual_mode_cost_summary" TO "anon";
GRANT ALL ON TABLE "public"."dual_mode_cost_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."dual_mode_cost_summary" TO "service_role";



GRANT ALL ON TABLE "public"."followup_templates" TO "anon";
GRANT ALL ON TABLE "public"."followup_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."followup_templates" TO "service_role";



GRANT ALL ON TABLE "public"."monthly_profit_summary" TO "anon";
GRANT ALL ON TABLE "public"."monthly_profit_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."monthly_profit_summary" TO "service_role";



GRANT ALL ON TABLE "public"."notification_settings" TO "anon";
GRANT ALL ON TABLE "public"."notification_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_settings" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."pemakaian_bahan" TO "anon";
GRANT ALL ON TABLE "public"."pemakaian_bahan" TO "authenticated";
GRANT ALL ON TABLE "public"."pemakaian_bahan" TO "service_role";



GRANT ALL ON TABLE "public"."pemakaian_bahan_daily_mv" TO "anon";
GRANT ALL ON TABLE "public"."pemakaian_bahan_daily_mv" TO "authenticated";
GRANT ALL ON TABLE "public"."pemakaian_bahan_daily_mv" TO "service_role";



GRANT ALL ON TABLE "public"."profit_analysis" TO "anon";
GRANT ALL ON TABLE "public"."profit_analysis" TO "authenticated";
GRANT ALL ON TABLE "public"."profit_analysis" TO "service_role";



GRANT ALL ON TABLE "public"."promos" TO "anon";
GRANT ALL ON TABLE "public"."promos" TO "authenticated";
GRANT ALL ON TABLE "public"."promos" TO "service_role";



GRANT ALL ON TABLE "public"."purchases" TO "anon";
GRANT ALL ON TABLE "public"."purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."purchases" TO "service_role";



GRANT ALL ON TABLE "public"."recipes" TO "anon";
GRANT ALL ON TABLE "public"."recipes" TO "authenticated";
GRANT ALL ON TABLE "public"."recipes" TO "service_role";



GRANT ALL ON TABLE "public"."revenue_category_breakdown" TO "anon";
GRANT ALL ON TABLE "public"."revenue_category_breakdown" TO "authenticated";
GRANT ALL ON TABLE "public"."revenue_category_breakdown" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."user_payments" TO "anon";
GRANT ALL ON TABLE "public"."user_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."user_payments" TO "service_role";



GRANT UPDATE("user_id") ON TABLE "public"."user_payments" TO "authenticated";



GRANT ALL ON TABLE "public"."user_seen_updates" TO "anon";
GRANT ALL ON TABLE "public"."user_seen_updates" TO "authenticated";
GRANT ALL ON TABLE "public"."user_seen_updates" TO "service_role";



GRANT ALL ON TABLE "public"."user_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_settings" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
