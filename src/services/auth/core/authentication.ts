// src/services/auth/core/authentication.ts - OPTIMIZED FOR AUTHCONTEXT
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { toSafeISOString } from '@/utils/unifiedDateUtils';
import { getCurrentSession, clearSessionCache } from './session';

// ✅ SIMPLIFIED: Check authentication using utility session
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const session = await getCurrentSession();
    const isAuth = !!session?.user?.id && session.user.id !== 'null';
    logger.debug('[Auth] Authentication check:', { 
      isAuth, 
      email: session?.user?.email,
      userId: session?.user?.id,
      userIdType: typeof session?.user?.id
    });
    return isAuth;
  } catch (error) {
    logger.error('[Auth] Error checking authentication:', error);
    return false;
  }
};

// ✅ SIMPLIFIED: Get current user with enhanced validation
export const getCurrentUser = async () => {
  try {
    // Strategy 1: Get user from utility session cache
    const session = await getCurrentSession();
    if (session?.user?.id && session.user.id !== 'null') {
      logger.debug('[Auth] Current user from session:', { 
        id: session.user.id, 
        email: session.user.email,
        idType: typeof session.user.id
      });
      return session.user;
    }

    // Strategy 2: Fallback - Direct getUser() call with timeout
    logger.warn('[Auth] No valid user in session, trying direct getUser()...');
    
    const userPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('getUser timeout')), 12000) // Mobile-optimized
    );
    
    const { data: { user }, error } = await Promise.race([
      userPromise,
      timeoutPromise
    ]) as any;
    
    if (error) {
      logger.error('[Auth] Direct getUser() error:', error);
      return null;
    }

    if (user?.id && user.id !== 'null') {
      logger.debug('[Auth] Current user from direct call:', { 
        id: user.id, 
        email: user.email,
        idType: typeof user.id
      });
      return user;
    }

    logger.warn('[Auth] No valid user found in both session and direct call');
    return null;
    
  } catch (error) {
    logger.error('[Auth] Error getting current user:', error);
    return null;
  }
};

// ✅ ENHANCED: Validate user with strict checks
export const getCurrentUserValidated = async () => {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('User not authenticated. Please login again.');
  }
  
  if (!user.id || user.id === 'null' || user.id === 'undefined') {
    throw new Error('Invalid user ID. Please login again.');
  }
  
  if (typeof user.id !== 'string' || user.id.length < 10) {
    throw new Error('Malformed user ID. Please login again.');
  }
  
  if (!user.email) {
    throw new Error('User email missing. Please login again.');
  }
  
  return user;
};

// ✅ ENHANCED: Force refresh with timeout and validation
export const refreshCurrentUser = async () => {
  try {
    logger.info('[Auth] Force refreshing user session...');
    
    // Clear utility cache first
    clearSessionCache();
    
    // Force refresh session with timeout
    const refreshPromise = supabase.auth.refreshSession();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Refresh timeout')), 10000)
    );
    
    const { data: { session }, error } = await Promise.race([
      refreshPromise,
      timeoutPromise
    ]) as any;
    
    if (error) {
      logger.error('[Auth] Session refresh error:', error);
      return null;
    }
    
    if (session?.user?.id && session.user.id !== 'null') {
      logger.success('[Auth] Session refreshed successfully:', {
        userId: session.user.id,
        email: session.user.email,
        userIdType: typeof session.user.id
      });
      return session.user;
    }
    
    logger.warn('[Auth] Session refresh returned invalid user');
    return null;
    
  } catch (error) {
    logger.error('[Auth] Error refreshing user session:', error);
    return null;
  }
};

// ✅ ENHANCED: Sign out with proper cleanup
export const signOut = async (): Promise<boolean> => {
  try {
    logger.info('[Auth] Signing out user...');
    
    // Clear utility session cache first
    clearSessionCache();
    
    // Perform sign out with timeout
    const signOutPromise = supabase.auth.signOut();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('SignOut timeout')), 10000) // Mobile-optimized
    );
    
    const { error } = await Promise.race([
      signOutPromise,
      timeoutPromise
    ]) as any;
    
    if (error) {
      logger.error('[Auth] Sign out error:', error);
      // Even if signOut fails, consider it success for local cleanup
      return true;
    }
    
    logger.success('[Auth] User signed out successfully');
    return true;
  } catch (error) {
    logger.error('[Auth] Error in signOut:', error);
    // Even if signOut fails, consider it success for local cleanup
    return true;
  }
};

// ✅ ENHANCED: Debug auth state with comprehensive info
export const debugAuthState = async () => {
  try {
    const session = await getCurrentSession();
    const user = await getCurrentUser();
    const isAuth = await isAuthenticated();
    
    // Get session info directly from Supabase
    let directSession = null;
    try {
      const { data: { session: directSess } } = await supabase.auth.getSession();
      directSession = directSess;
    } catch (err) {
      logger.error('[Auth] Direct session check failed:', err);
    }
    
    const debugInfo = {
      timestamp: toSafeISOString(new Date()) || new Date().toISOString(),
      utilitySession: {
        hasSession: !!session,
        sessionUserId: session?.user?.id || null,
        sessionUserEmail: session?.user?.email || null,
        sessionUserIdType: typeof session?.user?.id,
        sessionValid: !!(session?.user?.id && session.user.id !== 'null')
      },
      directSession: {
        hasSession: !!directSession,
        sessionUserId: directSession?.user?.id || null,
        sessionUserEmail: directSession?.user?.email || null,
        sessionUserIdType: typeof directSession?.user?.id,
        sessionValid: !!(directSession?.user?.id && directSession.user.id !== 'null')
      },
      getCurrentUserResult: {
        userId: user?.id || null,
        userEmail: user?.email || null,
        userIdType: typeof user?.id,
        userValid: !!(user?.id && user.id !== 'null')
      },
      isAuthenticated: isAuth,
      sessionSync: session?.user?.id === directSession?.user?.id
    };
    
    logger.debug('[Auth] Debug state:', debugInfo);
    console.table({
      'Utility Session Valid': debugInfo.utilitySession.sessionValid,
      'Direct Session Valid': debugInfo.directSession.sessionValid,
      'Sessions Synced': debugInfo.sessionSync,
      'User Valid': debugInfo.getCurrentUserResult.userValid,
      'Is Authenticated': debugInfo.isAuthenticated,
      'User Email': debugInfo.getCurrentUserResult.userEmail || 'none'
    });
    
    return debugInfo;
  } catch (error) {
    logger.error('[Auth] Debug auth state error:', error);
    return { error: error.message };
  }
};

// ✅ NEW: Quick auth check without caching (for components)
export const quickAuthCheck = async (): Promise<boolean> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!(session?.user?.id && session.user.id !== 'null');
  } catch (error) {
    logger.error('[Auth] Quick auth check error:', error);
    return false;
  }
};

// Aliases for backward compatibility
export const hasValidSession = isAuthenticated;