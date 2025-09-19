// src/utils/androidSessionFix.ts - Mock Android Session Fix utilities
// These are placeholder functions to prevent import errors
import { logger } from '@/utils/logger';
import type { Session } from '@supabase/supabase-js';

export interface AndroidDetection {
  isProblematic: boolean;
  isAndroid: boolean;
  isSlowDevice: boolean;
  networkType: string;
  userAgent: string;
}

export interface AndroidSessionResult {
  success: boolean;
  session?: Session | null;
  requiresRelogin?: boolean;
  message?: string;
}

export const detectProblematicAndroid = (): AndroidDetection => {
  const userAgent = navigator.userAgent || '';
  const isAndroid = /Android/i.test(userAgent);
  
  // Simple heuristic for problematic Android versions
  const isProblematicVersion = 
    /Android [4-6]\./i.test(userAgent) ||
    /Android 7\.[0-1]/i.test(userAgent);

  return {
    isProblematic: isAndroid && isProblematicVersion,
    isAndroid,
    isSlowDevice: isProblematicVersion,
    networkType: 'unknown',
    userAgent,
  };
};

export const forceAndroidSessionRefresh = async (
  maxRetries: number = 2, 
  timeoutMs: number = 1500
): Promise<AndroidSessionResult> => {
  logger.debug('Android: Attempting session refresh (mock implementation)');
  
  // Mock implementation - always returns not successful to fall back to normal flow
  return {
    success: false,
    requiresRelogin: false,
    message: 'Mock Android session refresh - falling back to normal flow',
  };
};

export const validateAndroidSession = async (
  session: Session | null
): Promise<AndroidSessionResult> => {
  if (!session) {
    return {
      success: false,
      requiresRelogin: true,
      message: 'No session to validate',
    };
  }

  // Mock validation - assume session is valid
  return {
    success: true,
    session,
  };
};

export const preOptimizeAndroidLogin = (): void => {
  logger.debug('Android: Pre-optimizing login (mock implementation)');
  // Mock implementation - no actual optimization
};

export const cleanupAndroidStorage = (): void => {
  logger.debug('Android: Cleaning up storage (mock implementation)');
  // Mock implementation - no actual cleanup
};