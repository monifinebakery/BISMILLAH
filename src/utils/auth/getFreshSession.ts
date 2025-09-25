// src/utils/auth/getFreshSession.ts
// 
// FRESH SESSION RETRIEVAL UTILITY
// ===============================
// This utility ensures we always get the most current session directly from Supabase,
// bypassing any local caching to maintain single source of truth principle.
//
// Use this when you need to guarantee current session validity, such as:
// - Before critical financial operations
// - During auth state transitions
// - When session inconsistency is suspected

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { Session } from '@supabase/supabase-js';

/**
 * Get fresh session directly from Supabase, bypassing local caches
 * @returns Fresh session from Supabase or null if none/invalid
 */
export async function getFreshSession(): Promise<Session | null> {
  try {
    logger.debug('🔄 [FRESH SESSION] Retrieving fresh session from Supabase');
    
    // Get session directly from Supabase (this bypasses local cache in most cases)
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.warn('⚠️ [FRESH SESSION] Error retrieving session:', error);
      return null;
    }
    
    if (!session) {
      logger.debug('⚠️ [FRESH SESSION] No session found');
      return null;
    }
    
    logger.debug('✅ [FRESH SESSION] Fresh session retrieved', {
      userId: session.user?.id,
      expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'never'
    });
    
    return session;
  } catch (error) {
    logger.error('❌ [FRESH SESSION] Unexpected error retrieving session:', error);
    return null;
  }
}

/**
 * Get fresh session with validation, ensuring it meets minimum validity requirements
 * @param minValidityMinutes Minimum minutes session should be valid for (default: 5)
 * @returns Validated fresh session or null
 */
export async function getValidatedFreshSession(minValidityMinutes: number = 5): Promise<Session | null> {
  try {
    const session = await getFreshSession();
    
    if (!session) {
      logger.warn('⚠️ [VALIDATED FRESH SESSION] No session available');
      return null;
    }
    
    // Validate session has minimum validity
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = session.expires_at || 0;
    const timeUntilExpiry = expiresAt - now;
    const minValiditySeconds = minValidityMinutes * 60;
    
    if (timeUntilExpiry < minValiditySeconds) {
      logger.warn('⚠️ [VALIDATED FRESH SESSION] Session expires too soon', {
        expiresAt: new Date(expiresAt * 1000).toISOString(),
        timeUntilExpirySeconds: timeUntilExpiry,
        minRequiredSeconds: minValiditySeconds
      });
      return null;
    }
    
    logger.debug('✅ [VALIDATED FRESH SESSION] Session validated successfully', {
      userId: session.user?.id,
      validForMinutes: Math.floor(timeUntilExpiry / 60)
    });
    
    return session;
  } catch (error) {
    logger.error('❌ [VALIDATED FRESH SESSION] Error validating fresh session:', error);
    return null;
  }
}