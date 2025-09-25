// src/utils/auth/refreshSession.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Fungsi untuk merefresh session Supabase
 * @returns Session yang diperbarui atau null jika gagal
 */
export async function refreshSession(): Promise<boolean> {
  try {
    logger.info('🔄 [REFRESH SESSION] Attempting to refresh session');
    
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      logger.error('❌ [REFRESH SESSION] Failed to refresh session:', error);
      return false;
    }
    
    if (session) {
      logger.success('✅ [REFRESH SESSION] Session refreshed successfully', {
        hasSession: !!session,
        userId: session.user?.id,
        expiresAt: session.expires_at
      });
      return true;
    } else {
      logger.warn('⚠️ [REFRESH SESSION] No session returned from refresh');
      return false;
    }
  } catch (error) {
    logger.error('❌ [REFRESH SESSION] Unexpected error during refresh:', error);
    return false;
  }
}

/**
 * Fungsi untuk mengecek apakah session valid dan merefresh jika perlu
 * @returns true jika session valid, false jika tidak
 */
export async function ensureValidSession(): Promise<boolean> {
  try {
    logger.info('🔍 [ENSURE VALID SESSION] Checking session validity');
    
    // Ambil session saat ini
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('❌ [ENSURE VALID SESSION] Error getting session:', error);
      return false;
    }
    
    if (!session) {
      logger.warn('⚠️ [ENSURE VALID SESSION] No session found');
      return false;
    }
    
    // Cek apakah session belum kadaluarsa (dengan margin 5 menit)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    
    if (!expiresAt || expiresAt < now + (5 * 60)) { // 5 minutes before expiry
      logger.info('🔄 [ENSURE VALID SESSION] Session expired or about to expire, refreshing...');
      
      const refreshSuccess = await refreshSession();
      if (refreshSuccess) {
        logger.success('✅ [ENSURE VALID SESSION] Session successfully refreshed');
        return true;
      } else {
        logger.error('❌ [ENSURE VALID SESSION] Failed to refresh session');
        return false;
      }
    }
    
    logger.info('✅ [ENSURE VALID SESSION] Session is valid');
    return true;
  } catch (error) {
    logger.error('❌ [ENSURE VALID SESSION] Unexpected error:', error);
    return false;
  }
}

/**
 * Fungsi untuk mengeksekusi permintaan Supabase dengan validasi session terlebih dahulu
 * @param request Fungsi yang mengembalikan permintaan Supabase
 * @param retries Jumlah percobaan ulang jika auth gagal
 * @returns Hasil permintaan atau error
 */
export async function executeWithAuthValidation<T>(
  request: () => Promise<T>,
  retries: number = 1
): Promise<T> {
  let attempt = 0;
  
  while (attempt <= retries) {
    // Pastikan session valid sebelum eksekusi
    const isValid = await ensureValidSession();
    
    if (!isValid) {
      logger.error(`❌ [EXECUTE WITH AUTH VALIDATION] Failed to validate session, attempt ${attempt + 1}/${retries + 1}`);
      
      if (attempt < retries) {
        attempt++;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Tunggu sebelum coba lagi
        continue;
      } else {
        throw new Error('Session not valid and refresh failed');
      }
    }
    
    try {
      const result = await request();
      logger.info('✅ [EXECUTE WITH AUTH VALIDATION] Request executed successfully');
      return result;
    } catch (error: any) {
      // Cek apakah error terkait auth (401 Unauthorized)
      if (error?.status === 401 || (error?.code && ['401', 'JWT_EXPIRED', 'UNAUTHORIZED'].includes(error.code.toString().toUpperCase()))) {
        logger.warn('⚠️ [EXECUTE WITH AUTH VALIDATION] Auth error detected, attempting refresh:', error);
        
        // Coba refresh session
        const refreshSuccess = await refreshSession();
        if (refreshSuccess && attempt < retries) {
          attempt++;
          // Tunggu sebentar sebelum mencoba lagi
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
      }
      
      // Jika bukan error auth atau sudah mencapai batas percobaan, lempar error
      logger.error('❌ [EXECUTE WITH AUTH VALIDATION] Request failed:', error);
      throw error;
    }
  }
  
  throw new Error('Max retries reached for auth validation');
}