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

-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Admins can view old payment records" ON public.old_payments_history;
DROP POLICY IF EXISTS "Admins can insert old payment records" ON public.old_payments_history;
DROP POLICY IF EXISTS "Admins can update old payment records" ON public.old_payments_history;
DROP POLICY IF EXISTS "Admins can delete old payment records" ON public.old_payments_history;

-- Create policies for old_payments_history
CREATE POLICY "Admins can view old payment records" 
  ON public.old_payments_history 
  FOR SELECT 
  USING ((SELECT role FROM public.user_settings WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Admins can insert old payment records" 
  ON public.old_payments_history 
  FOR INSERT 
  WITH CHECK ((SELECT role FROM public.user_settings WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update old payment records" 
  ON public.old_payments_history 
  FOR UPDATE 
  USING ((SELECT role FROM public.user_settings WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Admins can delete old payment records" 
  ON public.old_payments_history 
  FOR DELETE 
  USING ((SELECT role FROM public.user_settings WHERE user_id = auth.uid()) = 'admin');

-- Create or replace function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create it
DROP TRIGGER IF EXISTS update_old_payments_history_updated_at ON public.old_payments_history;
CREATE TRIGGER update_old_payments_history_updated_at
    BEFORE UPDATE ON public.old_payments_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance (IF NOT EXISTS is supported for indexes)
CREATE INDEX IF NOT EXISTS idx_old_payments_history_email ON public.old_payments_history(email);
CREATE INDEX IF NOT EXISTS idx_old_payments_history_payment_date ON public.old_payments_history(payment_date);