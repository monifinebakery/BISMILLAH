// src/utils/routing/preloadLogger.ts
import { logger } from '@/utils/logger';

export interface PreloadMetrics {
  routeName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: Error;
  retryCount?: number;
  cacheHit?: boolean;
  chunkSize?: number;
}

export interface RouteErrorDetails {
  routeName: string;
  errorType: 'chunk' | 'network' | 'serviceWorker' | 'runtime' | 'unknown';
  errorMessage: string;
  errorStack?: string;
  userAgent: string;
  isOnline: boolean;
  timestamp: string;
  recoveryAttempted?: boolean;
  recoverySuccess?: boolean;
}

/**
 * Centralized preload and error logging system
 */
class PreloadLogger {
  private metrics: Map<string, PreloadMetrics> = new Map();
  private errorHistory: RouteErrorDetails[] = [];
  private maxHistorySize = 50;

  /**
   * Start tracking a route preload
   */
  startPreload(routeName: string): void {
    const metrics: PreloadMetrics = {
      routeName,
      startTime: performance.now(),
      success: false
    };
    
    this.metrics.set(routeName, metrics);
    
    logger.info(`🚀 [PRELOAD] Starting preload for route: ${routeName}`, {
      routeName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Mark preload as successful
   */
  markPreloadSuccess(routeName: string, options?: { 
    cacheHit?: boolean; 
    chunkSize?: number; 
  }): void {
    const metrics = this.metrics.get(routeName);
    if (!metrics) return;

    const endTime = performance.now();
    const duration = endTime - metrics.startTime;

    const updatedMetrics: PreloadMetrics = {
      ...metrics,
      endTime,
      duration,
      success: true,
      cacheHit: options?.cacheHit,
      chunkSize: options?.chunkSize
    };

    this.metrics.set(routeName, updatedMetrics);

    logger.info(`✅ [PRELOAD] Route preload successful: ${routeName}`, {
      routeName,
      duration: Math.round(duration),
      cacheHit: options?.cacheHit,
      chunkSize: options?.chunkSize,
      timestamp: new Date().toISOString()
    });

    // Log performance metrics
    if (duration > 2000) {
      logger.warn(`⚠️ [PRELOAD] Slow preload detected for ${routeName}: ${Math.round(duration)}ms`);
    }
  }

  /**
   * Mark preload as failed
   */
  markPreloadFailure(routeName: string, error: Error, retryCount = 0): void {
    const metrics = this.metrics.get(routeName);
    if (!metrics) return;

    const endTime = performance.now();
    const duration = endTime - metrics.startTime;

    const updatedMetrics: PreloadMetrics = {
      ...metrics,
      endTime,
      duration,
      success: false,
      error,
      retryCount
    };

    this.metrics.set(routeName, updatedMetrics);

    logger.error(`❌ [PRELOAD] Route preload failed: ${routeName}`, {
      routeName,
      duration: Math.round(duration),
      error: error.message,
      retryCount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log route error with detailed context
   */
  logRouteError(details: Omit<RouteErrorDetails, 'timestamp' | 'userAgent' | 'isOnline'>): void {
    const errorDetails: RouteErrorDetails = {
      ...details,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      isOnline: navigator.onLine
    };

    // Add to history
    this.errorHistory.unshift(errorDetails);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }

    // Log with appropriate level
    const logLevel = this.getLogLevel(details.errorType);
    logger[logLevel](`🚨 [ROUTE ERROR] ${details.errorType.toUpperCase()} error in ${details.routeName}`, errorDetails);

    // Track error patterns
    this.analyzeErrorPatterns(errorDetails);
  }

  /**
   * Log recovery attempt
   */
  logRecoveryAttempt(routeName: string, recoveryType: 'simple' | 'cache' | 'serviceWorker' | 'full'): void {
    logger.info(`🔧 [RECOVERY] Attempting ${recoveryType} recovery for route: ${routeName}`, {
      routeName,
      recoveryType,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log recovery result
   */
  logRecoveryResult(routeName: string, success: boolean, recoveryType: string): void {
    const level = success ? 'info' : 'error';
    const icon = success ? '✅' : '❌';
    
    logger[level](`${icon} [RECOVERY] ${recoveryType} recovery ${success ? 'successful' : 'failed'} for route: ${routeName}`, {
      routeName,
      recoveryType,
      success,
      timestamp: new Date().toISOString()
    });

    // Update error history
    const recentError = this.errorHistory.find(e => e.routeName === routeName);
    if (recentError) {
      recentError.recoveryAttempted = true;
      recentError.recoverySuccess = success;
    }
  }

  /**
   * Get preload metrics for a route
   */
  getMetrics(routeName: string): PreloadMetrics | undefined {
    return this.metrics.get(routeName);
  }

  /**
   * Get all preload metrics
   */
  getAllMetrics(): PreloadMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get error history
   */
  getErrorHistory(): RouteErrorDetails[] {
    return [...this.errorHistory];
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    totalPreloads: number;
    successfulPreloads: number;
    failedPreloads: number;
    averageDuration: number;
    slowPreloads: number;
    cacheHitRate: number;
  } {
    const metrics = this.getAllMetrics();
    const successful = metrics.filter(m => m.success);
    const failed = metrics.filter(m => !m.success);
    const withDuration = metrics.filter(m => m.duration !== undefined);
    const slow = metrics.filter(m => m.duration && m.duration > 2000);
    const cacheHits = metrics.filter(m => m.cacheHit);

    return {
      totalPreloads: metrics.length,
      successfulPreloads: successful.length,
      failedPreloads: failed.length,
      averageDuration: withDuration.length > 0 
        ? withDuration.reduce((sum, m) => sum + (m.duration || 0), 0) / withDuration.length 
        : 0,
      slowPreloads: slow.length,
      cacheHitRate: metrics.length > 0 ? cacheHits.length / metrics.length : 0
    };
  }

  /**
   * Clear metrics and history
   */
  clear(): void {
    this.metrics.clear();
    this.errorHistory = [];
    logger.info('🧹 [PRELOAD] Cleared all metrics and error history');
  }

  /**
   * Export data for debugging
   */
  exportData(): {
    metrics: PreloadMetrics[];
    errors: RouteErrorDetails[];
    summary: ReturnType<PreloadLogger['getPerformanceSummary']>;
  } {
    return {
      metrics: this.getAllMetrics(),
      errors: this.getErrorHistory(),
      summary: this.getPerformanceSummary()
    };
  }

  /**
   * Get appropriate log level for error type
   */
  private getLogLevel(errorType: RouteErrorDetails['errorType']): 'error' | 'warn' | 'info' {
    switch (errorType) {
      case 'chunk':
      case 'serviceWorker':
        return 'error';
      case 'network':
        return 'warn';
      case 'runtime':
        return 'error';
      default:
        return 'error';
    }
  }

  /**
   * Analyze error patterns for insights
   */
  private analyzeErrorPatterns(error: RouteErrorDetails): void {
    const recentErrors = this.errorHistory.slice(0, 10);
    
    // Check for repeated errors
    const sameRouteErrors = recentErrors.filter(e => e.routeName === error.routeName);
    if (sameRouteErrors.length >= 3) {
      logger.warn(`🔄 [PATTERN] Repeated errors detected for route: ${error.routeName}`, {
        count: sameRouteErrors.length,
        errorTypes: sameRouteErrors.map(e => e.errorType)
      });
    }

    // Check for chunk error patterns
    const chunkErrors = recentErrors.filter(e => e.errorType === 'chunk');
    if (chunkErrors.length >= 5) {
      logger.warn(`🧩 [PATTERN] High chunk error rate detected`, {
        count: chunkErrors.length,
        routes: chunkErrors.map(e => e.routeName)
      });
    }

    // Check for network issues
    if (!error.isOnline) {
      logger.info(`📡 [PATTERN] Offline error detected for route: ${error.routeName}`);
    }
  }
}

// Export singleton instance
export const preloadLogger = new PreloadLogger();

// Export utility functions
export const classifyError = (error: Error): RouteErrorDetails['errorType'] => {
  const message = error.message.toLowerCase();
  
  if (/dynamically imported module|chunkloaderror|importing a module script failed|loading chunk \d+ failed/.test(message)) {
    return 'chunk';
  }
  
  if (/networkerror|failed to fetch|err_network|err_internet_disconnected/.test(message)) {
    return 'network';
  }
  
  if (/service worker|sw\.js|workbox/.test(message)) {
    return 'serviceWorker';
  }
  
  if (/runtime|reference|type|syntax/.test(message)) {
    return 'runtime';
  }
  
  return 'unknown';
};

export default preloadLogger;
