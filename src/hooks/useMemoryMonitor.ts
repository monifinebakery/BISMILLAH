// src/hooks/useMemoryMonitor.ts
import { useEffect, useRef, useCallback } from 'react';
import { logger } from '@/utils/logger';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
}

interface UseMemoryMonitorOptions {
  enabled?: boolean;
  interval?: number; // in milliseconds
  threshold?: number; // percentage (0-100)
  onThresholdExceeded?: (memoryInfo: MemoryInfo) => void;
  onMemoryLeak?: (memoryInfo: MemoryInfo) => void;
}

interface UseMemoryMonitorReturn {
  memoryInfo: MemoryInfo | null;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  forceGarbageCollection: () => void;
  getMemorySnapshot: () => MemoryInfo | null;
}

// Check if Performance API with memory is available
const isMemoryAPIAvailable = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    'performance' in window &&
    'memory' in (window.performance as any)
  );
};

// Get current memory information
const getMemoryInfo = (): MemoryInfo | null => {
  if (!isMemoryAPIAvailable()) {
    return null;
  }

  const memory = (window.performance as any).memory;
  const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usagePercentage: Math.round(usagePercentage * 100) / 100
  };
};

// Format bytes to human readable format
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const useMemoryMonitor = ({
  enabled = true,
  interval = 5000, // 5 seconds
  threshold = 80, // 80%
  onThresholdExceeded,
  onMemoryLeak
}: UseMemoryMonitorOptions = {}): UseMemoryMonitorReturn => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousMemoryRef = useRef<MemoryInfo | null>(null);
  const memoryHistoryRef = useRef<MemoryInfo[]>([]);
  const isMonitoringRef = useRef(false);
  const memoryInfoRef = useRef<MemoryInfo | null>(null);

  // Force garbage collection (only works in development with --enable-precise-memory-info)
  const forceGarbageCollection = useCallback(() => {
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as any).gc();
        logger.info('Forced garbage collection');
      } catch (error) {
        logger.warn('Garbage collection not available:', error);
      }
    } else {
      logger.warn('Garbage collection not available in this environment');
    }
  }, []);

  // Get memory snapshot
  const getMemorySnapshot = useCallback((): MemoryInfo | null => {
    return getMemoryInfo();
  }, []);

  // Check for potential memory leaks
  const checkForMemoryLeaks = useCallback((currentMemory: MemoryInfo) => {
    const history = memoryHistoryRef.current;
    
    // Keep only last 10 measurements
    if (history.length >= 10) {
      history.shift();
    }
    history.push(currentMemory);

    // Check for consistent memory growth (potential leak)
    if (history.length >= 5) {
      const recentGrowth = history.slice(-5);
      const isConsistentGrowth = recentGrowth.every((memory, index) => {
        if (index === 0) return true;
        return memory.usedJSHeapSize > recentGrowth[index - 1].usedJSHeapSize;
      });

      const growthRate = (
        (recentGrowth[recentGrowth.length - 1].usedJSHeapSize - recentGrowth[0].usedJSHeapSize) /
        recentGrowth[0].usedJSHeapSize
      ) * 100;

      if (isConsistentGrowth && growthRate > 20) {
        logger.warn('Potential memory leak detected:', {
          growthRate: `${growthRate.toFixed(2)}%`,
          currentUsage: formatBytes(currentMemory.usedJSHeapSize),
          usagePercentage: `${currentMemory.usagePercentage}%`
        });
        
        onMemoryLeak?.(currentMemory);
      }
    }
  }, [onMemoryLeak]);

  // Monitor memory usage
  const monitorMemory = useCallback(() => {
    const currentMemory = getMemoryInfo();
    if (!currentMemory) return;

    memoryInfoRef.current = currentMemory;
    previousMemoryRef.current = currentMemory;

    // Log memory info in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Memory usage:', {
        used: formatBytes(currentMemory.usedJSHeapSize),
        total: formatBytes(currentMemory.totalJSHeapSize),
        limit: formatBytes(currentMemory.jsHeapSizeLimit),
        percentage: `${currentMemory.usagePercentage}%`
      });
    }

    // Check threshold
    if (currentMemory.usagePercentage > threshold) {
      logger.warn('Memory usage threshold exceeded:', {
        current: `${currentMemory.usagePercentage}%`,
        threshold: `${threshold}%`,
        used: formatBytes(currentMemory.usedJSHeapSize)
      });
      
      onThresholdExceeded?.(currentMemory);
    }

    // Check for memory leaks
    checkForMemoryLeaks(currentMemory);
  }, [threshold, onThresholdExceeded, checkForMemoryLeaks]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (!isMemoryAPIAvailable() || !enabled) {
      logger.warn('Memory monitoring not available or disabled');
      return;
    }

    if (isMonitoringRef.current) {
      logger.warn('Memory monitoring already started');
      return;
    }

    logger.info('Starting memory monitoring', { interval, threshold });
    isMonitoringRef.current = true;
    
    // Initial measurement
    monitorMemory();
    
    // Set up interval
    intervalRef.current = setInterval(monitorMemory, interval);
  }, [enabled, interval, threshold, monitorMemory]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isMonitoringRef.current = false;
    logger.info('Memory monitoring stopped');
  }, []);

  // Auto start/stop based on enabled prop
  useEffect(() => {
    if (enabled) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [enabled, startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    memoryInfo: memoryInfoRef.current,
    isMonitoring: isMonitoringRef.current,
    startMonitoring,
    stopMonitoring,
    forceGarbageCollection,
    getMemorySnapshot
  };
};

// Export utility functions
export { formatBytes, getMemoryInfo, isMemoryAPIAvailable };

// Export types
export type { MemoryInfo, UseMemoryMonitorOptions, UseMemoryMonitorReturn };