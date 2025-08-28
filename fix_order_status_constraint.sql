-- Fix order status constraint to match application status values
-- This replaces the current constraint with the correct status values

-- Drop the existing constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_valid;

-- Add the new constraint with correct status values
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_valid 
CHECK (status = ANY (ARRAY[
  'pending'::text, 
  'confirmed'::text, 
  'preparing'::text, 
  'ready'::text, 
  'delivered'::text, 
  'cancelled'::text, 
  'completed'::text
]));

-- Update any existing invalid status values to 'pending' as fallback
UPDATE public.orders 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled', 'completed');
