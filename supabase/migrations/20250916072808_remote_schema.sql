create extension if not exists "pg_trgm" with schema "extensions";


drop trigger if exists "app_settings_update_updated_at" on "public"."app_settings";

drop trigger if exists "trg_app_settings_updated_at" on "public"."app_settings";

drop policy "Users can delete own app settings" on "public"."app_settings";

drop policy "Users can insert own app settings" on "public"."app_settings";

drop policy "Users can update own app settings" on "public"."app_settings";

drop policy "Users can view own app settings" on "public"."app_settings";

alter table "public"."pemakaian_bahan" drop constraint "pemakaian_bahan_source_type_check";

drop function if exists "public"."reverse_order_completion"(order_id uuid);

drop index if exists "public"."idx_bahan_baku_kadaluwarsa";

drop index if exists "public"."idx_bahan_baku_low_stock_critical";

drop index if exists "public"."idx_bahan_baku_user_kategori_stok";

drop index if exists "public"."idx_fin_tx_user";

drop index if exists "public"."idx_financial_transactions_date_type";

drop index if exists "public"."idx_financial_transactions_date_user";

drop index if exists "public"."idx_pemakaian_bahan_tanggal_user";

drop index if exists "public"."idx_recipes_user";

create table "public"."invoice_items" (
    "id" uuid not null default gen_random_uuid(),
    "invoice_id" uuid not null,
    "item_name" character varying(255) not null,
    "description" text,
    "quantity" numeric(10,3) not null default 1,
    "unit_price" numeric(15,2) not null default 0,
    "total_price" numeric(15,2) not null default 0,
    "product_id" uuid,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone default now()
);


alter table "public"."invoice_items" enable row level security;

create table "public"."invoice_templates" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "name" character varying(100) not null,
    "template_type" character varying(20) not null,
    "is_default" boolean default false,
    "settings" jsonb default '{}'::jsonb,
    "company_logo_url" text,
    "company_name" character varying(255),
    "company_address" text,
    "company_phone" character varying(50),
    "company_email" character varying(255),
    "default_payment_instructions" text,
    "default_notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."invoice_templates" enable row level security;

create table "public"."invoices" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "invoice_number" character varying(50) not null,
    "order_id" uuid,
    "customer_name" character varying(255) not null,
    "customer_email" character varying(255),
    "customer_phone" character varying(50),
    "customer_address" text,
    "issue_date" date not null default CURRENT_DATE,
    "due_date" date,
    "subtotal" numeric(15,2) not null default 0,
    "discount_amount" numeric(15,2) default 0,
    "discount_percentage" numeric(5,2) default 0,
    "tax_amount" numeric(15,2) default 0,
    "tax_percentage" numeric(5,2) default 0,
    "shipping_amount" numeric(15,2) default 0,
    "total_amount" numeric(15,2) not null default 0,
    "status" character varying(20) default 'draft'::character varying,
    "currency" character varying(3) default 'IDR'::character varying,
    "notes" text,
    "payment_instructions" text,
    "auto_generated" boolean default false,
    "template_type" character varying(20) default 'modern'::character varying,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."invoices" enable row level security;

alter table "public"."app_updates" add column "description" text;

alter table "public"."user_settings" add column "whatsapp_type" character varying(20) not null default 'personal'::character varying;

drop extension if exists "pg_trgm";

CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items USING btree (invoice_id);

CREATE INDEX idx_invoice_items_sort_order ON public.invoice_items USING btree (invoice_id, sort_order);

CREATE INDEX idx_invoice_templates_default ON public.invoice_templates USING btree (user_id, is_default);

CREATE INDEX idx_invoice_templates_user_id ON public.invoice_templates USING btree (user_id);

CREATE INDEX idx_invoices_due_date ON public.invoices USING btree (due_date);

CREATE INDEX idx_invoices_invoice_number ON public.invoices USING btree (invoice_number);

CREATE INDEX idx_invoices_issue_date ON public.invoices USING btree (issue_date);

CREATE INDEX idx_invoices_order_id ON public.invoices USING btree (order_id);

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);

CREATE INDEX idx_invoices_user_id ON public.invoices USING btree (user_id);

CREATE UNIQUE INDEX invoice_items_pkey ON public.invoice_items USING btree (id);

CREATE UNIQUE INDEX invoice_templates_pkey ON public.invoice_templates USING btree (id);

CREATE UNIQUE INDEX invoices_pkey ON public.invoices USING btree (id);

alter table "public"."invoice_items" add constraint "invoice_items_pkey" PRIMARY KEY using index "invoice_items_pkey";

alter table "public"."invoice_templates" add constraint "invoice_templates_pkey" PRIMARY KEY using index "invoice_templates_pkey";

alter table "public"."invoices" add constraint "invoices_pkey" PRIMARY KEY using index "invoices_pkey";

alter table "public"."invoice_items" add constraint "invoice_items_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE not valid;

alter table "public"."invoice_items" validate constraint "invoice_items_invoice_id_fkey";

alter table "public"."invoice_items" add constraint "valid_item_amounts" CHECK (((quantity > (0)::numeric) AND (unit_price >= (0)::numeric) AND (total_price >= (0)::numeric))) not valid;

alter table "public"."invoice_items" validate constraint "valid_item_amounts";

alter table "public"."invoice_templates" add constraint "invoice_templates_template_type_check" CHECK (((template_type)::text = ANY ((ARRAY['modern'::character varying, 'classic'::character varying, 'minimal'::character varying])::text[]))) not valid;

alter table "public"."invoice_templates" validate constraint "invoice_templates_template_type_check";

alter table "public"."invoice_templates" add constraint "invoice_templates_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."invoice_templates" validate constraint "invoice_templates_user_id_fkey";

alter table "public"."invoices" add constraint "invoices_order_id_fkey" FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_order_id_fkey";

alter table "public"."invoices" add constraint "invoices_status_check" CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'sent'::character varying, 'paid'::character varying, 'overdue'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."invoices" validate constraint "invoices_status_check";

alter table "public"."invoices" add constraint "invoices_template_type_check" CHECK (((template_type)::text = ANY ((ARRAY['modern'::character varying, 'classic'::character varying, 'minimal'::character varying])::text[]))) not valid;

alter table "public"."invoices" validate constraint "invoices_template_type_check";

alter table "public"."invoices" add constraint "invoices_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."invoices" validate constraint "invoices_user_id_fkey";

alter table "public"."invoices" add constraint "valid_amounts" CHECK (((subtotal >= (0)::numeric) AND (discount_amount >= (0)::numeric) AND (tax_amount >= (0)::numeric) AND (shipping_amount >= (0)::numeric) AND (total_amount >= (0)::numeric))) not valid;

alter table "public"."invoices" validate constraint "valid_amounts";

alter table "public"."invoices" add constraint "valid_percentages" CHECK (((discount_percentage >= (0)::numeric) AND (discount_percentage <= (100)::numeric) AND (tax_percentage >= (0)::numeric) AND (tax_percentage <= (100)::numeric))) not valid;

alter table "public"."invoices" validate constraint "valid_percentages";

alter table "public"."user_settings" add constraint "check_whatsapp_type" CHECK (((whatsapp_type)::text = ANY ((ARRAY['personal'::character varying, 'business'::character varying])::text[]))) not valid;

alter table "public"."user_settings" validate constraint "check_whatsapp_type";

alter table "public"."pemakaian_bahan" add constraint "pemakaian_bahan_source_type_check" CHECK (((source_type)::text = ANY ((ARRAY['manual'::character varying, 'recipe'::character varying, 'order'::character varying, 'production'::character varying])::text[]))) not valid;

alter table "public"."pemakaian_bahan" validate constraint "pemakaian_bahan_source_type_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.create_invoice_from_order(p_order_id uuid, p_template_type character varying DEFAULT 'modern'::character varying)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  order_record record;
  new_invoice_id uuid;
  item_record record;
BEGIN
  -- Get order data
  SELECT * INTO order_record
  FROM public.orders 
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;
  
  -- Generate invoice number
  DECLARE
    invoice_num varchar(50);
  BEGIN
    SELECT generate_invoice_number(order_record.user_id) INTO invoice_num;
    
    -- Create invoice
    INSERT INTO public.invoices (
      user_id,
      invoice_number,
      order_id,
      customer_name,
      customer_email,
      customer_phone,
      customer_address,
      issue_date,
      due_date,
      subtotal,
      tax_amount,
      total_amount,
      status,
      template_type,
      auto_generated,
      notes
    ) VALUES (
      order_record.user_id,
      invoice_num,
      p_order_id,
      order_record.nama_pelanggan,
      order_record.email_pelanggan,
      order_record.telepon_pelanggan,
      order_record.alamat_pengiriman,
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '30 days', -- 30 days payment term
      COALESCE(order_record.subtotal, 0),
      COALESCE(order_record.pajak, 0),
      COALESCE(order_record.total_pesanan, 0),
      'draft',
      p_template_type,
      true,
      'Invoice dibuat otomatis dari pesanan ' || order_record.nomor_pesanan
    ) RETURNING id INTO new_invoice_id;
    
    -- Create invoice items from order items
    IF order_record.items IS NOT NULL AND jsonb_array_length(order_record.items) > 0 THEN
      FOR item_record IN 
        SELECT 
          (item->>'namaBarang')::varchar as item_name,
          (item->>'quantity')::decimal as quantity,
          (item->>'hargaSatuan')::decimal as unit_price,
          ((item->>'quantity')::decimal * (item->>'hargaSatuan')::decimal) as total_price
        FROM jsonb_array_elements(order_record.items) as item
      LOOP
        INSERT INTO public.invoice_items (
          invoice_id,
          item_name,
          quantity,
          unit_price,
          total_price
        ) VALUES (
          new_invoice_id,
          COALESCE(item_record.item_name, 'Item'),
          COALESCE(item_record.quantity, 1),
          COALESCE(item_record.unit_price, 0),
          COALESCE(item_record.total_price, 0)
        );
      END LOOP;
    END IF;
    
    RETURN new_invoice_id;
  END;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_invoice_number(p_user_id uuid)
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  next_number integer;
  invoice_number varchar(50);
BEGIN
  -- Get the next sequence number for this user
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ '^INV-[0-9]{4}-[0-9]+$' 
      THEN CAST(split_part(invoice_number, '-', 3) AS integer)
      ELSE 0
    END
  ), 0) + 1
  INTO next_number
  FROM public.invoices 
  WHERE user_id = p_user_id;
  
  -- Format: INV-YYYY-NNNN
  invoice_number := 'INV-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(next_number::text, 4, '0');
  
  RETURN invoice_number;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_per_unit_costs_only(p_user_id uuid, p_overhead_per_pcs numeric, p_operasional_per_pcs numeric)
 RETURNS app_settings
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  result public.app_settings;
begin
  update public.app_settings
  set overhead_per_pcs    = p_overhead_per_pcs,
      operasional_per_pcs = p_operasional_per_pcs,
      updated_at          = now()
  where user_id = p_user_id
  returning * into result;

  if result is null then
    insert into public.app_settings (
      user_id, target_output_monthly, overhead_per_pcs, operasional_per_pcs, updated_at
    ) values (
      p_user_id, 1000.00, p_overhead_per_pcs, p_operasional_per_pcs, now()
    )
    returning * into result;
  end if;

  return result;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_target_output_safe(p_user_id uuid, p_target_output numeric)
 RETURNS app_settings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  result app_settings;
BEGIN
  -- Validate inputs
  IF p_target_output <= 0 THEN
    RAISE EXCEPTION 'Target output must be greater than 0';
  END IF;
  
  -- Upsert with explicit values
  INSERT INTO app_settings (
    user_id,
    target_output_monthly,
    overhead_per_pcs,
    operasional_per_pcs,
    updated_at
  ) VALUES (
    p_user_id,
    p_target_output,
    0.00, -- Will be calculated separately
    0.00, -- Will be calculated separately
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    target_output_monthly = EXCLUDED.target_output_monthly,
    updated_at = EXCLUDED.updated_at
  RETURNING * INTO result;
  
  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.can_complete_order(order_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_owner UUID;
  v_ingredient RECORD;
  v_insufficient_stock TEXT[] := '{}';
  v_total_items INTEGER := 0;
  v_available_items INTEGER := 0;
BEGIN
  SELECT o.user_id INTO v_owner FROM public.orders o WHERE o.id = order_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', order_id;
  END IF;
  IF v_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Access denied for order: %', order_id;
  END IF;

  FOR v_ingredient IN
    SELECT * FROM public.get_recipe_ingredients_for_order(order_id)
  LOOP
    v_total_items := v_total_items + 1;
    IF v_ingredient.current_stock >= v_ingredient.total_required THEN
      v_available_items := v_available_items + 1;
    ELSE
      v_insufficient_stock := v_insufficient_stock ||
        json_build_object(
          'item', v_ingredient.bahan_nama,
          'required', v_ingredient.total_required,
          'available', v_ingredient.current_stock,
          'unit', v_ingredient.satuan,
          'shortage', v_ingredient.total_required - v_ingredient.current_stock
        )::TEXT;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'can_complete', COALESCE(array_length(v_insufficient_stock, 1), 0) = 0,
    'total_ingredients', v_total_items,
    'available_ingredients', v_available_items,
    'insufficient_stock', v_insufficient_stock
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.complete_order_and_deduct_stock(order_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_order RECORD;
  v_ingredient RECORD;
  v_user_id UUID;
  v_total_amount NUMERIC;
  v_financial_transaction_id UUID;
  v_insufficient_stock TEXT[] := '{}';
  v_updated_items INTEGER := 0;
  v_pemakaian_items INTEGER := 0;
  v_result JSON;
  v_completion_date DATE := CURRENT_DATE;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', order_id;
  END IF;
  IF v_order.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Access denied for order: %', order_id;
  END IF;

  IF v_order.status = 'completed' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Order is already completed',
      'order_id', order_id
    );
  END IF;

  v_user_id := v_order.user_id;
  v_total_amount := v_order.total_pesanan;

  -- Validate stock sufficiency
  FOR v_ingredient IN SELECT * FROM public.get_recipe_ingredients_for_order(order_id)
  LOOP
    IF v_ingredient.current_stock < v_ingredient.total_required THEN
      v_insufficient_stock := v_insufficient_stock ||
        format('%s: butuh %s, tersedia %s %s',
               v_ingredient.bahan_nama,
               v_ingredient.total_required::TEXT,
               v_ingredient.current_stock::TEXT,
               v_ingredient.satuan);
    END IF;
  END LOOP;

  IF COALESCE(array_length(v_insufficient_stock, 1), 0) > 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient stock',
      'details', v_insufficient_stock,
      'order_id', order_id
    );
  END IF;

  -- Deduct stock and record COGS (pemakaian_bahan) 
  FOR v_ingredient IN SELECT * FROM public.get_recipe_ingredients_for_order(order_id)
  LOOP
    UPDATE public.bahan_baku
      SET stok = stok - v_ingredient.total_required,
          updated_at = CURRENT_TIMESTAMP
    WHERE id = v_ingredient.warehouse_item_id;

    v_updated_items := v_updated_items + 1;

    -- Record COGS usage (hanya jika table pemakaian_bahan ada)
    BEGIN
      INSERT INTO public.pemakaian_bahan (
        id, user_id, bahan_baku_id, qty_base, satuan, tanggal,
        source_type, source_id, harga_efektif, hpp_value,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), v_user_id, v_ingredient.warehouse_item_id,
        v_ingredient.total_required, v_ingredient.satuan, v_completion_date,
        'order', order_id,
        COALESCE((SELECT COALESCE(bb.harga_rata_rata, bb.harga_satuan, 0)
                  FROM public.bahan_baku bb WHERE bb.id = v_ingredient.warehouse_item_id), 0),
        v_ingredient.total_required * COALESCE((SELECT COALESCE(bb.harga_rata_rata, bb.harga_satuan, 0)
                  FROM public.bahan_baku bb WHERE bb.id = v_ingredient.warehouse_item_id), 0),
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      );
      v_pemakaian_items := v_pemakaian_items + 1;
    EXCEPTION
      WHEN others THEN
        -- Jika table pemakaian_bahan tidak ada, skip saja
        NULL;
    END;
  END LOOP;

  -- Financial transaction (income) - sesuai schema yang benar
  INSERT INTO public.financial_transactions (
    id, user_id, type, category, amount, description, date,
    related_id, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id, 'income', 'Penjualan Produk', v_total_amount,
    format('Pesanan %s - %s', v_order.nomor_pesanan, v_order.nama_pelanggan),
    v_completion_date::timestamp with time zone,
    order_id::text,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ) RETURNING id INTO v_financial_transaction_id;

  -- Mark order as completed
  UPDATE public.orders
    SET status = 'completed', 
        tanggal_selesai = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
  WHERE id = order_id;

  -- Activity logs (hanya jika table activities ada)
  BEGIN
    INSERT INTO public.activities (id, user_id, title, description, type, value, created_at, updated_at)
    VALUES (
      gen_random_uuid(), v_user_id,
      'Pesanan Selesai',
      format('Pesanan #%s selesai. Stok diperbarui.', v_order.nomor_pesanan),
      'order', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );
  EXCEPTION
    WHEN others THEN NULL;
  END;

  RETURN json_build_object(
    'success', true,
    'message', 'Order completed successfully',
    'order_id', order_id,
    'order_number', v_order.nomor_pesanan,
    'total_amount', v_total_amount,
    'stock_items_updated', v_updated_items,
    'pemakaian_items_recorded', v_pemakaian_items,
    'financial_transaction_id', v_financial_transaction_id
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_recipe_ingredients_for_order(order_id uuid)
 RETURNS TABLE(warehouse_item_id uuid, bahan_nama text, total_required numeric, satuan text, current_stock numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_owner UUID;
BEGIN
  SELECT o.user_id INTO v_owner FROM public.orders o WHERE o.id = order_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', order_id;
  END IF;
  IF v_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Access denied for order: %', order_id;
  END IF;

  RETURN QUERY
  WITH order_items AS (
    SELECT jsonb_array_elements(o.items) AS item_data
    FROM public.orders o
    WHERE o.id = order_id 
      AND o.items IS NOT NULL 
      AND jsonb_typeof(o.items) = 'array'
  ),
  recipe_items AS (
    SELECT
      (item_data->>'recipeId')::UUID AS recipe_id,
      (item_data->>'quantity')::INTEGER AS order_quantity,
      (item_data->>'isFromRecipe')::BOOLEAN AS is_from_recipe
    FROM order_items
    WHERE (item_data->>'isFromRecipe')::BOOLEAN = true
      AND item_data->>'recipeId' IS NOT NULL
      AND item_data->>'recipeId' != 'null'
  ),
  recipe_ingredients AS (
    SELECT
      ri.recipe_id,
      ri.order_quantity,
      jsonb_array_elements(r.bahan_resep) AS ingredient_data
    FROM recipe_items ri
    JOIN public.recipes r ON r.id = ri.recipe_id
    WHERE r.bahan_resep IS NOT NULL 
      AND jsonb_typeof(r.bahan_resep) = 'array'
  ),
  ingredient_requirements AS (
    SELECT
      (ingredient_data->>'warehouseId')::UUID AS warehouse_item_id,
      ingredient_data->>'nama' AS bahan_nama,
      (ingredient_data->>'jumlah')::NUMERIC * order_quantity AS total_required,
      ingredient_data->>'satuan' AS satuan
    FROM recipe_ingredients
    WHERE ingredient_data->>'warehouseId' IS NOT NULL
      AND ingredient_data->>'warehouseId' != 'null'
      AND ingredient_data->>'nama' IS NOT NULL
  )
  SELECT
    ir.warehouse_item_id,
    ir.bahan_nama,
    SUM(ir.total_required) AS total_required,
    ir.satuan,
    COALESCE(bb.stok, 0) AS current_stock
  FROM ingredient_requirements ir
  LEFT JOIN public.bahan_baku bb ON bb.id = ir.warehouse_item_id
  GROUP BY ir.warehouse_item_id, ir.bahan_nama, ir.satuan, bb.stok;
END;
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

CREATE UNIQUE INDEX idx_pemakaian_daily_mv_user_date ON public.pemakaian_bahan_daily_mv USING btree (user_id, date);

grant delete on table "public"."invoice_items" to "anon";

grant insert on table "public"."invoice_items" to "anon";

grant references on table "public"."invoice_items" to "anon";

grant select on table "public"."invoice_items" to "anon";

grant trigger on table "public"."invoice_items" to "anon";

grant truncate on table "public"."invoice_items" to "anon";

grant update on table "public"."invoice_items" to "anon";

grant delete on table "public"."invoice_items" to "authenticated";

grant insert on table "public"."invoice_items" to "authenticated";

grant references on table "public"."invoice_items" to "authenticated";

grant select on table "public"."invoice_items" to "authenticated";

grant trigger on table "public"."invoice_items" to "authenticated";

grant truncate on table "public"."invoice_items" to "authenticated";

grant update on table "public"."invoice_items" to "authenticated";

grant delete on table "public"."invoice_items" to "service_role";

grant insert on table "public"."invoice_items" to "service_role";

grant references on table "public"."invoice_items" to "service_role";

grant select on table "public"."invoice_items" to "service_role";

grant trigger on table "public"."invoice_items" to "service_role";

grant truncate on table "public"."invoice_items" to "service_role";

grant update on table "public"."invoice_items" to "service_role";

grant delete on table "public"."invoice_templates" to "anon";

grant insert on table "public"."invoice_templates" to "anon";

grant references on table "public"."invoice_templates" to "anon";

grant select on table "public"."invoice_templates" to "anon";

grant trigger on table "public"."invoice_templates" to "anon";

grant truncate on table "public"."invoice_templates" to "anon";

grant update on table "public"."invoice_templates" to "anon";

grant delete on table "public"."invoice_templates" to "authenticated";

grant insert on table "public"."invoice_templates" to "authenticated";

grant references on table "public"."invoice_templates" to "authenticated";

grant select on table "public"."invoice_templates" to "authenticated";

grant trigger on table "public"."invoice_templates" to "authenticated";

grant truncate on table "public"."invoice_templates" to "authenticated";

grant update on table "public"."invoice_templates" to "authenticated";

grant delete on table "public"."invoice_templates" to "service_role";

grant insert on table "public"."invoice_templates" to "service_role";

grant references on table "public"."invoice_templates" to "service_role";

grant select on table "public"."invoice_templates" to "service_role";

grant trigger on table "public"."invoice_templates" to "service_role";

grant truncate on table "public"."invoice_templates" to "service_role";

grant update on table "public"."invoice_templates" to "service_role";

grant delete on table "public"."invoices" to "anon";

grant insert on table "public"."invoices" to "anon";

grant references on table "public"."invoices" to "anon";

grant select on table "public"."invoices" to "anon";

grant trigger on table "public"."invoices" to "anon";

grant truncate on table "public"."invoices" to "anon";

grant update on table "public"."invoices" to "anon";

grant delete on table "public"."invoices" to "authenticated";

grant insert on table "public"."invoices" to "authenticated";

grant references on table "public"."invoices" to "authenticated";

grant select on table "public"."invoices" to "authenticated";

grant trigger on table "public"."invoices" to "authenticated";

grant truncate on table "public"."invoices" to "authenticated";

grant update on table "public"."invoices" to "authenticated";

grant delete on table "public"."invoices" to "service_role";

grant insert on table "public"."invoices" to "service_role";

grant references on table "public"."invoices" to "service_role";

grant select on table "public"."invoices" to "service_role";

grant trigger on table "public"."invoices" to "service_role";

grant truncate on table "public"."invoices" to "service_role";

grant update on table "public"."invoices" to "service_role";

create policy "Users can create own invoice items"
on "public"."invoice_items"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.user_id = auth.uid())))));


create policy "Users can delete own invoice items"
on "public"."invoice_items"
as permissive
for delete
to authenticated
using ((EXISTS ( SELECT 1
   FROM invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.user_id = auth.uid())))));


create policy "Users can update own invoice items"
on "public"."invoice_items"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.user_id = auth.uid())))));


create policy "Users can view own invoice items"
on "public"."invoice_items"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM invoices
  WHERE ((invoices.id = invoice_items.invoice_id) AND (invoices.user_id = auth.uid())))));


create policy "Users can create own templates"
on "public"."invoice_templates"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete own templates"
on "public"."invoice_templates"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update own templates"
on "public"."invoice_templates"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own templates"
on "public"."invoice_templates"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can create own invoices"
on "public"."invoices"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can delete own invoices"
on "public"."invoices"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "Users can update own invoices"
on "public"."invoices"
as permissive
for update
to public
using ((auth.uid() = user_id));


create policy "Users can view own invoices"
on "public"."invoices"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Users can delete own app settings"
on "public"."app_settings"
as permissive
for delete
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Users can insert own app settings"
on "public"."app_settings"
as permissive
for insert
to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Users can update own app settings"
on "public"."app_settings"
as permissive
for update
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));


create policy "Users can view own app settings"
on "public"."app_settings"
as permissive
for select
to authenticated
using ((user_id = ( SELECT auth.uid() AS uid)));


CREATE TRIGGER update_invoice_templates_updated_at BEFORE UPDATE ON public.invoice_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


