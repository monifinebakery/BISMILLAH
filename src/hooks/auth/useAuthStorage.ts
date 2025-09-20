// src/hooks/auth/useAuthStorage.ts - Mobile Auth State Persistence
import { useCallback } from 'react';
import { logger } from '@/utils/logger';
import { safeStorageGet, safeStorageSet, safeStorageRemove } from '@/utils/auth/safeStorage'; // ✅ FIX: Thread-safe storage

interface AuthStateData {
  email?: string;
  authState?: string;
  otp?: string[]; // ✅ FIXED: Added OTP array support
  cooldownTime?: number;
  cooldownStartTime?: number;
  otpRequestTime?: number;
}

export const useAuthStorage = (storageKey: string) => {
  const saveAuthState = useCallback(
    async (data: AuthStateData) => {
      try {
        const existing = JSON.parse(
          safeStorageGet(storageKey) || "{}"
        );
        const updated = { ...existing, ...data, timestamp: Date.now() };
        await safeStorageSet(storageKey, JSON.stringify(updated));
        logger.debug("📱 Auth state saved:", data);
      } catch (error) {
        logger.warn("Failed to save auth state:", error);
      }
    },
    [storageKey]
  );

  const loadAuthState = useCallback(async () => {
    try {
      const stored = safeStorageGet(storageKey);
      if (!stored) return null;
      const data = JSON.parse(stored);

      // Check if data is not too old (max 10 minutes)
      const age = Date.now() - (data.timestamp || 0);
      if (age > 10 * 60 * 1000) {
        await safeStorageRemove(storageKey);
        logger.debug("📱 Auth state expired, cleared:", { age, maxAge: 10 * 60 * 1000 });
        return null;
      }

      logger.debug("📱 Auth state loaded:", data);
      return data;
    } catch (error) {
      logger.warn("Failed to load auth state:", error);
      return null;
    }
  }, [storageKey]);

  const clearAuthState = useCallback(async () => {
    try {
      await safeStorageRemove(storageKey);
      // Also clear the otpVerifiedAt timestamp
      await safeStorageRemove("otpVerifiedAt");
      logger.debug("📱 Auth state cleared");
    } catch (error) {
      logger.warn("Failed to clear auth state:", error);
    }
  }, [storageKey]);

  return {
    saveAuthState,
    loadAuthState,
    clearAuthState
  };
};