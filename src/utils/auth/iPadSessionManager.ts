// src/utils/auth/iPadSessionManager.ts
// iPad/Safari specific session management utilities
// Handles Safari's aggressive tab management and session storage issues

import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

/**
 * Detect if device is iPad/Tablet
 */
export const detectTabletDevice = () => {
  const userAgent = navigator.userAgent;
  const isIPad = /iPad/.test(userAgent);
  const isTablet = /Tablet|iPad|Android/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(userAgent);
  
  return {
    isIPad,
    isTablet,
    isSafariTablet: (isIPad || isTablet) && isSafari,
    userAgent
  };
};

/**
 * Store session data with iPad-optimized strategy
 */
export const storeSessionForTablets = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      logger.debug('iPad Session: No session to store');
      return false;
    }
    
    const tabletDetection = detectTabletDevice();
    
    if (tabletDetection.isSafariTablet) {
      // For Safari on iPad/tablets, store session data redundantly
      const sessionData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user_id: session.user?.id,
        user_email: session.user?.email,
        stored_at: Date.now()
      };
      
      // Store in multiple places for Safari reliability
      try {
        localStorage.setItem('sb-tablet-session-backup', JSON.stringify(sessionData));
        sessionStorage.setItem('sb-tablet-session-temp', JSON.stringify(sessionData));
        
        logger.debug('iPad Session: Session backup stored for tablet device', {
          userId: session.user?.id,
          expiresAt: session.expires_at
        });
        
        return true;
      } catch (storageError) {
        logger.warn('iPad Session: Failed to store session backup', storageError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logger.error('iPad Session: Error storing session for tablets', error);
    return false;
  }
};

/**
 * Validate session on tab activation for tablets
 */
export const validateTabletSession = async (): Promise<{ isValid: boolean; shouldRefresh: boolean }> => {
  try {
    const tabletDetection = detectTabletDevice();
    
    if (!tabletDetection.isSafariTablet) {
      return { isValid: true, shouldRefresh: false };
    }
    
    // Check current session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.warn('iPad Session: Error getting session', error);
      return { isValid: false, shouldRefresh: true };
    }
    
    if (!session) {
      logger.debug('iPad Session: No session found');
      
      // Try to restore from backup for Safari
      try {
        const backupData = localStorage.getItem('sb-tablet-session-backup');
        if (backupData) {
          const sessionData = JSON.parse(backupData);
          const storedTime = sessionData.stored_at || 0;
          const timeElapsed = Date.now() - storedTime;
          const MAX_BACKUP_AGE = 24 * 60 * 60 * 1000; // 24 hours
          
          if (timeElapsed < MAX_BACKUP_AGE && sessionData.expires_at && sessionData.expires_at > Math.floor(Date.now() / 1000)) {
            logger.info('iPad Session: Found valid session backup, attempting restore', {
              userId: sessionData.user_id,
              ageMinutes: Math.round(timeElapsed / 1000 / 60)
            });
            
            return { isValid: false, shouldRefresh: true };
          } else {
            logger.debug('iPad Session: Session backup expired, clearing');
            localStorage.removeItem('sb-tablet-session-backup');
            sessionStorage.removeItem('sb-tablet-session-temp');
          }
        }
      } catch (backupError) {
        logger.warn('iPad Session: Error checking session backup', backupError);
      }
      
      return { isValid: false, shouldRefresh: false };
    }
    
    // Session exists - validate it
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = (session.expires_at || 0) - now;
    const REFRESH_THRESHOLD = 5 * 60; // 5 minutes
    
    if (timeUntilExpiry < 0) {
      logger.warn('iPad Session: Session expired', {
        expiresAt: session.expires_at,
        currentTime: now
      });
      return { isValid: false, shouldRefresh: true };
    }
    
    if (timeUntilExpiry < REFRESH_THRESHOLD) {
      logger.debug('iPad Session: Session expiring soon, should refresh', {
        timeUntilExpiryMinutes: Math.round(timeUntilExpiry / 60)
      });
      return { isValid: true, shouldRefresh: true };
    }
    
    // Store current session as backup
    await storeSessionForTablets();
    
    logger.debug('iPad Session: Session valid', {
      userId: session.user?.id,
      timeUntilExpiryMinutes: Math.round(timeUntilExpiry / 60)
    });
    
    return { isValid: true, shouldRefresh: false };
    
  } catch (error) {
    logger.error('iPad Session: Error validating tablet session', error);
    return { isValid: false, shouldRefresh: true };
  }
};

/**
 * Clean up tablet-specific session storage
 */
export const cleanupTabletSession = () => {
  try {
    localStorage.removeItem('sb-tablet-session-backup');
    sessionStorage.removeItem('sb-tablet-session-temp');
    logger.debug('iPad Session: Cleaned up tablet session storage');
  } catch (error) {
    logger.warn('iPad Session: Failed to cleanup tablet session storage', error);
  }
};

/**
 * Optimize Supabase client for tablet devices
 */
export const optimizeSupabaseForTablets = () => {
  const tabletDetection = detectTabletDevice();
  
  if (tabletDetection.isSafariTablet) {
    logger.info('iPad Session: Optimizing for Safari tablet device', tabletDetection);
    
    // Store session backup when auth state changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await storeSessionForTablets();
      } else if (event === 'SIGNED_OUT') {
        cleanupTabletSession();
      }
    });
  }
};