// src/services/auth/core/session.ts
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { CACHE_DURATION } from '@/services/auth/config';

// Session cache
let sessionCache: Session | null = null;
let cacheTimestamp: number = 0;

export const clearSessionCache = () => {
  sessionCache = null;
  cacheTimestamp = 0;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const now = Date.now();
    if (sessionCache && (now - cacheTimestamp) < CACHE_DURATION) {
      return sessionCache;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('[AuthService] Error getting session:', error);
      clearSessionCache();
      return null;
    }
    
    sessionCache = session;
    cacheTimestamp = now;
    
    if (session && session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
      logger.info('[AuthService] Session expired');
      clearSessionCache();
      return null;
    }
    
    return session;
  } catch (error) {
    logger.error('[AuthService] Error getting current session:', error);
    clearSessionCache();
    return null;
  }
};

export const refreshSession = async (): Promise<Session | null> => {
  try {
    logger.info('[AuthService] Refreshing session...');
    
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      logger.error('[AuthService] Session refresh error:', error);
      clearSessionCache();
      return null;
    }
    
    if (data.session) {
      logger.success('[AuthService] Session refreshed successfully');
      clearSessionCache();
      return data.session;
    }
    
    return null;
  } catch (error) {
    logger.error('[AuthService] Error refreshing session:', error);
    clearSessionCache();
    return null;
  }
};