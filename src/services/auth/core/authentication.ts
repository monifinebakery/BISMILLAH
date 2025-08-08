// ===== 3. src/services/auth/core/authentication.ts - ENHANCED =====
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { getCurrentSession, clearSessionCache } from './session';

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const session = await getCurrentSession();
    const isAuth = !!session?.user;
    logger.debug('[Auth] Authentication check:', { isAuth, email: session?.user?.email });
    return isAuth;
  } catch (error) {
    logger.error('[Auth] Error checking authentication:', error);
    return false;
  }
};

export const getCurrentUser = async () => {
  try {
    const session = await getCurrentSession();
    const user = session?.user || null;
    if (user) {
      logger.debug('[Auth] Current user:', { id: user.id, email: user.email });
    }
    return user;
  } catch (error) {
    logger.error('[Auth] Error getting current user:', error);
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

export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    logger.info('[Auth] Auth state changed:', { 
      event, 
      email: session?.user?.email,
      userId: session?.user?.id 
    });
    
    // Clear session cache on auth state change
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      clearSessionCache();
    }
    
    callback(event, session);
  });
  
  return () => subscription.unsubscribe();
};

// Aliases for backward compatibility
export const hasValidSession = isAuthenticated;
export const onAuthStateChangeWithPaymentLinking = onAuthStateChange;