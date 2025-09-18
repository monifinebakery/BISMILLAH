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
let __cachedUserId: string | null | undefined = undefined;
let __lastFetchedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const now = Date.now();
    if (typeof __cachedUserId !== 'undefined' && (now - __lastFetchedAt) < CACHE_TTL_MS) {
      return __cachedUserId;
    }
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      logger.warn('authHelpers.getCurrentUserId: no user or error present');
      __cachedUserId = null;
      __lastFetchedAt = now;
      return null;
    }
    __cachedUserId = user.id;
    __lastFetchedAt = now;
    return __cachedUserId;
  } catch (e) {
    logger.error('authHelpers.getCurrentUserId failed:', e);
    return null;
  }
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
