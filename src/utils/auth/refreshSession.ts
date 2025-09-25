// src/utils/auth/refreshSession.ts
// 
// SESSION REFRESH POLICY: ONLY THROUGH SUPABASE SDK
// ================================================
// All session refresh operations must go through Supabase SDK methods.
// This module provides utilities to safely refresh sessions but never
// stores session data independently - always relies on Supabase as
// the single source of truth.
//
// Key responsibilities:
// 1. Refresh sessions only through official Supabase SDK methods
// 2. Handle refresh failures gracefully with proper error propagation
// 3. Prevent race conditions during concurrent refresh attempts
// 4. Never cache or store refreshed sessions locally - rely on Supabase
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

let refreshPromise: Promise<boolean> | null = null;

/**
 * Fungsi untuk merefresh session Supabase secara silent (tidak log secara intrusif)
 * @returns Session yang diperbarui atau null jika gagal
 */
export async function silentRefreshSession(): Promise<boolean> {
  // Cegah multiple refresh bersamaan
  if (refreshPromise) {
    logger.debug('🔄 [SILENT REFRESH] Refresh already in progress, waiting...');
    return await refreshPromise;
  }
  
  refreshPromise = performRefreshSession();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function performRefreshSession(): Promise<boolean> {
  try {
    // First check if there's a current session to refresh
    const { data: { session: currentSession }, error: getSessionError } = await supabase.auth.getSession();
    
    if (getSessionError) {
      logger.debug('⚠️ [SILENT REFRESH] Error getting current session:', getSessionError);
      return false;
    }
    
    if (!currentSession) {
      logger.debug('⚠️ [SILENT REFRESH] No current session to refresh');
      return false;
    }
    
    // Only attempt refresh if we have a session
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      // Handle specific AuthSessionMissingError
      if (error.message?.includes('Auth session missing') || error.name === 'AuthSessionMissingError') {
        logger.debug('⚠️ [SILENT REFRESH] No session available to refresh (AuthSessionMissingError)');
      } else {
        logger.debug('⚠️ [SILENT REFRESH] Failed to refresh session:', error);
      }
      return false;
    }
    
    if (session) {
      logger.debug('✅ [SILENT REFRESH] Session refreshed successfully', {
        hasSession: !!session,
        userId: session.user?.id,
        expiresAt: session.expires_at
      });
      // NOTE: Session is managed by Supabase, not stored locally
      return true;
    } else {
      logger.debug('⚠️ [SILENT REFRESH] No session returned from refresh');
      return false;
    }
  } catch (error) {
    logger.debug('⚠️ [SILENT REFRESH] Unexpected error during refresh:', error);
    return false;
  }
}

// Juga eksport fungsi refreshSession lama untuk backward compatibility sementara
export async function refreshSession(): Promise<boolean> {
  return await silentRefreshSession();
}

/**
 * Fungsi untuk mengecek apakah session valid dan merefresh jika perlu
 * @returns true jika session valid, false jika tidak
 */
export async function ensureValidSession(): Promise<boolean> {
  try {
    // Ambil session saat ini
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.debug('⚠️ [ENSURE VALID SESSION] Error getting session:', error);
      return false;
    }
    
    if (!session) {
      logger.debug('⚠️ [ENSURE VALID SESSION] No session found');
      return false;
    }
    
    // Cek apakah session belum kadaluarsa (dengan margin 15 menit)
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at;
    
    if (!expiresAt || expiresAt < now + (15 * 60)) { // 15 minutes before expiry
      logger.info('🔄 [ENSURE VALID SESSION] Session expired or about to expire, refreshing...');
      
      const refreshSuccess = await silentRefreshSession();
      if (refreshSuccess) {
        logger.debug('✅ [ENSURE VALID SESSION] Session successfully refreshed');
        return true;
      } else {
        logger.warn('⚠️ [ENSURE VALID SESSION] Failed to refresh session');
        return false;
      }
    }
    
    logger.debug('✅ [ENSURE VALID SESSION] Session is valid');
    return true;
  } catch (error) {
    logger.warn('⚠️ [ENSURE VALID SESSION] Unexpected error:', error);
    return false;
  }
}

/**
 * Fungsi untuk mengeksekusi permintaan Supabase dengan validasi session saat error
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
    try {
      const result = await request();
      logger.debug('✅ [EXECUTE WITH AUTH VALIDATION] Request executed successfully');
      return result;
    } catch (error: any) {
      // Cek apakah error terkait auth (401 Unauthorized)
      if (error?.status === 401 || (error?.code && ['401', 'JWT_EXPIRED', 'UNAUTHORIZED'].includes(error.code.toString().toUpperCase()))) {
        logger.info('⚠️ [EXECUTE WITH AUTH VALIDATION] Auth error detected, attempting refresh:', error);
        
        // Coba refresh session
        const refreshSuccess = await silentRefreshSession();
        if (refreshSuccess && attempt < retries) {
          attempt++;
          // Tunggu sebentar sebelum mencoba lagi
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
      }
      
      // Jika bukan error auth atau sudah mencapai batas percobaan, lempar error
      logger.debug('❌ [EXECUTE WITH AUTH VALIDATION] Request failed:', error);
      throw error;
    }
  }
  
  throw new Error('Max retries reached for auth validation');
}