// src/utils/apiInterceptor.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { refreshSessionSafely } from '@/lib/authUtils';
import { handleAuthError } from '@/utils/authErrorHandler';

// Track ongoing refresh attempts to prevent multiple simultaneous refreshes
let refreshPromise: Promise<boolean> | null = null;
let isRefreshing = false;

/**
 * Checks if an error is a JWT expired error (PGRST301)
 */
export const isJWTExpiredError = (error: any): boolean => {
  if (!error) return false;
  
  // Check for Supabase PostgREST JWT expired error
  const errorCode = error?.code?.toString();
  const errorMessage = error?.message?.toLowerCase() || '';
  
  return (
    errorCode === 'PGRST301' ||
    errorMessage.includes('jwt expired') ||
    errorMessage.includes('token expired') ||
    error?.status === 401
  );
};

/**
 * Checks if an error is an authentication-related error
 */
export const isAuthError = (error: any): boolean => {
  if (!error) return false;
  
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code?.toString() || '';
  
  return (
    isJWTExpiredError(error) ||
    errorCode === 'PGRST301' ||
    errorCode === '401' ||
    error?.status === 401 ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('invalid_grant') ||
    errorMessage.includes('refresh token') ||
    errorMessage.includes('session missing')
  );
};

/**
 * Refreshes the JWT token and returns whether successful
 */
const refreshJWTToken = async (): Promise<boolean> => {
  // If already refreshing, wait for the existing refresh to complete
  if (isRefreshing && refreshPromise) {
    logger.debug('JWT refresh already in progress, waiting...');
    return await refreshPromise;
  }
  
  // Start new refresh process
  isRefreshing = true;
  refreshPromise = performTokenRefresh();
  
  try {
    const result = await refreshPromise;
    return result;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
};

/**
 * Performs the actual token refresh logic
 */
const performTokenRefresh = async (): Promise<boolean> => {
  try {
    logger.info('🔄 JWT token expired, attempting refresh...');
    
    // Try to refresh using authUtils
    const refreshSuccess = await refreshSessionSafely();
    
    if (refreshSuccess) {
      logger.success('✅ JWT token refreshed successfully');
      return true;
    }
    
    // If refresh fails, try Supabase's built-in refresh
    logger.debug('Trying Supabase built-in refresh as fallback...');
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      logger.error('❌ JWT token refresh failed:', error);
      
      // Handle the auth error through our error handler
      await handleAuthError(error);
      return false;
    }
    
    if (data?.session) {
      logger.success('✅ JWT token refreshed via Supabase fallback');
      return true;
    }
    
    logger.warn('⚠️ No session received after refresh');
    return false;
    
  } catch (error) {
    logger.error('❌ Error during JWT token refresh:', error);
    
    // Handle the auth error
    await handleAuthError(error);
    return false;
  }
};

/**
 * Wraps a Supabase query with automatic JWT token refresh retry logic
 */
export const withJWTRefresh = async <T>(
  queryFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    onRetry?: (attempt: number) => void;
    context?: string;
  } = {}
): Promise<T> => {
  const { maxRetries = 1, onRetry, context = 'API call' } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`${context} - Attempt ${attempt + 1}/${maxRetries + 1}`);
      
      const result = await queryFn();
      
      // If we get here, the query was successful
      if (attempt > 0) {
        logger.success(`✅ ${context} succeeded after JWT refresh (attempt ${attempt + 1})`);
      }
      
      return result;
      
    } catch (error) {
      logger.debug(`${context} failed on attempt ${attempt + 1}:`, error);
      
      // If this is a JWT expired error and we haven't exceeded max retries
      if (isJWTExpiredError(error) && attempt < maxRetries) {
        logger.warn(`🔄 JWT expired during ${context}, attempting token refresh...`);
        
        // Notify about retry attempt
        onRetry?.(attempt + 1);
        
        // Try to refresh the token
        const refreshSuccess = await refreshJWTToken();
        
        if (refreshSuccess) {
          logger.info(`🔄 Token refreshed, retrying ${context}...`);
          
          // Add a small delay to ensure token propagation
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Continue to next iteration (retry)
          continue;
        } else {
          logger.error(`❌ Token refresh failed for ${context}`);
          // Don't retry if refresh failed, throw the original error
          throw error;
        }
      }
      
      // If it's not a JWT error or we've exceeded retries, throw the error
      throw error;
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error(`${context} failed after ${maxRetries + 1} attempts`);
};

/**
 * Enhanced wrapper for Supabase queries that handles JWT expiration automatically
 */
export const supabaseQuery = {
  /**
   * Wraps a standard Supabase select query with JWT refresh logic
   */
  select: async <T>(
    queryBuilder: any,
    context?: string
  ): Promise<{ data: T[] | null; error: any }> => {
    return withJWTRefresh(
      async () => {
        const result = await queryBuilder;
        
        // Check if the result contains an error
        if (result.error) {
          throw result.error;
        }
        
        return result;
      },
      { context: context || 'Supabase select query' }
    );
  },
  
  /**
   * Wraps a Supabase insert query with JWT refresh logic
   */
  insert: async <T>(
    queryBuilder: any,
    context?: string
  ): Promise<{ data: T[] | null; error: any }> => {
    return withJWTRefresh(
      async () => {
        const result = await queryBuilder;
        
        if (result.error) {
          throw result.error;
        }
        
        return result;
      },
      { context: context || 'Supabase insert query' }
    );
  },
  
  /**
   * Wraps a Supabase update query with JWT refresh logic
   */
  update: async <T>(
    queryBuilder: any,
    context?: string
  ): Promise<{ data: T[] | null; error: any }> => {
    return withJWTRefresh(
      async () => {
        const result = await queryBuilder;
        
        if (result.error) {
          throw result.error;
        }
        
        return result;
      },
      { context: context || 'Supabase update query' }
    );
  },
  
  /**
   * Wraps a Supabase delete query with JWT refresh logic
   */
  delete: async (
    queryBuilder: any,
    context?: string
  ): Promise<{ data: any | null; error: any }> => {
    return withJWTRefresh(
      async () => {
        const result = await queryBuilder;
        
        if (result.error) {
          throw result.error;
        }
        
        return result;
      },
      { context: context || 'Supabase delete query' }
    );
  }
};

/**
 * Generic wrapper for any async function that might encounter JWT errors
 */
export const withAutoRefresh = withJWTRefresh;