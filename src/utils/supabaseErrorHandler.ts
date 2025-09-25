// src/utils/supabaseErrorHandler.ts
import { logger } from '@/utils/logger';
import { executeWithAuthValidation } from '@/utils/auth/refreshSession';

/**
 * Enhanced error handler for Supabase operations with authentication validation
 */
export const handleSupabaseError = (error: any, operation: string) => {
  logger.error(`❌ Supabase ${operation} error:`, error);
  
  // Check for specific Supabase error codes and handle appropriately
  if (error?.code === '42501' || error?.message?.includes('permission denied')) {
    logger.error('❌ Permission denied - user may need to re-authenticate');
    // Could trigger re-authentication here
  } else if (error?.status === 401 || error?.code === '401') {
    logger.error('❌ Unauthorized - session may have expired');
    // This could trigger a session refresh attempt
  } else if (error?.message?.includes('JWT') && error?.message?.includes('expired')) {
    logger.error('❌ JWT expired - session needs to be refreshed');
  }
  
  // Show user-friendly messages based on error type
  if (error?.message?.includes('503') || error?.message?.includes('network')) {
    logger.warn('⚠️ Network issue detected - please check your connection');
  }
};

/**
 * Record error for analytics or monitoring
 */
export const recordError = (error: any, operation: string) => {
  logger.error(`Error recorded for ${operation}:`, error);
  // Could send to error tracking service like Sentry
};

/**
 * Enhanced retry wrapper for Supabase operations with authentication validation
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Use the authentication validation wrapper for each attempt
      return await executeWithAuthValidation(operation, 0); // Don't retry auth issues in the wrapper
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        logger.warn(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, error);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  logger.error(`❌ Operation failed after ${maxRetries + 1} attempts:`, lastError);
  throw lastError;
};

/**
 * Enhanced error handler specifically for auth-related issues
 */
export const handleAuthError = (error: any) => {
  logger.error('❌ Authentication error:', error);
  
  // Determine if this is an auth error that might be resolved by refreshing
  const isAuthError = error?.status === 401 || 
                    error?.code === '401' || 
                    (error?.message && 
                     (error.message.includes('JWT') || 
                      error.message.includes('session') || 
                      error.message.includes('auth')));
  
  if (isAuthError) {
    logger.warn('🔄 Attempting to refresh session...');
    // In a real implementation, you'd trigger session refresh here
  }
};