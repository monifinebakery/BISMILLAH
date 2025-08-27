// src/config/performance.ts
// Performance monitoring and optimization configuration

export const PERFORMANCE_CONFIG = {
  // React Query Cache Configuration
  CACHE: {
    // Standard stale time for most queries (2 minutes)
    STANDARD_STALE_TIME: 2 * 60 * 1000, // 2 minutes
    
    // Extended stale time for rarely changing data (5 minutes)
    EXTENDED_STALE_TIME: 5 * 60 * 1000, // 5 minutes
    
    // Short stale time for frequently changing data (30 seconds)
    SHORT_STALE_TIME: 30 * 1000, // 30 seconds
    
    // Garbage collection time (10 minutes)
    GC_TIME: 10 * 60 * 1000, // 10 minutes
    
    // Maximum retry attempts
    MAX_RETRIES: 2,
    
    // Window focus refetch (disabled for performance)
    REFETCH_ON_WINDOW_FOCUS: false,
    
    // Reconnect refetch (enabled for data consistency)
    REFETCH_ON_RECONNECT: true,
  },
  
  // Pagination Configuration
  PAGINATION: {
    // Default page sizes for different contexts
    WAREHOUSE: {
      DEFAULT: 10,
      OPTIONS: [5, 10, 25, 50],
      MAX_PER_PAGE: 50,
    },
    PURCHASE: {
      DEFAULT: 15,
      OPTIONS: [10, 15, 25, 50],
      MAX_PER_PAGE: 50,
    },
    ORDERS: {
      DEFAULT: 10,
      OPTIONS: [5, 10, 20, 50],
      MAX_PER_PAGE: 50,
    },
    RECIPES: {
      DEFAULT: 12,
      OPTIONS: [6, 12, 24, 48],
      MAX_PER_PAGE: 48,
    },
  },
  
  // Bulk Operations Configuration
  BULK_OPERATIONS: {
    // Batch size for different operations
    BATCH_SIZES: {
      CREATE: 20,
      UPDATE: 15,
      DELETE: 25,
      WAREHOUSE_SYNC: 30,
    },
    
    // Delays between batches (milliseconds)
    BATCH_DELAYS: {
      STANDARD: 100,
      HEAVY_OPERATION: 200,
      DATABASE_INTENSIVE: 300,
    },
    
    // Maximum concurrent operations
    MAX_CONCURRENT: 3,
    
    // Timeout for bulk operations (milliseconds)
    TIMEOUT: 30000, // 30 seconds
  },
  
  // Real-time Subscription Configuration
  REALTIME: {
    // Debounce delay for subscription updates
    DEBOUNCE_DELAY: 250, // 250ms
    
    // Reconnection attempts
    MAX_RECONNECT_ATTEMPTS: 5,
    
    // Reconnection delay (exponential backoff)
    RECONNECT_DELAY_BASE: 1000, // 1 second
    
    // Maximum reconnection delay
    MAX_RECONNECT_DELAY: 30000, // 30 seconds
    
    // Channel cleanup delay
    CLEANUP_DELAY: 5000, // 5 seconds
  },
  
  // UI Performance Configuration
  UI: {
    // Intersection observer options for lazy loading
    LAZY_LOADING: {
      ROOT_MARGIN: '50px',
      THRESHOLD: 0.1,
    },
    
    // Virtualization thresholds
    VIRTUALIZE_THRESHOLD: 100, // Enable virtualization for lists > 100 items
    
    // Skeleton loading delays
    SKELETON_DELAYS: {
      FAST: 200,
      STANDARD: 500,
      SLOW: 1000,
    },
    
    // Animation durations
    ANIMATIONS: {
      FAST: 150,
      STANDARD: 300,
      SLOW: 500,
    },
  },
  
  // Bundle Size Optimization
  BUNDLE: {
    // Lazy loading thresholds (component size in KB)
    LAZY_LOAD_THRESHOLD: 50,
    
    // Code splitting boundaries
    ROUTE_SPLITTING: true,
    COMPONENT_SPLITTING: true,
    VENDOR_SPLITTING: true,
    
    // Preload priorities
    PRELOAD: {
      CRITICAL_ROUTES: ['/', '/dashboard', '/warehouse'],
      PREFETCH_ROUTES: ['/purchase', '/orders'],
    },
  },
  
  // Database Query Optimization
  DATABASE: {
    // Field selection for common queries
    SELECTIVE_FIELDS: {
      WAREHOUSE: 'id, nama, stok, harga, minimum, kategori, supplier',
      PURCHASE: 'id, tanggal, status, total, supplier_id, items',
      ORDERS: 'id, tanggal, customer, total, status, items',
      RECIPES: 'id, nama_resep, kategori, hpp_per_porsi, margin',
    },
    
    // Query timeouts
    TIMEOUT: 10000, // 10 seconds
    
    // Connection pooling
    POOL_SIZE: 10,
    
    // Index hints for commonly filtered fields
    INDEXED_FIELDS: [
      'created_at',
      'updated_at', 
      'user_id',
      'status',
      'kategori',
      'supplier_id',
    ],
  },
  
  // Performance Monitoring
  MONITORING: {
    // Enable performance tracking
    ENABLED: process.env.NODE_ENV === 'development',
    
    // Sample rate for performance metrics
    SAMPLE_RATE: 0.1, // 10%
    
    // Performance budgets (milliseconds)
    BUDGETS: {
      PAGE_LOAD: 3000, // 3 seconds
      ROUTE_CHANGE: 1000, // 1 second
      API_REQUEST: 2000, // 2 seconds
      BULK_OPERATION: 10000, // 10 seconds
    },
    
    // Memory usage thresholds
    MEMORY_THRESHOLDS: {
      WARNING: 50 * 1024 * 1024, // 50MB
      CRITICAL: 100 * 1024 * 1024, // 100MB
    },
  },
  
  // Error Handling
  ERROR_HANDLING: {
    // Retry configuration for failed operations
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
    EXPONENTIAL_BACKOFF: true,
    
    // Circuit breaker configuration
    CIRCUIT_BREAKER: {
      FAILURE_THRESHOLD: 5,
      RECOVERY_TIMEOUT: 60000, // 1 minute
      MONITOR_TIMEOUT: 10000, // 10 seconds
    },
  },
} as const;

// Performance utility functions
export const performanceUtils = {
  /**
   * Get appropriate stale time based on data type
   */
  getStaleTime: (dataType: 'static' | 'standard' | 'dynamic') => {
    switch (dataType) {
      case 'static':
        return PERFORMANCE_CONFIG.CACHE.EXTENDED_STALE_TIME;
      case 'standard':
        return PERFORMANCE_CONFIG.CACHE.STANDARD_STALE_TIME;
      case 'dynamic':
        return PERFORMANCE_CONFIG.CACHE.SHORT_STALE_TIME;
      default:
        return PERFORMANCE_CONFIG.CACHE.STANDARD_STALE_TIME;
    }
  },
  
  /**
   * Get appropriate batch size for bulk operations
   */
  getBatchSize: (operation: keyof typeof PERFORMANCE_CONFIG.BULK_OPERATIONS.BATCH_SIZES) => {
    return PERFORMANCE_CONFIG.BULK_OPERATIONS.BATCH_SIZES[operation] || 20;
  },
  
  /**
   * Get paginated query key with performance optimizations
   */
  getPaginatedQueryKey: (baseKey: string[], page: number, limit: number) => {
    return [...baseKey, 'paginated', page, limit];
  },
  
  /**
   * Check if component should be lazy loaded
   */
  shouldLazyLoad: (componentSize: number) => {
    return componentSize > PERFORMANCE_CONFIG.BUNDLE.LAZY_LOAD_THRESHOLD;
  },
  
  /**
   * Calculate optimal debounce delay based on frequency
   */
  getDebounceDelay: (frequency: 'low' | 'medium' | 'high') => {
    switch (frequency) {
      case 'low':
        return PERFORMANCE_CONFIG.REALTIME.DEBOUNCE_DELAY * 2;
      case 'medium':
        return PERFORMANCE_CONFIG.REALTIME.DEBOUNCE_DELAY;
      case 'high':
        return PERFORMANCE_CONFIG.REALTIME.DEBOUNCE_DELAY / 2;
      default:
        return PERFORMANCE_CONFIG.REALTIME.DEBOUNCE_DELAY;
    }
  },
};

// Performance monitoring hooks and utilities
export const createPerformanceMonitor = () => {
  if (!PERFORMANCE_CONFIG.MONITORING.ENABLED) {
    return {
      startTiming: () => () => {},
      recordMetric: () => {},
      checkMemoryUsage: () => {},
    };
  }
  
  return {
    startTiming: (label: string) => {
      const startTime = performance.now();
      return () => {
        const duration = performance.now() - startTime;
        console.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
        
        // Check against performance budget
        const budget = PERFORMANCE_CONFIG.MONITORING.BUDGETS;
        let threshold = budget.API_REQUEST;
        
        if (label.includes('page')) threshold = budget.PAGE_LOAD;
        if (label.includes('route')) threshold = budget.ROUTE_CHANGE;
        if (label.includes('bulk')) threshold = budget.BULK_OPERATION;
        
        if (duration > threshold) {
          console.warn(`[Performance] ${label} exceeded budget: ${duration}ms > ${threshold}ms`);
        }
      };
    },
    
    recordMetric: (metric: string, value: number) => {
      if (Math.random() <= PERFORMANCE_CONFIG.MONITORING.SAMPLE_RATE) {
        console.debug(`[Metric] ${metric}: ${value}`);
      }
    },
    
    checkMemoryUsage: () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const used = memory.usedJSHeapSize;
        const { WARNING, CRITICAL } = PERFORMANCE_CONFIG.MONITORING.MEMORY_THRESHOLDS;
        
        if (used > CRITICAL) {
          console.error(`[Memory] Critical usage: ${(used / 1024 / 1024).toFixed(2)}MB`);
        } else if (used > WARNING) {
          console.warn(`[Memory] High usage: ${(used / 1024 / 1024).toFixed(2)}MB`);
        }
      }
    },
  };
};

// Export types for TypeScript
export type PerformanceConfig = typeof PERFORMANCE_CONFIG;
export type PerformanceDataType = 'static' | 'standard' | 'dynamic';
export type BulkOperationType = keyof typeof PERFORMANCE_CONFIG.BULK_OPERATIONS.BATCH_SIZES;
