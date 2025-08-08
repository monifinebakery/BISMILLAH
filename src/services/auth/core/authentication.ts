// src/services/auth/core/authentication.ts
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';
import { getCurrentSession } from './session';
import { cleanupAuthState } from '@/lib/authUtils';

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const session = await getCurrentSession();
    return !!session?.user;
  } catch (error) {
    logger.error('[AuthService] Error checking authentication:', error);
    return false;
  }
};

export const getCurrentUser = async () => {
  try {
    const session = await getCurrentSession();
    return session?.user || null;
  } catch (error) {
    logger.error('[AuthService] Error getting current user:', error);
    return null;
  }
};

export const signOut = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      logger.error('[AuthService] Sign out error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('[AuthService] Error in signOut:', error);
    return false;
  }
};

export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    logger.info('[AuthService] Auth state changed:', { event, email: session?.user?.email });
    callback(event, session);
  });
  
  return () => subscription.unsubscribe();
};

// Aliases for backward compatibility
export const hasValidSession = isAuthenticated;
export const onAuthStateChangeWithPaymentLinking = onAuthStateChange;