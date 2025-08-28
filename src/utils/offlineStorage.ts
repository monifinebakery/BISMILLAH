// Offline storage utilities for managing localStorage data
// Provides structured data management for offline functionality

interface OfflineStorageOptions {
  encrypt?: boolean;
  compress?: boolean;
  ttl?: number; // Time to live in milliseconds
}

interface StoredItem<T = any> {
  data: T;
  timestamp: number;
  ttl?: number;
  version: string;
}

class OfflineStorageManager {
  private readonly APP_PREFIX = 'hpp_offline_';
  private readonly VERSION = '1.0.0';

  /**
   * Store data with optional TTL and metadata
   */
  set<T>(key: string, data: T, options: OfflineStorageOptions = {}): boolean {
    try {
      const storageKey = this.getStorageKey(key);
      const item: StoredItem<T> = {
        data,
        timestamp: Date.now(),
        version: this.VERSION,
        ...(options.ttl && { ttl: options.ttl })
      };

      localStorage.setItem(storageKey, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error(`[OfflineStorage] Failed to set ${key}:`, error);
      return false;
    }
  }

  /**
   * Get data with automatic TTL checking
   */
  get<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const storageKey = this.getStorageKey(key);
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) return defaultValue;

      const item: StoredItem<T> = JSON.parse(stored);
      
      // Check TTL if set
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        this.remove(key);
        return defaultValue;
      }

      // Check version compatibility
      if (item.version !== this.VERSION) {
        console.warn(`[OfflineStorage] Version mismatch for ${key}, clearing data`);
        this.remove(key);
        return defaultValue;
      }

      return item.data;
    } catch (error) {
      console.error(`[OfflineStorage] Failed to get ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Remove item from storage
   */
  remove(key: string): boolean {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error(`[OfflineStorage] Failed to remove ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Get all keys with our prefix
   */
  getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.APP_PREFIX)) {
        keys.push(key.replace(this.APP_PREFIX, ''));
      }
    }
    return keys;
  }

  /**
   * Clear all app data
   */
  clear(): boolean {
    try {
      const keys = this.getAllKeys();
      keys.forEach(key => this.remove(key));
      return true;
    } catch (error) {
      console.error('[OfflineStorage] Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Get storage usage stats
   */
  getStats(): { totalKeys: number; totalSize: number; items: Array<{key: string; size: number; age: number}> } {
    const keys = this.getAllKeys();
    let totalSize = 0;
    const items: Array<{key: string; size: number; age: number}> = [];

    keys.forEach(key => {
      try {
        const storageKey = this.getStorageKey(key);
        const value = localStorage.getItem(storageKey) || '';
        const size = new Blob([value]).size;
        totalSize += size;

        const item = this.get(key);
        const age = item ? Date.now() - (item as any).timestamp : 0;
        
        items.push({ key, size, age });
      } catch (error) {
        console.warn(`[OfflineStorage] Failed to get stats for ${key}:`, error);
      }
    });

    return {
      totalKeys: keys.length,
      totalSize,
      items: items.sort((a, b) => b.size - a.size) // Sort by size desc
    };
  }

  /**
   * Clean expired items
   */
  cleanExpired(): number {
    const keys = this.getAllKeys();
    let cleaned = 0;

    keys.forEach(key => {
      const item = this.get(key);
      if (item === null) { // get() returns null if expired
        cleaned++;
      }
    });

    return cleaned;
  }

  private getStorageKey(key: string): string {
    return `${this.APP_PREFIX}${key}`;
  }
}

// Specialized storage managers for different data types

interface CalculationEntry {
  id: string;
  type: 'hpp' | 'basic' | 'profit';
  inputs: Record<string, any>;
  result: number;
  formula: string;
  notes?: string;
  timestamp: number;
}

export class CalculatorHistoryStorage {
  private storage = new OfflineStorageManager();
  private readonly KEY = 'calculator_history';

  addCalculation(entry: Omit<CalculationEntry, 'id' | 'timestamp'>): boolean {
    const history = this.getHistory();
    const newEntry: CalculationEntry = {
      ...entry,
      id: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    history.unshift(newEntry);
    
    // Keep only last 100 calculations
    const trimmed = history.slice(0, 100);
    return this.storage.set(this.KEY, trimmed);
  }

  getHistory(): CalculationEntry[] {
    return this.storage.get(this.KEY, []);
  }

  getById(id: string): CalculationEntry | null {
    const history = this.getHistory();
    return history.find(entry => entry.id === id) || null;
  }

  removeById(id: string): boolean {
    const history = this.getHistory();
    const filtered = history.filter(entry => entry.id !== id);
    return this.storage.set(this.KEY, filtered);
  }

  clear(): boolean {
    return this.storage.remove(this.KEY);
  }

  export(): string {
    const history = this.getHistory();
    return JSON.stringify(history, null, 2);
  }
}

interface DraftOrder {
  id: string;
  customerName?: string;
  items: Array<{
    productName: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  totalAmount: number;
  notes?: string;
  status: 'draft' | 'pending_sync' | 'synced';
  created: number;
  modified: number;
}

export class DraftOrderStorage {
  private storage = new OfflineStorageManager();
  private readonly KEY = 'draft_orders';

  saveDraft(draft: Omit<DraftOrder, 'id' | 'created' | 'modified'>): string {
    const drafts = this.getDrafts();
    const id = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newDraft: DraftOrder = {
      ...draft,
      id,
      created: Date.now(),
      modified: Date.now()
    };

    drafts.push(newDraft);
    this.storage.set(this.KEY, drafts);
    return id;
  }

  updateDraft(id: string, updates: Partial<DraftOrder>): boolean {
    const drafts = this.getDrafts();
    const index = drafts.findIndex(draft => draft.id === id);
    
    if (index === -1) return false;

    drafts[index] = {
      ...drafts[index],
      ...updates,
      modified: Date.now()
    };

    return this.storage.set(this.KEY, drafts);
  }

  getDrafts(): DraftOrder[] {
    return this.storage.get(this.KEY, []);
  }

  getDraftById(id: string): DraftOrder | null {
    const drafts = this.getDrafts();
    return drafts.find(draft => draft.id === id) || null;
  }

  removeDraft(id: string): boolean {
    const drafts = this.getDrafts();
    const filtered = drafts.filter(draft => draft.id !== id);
    return this.storage.set(this.KEY, filtered);
  }

  getPendingSyncDrafts(): DraftOrder[] {
    return this.getDrafts().filter(draft => draft.status === 'pending_sync');
  }
}

export class CachedDataStorage {
  private storage = new OfflineStorageManager();

  cacheWarehouseData(data: any[]): boolean {
    return this.storage.set('warehouse_cache', data, { ttl: 24 * 60 * 60 * 1000 }); // 24 hours
  }

  getCachedWarehouseData(): any[] {
    return this.storage.get('warehouse_cache', []);
  }

  cacheOrdersData(data: any[]): boolean {
    return this.storage.set('orders_cache', data, { ttl: 12 * 60 * 60 * 1000 }); // 12 hours
  }

  getCachedOrdersData(): any[] {
    return this.storage.get('orders_cache', []);
  }

  cacheRecipesData(data: any[]): boolean {
    return this.storage.set('recipes_cache', data, { ttl: 48 * 60 * 60 * 1000 }); // 48 hours
  }

  getCachedRecipesData(): any[] {
    return this.storage.get('recipes_cache', []);
  }

  getLastCacheTime(type: 'warehouse' | 'orders' | 'recipes'): number | null {
    const key = `${type}_cache`;
    const storageKey = `hpp_offline_${key}`;
    const stored = localStorage.getItem(storageKey);
    
    if (!stored) return null;
    
    try {
      const item = JSON.parse(stored);
      return item.timestamp;
    } catch {
      return null;
    }
  }
}

interface SyncOperation {
  id: string;
  type: 'create_order' | 'update_warehouse' | 'create_recipe' | 'update_supplier';
  data: any;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  priority: 'high' | 'normal' | 'low';
  attempts: number;
  maxAttempts: number;
  created: number;
  lastAttempt?: number;
  error?: string;
}

export class SyncQueueStorage {
  private storage = new OfflineStorageManager();
  private readonly KEY = 'sync_queue';

  addOperation(operation: Omit<SyncOperation, 'id' | 'attempts' | 'created'>): string {
    const queue = this.getQueue();
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newOperation: SyncOperation = {
      ...operation,
      id,
      attempts: 0,
      created: Date.now()
    };

    queue.push(newOperation);
    // Sort by priority: high -> normal -> low
    queue.sort((a, b) => {
      const priority = { high: 3, normal: 2, low: 1 };
      return priority[b.priority] - priority[a.priority];
    });

    this.storage.set(this.KEY, queue);
    return id;
  }

  getQueue(): SyncOperation[] {
    return this.storage.get(this.KEY, []);
  }

  updateOperation(id: string, updates: Partial<SyncOperation>): boolean {
    const queue = this.getQueue();
    const index = queue.findIndex(op => op.id === id);
    
    if (index === -1) return false;

    queue[index] = { ...queue[index], ...updates };
    return this.storage.set(this.KEY, queue);
  }

  removeOperation(id: string): boolean {
    const queue = this.getQueue();
    const filtered = queue.filter(op => op.id !== id);
    return this.storage.set(this.KEY, filtered);
  }

  getPendingOperations(): SyncOperation[] {
    return this.getQueue().filter(op => op.attempts < op.maxAttempts);
  }

  getFailedOperations(): SyncOperation[] {
    return this.getQueue().filter(op => op.attempts >= op.maxAttempts);
  }

  clearCompleted(): number {
    const queue = this.getQueue();
    const pending = this.getPendingOperations();
    const failed = this.getFailedOperations();
    const remaining = [...pending, ...failed];
    
    this.storage.set(this.KEY, remaining);
    return queue.length - remaining.length;
  }
}

// Export singleton instances
export const offlineStorage = new OfflineStorageManager();
export const calculatorHistory = new CalculatorHistoryStorage();
export const draftOrderStorage = new DraftOrderStorage();
export const cachedDataStorage = new CachedDataStorage();
export const syncQueueStorage = new SyncQueueStorage();

// Export types for use in components
export type { CalculatorHistoryStorage, DraftOrderStorage, CachedDataStorage, SyncQueueStorage };
