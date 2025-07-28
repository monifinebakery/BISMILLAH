// src/components/warehouse/context/hooks/useConnectionManager.ts
import { useState, useCallback, useRef } from 'react';
import { ConnectionState } from '../types';
import { logger } from '@/utils/logger';

export const useConnectionManager = () => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isConnected: false,
    retryCount: 0,
    maxRetries: 5,
    baseRetryDelay: 1000,
  });

  const connectionTimeoutRef = useRef<NodeJS.Timeout>();

  const setIsConnected = useCallback((connected: boolean) => {
    setConnectionState(prev => ({
      ...prev,
      isConnected: connected,
      ...(connected && { retryCount: 0 }) // Reset retry count on successful connection
    }));
  }, []);

  const resetConnection = useCallback(() => {
    setConnectionState(prev => ({
      ...prev,
      isConnected: false,
      retryCount: 0,
    }));
    
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
  }, []);

  const handleConnectionError = useCallback((retryCallback: () => void) => {
    setConnectionState(prev => {
      const newRetryCount = prev.retryCount + 1;
      
      if (newRetryCount <= prev.maxRetries) {
        const delay = prev.baseRetryDelay * Math.pow(2, newRetryCount - 1); // Exponential backoff
        
        logger.context('ConnectionManager', `Retrying connection in ${delay}ms (attempt ${newRetryCount}/${prev.maxRetries})`);
        
        connectionTimeoutRef.current = setTimeout(() => {
          retryCallback();
        }, delay);
      } else {
        logger.error('ConnectionManager', 'Max connection retries reached');
      }

      return {
        ...prev,
        isConnected: false,
        retryCount: newRetryCount,
      };
    });
  }, []);

  const cleanup = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
    }
  }, []);

  return {
    connectionState,
    setIsConnected,
    resetConnection,
    handleConnectionError,
    cleanup,
  };
};