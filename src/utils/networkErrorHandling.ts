// src/utils/networkErrorHandling.ts
import { toast } from 'sonner';

export interface NetworkError {
  message: string;
  code?: string;
  status?: number;
  isOffline?: boolean;
  retryable?: boolean;
}

export class NetworkErrorHandler {
  private static instance: NetworkErrorHandler;
  private retryQueue: Map<string, () => Promise<any>> = new Map();
  private isOnline = navigator.onLine;
  private onlineListener: (() => void) | null = null;
  private offlineListener: (() => void) | null = null;
  private isDestroyed = false;

  static getInstance(): NetworkErrorHandler {
    if (!NetworkErrorHandler.instance || NetworkErrorHandler.instance.isDestroyed) {
      NetworkErrorHandler.instance = new NetworkErrorHandler();
    }
    return NetworkErrorHandler.instance;
  }

  constructor() {
    this.setupNetworkListeners();
  }

  private setupNetworkListeners() {
    // Remove existing listeners
    this.removeNetworkListeners();

    // Add new listeners
    this.onlineListener = () => {
      if (!this.isDestroyed) {
        this.isOnline = true;
        this.processRetryQueue();
        toast.success('Koneksi internet kembali tersedia');
      }
    };

    this.offlineListener = () => {
      if (!this.isDestroyed) {
        this.isOnline = false;
        toast.warning('Koneksi internet terputus - aplikasi akan bekerja offline');
      }
    };

    window.addEventListener('online', this.onlineListener);
    window.addEventListener('offline', this.offlineListener);
  }

  private removeNetworkListeners() {
    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
      this.onlineListener = null;
    }
    if (this.offlineListener) {
      window.removeEventListener('offline', this.offlineListener);
      this.offlineListener = null;
    }
  }

  /**
   * Cleanup resources - call this when app is shutting down
   */
  destroy() {
    this.isDestroyed = true;
    this.removeNetworkListeners();
    this.retryQueue.clear();
  }

  /**
   * Handle network error with user-friendly messages and retry logic
   */
  handleNetworkError(error: any, operation: string, retryFn?: () => Promise<any>): NetworkError {
    const networkError: NetworkError = {
      message: 'Terjadi kesalahan jaringan',
      isOffline: !this.isOnline,
      retryable: false
    };

    // Detect error type
    if (!this.isOnline) {
      networkError.message = 'Tidak ada koneksi internet';
      networkError.isOffline = true;
    } else if (error?.name === 'NetworkError' || error?.code === 'NETWORK_ERROR') {
      networkError.message = 'Gagal terhubung ke server';
      networkError.retryable = true;
    } else if (error?.status === 408 || error?.code === 'TIMEOUT') {
      networkError.message = 'Permintaan timeout - server tidak merespons';
      networkError.retryable = true;
    } else if (error?.status === 429) {
      networkError.message = 'Terlalu banyak permintaan - coba lagi nanti';
      networkError.retryable = true;
    } else if (error?.status >= 500) {
      networkError.message = 'Server mengalami masalah - coba lagi nanti';
      networkError.retryable = true;
    } else if (error?.status === 403) {
      networkError.message = 'Akses ditolak - periksa izin Anda';
    } else if (error?.status === 404) {
      networkError.message = 'Data tidak ditemukan';
    }

    // Show user-friendly toast
    if (networkError.isOffline) {
      toast.warning(networkError.message, {
        description: 'Perubahan akan disimpan dan dikirim saat online kembali'
      });
    } else if (networkError.retryable && retryFn) {
      toast.error(networkError.message, {
        description: 'Klik untuk mencoba lagi',
        action: {
          label: 'Coba Lagi',
          onClick: () => this.retryOperation(operation, retryFn)
        }
      });
    } else {
      toast.error(networkError.message);
    }

    // Queue retryable operations for when connection returns
    if (networkError.retryable && retryFn && !this.isOnline) {
      this.queueRetryOperation(operation, retryFn);
    }

    return networkError;
  }

  /**
   * Retry a failed operation
   */
  private async retryOperation(operation: string, retryFn: () => Promise<any>) {
    try {
      toast.loading(`Mencoba lagi: ${operation}...`);
      const result = await retryFn();
      toast.success(`${operation} berhasil`);
      return result;
    } catch (error) {
      toast.error(`Gagal mencoba lagi: ${operation}`);
      throw error;
    }
  }

  /**
   * Queue operation for retry when connection returns
   */
  private queueRetryOperation(operation: string, retryFn: () => Promise<any>) {
    this.retryQueue.set(operation, retryFn);
  }

  /**
   * Process queued operations when connection returns
   */
  private async processRetryQueue() {
    if (this.retryQueue.size === 0) return;

    toast.info(`Sinkronisasi ${this.retryQueue.size} operasi yang tertunda...`);

    const operations = Array.from(this.retryQueue.entries());

    for (const [operation, retryFn] of operations) {
      try {
        await retryFn();
        this.retryQueue.delete(operation);
        toast.success(`${operation} berhasil disinkronkan`);
      } catch (error) {
        console.warn(`Failed to retry ${operation}:`, error);
      }
    }

    if (this.retryQueue.size > 0) {
      toast.warning(`${this.retryQueue.size} operasi masih gagal - akan dicoba lagi nanti`);
    }
  }

  /**
   * Check if currently online
   */
  isCurrentlyOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Get retry queue status
   */
  getRetryQueueStatus() {
    return {
      queuedOperations: this.retryQueue.size,
      isOnline: this.isOnline
    };
  }
}

// Export singleton instance
export const networkErrorHandler = NetworkErrorHandler.getInstance();

// React hook for network error handling
export function useNetworkErrorHandler() {
  return {
    handleError: networkErrorHandler.handleNetworkError.bind(networkErrorHandler),
    isOnline: networkErrorHandler.isCurrentlyOnline.bind(networkErrorHandler),
    getRetryStatus: networkErrorHandler.getRetryQueueStatus.bind(networkErrorHandler)
  };
}
