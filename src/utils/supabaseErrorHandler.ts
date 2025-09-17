// src/utils/supabaseErrorHandler.ts
// Enhanced error handling for Supabase issues

import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export interface SupabaseError {
  message: string;
  code?: string | number;
  details?: string;
  hint?: string;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  exponential?: boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export class SupabaseErrorHandler {
  /**
   * Check if an error is retriable (503, 429, network issues)
   */
  static isRetriableError(error: any): boolean {
    if (!error) return false;
    
    // HTTP Status codes that should be retried
    const retriableCodes = [429, 502, 503, 504];
    
    // Check status code
    if (error.status && retriableCodes.includes(error.status)) return true;
    if (error.code && retriableCodes.includes(error.code)) return true;
    
    // Check error message
    const message = error.message?.toLowerCase() || '';
    if (message.includes('503') || 
        message.includes('service unavailable') ||
        message.includes('temporarily unavailable') ||
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('connection')) {
      return true;
    }
    
    return false;
  }

  /**
   * Enhanced retry wrapper for Supabase operations
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      exponential = true,
      onRetry
    } = options;

    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // If not retriable or last attempt, throw immediately
        if (!this.isRetriableError(error) || attempt === maxRetries) {
          throw error;
        }

        // Calculate delay
        const delay = exponential 
          ? Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay)
          : Math.min(baseDelay * attempt, maxDelay);
        
        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 200;

        logger.warn(`🔄 Retrying Supabase operation (${attempt}/${maxRetries}) in ${Math.round(jitteredDelay)}ms`, {
          error: error.message,
          attempt,
          delay: jitteredDelay
        });

        onRetry?.(attempt, error);
        await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      }
    }

    throw lastError;
  }

  /**
   * Show appropriate user-friendly error message
   */
  static handleError(error: any, context?: string): void {
    if (!error) return;

    logger.error('Supabase error:', { error, context });

    if (this.isRetriableError(error)) {
      toast.error('Koneksi database bermasalah', {
        description: 'Sedang mencoba menghubungkan kembali. Mohon tunggu sebentar...'
      });
      return;
    }

    // Handle specific error types
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('auth') || message.includes('unauthorized') || error.code === 401) {
      toast.error('Sesi telah berakhir', {
        description: 'Silakan login ulang untuk melanjutkan.'
      });
      return;
    }

    if (message.includes('permission') || message.includes('forbidden') || error.code === 403) {
      toast.error('Akses ditolak', {
        description: 'Anda tidak memiliki permission untuk melakukan operasi ini.'
      });
      return;
    }

    if (message.includes('not found') || error.code === 404) {
      toast.error('Data tidak ditemukan', {
        description: 'Item yang Anda cari mungkin sudah dihapus atau tidak tersedia.'
      });
      return;
    }

    if (message.includes('duplicate') || message.includes('unique')) {
      toast.error('Data sudah ada', {
        description: 'Data dengan informasi tersebut sudah tersimpan di sistem.'
      });
      return;
    }

    // Generic error message
    const contextStr = context ? ` (${context})` : '';
    toast.error(`Terjadi kesalahan${contextStr}`, {
      description: error.message || 'Mohon coba lagi atau hubungi admin jika masalah berlanjut.'
    });
  }

  /**
   * Create a wrapper for Supabase query with automatic error handling and retry
   */
  static wrapQuery<T>(query: () => Promise<{ data: T | null; error: any }>, context?: string) {
    return this.withRetry(async () => {
      const { data, error } = await query();
      
      if (error) {
        this.handleError(error, context);
        throw error;
      }
      
      return data;
    });
  }
}

/**
 * Utility function to monitor Supabase health
 */
export class SupabaseMonitor {
  private static errorCounts = new Map<string, number>();
  private static lastResetTime = Date.now();
  private static readonly RESET_INTERVAL = 5 * 60 * 1000; // 5 minutes

  static recordError(error: any, context?: string): void {
    const now = Date.now();
    
    // Reset counters every 5 minutes
    if (now - this.lastResetTime > this.RESET_INTERVAL) {
      this.errorCounts.clear();
      this.lastResetTime = now;
    }

    const errorType = this.getErrorType(error);
    const current = this.errorCounts.get(errorType) || 0;
    this.errorCounts.set(errorType, current + 1);

    // Alert if too many errors of same type
    if (current >= 5) {
      logger.error(`🚨 High error rate detected for ${errorType}:`, {
        count: current + 1,
        context,
        error: error.message
      });

      if (errorType === '503' && current === 5) {
        toast.error('Masalah koneksi database terdeteksi', {
          description: 'Tim teknis telah diberitahu. Mohon coba lagi dalam beberapa menit.'
        });
      }
    }
  }

  private static getErrorType(error: any): string {
    if (error.status) return error.status.toString();
    if (error.code) return error.code.toString();
    if (error.message?.includes('503')) return '503';
    if (error.message?.includes('network')) return 'network';
    if (error.message?.includes('timeout')) return 'timeout';
    return 'unknown';
  }

  static getStats() {
    return {
      errorCounts: Object.fromEntries(this.errorCounts),
      lastResetTime: this.lastResetTime
    };
  }
}

// Convenience exports
export const withRetry = SupabaseErrorHandler.withRetry.bind(SupabaseErrorHandler);
export const handleSupabaseError = SupabaseErrorHandler.handleError.bind(SupabaseErrorHandler);
export const wrapQuery = SupabaseErrorHandler.wrapQuery.bind(SupabaseErrorHandler);
export const recordError = SupabaseMonitor.recordError.bind(SupabaseMonitor);