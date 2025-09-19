// src/hooks/auth/useCooldownTimer.ts - Cooldown Timer Management
import { useState, useRef, useCallback, useEffect } from 'react';
import { logger } from '@/utils/logger';

export const useCooldownTimer = () => {
  const [cooldownTime, setCooldownTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const startCooldown = useCallback((seconds: number) => {
    if (!mountedRef.current) return;
    
    logger.debug(`Starting cooldown timer: ${seconds}s`);
    setCooldownTime(seconds);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }
      
      setCooldownTime((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const stopCooldown = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCooldownTime(0);
    logger.debug('Cooldown timer stopped');
  }, []);

  const restoreCooldown = useCallback((remainingSeconds: number) => {
    if (remainingSeconds > 0) {
      logger.debug(`Restoring cooldown timer: ${remainingSeconds}s remaining`);
      startCooldown(remainingSeconds);
    }
  }, [startCooldown]);

  return {
    cooldownTime,
    startCooldown,
    stopCooldown,
    restoreCooldown,
    isActive: cooldownTime > 0
  };
};