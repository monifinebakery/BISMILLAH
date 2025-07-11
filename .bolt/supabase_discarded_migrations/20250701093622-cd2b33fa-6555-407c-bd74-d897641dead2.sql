
-- Create table for user payments
CREATE TABLE public.user_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  payment_date TIMESTAMP WITH TIME ZONE,
  scalev_payment_id TEXT,
  plan_type TEXT NOT NULL DEFAULT 'basic',
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'IDR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.user_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for user_payments
CREATE POLICY "Users can view their own payment status" 
  ON public.user_payments 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment records" 
  ON public.user_payments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment records" 
  ON public.user_payments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at column
CREATE TRIGGER update_user_payments_updated_at
    BEFORE UPDATE ON public.user_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_payments_user_id ON public.user_payments(user_id);
CREATE INDEX idx_user_payments_scalev_id ON public.user_payments(scalev_payment_id);
CREATE INDEX idx_user_payments_status ON public.user_payments(status);

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
CREATE TRIGGER on_auth_user_created_payment
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_payment();
