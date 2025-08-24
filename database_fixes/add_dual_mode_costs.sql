-- ====================================
-- DUAL-MODE OPERATIONAL COSTS MIGRATION
-- ====================================
-- Adds dual-mode support to EXISTING operational_costs table
-- Safe migration that works with your current schema

-- 1. Add 'group' column to existing operational_costs table
-- This separates costs into HPP vs OPERASIONAL groups
DO $$
BEGIN
  -- Check if group column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'operational_costs' AND column_name = 'group'
  ) THEN
    ALTER TABLE operational_costs 
    ADD COLUMN "group" text NOT NULL DEFAULT 'OPERASIONAL';
    
    -- Add constraint for group validation
    ALTER TABLE operational_costs 
    ADD CONSTRAINT opcosts_group_valid 
    CHECK ("group" = ANY (ARRAY['HPP'::text, 'OPERASIONAL'::text]));
    
    -- Add index for group column (performance optimization)
    CREATE INDEX idx_opcosts_group 
    ON operational_costs USING btree ("group");
    
    -- Add comment
    COMMENT ON COLUMN operational_costs."group" IS 'Cost group: HPP (enters COGS) or OPERASIONAL (outside COGS)';
    
    RAISE NOTICE 'Added group column to operational_costs table';
  ELSE
    RAISE NOTICE 'Group column already exists in operational_costs table';
  END IF;
END $$;

-- 2. Create app_settings table for global cost per unit storage
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_output_monthly numeric(10,2) NOT NULL DEFAULT 1000.00,
  overhead_per_pcs numeric(10,2) NOT NULL DEFAULT 0.00,
  operasional_per_pcs numeric(10,2) NOT NULL DEFAULT 0.00,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Ensure one settings record per user
  CONSTRAINT app_settings_user_unique UNIQUE(user_id)
);

-- 3. Add comments to app_settings table
COMMENT ON TABLE app_settings IS 'Global application settings per user for dual-mode cost calculations';
COMMENT ON COLUMN app_settings.target_output_monthly IS 'Monthly production target in pieces';
COMMENT ON COLUMN app_settings.overhead_per_pcs IS 'Calculated overhead cost per piece (HPP group)';
COMMENT ON COLUMN app_settings.operasional_per_pcs IS 'Calculated operational cost per piece (non-HPP group)';

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_operational_costs_user_group 
ON operational_costs(user_id, "group");

CREATE INDEX IF NOT EXISTS idx_operational_costs_group_status 
ON operational_costs("group", status);

CREATE INDEX IF NOT EXISTS idx_app_settings_user 
ON app_settings(user_id);

-- 5. Create RLS policies for app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own settings
DROP POLICY IF EXISTS app_settings_select_own ON app_settings;
CREATE POLICY app_settings_select_own 
ON app_settings FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for users to insert their own settings
DROP POLICY IF EXISTS app_settings_insert_own ON app_settings;
CREATE POLICY app_settings_insert_own 
ON app_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own settings
DROP POLICY IF EXISTS app_settings_update_own ON app_settings;
CREATE POLICY app_settings_update_own 
ON app_settings FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for users to delete their own settings
DROP POLICY IF EXISTS app_settings_delete_own ON app_settings;
CREATE POLICY app_settings_delete_own 
ON app_settings FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Create trigger for updated_at on app_settings
-- Use existing set_updated_at function if available
DO $$
BEGIN
  -- Check if set_updated_at function exists
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    -- Use existing function
    DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON app_settings;
    CREATE TRIGGER trg_app_settings_updated_at 
    BEFORE UPDATE ON app_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION set_updated_at();
    
    RAISE NOTICE 'Created trigger using existing set_updated_at function';
  ELSE
    -- Create our own function
    CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON app_settings;
    CREATE TRIGGER trg_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_app_settings_updated_at();
    
    RAISE NOTICE 'Created custom updated_at trigger';
  END IF;
END $$;

-- 7. Create function for dual-mode overhead calculation
CREATE OR REPLACE FUNCTION calculate_dual_mode_overhead(
  p_user_id uuid,
  p_group text DEFAULT 'HPP',
  p_target_output numeric DEFAULT 1000
)
RETURNS numeric AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to update app_settings with calculation results
CREATE OR REPLACE FUNCTION update_app_settings_calculations(
  p_user_id uuid,
  p_target_output numeric,
  p_overhead_per_pcs numeric DEFAULT NULL,
  p_operasional_per_pcs numeric DEFAULT NULL
)
RETURNS app_settings AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Optional: Update existing data based on cost name keywords
-- Uncomment and modify this if you want to auto-classify existing costs
/*
UPDATE operational_costs 
SET "group" = 'HPP' 
WHERE lower(nama_biaya) SIMILAR TO '%(oven|proofer|gas|lpg|sewa dapur|penyusutan|supervisor)%'
  AND "group" = 'OPERASIONAL';
*/

-- 10. Show completion message
DO $$
BEGIN
  RAISE NOTICE '✅ Dual-mode operational costs migration completed successfully!';
  RAISE NOTICE '📊 Added group column to operational_costs table';
  RAISE NOTICE '⚙️ Created app_settings table for global cost calculations';
  RAISE NOTICE '🔐 Set up RLS policies for data security';
  RAISE NOTICE '🧮 Created calculation functions for dual-mode overhead';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '1. Test the dual-mode calculator in your application';
  RAISE NOTICE '2. Classify existing costs into HPP vs OPERASIONAL groups';
  RAISE NOTICE '3. Set up production targets and calculate overhead per pcs';
END $$;

-- 11. Create helpful views for dual-mode analysis
CREATE OR REPLACE VIEW dual_mode_cost_summary AS
SELECT 
  user_id,
  "group",
  status,
  COUNT(*) as cost_count,
  SUM(jumlah_per_bulan) as total_monthly,
  AVG(jumlah_per_bulan) as avg_monthly,
  MAX(jumlah_per_bulan) as max_monthly,
  MIN(jumlah_per_bulan) as min_monthly
FROM operational_costs
GROUP BY user_id, "group", status;

COMMENT ON VIEW dual_mode_cost_summary IS 'Summary view of costs grouped by user, cost group (HPP/OPERASIONAL), and status';

-- 12. Verification query
SELECT 
  'Dual-mode migration completed' as status,
  (
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_name = 'operational_costs' AND column_name = 'group'
  ) as group_column_added,
  (
    SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_name = 'app_settings'
  ) as app_settings_table_created,
  (
    SELECT COUNT(*) 
    FROM operational_costs 
    WHERE "group" = 'OPERASIONAL'
  ) as migrated_costs;