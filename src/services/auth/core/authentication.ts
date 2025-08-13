// src/services/auth/core/authentication.ts - CLEANED UP
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { getCurrentSession, clearSessionCache } from './session';

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const session = await getCurrentSession();
    const isAuth = !!session?.user?.id; // ✅ ENHANCED: Check user.id specifically
    logger.debug('[Auth] Authentication check:', { 
      isAuth, 
      email: session?.user?.email,
      userId: session?.user?.id 
    });
    return isAuth;
  } catch (error) {
    logger.error('[Auth] Error checking authentication:', error);
    return false;
  }
};

// ✅ ENHANCED: Better getCurrentUser with fallback
export const getCurrentUser = async () => {
  try {
    // Strategy 1: Get user from session
    const session = await getCurrentSession();
    if (session?.user?.id) {
      logger.debug('[Auth] Current user from session:', { 
        id: session.user.id, 
        email: session.user.email 
      });
      return session.user;
    }

    // Strategy 2: Fallback - Direct getUser() call
    logger.warn('[Auth] No user in session, trying direct getUser()...');
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      logger.error('[Auth] Direct getUser() error:', error);
      return null;
    }

    if (user?.id) {
      logger.debug('[Auth] Current user from direct call:', { 
        id: user.id, 
        email: user.email 
      });
      return user;
    }

    logger.warn('[Auth] No user found in both session and direct call');
    return null;
    
  } catch (error) {
    logger.error('[Auth] Error getting current user:', error);
    return null;
  }
};

// ✅ NEW: Enhanced getCurrentUser with validation
export const getCurrentUserValidated = async () => {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('User not authenticated. Please login again.');
  }
  
  if (!user.id || user.id === 'null') {
    throw new Error('Invalid user ID. Please login again.');
  }
  
  if (!user.email) {
    throw new Error('User email missing. Please login again.');
  }
  
  return user;
};

// ✅ NEW: Force refresh user session
export const refreshCurrentUser = async () => {
  try {
    logger.info('[Auth] Force refreshing user session...');
    
    // Clear cache first
    clearSessionCache();
    
    // Force refresh session
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      logger.error('[Auth] Session refresh error:', error);
      return null;
    }
    
    if (session?.user?.id) {
      logger.success('[Auth] Session refreshed successfully:', {
        userId: session.user.id,
        email: session.user.email
      });
      return session.user;
    }
    
    logger.warn('[Auth] Session refresh returned no user');
    return null;
    
  } catch (error) {
    logger.error('[Auth] Error refreshing user session:', error);
    return null;
  }
};

export const signOut = async (): Promise<boolean> => {
  try {
    logger.info('[Auth] Signing out user...');
    
    // Clear session cache first
    clearSessionCache();
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.error('[Auth] Sign out error:', error);
      return false;
    }
    
    logger.success('[Auth] User signed out successfully');
    return true;
  } catch (error) {
    logger.error('[Auth] Error in signOut:', error);
    return false;
  }
};

// ✅ SIMPLIFIED: Remove the problematic onAuthStateChange export
// Components should use AuthContext instead of this service for auth state changes
// This service is for utility functions only

// ✅ NEW: Debug auth state
export const debugAuthState = async () => {
  try {
    const session = await getCurrentSession();
    const user = await getCurrentUser();
    const isAuth = await isAuthenticated();
    
    const debugInfo = {
      hasSession: !!session,
      sessionUserId: session?.user?.id || null,
      sessionUserEmail: session?.user?.email || null,
      getCurrentUserResult: user?.id || null,
      getCurrentUserEmail: user?.email || null,
      isAuthenticated: isAuth,
      timestamp: new Date().toISOString()
    };
    
    logger.debug('[Auth] Debug state:', debugInfo);
    console.table(debugInfo);
    
    return debugInfo;
  } catch (error) {
    logger.error('[Auth] Debug auth state error:', error);
    return { error: error.message };
  }
};

// ✅ REMOVED: onAuthStateChange and onAuthStateChangeWithPaymentLinking exports
// These were causing conflicts with AuthContext
// Components should use AuthContext.useAuth() hook instead

// Aliases for backward compatibility
export const hasValidSession = isAuthenticated;