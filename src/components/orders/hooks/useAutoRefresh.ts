import { useCallback, useRef } from 'react';
import { logger } from '@/utils/logger';

interface UseAutoRefreshOptions {
  refreshData: () => Promise<void>;
  immediate?: boolean;
  delay?: number;
}

export const useAutoRefresh = ({ refreshData, immediate = false, delay = 500 }: UseAutoRefreshOptions) => {
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const triggerAutoRefresh = useCallback(async (force = false) => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    // Prevent multiple concurrent refreshes
    if (isRefreshingRef.current && !force) {
      logger.debug('useAutoRefresh: Skipping refresh - already in progress');
      return;
    }

    const doRefresh = async () => {
      if (isRefreshingRef.current && !force) return;
      
      try {
        isRefreshingRef.current = true;
        logger.debug('useAutoRefresh: Triggering auto-refresh...');
        await refreshData();
        logger.debug('useAutoRefresh: Auto-refresh completed');
      } catch (error) {
        logger.error('useAutoRefresh: Error during auto-refresh:', error);
      } finally {
        isRefreshingRef.current = false;
      }
    };

    if (immediate || force) {
      await doRefresh();
    } else {
      refreshTimeoutRef.current = setTimeout(doRefresh, delay);
    }
  }, [refreshData, immediate, delay]);

  const cancelAutoRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  // Force immediate refresh
  const forceRefresh = useCallback(async () => {
    await triggerAutoRefresh(true);
  }, [triggerAutoRefresh]);

  return {
    triggerAutoRefresh,
    cancelAutoRefresh,
    forceRefresh,
    isRefreshing: isRefreshingRef.current
  };
};
