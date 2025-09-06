// src/utils/performance/reactQueryAdvanced.ts
// 🚀 ADVANCED REACT QUERY PERFORMANCE OPTIMIZATIONS
// Background Prefetching & Enhanced Optimistic Updates

import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import { SurgicalCache } from '@/utils/cacheOptimization';
import { safeDom } from '@/utils/browserApiSafeWrappers';


// ===========================================
// 🔮 SMART PREFETCHING SYSTEM
// ===========================================

interface PrefetchStrategy {
  priority: 'high' | 'medium' | 'low';
  staleTime: number;
  gcTime: number;
  delay?: number; // Delay before prefetching (for low priority)
}

const PREFETCH_STRATEGIES: Record<string, PrefetchStrategy> = {
  user_navigation: {
    priority: 'high',
    staleTime: 30000, // 30 seconds
    gcTime: 60000,    // 1 minute
  },
  hover_prefetch: {
    priority: 'medium',
    staleTime: 15000, // 15 seconds
    gcTime: 30000,    // 30 seconds
    delay: 300,       // 300ms delay
  },
  background_refresh: {
    priority: 'low',
    staleTime: 10000, // 10 seconds
    gcTime: 120000,   // 2 minutes
    delay: 2000,      // 2s delay
  },
  predictive: {
    priority: 'medium',
    staleTime: 20000, // 20 seconds
    gcTime: 90000,    // 1.5 minutes
    delay: 1000,      // 1s delay
  }
};

export class SmartPrefetcher {
  private queryClient: QueryClient;
  private prefetchQueue: Array<{ fn: () => Promise<any>; priority: string; timestamp: number }> = [];
  private isProcessing = false;
  private lastActivity = Date.now();
  
  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.startQueueProcessor();
  }

  // ===========================================
  // 🎯 CONTEXT-AWARE PREFETCHING
  // ===========================================

  /**
   * Prefetch based on user navigation patterns
   */
  async prefetchOnNavigation(userId: string, currentRoute: string) {
    const strategy = PREFETCH_STRATEGIES.user_navigation;
    
    switch (currentRoute) {
      case '/purchase':
        // User is on purchase page - prefetch related data
        this.enqueuePrefetch(
          () => this.prefetchSuppliersData(userId, strategy),
          'high'
        );
        this.enqueuePrefetch(
          () => this.prefetchWarehouseData(userId, strategy),
          'high'
        );
        break;
        
      case '/warehouse':
        // User is on warehouse page - prefetch purchase history and suppliers
        this.enqueuePrefetch(
          () => this.prefetchPurchaseHistory(userId, strategy),
          'medium'
        );
        this.enqueuePrefetch(
          () => this.prefetchSuppliersData(userId, strategy),
          'medium'
        );
        break;
        
      case '/profit-analysis':
        // User is on profit analysis - prefetch all related financial data
        this.enqueuePrefetch(
          () => this.prefetchFinancialData(userId, strategy),
          'high'
        );
        this.enqueuePrefetch(
          () => this.prefetchPurchaseHistory(userId, strategy),
          'medium'
        );
        break;
        
      case '/orders':
        // User is on orders - prefetch warehouse for stock validation
        this.enqueuePrefetch(
          () => this.prefetchWarehouseData(userId, strategy),
          'medium'
        );
        this.enqueuePrefetch(
          () => this.prefetchRecipes(userId, strategy),
          'low'
        );
        break;
    }

    logger.debug('🔮 Navigation-based prefetch queued for:', currentRoute);
  }

  /**
   * Hover-based prefetching (for buttons/links)
   */
  async prefetchOnHover(userId: string, target: string, element?: HTMLElement) {
    const strategy = PREFETCH_STRATEGIES.hover_prefetch;
    
    // Debounce hover events
    if (element) {
      let hoverTimer: NodeJS.Timeout;
      
      safeDom.addEventListener(element, 'mouseenter', () => {
        hoverTimer = setTimeout(() => {
          this.executePrefetch(userId, target, strategy);
        }, strategy.delay);
      });
      
      safeDom.addEventListener(element, 'mouseleave', () => {
        clearTimeout(hoverTimer);
      });
    } else {
      // Direct call without element
      setTimeout(() => {
        this.executePrefetch(userId, target, strategy);
      }, strategy.delay);
    }
  }

  /**
   * Predictive prefetching based on user behavior patterns
   */
  async prefetchPredictive(userId: string, userBehavior: {
    frequentRoutes: string[];
    timeOfDay: number;
    dayOfWeek: number;
    lastActions: string[];
  }) {
    const strategy = PREFETCH_STRATEGIES.predictive;
    
    // Business hours prediction (9 AM - 5 PM)
    const isBusinessHours = userBehavior.timeOfDay >= 9 && userBehavior.timeOfDay <= 17;
    
    // Weekend vs weekday behavior
    const isWeekend = userBehavior.dayOfWeek === 0 || userBehavior.dayOfWeek === 6;
    
    if (isBusinessHours && !isWeekend) {
      // Likely to check warehouse and orders during business hours
      this.enqueuePrefetch(
        () => this.prefetchWarehouseData(userId, strategy),
        'medium'
      );
      
      if (userBehavior.lastActions.includes('purchase_create')) {
        // User recently created purchases - likely to check profit analysis
        this.enqueuePrefetch(
          () => this.prefetchFinancialData(userId, strategy),
          'medium'
        );
      }
    }

    // Frequent route patterns
    if (userBehavior.frequentRoutes.includes('/warehouse') && 
        userBehavior.frequentRoutes.includes('/purchase')) {
      // Heavy warehouse/purchase user - keep suppliers fresh
      this.enqueuePrefetch(
        () => this.prefetchSuppliersData(userId, strategy),
        'medium'
      );
    }

    logger.debug('🤖 Predictive prefetch queued based on behavior:', userBehavior);
  }

  // ===========================================
  // 📊 SPECIFIC DATA PREFETCHERS
  // ===========================================

  private async prefetchSuppliersData(userId: string, strategy: PrefetchStrategy) {
    await this.queryClient.prefetchQuery({
      queryKey: ['suppliers', 'list', userId],
      queryFn: async () => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data } = await supabase
          .from('suppliers')
          .select('id, nama, kontak, email, telepon')
          .eq('user_id', userId);
        return data;
      },
      staleTime: strategy.staleTime,
      gcTime: strategy.gcTime,
    });
  }

  private async prefetchWarehouseData(userId: string, strategy: PrefetchStrategy) {
    await this.queryClient.prefetchQuery({
      queryKey: ['warehouse', 'list', userId],
      queryFn: async () => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data } = await supabase
          .from('bahan_baku')
          .select('id, nama, kategori, stok, satuan, minimum, harga_satuan, supplier')
          .eq('user_id', userId);
        return data;
      },
      staleTime: strategy.staleTime,
      gcTime: strategy.gcTime,
    });
  }

  private async prefetchPurchaseHistory(userId: string, strategy: PrefetchStrategy) {
    await this.queryClient.prefetchQuery({
      queryKey: ['purchases', 'history', userId],
      queryFn: async () => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data } = await supabase
          .from('purchases')
          .select('id, supplier, tanggal, total_nilai, status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);
        return data;
      },
      staleTime: strategy.staleTime,
      gcTime: strategy.gcTime,
    });
  }

  private async prefetchFinancialData(userId: string, strategy: PrefetchStrategy) {
    await this.queryClient.prefetchQuery({
      queryKey: ['financial', 'transactions', userId],
      queryFn: async () => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data } = await supabase
          .from('financial_transactions')
          .select('id, type, amount, category, description, date, created_at')
          .eq('user_id', userId)
          .order('date', { ascending: false })
          .limit(100);
        return data;
      },
      staleTime: strategy.staleTime,
      gcTime: strategy.gcTime,
    });
  }

  private async prefetchRecipes(userId: string, strategy: PrefetchStrategy) {
    await this.queryClient.prefetchQuery({
      queryKey: ['recipes', 'list', userId],
      queryFn: async () => {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data } = await supabase
          .from('resep')
          .select('id, nama_resep, kategori_resep, jumlah_porsi, total_hpp, hpp_per_porsi, created_at')
          .eq('user_id', userId);
        return data;
      },
      staleTime: strategy.staleTime,
      gcTime: strategy.gcTime,
    });
  }

  // ===========================================
  // ⚙️ QUEUE MANAGEMENT
  // ===========================================

  private enqueuePrefetch(prefetchFn: () => Promise<any>, priority: string) {
    this.prefetchQueue.push({
      fn: prefetchFn,
      priority,
      timestamp: Date.now()
    });
    
    // Sort by priority (high -> medium -> low)
    this.prefetchQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
             (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
    });
  }

  private async executePrefetch(userId: string, target: string, strategy: PrefetchStrategy) {
    try {
      switch (target) {
        case 'suppliers':
          await this.prefetchSuppliersData(userId, strategy);
          break;
        case 'warehouse':
          await this.prefetchWarehouseData(userId, strategy);
          break;
        case 'purchases':
          await this.prefetchPurchaseHistory(userId, strategy);
          break;
        case 'financial':
          await this.prefetchFinancialData(userId, strategy);
          break;
        case 'recipes':
          await this.prefetchRecipes(userId, strategy);
          break;
      }
      logger.debug('✅ Prefetch completed for:', target);
    } catch (error) {
      logger.error('❌ Prefetch failed for:', target, error);
    }
  }

  private startQueueProcessor() {
    setInterval(() => {
      if (this.isProcessing || this.prefetchQueue.length === 0) return;
      
      // Check if user is idle (no activity for 1 second)
      const isIdle = Date.now() - this.lastActivity > 1000;
      if (!isIdle) return;

      this.processQueue();
    }, 500);
  }

  private async processQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.prefetchQueue.length > 0) {
      const item = this.prefetchQueue.shift()!;
      
      // Skip stale prefetch requests (older than 30 seconds)
      if (Date.now() - item.timestamp > 30000) {
        continue;
      }
      
      try {
        await item.fn();
        // Small delay between prefetches to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error('Queue processing error:', error);
      }
    }
    
    this.isProcessing = false;
  }

  public updateActivity() {
    this.lastActivity = Date.now();
  }
}

// ===========================================
// ⚡ ENHANCED OPTIMISTIC UPDATES
// ===========================================

export class EnhancedOptimisticUpdates {
  private queryClient: QueryClient;
  private rollbackStack: Array<{
    queryKey: any[];
    previousData: any;
    timestamp: number;
  }> = [];

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Smart optimistic update with automatic rollback and retry
   */
  async smartOptimisticUpdate<TData, TResponse>({
    queryKey,
    optimisticData,
    mutationFn,
    updateFn,
    rollbackOnError = true,
    retryOnFailure = true,
    onSuccess,
    onError,
  }: {
    queryKey: any[];
    optimisticData: TData;
    mutationFn: () => Promise<TResponse>;
    updateFn: (oldData: TData[] | undefined, newData: TData) => TData[];
    rollbackOnError?: boolean;
    retryOnFailure?: boolean;
    onSuccess?: (data: TResponse) => void;
    onError?: (error: Error) => void;
  }): Promise<{ success: boolean; data?: TResponse; error?: Error }> {
    
    // Cancel any outgoing refetches
    await this.queryClient.cancelQueries({ queryKey });
    
    // Snapshot the previous value
    const previousData = this.queryClient.getQueryData<TData[]>(queryKey);
    
    // Store for potential rollback
    this.rollbackStack.push({
      queryKey,
      previousData,
      timestamp: Date.now()
    });
    
    // Apply optimistic update
    this.queryClient.setQueryData(queryKey, (oldData: TData[] | undefined) => 
      updateFn(oldData, optimisticData)
    );

    try {
      // Execute the mutation
      const result = await mutationFn();
      
      // Success callback
      onSuccess?.(result);
      
      logger.debug('✅ Enhanced optimistic update succeeded');
      return { success: true, data: result };
      
    } catch (error) {
      const errorObj = error as Error;
      
      if (rollbackOnError) {
        // Rollback the optimistic update
        this.queryClient.setQueryData(queryKey, previousData);
        logger.debug('🔄 Optimistic update rolled back due to error');
      }
      
      // Retry logic
      if (retryOnFailure && !errorObj.message.includes('auth')) {
        logger.debug('🔄 Retrying failed optimistic update...');
        
        try {
          const retryResult = await mutationFn();
          
          // Re-apply the update after successful retry
          this.queryClient.setQueryData(queryKey, (oldData: TData[] | undefined) => 
            updateFn(oldData, optimisticData)
          );
          
          onSuccess?.(retryResult);
          return { success: true, data: retryResult };
          
        } catch (retryError) {
          onError?.(retryError as Error);
          logger.error('❌ Optimistic update retry failed:', retryError);
          return { success: false, error: retryError as Error };
        }
      }
      
      onError?.(errorObj);
      logger.error('❌ Enhanced optimistic update failed:', error);
      return { success: false, error: errorObj };
    }
  }

  /**
   * Batch optimistic updates for multiple operations
   */
  async batchOptimisticUpdates<TData>(updates: Array<{
    queryKey: any[];
    optimisticData: TData;
    mutationFn: () => Promise<any>;
    updateFn: (oldData: TData[] | undefined, newData: TData) => TData[];
  }>) {
    const results = [];
    const rollbacks: Array<{ queryKey: any[]; previousData: any }> = [];
    
    // Apply all optimistic updates first
    for (const update of updates) {
      await this.queryClient.cancelQueries({ queryKey: update.queryKey });
      const previousData = this.queryClient.getQueryData(update.queryKey);
      rollbacks.push({ queryKey: update.queryKey, previousData });
      
      this.queryClient.setQueryData(update.queryKey, (oldData: TData[] | undefined) =>
        update.updateFn(oldData, update.optimisticData)
      );
    }
    
    // Execute all mutations
    for (let i = 0; i < updates.length; i++) {
      try {
        const result = await updates[i].mutationFn();
        results.push({ success: true, data: result, index: i });
      } catch (error) {
        // Rollback this specific update
        this.queryClient.setQueryData(updates[i].queryKey, rollbacks[i].previousData);
        results.push({ success: false, error, index: i });
      }
    }
    
    logger.debug('📦 Batch optimistic updates completed:', {
      total: updates.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
    
    return results;
  }

  /**
   * Clean up old rollback entries (older than 5 minutes)
   */
  cleanupRollbackStack() {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    this.rollbackStack = this.rollbackStack.filter(item => item.timestamp > fiveMinutesAgo);
  }
}

// ===========================================
// 🪝 CUSTOM HOOKS
// ===========================================

export const useSmartPrefetch = (userId: string) => {
  const queryClient = useQueryClient();
  const prefetcher = useRef(new SmartPrefetcher(queryClient));
  
  useEffect(() => {
    const instance = prefetcher.current;
    
    // Track user activity
    const handleActivity = () => instance.updateActivity();
    
    safeDom.addEventListener(safeDom, window, 'mousemove', handleActivity);
    safeDom.addEventListener(safeDom, window, 'keydown', handleActivity);
    safeDom.addEventListener(safeDom, window, 'scroll', handleActivity);
    
    return () => {
      safeDom.removeEventListener(safeDom, window, 'mousemove', handleActivity);
      safeDom.removeEventListener(safeDom, window, 'keydown', handleActivity);
      safeDom.removeEventListener(safeDom, window, 'scroll', handleActivity);
    };
  }, []);
  
  return {
    prefetchOnNavigation: useCallback((route: string) => 
      prefetcher.current.prefetchOnNavigation(userId, route), [userId]),
    
    prefetchOnHover: useCallback((target: string, element?: HTMLElement) => 
      prefetcher.current.prefetchOnHover(userId, target, element), [userId]),
    
    prefetchPredictive: useCallback((userBehavior: any) => 
      prefetcher.current.prefetchPredictive(userId, userBehavior), [userId]),
  };
};

export const useEnhancedOptimistic = () => {
  const queryClient = useQueryClient();
  const optimisticUpdater = useRef(new EnhancedOptimisticUpdates(queryClient));
  
  useEffect(() => {
    // Cleanup rollback stack every 5 minutes
    const interval = setInterval(() => {
      optimisticUpdater.current.cleanupRollbackStack();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    smartOptimisticUpdate: optimisticUpdater.current.smartOptimisticUpdate.bind(optimisticUpdater.current),
    batchOptimisticUpdates: optimisticUpdater.current.batchOptimisticUpdates.bind(optimisticUpdater.current),
  };
};

// ===========================================
// 📋 USAGE EXAMPLES
// ===========================================

/*
// Example 1: Navigation-based prefetching
const { prefetchOnNavigation } = useSmartPrefetch(userId);

useEffect(() => {
  prefetchOnNavigation(router.pathname);
}, [router.pathname]);

// Example 2: Hover prefetching
const { prefetchOnHover } = useSmartPrefetch(userId);

<button 
  onMouseEnter={() => prefetchOnHover('suppliers')}
  onClick={() => router.push('/suppliers')}
>
  Suppliers
</button>

// Example 3: Enhanced optimistic updates
const { smartOptimisticUpdate } = useEnhancedOptimistic();

const createSupplier = async (newSupplier) => {
  return smartOptimisticUpdate({
    queryKey: ['suppliers', 'list', userId],
    optimisticData: newSupplier,
    mutationFn: () => api.createSupplier(newSupplier),
    updateFn: (oldData, newData) => [newData, ...(oldData || [])],
    onSuccess: () => toast.success('Supplier created'),
    onError: () => toast.error('Failed to create supplier'),
  });
};
*/

export default {
  SmartPrefetcher,
  EnhancedOptimisticUpdates,
  useSmartPrefetch,
  useEnhancedOptimistic,
};
