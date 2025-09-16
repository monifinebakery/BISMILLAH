// ULTRA PERFORMANCE: Performance optimization utilities

// PERFORMANCE: Debounce untuk mencegah excessive calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

// PERFORMANCE: Throttle untuk rate limiting
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// PERFORMANCE: Memoization dengan TTL
export function memoizeWithTTL<T extends (...args: any[]) => any>(
  func: T,
  ttl: number = 5000
): T {
  const cache = new Map<string, { value: ReturnType<T>; timestamp: number }>();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    const now = Date.now();
    const cached = cache.get(key);
    
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.value;
    }
    
    const result = func(...args);
    cache.set(key, { value: result, timestamp: now });
    
    // Cleanup expired entries
    if (cache.size > 100) {
      for (const [k, v] of cache.entries()) {
        if ((now - v.timestamp) >= ttl) {
          cache.delete(k);
        }
      }
    }
    
    return result;
  }) as T;
}

// PERFORMANCE: Batch processor untuk bulk operations
export class BatchProcessor<T> {
  private queue: T[] = [];
  private processing = false;
  private batchSize: number;
  private delay: number;
  private processor: (batch: T[]) => Promise<void>;
  
  constructor(
    processor: (batch: T[]) => Promise<void>,
    batchSize: number = 10,
    delay: number = 100
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.delay = delay;
  }
  
  add(item: T): void {
    this.queue.push(item);
    this.scheduleProcess();
  }
  
  addBatch(items: T[]): void {
    this.queue.push(...items);
    this.scheduleProcess();
  }
  
  private scheduleProcess(): void {
    if (this.processing) return;
    
    setTimeout(() => this.process(), this.delay);
  }
  
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.batchSize);
        await this.processor(batch);
        
        // Small delay between batches
        if (this.queue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    } finally {
      this.processing = false;
    }
  }
  
  flush(): Promise<void> {
    return this.process();
  }
  
  clear(): void {
    this.queue = [];
  }
  
  get queueSize(): number {
    return this.queue.length;
  }
}


// PERFORMANCE: Image lazy loading observer
export function createImageLazyLoader() {
  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    },
    {
      rootMargin: '50px 0px',
      threshold: 0.01
    }
  );
  
  return {
    observe: (img: HTMLImageElement) => imageObserver.observe(img),
    unobserve: (img: HTMLImageElement) => imageObserver.unobserve(img),
    disconnect: () => imageObserver.disconnect()
  };
}

// PERFORMANCE: Memory usage monitor
export function createMemoryMonitor() {
  const checkMemory = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
        usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) // %
      };
    }
    return null;
  };
  
  return {
    check: checkMemory,
    monitor: (interval: number = 5000) => {
      const intervalId = setInterval(() => {
        const memory = checkMemory();
        if (memory && memory.usage > 80) {
          console.warn('High memory usage detected:', memory);
        }
      }, interval);
      
      return () => clearInterval(intervalId);
    }
  };
}

export default {
  debounce,
  throttle,
  memoizeWithTTL,
  BatchProcessor,
  createImageLazyLoader,
  createMemoryMonitor
};
