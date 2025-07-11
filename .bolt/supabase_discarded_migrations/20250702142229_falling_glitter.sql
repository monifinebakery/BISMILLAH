-- Create table for old payments history if not exists
CREATE TABLE IF NOT EXISTS public.old_payments_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'IDR',
  is_paid BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.old_payments_history ENABLE ROW LEVEL SECURITY;

-- Create policies for old_payments_history if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'old_payments_history' AND policyname = 'Admins can view old payment records'
  ) THEN
    CREATE POLICY "Admins can view old payment records" 
      ON public.old_payments_history 
      FOR SELECT 
      USING ((SELECT role FROM public.user_settings WHERE user_id = auth.uid()) = 'admin');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'old_payments_history' AND policyname = 'Admins can insert old payment records'
  ) THEN
    CREATE POLICY "Admins can insert old payment records" 
      ON public.old_payments_history 
      FOR INSERT 
      WITH CHECK ((SELECT role FROM public.user_settings WHERE user_id = auth.uid()) = 'admin');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'old_payments_history' AND policyname = 'Admins can update old payment records'
  ) THEN
    CREATE POLICY "Admins can update old payment records" 
      ON public.old_payments_history 
      FOR UPDATE 
      USING ((SELECT role FROM public.user_settings WHERE user_id = auth.uid()) = 'admin');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'old_payments_history' AND policyname = 'Admins can delete old payment records'
  ) THEN
    CREATE POLICY "Admins can delete old payment records" 
      ON public.old_payments_history 
      FOR DELETE 
      USING ((SELECT role FROM public.user_settings WHERE user_id = auth.uid()) = 'admin');
  END IF;
END $$;

-- Create function to update updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;

-- Create trigger to update updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_old_payments_history_updated_at'
  ) THEN
    CREATE TRIGGER update_old_payments_history_updated_at
        BEFORE UPDATE ON public.old_payments_history
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes for better performance if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_old_payments_history_email'
  ) THEN
    CREATE INDEX idx_old_payments_history_email ON public.old_payments_history(email);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_old_payments_history_payment_date'
  ) THEN
    CREATE INDEX idx_old_payments_history_payment_date ON public.old_payments_history(payment_date);
  END IF;
END $$;