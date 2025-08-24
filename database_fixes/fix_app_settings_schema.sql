-- Fix App Settings Schema and Configuration
-- This script resolves PGRST116 errors and ensures proper overhead calculation setup
-- Run this in Supabase SQL editor

-- ==============================================
-- 1. ENSURE APP_SETTINGS TABLE EXISTS
-- ==============================================

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

-- Add comments for clarity
COMMENT ON TABLE app_settings IS 'Global application settings per user for dual-mode cost calculations';
COMMENT ON COLUMN app_settings.target_output_monthly IS 'Monthly production target in pieces';
COMMENT ON COLUMN app_settings.overhead_per_pcs IS 'Calculated overhead cost per piece (HPP group)';
COMMENT ON COLUMN app_settings.operasional_per_pcs IS 'Calculated operational cost per piece (non-HPP group)';

-- ==============================================
-- 2. CHECK AND RESPECT EXISTING ALLOCATION_SETTINGS SCHEMA
-- ==============================================

-- Check if user has custom allocation_settings schema
DO $$
DECLARE
  has_custom_allocation boolean;
BEGIN
  -- Check if allocation_settings table exists with user's schema
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'allocation_settings'
  ) INTO has_custom_allocation;
  
  IF has_custom_allocation THEN
    RAISE NOTICE 'Found existing allocation_settings table - using custom schema';
    
    -- Verify the custom schema has required columns
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'allocation_settings' 
      AND column_name IN ('user_id', 'metode', 'nilai')
      GROUP BY table_name 
      HAVING COUNT(*) >= 3
    ) THEN
      RAISE EXCEPTION 'Custom allocation_settings table missing required columns (user_id, metode, nilai)';
    END IF;
    
    RAISE NOTICE 'Custom allocation_settings schema validated successfully';
  ELSE
    RAISE NOTICE 'No existing allocation_settings found - creating default schema';
    
    -- Create default allocation_settings table only if it doesn't exist
    CREATE TABLE IF NOT EXISTS allocation_settings (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      metode varchar(20) NOT NULL DEFAULT 'per_unit',
      nilai numeric(10,2) NOT NULL DEFAULT 1000.00,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      
      -- Ensure one allocation setting per user
      CONSTRAINT allocation_settings_user_unique UNIQUE(user_id),
      
      -- Validate method values
      CONSTRAINT allocation_settings_metode_check CHECK (metode IN ('per_unit', 'percentage'))
    );

    -- Add comments
    COMMENT ON TABLE allocation_settings IS 'Allocation method settings for overhead calculation';
    COMMENT ON COLUMN allocation_settings.metode IS 'Allocation method: per_unit or percentage';
    COMMENT ON COLUMN allocation_settings.nilai IS 'Base value for allocation calculation';
  END IF;
END $$;

-- ==============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_app_settings_user 
ON app_settings(user_id);

CREATE INDEX IF NOT EXISTS idx_allocation_settings_user 
ON allocation_settings(user_id);

-- ==============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ==============================================

-- Enable RLS on both tables
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 5. CREATE RLS POLICIES
-- ==============================================

-- App Settings Policies
DROP POLICY IF EXISTS "Users can view own app settings" ON app_settings;
CREATE POLICY "Users can view own app settings" ON app_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own app settings" ON app_settings;
CREATE POLICY "Users can insert own app settings" ON app_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own app settings" ON app_settings;
CREATE POLICY "Users can update own app settings" ON app_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own app settings" ON app_settings;
CREATE POLICY "Users can delete own app settings" ON app_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Allocation Settings Policies (works with custom schema)
DO $$
BEGIN
  -- Enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'allocation_settings' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE allocation_settings ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Drop existing policies to avoid conflicts with custom schema
  DROP POLICY IF EXISTS "Users can view own allocation settings" ON allocation_settings;
  DROP POLICY IF EXISTS "Users can insert own allocation settings" ON allocation_settings;
  DROP POLICY IF EXISTS "Users can update own allocation settings" ON allocation_settings;
  DROP POLICY IF EXISTS "Users can delete own allocation settings" ON allocation_settings;
  
  -- Create policies that work with any allocation_settings schema
  CREATE POLICY "Users can view own allocation settings" ON allocation_settings
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can insert own allocation settings" ON allocation_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can update own allocation settings" ON allocation_settings
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can delete own allocation settings" ON allocation_settings
    FOR DELETE USING (auth.uid() = user_id);
    
  RAISE NOTICE 'Allocation settings RLS policies created successfully (compatible with custom schema)';
END $$;
ALTER TABLE allocation_settings ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 5. CREATE HELPER FUNCTIONS
-- ==============================================

-- Function to initialize default settings for a user
CREATE OR REPLACE FUNCTION initialize_user_settings(p_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Insert default app_settings
  INSERT INTO app_settings (
    user_id,
    target_output_monthly,
    overhead_per_pcs,
    operasional_per_pcs
  ) VALUES (
    p_user_id,
    1000.00,  -- Default 1000 pcs/month
    0.00,     -- Will be calculated later
    0.00      -- Will be calculated later
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert default allocation_settings (compatible with custom schema)
  INSERT INTO allocation_settings (
    user_id,
    metode,
    nilai
  ) VALUES (
    p_user_id,
    'per_unit',    -- Matches your constraint (metode = 'per_unit')
    1000.00        -- Default allocation base
  )
  ON CONFLICT (user_id) DO NOTHING;  -- Works with your primary key
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate and update cost per unit
CREATE OR REPLACE FUNCTION calculate_and_update_cost_per_unit(
  p_user_id uuid,
  p_target_output numeric DEFAULT NULL
)
RETURNS app_settings AS $$
DECLARE
  v_target_output numeric;
  v_hpp_total numeric;
  v_operasional_total numeric;
  v_overhead_per_pcs numeric;
  v_operasional_per_pcs numeric;
  result app_settings;
BEGIN
  -- Get or use default target output
  SELECT COALESCE(p_target_output, target_output_monthly, 1000)
  INTO v_target_output
  FROM app_settings
  WHERE user_id = p_user_id;

  -- Calculate HPP total (group = 'HPP')
  SELECT COALESCE(SUM(jumlah_per_bulan), 0)
  INTO v_hpp_total
  FROM operational_costs
  WHERE user_id = p_user_id 
    AND status = 'active'
    AND "group" = 'HPP';

  -- Calculate OPERASIONAL total (group = 'OPERASIONAL')
  SELECT COALESCE(SUM(jumlah_per_bulan), 0)
  INTO v_operasional_total
  FROM operational_costs
  WHERE user_id = p_user_id 
    AND status = 'active'
    AND "group" = 'OPERASIONAL';

  -- Calculate per unit costs
  v_overhead_per_pcs := CASE 
    WHEN v_target_output > 0 THEN ROUND(v_hpp_total / v_target_output, 2)
    ELSE 0
  END;

  v_operasional_per_pcs := CASE 
    WHEN v_target_output > 0 THEN ROUND(v_operasional_total / v_target_output, 2)
    ELSE 0
  END;

  -- Update app_settings
  INSERT INTO app_settings (
    user_id,
    target_output_monthly,
    overhead_per_pcs,
    operasional_per_pcs
  ) VALUES (
    p_user_id,
    v_target_output,
    v_overhead_per_pcs,
    v_operasional_per_pcs
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

-- ==============================================
-- 6. CREATE TRIGGER FOR AUTO-INITIALIZATION
-- ==============================================

-- Trigger function to auto-initialize settings for new users
CREATE OR REPLACE FUNCTION auto_initialize_user_settings()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on operational_costs table
DROP TRIGGER IF EXISTS trigger_auto_initialize_settings ON operational_costs;
CREATE TRIGGER trigger_auto_initialize_settings
  AFTER INSERT OR UPDATE OR DELETE ON operational_costs
  FOR EACH ROW
  EXECUTE FUNCTION auto_initialize_user_settings();

-- ==============================================
-- 7. VALIDATION QUERIES
-- ==============================================

-- Check if tables exist and have correct structure
DO $$
BEGIN
  -- Validate app_settings table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'app_settings'
  ) THEN
    RAISE EXCEPTION 'app_settings table was not created successfully';
  END IF;

  -- Validate allocation_settings table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'allocation_settings'
  ) THEN
    RAISE EXCEPTION 'allocation_settings table was not created successfully';
  END IF;

  -- Validate functions exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'initialize_user_settings'
  ) THEN
    RAISE EXCEPTION 'initialize_user_settings function was not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'calculate_and_update_cost_per_unit'
  ) THEN
    RAISE EXCEPTION 'calculate_and_update_cost_per_unit function was not created';
  END IF;

  RAISE NOTICE 'App settings schema setup completed successfully!';
END $$;

-- ==============================================
-- 8. SAMPLE DATA INSERT (OPTIONAL)
-- ==============================================

-- This section can be used to insert sample data for testing
-- Uncomment the following if you want to add sample data

/*
-- Insert sample operational costs for testing
INSERT INTO operational_costs (
  user_id,
  nama_biaya,
  jumlah_per_bulan,
  jenis,
  "group",
  status
) VALUES 
  -- Sample HPP costs
  (auth.uid(), 'Gas LPG', 300000, 'variabel', 'HPP', 'active'),
  (auth.uid(), 'Penyusutan Alat Masak', 200000, 'tetap', 'HPP', 'active'),
  
  -- Sample OPERASIONAL costs
  (auth.uid(), 'Sewa Warung', 2000000, 'tetap', 'OPERASIONAL', 'active'),
  (auth.uid(), 'Listrik & Air', 400000, 'tetap', 'OPERASIONAL', 'active'),
  (auth.uid(), 'Promosi & Marketing', 300000, 'variabel', 'OPERASIONAL', 'active')
ON CONFLICT DO NOTHING;

-- Initialize settings for current user
SELECT initialize_user_settings(auth.uid());

-- Calculate initial cost per unit
SELECT calculate_and_update_cost_per_unit(auth.uid(), 1000);
*/

-- ==============================================
-- SUMMARY
-- ==============================================

RAISE NOTICE '==============================================';
RAISE NOTICE 'APP SETTINGS SCHEMA SETUP COMPLETE';
RAISE NOTICE '==============================================';
RAISE NOTICE 'Created tables: app_settings, allocation_settings';
RAISE NOTICE 'Created functions: initialize_user_settings, calculate_and_update_cost_per_unit';
RAISE NOTICE 'Created triggers: auto_initialize_settings';
RAISE NOTICE 'Enabled RLS with proper policies';
RAISE NOTICE '';
RAISE NOTICE 'Next steps:';
RAISE NOTICE '1. Run fix-app-settings-configuration.js in browser console';
RAISE NOTICE '2. Add operational costs via UI';
RAISE NOTICE '3. Test profit analysis calculation';
RAISE NOTICE '==============================================';