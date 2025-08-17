// src/integrations/supabase/serverClient.ts
// Ini adalah klien Supabase yang dikonfigurasi untuk penggunaan di sisi server (API Routes, Edge Functions, Middleware).
// Menggunakan SUPABASE_SERVICE_ROLE_KEY untuk akses penuh ke database dan melewati RLS.

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types'; // Impor tipe database dari file yang sudah ada

// Pastikan variabel lingkungan ini terdefinisi di lingkungan server Anda.
// Untuk Next.js API Routes/Middleware, ini diakses tanpa prefix 'NEXT_PUBLIC_'.
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Sangat penting: Pastikan kunci service role Anda aman dan tidak terekspos ke frontend.
if (!supabaseUrl || !supabaseServiceRoleKey) {
  // Use error throwing instead of console.error for server environment
  throw new Error('CRITICAL: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined for server client');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false, // Tidak perlu refresh token di server middleware
    persistSession: false,   // Tidak perlu persistensi sesi di server middleware
    detectSessionInUrl: false, // Tidak perlu deteksi sesi dari URL di server middleware
  },
});