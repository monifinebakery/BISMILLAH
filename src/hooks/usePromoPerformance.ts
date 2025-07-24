// hooks/usePromoPerformance.ts
import { 
  useMemo, 
  useCallback, 
  useState, 
  useEffect, 
  useRef,
  DependencyList 
} from 'react';

// 🎯 Debounced value hook
export const useDebounce = <T>(value: T, delay: number): T => {
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

// 🔄 Previous value hook
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
};

// 📊 Memoized calculation hook
export const useMemoizedCalculation = <T>(
  calculator: () => T,
  deps: DependencyList,
  options: {
    enabled?: boolean;
    onCalculate?: (result: T) => void;
    fallback?: T;
  } = {}
): T | undefined => {
  const { enabled = true, onCalculate, fallback } = options;

  const result = useMemo(() => {
    if (!enabled) return fallback;
    
    try {
      const calculated = calculator();
      if (onCalculate) {
        onCalculate(calculated);
      }
      return calculated;
    } catch (error) {
      console.warn('Calculation error:', error);
      return fallback;
    }
  }, [...deps, enabled]);

  return result;
};

// ⏱️ Performance measurement hook
export const usePerformanceTimer = (label: string = 'Operation') => {
  const timerRef = useRef<number>();
  
  const start = useCallback(() => {
    timerRef.current = performance.now();
  }, []);
  
  const end = useCallback(() => {
    if (timerRef.current) {
      const duration = performance.now() - timerRef.current;
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      return duration;
    }
    return 0;
  }, [label]);
  
  const measure = useCallback(<T>(operation: () => T): T => {
    start();
    const result = operation();
    end();
    return result;
  }, [start, end]);
  
  return { start, end, measure };
};

// 🔄 Throttled callback hook
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const throttledRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const throttledCallback = useCallback((...args: Parameters<T>) => {
    if (!throttledRef.current) {
      callback(...args);
      throttledRef.current = true;
      
      timeoutRef.current = setTimeout(() => {
        throttledRef.current = false;
      }, delay);
    }
  }, [callback, delay]) as T;
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return throttledCallback;
};

// 📈 Batch state updates hook
export const useBatchedUpdates = <T>() => {
  const [pendingUpdates, setPendingUpdates] = useState<Array<(prev: T) => T>>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const batchUpdate = useCallback((updater: (prev: T) => T) => {
    setPendingUpdates(prev => [...prev, updater]);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Batch updates with RAF
    timeoutRef.current = setTimeout(() => {
      requestAnimationFrame(() => {
        setPendingUpdates([]);
      });
    }, 0);
  }, []);
  
  const applyUpdates = useCallback((initialValue: T): T => {
    return pendingUpdates.reduce((acc, updater) => updater(acc), initialValue);
  }, [pendingUpdates]);
  
  return { batchUpdate, applyUpdates, hasPendingUpdates: pendingUpdates.length > 0 };
};

// 🎯 Optimized list filtering hook
export const useOptimizedFilter = <T>(
  items: T[],
  filterFn: (item: T) => boolean,
  deps: DependencyList = []
) => {
  const filteredItems = useMemo(() => {
    const timer = performance.now();
    const result = items.filter(filterFn);
    const duration = performance.now() - timer;
    
    if (duration > 10) {
      console.warn(`⚠️ Slow filter operation: ${duration.toFixed(2)}ms for ${items.length} items`);
    }
    
    return result;
  }, [items, ...deps]);
  
  return filteredItems;
};

// 📊 Promo calculation performance hook
export const usePromoCalculationPerformance = () => {
  const [metrics, setMetrics] = useState({
    calculationsCount: 0,
    totalTime: 0,
    averageTime: 0,
    slowCalculations: 0
  });
  
  const measureCalculation = useCallback(<T>(
    calculationFn: () => T,
    label: string = 'Calculation'
  ): T => {
    const start = performance.now();
    const result = calculationFn();
    const duration = performance.now() - start;
    
    setMetrics(prev => {
      const newCount = prev.calculationsCount + 1;
      const newTotal = prev.totalTime + duration;
      const slowCount = duration > 50 ? prev.slowCalculations + 1 : prev.slowCalculations;
      
      return {
        calculationsCount: newCount,
        totalTime: newTotal,
        averageTime: newTotal / newCount,
        slowCalculations: slowCount
      };
    });
    
    if (duration > 50) {
      console.warn(`🐌 Slow promo calculation (${label}): ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }, []);
  
  const resetMetrics = useCallback(() => {
    setMetrics({
      calculationsCount: 0,
      totalTime: 0,
      averageTime: 0,
      slowCalculations: 0
    });
  }, []);
  
  return { metrics, measureCalculation, resetMetrics };
};

// 💾 Optimized localStorage hook
export const useOptimizedLocalStorage = <T>(
  key: string,
  defaultValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    ttl?: number; // Time to live in milliseconds
  } = {}
) => {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    ttl
  } = options;
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      
      if (item === null) {
        return defaultValue;
      }
      
      const parsed = deserialize(item);
      
      // Check TTL if provided
      if (ttl && parsed && typeof parsed === 'object' && 'timestamp' in parsed) {
        const now = Date.now();
        const timestamp = (parsed as any).timestamp;
        
        if (now - timestamp > ttl) {
          window.localStorage.removeItem(key);
          return defaultValue;
        }
        
        return (parsed as any).data;
      }
      
      return parsed;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });
  
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      let dataToStore = valueToStore;
      
      // Add timestamp for TTL
      if (ttl) {
        dataToStore = {
          data: valueToStore,
          timestamp: Date.now()
        } as any;
      }
      
      window.localStorage.setItem(key, serialize(dataToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serialize, storedValue, ttl]);
  
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(defaultValue);
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, defaultValue]);
  
  return [storedValue, setValue, removeValue] as const;
};

// 🔄 Component re-render tracking hook
export const useRenderTracker = (componentName: string) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    if (renderCount.current % 10 === 0) {
      console.log(`🔄 ${componentName} rendered ${renderCount.current} times`);
    }
    
    if (timeSinceLastRender < 16) { // Less than 1 frame at 60fps
      console.warn(`⚠️ ${componentName} rendering too frequently: ${timeSinceLastRender}ms since last render`);
    }
    
    lastRenderTime.current = now;
  });
  
  return renderCount.current;
};

// 📱 Responsive optimization hook
export const useResponsiveOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      
      // Detect low-end device
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      const memory = (navigator as any).deviceMemory || 4;
      setIsLowEndDevice(hardwareConcurrency <= 2 || memory <= 2);
    };
    
    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);
  
  const optimizationLevel = useMemo(() => {
    if (isLowEndDevice) return 'high';
    if (isMobile) return 'medium';
    return 'low';
  }, [isLowEndDevice, isMobile]);
  
  return {
    isMobile,
    isTablet,
    isLowEndDevice,
    optimizationLevel,
    shouldReduceAnimations: isLowEndDevice,
    shouldLazyLoad: isMobile || isLowEndDevice,
    maxConcurrentCalculations: isLowEndDevice ? 1 : isMobile ? 2 : 4
  };
};

// 🎛️ Advanced memoization hook with size limit
export const useAdvancedMemo = <T>(
  factory: () => T,
  deps: DependencyList,
  options: {
    maxCacheSize?: number;
    ttl?: number;
  } = {}
) => {
  const { maxCacheSize = 10, ttl = 5 * 60 * 1000 } = options; // 5 minutes default TTL
  const cacheRef = useRef(new Map<string, { value: T; timestamp: number }>());
  
  const cacheKey = useMemo(() => {
    return JSON.stringify(deps);
  }, deps);
  
  return useMemo(() => {
    const cache = cacheRef.current;
    const now = Date.now();
    
    // Check if cached value exists and is not expired
    const cached = cache.get(cacheKey);
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.value;
    }
    
    // Calculate new value
    const newValue = factory();
    
    // Clean expired entries
    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > ttl) {
        cache.delete(key);
      }
    }
    
    // Limit cache size
    if (cache.size >= maxCacheSize) {
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }
    
    // Store new value
    cache.set(cacheKey, { value: newValue, timestamp: now });
    
    return newValue;
  }, [cacheKey, factory, ttl, maxCacheSize]);
};

export default {
  useDebounce,
  usePrevious,
  useMemoizedCalculation,
  usePerformanceTimer,
  useThrottle,
  useBatchedUpdates,
  useOptimizedFilter,
  usePromoCalculationPerformance,
  useOptimizedLocalStorage,
  useRenderTracker,
  useResponsiveOptimization,
  useAdvancedMemo
};