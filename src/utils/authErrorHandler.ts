// src/utils/authErrorHandler.ts
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { cleanupAuthState } from '@/lib/authUtils';

/**
 * Handles authentication errors, specifically refresh token issues
 */
export class AuthErrorHandler {
  private static isHandlingError = false;

  /**
   * Handles the "Invalid Refresh Token: Refresh Token Not Found" error
   */
  static async handleRefreshTokenError(error: any): Promise<void> {
    // Prevent multiple simultaneous error handling
    if (this.isHandlingError) {
      logger.debug('Auth error handler already running, skipping...');
      return;
    }

    this.isHandlingError = true;

    try {
      logger.error('🔴 Refresh Token Error Detected:', {
        errorMessage: error?.message,
        errorCode: error?.code,
        timestamp: new Date().toISOString()
      });

      // Step 1: Clean up invalid auth state
      logger.info('🧹 Cleaning up invalid auth state...');
      cleanupAuthState();

      // Step 2: Attempt to sign out to clear any remaining session
      try {
        logger.info('🚪 Attempting sign out to clear session...');
        await supabase.auth.signOut();
        logger.success('✅ Sign out completed');
      } catch (signOutError) {
        logger.warn('⚠️ Sign out failed, but continuing cleanup:', signOutError);
      }

      // Step 3: Clear any cached tokens
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          logger.warn('⚠️ Session still exists after cleanup, forcing removal...');
          await supabase.auth.signOut();
        }
      } catch (sessionError) {
        logger.debug('Session check failed (expected):', sessionError);
      }

      // Step 4: Show user-friendly message
      this.showUserFriendlyMessage();

      logger.success('✅ Refresh token error handled successfully');

    } catch (handlerError) {
      logger.error('❌ Error in refresh token handler:', handlerError);
    } finally {
      this.isHandlingError = false;
    }
  }

  /**
   * Checks if an error is a refresh token error
   */
  static isRefreshTokenError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code?.toLowerCase() || '';

    return (
      errorMessage.includes('invalid refresh token') ||
      errorMessage.includes('refresh token not found') ||
      errorMessage.includes('refresh_token_not_found') ||
      errorMessage.includes('invalid_grant') ||
      errorCode.includes('invalid_grant') ||
      errorCode.includes('refresh_token_not_found')
    );
  }

  /**
   * Checks if an error is a session-related error
   */
  static isSessionError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error?.message?.toLowerCase() || '';
    
    return (
      errorMessage.includes('session missing') ||
      errorMessage.includes('jwt expired') ||
      errorMessage.includes('invalid session') ||
      errorMessage.includes('session not found') ||
      error?.status === 401
    );
  }

  /**
   * Shows a user-friendly message for auth errors
   */
  private static showUserFriendlyMessage(): void {
    // Only show message in browser environment
    if (typeof window !== 'undefined' && window.location) {
      // You can customize this based on your notification system
      console.log('🔄 Session expired. Please sign in again.');
      
      // If you have a toast notification system, use it here
      // toast.info('Session expired. Please sign in again.');
      
      // Optionally redirect to login page
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/auth') && !currentPath.includes('/login')) {
        logger.info('Redirecting to login page due to auth error');
        // window.location.href = '/auth/login';
      }
    }
  }

  /**
   * Global error handler for auth-related errors
   */
  static async handleAuthError(error: any): Promise<boolean> {
    if (this.isRefreshTokenError(error)) {
      await this.handleRefreshTokenError(error);
      return true;
    }

    if (this.isSessionError(error)) {
      logger.warn('🟡 Session error detected:', error?.message);
      // Handle other session errors if needed
      return true;
    }

    return false;
  }

  /**
   * Recovery function to attempt session restoration
   */
  static async attemptSessionRecovery(): Promise<boolean> {
    try {
      logger.info('🔄 Attempting session recovery...');

      // Try to get current session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        if (this.isRefreshTokenError(error)) {
          await this.handleRefreshTokenError(error);
          return false;
        }
        logger.error('Session recovery failed:', error);
        return false;
      }

      if (session && session.user) {
        logger.success('✅ Session recovery successful');
        return true;
      }

      logger.info('ℹ️ No session to recover');
      return false;

    } catch (recoveryError) {
      logger.error('❌ Session recovery error:', recoveryError);
      
      if (this.isRefreshTokenError(recoveryError)) {
        await this.handleRefreshTokenError(recoveryError);
      }
      
      return false;
    }
  }
}

/**
 * Global error handler function for easy integration
 */
export const handleAuthError = AuthErrorHandler.handleAuthError.bind(AuthErrorHandler);

/**
 * Recovery function for easy integration
 */
export const attemptSessionRecovery = AuthErrorHandler.attemptSessionRecovery.bind(AuthErrorHandler);

/**
 * Quick check functions for easy integration
 */
export const isRefreshTokenError = AuthErrorHandler.isRefreshTokenError.bind(AuthErrorHandler);
export const isSessionError = AuthErrorHandler.isSessionError.bind(AuthErrorHandler);