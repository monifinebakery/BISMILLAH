/*
  # User Payments System

  1. New Tables
    - `user_payments` - Stores payment information for users
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `is_paid` (boolean)
      - `payment_date` (timestamp)
      - `scalev_payment_id` (text)
      - `plan_type` (text)
      - `amount` (numeric)
      - `currency` (text)
      - `payment_status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `user_payments` table
    - Add policies for viewing, inserting, and updating payment records
  
  3. Functions
    - Create function to handle new user payment records
    - Create trigger for automatic payment record creation
*/

-- Create table for user payments if not exists
CREATE TABLE IF NOT EXISTS public.user_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  payment_date TIMESTAMP WITH TIME ZONE,
  scalev_payment_id TEXT,
  plan_type TEXT NOT NULL DEFAULT 'basic',
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'IDR',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.user_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for user_payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_payments' AND policyname = 'Users can view their own payment status'
  ) THEN
    CREATE POLICY "Users can view their own payment status" 
      ON public.user_payments 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_payments' AND policyname = 'Users can insert their own payment records'
  ) THEN
    CREATE POLICY "Users can insert their own payment records" 
      ON public.user_payments 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_payments' AND policyname = 'Users can update their own payment records'
  ) THEN
    CREATE POLICY "Users can update their own payment records" 
      ON public.user_payments 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create trigger to update updated_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_payments_updated_at'
  ) THEN
    CREATE TRIGGER update_user_payments_updated_at
      BEFORE UPDATE ON public.user_payments
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_payments_user_id ON public.user_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payments_scalev_id ON public.user_payments(scalev_payment_id);
CREATE INDEX IF NOT EXISTS idx_user_payments_status ON public.user_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_user_payments_order_id ON public.user_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_user_payments_email ON public.user_payments(email);

-- Function to initialize payment record for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_payment()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_payments (user_id, is_paid, plan_type, amount)
    VALUES (NEW.id, false, 'basic', 0);
    RETURN NEW;
END;
$$;

-- Trigger to create payment record when user signs up
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created_payment'
  ) THEN
    CREATE TRIGGER on_auth_user_created_payment
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_payment();
  END IF;
END $$;

-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_payments' AND column_name = 'order_id'
  ) THEN
    ALTER TABLE public.user_payments ADD COLUMN order_id TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_payments' AND column_name = 'email'
  ) THEN
    ALTER TABLE public.user_payments ADD COLUMN email TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_payments' AND column_name = 'name'
  ) THEN
    ALTER TABLE public.user_payments ADD COLUMN name TEXT;
  END IF;
END $$;