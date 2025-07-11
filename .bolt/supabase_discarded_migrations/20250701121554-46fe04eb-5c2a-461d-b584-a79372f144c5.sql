
-- Update user_payments table to match Scalev webhook data structure
ALTER TABLE public.user_payments 
ADD COLUMN IF NOT EXISTS order_id TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS name TEXT;

-- Update the status column name to match Scalev (rename payment_status to status if needed)
-- Note: The table already has 'status' column, so we'll keep using that

-- Add index for better performance on order_id lookups
CREATE INDEX IF NOT EXISTS idx_user_payments_order_id ON public.user_payments(order_id);

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_payments_email ON public.user_payments(email);
