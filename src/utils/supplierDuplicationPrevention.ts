// Utility untuk mencegah duplikasi supplier dan race conditions
// Menggunakan debounce dan caching untuk optimasi

import { logger } from './logger';

interface PendingSupplierCreation {
  promise: Promise<string | null>;
  timestamp: number;
}

class SupplierDuplicationPrevention {
  private pendingCreations = new Map<string, PendingSupplierCreation>();
  private readonly DEBOUNCE_TIME = 500; // 500ms
  private readonly CACHE_CLEANUP_INTERVAL = 30000; // 30 seconds

  constructor() {
    // Cleanup expired pending operations periodically
    setInterval(() => {
      this.cleanupExpiredOperations();
    }, this.CACHE_CLEANUP_INTERVAL);
  }

  /**
   * Get or create supplier with duplicate prevention
   * Uses debouncing to prevent race conditions when multiple components
   * try to create the same supplier simultaneously
   */
  public async getOrCreateSupplier(
    supplierName: string,
    createFunction: () => Promise<string | null>
  ): Promise<string | null> {
    const normalizedName = supplierName.trim().toLowerCase();
    
    if (!normalizedName) {
      logger.warn('SupplierDuplicationPrevention', 'Empty supplier name provided');
      return null;
    }

    // Check if there's already a pending creation for this supplier
    const existing = this.pendingCreations.get(normalizedName);
    if (existing) {
      const timeSinceCreation = Date.now() - existing.timestamp;
      
      if (timeSinceCreation < this.DEBOUNCE_TIME) {
        logger.info('SupplierDuplicationPrevention', 'Using existing pending creation for:', supplierName);
        return await existing.promise;
      } else {
        // Remove expired operation
        this.pendingCreations.delete(normalizedName);
      }
    }

    // Create new pending operation
    logger.info('SupplierDuplicationPrevention', 'Starting new supplier creation for:', supplierName);
    
    const creationPromise = this.executeWithCleanup(normalizedName, createFunction);
    
    this.pendingCreations.set(normalizedName, {
      promise: creationPromise,
      timestamp: Date.now()
    });

    return await creationPromise;
  }

  /**
   * Execute creation function and cleanup afterwards
   */
  private async executeWithCleanup(
    normalizedName: string,
    createFunction: () => Promise<string | null>
  ): Promise<string | null> {
    try {
      const result = await createFunction();
      
      // Cleanup successful operation
      this.pendingCreations.delete(normalizedName);
      
      return result;
    } catch (error) {
      // Cleanup failed operation
      this.pendingCreations.delete(normalizedName);
      
      logger.error('SupplierDuplicationPrevention', 'Error in creation function:', error);
      throw error;
    }
  }

  /**
   * Cleanup expired pending operations
   */
  private cleanupExpiredOperations() {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.pendingCreations.forEach((operation, key) => {
      if (now - operation.timestamp > this.DEBOUNCE_TIME * 2) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.pendingCreations.delete(key);
    });

    if (expiredKeys.length > 0) {
      logger.info('SupplierDuplicationPrevention', 'Cleaned up', expiredKeys.length, 'expired operations');
    }
  }

  /**
   * Get current pending operations (for debugging)
   */
  public getPendingOperations(): string[] {
    return Array.from(this.pendingCreations.keys());
  }

  /**
   * Clear all pending operations (for testing/reset)
   */
  public clearPendingOperations(): void {
    this.pendingCreations.clear();
    logger.info('SupplierDuplicationPrevention', 'All pending operations cleared');
  }
}

// Export singleton instance
export const supplierDuplicationPrevention = new SupplierDuplicationPrevention();

// Expose for debugging in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).supplierDuplicationPrevention = supplierDuplicationPrevention;
}
