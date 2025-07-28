// src/components/warehouse/context/hooks/useNotificationDeduplicator.ts
import { useRef, useCallback } from 'react';
import { NotificationCache } from '../types';

const CACHE_DURATION = 60000; // 1 minute

export const useNotificationDeduplicator = () => {
  const notificationCacheRef = useRef<Map<string, number>>(new Map());
  
  const shouldSendNotification = useCallback((key: string): boolean => {
    const now = Date.now();
    const lastSent = notificationCacheRef.current.get(key);
    
    if (!lastSent || (now - lastSent) > CACHE_DURATION) {
      notificationCacheRef.current.set(key, now);
      return true;
    }
    
    return false;
  }, []);

  const clearCache = useCallback(() => {
    notificationCacheRef.current.clear();
  }, []);

  const removeCacheEntry = useCallback((key: string) => {
    notificationCacheRef.current.delete(key);
  }, []);

  return {
    shouldSendNotification,
    clearCache,
    removeCacheEntry,
  };
};