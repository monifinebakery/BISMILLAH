// src/components/orders/context/OrderProvider.tsx - FIXED VERSION (No Circular Dependencies)

import React, { ReactNode, useMemo, useEffect, useRef, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

// Context imports
import OrderContext from './OrderContext';
import { FollowUpTemplateProvider } from '@/contexts/FollowUpTemplateContext';

// ✅ ONLY Auth dependency - no other contexts
import { useAuth } from '@/contexts/AuthContext';

// Local imports
import { useOrderData } from '../hooks/useOrderData';
import type { Order } from '../types';
import { safeParseDate, isValidDate } from '../utils';

interface OrderProviderProps {
  children: ReactNode;
}

// ✅ Helper function untuk format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// ✅ Helper function untuk toast notifications
const showToastNotification = (notification: any) => {
  const { title, message, type = 'info' } = notification;
  
  switch (type) {
    case 'success':
      toast.success(title, { description: message, duration: 4000 });
      break;
    case 'error':
      toast.error(title, { description: message, duration: 5000 });
      break;
    case 'warning':
      toast.warning(title, { description: message, duration: 4000 });
      break;
    default:
      toast(title, { description: message, duration: 3000 });
  }
};

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const mountedRef = useRef(true);
  
  // ✅ Track if callbacks are ready
  const callbacksReadyRef = useRef(false);

  // ✅ FIX: Stabilize function references with useCallback
  const addActivityDirect = useCallback(async (activity: { title: string; description: string; type: string }) => {
    if (!user?.id) {
      logger.warn('OrderProvider', 'Cannot add activity - no user');
      return;
    }
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase.from('activities').insert({
        user_id: user.id,
        title: activity.title,
        description: activity.description,
        type: activity.type,
        value: null,
        created_at: new Date().toISOString()
      });
      
      if (error) {
        logger.error('OrderProvider', 'Database error adding activity:', error);
      }
      
      // Show simple toast
      toast(`📝 ${activity.title}`, { 
        description: activity.description,
        duration: 3000 
      });
      
      logger.debug('OrderProvider', 'Activity logged:', activity.title);
    } catch (error) {
      logger.error('OrderProvider', 'Failed to log activity:', error);
      // Still show toast even if DB fails
      toast(`📝 ${activity.title}`, { 
        description: activity.description,
        duration: 3000 
      });
    }
  }, [user?.id]);

  // ✅ FIX: Stabilize with useCallback
  const addTransactionDirect = useCallback(async (transaction: any) => {
    if (!user?.id) {
      logger.warn('OrderProvider', 'Cannot add transaction - no user');
      return;
    }
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase.from('financial_transactions').insert({
        user_id: user.id,
        type: transaction.type || 'income',
        category: transaction.category || 'Penjualan Produk',
        amount: Number(transaction.amount) || 0,
        description: transaction.description || '',
        date: transaction.date || new Date().toISOString(),
        notes: transaction.notes || null,
        related_id: transaction.relatedId || null,
        created_at: new Date().toISOString()
      });
      
      if (error) {
        logger.error('OrderProvider', 'Database error adding transaction:', error);
      }
      
      // Show formatted toast
      toast.success(`💰 Transaksi Dicatat`, { 
        description: `${transaction.description}: ${formatCurrency(transaction.amount)}`,
        duration: 4000 
      });
      
      logger.debug('OrderProvider', 'Transaction logged:', transaction.description);
    } catch (error) {
      logger.error('OrderProvider', 'Failed to log transaction:', error);
      // Fallback to toast only
      toast.success(`💰 Pemasukan Dicatat`, { 
        description: `${transaction.description}: ${formatCurrency(transaction.amount)}`,
        duration: 4000 
      });
    }
  }, [user?.id]);

  // ✅ FIX: Stabilize settings with useMemo
  const settingsDirect = useMemo(() => ({
    financialCategories: {
      income: ['Penjualan Produk', 'Penjualan Jasa', 'Lainnya'],
      expense: ['Biaya Operasional', 'Biaya Bahan', 'Lainnya']
    },
    currency: 'IDR',
    taxRate: 0.11,
    timezone: 'Asia/Jakarta'
  }), []); // Never changes

  // ✅ FIX: Stabilize with useCallback
  const addNotificationDirect = useCallback(async (notification: any) => {
    if (!user?.id) {
      logger.warn('OrderProvider', 'Cannot add notification - no user');
      showToastNotification(notification);
      return;
    }
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase.from('notifications').insert({
        user_id: user.id,
        title: notification.title || '',
        message: notification.message || '',
        type: notification.type || 'info',
        icon: notification.icon || null,
        priority: notification.priority || 2,
        related_type: notification.related_type || null,
        related_id: notification.related_id || null,
        action_url: notification.action_url || null,
        is_read: false,
        is_archived: false,
        created_at: new Date().toISOString()
      });
      
      if (error) {
        logger.error('OrderProvider', 'Database error adding notification:', error);
      }
      
      // Show toast notification
      showToastNotification(notification);
      
      logger.debug('OrderProvider', 'Notification created:', notification.title);
    } catch (error) {
      logger.error('OrderProvider', 'Failed to create notification:', error);
      // Fallback to toast only
      showToastNotification(notification);
    }
  }, [user?.id]);

  // ✅ Mark callbacks as ready
  useEffect(() => {
    if (user?.id) {
      callbacksReadyRef.current = true;
      logger.debug('OrderProvider', 'Callbacks ready for user:', user.id);
    } else {
      callbacksReadyRef.current = false;
    }
  }, [user?.id]);

  // ✅ CALL useOrderData with stabilized functions
  const orderData = useOrderData(
    user,
    addActivityDirect,
    addTransactionDirect,
    settingsDirect,
    addNotificationDirect
  );

  const isReady = !!(user && callbacksReadyRef.current);

  // ✅ Component mount/unmount tracking
  useEffect(() => {
    mountedRef.current = true;
    logger.context('OrderProvider', 'Component mounted');
    
    return () => {
      logger.context('OrderProvider', 'Component unmounting');
      mountedRef.current = false;
    };
  }, []);

  // ✅ Debug logging for state changes
  useEffect(() => {
    logger.context('OrderProvider', 'State update', {
      hasUser: !!user,
      userId: user?.id || 'no_user',
      isReady,
      callbacksReady: callbacksReadyRef.current,
      orderCount: orderData.orders.length,
      loading: orderData.loading,
      connected: orderData.isConnected
    });
  }, [user?.id, isReady, orderData.orders.length, orderData.loading, orderData.isConnected]);

  // ✅ UTILITY METHODS with stable references
  const utilityMethods = useMemo(() => ({
    getOrdersByDateRange: (startDate: Date, endDate: Date): Order[] => {
      try {
        if (!isValidDate(startDate) || !isValidDate(endDate)) {
          logger.warn('OrderProvider', 'Invalid dates provided to getOrdersByDateRange');
          return [];
        }
        
        return orderData.orders.filter(order => {
          try {
            const orderDate = safeParseDate(order.tanggal);
            if (!orderDate) return false;
            return orderDate >= startDate && orderDate <= endDate;
          } catch (error) {
            logger.error('OrderProvider', 'Error parsing order date:', error);
            return false;
          }
        });
      } catch (error) {
        logger.error('OrderProvider', 'Error in getOrdersByDateRange:', error);
        return [];
      }
    },
    
    searchOrders: (searchTerm: string): Order[] => {
      if (!searchTerm || typeof searchTerm !== 'string') {
        return orderData.orders;
      }
      
      const term = searchTerm.toLowerCase().trim();
      return orderData.orders.filter(order => {
        return (
          order.namaPelanggan?.toLowerCase().includes(term) ||
          order.nomorPesanan?.toLowerCase().includes(term) ||
          order.teleponPelanggan?.toLowerCase().includes(term) ||
          order.emailPelanggan?.toLowerCase().includes(term)
        );
      });
    },
    
    getTotalRevenue: (): number => {
      return orderData.orders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + (order.totalPesanan || 0), 0);
    },
    
    getPendingOrdersCount: (): number => {
      return orderData.orders.filter(order => order.status === 'pending').length;
    },
    
    getProcessingOrdersCount: (): number => {
      return orderData.orders.filter(order => order.status === 'processing').length;
    }
  }), [orderData.orders]);

  // ✅ CONTEXT VALUE with stable memoization
  const contextValue = useMemo(() => {
    // Return empty state if not ready
    if (!isReady) {
      logger.debug('OrderProvider', 'Context not ready, returning empty state');
      return {
        orders: [],
        loading: true,
        isConnected: false,
        addOrder: async () => {
          logger.warn('OrderProvider', 'addOrder called before ready');
          return false;
        },
        updateOrder: async () => {
          logger.warn('OrderProvider', 'updateOrder called before ready');
          return false;
        },
        deleteOrder: async () => {
          logger.warn('OrderProvider', 'deleteOrder called before ready');
          return false;
        },
        bulkUpdateStatus: async () => {
          logger.warn('OrderProvider', 'bulkUpdateStatus called before ready');
          return false;
        },
        bulkDeleteOrders: async () => {
          logger.warn('OrderProvider', 'bulkDeleteOrders called before ready');
          return false;
        },
        refreshData: async () => {
          logger.warn('OrderProvider', 'refreshData called before ready');
        },
        getOrderById: () => undefined,
        getOrdersByStatus: () => [],
        getOrdersByDateRange: () => [],
        searchOrders: () => [],
        getTotalRevenue: () => 0,
        getPendingOrdersCount: () => 0,
        getProcessingOrdersCount: () => 0,
        contextReady: false,
      };
    }

    // Return full context when ready
    const fullContext = {
      // Core data
      orders: orderData.orders,
      loading: orderData.loading,
      isConnected: orderData.isConnected,
      
      // CRUD operations
      addOrder: orderData.addOrder,
      updateOrder: orderData.updateOrder,
      deleteOrder: orderData.deleteOrder,
      
      // Bulk operations
      bulkUpdateStatus: orderData.bulkUpdateStatus,
      bulkDeleteOrders: orderData.bulkDeleteOrders,
      
      // Utility functions
      refreshData: orderData.refreshData,
      getOrderById: orderData.getOrderById,
      getOrdersByStatus: orderData.getOrdersByStatus,
      getOrdersByDateRange: utilityMethods.getOrdersByDateRange,
      
      // Additional utilities
      searchOrders: utilityMethods.searchOrders,
      getTotalRevenue: utilityMethods.getTotalRevenue,
      getPendingOrdersCount: utilityMethods.getPendingOrdersCount,
      getProcessingOrdersCount: utilityMethods.getProcessingOrdersCount,
      
      // Ready flag
      contextReady: true,
    };

    logger.success('OrderProvider', '✅ Context ready with stabilized functions', {
      userId: user?.id,
      orderCount: orderData.orders.length,
      loading: fullContext.loading,
      connected: fullContext.isConnected,
      timestamp: new Date().toISOString()
    });

    return fullContext;
  }, [
    orderData.orders,
    orderData.loading,
    orderData.isConnected,
    orderData.addOrder,
    orderData.updateOrder,
    orderData.deleteOrder,
    orderData.bulkUpdateStatus,
    orderData.bulkDeleteOrders,
    orderData.refreshData,
    orderData.getOrderById,
    orderData.getOrdersByStatus,
    utilityMethods,
    isReady,
    user?.id
  ]);

  return (
    <FollowUpTemplateProvider>
      <OrderContext.Provider value={contextValue}>
        {children}
      </OrderContext.Provider>
    </FollowUpTemplateProvider>
  );
};