// src/utils/memoryOptimizer.ts
import React from 'react';
import { logger } from '@/utils/logger';

interface MemoryOptimizerOptions {
  enabled?: boolean;
  autoCleanupInterval?: number; // in milliseconds
  memoryThreshold?: number; // percentage (0-100)
  maxCacheSize?: number; // number of items
  maxCacheAge?: number; // in milliseconds
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size?: number; // estimated size in bytes
}

class MemoryOptimizer {
  private cache: Map<string, CacheItem<any>> = new Map();
  private options: Required<MemoryOptimizerOptions>;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private observers: Set<() => void> = new Set();

  constructor(options: MemoryOptimizerOptions = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      autoCleanupInterval: options.autoCleanupInterval ?? 300000, // 5 minutes
      memoryThreshold: options.memoryThreshold ?? 80,
      maxCacheSize: options.maxCacheSize ?? 1000,
      maxCacheAge: options.maxCacheAge ?? 1800000 // 30 minutes
    };

    if (this.options.enabled) {
      this.startAutoCleanup();
    }
  }

  // Cache management
  set<T>(key: string, data: T, estimatedSize?: number): void {
    if (!this.options.enabled) return;

    const now = Date.now();
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      size: estimatedSize || this.estimateSize(data)
    };

    this.cache.set(key, item);
    this.enforceMaxCacheSize();
    this.notifyObservers();

    logger.debug(`Cache set: ${key}`, {
      size: item.size,
      totalItems: this.cache.size
    });
  }

  get<T>(key: string): T | null {
    if (!this.options.enabled) return null;

    const item = this.cache.get(key) as CacheItem<T> | undefined;
    if (!item) return null;

    // Check if item is expired
    const now = Date.now();
    if (now - item.timestamp > this.options.maxCacheAge) {
      this.cache.delete(key);
      this.notifyObservers();
      return null;
    }

    // Update access statistics
    item.accessCount++;
    item.lastAccessed = now;

    return item.data;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.notifyObservers();
      logger.debug(`Cache deleted: ${key}`);
    }
    return deleted;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.notifyObservers();
    logger.info(`Cache cleared: ${size} items removed`);
  }

  // Memory optimization methods
  private estimateSize(data: any): number {
    try {
      const jsonString = JSON.stringify(data);
      return new Blob([jsonString]).size;
    } catch {
      // Fallback estimation
      if (typeof data === 'string') return data.length * 2;
      if (typeof data === 'number') return 8;
      if (typeof data === 'boolean') return 4;
      if (Array.isArray(data)) return data.length * 50; // rough estimate
      if (typeof data === 'object') return Object.keys(data).length * 100; // rough estimate
      return 100; // default estimate
    }
  }

  private enforceMaxCacheSize(): void {
    if (this.cache.size <= this.options.maxCacheSize) return;

    // Remove least recently used items
    const items = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    const itemsToRemove = items.slice(0, this.cache.size - this.options.maxCacheSize);
    
    itemsToRemove.forEach(([key]) => {
      this.cache.delete(key);
    });

    if (itemsToRemove.length > 0) {
      logger.info(`Cache size enforced: removed ${itemsToRemove.length} items`);
      this.notifyObservers();
    }
  }

  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.options.autoCleanupInterval);
  }

  private performCleanup(): void {
    const now = Date.now();
    const initialSize = this.cache.size;
    let removedCount = 0;

    // Remove expired items
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.options.maxCacheAge) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    // Check memory usage and perform aggressive cleanup if needed
    const memoryUsage = this.getCurrentMemoryUsage();
    if (memoryUsage && memoryUsage > this.options.memoryThreshold) {
      this.performAggressiveCleanup();
    }

    if (removedCount > 0) {
      logger.info(`Auto cleanup completed: removed ${removedCount} expired items`);
      this.notifyObservers();
    }

    // Force garbage collection if available
    this.requestGarbageCollection();
  }

  private performAggressiveCleanup(): void {
    const items = Array.from(this.cache.entries());
    const targetSize = Math.floor(this.options.maxCacheSize * 0.7); // Remove 30% of items
    
    // Sort by access frequency and age (least used and oldest first)
    items.sort(([, a], [, b]) => {
      const scoreA = a.accessCount / (Date.now() - a.timestamp);
      const scoreB = b.accessCount / (Date.now() - b.timestamp);
      return scoreA - scoreB;
    });

    const itemsToRemove = items.slice(0, items.length - targetSize);
    
    itemsToRemove.forEach(([key]) => {
      this.cache.delete(key);
    });

    if (itemsToRemove.length > 0) {
      logger.warn(`Aggressive cleanup: removed ${itemsToRemove.length} items due to high memory usage`);
      this.notifyObservers();
    }
  }

  private getCurrentMemoryUsage(): number | null {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      const memory = (window.performance as any).memory;
      return (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    }
    return null;
  }

  private requestGarbageCollection(): void {
    if (typeof window !== 'undefined' && 'gc' in window) {
      try {
        (window as any).gc();
        logger.debug('Garbage collection requested');
      } catch (error) {
        // GC not available, ignore
      }
    }
  }

  // Observer pattern for cache changes
  addObserver(callback: () => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(): void {
    this.observers.forEach(callback => {
      try {
        callback();
      } catch (error) {
        logger.error('Error in cache observer:', error);
      }
    });
  }

  // Statistics and monitoring
  getStatistics() {
    const items = Array.from(this.cache.values());
    const totalSize = items.reduce((sum, item) => sum + (item.size || 0), 0);
    const now = Date.now();
    
    return {
      totalItems: this.cache.size,
      totalSize,
      averageSize: items.length > 0 ? totalSize / items.length : 0,
      oldestItem: items.length > 0 ? Math.min(...items.map(item => item.timestamp)) : null,
      newestItem: items.length > 0 ? Math.max(...items.map(item => item.timestamp)) : null,
      averageAge: items.length > 0 ? items.reduce((sum, item) => sum + (now - item.timestamp), 0) / items.length : 0,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.getCurrentMemoryUsage()
    };
  }

  private calculateHitRate(): number {
    // This would need to be implemented with hit/miss tracking
    // For now, return a placeholder
    return 0;
  }

  // Configuration methods
  setEnabled(enabled: boolean): void {
    this.options.enabled = enabled;
    if (enabled) {
      this.startAutoCleanup();
    } else {
      this.stop();
    }
  }

  updateOptions(options: Partial<MemoryOptimizerOptions>): void {
    this.options = { ...this.options, ...options };
    if (this.options.enabled) {
      this.startAutoCleanup();
    }
  }

  stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    logger.info('Memory optimizer stopped');
  }

  // Utility methods for external use
  optimizeNow(): void {
    this.performCleanup();
  }

  getMemoryPressure(): 'low' | 'medium' | 'high' | 'critical' {
    const usage = this.getCurrentMemoryUsage();
    if (!usage) return 'low';
    
    if (usage > 90) return 'critical';
    if (usage > 80) return 'high';
    if (usage > 60) return 'medium';
    return 'low';
  }
}

// Global instance
const memoryOptimizer = new MemoryOptimizer();

// React hook for memory optimization
export const useMemoryOptimization = (options?: MemoryOptimizerOptions) => {
  React.useEffect(() => {
    if (options) {
      memoryOptimizer.updateOptions(options);
    }
  }, [options]);

  return {
    cache: {
      set: memoryOptimizer.set.bind(memoryOptimizer),
      get: memoryOptimizer.get.bind(memoryOptimizer),
      delete: memoryOptimizer.delete.bind(memoryOptimizer),
      clear: memoryOptimizer.clear.bind(memoryOptimizer)
    },
    optimize: memoryOptimizer.optimizeNow.bind(memoryOptimizer),
    getStatistics: memoryOptimizer.getStatistics.bind(memoryOptimizer),
    getMemoryPressure: memoryOptimizer.getMemoryPressure.bind(memoryOptimizer)
  };
};

// Export the optimizer instance and types
export { memoryOptimizer };
export type { MemoryOptimizerOptions, CacheItem };

// Utility functions
export const optimizeMemoryNow = () => memoryOptimizer.optimizeNow();
export const getMemoryStatistics = () => memoryOptimizer.getStatistics();
export const getMemoryPressure = () => memoryOptimizer.getMemoryPressure();
export const clearMemoryCache = () => memoryOptimizer.clear();