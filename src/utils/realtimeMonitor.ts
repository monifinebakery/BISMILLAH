// Real-time connection monitoring utilities
// Helps debug and monitor Supabase real-time subscription issues

import { logger } from './logger';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionStatus {
  isConnected: boolean;
  lastConnected: Date | null;
  lastError: string | null;
  retryCount: number;
  subscriptionCount: number;
}

class RealtimeMonitor {
  private status: ConnectionStatus = {
    isConnected: false,
    lastConnected: null,
    lastError: null,
    retryCount: 0,
    subscriptionCount: 0
  };

  private listeners: Array<(status: ConnectionStatus) => void> = [];

  constructor() {
    this.setupGlobalMonitoring();
  }

  private setupGlobalMonitoring() {
    // Monitor Supabase connection status globally
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        logger.info('🌐 Network connection restored - checking Supabase connection');
        this.checkConnection();
      });

      window.addEventListener('offline', () => {
        logger.warn('🌐 Network connection lost - Supabase real-time will be affected');
        this.updateStatus({
          isConnected: false,
          lastError: 'Network offline'
        });
      });
    }
  }

  public async checkConnection(): Promise<boolean> {
    try {
      // Simple health check
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('id')
        .limit(1);

      if (error) {
        logger.error('❌ Supabase connection check failed:', error);
        this.updateStatus({
          isConnected: false,
          lastError: error.message
        });
        return false;
      }

      logger.info('✅ Supabase connection healthy');
      this.updateStatus({
        isConnected: true,
        lastConnected: new Date(),
        lastError: null
      });
      return true;
    } catch (error) {
      logger.error('❌ Connection check error:', error);
      this.updateStatus({
        isConnected: false,
        lastError: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void) {
    this.listeners.push(callback);
    // Immediately call with current status
    callback(this.status);
    
    // Return cleanup function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  public getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  public incrementRetryCount() {
    this.updateStatus({
      retryCount: this.status.retryCount + 1
    });
  }

  public resetRetryCount() {
    this.updateStatus({
      retryCount: 0
    });
  }

  public incrementSubscriptionCount() {
    this.updateStatus({
      subscriptionCount: this.status.subscriptionCount + 1
    });
  }

  public decrementSubscriptionCount() {
    this.updateStatus({
      subscriptionCount: Math.max(0, this.status.subscriptionCount - 1)
    });
  }

  private updateStatus(update: Partial<ConnectionStatus>) {
    this.status = { ...this.status, ...update };
    
    // Notify all listeners
    this.listeners.forEach(callback => {
      try {
        callback(this.status);
      } catch (error) {
        logger.error('Error in realtime monitor listener:', error);
      }
    });
  }

  public logDiagnostics() {
    logger.info('📊 Realtime Connection Diagnostics:', {
      status: this.status,
      navigator: {
        onLine: typeof navigator !== 'undefined' ? navigator.onLine : 'unknown',
        connection: typeof navigator !== 'undefined' && 'connection' in navigator 
          ? (navigator as any).connection?.effectiveType 
          : 'unknown'
      },
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const realtimeMonitor = new RealtimeMonitor();

// Utility functions
export const testRealtimeConnection = async (): Promise<void> => {
  logger.info('🔍 Testing real-time connection...');
  
  const isConnected = await realtimeMonitor.checkConnection();
  
  if (isConnected) {
    logger.info('✅ Real-time connection test passed');
  } else {
    logger.error('❌ Real-time connection test failed');
  }
  
  realtimeMonitor.logDiagnostics();
};

// Debug helper - expose to window in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).realtimeMonitor = realtimeMonitor;
  (window as any).testRealtimeConnection = testRealtimeConnection;
}
