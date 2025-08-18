-- =====================================
-- WAC (Weighted Average Cost) Database Trigger
-- =====================================
-- This trigger automatically updates warehouse stock and calculates 
-- weighted average cost when purchases are completed, modified, or deleted

-- First, add missing columns if they don't exist
DO $$
BEGIN
  -- Add applied_at column to track when purchase was applied to stock
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'applied_at'
  ) THEN
    ALTER TABLE public.purchases ADD COLUMN applied_at TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Remove duplicate harga_rata2 column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bahan_baku' AND column_name = 'harga_rata2'
  ) THEN
    ALTER TABLE public.bahan_baku DROP COLUMN harga_rata2;
  END IF;

  -- Add harga_rata_rata column for WAC if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bahan_baku' AND column_name = 'harga_rata_rata'
  ) THEN
    ALTER TABLE public.bahan_baku ADD COLUMN harga_rata_rata NUMERIC(15,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Create WAC calculation function
CREATE OR REPLACE FUNCTION calculate_warehouse_wac(
  p_bahan_baku_id UUID,
  p_user_id UUID,
  p_new_qty NUMERIC,
  p_new_price NUMERIC
) RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  current_stock NUMERIC := 0;
  current_wac NUMERIC := 0;
  current_unit_price NUMERIC := 0;
  new_wac NUMERIC := 0;
  total_value NUMERIC := 0;
  new_total_stock NUMERIC := 0;
BEGIN
  -- Get current warehouse data
  SELECT 
    COALESCE(stok, 0),
    COALESCE(harga_rata_rata, 0),
    COALESCE(harga_satuan, 0)
  INTO current_stock, current_wac, current_unit_price
  FROM bahan_baku 
  WHERE id = p_bahan_baku_id AND user_id = p_user_id;
  
  -- If no existing record, return the new price as WAC
  IF NOT FOUND OR current_stock <= 0 THEN
    RETURN GREATEST(p_new_price, 0);
  END IF;
  
  -- Use WAC if available, otherwise use unit price
  current_wac := CASE 
    WHEN current_wac > 0 THEN current_wac 
    ELSE current_unit_price 
  END;
  
  -- Calculate new weighted average cost
  -- WAC = (current_stock * current_wac + new_qty * new_price) / (current_stock + new_qty)
  new_total_stock := current_stock + p_new_qty;
  
  IF new_total_stock > 0 THEN
    total_value := (current_stock * current_wac) + (p_new_qty * p_new_price);
    new_wac := total_value / new_total_stock;
  ELSE
    new_wac := current_wac;
  END IF;
  
  RETURN GREATEST(new_wac, 0);
END;
$$;

-- Create function to apply purchase to warehouse
CREATE OR REPLACE FUNCTION apply_purchase_to_warehouse(
  purchase_record purchases
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  item JSONB;
  bahan_id UUID;
  qty NUMERIC;
  unit_price NUMERIC;
  new_wac NUMERIC;
  existing_stock NUMERIC;
BEGIN
  -- Process each item in the purchase
  FOR item IN SELECT * FROM jsonb_array_elements(purchase_record.items)
  LOOP
    -- Extract item data
    bahan_id := COALESCE((item->>'bahan_baku_id')::UUID, NULL);
    qty := COALESCE((item->>'jumlah')::NUMERIC, 0);
    unit_price := COALESCE((item->>'harga_per_satuan')::NUMERIC, 0);
    
    -- Skip if invalid data
    IF bahan_id IS NULL OR qty <= 0 OR unit_price <= 0 THEN
      CONTINUE;
    END IF;
    
    -- Calculate new WAC
    new_wac := calculate_warehouse_wac(
      bahan_id, 
      purchase_record.user_id, 
      qty, 
      unit_price
    );
    
    -- Update warehouse stock and WAC
    UPDATE bahan_baku 
    SET 
      stok = COALESCE(stok, 0) + qty,
      harga_rata_rata = new_wac,
      updated_at = now()
    WHERE id = bahan_id AND user_id = purchase_record.user_id;
    
    -- If bahan doesn't exist, create it (fallback)
    IF NOT FOUND THEN
      INSERT INTO bahan_baku (
        user_id, 
        nama, 
        kategori,
        stok, 
        minimum,
        satuan, 
        harga_satuan, 
        harga_rata_rata,
        supplier,
        created_at,
        updated_at
      ) VALUES (
        purchase_record.user_id,
        COALESCE((item->>'nama')::TEXT, 'Unknown Item'),
        'Purchased Item',
        qty,
        0,
        COALESCE((item->>'satuan')::TEXT, 'pcs'),
        unit_price,
        new_wac,
        purchase_record.supplier,
        now(),
        now()
      )
      ON CONFLICT (id) DO NOTHING; -- Avoid duplicate key errors
    END IF;
  END LOOP;
  
  -- Mark purchase as applied
  UPDATE purchases 
  SET applied_at = now() 
  WHERE id = purchase_record.id;
END;
$$;

-- Create function to reverse purchase from warehouse
CREATE OR REPLACE FUNCTION reverse_purchase_from_warehouse(
  purchase_record purchases
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  item JSONB;
  bahan_id UUID;
  qty NUMERIC;
  unit_price NUMERIC;
  current_stock NUMERIC;
  new_stock NUMERIC;
BEGIN
  -- Only reverse if purchase was previously applied
  IF purchase_record.applied_at IS NULL THEN
    RETURN;
  END IF;
  
  -- Process each item in reverse
  FOR item IN SELECT * FROM jsonb_array_elements(purchase_record.items)
  LOOP
    -- Extract item data
    bahan_id := COALESCE((item->>'bahan_baku_id')::UUID, NULL);
    qty := COALESCE((item->>'jumlah')::NUMERIC, 0);
    
    -- Skip if invalid data
    IF bahan_id IS NULL OR qty <= 0 THEN
      CONTINUE;
    END IF;
    
    -- Get current stock
    SELECT stok INTO current_stock
    FROM bahan_baku 
    WHERE id = bahan_id AND user_id = purchase_record.user_id;
    
    IF FOUND THEN
      new_stock := GREATEST(current_stock - qty, 0);
      
      -- Update stock (WAC recalculation would need more complex logic)
      UPDATE bahan_baku 
      SET 
        stok = new_stock,
        updated_at = now()
      WHERE id = bahan_id AND user_id = purchase_record.user_id;
    END IF;
  END LOOP;
  
  -- Clear applied_at timestamp
  UPDATE purchases 
  SET applied_at = NULL 
  WHERE id = purchase_record.id;
END;
$$;

-- Create main trigger function
CREATE OR REPLACE FUNCTION handle_purchase_warehouse_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  old_purchase purchases;
  new_purchase purchases;
BEGIN
  -- Handle INSERT (new purchase)
  IF TG_OP = 'INSERT' THEN
    -- Apply to warehouse only if status is 'completed'
    IF NEW.status = 'completed' THEN
      PERFORM apply_purchase_to_warehouse(NEW);
    END IF;
    RETURN NEW;
  END IF;
  
  -- Handle UPDATE (status change or item modification)
  IF TG_OP = 'UPDATE' THEN
    -- Case 1: Status changed to 'completed' 
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
      PERFORM apply_purchase_to_warehouse(NEW);
    
    -- Case 2: Status changed from 'completed' to something else
    ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
      PERFORM reverse_purchase_from_warehouse(OLD);
    
    -- Case 3: Items or amounts changed while status is 'completed'
    ELSIF OLD.status = 'completed' AND NEW.status = 'completed' AND 
          (OLD.items::text != NEW.items::text OR OLD.total_nilai != NEW.total_nilai) THEN
      -- Reverse old amounts and apply new amounts
      PERFORM reverse_purchase_from_warehouse(OLD);
      PERFORM apply_purchase_to_warehouse(NEW);
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    -- Reverse purchase if it was applied
    IF OLD.status = 'completed' THEN
      PERFORM reverse_purchase_from_warehouse(OLD);
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_purchase_warehouse_sync ON purchases;
CREATE TRIGGER trigger_purchase_warehouse_sync
  AFTER INSERT OR UPDATE OR DELETE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION handle_purchase_warehouse_sync();

-- Create manual sync function for fixing inconsistencies
CREATE OR REPLACE FUNCTION sync_all_warehouse_wac(p_user_id UUID)
RETURNS TABLE(bahan_id UUID, old_wac NUMERIC, new_wac NUMERIC, message TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  bahan_record RECORD;
  purchase_record RECORD;
  total_qty NUMERIC;
  total_value NUMERIC;
  calculated_wac NUMERIC;
BEGIN
  -- Loop through all bahan_baku for the user
  FOR bahan_record IN 
    SELECT id, nama, stok, harga_satuan, harga_rata_rata
    FROM bahan_baku 
    WHERE user_id = p_user_id
  LOOP
    total_qty := 0;
    total_value := 0;
    
    -- Calculate total from all completed purchases
    FOR purchase_record IN
      SELECT items
      FROM purchases 
      WHERE user_id = p_user_id AND status = 'completed'
    LOOP
      -- Process each item in purchase
      SELECT 
        COALESCE(SUM((item->>'jumlah')::NUMERIC), 0),
        COALESCE(SUM((item->>'jumlah')::NUMERIC * (item->>'harga_per_satuan')::NUMERIC), 0)
      INTO total_qty, total_value
      FROM jsonb_array_elements(purchase_record.items) AS item
      WHERE (item->>'bahan_baku_id')::UUID = bahan_record.id;
    END LOOP;
    
    -- Calculate weighted average cost
    IF total_qty > 0 THEN
      calculated_wac := total_value / total_qty;
    ELSE
      calculated_wac := bahan_record.harga_satuan;
    END IF;
    
    -- Update if different
    IF ABS(COALESCE(bahan_record.harga_rata_rata, 0) - calculated_wac) > 0.01 THEN
      UPDATE bahan_baku 
      SET harga_rata_rata = calculated_wac, updated_at = now()
      WHERE id = bahan_record.id;
      
      RETURN QUERY SELECT 
        bahan_record.id,
        bahan_record.harga_rata_rata,
        calculated_wac,
        'Updated WAC from ' || COALESCE(bahan_record.harga_rata_rata, 0) || ' to ' || calculated_wac;
    END IF;
  END LOOP;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchases_status_applied ON purchases(status, applied_at);
CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON purchases(user_id, status);
CREATE INDEX IF NOT EXISTS idx_bahan_baku_harga_rata_rata ON bahan_baku(user_id, harga_rata_rata);

COMMENT ON FUNCTION calculate_warehouse_wac IS 'Calculates weighted average cost for warehouse items';
COMMENT ON FUNCTION apply_purchase_to_warehouse IS 'Applies completed purchase to warehouse stock and WAC';
COMMENT ON FUNCTION reverse_purchase_from_warehouse IS 'Reverses purchase effects on warehouse stock';
COMMENT ON FUNCTION handle_purchase_warehouse_sync IS 'Main trigger function for purchase-warehouse synchronization';
COMMENT ON FUNCTION sync_all_warehouse_wac IS 'Manual function to recalculate all WAC values for consistency';
