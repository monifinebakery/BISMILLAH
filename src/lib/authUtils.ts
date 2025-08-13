import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Cleans up all Supabase authentication related data from localStorage and sessionStorage
 * to ensure no invalid tokens remain when authentication issues occur
 * 
 * ⚠️ WARNING: This function completely removes auth state. Use sparingly!
 */
export const cleanupAuthState = () => {
  logger.warn('🧹 Cleaning up auth state...');
  
  // Remove all Supabase auth keys from localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Remove from sessionStorage if in use
  Object.keys(sessionStorage || {}).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
  
  logger.success('✅ Auth state cleanup completed');
};

/**
 * Performs a local sign out, only affecting the current device/session
 */
export const performSignOut = async () => {
  try {
    logger.info('🚪 Performing local sign out...');
    
    // Clean up auth state first
    cleanupAuthState();
    
    // Perform LOCAL sign out only (removes { scope: 'global' })
    try {
      await supabase.auth.signOut();
      logger.success('✅ Supabase sign out completed');
    } catch (err) {
      // Continue even if this fails
      logger.error('⚠️ Error during Supabase signOut:', err);
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Error during sign out process:', error);
    return false;
  }
};

/**
 * Performs a global sign out from ALL devices
 */
export const performGlobalSignOut = async () => {
  try {
    logger.info('🌍 Performing global sign out...');
    
    // Clean up auth state first
    cleanupAuthState();
    
    // Perform GLOBAL sign out from all devices
    try {
      await supabase.auth.signOut({ scope: 'global' });
      logger.success('✅ Global sign out completed');
    } catch (err) {
      // Continue even if this fails
      logger.error('⚠️ Error during global signOut:', err);
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Error during global sign out process:', error);
    return false;
  }
};

/**
 * ✅ FIXED: Validates the current auth session with improved error handling
 * 
 * This function now:
 * - Adds timeout protection for slow networks
 * - Only cleans up auth state when truly necessary
 * - Handles temporary network issues gracefully
 * - Prevents aggressive cleanup that destroys valid sessions
 */
export const validateAuthSession = async () => {
  try {
    logger.debug('🔍 Validating auth session...');
    
    // ✅ ADD: Timeout protection for slow networks (15 seconds)
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session validation timeout')), 15000)
    );
    
    const { data: { session }, error } = await Promise.race([
      sessionPromise, 
      timeoutPromise
    ]);
    
    if (error) {
      logger.error('⚠️ Error validating auth session:', error);
      
      // ✅ IMPROVED: Only cleanup on specific auth errors, not network errors
      if (error.message?.includes('Invalid Refresh Token') || 
          error.message?.includes('refresh_token_not_found') ||
          error.message?.includes('invalid_grant')) {
        logger.warn('🧹 Invalid token detected, cleaning up auth state');
        cleanupAuthState();
      } else {
        logger.debug('⚠️ Network/temporary error, preserving auth state');
      }
      
      return false;
    }
    
    if (!session) {
      logger.debug('ℹ️ No session found during validation');
      
      // ✅ CRITICAL FIX: DON'T cleanup auth state on missing session
      // This could be due to:
      // - Session not yet propagated after OTP
      // - Temporary network issues
      // - Race conditions
      // 
      // Let AuthGuard/AuthContext handle the redirect decision
      // cleanupAuthState(); // ❌ REMOVED
      
      return false;
    }
    
    // ✅ Additional validation: check session expiry
    if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
      logger.warn('⏰ Session expired, cleaning up auth state');
      cleanupAuthState();
      return false;
    }
    
    // ✅ Additional validation: check user object
    if (!session.user || !session.user.id) {
      logger.warn('👤 Invalid user in session, cleaning up auth state');
      cleanupAuthState();
      return false;
    }
    
    logger.success('✅ Session validation successful:', {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: session.expires_at
    });
    
    return true;
    
  } catch (error) {
    logger.error('❌ Unexpected error validating auth session:', error);
    
    // ✅ CRITICAL FIX: DON'T cleanup on timeout/network errors
    // Only cleanup on specific auth-related errors
    if (error.message?.includes('Session validation timeout')) {
      logger.debug('⏱️ Session validation timeout, preserving auth state');
    } else if (error.message?.includes('network') || 
               error.message?.includes('fetch')) {
      logger.debug('🌐 Network error during validation, preserving auth state');
    } else {
      logger.warn('🧹 Unexpected error, cleaning up auth state for safety');
      cleanupAuthState();
    }
    
    return false;
  }
};

/**
 * ✅ NEW: Safe session check without cleanup
 * 
 * This function checks for session existence without any side effects.
 * Use this for non-critical checks where you don't want to risk
 * cleaning up valid auth state.
 */
export const checkSessionExists = async () => {
  try {
    logger.debug('👀 Checking session existence (safe mode)...');
    
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((resolve) => 
      setTimeout(() => resolve({ data: { session: null }, error: null }), 5000)
    );
    
    const { data: { session }, error } = await Promise.race([
      sessionPromise, 
      timeoutPromise
    ]);
    
    if (error) {
      logger.debug('⚠️ Error checking session (safe mode):', error.message);
      return false;
    }
    
    const exists = !!(session?.user?.id);
    logger.debug('👀 Session exists (safe mode):', exists);
    
    return exists;
    
  } catch (error) {
    logger.debug('❌ Error in safe session check:', error.message);
    return false;
  }
};

/**
 * ✅ NEW: Force refresh session without cleanup
 * 
 * Attempts to refresh the current session. If it fails,
 * it doesn't clean up auth state - just returns false.
 */
export const refreshSessionSafely = async () => {
  try {
    logger.debug('🔄 Safely refreshing session...');
    
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      logger.error('⚠️ Session refresh error:', error);
      return false;
    }
    
    if (session?.user?.id) {
      logger.success('✅ Session refreshed successfully:', session.user.email);
      return true;
    }
    
    logger.warn('⚠️ Session refresh returned no user');
    return false;
    
  } catch (error) {
    logger.error('❌ Error refreshing session safely:', error);
    return false;
  }
};

/**
 * ✅ NEW: Debug auth state without side effects
 * 
 * Provides detailed information about current auth state
 * for debugging purposes without affecting the session.
 */
export const debugAuthState = async () => {
  try {
    logger.debug('🔬 Debugging auth state...');
    
    // Check localStorage
    const localStorageKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('supabase.auth.') || key.includes('sb-')
    );
    
    // Check sessionStorage  
    const sessionStorageKeys = Object.keys(sessionStorage || {}).filter(key => 
      key.startsWith('supabase.auth.') || key.includes('sb-')
    );
    
    // Check current session
    let sessionInfo = null;
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      sessionInfo = {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id || null,
        email: session?.user?.email || null,
        expiresAt: session?.expires_at || null,
        error: error?.message || null
      };
    } catch (err) {
      sessionInfo = { error: err.message };
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      localStorageKeys,
      sessionStorageKeys,
      sessionInfo
    };
    
    logger.debug('🔬 Auth Debug Info:', debugInfo);
    return debugInfo;
    
  } catch (error) {
    logger.error('❌ Error debugging auth state:', error);
    return { error: error.message };
  }
};