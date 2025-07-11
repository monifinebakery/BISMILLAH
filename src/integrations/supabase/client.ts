// src/integrations/supabase/serverClient.ts
// Ini adalah klien Supabase untuk penggunaan di sisi server (API Routes, Edge Functions)
// Menggunakan SUPABASE_SERVICE_ROLE_KEY untuk akses penuh.

import { createClient } from '@supabase/supabase-js';

// Pastikan variabel lingkungan ini terdefinisi di lingkungan server Anda
// Untuk Next.js, ini biasanya diakses tanpa 'NEXT_PUBLIC_' prefix di API routes/middleware.
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Pastikan Anda tidak mengekspos kunci ini ke frontend!
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase URL or Service Role Key in server environment variables.');
  //throw new Error('Supabase URL and Service Role Key must be defined.');
  // Dalam production, Anda mungkin ingin melempar error atau menangani dengan cara yang lebih kuat.
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false, // Tidak perlu refresh token di server middleware
    persistSession: false,   // Tidak perlu persistensi sesi di server middleware
    detectSessionInUrl: false, // Tidak perlu deteksi sesi dari URL di server middleware
  },
});