/*
  # Add pajak column to orders table

  1. Changes
    - Add `pajak` column to `orders` table to store custom tax values
    - Add `subtotal` column to `orders` table to store subtotal values
    - Update existing orders to calculate pajak and subtotal from total_pesanan
  
  2. Purpose
    - Allow users to set custom tax values instead of fixed 10%
    - Store subtotal separately for better reporting
*/

-- Add pajak column to orders table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'pajak'
  ) THEN
    ALTER TABLE orders ADD COLUMN pajak numeric DEFAULT 0;
  END IF;
END $$;

-- Add subtotal column to orders table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE orders ADD COLUMN subtotal numeric DEFAULT 0;
  END IF;
END $$;

-- Update existing orders to calculate pajak and subtotal from total_pesanan
UPDATE orders 
SET 
  pajak = total_pesanan * 0.1,
  subtotal = total_pesanan * 0.9
WHERE 
  pajak = 0 OR pajak IS NULL;