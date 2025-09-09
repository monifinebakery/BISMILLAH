drop trigger if exists "trg_user_settings_updated_at" on "public"."user_settings";

drop trigger if exists "update_user_settings_updated_at" on "public"."user_settings";

drop policy "Users can delete their own savings goals" on "public"."savings_goals";

drop policy "Users can insert their own savings goals" on "public"."savings_goals";

drop policy "Users can update their own savings goals" on "public"."savings_goals";

drop policy "Users can view their own savings goals" on "public"."savings_goals";

alter table "public"."pemakaian_bahan" drop constraint "pemakaian_bahan_source_type_check";

drop index if exists "public"."idx_dashboard_financial_summary_unique";

drop function if exists "public"."calculate_comprehensive_profit"(p_user_id uuid, p_start_date date, p_end_date date);

drop function if exists "public"."calculate_material_costs_wac"(p_user_id uuid, p_start_date date, p_end_date date);

drop view if exists "public"."daily_profit_summary";

drop materialized view if exists "public"."dashboard_financial_summary";

drop function if exists "public"."get_expenses_by_period"(p_user_id uuid, p_start_date date, p_end_date date);

drop function if exists "public"."get_revenue_by_period"(p_user_id uuid, p_start_date date, p_end_date date);

drop function if exists "public"."get_sales_from_orders"(p_user_id uuid, p_start_date date, p_end_date date);

drop view if exists "public"."monthly_profit_summary";

drop function if exists "public"."record_material_usage"(p_bahan_baku_id uuid, p_qty_base numeric, p_tanggal date, p_harga_efektif numeric, p_source_type character varying, p_source_id uuid, p_keterangan text);

drop view if exists "public"."revenue_category_breakdown";

drop view if exists "public"."dual_mode_cost_summary";

drop materialized view if exists "public"."pemakaian_bahan_daily_mv";

drop index if exists "public"."idx_financial_transactions_monthly_dashboard";

drop index if exists "public"."idx_purchases_monthly_analysis";

alter table "public"."app_settings" alter column "created_at" set not null;

alter table "public"."app_settings" alter column "updated_at" set not null;

alter table "public"."assets" alter column "tanggal_beli" set data type timestamp with time zone using "tanggal_beli"::timestamp with time zone;

alter table "public"."bahan_baku" alter column "tanggal_kadaluwarsa" set data type timestamp with time zone using "tanggal_kadaluwarsa"::timestamp with time zone;

alter table "public"."debt_tracking" alter column "due_date" set data type timestamp with time zone using "due_date"::timestamp with time zone;

alter table "public"."devices" alter column "created_at" set not null;

alter table "public"."devices" alter column "last_active" set not null;

alter table "public"."financial_transactions" alter column "date" set data type timestamp with time zone using "date"::timestamp with time zone;

alter table "public"."operational_costs" alter column "effective_date" set data type timestamp with time zone using "effective_date"::timestamp with time zone;

alter table "public"."orders" alter column "tanggal" set data type timestamp with time zone using "tanggal"::timestamp with time zone;

alter table "public"."orders" alter column "tanggal_selesai" set data type timestamp with time zone using "tanggal_selesai"::timestamp with time zone;

alter table "public"."pemakaian_bahan" alter column "tanggal" set data type timestamp with time zone using "tanggal"::timestamp with time zone;

alter table "public"."profit_analysis" alter column "calculation_date" set not null;

alter table "public"."profit_analysis" alter column "created_at" set not null;

alter table "public"."profit_analysis" alter column "updated_at" set not null;

alter table "public"."promos" alter column "tanggal_mulai" set data type timestamp with time zone using "tanggal_mulai"::timestamp with time zone;

alter table "public"."promos" alter column "tanggal_selesai" set data type timestamp with time zone using "tanggal_selesai"::timestamp with time zone;

alter table "public"."purchases" alter column "tanggal" set data type timestamp with time zone using "tanggal"::timestamp with time zone;

alter table "public"."purchases" alter column "updated_at" set default now();

alter table "public"."purchases" alter column "updated_at" set not null;

alter table "public"."suppliers" alter column "updated_at" set default now();

alter table "public"."suppliers" alter column "updated_at" set not null;

CREATE INDEX idx_assets_tanggal_beli_user ON public.assets USING btree (user_id, tanggal_beli DESC);

CREATE INDEX idx_bahan_baku_kadaluwarsa ON public.bahan_baku USING btree (user_id, tanggal_kadaluwarsa DESC) WHERE (tanggal_kadaluwarsa IS NOT NULL);

CREATE INDEX idx_debt_tracking_due_date_status ON public.debt_tracking USING btree (due_date DESC, status, user_id);

CREATE INDEX idx_debt_tracking_due_date_user ON public.debt_tracking USING btree (user_id, due_date DESC);

CREATE INDEX idx_financial_transactions_date_type ON public.financial_transactions USING btree (date DESC, type, user_id);

CREATE INDEX idx_financial_transactions_date_user ON public.financial_transactions USING btree (user_id, date DESC);

CREATE INDEX idx_financial_transactions_user_date_type ON public.financial_transactions USING btree (user_id, date DESC, type);

CREATE INDEX idx_orders_tanggal_status ON public.orders USING btree (tanggal DESC, status, user_id);

CREATE INDEX idx_orders_tanggal_user ON public.orders USING btree (user_id, tanggal DESC);

CREATE INDEX idx_pemakaian_bahan_tanggal_user ON public.pemakaian_bahan USING btree (user_id, tanggal DESC);

CREATE INDEX idx_promos_tanggal_user ON public.promos USING btree (user_id, tanggal_mulai DESC, tanggal_selesai DESC);

CREATE INDEX idx_purchases_tanggal_user ON public.purchases USING btree (user_id, tanggal DESC);

CREATE INDEX idx_suppliers_timestamps ON public.suppliers USING btree (created_at DESC, updated_at DESC);

alter table "public"."pemakaian_bahan" add constraint "pemakaian_bahan_source_type_check" CHECK (((source_type)::text = ANY ((ARRAY['manual'::character varying, 'recipe'::character varying, 'order'::character varying, 'production'::character varying])::text[]))) not valid;

alter table "public"."pemakaian_bahan" validate constraint "pemakaian_bahan_source_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auto_update_wac_on_purchase_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    purchase_item JSONB;
    item_id UUID;
    item_qty NUMERIC;
    item_price NUMERIC;
    wac_result RECORD;
BEGIN
    -- Log trigger execution
    RAISE NOTICE 'WAC Trigger executed for purchase: %', COALESCE(NEW.id, OLD.id);
    
    -- Only process when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        
        RAISE NOTICE 'Processing purchase completion: %', NEW.id;
        
        -- Process each item in the purchase
        IF NEW.items IS NOT NULL AND jsonb_typeof(NEW.items) = 'array' THEN
            
            FOR purchase_item IN SELECT * FROM jsonb_array_elements(NEW.items)
            LOOP
                -- Extract item data with flexible field matching
                item_id := COALESCE(
                    (purchase_item->>'bahanBakuId')::UUID,
                    (purchase_item->>'bahan_baku_id')::UUID,
                    (purchase_item->>'id')::UUID
                );
                
                item_qty := COALESCE(
                    (purchase_item->>'kuantitas')::NUMERIC,
                    (purchase_item->>'jumlah')::NUMERIC,
                    0
                );
                
                item_price := COALESCE(
                    (purchase_item->>'hargaSatuan')::NUMERIC,
                    (purchase_item->>'harga_per_satuan')::NUMERIC,
                    (purchase_item->>'harga_satuan')::NUMERIC,
                    0
                );
                
                RAISE NOTICE 'Processing item: % qty: % price: %', item_id, item_qty, item_price;
                
                -- Only update if we have valid data
                IF item_id IS NOT NULL AND item_qty > 0 AND item_price > 0 THEN
                    
                    -- Call the existing update_wac_price function
                    SELECT * INTO wac_result 
                    FROM update_wac_price(item_id, NEW.user_id, item_qty, item_price);
                    
                    IF wac_result IS NOT NULL THEN
                        RAISE NOTICE 'WAC updated for item %: success=%', item_id, wac_result;
                    ELSE
                        RAISE WARNING 'WAC update failed for item: %', item_id;
                    END IF;
                    
                ELSE
                    RAISE WARNING 'Skipping invalid item data: id=% qty=% price=%', item_id, item_qty, item_price;
                END IF;
                
            END LOOP;
            
        ELSE
            RAISE WARNING 'No valid items array found in purchase: %', NEW.id;
        END IF;
        
    -- Handle status change from 'completed' to other status (reverse WAC)
    ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
        
        RAISE NOTICE 'Reversing purchase completion: %', NEW.id;
        
        -- Process each item for reversal
        IF OLD.items IS NOT NULL AND jsonb_typeof(OLD.items) = 'array' THEN
            
            FOR purchase_item IN SELECT * FROM jsonb_array_elements(OLD.items)
            LOOP
                -- Extract item data
                item_id := COALESCE(
                    (purchase_item->>'bahanBakuId')::UUID,
                    (purchase_item->>'bahan_baku_id')::UUID,
                    (purchase_item->>'id')::UUID
                );
                
                item_qty := COALESCE(
                    (purchase_item->>'kuantitas')::NUMERIC,
                    (purchase_item->>'jumlah')::NUMERIC,
                    0
                );
                
                item_price := COALESCE(
                    (purchase_item->>'hargaSatuan')::NUMERIC,
                    (purchase_item->>'harga_per_satuan')::NUMERIC,
                    (purchase_item->>'harga_satuan')::NUMERIC,
                    0
                );
                
                -- Reverse the quantity (subtract)
                IF item_id IS NOT NULL AND item_qty > 0 AND item_price > 0 THEN
                    
                    SELECT * INTO wac_result 
                    FROM update_wac_price(item_id, NEW.user_id, -item_qty, item_price);
                    
                    RAISE NOTICE 'WAC reversed for item %: success=%', item_id, wac_result;
                    
                END IF;
                
            END LOOP;
            
        END IF;
        
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_comprehensive_profit(p_user_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS TABLE(total_revenue numeric, revenue_from_transactions numeric, revenue_from_orders numeric, total_cogs numeric, cogs_from_transactions numeric, cogs_from_materials numeric, cogs_from_recipes numeric, total_opex numeric, opex_from_transactions numeric, opex_from_operational_costs numeric, gross_profit numeric, net_profit numeric, gross_margin_pct numeric, net_margin_pct numeric, revenue_breakdown jsonb, cogs_breakdown jsonb, opex_breakdown jsonb, order_stats jsonb, material_alerts jsonb, cost_efficiency_score numeric)
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
    v_revenue_transactions numeric := 0;
    v_revenue_orders numeric := 0;
    v_cogs_transactions numeric := 0;
    v_cogs_materials numeric := 0;
    v_cogs_recipes numeric := 0;
    v_opex_transactions numeric := 0;
    v_opex_operational numeric := 0;
    v_days_period integer;
    v_cost_efficiency numeric := 0;
BEGIN
    -- Validate inputs
    IF p_start_date IS NULL OR p_end_date IS NULL THEN
        RAISE EXCEPTION 'Start date and end date cannot be null';
    END IF;
    
    IF p_start_date > p_end_date THEN
        RAISE EXCEPTION 'Start date cannot be greater than end date';
    END IF;

    -- Calculate period in days
    v_days_period := (p_end_date::date - p_start_date::date) + 1;

    -- Get revenue from transactions
    SELECT COALESCE(total_revenue, 0)
    INTO v_revenue_transactions
    FROM get_revenue_by_period(p_user_id, p_start_date, p_end_date);

    -- Get revenue from orders (completed orders only)
    SELECT COALESCE(total_sales, 0)
    INTO v_revenue_orders
    FROM get_sales_from_orders(p_user_id, p_start_date, p_end_date);

    -- Get COGS from transactions
    SELECT COALESCE(cogs_total, 0)
    INTO v_cogs_transactions
    FROM get_expenses_by_period(p_user_id, p_start_date, p_end_date);

    -- Get material costs using WAC
    SELECT COALESCE(total_material_cost, 0)
    INTO v_cogs_materials
    FROM calculate_material_costs_wac(p_user_id, p_start_date, p_end_date);

    -- Recipe-based COGS (placeholder - could be enhanced)
    v_cogs_recipes := 0;

    -- Get OPEX from transactions (non-COGS expenses)
    SELECT COALESCE(opex_total, 0)
    INTO v_opex_transactions
    FROM get_expenses_by_period(p_user_id, p_start_date, p_end_date);

    -- Get operational costs (monthly allocation)
    SELECT COALESCE(SUM(jumlah_per_bulan * (v_days_period::numeric / 30.0)), 0)
    INTO v_opex_operational
    FROM operational_costs
    WHERE user_id = p_user_id AND status = 'aktif';

    -- Calculate efficiency score (0-100)
    IF (v_revenue_transactions + v_revenue_orders) > 0 THEN
        v_cost_efficiency := LEAST(100, 
            ((v_revenue_transactions + v_revenue_orders - v_cogs_transactions - v_cogs_materials - v_opex_transactions - v_opex_operational) 
            / (v_revenue_transactions + v_revenue_orders)) * 100
        );
    END IF;

    -- Return comprehensive profit analysis
    RETURN QUERY SELECT
        -- Revenue
        (v_revenue_transactions + v_revenue_orders),
        v_revenue_transactions,
        v_revenue_orders,
        
        -- COGS
        (v_cogs_transactions + v_cogs_materials + v_cogs_recipes),
        v_cogs_transactions,
        v_cogs_materials,
        v_cogs_recipes,
        
        -- OPEX
        (v_opex_transactions + v_opex_operational),
        v_opex_transactions,
        v_opex_operational,
        
        -- Profits
        (v_revenue_transactions + v_revenue_orders) - (v_cogs_transactions + v_cogs_materials + v_cogs_recipes),
        (v_revenue_transactions + v_revenue_orders) - (v_cogs_transactions + v_cogs_materials + v_cogs_recipes + v_opex_transactions + v_opex_operational),
        
        -- Margins
        CASE WHEN (v_revenue_transactions + v_revenue_orders) > 0 THEN
            (((v_revenue_transactions + v_revenue_orders) - (v_cogs_transactions + v_cogs_materials + v_cogs_recipes)) / (v_revenue_transactions + v_revenue_orders)) * 100
        ELSE 0 END,
        CASE WHEN (v_revenue_transactions + v_revenue_orders) > 0 THEN
            (((v_revenue_transactions + v_revenue_orders) - (v_cogs_transactions + v_cogs_materials + v_cogs_recipes + v_opex_transactions + v_opex_operational)) / (v_revenue_transactions + v_revenue_orders)) * 100
        ELSE 0 END,
        
        -- Breakdowns (simplified for now)
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        
        -- Efficiency
        v_cost_efficiency;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.calculate_material_costs_wac(p_user_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS TABLE(total_material_cost numeric, wac_based_cost numeric, material_breakdown jsonb, low_stock_alerts jsonb)
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
    v_total_cost numeric := 0;
    v_wac_cost numeric := 0;
BEGIN
    -- Calculate material costs using WAC from bahan_baku
    SELECT 
        COALESCE(SUM(pb.hpp_value), 0),
        COALESCE(SUM(pb.qty_base * COALESCE(bb.harga_rata_rata, bb.harga_satuan)), 0)
    INTO v_total_cost, v_wac_cost
    FROM pemakaian_bahan pb
    JOIN bahan_baku bb ON pb.bahan_baku_id = bb.id
    WHERE pb.user_id = p_user_id
    AND pb.tanggal >= p_start_date::date
    AND pb.tanggal <= p_end_date::date;

    -- Return results
    RETURN QUERY SELECT
        v_total_cost,
        v_wac_cost,
        '[]'::jsonb,
        '[]'::jsonb;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_expenses_by_period(p_user_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS TABLE(total_expenses numeric, cogs_total numeric, opex_total numeric, expense_breakdown jsonb)
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(amount), 0) as total_expenses,
        COALESCE(SUM(CASE 
            WHEN LOWER(category) LIKE '%bahan%' OR LOWER(category) LIKE '%cogs%' OR LOWER(category) LIKE '%hpp%'
            THEN amount ELSE 0 END), 0) as cogs_total,
        COALESCE(SUM(CASE 
            WHEN NOT (LOWER(category) LIKE '%bahan%' OR LOWER(category) LIKE '%cogs%' OR LOWER(category) LIKE '%hpp%')
            THEN amount ELSE 0 END), 0) as opex_total,
        '[]'::jsonb as expense_breakdown
    FROM financial_transactions
    WHERE user_id = p_user_id
    AND type = 'expense'
    AND date >= p_start_date
    AND date <= p_end_date;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_revenue_by_period(p_user_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS TABLE(total_revenue numeric, revenue_breakdown jsonb, transaction_count integer)
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(amount), 0) as total_revenue,
        '[]'::jsonb as revenue_breakdown,
        COUNT(*)::integer as transaction_count
    FROM financial_transactions
    WHERE user_id = p_user_id
    AND type = 'income'
    AND date >= p_start_date
    AND date <= p_end_date;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_sales_from_orders(p_user_id uuid, p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS TABLE(total_sales numeric, completed_orders integer, pending_orders integer, cancelled_orders integer, average_order_value numeric, sales_breakdown jsonb)
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_pesanan ELSE 0 END), 0) as total_sales,
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::integer as completed_orders,
        COUNT(CASE WHEN status IN ('pending', 'confirmed', 'preparing', 'ready') THEN 1 END)::integer as pending_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::integer as cancelled_orders,
        CASE WHEN COUNT(CASE WHEN status = 'completed' THEN 1 END) > 0 
            THEN SUM(CASE WHEN status = 'completed' THEN total_pesanan ELSE 0 END) / COUNT(CASE WHEN status = 'completed' THEN 1 END)
            ELSE 0 END as average_order_value,
        '[]'::jsonb as sales_breakdown
    FROM orders
    WHERE user_id = p_user_id
    AND tanggal >= p_start_date
    AND tanggal <= p_end_date;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.pemakaian_bahan_daily_get()
 RETURNS SETOF pemakaian_bahan_daily
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT *
  FROM public.pemakaian_bahan_daily
  WHERE user_id = (SELECT auth.uid());
$function$
;

CREATE OR REPLACE FUNCTION public.recalculate_all_existing_wac(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(processed_purchases integer, processed_items integer, updated_materials integer, errors_count integer, processing_log text[])
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    purchase_record RECORD;
    purchase_item JSONB;
    item_id UUID;
    item_qty NUMERIC;
    item_price NUMERIC;
    wac_result RECORD;
    processed_purchases_count INTEGER := 0;
    processed_items_count INTEGER := 0;
    updated_materials_count INTEGER := 0;
    errors_count INTEGER := 0;
    processing_log TEXT[] := ARRAY[]::TEXT[];
    target_user_id UUID;
BEGIN
    -- If no user_id provided, process all users (admin only)
    target_user_id := p_user_id;
    
    processing_log := array_append(processing_log, 'Starting WAC recalculation process...');
    
    -- Process all completed purchases
    FOR purchase_record IN 
        SELECT id, user_id, items, supplier, total_nilai, tanggal
        FROM purchases 
        WHERE status = 'completed'
        AND (target_user_id IS NULL OR user_id = target_user_id)
        ORDER BY tanggal ASC, created_at ASC
    LOOP
        processed_purchases_count := processed_purchases_count + 1;
        processing_log := array_append(processing_log, 
            format('Processing purchase %s (%s items)', purchase_record.id, 
                CASE WHEN purchase_record.items IS NOT NULL THEN jsonb_array_length(purchase_record.items) ELSE 0 END));
        
        -- Process each item in the purchase
        IF purchase_record.items IS NOT NULL AND jsonb_typeof(purchase_record.items) = 'array' THEN
            
            FOR purchase_item IN SELECT * FROM jsonb_array_elements(purchase_record.items)
            LOOP
                processed_items_count := processed_items_count + 1;
                
                -- Extract item data with flexible field matching
                item_id := COALESCE(
                    (purchase_item->>'bahanBakuId')::UUID,
                    (purchase_item->>'bahan_baku_id')::UUID,
                    (purchase_item->>'id')::UUID
                );
                
                item_qty := COALESCE(
                    (purchase_item->>'kuantitas')::NUMERIC,
                    (purchase_item->>'jumlah')::NUMERIC,
                    0
                );
                
                item_price := COALESCE(
                    (purchase_item->>'hargaSatuan')::NUMERIC,
                    (purchase_item->>'harga_per_satuan')::NUMERIC,
                    (purchase_item->>'harga_satuan')::NUMERIC,
                    0
                );
                
                -- Only update if we have valid data
                IF item_id IS NOT NULL AND item_qty > 0 AND item_price > 0 THEN
                    
                    BEGIN
                        -- Call the existing update_wac_price function
                        SELECT * INTO wac_result 
                        FROM update_wac_price(item_id, purchase_record.user_id, item_qty, item_price);
                        
                        IF wac_result IS NOT NULL AND wac_result.success THEN
                            updated_materials_count := updated_materials_count + 1;
                            processing_log := array_append(processing_log,
                                format('Updated WAC for item %s: %s -> %s', 
                                    item_id, wac_result.old_wac, wac_result.new_wac));
                        ELSE
                            errors_count := errors_count + 1;
                            processing_log := array_append(processing_log,
                                format('Failed to update WAC for item: %s', item_id));
                        END IF;
                        
                    EXCEPTION WHEN OTHERS THEN
                        errors_count := errors_count + 1;
                        processing_log := array_append(processing_log,
                            format('Error updating item %s: %s', item_id, SQLERRM));
                    END;
                    
                ELSE
                    processing_log := array_append(processing_log,
                        format('Skipping invalid item data: id=%s qty=%s price=%s', 
                            item_id, item_qty, item_price));
                END IF;
                
            END LOOP;
            
        END IF;
        
    END LOOP;
    
    processing_log := array_append(processing_log, 'WAC recalculation process completed!');
    processing_log := array_append(processing_log,
        format('Summary - Purchases: %s, Items: %s, Updated: %s, Errors: %s',
            processed_purchases_count, processed_items_count, updated_materials_count, errors_count));
    
    RETURN QUERY SELECT 
        processed_purchases_count,
        processed_items_count, 
        updated_materials_count,
        errors_count,
        processing_log;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.record_material_usage(p_bahan_baku_id uuid, p_qty_base numeric, p_tanggal timestamp with time zone DEFAULT now(), p_harga_efektif numeric DEFAULT NULL::numeric, p_source_type character varying DEFAULT 'manual'::character varying, p_source_id uuid DEFAULT NULL::uuid, p_keterangan text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
    v_user_id uuid;
    v_usage_id uuid;
BEGIN
    -- Get user_id from bahan_baku
    SELECT user_id INTO v_user_id
    FROM bahan_baku
    WHERE id = p_bahan_baku_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Bahan baku tidak ditemukan';
    END IF;
    
    -- Insert usage record
    INSERT INTO pemakaian_bahan (
        user_id,
        bahan_baku_id,
        qty_base,
        tanggal,
        harga_efektif,
        source_type,
        source_id,
        keterangan
    ) VALUES (
        v_user_id,
        p_bahan_baku_id,
        p_qty_base,
        p_tanggal,
        p_harga_efektif,
        p_source_type,
        p_source_id,
        p_keterangan
    ) RETURNING id INTO v_usage_id;
    
    RETURN v_usage_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_user_id_from_auth()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_app_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_devices_last_active()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.last_active = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_profit_analysis_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_purchases_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_suppliers_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_id_by_email(p_email text)
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$
  select id from auth.users where email = p_email limit 1
$function$
;

create or replace view "public"."dual_mode_cost_summary" as  SELECT user_id,
    "group",
    status,
    count(*) AS cost_count,
    sum(jumlah_per_bulan) AS total_monthly,
    avg(jumlah_per_bulan) AS avg_monthly,
    max(jumlah_per_bulan) AS max_monthly,
    min(jumlah_per_bulan) AS min_monthly
   FROM operational_costs
  GROUP BY user_id, "group", status;


CREATE OR REPLACE FUNCTION public.month_bucket_utc(d date)
 RETURNS date
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
    SELECT date_trunc('month', d::timestamptz AT TIME ZONE 'UTC')::date;
$function$
;

CREATE OR REPLACE FUNCTION public.month_bucket_utc(ts timestamp with time zone)
 RETURNS timestamp with time zone
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'pg_catalog', 'public'
AS $function$
    SELECT date_trunc('month', ts);
$function$
;

create materialized view "public"."pemakaian_bahan_daily_mv" as  SELECT user_id,
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


CREATE OR REPLACE FUNCTION public.refresh_pemakaian_daily_mv()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- pakai CONCURRENTLY karena sudah ada unique index
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.pemakaian_bahan_daily_mv;
  RAISE NOTICE 'pemakaian_bahan_daily_mv refreshed successfully';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = TG_TABLE_SCHEMA
      and table_name   = TG_TABLE_NAME
      and column_name  = 'updated_at'
  ) then
    NEW.updated_at := now();
  end if;
  return NEW;
end;
$function$
;

create or replace view "public"."pemakaian_bahan_daily" as  SELECT user_id,
    date,
    total_hpp,
    usage_count,
    unique_materials,
    total_quantity,
    avg_effective_price,
    materialized_at
   FROM pemakaian_bahan_daily_mv
  WHERE (user_id = auth.uid());


CREATE INDEX idx_pemakaian_daily_mv_date ON public.pemakaian_bahan_daily_mv USING btree (date);

create policy "Users can delete their own savings goals"
on "public"."savings_goals"
as permissive
for delete
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Users can insert their own savings goals"
on "public"."savings_goals"
as permissive
for insert
to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Users can update their own savings goals"
on "public"."savings_goals"
as permissive
for update
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Users can view their own savings goals"
on "public"."savings_goals"
as permissive
for select
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


CREATE TRIGGER app_settings_update_updated_at BEFORE UPDATE ON public.app_settings FOR EACH ROW EXECUTE FUNCTION update_app_settings_updated_at();

CREATE TRIGGER devices_update_last_active BEFORE UPDATE ON public.devices FOR EACH ROW EXECUTE FUNCTION update_devices_last_active();

CREATE TRIGGER profit_analysis_update_updated_at BEFORE UPDATE ON public.profit_analysis FOR EACH ROW EXECUTE FUNCTION update_profit_analysis_updated_at();

CREATE TRIGGER purchases_update_updated_at BEFORE UPDATE ON public.purchases FOR EACH ROW EXECUTE FUNCTION update_purchases_updated_at();

CREATE TRIGGER trigger_auto_update_wac AFTER UPDATE ON public.purchases FOR EACH ROW WHEN ((old.status IS DISTINCT FROM new.status)) EXECUTE FUNCTION auto_update_wac_on_purchase_completion();

CREATE TRIGGER suppliers_update_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_suppliers_updated_at();

CREATE TRIGGER tr_set_user_id BEFORE INSERT ON public.user_settings FOR EACH ROW EXECUTE FUNCTION set_user_id_from_auth();

CREATE TRIGGER tr_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


