import { supabase } from '@/integrations/supabase/client';

/**
 * Cleans up all Supabase authentication related data from localStorage and sessionStorage
 * to ensure no invalid tokens remain when authentication issues occur
 */
export const cleanupAuthState = () => {
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
};

/**
 * Performs a local sign out, only affecting the current device/session
 */
export const performSignOut = async () => {
  try {
    // Clean up auth state first
    cleanupAuthState();
    
    // Perform LOCAL sign out only (removes { scope: 'global' })
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Continue even if this fails
      console.error('Error during Supabase signOut:', err);
    }
    
    return true;
  } catch (error) {
    console.error('Error during sign out process:', error);
    return false;
  }
};

/**
 * Performs a global sign out from ALL devices (optional function for future use)
 */
export const performGlobalSignOut = async () => {
  try {
    // Clean up auth state first
    cleanupAuthState();
    
    // Perform GLOBAL sign out from all devices
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      // Continue even if this fails
      console.error('Error during Supabase signOut:', err);
    }
    
    return true;
  } catch (error) {
    console.error('Error during sign out process:', error);
    return false;
  }
};

/**
 * Validates the current auth session and cleans up if invalid
 */
export const validateAuthSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // No valid session found, clean up any stale auth data
      cleanupAuthState();
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error validating auth session:', error);
    // Error occurred, clean up auth state to be safe
    cleanupAuthState();
    return false;
  }
};