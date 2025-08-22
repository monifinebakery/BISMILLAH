// src/utils/authRecovery.ts
// Simple recovery utilities for authentication issues

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { cleanupAuthState } from '@/lib/authUtils';

/**
 * Simple recovery function for refresh token errors
 * Can be called manually or automatically
 */
export const recoverFromAuthError = async (): Promise<boolean> => {
  try {
    logger.info('🔄 Starting auth recovery process...');

    // Step 1: Clear all auth state
    logger.info('🧹 Clearing auth state...');
    cleanupAuthState();

    // Step 2: Sign out to ensure clean state
    logger.info('🚪 Signing out...');
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      logger.warn('Sign out error (continuing):', signOutError);
    }

    // Step 3: Wait a moment for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Check if we can get a fresh session
    logger.info('🔍 Checking for valid session...');
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      logger.warn('Session check returned error:', error);
      return false;
    }

    if (session) {
      logger.success('✅ Recovery successful - valid session found');
      return true;
    }

    logger.info('ℹ️ No session found - user needs to sign in again');
    return false;

  } catch (error) {
    logger.error('❌ Auth recovery failed:', error);
    return false;
  }
};

/**
 * Quick fix function that can be run from browser console
 */
export const quickAuthFix = async (): Promise<void> => {
  console.log('🔧 Running quick auth fix...');
  
  try {
    // Clear localStorage auth data
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('sb-')) {
        localStorage.removeItem(key);
        console.log(`Removed: ${key}`);
      }
    });

    // Clear sessionStorage auth data
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
          console.log(`Removed: ${key}`);
        }
      });
    } catch (e) {
      console.log('SessionStorage not available');
    }

    // Sign out
    try {
      await supabase.auth.signOut();
      console.log('✅ Signed out successfully');
    } catch (e) {
      console.log('⚠️ Sign out error:', e);
    }

    console.log('✅ Auth fix completed. Please refresh the page and sign in again.');
    
    // Suggest page refresh
    if (confirm('Auth fix completed. Refresh page now?')) {
      window.location.reload();
    }

  } catch (error) {
    console.error('❌ Quick auth fix failed:', error);
  }
};

/**
 * Diagnostic function to check auth state
 */
export const diagnoseAuth = async (): Promise<void> => {
  console.log('🔍 Diagnosing auth state...');

  try {
    // Check localStorage
    const localStorageKeys = Object.keys(localStorage).filter(key => 
      key.includes('supabase') || key.includes('sb-')
    );
    console.log('LocalStorage auth keys:', localStorageKeys);

    // Check current session
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('Current session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      expiresAt: session?.expires_at,
      error: error?.message
    });

    // Check user
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', {
        hasUser: !!user,
        userEmail: user?.email,
        error: userError?.message
      });
    } catch (userError) {
      console.log('User check error:', userError);
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  }
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).quickAuthFix = quickAuthFix;
  (window as any).diagnoseAuth = diagnoseAuth;
  (window as any).recoverFromAuthError = recoverFromAuthError;
  
  console.log('🛠️ Auth recovery tools loaded:');
  console.log('- quickAuthFix() - Quick fix for auth issues');
  console.log('- diagnoseAuth() - Check current auth state');
  console.log('- recoverFromAuthError() - Full recovery process');
}