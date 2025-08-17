// src/utils/performanceMonitor.ts
// Performance monitoring utilities to track setTimeout violations and heavy operations

import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: Date;
  type: 'timeout' | 'interval' | 'idle' | 'operation';
  stack?: string;
}

interface TimeoutViolation {
  duration: number;
  callback: string;
  timestamp: Date;
  stack?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private violations: TimeoutViolation[] = [];
  private observer?: PerformanceObserver;
  private originalSetTimeout: typeof setTimeout;
  private originalSetInterval: typeof setInterval;
  private isEnabled: boolean = false;

  constructor() {
    this.originalSetTimeout = setTimeout.bind(window);
    this.originalSetInterval = setInterval.bind(window);
    this.init();
  }

  private init() {
    // Only enable in development or when explicitly enabled
    this.isEnabled = process.env.NODE_ENV === 'development' || 
                     localStorage.getItem('enablePerformanceMonitoring') === 'true';

    if (!this.isEnabled) return;

    this.setupPerformanceObserver();
    this.wrapTimeoutFunctions();
    
    logger.info('PerformanceMonitor', 'Initialized for setTimeout violation tracking');
  }

  private setupPerformanceObserver() {
    if (!('PerformanceObserver' in window)) {
      logger.warn('PerformanceMonitor', 'PerformanceObserver not supported');
      return;
    }

    try {
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Track long tasks that might be related to setTimeout violations
          if (entry.entryType === 'longtask' && entry.duration > 50) {
            this.recordMetric({
              name: 'LongTask',
              duration: entry.duration,
              timestamp: new Date(entry.startTime),
              type: 'operation',
              stack: this.getCurrentStack()
            });

            // Log violation if duration exceeds Chrome's warning threshold
            if (entry.duration > 99) {
              logger.warn('PerformanceMonitor', 'Long task detected (>99ms)', {
                duration: entry.duration,
                startTime: entry.startTime
              });
            }
          }

          // Track layout thrashing
          if (entry.entryType === 'layout-shift' && entry.value > 0.1) {
            this.recordMetric({
              name: 'LayoutShift',
              duration: entry.value,
              timestamp: new Date(),
              type: 'operation'
            });
          }
        });
      });

      // Observe long tasks and layout shifts
      this.observer.observe({ 
        entryTypes: ['longtask', 'layout-shift'] 
      });

    } catch (error) {
      logger.error('PerformanceMonitor', 'Failed to setup PerformanceObserver:', error);
    }
  }

  private wrapTimeoutFunctions() {
    // Wrap setTimeout to track execution times
    (window as any).setTimeout = (callback: Function, delay: number, ...args: any[]) => {
      if (!this.isEnabled) {
        return this.originalSetTimeout(callback, delay, ...args);
      }

      const startTime = performance.now();
      const callbackName = callback.name || 'anonymous';
      const stack = this.getCurrentStack();

      const wrappedCallback = (...callbackArgs: any[]) => {
        const executionStart = performance.now();
        
        try {
          const result = callback.apply(this, callbackArgs);
          const executionTime = performance.now() - executionStart;
          
          // Record metric
          this.recordMetric({
            name: `setTimeout:${callbackName}`,
            duration: executionTime,
            timestamp: new Date(),
            type: 'timeout',
            stack
          });

          // Track violations (>99ms as Chrome warns about)
          if (executionTime > 99) {
            this.recordViolation({
              duration: executionTime,
              callback: callbackName,
              timestamp: new Date(),
              stack
            });

            logger.warn('PerformanceMonitor', 'setTimeout violation detected', {
              callback: callbackName,
              duration: executionTime,
              delay,
              stack: stack?.split('\n').slice(0, 3).join('\n') // First 3 stack lines
            });
          }

          return result;
        } catch (error) {
          const executionTime = performance.now() - executionStart;
          
          this.recordMetric({
            name: `setTimeout:${callbackName}:error`,
            duration: executionTime,
            timestamp: new Date(),
            type: 'timeout',
            stack
          });

          throw error;
        }
      };

      return this.originalSetTimeout(wrappedCallback, delay, ...args);
    };

    // Wrap setInterval similarly (but less verbose)
    (window as any).setInterval = (callback: Function, delay: number, ...args: any[]) => {
      if (!this.isEnabled) {
        return this.originalSetInterval(callback, delay, ...args);
      }

      const callbackName = callback.name || 'anonymous';
      const stack = this.getCurrentStack();

      const wrappedCallback = (...callbackArgs: any[]) => {
        const executionStart = performance.now();
        
        try {
          const result = callback.apply(this, callbackArgs);
          const executionTime = performance.now() - executionStart;
          
          // Only log violations for intervals (they tend to repeat)
          if (executionTime > 99) {
            logger.warn('PerformanceMonitor', 'setInterval violation detected', {
              callback: callbackName,
              duration: executionTime,
              delay
            });
          }

          return result;
        } catch (error) {
          throw error;
        }
      };

      return this.originalSetInterval(wrappedCallback, delay, ...args);
    };
  }

  private getCurrentStack(): string | undefined {
    try {
      const error = new Error();
      return error.stack?.split('\n').slice(2).join('\n'); // Remove first 2 lines (Error + this function)
    } catch {
      return undefined;
    }
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  private recordViolation(violation: TimeoutViolation) {
    this.violations.push(violation);
    
    // Keep only last 50 violations
    if (this.violations.length > 50) {
      this.violations = this.violations.slice(-50);
    }
  }

  // Public API for tracking custom operations
  public measureOperation<T>(name: string, operation: () => T): T {
    if (!this.isEnabled) {
      return operation();
    }

    const start = performance.now();
    
    try {
      const result = operation();
      const duration = performance.now() - start;
      
      this.recordMetric({
        name: `custom:${name}`,
        duration,
        timestamp: new Date(),
        type: 'operation'
      });

      if (duration > 99) {
        logger.warn('PerformanceMonitor', 'Custom operation violation', {
          name,
          duration
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.recordMetric({
        name: `custom:${name}:error`,
        duration,
        timestamp: new Date(),
        type: 'operation'
      });

      throw error;
    }
  }

  // Public API for async operations
  public async measureAsyncOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) {
      return operation();
    }

    const start = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - start;
      
      this.recordMetric({
        name: `async:${name}`,
        duration,
        timestamp: new Date(),
        type: 'operation'
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.recordMetric({
        name: `async:${name}:error`,
        duration,
        timestamp: new Date(),
        type: 'operation'
      });

      throw error;
    }
  }

  // Get performance reports
  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getViolations(): TimeoutViolation[] {
    return [...this.violations];
  }

  public getReport() {
    const recentViolations = this.violations.filter(v => 
      Date.now() - v.timestamp.getTime() < 60000 // Last minute
    );

    const slowestOperations = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const timeoutViolations = this.metrics.filter(m => 
      m.type === 'timeout' && m.duration > 99
    );

    return {
      summary: {
        totalMetrics: this.metrics.length,
        totalViolations: this.violations.length,
        recentViolations: recentViolations.length,
        timeoutViolations: timeoutViolations.length
      },
      slowestOperations,
      recentViolations,
      timeoutViolations
    };
  }

  public clearMetrics() {
    this.metrics = [];
    this.violations = [];
    logger.info('PerformanceMonitor', 'Metrics cleared');
  }

  public enable() {
    this.isEnabled = true;
    localStorage.setItem('enablePerformanceMonitoring', 'true');
    this.init();
    logger.info('PerformanceMonitor', 'Enabled');
  }

  public disable() {
    this.isEnabled = false;
    localStorage.removeItem('enablePerformanceMonitoring');
    
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
    
    // Restore original functions
    (window as any).setTimeout = this.originalSetTimeout;
    (window as any).setInterval = this.originalSetInterval;
    
    logger.info('PerformanceMonitor', 'Disabled');
  }
}

// Create global instance
export const performanceMonitor = new PerformanceMonitor();

// Add to window for debugging
if (typeof window !== 'undefined') {
  (window as any).__PERFORMANCE_MONITOR__ = performanceMonitor;
}

// Helper functions for components
export const measureTimeout = (name: string, callback: Function, delay: number) => {
  return setTimeout(() => {
    performanceMonitor.measureOperation(name, callback);
  }, delay);
};

export const measureInterval = (name: string, callback: Function, delay: number) => {
  return setInterval(() => {
    performanceMonitor.measureOperation(name, callback);
  }, delay);
};

// React Hook for performance monitoring
export const usePerformanceMonitor = () => {
  return {
    measureOperation: performanceMonitor.measureOperation.bind(performanceMonitor),
    measureAsyncOperation: performanceMonitor.measureAsyncOperation.bind(performanceMonitor),
    getReport: performanceMonitor.getReport.bind(performanceMonitor),
    clearMetrics: performanceMonitor.clearMetrics.bind(performanceMonitor),
    enable: performanceMonitor.enable.bind(performanceMonitor),
    disable: performanceMonitor.disable.bind(performanceMonitor)
  };
};
