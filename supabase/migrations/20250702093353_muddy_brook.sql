/*
  # Old Payments History Table

  1. New Tables
    - `old_payments_history` - Stores payment information for existing users
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `payment_date` (timestamp)
      - `amount` (numeric)
      - `currency` (text)
      - `is_paid` (boolean)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `old_payments_history` table
    - Add policies for admins to manage records
*/

-- Create table for old payments history if not exists
CREATE TABLE IF NOT EXISTS public.old_payments_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  payment_date TIMESTAMP WITH TIME ZONE,
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

-- Create trigger to update updated_at column
CREATE TRIGGER update_old_payments_history_updated_at
    BEFORE UPDATE ON public.old_payments_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_old_payments_history_email ON public.old_payments_history(email);
CREATE INDEX IF NOT EXISTS idx_old_payments_history_payment_date ON public.old_payments_history(payment_date);