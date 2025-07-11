-- Add role field to user_settings table
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Create policy for admin access
CREATE POLICY "Admins can view all user settings" 
  ON public.user_settings 
  FOR SELECT 
  USING (
    (SELECT role FROM public.user_settings WHERE user_id = auth.uid()) = 'admin'
  );

-- Create policy for admin access to user_payments
CREATE POLICY "Admins can view all payment records" 
  ON public.user_payments 
  FOR SELECT 
  USING (
    (SELECT role FROM public.user_settings WHERE user_id = auth.uid()) = 'admin'
  );

-- Create policy for admin to update payment records
CREATE POLICY "Admins can update all payment records" 
  ON public.user_payments 
  FOR UPDATE 
  USING (
    (SELECT role FROM public.user_settings WHERE user_id = auth.uid()) = 'admin'
  );

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_settings 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;