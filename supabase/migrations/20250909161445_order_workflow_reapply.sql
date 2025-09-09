-- 20250909161445_order_workflow_reapply.sql
-- Purpose: Re-apply secure order completion workflow functions in case previous version already exists
-- This migration is idempotent due to DROP ... IF EXISTS and CREATE OR REPLACE, plus IF NOT EXISTS on indexes.

BEGIN;

-- Ensure clean state
DROP FUNCTION IF EXISTS public.get_recipe_ingredients_for_order(uuid);
DROP FUNCTION IF EXISTS public.can_complete_order(uuid);
DROP FUNCTION IF EXISTS public.complete_order_and_deduct_stock(uuid);
DROP FUNCTION IF EXISTS public.reverse_order_completion(uuid);

-- Recreate functions (same definitions as previous migration)

CREATE OR REPLACE FUNCTION public.get_recipe_ingredients_for_order(order_id UUID)
RETURNS TABLE (
  warehouse_item_id UUID,
  bahan_nama TEXT,
  total_required NUMERIC,
  satuan TEXT,
  current_stock NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_owner UUID;
BEGIN
  SELECT o.user_id INTO v_owner FROM public.orders o WHERE o.id = order_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Order not found: %', order_id; END IF;
  IF v_owner IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Access denied for order: %', order_id; END IF;

  RETURN QUERY
  WITH order_items AS (
    SELECT json_array_elements(o.items) AS item_data FROM public.orders o WHERE o.id = order_id
  ),
  recipe_items AS (
    SELECT (item_data->>'recipeId')::UUID AS recipe_id,
           (item_data->>'quantity')::INTEGER AS order_quantity,
           (item_data->>'isFromRecipe')::BOOLEAN AS is_from_recipe
    FROM order_items
    WHERE (item_data->>'isFromRecipe')::BOOLEAN = true AND item_data->>'recipeId' IS NOT NULL
  ),
  recipe_ingredients AS (
    SELECT ri.recipe_id, ri.order_quantity, json_array_elements(hr.bahan_resep) AS ingredient_data
    FROM recipe_items ri JOIN public.hpp_recipes hr ON hr.id = ri.recipe_id
  ),
  ingredient_requirements AS (
    SELECT (ingredient_data->>'warehouseId')::UUID AS warehouse_item_id,
           ingredient_data->>'nama' AS bahan_nama,
           (ingredient_data->>'jumlah')::NUMERIC * order_quantity AS total_required,
           ingredient_data->>'satuan' AS satuan
    FROM recipe_ingredients WHERE ingredient_data->>'warehouseId' IS NOT NULL
  )
  SELECT ir.warehouse_item_id, ir.bahan_nama, SUM(ir.total_required) AS total_required, ir.satuan,
         COALESCE(bb.stok, 0) AS current_stock
  FROM ingredient_requirements ir
  LEFT JOIN public.bahan_baku bb ON bb.id = ir.warehouse_item_id
  GROUP BY ir.warehouse_item_id, ir.bahan_nama, ir.satuan, bb.stok;
END;$$;
GRANT EXECUTE ON FUNCTION public.get_recipe_ingredients_for_order(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_complete_order(order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_owner UUID;
  v_ingredient RECORD;
  v_insufficient_stock TEXT[] := '{}';
  v_total_items INTEGER := 0;
  v_available_items INTEGER := 0;
BEGIN
  SELECT o.user_id INTO v_owner FROM public.orders o WHERE o.id = order_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Order not found: %', order_id; END IF;
  IF v_owner IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Access denied for order: %', order_id; END IF;

  FOR v_ingredient IN SELECT * FROM public.get_recipe_ingredients_for_order(order_id)
  LOOP
    v_total_items := v_total_items + 1;
    IF v_ingredient.current_stock >= v_ingredient.total_required THEN
      v_available_items := v_available_items + 1;
    ELSE
      v_insufficient_stock := v_insufficient_stock ||
        json_build_object('item', v_ingredient.bahan_nama,
                          'required', v_ingredient.total_required,
                          'available', v_ingredient.current_stock,
                          'unit', v_ingredient.satuan,
                          'shortage', v_ingredient.total_required - v_ingredient.current_stock)::TEXT;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'can_complete', COALESCE(array_length(v_insufficient_stock, 1), 0) = 0,
    'total_ingredients', v_total_items,
    'available_ingredients', v_available_items,
    'insufficient_stock', v_insufficient_stock
  );
END;$$;
GRANT EXECUTE ON FUNCTION public.can_complete_order(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_order_and_deduct_stock(order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
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
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found: %', order_id; END IF;
  IF v_order.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Access denied for order: %', order_id; END IF;

  IF v_order.status = 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Order is already completed', 'order_id', order_id);
  END IF;

  v_user_id := v_order.user_id;
  v_total_amount := v_order.total_pesanan;

  FOR v_ingredient IN SELECT * FROM public.get_recipe_ingredients_for_order(order_id)
  LOOP
    IF v_ingredient.current_stock < v_ingredient.total_required THEN
      v_insufficient_stock := v_insufficient_stock ||
        format('%s: butuh %s, tersedia %s %s', v_ingredient.bahan_nama, v_ingredient.total_required::TEXT, v_ingredient.current_stock::TEXT, v_ingredient.satuan);
    END IF;
  END LOOP;

  IF COALESCE(array_length(v_insufficient_stock, 1), 0) > 0 THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient stock', 'details', v_insufficient_stock, 'order_id', order_id);
  END IF;

  FOR v_ingredient IN SELECT * FROM public.get_recipe_ingredients_for_order(order_id)
  LOOP
    UPDATE public.bahan_baku SET stok = stok - v_ingredient.total_required, updated_at = CURRENT_TIMESTAMP
    WHERE id = v_ingredient.warehouse_item_id;
    v_updated_items := v_updated_items + 1;

    INSERT INTO public.pemakaian_bahan (
      id, user_id, bahan_baku_id, qty_base, satuan, tanggal, source_type, source_id, harga_efektif, hpp_value, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_user_id, v_ingredient.warehouse_item_id, v_ingredient.total_required, v_ingredient.satuan, v_completion_date,
      'order', order_id,
      COALESCE((SELECT COALESCE(bb.harga_rata_rata, bb.harga_satuan, 0) FROM public.bahan_baku bb WHERE bb.id = v_ingredient.warehouse_item_id), 0),
      v_ingredient.total_required * COALESCE((SELECT COALESCE(bb.harga_rata_rata, bb.harga_satuan, 0) FROM public.bahan_baku bb WHERE bb.id = v_ingredient.warehouse_item_id), 0),
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    );

    INSERT INTO public.activities (id, user_id, title, description, type, value, created_at, updated_at)
    VALUES (gen_random_uuid(), v_user_id, 'Stok Berkurang',
            format('Stok %s berkurang %s %s untuk pesanan #%s', v_ingredient.bahan_nama, v_ingredient.total_required::TEXT, v_ingredient.satuan, v_order.nomor_pesanan),
            'stok', v_ingredient.total_required::TEXT, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  END LOOP;

  INSERT INTO public.financial_transactions (
    id, user_id, type, category, amount, description, date, notes, related_id, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), v_user_id, 'income', 'Penjualan Produk', v_total_amount,
    format('Pesanan %s', v_order.nomor_pesanan), v_completion_date, format('Order completion untuk %s', v_order.nama_pelanggan), order_id,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ) RETURNING id INTO v_financial_transaction_id;

  UPDATE public.orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = order_id;

  INSERT INTO public.activities (id, user_id, title, description, type, value, created_at, updated_at)
  VALUES (gen_random_uuid(), v_user_id, 'Pesanan Selesai',
          format('Pesanan #%s selesai. Stok diperbarui, COGS dicatat.', v_order.nomor_pesanan), 'order', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

  INSERT INTO public.activities (id, user_id, title, description, type, value, created_at, updated_at)
  VALUES (gen_random_uuid(), v_user_id, 'Transaksi Keuangan Ditambahkan',
          format('Pemasukan Rp %s', TRIM(TO_CHAR(v_total_amount, '999,999,999,999.00'))), 'keuangan', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

  INSERT INTO public.activities (id, user_id, title, description, type, value, created_at, updated_at)
  VALUES (gen_random_uuid(), v_user_id, 'COGS Dicatat',
          format('Pemakaian bahan untuk pesanan #%s dicatat', v_order.nomor_pesanan), 'profit', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

  RETURN json_build_object(
    'success', true,
    'message', 'Order completed successfully with COGS tracking',
    'order_id', order_id,
    'order_number', v_order.nomor_pesanan,
    'total_amount', v_total_amount,
    'stock_items_updated', v_updated_items,
    'financial_transaction_id', v_financial_transaction_id
  );
END;$$;
GRANT EXECUTE ON FUNCTION public.complete_order_and_deduct_stock(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.reverse_order_completion(order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_ingredient RECORD;
  v_user_id UUID;
  v_reversed_items INTEGER := 0;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found: %', order_id; END IF;
  IF v_order.user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Access denied for order: %', order_id; END IF;

  IF v_order.status <> 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Order is not completed, cannot reverse');
  END IF;

  v_user_id := v_order.user_id;

  FOR v_ingredient IN SELECT * FROM public.get_recipe_ingredients_for_order(order_id)
  LOOP
    UPDATE public.bahan_baku SET stok = stok + v_ingredient.total_required, updated_at = CURRENT_TIMESTAMP
    WHERE id = v_ingredient.warehouse_item_id;
    v_reversed_items := v_reversed_items + 1;
  END LOOP;

  UPDATE public.orders SET status = 'ready', updated_at = CURRENT_TIMESTAMP WHERE id = order_id;

  UPDATE public.financial_transactions
    SET description = description || ' [REVERSED]',
        notes = COALESCE(notes, '') || format(' - Order completion reversed on %s', CURRENT_TIMESTAMP),
        updated_at = CURRENT_TIMESTAMP
  WHERE related_id = order_id AND type = 'income';

  INSERT INTO public.activities (id, user_id, title, description, type, value, created_at, updated_at)
  VALUES (gen_random_uuid(), v_user_id, 'Pesanan Direverse',
          format('Pesanan #%s completion dibatalkan, stok dikembalikan.', v_order.nomor_pesanan), 'order', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

  RETURN json_build_object('success', true, 'message', 'Order completion reversed successfully', 'order_id', order_id, 'stock_items_restored', v_reversed_items);
END;$$;
GRANT EXECUTE ON FUNCTION public.reverse_order_completion(uuid) TO authenticated;

-- Idempotent indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_related ON public.financial_transactions(related_id);
CREATE INDEX IF NOT EXISTS idx_bahan_baku_stok_alert ON public.bahan_baku(stok) WHERE stok <= minimum;
CREATE INDEX IF NOT EXISTS idx_pemakaian_bahan_user_date ON public.pemakaian_bahan(user_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_pemakaian_bahan_source ON public.pemakaian_bahan(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_pemakaian_bahan_bahan_date ON public.pemakaian_bahan(bahan_baku_id, tanggal);

COMMIT;

