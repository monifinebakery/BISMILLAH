// src/utils/cacheOptimization.ts
// 🔧 Surgical Cache Invalidation Utilities

import { QueryClient } from '@tanstack/react-query';
import { logger } from './logger';

// ===========================================
// 🎯 SURGICAL CACHE INVALIDATION PATTERNS
// ===========================================

interface CacheInvalidationOptions {
  refetchType?: 'active' | 'all' | 'inactive';
  exact?: boolean;
  stale?: boolean;
}

export class SurgicalCache {
  private queryClient: QueryClient;
  
  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  // ===========================================
  // 1. TARGETED INVALIDATION (Instead of broad)
  // ===========================================

  /**
   * Invalidate only specific data types, not everything
   */
  invalidateWarehouse(userId?: string, options: CacheInvalidationOptions = {}) {
    const { refetchType = 'active', exact = false } = options;
    
    // Instead of: queryClient.invalidateQueries({ queryKey: ['warehouse'] })
    // Use targeted approach:
    
    this.queryClient.invalidateQueries({ 
      queryKey: ['warehouse', 'list', userId],
      refetchType,
      exact
    });
    
    // Only invalidate analysis if needed
    if (options.stale) {
      this.queryClient.invalidateQueries({ 
        queryKey: ['warehouse', 'analysis', userId],
        refetchType: 'inactive' // Don't refetch if not currently viewing
      });
    }

    logger.debug('🎯 Surgical warehouse invalidation:', { userId, options });
  }

  /**
   * Smart supplier invalidation
   */
  invalidateSuppliers(userId?: string, updatedSupplierId?: string) {
    // Only invalidate supplier lists
    this.queryClient.invalidateQueries({ 
      queryKey: ['suppliers', 'list'],
      refetchType: 'active'
    });
    
    // If specific supplier updated, update its detail cache
    if (updatedSupplierId) {
      this.queryClient.removeQueries({
        queryKey: ['suppliers', 'detail', updatedSupplierId]
      });
    }

    logger.debug('🎯 Surgical supplier invalidation:', { userId, updatedSupplierId });
  }

  /**
   * Purchase-related invalidations
   */
  invalidatePurchases(userId?: string, impactType: 'create' | 'update' | 'delete' | 'status' = 'update') {
    // Always invalidate purchase list
    this.queryClient.invalidateQueries({ 
      queryKey: ['purchases', 'list', userId],
      refetchType: 'active'
    });
    
    // Only invalidate related data if the change affects it
    switch (impactType) {
      case 'create':
      case 'status':
        // Status changes affect profit calculations
        this.queryClient.invalidateQueries({ 
          queryKey: ['profit-analysis'],
          refetchType: 'inactive' // Background refresh
        });
        this.invalidateWarehouse(userId, { stale: true });
        break;
        
      case 'delete':
        // Deletions affect financial data
        this.queryClient.invalidateQueries({ 
          queryKey: ['financial'],
          refetchType: 'active'
        });
        break;
        
      case 'update':
        // Basic updates don't need to invalidate everything
        break;
    }

    logger.debug('🎯 Surgical purchase invalidation:', { userId, impactType });
  }

  /**
   * Financial transaction invalidations
   */
  invalidateFinancial(userId?: string, transactionType?: 'income' | 'expense') {
    this.queryClient.invalidateQueries({ 
      queryKey: ['financial', 'transactions', userId],
      refetchType: 'active'
    });
    
    // Only invalidate profit if it's an expense that affects COGS
    if (transactionType === 'expense') {
      this.queryClient.invalidateQueries({ 
        queryKey: ['profit-analysis'],
        refetchType: 'inactive'
      });
    }

    logger.debug('🎯 Surgical financial invalidation:', { userId, transactionType });
  }
  
  // ===========================================
  // 2. OPTIMISTIC UPDATE PATTERNS
  // ===========================================

  /**
   * Enhanced optimistic updates with rollback
   */
  async optimisticUpdate<T, U>(
    queryKey: any[],
    newData: T,
    mutationFn: () => Promise<U>,
    transform: (old: T[], newItem: T) => T[]
  ): Promise<{ success: boolean; data?: U; error?: Error }> {
    // Cancel outgoing refetches
    await this.queryClient.cancelQueries({ queryKey });
    
    // Snapshot previous value
    const previousData = this.queryClient.getQueryData<T[]>(queryKey);
    
    // Optimistically update
    this.queryClient.setQueryData(queryKey, (old: T[] = []) => 
      transform(old, newData)
    );
    
    try {
      const result = await mutationFn();
      
      // Success - the cache will be updated by React Query
      logger.debug('✅ Optimistic update successful');
      return { success: true, data: result };
      
    } catch (error) {
      // Rollback on error
      this.queryClient.setQueryData(queryKey, previousData);
      
      logger.error('❌ Optimistic update failed, rolled back:', error);
      return { success: false, error: error as Error };
    }
  }

  // ===========================================
  // 3. PREFETCHING STRATEGIES
  // ===========================================

  /**
   * Smart prefetching based on user behavior
   */
  async prefetchRelatedData(userId: string, context: 'purchase' | 'warehouse' | 'analysis') {
    const prefetchOptions = {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
    };

    switch (context) {
      case 'purchase':
        // When user opens purchase form, prefetch suppliers
        await this.queryClient.prefetchQuery({
          queryKey: ['suppliers', 'list', userId],
          queryFn: () => import('../contexts/SupplierContext').then(m => m.fetchSuppliers?.(userId)),
          ...prefetchOptions,
        });
        
        // Also prefetch warehouse for item selection
        await this.queryClient.prefetchQuery({
          queryKey: ['warehouse', 'list', userId],
          queryFn: () => import('../components/warehouse/context/WarehouseContext').then(m => m.fetchWarehouseData?.(userId)),
          ...prefetchOptions,
        });
        break;
        
      case 'warehouse':
        // When user opens warehouse, prefetch suppliers for adding items
        await this.queryClient.prefetchQuery({
          queryKey: ['suppliers', 'list', userId],
          queryFn: () => import('../contexts/SupplierContext').then(m => m.fetchSuppliers?.(userId)),
          ...prefetchOptions,
        });
        break;
        
      case 'analysis':
        // When user opens analysis, prefetch financial data
        await this.queryClient.prefetchQuery({
          queryKey: ['financial', 'transactions', userId],
          queryFn: () => import('../components/financial/contexts/FinancialContext').then(m => m.fetchTransactions?.(userId)),
          ...prefetchOptions,
        });
        break;
    }

    logger.debug('🔮 Prefetched related data for context:', context);
  }

  // ===========================================
  // 4. CACHE CLEANUP STRATEGIES
  // ===========================================

  /**
   * Clean up stale cache entries
   */
  cleanupStaleCache() {
    const cacheTime = 15 * 60 * 1000; // 15 minutes
    
    // Remove unused queries
    this.queryClient.removeQueries({
      predicate: (query) => {
        const lastUsed = query.state.dataUpdatedAt;
        return Date.now() - lastUsed > cacheTime;
      }
    });

    logger.debug('🧹 Cleaned up stale cache entries');
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'pending').length,
      successQueries: queries.filter(q => q.state.status === 'success').length,
      
      // Memory usage estimation
      memorySizeMB: queries.reduce((size, query) => {
        const dataSize = JSON.stringify(query.state.data).length;
        return size + (dataSize / 1024 / 1024);
      }, 0),
    };

    return stats;
  }
}

// ===========================================
// 5. GLOBAL CACHE OPTIMIZATION HOOK
// ===========================================

export const useCacheOptimization = (userId?: string) => {
  const queryClient = new QueryClient();
  const surgicalCache = new SurgicalCache(queryClient);
  
  // Cleanup interval
  React.useEffect(() => {
    const interval = setInterval(() => {
      surgicalCache.cleanupStaleCache();
    }, 10 * 60 * 1000); // Every 10 minutes
    
    return () => clearInterval(interval);
  }, []);

  return {
    // Surgical invalidation methods
    invalidateWarehouse: (options?: CacheInvalidationOptions) => 
      surgicalCache.invalidateWarehouse(userId, options),
    invalidateSuppliers: (updatedSupplierId?: string) => 
      surgicalCache.invalidateSuppliers(userId, updatedSupplierId),
    invalidatePurchases: (impactType?: 'create' | 'update' | 'delete' | 'status') => 
      surgicalCache.invalidatePurchases(userId, impactType),
    invalidateFinancial: (transactionType?: 'income' | 'expense') => 
      surgicalCache.invalidateFinancial(userId, transactionType),
    
    // Prefetching
    prefetchRelatedData: (context: 'purchase' | 'warehouse' | 'analysis') =>
      surgicalCache.prefetchRelatedData(userId!, context),
    
    // Optimistic updates
    optimisticUpdate: surgicalCache.optimisticUpdate.bind(surgicalCache),
    
    // Cache monitoring
    getCacheStats: () => surgicalCache.getCacheStats(),
    cleanupStaleCache: () => surgicalCache.cleanupStaleCache(),
  };
};

// ===========================================
// 6. USAGE EXAMPLES & PATTERNS
// ===========================================

export const cachePatterns = {
  // ✅ Good: Surgical invalidation
  goodSupplierUpdate: (surgicalCache: SurgicalCache, userId: string, supplierId: string) => {
    surgicalCache.invalidateSuppliers(userId, supplierId);
  },
  
  // ❌ Bad: Broad invalidation
  badSupplierUpdate: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    queryClient.invalidateQueries({ queryKey: ['warehouse'] });
    queryClient.invalidateQueries({ queryKey: ['purchases'] });
  },
  
  // ✅ Good: Optimistic with rollback
  goodOptimisticUpdate: async (surgicalCache: SurgicalCache) => {
    const result = await surgicalCache.optimisticUpdate(
      ['suppliers', 'list'],
      { id: 'temp', nama: 'New Supplier' } as any,
      () => fetch('/api/suppliers', { method: 'POST' }).then(r => r.json()),
      (old, newItem) => [newItem, ...old]
    );
    
    if (!result.success) {
      console.error('Update failed:', result.error);
    }
  },
  
  // ✅ Good: Smart prefetching
  goodPrefetching: async (surgicalCache: SurgicalCache, userId: string) => {
    // User clicked "Add Purchase" button
    await surgicalCache.prefetchRelatedData(userId, 'purchase');
  }
};

export default SurgicalCache;
