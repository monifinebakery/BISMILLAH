// src/lib/authUtils.ts - COMPLETE WITH ALL EXPORTS FOR COMPATIBILITY
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * ✅ SIMPLIFIED: Device capability detection (streamlined)
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

  return capabilities;
};

/**
 * ✅ SIMPLIFIED: Adaptive timeout (shorter for AuthGuard)
 */
const getAdaptiveTimeout = (baseTimeout = 5000) => {
  const capabilities = detectDeviceCapabilities();
  
  let timeout = baseTimeout;
  
  // Shorter timeouts for AuthGuard to prevent hanging
  if (capabilities.isSlowDevice) {
    timeout *= 1.5; // Less aggressive than before
  }
  
  if (capabilities.networkType === 'slow-2g' || capabilities.networkType === '2g') {
    timeout *= 2; // Less aggressive than before
  } else if (capabilities.networkType === '3g') {
    timeout *= 1.3;
  }
  
  // Cap at reasonable maximum for AuthGuard
  return Math.min(timeout, 15000); // Max 15 seconds for AuthGuard
};

/**
 * ✅ SIMPLIFIED: Cleanup auth state (minimal for AuthGuard)
 */
export const cleanupAuthState = () => {
  logger.warn('🧹 Cleaning up auth state (AuthGuard)...');
  
  // Remove only Supabase auth keys from localStorage
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // Also clean sessionStorage
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    logger.error('Error cleaning storage:', error);
  }
  
  logger.success('✅ Auth state cleanup completed (AuthGuard)');
};

/**
 * ✅ RESTORED: Sign out functions for backward compatibility
 */
export const performSignOut = async (): Promise<boolean> => {
  try {
    logger.info('🚪 Performing local sign out...');
    
    // Clean up auth state first
    cleanupAuthState();
    
    // Perform LOCAL sign out with timeout
    try {
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('SignOut timeout')), 5000)
      );
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any;
      
      if (error) {
        logger.error('⚠️ Error during Supabase signOut:', error);
      } else {
        logger.success('✅ Supabase sign out completed');
      }
    } catch (err) {
      logger.error('⚠️ Error during Supabase signOut:', err);
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Error during sign out process:', error);
    return false;
  }
};

export const performGlobalSignOut = async (): Promise<boolean> => {
  try {
    logger.info('🌍 Performing global sign out...');
    
    // Clean up auth state first
    cleanupAuthState();
    
    // Perform GLOBAL sign out from all devices with timeout
    try {
      const signOutPromise = supabase.auth.signOut({ scope: 'global' });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Global SignOut timeout')), 10000)
      );
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any;
      
      if (error) {
        logger.error('⚠️ Error during global signOut:', error);
      } else {
        logger.success('✅ Global sign out completed');
      }
    } catch (err) {
      logger.error('⚠️ Error during global signOut:', err);
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Error during global sign out process:', error);
    return false;
  }
};

/**
 * ✅ SIMPLIFIED: Validate auth session (streamlined for AuthGuard)
 */
export const validateAuthSession = async (): Promise<boolean> => {
  try {
    logger.debug('🔍 AuthGuard: Quick session validation...');
    
    // ✅ SIMPLIFIED: Short timeout for AuthGuard
    const adaptiveTimeout = getAdaptiveTimeout(3000); // Short timeout
    
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AuthGuard session timeout')), adaptiveTimeout)
    );
    
    const { data: { session }, error } = await Promise.race([
      sessionPromise, 
      timeoutPromise
    ]) as any;
    
    if (error) {
      logger.debug('⚠️ AuthGuard session error:', error.message);
      return false;
    }
    
    if (!session) {
      logger.debug('ℹ️ AuthGuard: No session found');
      return false;
    }
    
    // ✅ SIMPLIFIED: Basic validation only
    if (!session.user || !session.user.id || session.user.id === 'null') {
      logger.debug('⚠️ AuthGuard: Invalid user in session');
      return false;
    }
    
    // ✅ Check session expiry
    if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
      logger.debug('⏰ AuthGuard: Session expired');
      return false;
    }
    
    logger.debug('✅ AuthGuard: Session validation passed');
    return true;
    
  } catch (error) {
    logger.debug('❌ AuthGuard session validation error:', error.message);
    return false;
  }
};

/**
 * ✅ SIMPLIFIED: Safe session check for AuthGuard
 */
export const checkSessionExists = async (): Promise<boolean> => {
  try {
    const adaptiveTimeout = getAdaptiveTimeout(2000); // Very short for AuthGuard
    
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((resolve) => 
      setTimeout(() => resolve({ data: { session: null }, error: null }), adaptiveTimeout)
    );
    
    const { data: { session }, error } = await Promise.race([
      sessionPromise, 
      timeoutPromise
    ]) as any;
    
    if (error) {
      logger.debug('⚠️ AuthGuard session exists check error:', error.message);
      return false;
    }
    
    const exists = !!(session?.user?.id && session.user.id !== 'null');
    logger.debug('👀 AuthGuard session exists:', exists);
    
    return exists;
    
  } catch (error) {
    logger.debug('❌ AuthGuard session exists error:', error.message);
    return false;
  }
};

export const refreshSessionSafely = async (): Promise<boolean> => {
  try {
    logger.debug('🔄 Safely refreshing session...');
    
    const adaptiveTimeout = getAdaptiveTimeout(10000);
    
    const refreshPromise = supabase.auth.refreshSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session refresh timeout')), adaptiveTimeout)
    );
    
    const { data: { session }, error } = await Promise.race([
      refreshPromise,
      timeoutPromise
    ]) as any;
    
    if (error) {
      logger.error('⚠️ Session refresh error:', error);
      return false;
    }
    
    if (session?.user?.id && session.user.id !== 'null') {
      logger.success('✅ Session refreshed successfully:', session.user.email);
      return true;
    }
    
    logger.warn('⚠️ Session refresh returned no valid user');
    return false;
    
  } catch (error) {
    logger.error('❌ Error refreshing session safely:', error);
    return false;
  }
};

/**
 * ✅ SIMPLIFIED: Debug helper for AuthGuard
 */
export const debugAuthState = async () => {
  try {
    const capabilities = detectDeviceCapabilities();
    
    // Quick session check
    let sessionInfo = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      sessionInfo = {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id || null,
        email: session?.user?.email || null,
        userIdValid: !!(session?.user?.id && session.user.id !== 'null')
      };
    } catch (err) {
      sessionInfo = { error: err.message };
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      currentPath: window.location.pathname,
      deviceCapabilities: capabilities,
      sessionInfo,
      adaptiveTimeout: getAdaptiveTimeout(5000)
    };
    
    console.table({
      'Current Path': debugInfo.currentPath,
      'Has Session': sessionInfo?.hasSession || false,
      'Has Valid User': sessionInfo?.userIdValid || false,
      'User Email': sessionInfo?.email || 'none',
      'Is Slow Device': capabilities.isSlowDevice,
      'Network Type': capabilities.networkType
    });
    
    return debugInfo;
    
  } catch (error) {
    logger.error('❌ AuthGuard debug error:', error);
    return { error: error.message };
  }
};// src/lib/authUtils.ts - SIMPLIFIED FOR AUTHGUARD COMPATIBILITY
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * ✅ SIMPLIFIED: Device capability detection (streamlined)
 */
const detectDeviceCapabilities = () => {
  const capabilities = {
    hasLocalStorage: false,
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

  return capabilities;
};

/**
 * ✅ SIMPLIFIED: Adaptive timeout (shorter for AuthGuard)
 */
const getAdaptiveTimeout = (baseTimeout = 5000) => {
  const capabilities = detectDeviceCapabilities();
  
  let timeout = baseTimeout;
  
  // Shorter timeouts for AuthGuard to prevent hanging
  if (capabilities.isSlowDevice) {
    timeout *= 1.5; // Less aggressive than before
  }
  
  if (capabilities.networkType === 'slow-2g' || capabilities.networkType === '2g') {
    timeout *= 2; // Less aggressive than before
  } else if (capabilities.networkType === '3g') {
    timeout *= 1.3;
  }
  
  // Cap at reasonable maximum for AuthGuard
  return Math.min(timeout, 15000); // Max 15 seconds for AuthGuard
};

/**
 * ✅ SIMPLIFIED: Cleanup auth state (minimal for AuthGuard)
 */
export const cleanupAuthState = () => {
  logger.warn('🧹 Cleaning up auth state (AuthGuard)...');
  
  // Remove only Supabase auth keys from localStorage
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    logger.error('Error cleaning localStorage:', error);
  }
  
  logger.success('✅ Auth state cleanup completed (AuthGuard)');
};

/**
 * ✅ SIMPLIFIED: Validate auth session (streamlined for AuthGuard)
 * 
 * This is now MUCH simpler and focused on what AuthGuard needs:
 * - Quick session check
 * - Basic validation
 * - No aggressive cleanup
 * - Short timeout
 */
export const validateAuthSession = async (): Promise<boolean> => {
  try {
    logger.debug('🔍 AuthGuard: Quick session validation...');
    
    // ✅ SIMPLIFIED: Short timeout for AuthGuard
    const adaptiveTimeout = getAdaptiveTimeout(3000); // Short timeout
    
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('AuthGuard session timeout')), adaptiveTimeout)
    );
    
    const { data: { session }, error } = await Promise.race([
      sessionPromise, 
      timeoutPromise
    ]) as any;
    
    if (error) {
      logger.debug('⚠️ AuthGuard session error:', error.message);
      return false;
    }
    
    if (!session) {
      logger.debug('ℹ️ AuthGuard: No session found');
      return false;
    }
    
    // ✅ SIMPLIFIED: Basic validation only
    if (!session.user || !session.user.id || session.user.id === 'null') {
      logger.debug('⚠️ AuthGuard: Invalid user in session');
      return false;
    }
    
    // ✅ Check session expiry
    if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000)) {
      logger.debug('⏰ AuthGuard: Session expired');
      return false;
    }
    
    logger.debug('✅ AuthGuard: Session validation passed');
    return true;
    
  } catch (error) {
    logger.debug('❌ AuthGuard session validation error:', error.message);
    return false;
  }
};

/**
 * ✅ SIMPLIFIED: Safe session check for AuthGuard
 */
export const checkSessionExists = async (): Promise<boolean> => {
  try {
    const adaptiveTimeout = getAdaptiveTimeout(2000); // Very short for AuthGuard
    
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((resolve) => 
      setTimeout(() => resolve({ data: { session: null }, error: null }), adaptiveTimeout)
    );
    
    const { data: { session }, error } = await Promise.race([
      sessionPromise, 
      timeoutPromise
    ]) as any;
    
    if (error) {
      logger.debug('⚠️ AuthGuard session exists check error:', error.message);
      return false;
    }
    
    const exists = !!(session?.user?.id && session.user.id !== 'null');
    logger.debug('👀 AuthGuard session exists:', exists);
    
    return exists;
    
  } catch (error) {
    logger.debug('❌ AuthGuard session exists error:', error.message);
    return false;
  }
};

/**
 * ✅ SIMPLIFIED: Debug helper for AuthGuard
 */
export const debugAuthState = async () => {
  try {
    const capabilities = detectDeviceCapabilities();
    
    // Quick session check
    let sessionInfo = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      sessionInfo = {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id || null,
        email: session?.user?.email || null,
        userIdValid: !!(session?.user?.id && session.user.id !== 'null')
      };
    } catch (err) {
      sessionInfo = { error: err.message };
    }
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      currentPath: window.location.pathname,
      deviceCapabilities: capabilities,
      sessionInfo,
      adaptiveTimeout: getAdaptiveTimeout(5000)
    };
    
    console.table({
      'Current Path': debugInfo.currentPath,
      'Has Session': sessionInfo?.hasSession || false,
      'Has Valid User': sessionInfo?.userIdValid || false,
      'User Email': sessionInfo?.email || 'none',
      'Is Slow Device': capabilities.isSlowDevice,
      'Network Type': capabilities.networkType
    });
    
    return debugInfo;
    
  } catch (error) {
    logger.error('❌ AuthGuard debug error:', error);
    return { error: error.message };
  }
};

/**
 * ✅ RESTORED: Sign out functions for backward compatibility
 */
export const performSignOut = async (): Promise<boolean> => {
  try {
    logger.info('🚪 Performing local sign out...');
    
    // Clean up auth state first
    cleanupAuthState();
    
    // Perform LOCAL sign out
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('⚠️ Error during Supabase signOut:', error);
      } else {
        logger.success('✅ Supabase sign out completed');
      }
    } catch (err) {
      logger.error('⚠️ Error during Supabase signOut:', err);
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Error during sign out process:', error);
    return false;
  }
};

export const performGlobalSignOut = async (): Promise<boolean> => {
  try {
    logger.info('🌍 Performing global sign out...');
    
    // Clean up auth state first
    cleanupAuthState();
    
    // Perform GLOBAL sign out from all devices
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        logger.error('⚠️ Error during global signOut:', error);
      } else {
        logger.success('✅ Global sign out completed');
      }
    } catch (err) {
      logger.error('⚠️ Error during global signOut:', err);
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Error during global sign out process:', error);
    return false;
  }
};

export const refreshSessionSafely = async (): Promise<boolean> => {
  try {
    logger.debug('🔄 Safely refreshing session...');
    
    const adaptiveTimeout = getAdaptiveTimeout(10000);
    
    const refreshPromise = supabase.auth.refreshSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Session refresh timeout')), adaptiveTimeout)
    );
    
    const { data: { session }, error } = await Promise.race([
      refreshPromise,
      timeoutPromise
    ]) as any;
    
    if (error) {
      logger.error('⚠️ Session refresh error:', error);
      return false;
    }
    
    if (session?.user?.id && session.user.id !== 'null') {
      logger.success('✅ Session refreshed successfully:', session.user.email);
      return true;
    }
    
    logger.warn('⚠️ Session refresh returned no valid user');
    return false;
    
  } catch (error) {
    logger.error('❌ Error refreshing session safely:', error);
    return false;
  }
};