// src/services/auth/core/session.ts - OPTIMIZED FOR AUTHCONTEXT COMPATIBILITY
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

// ✅ CRITICAL: Prevent cache conflicts with AuthContext
// Use very short cache duration to avoid stale data
const UTILITY_CACHE_DURATION = 1000; // Only 1 second for utilities

export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const now = Date.now();
    
    // ✅ SHORTENED: Very short cache for utilities to avoid conflicts with AuthContext
    if (sessionCache && (now - cacheTimestamp) < UTILITY_CACHE_DURATION) {
      logger.debug('[Session] Returning cached session for utility (very short cache)');
      return sessionCache;
    }

    logger.debug('[Session] Fetching fresh session from Supabase for utility');
    
    // ✅ ADD TIMEOUT: Prevent hanging utilities
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session utility timeout')), 5000)
    );
    
    const { data: { session }, error } = await Promise.race([
      sessionPromise,
      timeoutPromise
    ]) as any;
    
    if (error) {
      logger.error('[Session] Error getting session:', error);
      clearSessionCache();
      return null;
    }
    
    // ✅ Enhanced session validation
    if (session) {
      // Check if session is expired
      if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
        logger.debug('[Session] Session expired, clearing cache');
        clearSessionCache();
        return null;
      }
      
      // Check user validity
      if (!session.user || !session.user.id || session.user.id === 'null') {
        logger.warn('[Session] Invalid user in session, clearing cache');
        clearSessionCache();
        return null;
      }
      
      // ✅ Simple cache update for utilities with short duration
      sessionCache = session;
      cacheTimestamp = now;
      logger.debug('[Session] Fresh session cached for utility (1s duration)');
    } else {
      clearSessionCache();
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
    
    // ✅ ADD TIMEOUT: Prevent hanging refresh
    const refreshPromise = supabase.auth.refreshSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session refresh timeout')), 10000)
    );
    
    const { data, error } = await Promise.race([
      refreshPromise,
      timeoutPromise
    ]) as any;
    
    if (error) {
      logger.error('[Session] Session refresh error:', error);
      clearSessionCache();
      return null;
    }
    
    if (data.session && data.session.user && data.session.user.id !== 'null') {
      logger.success('[Session] Session refreshed successfully');
      // ✅ Simple cache update with validation
      sessionCache = data.session;
      cacheTimestamp = Date.now();
      return data.session;
    }
    
    logger.warn('[Session] Session refresh returned invalid session');
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
  const isValid = sessionCache && cacheAge < UTILITY_CACHE_DURATION;
  
  return {
    hasCache: !!sessionCache,
    cacheAge,
    isValid,
    cacheDuration: UTILITY_CACHE_DURATION,
    userId: sessionCache?.user?.id || null,
    email: sessionCache?.user?.email || null,
    expiresAt: sessionCache?.expires_at || null,
    userIdValid: sessionCache?.user?.id && sessionCache.user.id !== 'null'
  };
};

// ✅ Force invalidate cache (for logout scenarios)
export const invalidateSessionCache = () => {
  logger.info('[Session] Force invalidating session cache');
  clearSessionCache();
};

// ✅ NEW: Check if session cache is synced with AuthContext
export const validateSessionCacheSync = (authContextUser: any) => {
  const cacheInfo = getSessionCacheInfo();
  const isSync = cacheInfo.userId === authContextUser?.id;
  
  if (!isSync && cacheInfo.hasCache && authContextUser) {
    logger.warn('[Session] Cache out of sync with AuthContext, clearing cache');
    clearSessionCache();
  }
  
  return isSync;
};