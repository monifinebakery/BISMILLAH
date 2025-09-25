-- Temporary RLS policy untuk testing chatbot
-- Jalankan di Supabase SQL Editor

-- 1. Backup existing policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'bahan_baku';

-- 2. Add temporary policy untuk anonymous testing
CREATE POLICY "temp_chatbot_testing" ON bahan_baku
FOR SELECT 
TO anon
USING (true);

-- 3. Untuk rollback nanti (jangan jalankan sekarang):
-- DROP POLICY "temp_chatbot_testing" ON bahan_baku;
