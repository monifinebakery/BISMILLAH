/*
  # User Payments Table

  1. New Tables
    - `user_payments` - Stores payment information for premium features
  
  2. Security
    - Enable RLS on the table
    - Add policies for view, insert, and update operations
  
  3. Automation
    - Add trigger for updated_at timestamp
    - Add trigger to create payment record for new users
  
  4. Performance
    - Add indexes for common queries
*/

-- Create table for user payments if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_payments') THEN
    CREATE TABLE public.user_payments (
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
  END IF;
END $$;

-- Add Row Level Security (RLS) if not already enabled
ALTER TABLE public.user_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for user_payments if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_payments' AND policyname = 'Users can view their own payment status') THEN
    CREATE POLICY "Users can view their own payment status" 
      ON public.user_payments 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_payments' AND policyname = 'Users can insert their own payment records') THEN
    CREATE POLICY "Users can insert their own payment records" 
      ON public.user_payments 
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_payments' AND policyname = 'Users can update their own payment records') THEN
    CREATE POLICY "Users can update their own payment records" 
      ON public.user_payments 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Create trigger to update updated_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_payments_updated_at') THEN
    CREATE TRIGGER update_user_payments_updated_at
        BEFORE UPDATE ON public.user_payments
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Create indexes for better performance if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_payments_user_id') THEN
    CREATE INDEX idx_user_payments_user_id ON public.user_payments(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_payments_scalev_id') THEN
    CREATE INDEX idx_user_payments_scalev_id ON public.user_payments(scalev_payment_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_payments_status') THEN
    CREATE INDEX idx_user_payments_status ON public.user_payments(payment_status);
  END IF;
END $$;

-- Function to initialize payment record for new users if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user_payment') THEN
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
  END IF;
END $$;

-- Trigger to create payment record when user signs up if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_payment') THEN
    CREATE TRIGGER on_auth_user_created_payment
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_payment();
  END IF;
END $$;