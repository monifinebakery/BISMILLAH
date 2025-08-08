/ ===== 2. src/services/auth/core/session.ts - ENHANCED =====
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { CACHE_DURATION } from '@/services/auth/config';

// Session cache
let sessionCache: Session | null = null;
let cacheTimestamp: number = 0;

// ✅ Enhanced session cache clearing
export const clearSessionCache = () => {
  logger.debug('[Session] Clearing session cache');
  sessionCache = null;
  cacheTimestamp = 0;
  
  // Also clear any React Query cache if available
  if (typeof window !== 'undefined' && (window as any).queryClient) {
    try {
      const queryClient = (window as any).queryClient;
      queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
      logger.debug('[Session] React Query cache cleared');
    } catch (error) {
      logger.warn('[Session] Failed to clear React Query cache:', error);
    }
  }
};

export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const now = Date.now();
    
    // Return cached session if still valid
    if (sessionCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return sessionCache;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('[Session] Error getting session:', error);
      clearSessionCache();
      return null;
    }
    
    // Update cache
    sessionCache = session;
    cacheTimestamp = now;
    
    // Check if session is expired
    if (session && session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
      logger.info('[Session] Session expired');
      clearSessionCache();
      return null;
    }
    
    return session;
  } catch (error) {
    logger.error('[Session] Error getting current session:', error);
    clearSessionCache();
    return null;
  }
};

export const refreshSession = async (): Promise<Session | null> => {
  try {
    logger.info('[Session] Refreshing session...');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      logger.error('[Session] Session refresh error:', error);
      clearSessionCache();
      return null;
    }
    
    if (data.session) {
      logger.success('[Session] Session refreshed successfully');
      // Clear cache so next call gets fresh session
      clearSessionCache();
      return data.session;
    }
    
    return null;
  } catch (error) {
    logger.error('[Session] Error refreshing session:', error);
    clearSessionCache();
    return null;
  }
};