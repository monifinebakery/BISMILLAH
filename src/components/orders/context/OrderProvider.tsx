// src/components/orders/context/OrderProvider.tsx - REFACTORED with React Query
import React, { ReactNode, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

// ✅ CONSOLIDATED: Context imports
import OrderContext from './OrderContext';
import { FollowUpTemplateProvider } from '@/contexts/FollowUpTemplateContext';

// ✅ CONSOLIDATED: External contexts (grouped)
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useFinancial } from '@/components/financial/contexts/FinancialContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useNotification } from '@/contexts/NotificationContext';

// ✅ ESSENTIAL: React Query version of order data hook
import { useOrderData, orderQueryKeys } from '../hooks/useOrderData';
import type { Order } from '../types';
import { safeParseDate, isValidDate } from '../utils';

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  // ✅ CONTEXTS: All required contexts
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addTransaction } = useFinancial();
  const { settings } = useUserSettings();
  const { addNotification } = useNotification();
  const queryClient = useQueryClient();

  // ✅ MEMOIZED: Dependency check for performance
  const contextDependencies = useMemo(() => {
    const hasAllDependencies = !!(user && addActivity && addTransaction && settings && addNotification);
    
    logger.context('OrderProvider', 'Dependency check', {
      user: user?.id,
      hasActivity: !!addActivity,
      hasFinancial: !!addTransaction,
      hasSettings: !!settings,
      hasNotification: !!addNotification,
      allReady: hasAllDependencies
    });

    return { hasAllDependencies, user };
  }, [user, addActivity, addTransaction, settings, addNotification]);

  // ✅ REFACTORED: Main data hook with React Query
  const orderData = useOrderData(
    contextDependencies.user,
    addActivity,
    addTransaction,
    settings,
    addNotification
  );

  // ✅ MEMOIZED: Enhanced utility methods with React Query integration
  const utilityMethods = useMemo(() => ({
    getOrdersByDateRange: (startDate: Date, endDate: Date): Order[] => {
      try {
        if (!isValidDate(startDate) || !isValidDate(endDate)) {
          logger.error('OrderProvider: Invalid dates for getOrdersByDateRange:', { startDate, endDate });
          return [];
        }
        
        return orderData.orders.filter(order => {
          try {
            const orderDate = safeParseDate(order.tanggal);
            if (!orderDate) return false;
            return orderDate >= startDate && orderDate <= endDate;
          } catch (error) {
            logger.error('OrderProvider: Error processing order date:', error, order);
            return false;
          }
        });
      } catch (error) {
        logger.error('OrderProvider: Error in getOrdersByDateRange:', error);
        return [];
      }
    },

    // ✅ NEW: React Query specific utilities
    invalidateOrders: () => {
      logger.debug('OrderProvider: Invalidating order queries');
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderQueryKeys.stats(user?.id) });
    },

    prefetchOrders: () => {
      if (user?.id) {
        logger.debug('OrderProvider: Prefetching orders for user:', user.id);
        queryClient.prefetchQuery({
          queryKey: orderQueryKeys.list(user.id),
          staleTime: 5 * 60 * 1000, // 5 minutes
        });
      }
    },

    // ✅ NEW: Get cached order without triggering a fetch
    getCachedOrderById: (id: string): Order | undefined => {
      const cachedOrders = queryClient.getQueryData(orderQueryKeys.list(user?.id)) as Order[] | undefined;
      return cachedOrders?.find(order => order.id === id);
    },

    // ✅ NEW: Get order statistics from cache
    getOrderStats: () => {
      const orders = orderData.orders;
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      const thisMonthOrders = orders.filter(order => {
        const orderDate = safeParseDate(order.tanggal);
        return orderDate && orderDate >= thisMonth;
      });

      const lastMonthOrders = orders.filter(order => {
        const orderDate = safeParseDate(order.tanggal);
        return orderDate && orderDate >= lastMonth && orderDate < thisMonth;
      });

      const completedOrders = orders.filter(order => order.status === 'completed');
      const pendingOrders = orders.filter(order => order.status === 'pending');

      return {
        total: orders.length,
        thisMonth: thisMonthOrders.length,
        lastMonth: lastMonthOrders.length,
        completed: completedOrders.length,
        pending: pendingOrders.length,
        totalRevenue: completedOrders.reduce((sum, order) => sum + (order.totalPesanan || 0), 0),
        averageOrderValue: completedOrders.length > 0 
          ? completedOrders.reduce((sum, order) => sum + (order.totalPesanan || 0), 0) / completedOrders.length 
          : 0
      };
    }
  }), [orderData.orders, queryClient, user?.id]);

  // ✅ MEMOIZED: Enhanced context value with React Query features
  const contextValue = useMemo(() => {
    const baseValue = {
      // Core data
      orders: orderData.orders,
      loading: orderData.loading,
      
      // CRUD operations (now with React Query optimistic updates)
      addOrder: orderData.addOrder,
      updateOrder: orderData.updateOrder,
      deleteOrder: orderData.deleteOrder,
      
      // Enhanced features
      isConnected: orderData.isConnected,
      refreshData: orderData.refreshData,
      getOrderById: orderData.getOrderById,
      getOrdersByStatus: orderData.getOrdersByStatus,
      getOrdersByDateRange: utilityMethods.getOrdersByDateRange,
      bulkUpdateStatus: orderData.bulkUpdateStatus,
      bulkDeleteOrders: orderData.bulkDeleteOrders,

      // ✅ NEW: React Query specific features
      invalidateOrders: utilityMethods.invalidateOrders,
      prefetchOrders: utilityMethods.prefetchOrders,
      getCachedOrderById: utilityMethods.getCachedOrderById,
      getOrderStats: utilityMethods.getOrderStats,

      // ✅ NEW: Query state information
      queryInfo: {
        isFetching: orderData.loading,
        isError: false, // This would come from the query if we expose it
        lastUpdated: orderData.orders.length > 0 ? new Date() : null,
        cacheStatus: 'fresh', // This would come from React Query
      }
    };

    logger.context('OrderProvider', 'Enhanced context value created', {
      orderCount: orderData.orders.length,
      loading: orderData.loading,
      connected: orderData.isConnected,
      hasAllDependencies: contextDependencies.hasAllDependencies,
      hasReactQueryFeatures: true
    });

    return baseValue;
  }, [orderData, utilityMethods, contextDependencies.hasAllDependencies]);

  // ✅ MEMOIZED: Enhanced limited context with React Query no-ops
  const limitedContextValue = useMemo(() => {
    logger.context('OrderProvider', 'Providing limited context - no user');
    
    const noOpAsync = async () => {
      logger.warn('OrderProvider: Operation called without user');
      return false;
    };

    const noOpVoid = async () => {
      logger.warn('OrderProvider: Operation called without user');
    };

    const noOpSync = () => {
      logger.warn('OrderProvider: Sync operation called without user');
      return undefined;
    };

    const noOpArray = () => {
      logger.warn('OrderProvider: Array operation called without user');
      return [];
    };

    const noOpStats = () => ({
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      completed: 0,
      pending: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    });

    return {
      orders: [],
      loading: false,
      isConnected: false,
      addOrder: noOpAsync,
      updateOrder: noOpAsync,
      deleteOrder: noOpAsync,
      bulkUpdateStatus: noOpAsync,
      bulkDeleteOrders: noOpAsync,
      refreshData: noOpVoid,
      getOrderById: noOpSync,
      getOrdersByStatus: noOpArray,
      getOrdersByDateRange: noOpArray,
      
      // ✅ React Query specific no-ops
      invalidateOrders: () => logger.warn('OrderProvider: invalidateOrders called without user'),
      prefetchOrders: () => logger.warn('OrderProvider: prefetchOrders called without user'),
      getCachedOrderById: noOpSync,
      getOrderStats: noOpStats,
      
      queryInfo: {
        isFetching: false,
        isError: false,
        lastUpdated: null,
        cacheStatus: 'idle',
      }
    };
  }, []);

  // ✅ EARLY RETURN: Handle missing user with enhanced limited functionality
  if (!contextDependencies.user) {
    return (
      <FollowUpTemplateProvider>
        <OrderContext.Provider value={limitedContextValue}>
          {children}
        </OrderContext.Provider>
      </FollowUpTemplateProvider>
    );
  }

  return (
    <FollowUpTemplateProvider>
      <OrderContext.Provider value={contextValue}>
        {children}
      </OrderContext.Provider>
    </FollowUpTemplateProvider>
  );
};

// ===== ADDITIONAL HOOKS FOR REACT QUERY UTILITIES =====

/**
 * Hook for accessing React Query specific order functions
 */
export const useOrderQuery = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidateOrders = React.useCallback(() => {
    queryClient.invalidateQueries({ queryKey: orderQueryKeys.lists() });
    queryClient.invalidateQueries({ queryKey: orderQueryKeys.stats(user?.id) });
  }, [queryClient, user?.id]);

  const prefetchOrders = React.useCallback(() => {
    if (user?.id) {
      queryClient.prefetchQuery({
        queryKey: orderQueryKeys.list(user.id),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [queryClient, user?.id]);

  const getCachedOrders = React.useCallback((): Order[] => {
    return queryClient.getQueryData(orderQueryKeys.list(user?.id)) as Order[] || [];
  }, [queryClient, user?.id]);

  const getCachedOrderById = React.useCallback((id: string): Order | undefined => {
    const orders = getCachedOrders();
    return orders.find(order => order.id === id);
  }, [getCachedOrders]);

  const getQueryState = React.useCallback(() => {
    const queryState = queryClient.getQueryState(orderQueryKeys.list(user?.id));
    return {
      isFetching: queryState?.isFetching || false,
      isError: queryState?.isError || false,
      isLoading: queryState?.isLoading || false,
      lastUpdated: queryState?.dataUpdatedAt ? new Date(queryState.dataUpdatedAt) : null,
      status: queryState?.status || 'idle',
    };
  }, [queryClient, user?.id]);

  return {
    invalidateOrders,
    prefetchOrders,
    getCachedOrders,
    getCachedOrderById,
    getQueryState,
  };
};

export default OrderProvider;