// src/services/auth/core/session.ts - SIMPLIFIED VERSION
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { CACHE_DURATION } from '@/services/auth/config';

// ✅ SIMPLIFIED: Minimal session cache for utility functions only
// AuthContext handles the main session management
let sessionCache: Session | null = null;
let cacheTimestamp: number = 0;

// ✅ Basic session cache clearing
export const clearSessionCache = () => {
  logger.debug('[Session] Clearing utility session cache');
  sessionCache = null;
  cacheTimestamp = 0;
};

// ✅ REMOVED: updateSessionCache to avoid conflicts with AuthContext
// AuthContext manages session state, this service is just for utility functions

export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const now = Date.now();
    
    // Return cached session if still valid (short cache for utilities)
    if (sessionCache && (now - cacheTimestamp) < (CACHE_DURATION / 4)) { // Shorter cache
      logger.debug('[Session] Returning cached session for utility');
      return sessionCache;
    }

    logger.debug('[Session] Fetching fresh session from Supabase for utility');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('[Session] Error getting session:', error);
      clearSessionCache();
      return null;
    }
    
    // Check if session is expired
    if (session && session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
      logger.debug('[Session] Session expired, clearing cache');
      clearSessionCache();
      return null;
    }
    
    // ✅ Simple cache update for utilities
    if (session) {
      sessionCache = session;
      cacheTimestamp = now;
      logger.debug('[Session] Fresh session cached for utility');
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
      // ✅ Simple cache update
      sessionCache = data.session;
      cacheTimestamp = Date.now();
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

// ✅ Get session cache info for debugging
export const getSessionCacheInfo = () => {
  const now = Date.now();
  const cacheAge = cacheTimestamp > 0 ? now - cacheTimestamp : 0;
  const isValid = sessionCache && cacheAge < (CACHE_DURATION / 4);
  
  return {
    hasCache: !!sessionCache,
    cacheAge,
    isValid,
    userId: sessionCache?.user?.id || null,
    email: sessionCache?.user?.email || null,
    expiresAt: sessionCache?.expires_at || null
  };
};

// ✅ Force invalidate cache (for logout scenarios)
export const invalidateSessionCache = () => {
  logger.info('[Session] Force invalidating session cache');
  clearSessionCache();
};