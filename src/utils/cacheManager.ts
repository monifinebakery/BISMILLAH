// ULTRA PERFORMANCE: Advanced caching strategy untuk aplikasi

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

// PERFORMANCE: Advanced in-memory cache dengan LRU eviction
export class AdvancedCacheManager<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private maxSize: number;
  private defaultTTL: number;
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, hitRate: 0 };
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize: number = 1000, defaultTTL: number = 300000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Cleanup expired items every 2 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 120000);
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: now
    };

    // LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, item);
    this.updateStats();
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    const now = Date.now();

    if (!item) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if expired
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access info
    item.accessCount++;
    item.lastAccessed = now;
    this.stats.hits++;
    this.updateHitRate();

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.updateStats();
    return result;
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, size: 0, hitRate: 0 };
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    this.updateStats();
  }

  private updateStats(): void {
    this.stats.size = this.cache.size;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// PERFORMANCE: Specialized cache untuk React Query
export class QueryCacheManager {
  private cache = new AdvancedCacheManager();
  private pendingQueries = new Map<string, Promise<any>>();

  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    // Check if query is already pending
    const pending = this.pendingQueries.get(key);
    if (pending) {
      return pending;
    }

    // Execute query
    const queryPromise = fetcher()
      .then(result => {
        this.cache.set(key, result, ttl);
        this.pendingQueries.delete(key);
        return result;
      })
      .catch(error => {
        this.pendingQueries.delete(key);
        throw error;
      });

    this.pendingQueries.set(key, queryPromise);
    return queryPromise;
  }

  invalidate(pattern: string | RegExp): void {
    const keys = Array.from(this.cache['cache'].keys());
    
    keys.forEach(key => {
      if (typeof pattern === 'string') {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      } else {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
    });
  }

  getStats() {
    return this.cache.getStats();
  }
}

// PERFORMANCE: Browser storage cache dengan compression
export class PersistentCacheManager {
  private prefix: string;
  private maxSize: number;

  constructor(prefix: string = 'app_cache_', maxSize: number = 50) {
    this.prefix = prefix;
    this.maxSize = maxSize;
  }

  set(key: string, data: any, ttl: number = 3600000): void { // 1 hour default
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl
      };
      
      const compressed = this.compress(JSON.stringify(item));
      localStorage.setItem(this.prefix + key, compressed);
      
      this.cleanup();
    } catch (error) {
      console.warn('Failed to cache item:', error);
    }
  }

  get(key: string): any | null {
    try {
      const compressed = localStorage.getItem(this.prefix + key);
      if (!compressed) return null;
      
      const decompressed = this.decompress(compressed);
      const item = JSON.parse(decompressed);
      
      const now = Date.now();
      if (now - item.timestamp > item.ttl) {
        this.delete(key);
        return null;
      }
      
      return item.data;
    } catch (error) {
      console.warn('Failed to retrieve cached item:', error);
      return null;
    }
  }

  delete(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  private cleanup(): void {
    const keys = Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => ({
        key,
        timestamp: this.getTimestamp(key)
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest items if exceeding max size
    while (keys.length > this.maxSize) {
      const oldest = keys.shift();
      if (oldest) {
        localStorage.removeItem(oldest.key);
      }
    }
  }

  private getTimestamp(key: string): number {
    try {
      const compressed = localStorage.getItem(key);
      if (!compressed) return 0;
      
      const decompressed = this.decompress(compressed);
      const item = JSON.parse(decompressed);
      return item.timestamp || 0;
    } catch {
      return 0;
    }
  }

  private compress(str: string): string {
    // Simple compression using btoa (base64)
    return btoa(encodeURIComponent(str));
  }

  private decompress(str: string): string {
    return decodeURIComponent(atob(str));
  }
}

// PERFORMANCE: Global cache instances
export const memoryCache = new AdvancedCacheManager(2000, 600000); // 10 minutes
export const queryCache = new QueryCacheManager();
export const persistentCache = new PersistentCacheManager('bismillah_', 100);

// PERFORMANCE: Cache utilities
export const cacheUtils = {
  // Generate cache key from object
  generateKey: (prefix: string, params: Record<string, any>): string => {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);
    
    return `${prefix}:${JSON.stringify(sortedParams)}`;
  },
  
  // Cache decorator for functions
  cached: <T extends (...args: any[]) => any>(
    fn: T,
    keyGenerator: (...args: Parameters<T>) => string,
    ttl?: number
  ): T => {
    return ((...args: Parameters<T>) => {
      const key = keyGenerator(...args);
      const cached = memoryCache.get(key);
      
      if (cached !== null) {
        return cached;
      }
      
      const result = fn(...args);
      memoryCache.set(key, result, ttl);
      return result;
    }) as T;
  }
};

export default {
  AdvancedCacheManager,
  QueryCacheManager,
  PersistentCacheManager,
  memoryCache,
  queryCache,
  persistentCache,
  cacheUtils
};