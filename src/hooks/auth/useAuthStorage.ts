// src/hooks/auth/useAuthStorage.ts - Mobile Auth State Persistence
import { useCallback } from 'react';
import { logger } from '@/utils/logger';

interface AuthStateData {
  email?: string;
  authState?: string;
  cooldownTime?: number;
  cooldownStartTime?: number;
  otpRequestTime?: number;
}

export const useAuthStorage = (storageKey: string) => {
  const saveAuthState = useCallback(
    (data: AuthStateData) => {
      try {
        const existing = JSON.parse(
          localStorage.getItem(storageKey) || "{}"
        );
        const updated = { ...existing, ...data, timestamp: Date.now() };
        localStorage.setItem(storageKey, JSON.stringify(updated));
        logger.debug("📱 Auth state saved:", data);
      } catch (error) {
        logger.warn("Failed to save auth state:", error);
      }
    },
    [storageKey]
  );

  const loadAuthState = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;
      const data = JSON.parse(stored);

      // Check if data is not too old (max 10 minutes)
      const age = Date.now() - (data.timestamp || 0);
      if (age > 10 * 60 * 1000) {
        localStorage.removeItem(storageKey);
        return null;
      }

      logger.debug("📱 Auth state loaded:", data);
      return data;
    } catch (error) {
      logger.warn("Failed to load auth state:", error);
      return null;
    }
  }, [storageKey]);

  const clearAuthState = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
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