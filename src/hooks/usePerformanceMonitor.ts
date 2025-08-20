// src/hooks/usePerformanceMonitor.ts
import { useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';

interface PerformanceOptions {
  componentName: string;
  logRenderTime?: boolean;
  logMountTime?: boolean;
}

/**
 * Hook for monitoring component performance
 * @param options - Performance monitoring options
 */
export const usePerformanceMonitor = (options: PerformanceOptions) => {
  const { componentName, logRenderTime = true, logMountTime = true } = options;
  const mountTimeRef = useRef<number | null>(null);
  const renderStartRef = useRef<number | null>(null);

  // Mount time monitoring
  useEffect(() => {
    if (logMountTime) {
      mountTimeRef.current = performance.now();
      
      return () => {
        if (mountTimeRef.current) {
          const mountDuration = performance.now() - mountTimeRef.current;
          logger.perf(`${componentName} Mount`, mountDuration);
        }
      };
    }
  }, [componentName, logMountTime]);

  // Render time monitoring
  useEffect(() => {
    if (logRenderTime && renderStartRef.current) {
      const renderDuration = performance.now() - renderStartRef.current;
      logger.perf(`${componentName} Render`, renderDuration);
    }
    
    if (logRenderTime) {
      renderStartRef.current = performance.now();
    }
    
    return () => {
      if (logRenderTime && renderStartRef.current) {
        const renderDuration = performance.now() - renderStartRef.current;
        logger.perf(`${componentName} Render`, renderDuration);
        renderStartRef.current = null;
      }
    };
  });

  // Manual performance measurement
  const startMeasurement = (label: string) => {
    performance.mark(`${componentName}-${label}-start`);
  };

  const endMeasurement = (label: string) => {
    performance.mark(`${componentName}-${label}-end`);
    const measure = performance.measure(
      `${componentName}-${label}`,
      `${componentName}-${label}-start`,
      `${componentName}-${label}-end`
    );
    
    logger.perf(`${componentName} ${label}`, measure.duration);
    
    // Clean up marks
    performance.clearMarks(`${componentName}-${label}-start`);
    performance.clearMarks(`${componentName}-${label}-end`);
    performance.clearMeasures(`${componentName}-${label}`);
    
    return measure.duration;
  };

  return {
    startMeasurement,
    endMeasurement
  };
};