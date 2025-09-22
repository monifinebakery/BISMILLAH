// src/utils/offlineQueue.ts
import { networkErrorHandler } from './networkErrorHandling';
import { safeStorageGetJSON, safeStorageSetJSON } from '@/utils/auth/safeStorage';

export interface QueuedOperation {
  id: string;
  type: 'bulk_delete_orders' | 'bulk_update_status' | 'create_order' | 'update_order' | 'delete_order';
  userId: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineQueue {
  private static instance: OfflineQueue;
  private queue: QueuedOperation[] = [];
  private readonly STORAGE_KEY = 'offline_operations_queue';
  private readonly MAX_RETRIES = 3;
  private isProcessing = false;
  private onlineListener: (() => void) | null = null;
  private isDestroyed = false;

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance || OfflineQueue.instance.isDestroyed) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  constructor() {
    this.loadFromStorage();
    this.setupNetworkListener();
  }

  private setupNetworkListener() {
    // Remove existing listener if any
    this.removeNetworkListener();

    // Add new listener
    this.onlineListener = () => {
      if (!this.isDestroyed) {
        setTimeout(() => this.processQueue(), 1000);
      }
    };

    window.addEventListener('online', this.onlineListener);
  }

  private removeNetworkListener() {
    if (this.onlineListener) {
      window.removeEventListener('online', this.onlineListener);
      this.onlineListener = null;
    }
  }

  /**
   * Cleanup resources - call this when app is shutting down
   */
  destroy() {
    this.isDestroyed = true;
    this.removeNetworkListener();
    this.queue = [];
    // Note: We don't clear localStorage on destroy to preserve offline operations
  }

  /**
   * Add operation to offline queue
   */
  queueOperation(type: QueuedOperation['type'], userId: string, data: any): string {
    const operation: QueuedOperation = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type,
      userId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES
    };

    this.queue.push(operation);
    this.saveToStorage();

    console.log(`[OfflineQueue] Queued operation: ${type}`, operation);
    return operation.id;
  }

  /**
   * Remove operation from queue
   */
  removeOperation(operationId: string): void {
    this.queue = this.queue.filter(op => op.id !== operationId);
    // Don't await here - make it fire-and-forget for better performance
    this.saveToStorage().catch(error => {
      console.error('[OfflineQueue] Failed to save after remove operation:', error);
    });
  }

  /**
   * Process queued operations when online with improved error handling
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine || this.queue.length === 0 || this.isDestroyed) {
      return;
    }

    this.isProcessing = true;
    console.log(`[OfflineQueue] Processing ${this.queue.length} queued operations...`);

    const operationsToProcess = [...this.queue];
    let processedCount = 0;
    let failedCount = 0;

    try {
      // Process operations one by one to avoid overwhelming the server
      for (const operation of operationsToProcess) {
        if (this.isDestroyed) break; // Stop if instance is destroyed

        try {
          await this.executeOperation(operation);
          this.removeOperation(operation.id);
          processedCount++;
          
          // Small delay between operations to be gentle on the server
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`[OfflineQueue] Failed to process operation ${operation.id}:`, error);
          operation.retryCount++;

          if (operation.retryCount >= operation.maxRetries) {
            console.error(`[OfflineQueue] Max retries reached for ${operation.type}, removing from queue`);
            this.removeOperation(operation.id);

            // Notify user about permanently failed operation
            const { networkErrorHandler } = await import('./networkErrorHandling');
            networkErrorHandler.handleNetworkError(
              error,
              `Sinkronisasi ${operation.type.replace(/_/g, ' ')} (max retries reached)`,
              undefined // No retry for max retries reached
            );
          }
          failedCount++;
        }
      }
    } finally {
      this.isProcessing = false;
      
      const statusMessage = `Sync selesai: ${processedCount} berhasil, ${failedCount} gagal`;
      if (processedCount > 0) {
        console.log(`[OfflineQueue] ${statusMessage}`);
        // Optional: Show success toast for bulk sync
        if (processedCount > 1) {
          const { toast } = await import('sonner');
          toast.success(statusMessage);
        }
      }
      
      if (this.queue.length > 0 && navigator.onLine && !this.isDestroyed) {
        // If there are still operations and we're still online, try again in 30 seconds
        setTimeout(() => this.processQueue(), 30000);
      }
    }
  }

  /**
   * Execute a queued operation
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    switch (operation.type) {
      case 'bulk_delete_orders':
        const { bulkDeleteOrders } = await import('@/components/orders/services/orderService');
        await bulkDeleteOrders(operation.userId, operation.data.ids);
        break;

      case 'bulk_update_status':
        const { bulkUpdateStatus } = await import('@/components/orders/services/orderService');
        await bulkUpdateStatus(operation.userId, operation.data.ids, operation.data.newStatus);
        break;

      case 'create_order':
        const { addOrder } = await import('@/components/orders/services/orderService');
        await addOrder(operation.userId, operation.data.order);
        break;

      case 'update_order':
        const { updateOrder } = await import('@/components/orders/services/orderService');
        await updateOrder(operation.userId, operation.data.id, operation.data.updates);
        break;

      case 'delete_order':
        const { deleteOrder } = await import('@/components/orders/services/orderService');
        await deleteOrder(operation.userId, operation.data.id);
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Save queue to safeStorage with error handling
   */
  private async saveToStorage(): Promise<void> {
    try {
      const serialized = JSON.stringify(this.queue);
      // Check if data is too large for localStorage (typically ~5MB limit)
      if (serialized.length > 4 * 1024 * 1024) { // 4MB limit to be safe
        console.warn('[OfflineQueue] Queue too large for storage, keeping only recent operations');
        // Keep only the most recent 10 operations
        this.queue = this.queue.slice(-10);
      }
      
      const success = await safeStorageSetJSON(this.STORAGE_KEY, this.queue);
      if (!success) {
        console.error('[OfflineQueue] Failed to save queue via safeStorage');
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue to safeStorage:', error);
      // Try to clear some space and retry once
      try {
        this.queue = this.queue.slice(-5); // Keep last 5 operations
        await safeStorageSetJSON(this.STORAGE_KEY, this.queue);
      } catch (retryError) {
        console.error('[OfflineQueue] Storage completely unavailable:', retryError);
      }
    }
  }

  /**
   * Load queue from safeStorage with error handling
   */
  private loadFromStorage(): void {
    try {
      const loadedQueue = safeStorageGetJSON<QueuedOperation[]>(this.STORAGE_KEY);
      if (loadedQueue && Array.isArray(loadedQueue)) {
        // Validate and filter operations
        this.queue = loadedQueue.filter(op => 
          op && 
          typeof op.id === 'string' && 
          typeof op.type === 'string' &&
          typeof op.userId === 'string' &&
          op.timestamp && 
          typeof op.retryCount === 'number'
        );
        
        // Remove operations older than 7 days
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        this.queue = this.queue.filter(op => op.timestamp > sevenDaysAgo);
        
        console.log(`[OfflineQueue] Loaded ${this.queue.length} valid operations from safeStorage`);
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue from safeStorage:', error);
      this.queue = [];
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      totalOperations: this.queue.length,
      isProcessing: this.isProcessing,
      isOnline: navigator.onLine,
      operations: this.queue.map(op => ({
        id: op.id,
        type: op.type,
        timestamp: op.timestamp,
        retryCount: op.retryCount
      }))
    };
  }

  /**
   * Clear all queued operations (for testing or reset)
   */
  clearQueue(): void {
    this.queue = [];
    this.saveToStorage();
    console.log('[OfflineQueue] Queue cleared');
  }
}

// Export singleton instance
export const offlineQueue = OfflineQueue.getInstance();
