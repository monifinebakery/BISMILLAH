// src/utils/userErrorMonitoring.ts
// Enhanced Error Monitoring for Real User Issues
// Tracks browser compatibility, device info, and user-specific errors

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface UserErrorData {
  error_message: string;
  error_stack?: string;
  error_type: 'javascript' | 'react' | 'api' | 'navigation' | 'render';
  user_id?: string;
  session_id: string;
  browser_info: {
    userAgent: string;
    platform: string;
    language: string;
    cookieEnabled: boolean;
    onLine: boolean;
    screen: string;
    viewport: string;
    colorDepth: number;
    pixelRatio: number;
    timezone: string;
  };
  device_info: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    touchEnabled: boolean;
    batteryLevel?: number;
    connectionType?: string;
  };
  page_info: {
    url: string;
    referrer: string;
    title: string;
    loadTime: number;
  };
  context_data?: Record<string, any>;
  timestamp: string;
}

class UserErrorMonitor {
  private sessionId: string;
  private errorCount: number = 0;
  private maxErrorsPerSession: number = 20;
  private initialized: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.init();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async init() {
    if (this.initialized) return;

    // Global error handler
    window.addEventListener('error', this.handleGlobalError.bind(this));
    
    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    
    // React error boundary integration
    this.setupReactErrorTracking();
    
    // Network error monitoring
    this.setupNetworkErrorTracking();

    this.initialized = true;
    logger.info('🔍 User Error Monitor initialized', { sessionId: this.sessionId });
  }

  private async handleGlobalError(event: ErrorEvent) {
    const errorData = await this.createErrorData({
      error_message: event.message,
      error_stack: event.error?.stack,
      error_type: 'javascript',
      context_data: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        errorEvent: true
      }
    });

    this.reportError(errorData);
  }

  private async handlePromiseRejection(event: PromiseRejectionEvent) {
    const errorData = await this.createErrorData({
      error_message: `Unhandled Promise Rejection: ${event.reason}`,
      error_stack: event.reason?.stack,
      error_type: 'javascript',
      context_data: {
        reason: event.reason,
        promise: event.promise?.toString?.(),
        promiseRejection: true
      }
    });

    this.reportError(errorData);
  }

  private setupReactErrorTracking() {
    // Hook into React DevTools if available
    if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      if (hook.onCommitFiberRoot) {
        const original = hook.onCommitFiberRoot;
        hook.onCommitFiberRoot = (id: any, root: any, priorityLevel: any) => {
          try {
            return original.call(hook, id, root, priorityLevel);
          } catch (error: any) {
            this.reportReactError(error, { commitPhase: true, root: root?.constructor?.name });
            throw error;
          }
        };
      }
    }
  }

  private setupNetworkErrorTracking() {
    // Monitor fetch failures
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        if (!response.ok) {
          this.reportNetworkError(response, args[0]);
        }
        
        return response;
      } catch (error: any) {
        this.reportNetworkError(error, args[0]);
        throw error;
      }
    };
  }

  private async reportNetworkError(errorOrResponse: any, url: any) {
    const errorData = await this.createErrorData({
      error_message: `Network Error: ${errorOrResponse.status || 'Failed'} - ${url}`,
      error_type: 'api',
      context_data: {
        url: url.toString(),
        status: errorOrResponse.status,
        statusText: errorOrResponse.statusText,
        networkError: true
      }
    });

    this.reportError(errorData);
  }

  async reportReactError(error: Error, context?: Record<string, any>) {
    const errorData = await this.createErrorData({
      error_message: error.message,
      error_stack: error.stack,
      error_type: 'react',
      context_data: {
        ...context,
        reactError: true,
        componentStack: (error as any).componentStack
      }
    });

    this.reportError(errorData);
  }

  async reportRenderError(componentName: string, error: Error, props?: any) {
    const errorData = await this.createErrorData({
      error_message: `Render Error in ${componentName}: ${error.message}`,
      error_stack: error.stack,
      error_type: 'render',
      context_data: {
        componentName,
        props: this.sanitizeProps(props),
        renderError: true
      }
    });

    this.reportError(errorData);
  }

  async reportCustomError(message: string, context?: Record<string, any>, errorType: UserErrorData['error_type'] = 'javascript') {
    const errorData = await this.createErrorData({
      error_message: message,
      error_type: errorType,
      context_data: context
    });

    this.reportError(errorData);
  }

  private async createErrorData(partial: Partial<UserErrorData>): Promise<UserErrorData> {
    const browserInfo = this.getBrowserInfo();
    const deviceInfo = await this.getDeviceInfo();
    const pageInfo = this.getPageInfo();

    // Get user info if available
    let userId: string | undefined;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id;
    } catch {
      // Silent fail for user detection
    }

    return {
      error_message: partial.error_message || 'Unknown error',
      error_stack: partial.error_stack,
      error_type: partial.error_type || 'javascript',
      user_id: userId,
      session_id: this.sessionId,
      browser_info: browserInfo,
      device_info: deviceInfo,
      page_info: pageInfo,
      context_data: partial.context_data,
      timestamp: new Date().toISOString()
    };
  }

  private getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio || 1,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private async getDeviceInfo() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    const isTablet = /tablet|ipad/i.test(userAgent) && !isMobile;
    
    let batteryLevel: number | undefined;
    let connectionType: string | undefined;

    // Battery API (if available)
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        batteryLevel = battery.level;
      }
    } catch {
      // Silent fail
    }

    // Connection API (if available)
    try {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        connectionType = connection.effectiveType || connection.type;
      }
    } catch {
      // Silent fail
    }

    return {
      isMobile,
      isTablet,
      isDesktop: !isMobile && !isTablet,
      touchEnabled: 'ontouchstart' in window,
      batteryLevel,
      connectionType
    };
  }

  private getPageInfo() {
    return {
      url: window.location.href,
      referrer: document.referrer,
      title: document.title,
      loadTime: performance.now()
    };
  }

  private sanitizeProps(props: any) {
    if (!props) return undefined;
    
    try {
      // Remove sensitive data and functions
      const sanitized = JSON.parse(JSON.stringify(props, (key, value) => {
        if (typeof value === 'function') return '[Function]';
        if (key.toLowerCase().includes('password')) return '[REDACTED]';
        if (key.toLowerCase().includes('token')) return '[REDACTED]';
        if (key.toLowerCase().includes('key') && typeof value === 'string' && value.length > 10) return '[REDACTED]';
        return value;
      }));
      
      return sanitized;
    } catch {
      return '[Could not sanitize props]';
    }
  }

  private async reportError(errorData: UserErrorData) {
    if (this.errorCount >= this.maxErrorsPerSession) {
      logger.warn('Max errors per session reached, skipping error report');
      return;
    }

    this.errorCount++;

    // Log locally first
    logger.error('🚨 User Error Detected:', errorData);

    // Save to localStorage for debugging
    try {
      const existingErrors = JSON.parse(localStorage.getItem('userErrors') || '[]');
      existingErrors.push(errorData);
      
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.shift();
      }
      
      localStorage.setItem('userErrors', JSON.stringify(existingErrors));
    } catch {
      // Silent fail for localStorage
    }

    // Report to Supabase (only in production or if explicitly enabled)
    if (!import.meta.env.DEV || import.meta.env.VITE_FORCE_ERROR_REPORTING === 'true') {
      try {
        await supabase.from('user_error_logs').insert(errorData);
        logger.debug('✅ Error reported to Supabase');
      } catch (supabaseError) {
        logger.error('Failed to report error to Supabase:', supabaseError);
      }
    }
  }

  // Public method to get error stats
  getErrorStats() {
    return {
      sessionId: this.sessionId,
      errorCount: this.errorCount,
      maxErrors: this.maxErrorsPerSession,
      initialized: this.initialized
    };
  }

  // Public method to clear error logs
  clearErrorLogs() {
    try {
      localStorage.removeItem('userErrors');
      this.errorCount = 0;
      logger.info('Error logs cleared');
    } catch {
      // Silent fail
    }
  }
}

// Singleton instance
export const userErrorMonitor = new UserErrorMonitor();

// Export for manual error reporting
export { UserErrorMonitor };

// Global debug access (development only)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__USER_ERROR_MONITOR__ = {
    monitor: userErrorMonitor,
    reportError: (message: string, context?: any) => 
      userErrorMonitor.reportCustomError(message, context),
    getStats: () => userErrorMonitor.getErrorStats(),
    clearLogs: () => userErrorMonitor.clearErrorLogs(),
    getStoredErrors: () => {
      try {
        return JSON.parse(localStorage.getItem('userErrors') || '[]');
      } catch {
        return [];
      }
    }
  };
}