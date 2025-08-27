// hooks/index.ts - Pintu Gerbang Utama untuk Semua Hooks

// ====================================================================
// Memory management hooks
// ====================================================================

export { useMemoryMonitor } from './useMemoryMonitor';
export { useResourceCleanup, useEventListenerCleanup, useTimerCleanup, useAbortControllerCleanup } from './useResourceCleanup';
export { useMemoryOptimization } from '../utils/memoryOptimizer';

// ====================================================================
// Web Worker hooks
// ====================================================================

export { 
  useWebWorker,
  useHPPWorker,
  useBulkOperationsWorker,
  useHPPCalculation,
  useBulkOperations
} from './useWebWorker';

// ====================================================================
// Preloading and prefetching hooks
// ====================================================================

export { usePreloading } from './usePreloading';

// ====================================================================
// Network optimization hooks
// ====================================================================

export { 
  useNetworkOptimization, 
  useApiRequest, 
  useRequestDeduplication, 
  useIntelligentRetry 
} from './useNetworkOptimization';

// ====================================================================
// Existing hooks (re-export)
// ====================================================================

// Basic hooks that are commonly used
export { useSelection } from './useSelection';
export { usePagination } from './usePagination';
export { useAdminAuth } from './useAdminAuth';
export { useAppLayout } from './useAppLayout';

// Utility hooks
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Simple debounce utility
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Search hook
export const useSearch = <T>(
  items: T[],
  searchKey?: keyof T,
  debounceMs: number = 300
) => {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);

  const debouncedSearch = useMemo(
    () => debounce((searchQuery: string) => {
      if (!searchQuery.trim()) {
        setFilteredItems(items);
        return;
      }

      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = items.filter(item => {
        if (searchKey) {
          const value = item[searchKey];
          return String(value).toLowerCase().includes(lowercasedQuery);
        }
        
        // Search in all string properties if no specific key provided
        return Object.values(item as Record<string, any>).some(value => 
          String(value).toLowerCase().includes(lowercasedQuery)
        );
      });
      
      setFilteredItems(filtered);
    }, debounceMs),
    [items, searchKey, debounceMs]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  useEffect(() => {
    setFilteredItems(items);
  }, [items]);

  return {
    query,
    setQuery,
    filteredItems,
    resultsCount: filteredItems.length
  };
};

// Loading hook
export const useLoading = (initialState: boolean = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState<string | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = useCallback((errorMessage: string) => {
    setIsLoading(false);
    setError(errorMessage);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError: setLoadingError,
    reset
  };
};

// Toggle hook
export const useToggle = (initialValue: boolean = false) => {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => setValue(prev => !prev), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  
  return [value, { toggle, setTrue, setFalse, setValue }] as const;
};

// Debounce hook
export const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
