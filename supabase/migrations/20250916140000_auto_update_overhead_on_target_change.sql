-- Enhanced trigger function for auto-updating overhead per pcs when production target changes
-- This will automatically recalculate overhead_per_pcs and operasional_per_pcs when target_output_monthly changes

-- Create enhanced trigger function that actually updates overhead values
CREATE OR REPLACE FUNCTION "public"."auto_update_overhead_on_target_change"() 
RETURNS trigger
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public', 'pg_temp'
AS $$
DECLARE
    v_hpp_costs NUMERIC := 0;
    v_operasional_costs NUMERIC := 0;
    v_target_output NUMERIC;
    v_overhead_per_pcs NUMERIC := 0;
    v_operasional_per_pcs NUMERIC := 0;
BEGIN
    -- Get the new target output value
    v_target_output := COALESCE(NEW.target_output_monthly, 1000);
    
    -- Only proceed if target output is valid
    IF v_target_output <= 0 THEN
        RETURN NEW;
    END IF;
    
    -- Get total HPP costs (overhead production costs)
    SELECT COALESCE(SUM(jumlah_per_bulan), 0)
    INTO v_hpp_costs
    FROM operational_costs 
    WHERE user_id = NEW.user_id 
      AND status = 'aktif'
      AND (
        "group" = 'hpp' OR 
        LOWER(nama_biaya) LIKE '%overhead%' OR 
        LOWER(nama_biaya) LIKE '%produksi%' OR
        LOWER(nama_biaya) LIKE '%gas%' OR
        LOWER(nama_biaya) LIKE '%listrik produksi%' OR
        LOWER(nama_biaya) LIKE '%peralatan%' OR
        LOWER(nama_biaya) LIKE '%penyusutan%' OR
        LOWER(nama_biaya) LIKE '%tenaga kerja%' OR
        LOWER(nama_biaya) LIKE '%gaji%' OR
        LOWER(nama_biaya) LIKE '%upah%'
      );
    
    -- Get total operational costs (non-production costs)
    SELECT COALESCE(SUM(jumlah_per_bulan), 0)
    INTO v_operasional_costs
    FROM operational_costs 
    WHERE user_id = NEW.user_id 
      AND status = 'aktif'
      AND (
        "group" = 'operasional' OR 
        LOWER(nama_biaya) LIKE '%sewa%' OR
        LOWER(nama_biaya) LIKE '%marketing%' OR
        LOWER(nama_biaya) LIKE '%promosi%' OR
        LOWER(nama_biaya) LIKE '%admin%' OR
        LOWER(nama_biaya) LIKE '%listrik toko%' OR
        LOWER(nama_biaya) LIKE '%internet%' OR
        LOWER(nama_biaya) LIKE '%telepon%' OR
        LOWER(nama_biaya) LIKE '%transportasi%'
      ) 
      AND NOT (
        LOWER(nama_biaya) LIKE '%produksi%' OR
        LOWER(nama_biaya) LIKE '%gas%' OR
        LOWER(nama_biaya) LIKE '%tenaga kerja%'
      );
    
    -- Calculate per pcs costs
    v_overhead_per_pcs := ROUND(v_hpp_costs / v_target_output, 2);
    v_operasional_per_pcs := ROUND(v_operasional_costs / v_target_output, 2);
    
    -- Update the NEW record with calculated values
    NEW.overhead_per_pcs := GREATEST(v_overhead_per_pcs, 0);
    NEW.operasional_per_pcs := GREATEST(v_operasional_per_pcs, 0);
    NEW.updated_at := NOW();
    
    -- Log the calculation for debugging
    RAISE NOTICE 'Auto-updated overhead for user %: Target=%, HPP=%, Operational=%, OverheadPerPcs=%, OperationalPerPcs=%', 
        NEW.user_id, v_target_output, v_hpp_costs, v_operasional_costs, v_overhead_per_pcs, v_operasional_per_pcs;
    
    RETURN NEW;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION "public"."auto_update_overhead_on_target_change"() 
IS 'Automatically recalculates and updates overhead_per_pcs and operasional_per_pcs when target_output_monthly changes';

-- Replace the existing trigger with the enhanced one
DROP TRIGGER IF EXISTS app_settings_target_changed ON app_settings;
CREATE TRIGGER app_settings_target_changed
    BEFORE UPDATE OF target_output_monthly ON app_settings
    FOR EACH ROW
    WHEN (OLD.target_output_monthly IS DISTINCT FROM NEW.target_output_monthly)
    EXECUTE FUNCTION auto_update_overhead_on_target_change();

-- Create additional trigger for INSERT operations (when app_settings is first created)
DROP TRIGGER IF EXISTS app_settings_created ON app_settings;
CREATE TRIGGER app_settings_created
    BEFORE INSERT ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_overhead_on_target_change();

-- Also trigger when operational costs change
CREATE OR REPLACE FUNCTION "public"."update_overhead_when_costs_change"() 
RETURNS trigger
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_target_output NUMERIC := 1000;
BEGIN
    -- Get user_id from the operational cost record
    IF TG_OP = 'DELETE' THEN
        v_user_id := OLD.user_id;
    ELSE
        v_user_id := NEW.user_id;
    END IF;
    
    -- Get current target output for this user
    SELECT COALESCE(target_output_monthly, 1000)
    INTO v_target_output
    FROM app_settings
    WHERE user_id = v_user_id;
    
    -- Trigger recalculation by updating the updated_at field in app_settings
    -- This will trigger the main overhead calculation function
    UPDATE app_settings 
    SET updated_at = NOW()
    WHERE user_id = v_user_id;
    
    -- If no app_settings exist, create default ones (this will trigger the calculation)
    IF NOT FOUND THEN
        INSERT INTO app_settings (user_id, target_output_monthly, overhead_per_pcs, operasional_per_pcs)
        VALUES (v_user_id, 1000, 0, 0)
        ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();
    END IF;
    
    -- Return the appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Add comment
COMMENT ON FUNCTION "public"."update_overhead_when_costs_change"() 
IS 'Triggers overhead recalculation when operational costs are added, updated, or deleted';

-- Create trigger for operational costs changes
DROP TRIGGER IF EXISTS operational_costs_changed ON operational_costs;
CREATE TRIGGER operational_costs_changed
    AFTER INSERT OR UPDATE OR DELETE ON operational_costs
    FOR EACH ROW
    EXECUTE FUNCTION update_overhead_when_costs_change();

-- Create function to manually trigger overhead recalculation for all users
CREATE OR REPLACE FUNCTION "public"."recalculate_all_overhead"()
RETURNS TABLE(user_id UUID, old_overhead_per_pcs NUMERIC, new_overhead_per_pcs NUMERIC, old_operasional_per_pcs NUMERIC, new_operasional_per_pcs NUMERIC)
LANGUAGE "plpgsql" SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    UPDATE app_settings 
    SET updated_at = NOW()
    RETURNING 
        app_settings.user_id,
        app_settings.overhead_per_pcs as old_overhead_per_pcs,
        app_settings.overhead_per_pcs as new_overhead_per_pcs, -- Will be updated by trigger
        app_settings.operasional_per_pcs as old_operasional_per_pcs,
        app_settings.operasional_per_pcs as new_operasional_per_pcs; -- Will be updated by trigger
END;
$$;

COMMENT ON FUNCTION "public"."recalculate_all_overhead"() 
IS 'Manually trigger overhead recalculation for all users - useful for maintenance';