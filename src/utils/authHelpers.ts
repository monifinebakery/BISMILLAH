// src/utils/authHelpers.ts
// Centralized authentication helper functions to avoid duplication

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

/**
 * Get current user ID from Supabase auth session
 * This is the centralized version to avoid duplicates across the codebase
 * 
 * @returns Promise<string | null> - User ID if authenticated, null otherwise
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    logger.error('Error getting current user:', error);
    return null;
  }
  return user.id;
};

/**
 * Get current user session with user details
 * 
 * @returns Promise<{user: User | null, session: Session | null}> 
 */
export const getCurrentUserSession = async () => {
  const { data: { user, session }, error } = await supabase.auth.getSession();
  if (error) {
    logger.error('Error getting current user session:', error);
    return { user: null, session: null };
  }
  return { user, session };
};

/**
 * Check if user is currently authenticated
 * 
 * @returns Promise<boolean>
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const userId = await getCurrentUserId();
  return userId !== null;
};
