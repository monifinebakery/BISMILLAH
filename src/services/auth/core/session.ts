// src/services/auth/core/session.ts - IMPROVED SESSION MANAGEMENT
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { CACHE_DURATION } from '@/services/auth/config';

// Session cache
let sessionCache: Session | null = null;
let cacheTimestamp: number = 0;

// ✅ Enhanced session cache clearing with optional payment cache clearing
export const clearSessionCache = (clearPaymentCache: boolean = false) => {
  logger.debug('[Session] Clearing session cache', { clearPaymentCache });
  sessionCache = null;
  cacheTimestamp = 0;
  
  // ✅ IMPROVED: Only clear payment cache when explicitly requested
  if (clearPaymentCache && typeof window !== 'undefined' && (window as any).queryClient) {
    try {
      const queryClient = (window as any).queryClient;
      queryClient.invalidateQueries({ queryKey: ['paymentStatus'] });
      logger.debug('[Session] React Query payment cache cleared');
    } catch (error) {
      logger.warn('[Session] Failed to clear React Query cache:', error);
    }
  }
};

// ✅ NEW: Safe session cache update function
export const updateSessionCache = (session: Session | null) => {
  if (session) {
    logger.debug('[Session] Updating session cache', { 
      userId: session.user?.id, 
      email: session.user?.email 
    });
    sessionCache = session;
    cacheTimestamp = Date.now();
  } else {
    logger.debug('[Session] Clearing session cache via update');
    clearSessionCache();
  }
};

export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const now = Date.now();
    
    // Return cached session if still valid
    if (sessionCache && (now - cacheTimestamp) < CACHE_DURATION) {
      logger.debug('[Session] Returning cached session', { 
        userId: sessionCache.user?.id,
        cacheAge: now - cacheTimestamp 
      });
      return sessionCache;
    }

    logger.debug('[Session] Fetching fresh session from Supabase');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('[Session] Error getting session:', error);
      clearSessionCache();
      return null;
    }
    
    // Check if session is expired
    if (session && session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
      logger.info('[Session] Session expired, clearing cache');
      clearSessionCache();
      return null;
    }
    
    // ✅ Update cache with fresh session
    updateSessionCache(session);
    
    logger.debug('[Session] Fresh session retrieved and cached', { 
      hasSession: !!session,
      userId: session?.user?.id 
    });
    
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
      logger.success('[Session] Session refreshed successfully', {
        userId: data.session.user?.id,
        email: data.session.user?.email
      });
      
      // ✅ Update cache with refreshed session
      updateSessionCache(data.session);
      return data.session;
    }
    
    logger.warn('[Session] Session refresh returned no session');
    clearSessionCache();
    return null;
  } catch (error) {
    logger.error('[Session] Error refreshing session:', error);
    clearSessionCache();
    return null;
  }
};

// ✅ NEW: Get session cache info for debugging
export const getSessionCacheInfo = () => {
  const now = Date.now();
  const cacheAge = cacheTimestamp > 0 ? now - cacheTimestamp : 0;
  const isValid = sessionCache && cacheAge < CACHE_DURATION;
  
  return {
    hasCache: !!sessionCache,
    cacheAge,
    isValid,
    userId: sessionCache?.user?.id || null,
    email: sessionCache?.user?.email || null,
    expiresAt: sessionCache?.expires_at || null
  };
};

// ✅ NEW: Force invalidate cache (for logout scenarios)
export const invalidateSessionCache = () => {
  logger.info('[Session] Force invalidating session cache');
  clearSessionCache(true); // Also clear payment cache on logout
};