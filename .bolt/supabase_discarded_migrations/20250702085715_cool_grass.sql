/*
  # Rename Payment ID Column Migration

  1. Changes
    - Rename `scalev_payment_id` column to `pg_reference_id` in user_payments table
    - Update related indexes for better query performance
  
  2. Purpose
    - Support different payment gateway reference ID formats
    - Make column name more generic to accommodate various payment sources
*/

-- Rename the column
ALTER TABLE public.user_payments
RENAME COLUMN scalev_payment_id TO pg_reference_id;

-- Drop the old index
DROP INDEX IF EXISTS idx_user_payments_scalev_id;

-- Create a new index for the renamed column
CREATE INDEX IF NOT EXISTS idx_user_payments_pg_reference_id ON public.user_payments(pg_reference_id);