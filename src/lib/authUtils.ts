import { supabase } from '@/integrations/supabase/client';

/**
 * Cleans up all Supabase authentication related data from localStorage and sessionStorage
 * to ensure no invalid tokens remain when authentication issues occur
 * 
 * ⚠️ WARNING: This function completely removes auth state. Use sparingly!
 */
export const cleanupAuthState = () => {
  console.log('🧹 Cleaning up auth state...');
  
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
  
  console.log('✅ Auth state cleanup completed');
};

/**
 * Performs a local sign out, only affecting the current device/session
 */
export const performSignOut = async () => {
  try {
    console.log('🚪 Performing local sign out...');
    
    // Clean up auth state first
    cleanupAuthState();
    
    // Perform LOCAL sign out only (removes { scope: 'global' })
    try {
      await supabase.auth.signOut();
      console.log('✅ Supabase sign out completed');
    } catch (err) {
      // Continue even if this fails
      console.error('⚠️ Error during Supabase signOut:', err);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error during sign out process:', error);
    return false;
  }
};

/**
 * Performs a global sign out from ALL devices
 */
export const performGlobalSignOut = async () => {
  try {
    console.log('🌍 Performing global sign out...');
    
    // Clean up auth state first
    cleanupAuthState();
    
    // Perform GLOBAL sign out from all devices
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('✅ Global sign out completed');
    } catch (err) {
      // Continue even if this fails
      console.error('⚠️ Error during global signOut:', err);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error during global sign out process:', error);
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
    console.log('🔍 Validating auth session...');
    
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
      console.error('⚠️ Error validating auth session:', error);
      
      // ✅ IMPROVED: Only cleanup on specific auth errors, not network errors
      if (error.message?.includes('Invalid Refresh Token') || 
          error.message?.includes('refresh_token_not_found') ||
          error.message?.includes('invalid_grant')) {
        console.log('🧹 Invalid token detected, cleaning up auth state');
        cleanupAuthState();
      } else {
        console.log('⚠️ Network/temporary error, preserving auth state');
      }
      
      return false;
    }
    
    if (!session) {
      console.log('ℹ️ No session found during validation');
      
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
      console.log('⏰ Session expired, cleaning up auth state');
      cleanupAuthState();
      return false;
    }
    
    // ✅ Additional validation: check user object
    if (!session.user || !session.user.id) {
      console.log('👤 Invalid user in session, cleaning up auth state');
      cleanupAuthState();
      return false;
    }
    
    console.log('✅ Session validation successful:', {
      userId: session.user.id,
      email: session.user.email,
      expiresAt: session.expires_at
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error validating auth session:', error);
    
    // ✅ CRITICAL FIX: DON'T cleanup on timeout/network errors
    // Only cleanup on specific auth-related errors
    if (error.message?.includes('Session validation timeout')) {
      console.log('⏱️ Session validation timeout, preserving auth state');
    } else if (error.message?.includes('network') || 
               error.message?.includes('fetch')) {
      console.log('🌐 Network error during validation, preserving auth state');
    } else {
      console.log('🧹 Unexpected error, cleaning up auth state for safety');
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
    console.log('👀 Checking session existence (safe mode)...');
    
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((resolve) => 
      setTimeout(() => resolve({ data: { session: null }, error: null }), 5000)
    );
    
    const { data: { session }, error } = await Promise.race([
      sessionPromise, 
      timeoutPromise
    ]);
    
    if (error) {
      console.log('⚠️ Error checking session (safe mode):', error.message);
      return false;
    }
    
    const exists = !!(session?.user?.id);
    console.log('👀 Session exists (safe mode):', exists);
    
    return exists;
    
  } catch (error) {
    console.log('❌ Error in safe session check:', error.message);
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
    console.log('🔄 Safely refreshing session...');
    
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('⚠️ Session refresh error:', error);
      return false;
    }
    
    if (session?.user?.id) {
      console.log('✅ Session refreshed successfully:', session.user.email);
      return true;
    }
    
    console.log('⚠️ Session refresh returned no user');
    return false;
    
  } catch (error) {
    console.error('❌ Error refreshing session safely:', error);
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
    console.log('🔬 Debugging auth state...');
    
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
    
    console.log('🔬 Auth Debug Info:', debugInfo);
    return debugInfo;
    
  } catch (error) {
    console.error('❌ Error debugging auth state:', error);
    return { error: error.message };
  }
};