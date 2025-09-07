-- Migration: Add manual selling price fields to recipes table
-- Created: 2025-09-01
-- Description: Add columns to support manual selling price input functionality in recipe HPP calculation

-- Add manual selling price columns to recipes table
ALTER TABLE "public"."recipes" 
ADD COLUMN IF NOT EXISTS "is_manual_pricing_enabled" boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS "manual_selling_price_per_portion" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "manual_selling_price_per_piece" numeric DEFAULT 0;

-- Add constraints for manual selling prices (must be non-negative when set)
ALTER TABLE "public"."recipes" 
ADD CONSTRAINT "recipes_manual_prices_nonnegative" 
CHECK (
  ("manual_selling_price_per_portion" IS NULL OR "manual_selling_price_per_portion" >= 0) AND
  ("manual_selling_price_per_piece" IS NULL OR "manual_selling_price_per_piece" >= 0)
);

-- Add comments for documentation
COMMENT ON COLUMN "public"."recipes"."is_manual_pricing_enabled" IS 'Flag to indicate if manual selling price is being used instead of calculated price';
COMMENT ON COLUMN "public"."recipes"."manual_selling_price_per_portion" IS 'Manually set selling price per portion (overrides calculated price when is_manual_pricing_enabled is true)';
COMMENT ON COLUMN "public"."recipes"."manual_selling_price_per_piece" IS 'Manually set selling price per piece (overrides calculated price when is_manual_pricing_enabled is true)';

-- Create index for efficient querying of manual pricing enabled recipes
CREATE INDEX IF NOT EXISTS "idx_recipes_manual_pricing" ON "public"."recipes" ("user_id", "is_manual_pricing_enabled") WHERE "is_manual_pricing_enabled" = true;

-- Update existing recipes to have manual pricing disabled by default (already handled by DEFAULT false)
-- This migration is additive and backward-compatible
