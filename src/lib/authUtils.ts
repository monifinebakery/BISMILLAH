// src/lib/authUtils.ts - CLEAN VERSION WITHOUT DUPLICATES
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { withTimeout, withSoftTimeout, withExponentialBackoff } from '@/utils/asyncUtils';

/**
 * ✅ Device capability detection
 */
const detectDeviceCapabilities = () => {
  const capabilities = {
    hasLocalStorage: false,
    hasSessionStorage: false,
    networkType: 'unknown',
    isSlowDevice: false,
    userAgent: navigator.userAgent || 'unknown'
  };

  // Test localStorage
  try {
    localStorage.setItem('__test__', 'test');
    localStorage.removeItem('__test__');
    capabilities.hasLocalStorage = true;
  } catch {
    logger.warn('localStorage not available or restricted');
  }

  // Test sessionStorage
  try {
    sessionStorage.setItem('__test__', 'test');
    sessionStorage.removeItem('__test__');
    capabilities.hasSessionStorage = true;
  } catch {
    logger.warn('sessionStorage not available or restricted');
  }

  // Detect network type
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    capabilities.networkType = connection.effectiveType || 'unknown';
  }

  // Detect slow device (simplified heuristic)
  const isSlowDevice = capabilities.userAgent.includes('Android 4') || 
                      capabilities.userAgent.includes('iPhone OS 10') ||
                      !capabilities.hasLocalStorage;
  capabilities.isSlowDevice = isSlowDevice;

  logger.debug('Device capabilities detected:', capabilities);
  return capabilities;
};

/**
 * ✅ Adaptive timeout based on device capabilities
 */
const getAdaptiveTimeout = (baseTimeout = 8000) => {
  const capabilities = detectDeviceCapabilities();
  
  let timeout = baseTimeout;
  
  // Increase timeout for slow devices
  if (capabilities.isSlowDevice) {
    timeout *= 1.5;
    logger.debug('Slow device detected, increasing timeout:', timeout);
  }
  
  // Increase timeout for slow networks
  if (capabilities.networkType === 'slow-2g' || capabilities.networkType === '2g') {
    timeout *= 2;
    logger.debug('Slow network detected, doubling timeout:', timeout);
  } else if (capabilities.networkType === '3g') {
    timeout *= 1.2;
    logger.debug('3G network detected, slightly increasing timeout:', timeout);
  }
  
  // Cap at reasonable maximum
  return Math.min(timeout, 20000); // Reduced max to 20 seconds
};

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
 * ✅ ENHANCED: Validates the current auth session with device-adaptive timeout and retry logic
 * 
 * This function now:
 * - Detects device capabilities and adapts timeouts accordingly
 * - Implements retry logic for slow devices/networks
 * - Only cleans up auth state when truly necessary
 * - Handles temporary network issues gracefully
 * - Prevents aggressive cleanup that destroys valid sessions
 */
export const validateAuthSession = async (retryCount = 0): Promise<boolean> => {
  const maxRetries = 2; // Reduced retries
  
  try {
    logger.debug(`🔍 Validating auth session (attempt ${retryCount + 1}/${maxRetries + 1})...`);
    
    // ✅ DEVICE B FIX: Adaptive timeout based on device capabilities
    const adaptiveTimeout = getAdaptiveTimeout(10000); // Reduced timeout
    logger.debug('Using adaptive timeout:', adaptiveTimeout);
    
    // Use exponential backoff for session validation
    const session = await withExponentialBackoff(
      () => supabase.auth.getSession().then(res => res.data.session),
      maxRetries,
      500, // Reduced base delay
      adaptiveTimeout
    );
    
    if (!session) {
      logger.debug('ℹ️ No session found during validation');
      
      // ✅ DEVICE B FIX: Retry for slow devices that might need more time
      if (retryCount < maxRetries) {
        const capabilities = detectDeviceCapabilities();
        if (capabilities.isSlowDevice || capabilities.networkType === 'slow-2g' || capabilities.networkType === '2g') {
          logger.debug('🐌 Slow device/network detected, retrying session check...');
          await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 3000));
          return validateAuthSession(retryCount + 1);
        }
      }
      
      // ✅ CRITICAL FIX: DON'T cleanup auth state on missing session
      // This could be due to:
      // - Session not yet propagated after OTP
      // - Temporary network issues
      // - Race conditions
      // - Device-specific timing issues
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
    
    // ✅ DEVICE B FIX: Validate user ID format (catch corrupted sessions)
    if (typeof session.user.id !== 'string' || session.user.id.length < 10) {
      logger.warn('🔧 Invalid user ID format, cleaning up auth state:', session.user.id);
      cleanupAuthState();
      return false;
    }
    
    logger.success('✅ Session validation successful:', {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: session.expires_at,
      attempt: retryCount + 1
    });
    
    return true;
    
  } catch (error) {
    logger.error('❌ Unexpected error validating auth session:', error);
    
    // ✅ DEVICE B FIX: Enhanced retry logic for device-specific issues
    if (retryCount < maxRetries) {
      const errorMessage = (error as Error).message?.toLowerCase() || '';
      
      if (errorMessage.includes('session validation timeout')) {
        logger.warn('⏱️ Session validation timeout, retrying with longer delay...');
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 3000));
        return validateAuthSession(retryCount + 1);
      } else if (errorMessage.includes('network') || 
                 errorMessage.includes('fetch') ||
                 errorMessage.includes('connection')) {
        logger.warn('🌐 Network error during validation, retrying...');
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return validateAuthSession(retryCount + 1);
      }
    }
    
    // ✅ CRITICAL FIX: DON'T cleanup on timeout/network errors after all retries
    if ((error as Error).message?.includes('Session validation timeout')) {
      logger.debug('⏱️ Session validation timeout after retries, preserving auth state');
    } else if ((error as Error).message?.includes('network') || 
               (error as Error).message?.includes('fetch')) {
      logger.debug('🌐 Network error after retries, preserving auth state');
    } else {
      logger.warn('🧹 Unexpected error after retries, cleaning up auth state for safety');
      cleanupAuthState();
    }
    
    return false;
  }
};

/**
 * ✅ ENHANCED: Safe session check with device-adaptive timeout
 */
export const checkSessionExists = async () => {
  try {
    logger.debug('👀 Checking session existence (safe mode)...');
    
    // ✅ DEVICE B FIX: Use adaptive timeout
    const adaptiveTimeout = getAdaptiveTimeout(10000);
    
    // Use exponential backoff for session check
    const session = await withExponentialBackoff(
      () => supabase.auth.getSession().then(res => res.data.session),
      2, // max retries
      1000, // base delay 1 second
      adaptiveTimeout
    );
    
    const exists = !!(session?.user?.id);
    logger.debug('👀 Session exists (safe mode):', exists);
    
    return exists;
    
  } catch (error) {
    logger.debug('❌ Error in safe session check:', (error as Error).message);
    return false;
  }
};

/**
 * ✅ ENHANCED: Force refresh session with device-adaptive retry
 */
export const refreshSessionSafely = async () => {
  try {
    logger.debug('🔄 Safely refreshing session...');
    
    // ✅ DEVICE B FIX: Add timeout for refresh operation
    const adaptiveTimeout = getAdaptiveTimeout(20000);
    
    // Use exponential backoff for session refresh
    const session = await withExponentialBackoff(
      () => supabase.auth.refreshSession().then(res => res.data.session),
      2, // max retries
      1000, // base delay 1 second
      adaptiveTimeout
    );
    
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
 * ✅ ENHANCED: Debug auth state with device capabilities
 */
export const debugAuthState = async () => {
  try {
    logger.debug('🔬 Debugging auth state...');
    
    // Check device capabilities
    const capabilities = detectDeviceCapabilities();
    
    // Check localStorage
    const localStorageKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('supabase.auth.') || key.includes('sb-')
    );
    
    // Check sessionStorage  
    const sessionStorageKeys = Object.keys(sessionStorage || {}).filter(key => 
      key.startsWith('supabase.auth.') || key.includes('sb-')
    );
    
    // Check current session with timeout
    let sessionInfo = null;
    try {
      const adaptiveTimeout = getAdaptiveTimeout(10000);
      
      // Use exponential backoff for session debug
      const session = await withExponentialBackoff(
        () => supabase.auth.getSession().then(res => res.data.session),
        1, // max retries
        1000, // base delay 1 second
        adaptiveTimeout
      );
      
      sessionInfo = {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id || null,
        email: session?.user?.email || null,
        expiresAt: session?.expires_at || null,
        error: null,
        userIdType: typeof session?.user?.id,
        userIdLength: session?.user?.id?.length || 0
      };
    } catch (err) {
      sessionInfo = { error: (err as Error).message };
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      deviceCapabilities: capabilities,
      adaptiveTimeout: getAdaptiveTimeout(30000),
      localStorageKeys,
      sessionStorageKeys,
      sessionInfo,
      userAgent: navigator.userAgent
    };
    
    logger.debug('🔬 Auth Debug Info:', debugInfo);
    
    // ✅ DEVICE B: Also log to console for easier debugging
    console.table({
      'Has LocalStorage': capabilities.hasLocalStorage,
      'Has SessionStorage': capabilities.hasSessionStorage,
      'Network Type': capabilities.networkType,
      'Is Slow Device': capabilities.isSlowDevice,
      'Has Session': sessionInfo?.hasSession || false,
      'Has User': sessionInfo?.hasUser || false,
      'User Email': sessionInfo?.email || 'none',
      'Adaptive Timeout': getAdaptiveTimeout(30000) + 'ms'
    });
    
    return debugInfo;
    
  } catch (error) {
    logger.error('❌ Error debugging auth state:', error);
    return { error: (error as Error).message };
  }
};