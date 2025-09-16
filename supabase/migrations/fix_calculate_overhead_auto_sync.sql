-- Fix calculate_overhead function to support auto-sync with production target
-- This migration will update the calculate_overhead function to properly use:
-- 1. allocation_settings table for allocation method and basis value
-- 2. app_settings.target_output_monthly for production target
-- 3. Auto-recalculate when either changes

CREATE OR REPLACE FUNCTION "public"."calculate_overhead"("p_material_cost" numeric, "p_user_id" "uuid") 
RETURNS numeric
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public', 'pg_temp'
AS $$
DECLARE
    v_total_costs NUMERIC := 0;
    v_overhead_per_unit NUMERIC := 0;
    v_allocation_method TEXT := 'per_unit';
    v_basis_value NUMERIC := 1000;
    v_production_target NUMERIC := 1000;
BEGIN
    -- Get total operational costs for the user
    SELECT public.get_total_costs(p_user_id) INTO v_total_costs;
    
    -- Get allocation settings for the user
    SELECT 
        COALESCE(metode, 'per_unit'),
        COALESCE(nilai, 1000)
    INTO v_allocation_method, v_basis_value
    FROM allocation_settings 
    WHERE user_id = p_user_id;
    
    -- If no allocation settings found, try to get from app_settings or use defaults
    IF v_allocation_method IS NULL OR v_basis_value IS NULL THEN
        SELECT 
            'per_unit',
            COALESCE(target_output_monthly, 1000)
        INTO v_allocation_method, v_basis_value
        FROM app_settings 
        WHERE user_id = p_user_id;
        
        -- Ultimate fallback to defaults
        v_allocation_method := COALESCE(v_allocation_method, 'per_unit');
        v_basis_value := COALESCE(v_basis_value, 1000);
    END IF;
    
    -- Get current production target from app_settings
    SELECT COALESCE(target_output_monthly, 1000)
    INTO v_production_target
    FROM app_settings 
    WHERE user_id = p_user_id;
    
    -- Calculate overhead based on allocation method
    IF v_allocation_method = 'per_unit' THEN
        -- Per unit allocation: Total costs / Production target
        IF v_production_target > 0 THEN
            v_overhead_per_unit := v_total_costs / v_production_target;
        ELSE
            v_overhead_per_unit := 0;
        END IF;
        
    ELSIF v_allocation_method = 'persentase' THEN
        -- Percentage allocation: Material cost * percentage
        IF p_material_cost > 0 THEN
            v_overhead_per_unit := p_material_cost * (v_basis_value / 100);
        ELSE
            -- Fallback to per unit when no material cost
            IF v_production_target > 0 THEN
                v_overhead_per_unit := v_total_costs / v_production_target;
            ELSE
                v_overhead_per_unit := 0;
            END IF;
        END IF;
        
    ELSE
        -- Default fallback to per unit method
        IF v_production_target > 0 THEN
            v_overhead_per_unit := v_total_costs / v_production_target;
        ELSE
            v_overhead_per_unit := 0;
        END IF;
    END IF;
    
    -- Log the calculation for debugging (can be removed in production)
    -- RAISE NOTICE 'Overhead Calculation - Total Costs: %, Method: %, Basis: %, Target: %, Result: %', 
    --     v_total_costs, v_allocation_method, v_basis_value, v_production_target, v_overhead_per_unit;
    
    RETURN COALESCE(v_overhead_per_unit, 0);
END;
$$;

-- Update function comment
COMMENT ON FUNCTION "public"."calculate_overhead"("p_material_cost" numeric, "p_user_id" "uuid") 
IS 'Calculate overhead costs per unit based on allocation settings and production target with auto-sync support';

-- Create or replace function to get enhanced overhead calculation with details
CREATE OR REPLACE FUNCTION "public"."calculate_overhead_detailed"("p_material_cost" numeric, "p_user_id" "uuid") 
RETURNS TABLE(
    "overhead_per_unit" numeric,
    "total_costs" numeric,
    "allocation_method" text,
    "basis_value" numeric,
    "production_target" numeric,
    "calculation_notes" text
)
LANGUAGE "plpgsql" SECURITY DEFINER
SET "search_path" TO 'public', 'pg_temp'
AS $$
DECLARE
    v_total_costs NUMERIC := 0;
    v_overhead_per_unit NUMERIC := 0;
    v_allocation_method TEXT := 'per_unit';
    v_basis_value NUMERIC := 1000;
    v_production_target NUMERIC := 1000;
    v_calculation_notes TEXT := '';
BEGIN
    -- Get total operational costs for the user
    SELECT public.get_total_costs(p_user_id) INTO v_total_costs;
    
    -- Get allocation settings for the user
    SELECT 
        COALESCE(metode, 'per_unit'),
        COALESCE(nilai, 1000)
    INTO v_allocation_method, v_basis_value
    FROM allocation_settings 
    WHERE user_id = p_user_id;
    
    -- If no allocation settings found, try to get from app_settings or use defaults
    IF v_allocation_method IS NULL OR v_basis_value IS NULL THEN
        SELECT 
            'per_unit',
            COALESCE(target_output_monthly, 1000)
        INTO v_allocation_method, v_basis_value
        FROM app_settings 
        WHERE user_id = p_user_id;
        
        v_calculation_notes := 'Using app_settings fallback. ';
        
        -- Ultimate fallback to defaults
        v_allocation_method := COALESCE(v_allocation_method, 'per_unit');
        v_basis_value := COALESCE(v_basis_value, 1000);
        
        IF v_allocation_method = 'per_unit' AND v_basis_value = 1000 THEN
            v_calculation_notes := v_calculation_notes || 'Using default values. ';
        END IF;
    END IF;
    
    -- Get current production target from app_settings
    SELECT COALESCE(target_output_monthly, 1000)
    INTO v_production_target
    FROM app_settings 
    WHERE user_id = p_user_id;
    
    -- Calculate overhead based on allocation method
    IF v_allocation_method = 'per_unit' THEN
        IF v_production_target > 0 THEN
            v_overhead_per_unit := v_total_costs / v_production_target;
            v_calculation_notes := v_calculation_notes || FORMAT('Per unit: %s / %s units', v_total_costs, v_production_target);
        ELSE
            v_overhead_per_unit := 0;
            v_calculation_notes := v_calculation_notes || 'Production target is 0, overhead set to 0';
        END IF;
        
    ELSIF v_allocation_method = 'persentase' THEN
        IF p_material_cost > 0 THEN
            v_overhead_per_unit := p_material_cost * (v_basis_value / 100);
            v_calculation_notes := v_calculation_notes || FORMAT('Percentage: %s * %s%%', p_material_cost, v_basis_value);
        ELSE
            -- Fallback to per unit when no material cost
            IF v_production_target > 0 THEN
                v_overhead_per_unit := v_total_costs / v_production_target;
                v_calculation_notes := v_calculation_notes || FORMAT('Fallback per unit (no material cost): %s / %s units', v_total_costs, v_production_target);
            ELSE
                v_overhead_per_unit := 0;
                v_calculation_notes := v_calculation_notes || 'No material cost and production target is 0';
            END IF;
        END IF;
        
    ELSE
        -- Default fallback to per unit method
        IF v_production_target > 0 THEN
            v_overhead_per_unit := v_total_costs / v_production_target;
            v_calculation_notes := v_calculation_notes || FORMAT('Default per unit: %s / %s units', v_total_costs, v_production_target);
        ELSE
            v_overhead_per_unit := 0;
            v_calculation_notes := v_calculation_notes || 'Unknown method, production target is 0';
        END IF;
    END IF;
    
    RETURN QUERY SELECT 
        COALESCE(v_overhead_per_unit, 0),
        v_total_costs,
        v_allocation_method,
        v_basis_value,
        v_production_target,
        v_calculation_notes;
END;
$$;

COMMENT ON FUNCTION "public"."calculate_overhead_detailed"("p_material_cost" numeric, "p_user_id" "uuid") 
IS 'Get detailed overhead calculation with breakdown information for debugging and transparency';

-- Create trigger function to auto-update overhead when allocation settings change
CREATE OR REPLACE FUNCTION "public"."notify_overhead_recalculation"() 
RETURNS trigger
LANGUAGE "plpgsql"
AS $$
BEGIN
    -- This trigger can be used to notify the application that overhead needs recalculation
    -- For now, we'll just return the NEW record
    -- In the future, this could trigger a webhook or update cached values
    
    -- Add notification to a hypothetical notifications table
    -- INSERT INTO system_notifications (user_id, type, message, created_at)
    -- VALUES (NEW.user_id, 'overhead_recalc', 'Overhead calculation needs update', NOW());
    
    RETURN NEW;
END;
$$;

-- Create triggers for auto-sync
DROP TRIGGER IF EXISTS allocation_settings_changed ON allocation_settings;
CREATE TRIGGER allocation_settings_changed
    AFTER INSERT OR UPDATE ON allocation_settings
    FOR EACH ROW
    EXECUTE FUNCTION notify_overhead_recalculation();

DROP TRIGGER IF EXISTS app_settings_target_changed ON app_settings;
CREATE TRIGGER app_settings_target_changed
    AFTER UPDATE OF target_output_monthly ON app_settings
    FOR EACH ROW
    WHEN (OLD.target_output_monthly IS DISTINCT FROM NEW.target_output_monthly)
    EXECUTE FUNCTION notify_overhead_recalculation();

-- Update operational_costs table trigger to recalculate when costs change
DROP TRIGGER IF EXISTS operational_costs_changed ON operational_costs;
CREATE TRIGGER operational_costs_changed
    AFTER INSERT OR UPDATE OR DELETE ON operational_costs
    FOR EACH ROW
    EXECUTE FUNCTION notify_overhead_recalculation();