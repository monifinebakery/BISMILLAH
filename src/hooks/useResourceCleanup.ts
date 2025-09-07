// src/hooks/useResourceCleanup.ts
import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { safeDom } from '@/utils/browserApiSafeWrappers';


interface CleanupFunction {
  id: string;
  cleanup: () => void;
  description?: string;
}

interface UseResourceCleanupOptions {
  enabled?: boolean;
  autoCleanupOnUnmount?: boolean;
  logCleanup?: boolean;
}

interface UseResourceCleanupReturn {
  addCleanup: (id: string, cleanup: () => void, description?: string) => void;
  removeCleanup: (id: string) => void;
  cleanupAll: () => void;
  getCleanupCount: () => number;
  hasCleanup: (id: string) => boolean;
}

export const useResourceCleanup = ({
  enabled = true,
  autoCleanupOnUnmount = true,
  logCleanup = process.env.NODE_ENV === 'development'
}: UseResourceCleanupOptions = {}): UseResourceCleanupReturn => {
  const cleanupFunctionsRef = useRef<Map<string, CleanupFunction>>(new Map());

  // Add cleanup function
  const addCleanup = useCallback((id: string, cleanup: () => void, description?: string) => {
    if (!enabled) return;

    const cleanupFunction: CleanupFunction = {
      id,
      cleanup,
      description
    };

    cleanupFunctionsRef.current.set(id, cleanupFunction);

    if (logCleanup) {
      logger.debug(`Added cleanup function: ${id}`, { description });
    }
  }, [enabled, logCleanup]);

  // Remove specific cleanup function
  const removeCleanup = useCallback((id: string) => {
    const cleanupFunction = cleanupFunctionsRef.current.get(id);
    if (cleanupFunction) {
      cleanupFunctionsRef.current.delete(id);
      
      if (logCleanup) {
        logger.debug(`Removed cleanup function: ${id}`);
      }
    }
  }, [logCleanup]);

  // Execute specific cleanup function
  const executeCleanup = useCallback((cleanupFunction: CleanupFunction) => {
    try {
      cleanupFunction.cleanup();
      
      if (logCleanup) {
        logger.debug(`Executed cleanup: ${cleanupFunction.id}`, {
          description: cleanupFunction.description
        });
      }
    } catch (error) {
      logger.error(`Error executing cleanup ${cleanupFunction.id}:`, error);
    }
  }, [logCleanup]);

  // Clean up all registered functions
  const cleanupAll = useCallback(() => {
    if (!enabled) return;

    const cleanupFunctions = Array.from(cleanupFunctionsRef.current.values());
    
    if (logCleanup && cleanupFunctions.length > 0) {
      logger.info(`Executing ${cleanupFunctions.length} cleanup functions`);
    }

    cleanupFunctions.forEach(executeCleanup);
    cleanupFunctionsRef.current.clear();
  }, [enabled, logCleanup, executeCleanup]);

  // Get count of registered cleanup functions
  const getCleanupCount = useCallback(() => {
    return cleanupFunctionsRef.current.size;
  }, []);

  // Check if specific cleanup exists
  const hasCleanup = useCallback((id: string) => {
    return cleanupFunctionsRef.current.has(id);
  }, []);

  // Auto cleanup on unmount
  useEffect(() => {
    if (autoCleanupOnUnmount) {
      return () => {
        cleanupAll();
      };
    }
  }, [autoCleanupOnUnmount, cleanupAll]);

  return {
    addCleanup,
    removeCleanup,
    cleanupAll,
    getCleanupCount,
    hasCleanup
  };
};

// Hook for automatic event listener cleanup
export const useEventListenerCleanup = () => {
  const { addCleanup, removeCleanup } = useResourceCleanup();

  const addEventListener = useCallback((target: EventTarget, event: string, handler: EventListener, options?: AddEventListenerOptions) => {
    const id = `event-${event}-${Date.now()}`;
    
    safeDom.addEventListener(target, event, handler, options);
    
    addCleanup(id, () => {
      safeDom.removeEventListener(target, event, handler, options);
    }, `Event listener: ${event}`);

    return () => removeCleanup(id);
  }, [addCleanup, removeCleanup]);

  return { addEventListener };
};

// Hook for automatic timer cleanup
export const useTimerCleanup = () => {
  const { addCleanup, removeCleanup } = useResourceCleanup();

  const setTimeout = useCallback((callback: () => void, delay: number) => {
    const id = `timeout-${Date.now()}`;
    const timerId = window.setTimeout(callback, delay);
    
    addCleanup(id, () => {
      window.clearTimeout(timerId);
    }, `Timeout: ${delay}ms`);

    return () => removeCleanup(id);
  }, [addCleanup, removeCleanup]);

  const setInterval = useCallback((callback: () => void, delay: number) => {
    const id = `interval-${Date.now()}`;
    const timerId = window.setInterval(callback, delay);
    
    addCleanup(id, () => {
      window.clearInterval(timerId);
    }, `Interval: ${delay}ms`);

    return () => removeCleanup(id);
  }, [addCleanup, removeCleanup]);

  return { setTimeout, setInterval };
};

// Hook for automatic AbortController cleanup
export const useAbortControllerCleanup = () => {
  const { addCleanup, removeCleanup } = useResourceCleanup();

  const createAbortController = useCallback((description?: string) => {
    const id = `abort-controller-${Date.now()}`;
    const controller = new AbortController();
    
    addCleanup(id, () => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    }, description || 'AbortController');

    return {
      controller,
      cleanup: () => removeCleanup(id)
    };
  }, [addCleanup, removeCleanup]);

  return { createAbortController };
};

// Export types
export type {
  CleanupFunction,
  UseResourceCleanupOptions,
  UseResourceCleanupReturn
};