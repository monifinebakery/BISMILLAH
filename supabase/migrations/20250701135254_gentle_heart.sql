/*
  # Update User Payments Table

  1. Changes
    - Add columns to match Scalev webhook data structure
    - Add indexes for better performance
*/

-- Update user_payments table to match Scalev webhook data structure
DO $$ 
BEGIN
  -- Add order_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_payments' AND column_name = 'order_id'
  ) THEN
    ALTER TABLE public.user_payments ADD COLUMN order_id TEXT;
  END IF;

  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_payments' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.user_payments ADD COLUMN email TEXT;
  END IF;

  -- Add name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_payments' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.user_payments ADD COLUMN name TEXT;
  END IF;
END $$;

-- Add index for better performance on order_id lookups if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_payments_order_id') THEN
    CREATE INDEX idx_user_payments_order_id ON public.user_payments(order_id);
  END IF;
END $$;

-- Add index for email lookups if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_payments_email') THEN
    CREATE INDEX idx_user_payments_email ON public.user_payments(email);
  END IF;
END $$;