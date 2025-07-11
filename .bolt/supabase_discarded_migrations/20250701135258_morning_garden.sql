/*
  # Developer Account Setup

  1. Changes
    - Make developer account always premium
*/

-- Make monifinebakery@gmail.com always premium (developer account)
INSERT INTO public.user_payments (
  user_id,
  is_paid,
  payment_status,
  scalev_payment_id,
  order_id,
  email,
  name,
  created_at,
  updated_at
) 
VALUES (
  'c0623768-c6f6-48ce-8583-f82dab5d37ab',
  true,
  'completed',
  'dev_premium_access',
  'DEV-ACCOUNT-001',
  'monifinebakery@gmail.com',
  'Developer',
  now(),
  now()
) 
ON CONFLICT (user_id) 
DO UPDATE SET
  is_paid = true,
  payment_status = 'completed',
  scalev_payment_id = 'dev_premium_access',
  order_id = 'DEV-ACCOUNT-001',
  email = 'monifinebakery@gmail.com',
  name = 'Developer',
  updated_at = now();