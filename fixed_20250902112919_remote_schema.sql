-- This file is the corrected version of 20250902112919_remote_schema.sql
-- with the pemakaian_bahan_daily_get() function moved AFTER the creation of the view.

-- Create helper script to detect and fix the problematic order
DO $$
BEGIN
    -- First drop the problematic function if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'pemakaian_bahan_daily_get') THEN
        DROP FUNCTION IF EXISTS public.pemakaian_bahan_daily_get();
    END IF;
END $$;

-- Continue with the original migration file...
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

-- Other alterations and functions continue as in the original file
-- ...

-- BUT here's the important part: Create materialized view FIRST
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


-- THEN Create the refresh function for the materialized view
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
$function$;

-- THEN Create the view that depends on the materialized view
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


-- FINALLY Create the function that depends on the view
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

-- Add other missing indexes 
CREATE INDEX idx_pemakaian_daily_mv_date ON public.pemakaian_bahan_daily_mv USING btree (date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pemakaian_daily_mv_user_date ON public.pemakaian_bahan_daily_mv USING btree (user_id, date);

-- Continue with other policies and triggers
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


-- GRANT all necessary permissions
GRANT ALL ON TABLE public.pemakaian_bahan_daily_mv TO anon;
GRANT ALL ON TABLE public.pemakaian_bahan_daily_mv TO authenticated; 
GRANT ALL ON TABLE public.pemakaian_bahan_daily_mv TO service_role;
