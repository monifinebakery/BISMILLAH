-- Konversi kolom orders.items yang masih berupa string menjadi array jsonb
UPDATE public.orders
SET items = COALESCE(items::text::jsonb, '[]'::jsonb)
WHERE jsonb_typeof(items) = 'string';
