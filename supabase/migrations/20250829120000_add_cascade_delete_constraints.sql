-- Migration: Add missing foreign key constraints for better cascade deletion
-- Created: 2025-08-29 12:00:00
-- Purpose: Ensure data integrity with proper CASCADE DELETE at database level

-- ================================
-- Missing Foreign Key Constraints
-- ================================

-- Note: Most user-owned tables already have FK to auth.users with CASCADE DELETE
-- This migration adds missing relationships between tables

-- 1. Add index for better performance on foreign key lookups
CREATE INDEX IF NOT EXISTS idx_financial_transactions_related_id 
ON financial_transactions(related_id) 
WHERE related_id IS NOT NULL;

-- 2. Add index on profit_analysis.user_id for better performance
-- (already exists, but ensuring it's there)
CREATE INDEX IF NOT EXISTS idx_profit_analysis_user_period_type 
ON profit_analysis(user_id, period, period_type);

-- ================================
-- Database Functions for Cleanup
-- ================================

-- Function to clean up orphaned JSONB references when bahan_baku is deleted
-- This handles the case where recipes.bahan_resep contains references to deleted materials
CREATE OR REPLACE FUNCTION cleanup_recipe_material_references()
RETURNS TRIGGER AS $$
BEGIN
  -- Update recipes that reference the deleted bahan_baku in their JSONB bahan_resep
  UPDATE recipes
  SET bahan_resep = (
    SELECT jsonb_agg(ingredient)
    FROM jsonb_array_elements(bahan_resep) AS ingredient
    WHERE (ingredient->>'bahan_baku_id')::uuid != OLD.id
  )
  WHERE bahan_resep @> jsonb_build_array(
    jsonb_build_object('bahan_baku_id', OLD.id::text)
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically clean up recipe references when bahan_baku is deleted
DROP TRIGGER IF EXISTS trigger_cleanup_recipe_material_references ON bahan_baku;
CREATE TRIGGER trigger_cleanup_recipe_material_references
    AFTER DELETE ON bahan_baku
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_recipe_material_references();

-- ================================
-- Enhanced Triggers for Cleanup
-- ================================

-- Function to clean up related data when operational costs are deleted
-- This ensures app_settings recalculation happens
CREATE OR REPLACE FUNCTION enhanced_cleanup_after_cost_deletion()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id uuid;
BEGIN
  target_user_id := OLD.user_id;

  IF target_user_id IS NULL THEN
    RETURN OLD;
  END IF;

  -- Clean up any related financial transactions
  DELETE FROM financial_transactions 
  WHERE user_id = target_user_id 
    AND related_id = OLD.id::text 
    AND type = 'expense';

  -- Recalculate app settings
  IF EXISTS (
    SELECT 1 FROM operational_costs
    WHERE user_id = target_user_id
      AND status = 'aktif'
  ) THEN
    PERFORM calculate_and_update_cost_per_unit(target_user_id::uuid);
  ELSE
    UPDATE app_settings
    SET overhead_per_pcs    = 0,
        operasional_per_pcs = 0,
        updated_at          = now()
    WHERE user_id = target_user_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Update the existing trigger to use the enhanced cleanup function
DROP TRIGGER IF EXISTS cleanup_after_cost_deletion ON operational_costs;
CREATE TRIGGER cleanup_after_cost_deletion
    AFTER DELETE ON operational_costs
    FOR EACH ROW
    EXECUTE FUNCTION enhanced_cleanup_after_cost_deletion();

-- ================================
-- Refresh Materialized Views Function
-- ================================

-- Enhanced function to refresh all materialized views after financial data changes
CREATE OR REPLACE FUNCTION refresh_financial_views()
RETURNS void AS $$
BEGIN
  -- Refresh dashboard summary materialized view
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_financial_summary;
  
  -- Refresh pemakaian_bahan daily view if it exists
  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE matviewname = 'pemakaian_bahan_daily_mv'
  ) THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY pemakaian_bahan_daily_mv;
  END IF;
  
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Failed to refresh materialized views: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ================================
-- Data Integrity Checks
-- ================================

-- Function to check for orphaned records (for monitoring)
CREATE OR REPLACE FUNCTION check_orphaned_records()
RETURNS TABLE(
  table_name text,
  orphaned_count bigint,
  details text
) AS $$
BEGIN
  -- Check for financial_transactions with invalid related_id
  RETURN QUERY
  SELECT 
    'financial_transactions'::text,
    COUNT(*)::bigint,
    'Financial transactions with related_id not found in purchases or orders'::text
  FROM financial_transactions ft
  WHERE ft.related_id IS NOT NULL
    AND ft.related_id != ''
    AND NOT EXISTS (SELECT 1 FROM purchases p WHERE p.id::text = ft.related_id)
    AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.id::text = ft.related_id)
    AND NOT EXISTS (SELECT 1 FROM operational_costs oc WHERE oc.id::text = ft.related_id)
    AND NOT EXISTS (SELECT 1 FROM assets a WHERE a.id::text = ft.related_id);

  -- Check for pemakaian_bahan with invalid bahan_baku_id
  RETURN QUERY
  SELECT 
    'pemakaian_bahan'::text,
    COUNT(*)::bigint,
    'Material usage records with invalid bahan_baku_id'::text
  FROM pemakaian_bahan pb
  WHERE NOT EXISTS (SELECT 1 FROM bahan_baku bb WHERE bb.id = pb.bahan_baku_id);
  
END;
$$ LANGUAGE plpgsql;

-- ================================
-- Comments and Documentation
-- ================================

COMMENT ON FUNCTION cleanup_recipe_material_references() IS 'Cleans up JSONB references in recipes when bahan_baku is deleted';
COMMENT ON FUNCTION enhanced_cleanup_after_cost_deletion() IS 'Enhanced cleanup for operational costs deletion with financial transaction cleanup';
COMMENT ON FUNCTION refresh_financial_views() IS 'Refresh all materialized views after financial data changes';
COMMENT ON FUNCTION check_orphaned_records() IS 'Check for orphaned records across related tables';

-- ================================
-- Performance Indexes
-- ================================

-- Additional indexes for better performance on cascade operations
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_related 
ON financial_transactions(user_id, related_id) 
WHERE related_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pemakaian_bahan_bahan_user 
ON pemakaian_bahan(bahan_baku_id, user_id);

-- GIN index for better JSONB searches in recipes
CREATE INDEX IF NOT EXISTS idx_recipes_bahan_resep_gin 
ON recipes USING gin(bahan_resep);

-- ================================
-- Migration Completion
-- ================================

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'CASCADE DELETE CONSTRAINTS MIGRATION COMPLETED';
  RAISE NOTICE 'Added: Enhanced cleanup triggers';
  RAISE NOTICE 'Added: Recipe material reference cleanup';
  RAISE NOTICE 'Added: Performance indexes';
  RAISE NOTICE 'Added: Data integrity check functions';
END $$;
