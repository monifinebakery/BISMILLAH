// src/components/orders/context/OrderProvider.tsx - FIXED WITH updateOrderStatus

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
import { supabase } from '@/integrations/supabase/client';

interface OrderProviderProps {
  children: ReactNode;
}

// ✅ Helper function untuk format currency (outside component to prevent re-creation)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', { 
    style: 'currency', 
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// ✅ Helper function untuk toast notifications (outside component)
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
  // ✅ FIX: ALL HOOKS MUST BE CALLED IN SAME ORDER EVERY RENDER
  // Step 1: All hooks at the top, no conditions
  const { user } = useAuth();
  const mountedRef = useRef(true);
  const callbacksReadyRef = useRef(false);
  
  // ✅ FIX: Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);
  
  // ✅ FIX: All useCallback hooks MUST be called regardless of conditions
  const addActivityDirect = useCallback(async (activity: { title: string; description: string; type: string }) => {
    if (!userId) {
      logger.warn('OrderProvider', 'Cannot add activity - no user');
      return;
    }
    
    try {
      const { error } = await supabase.from('activities').insert({
        user_id: userId,
        title: activity.title,
        description: activity.description,
        type: activity.type,
        value: null,
        created_at: new Date().toISOString()
      });
      
      if (error) {
        logger.error('OrderProvider', 'Database error adding activity:', error);
      }
      
      toast(`📝 ${activity.title}`, { 
        description: activity.description,
        duration: 3000 
      });
      
      logger.debug('OrderProvider', 'Activity logged:', activity.title);
    } catch (error) {
      logger.error('OrderProvider', 'Failed to log activity:', error);
      toast(`📝 ${activity.title}`, { 
        description: activity.description,
        duration: 3000 
      });
    }
  }, [userId]);

  const addTransactionDirect = useCallback(async (transaction: any) => {
    if (!userId) {
      logger.warn('OrderProvider', 'Cannot add transaction - no user');
      return;
    }
    
    try {
      const { error } = await supabase.from('financial_transactions').insert({
        user_id: userId,
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
      
      toast.success(`💰 Transaksi Dicatat`, { 
        description: `${transaction.description}: ${formatCurrency(transaction.amount)}`,
        duration: 4000 
      });
      
      logger.debug('OrderProvider', 'Transaction logged:', transaction.description);
    } catch (error) {
      logger.error('OrderProvider', 'Failed to log transaction:', error);
      toast.success(`💰 Pemasukan Dicatat`, { 
        description: `${transaction.description}: ${formatCurrency(transaction.amount)}`,
        duration: 4000 
      });
    }
  }, [userId]);

  const addNotificationDirect = useCallback(async (notification: any) => {
    if (!userId) {
      logger.warn('OrderProvider', 'Cannot add notification - no user');
      showToastNotification(notification);
      return;
    }
    
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
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
      
      showToastNotification(notification);
      logger.debug('OrderProvider', 'Notification created:', notification.title);
    } catch (error) {
      logger.error('OrderProvider', 'Failed to create notification:', error);
      showToastNotification(notification);
    }
  }, [userId]);

  const settingsDirect = useMemo(() => ({
    financialCategories: {
      income: ['Penjualan Produk', 'Penjualan Jasa', 'Lainnya'],
      expense: ['Biaya Operasional', 'Biaya Bahan', 'Lainnya']
    },
    currency: 'IDR',
    taxRate: 0.11,
    timezone: 'Asia/Jakarta'
  }), []);

  // ✅ FIX: useOrderData MUST always be called
  const orderData = useOrderData(
    user,
    addActivityDirect,
    addTransactionDirect,
    settingsDirect,
    addNotificationDirect
  );

  // ✅ Effects
  useEffect(() => {
    if (userId) {
      callbacksReadyRef.current = true;
      logger.debug('OrderProvider', 'Callbacks ready for user:', userId);
    } else {
      callbacksReadyRef.current = false;
      logger.debug('OrderProvider', 'Callbacks not ready - no user');
    }
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    logger.context('OrderProvider', 'Component mounted');
    
    return () => {
      logger.context('OrderProvider', 'Component unmounting');
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    logger.context('OrderProvider', 'State update', {
      hasUser: !!user,
      userId: userId || 'no_user',
      callbacksReady: callbacksReadyRef.current,
      orderCount: orderData.orders.length,
      loading: orderData.loading,
      connected: orderData.isConnected,
      hasUpdateOrderStatus: typeof orderData.updateOrderStatus === 'function' // ✅ DEBUG LOG
    });
  }, [userId, orderData.orders.length, orderData.loading, orderData.isConnected, orderData.updateOrderStatus]);

  const isReady = !!(user && callbacksReadyRef.current);

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
    },
    
    getCompletedOrdersCount: (): number => {
      return orderData.orders.filter(order => order.status === 'completed').length;
    },
    
    getCancelledOrdersCount: (): number => {
      return orderData.orders.filter(order => order.status === 'cancelled').length;
    }
  }), [orderData.orders]);

  // ✅ FIXED: Create stable empty context methods WITH updateOrderStatus
  const emptyContextMethods = useMemo(() => ({
    addOrder: async () => {
      logger.warn('OrderProvider', 'addOrder called before ready');
      toast.error('Sistem belum siap');
      return false;
    },
    updateOrder: async () => {
      logger.warn('OrderProvider', 'updateOrder called before ready');
      toast.error('Sistem belum siap');
      return false;
    },
    // ✅ FIXED: Add updateOrderStatus to empty methods
    updateOrderStatus: async () => {
      logger.warn('OrderProvider', 'updateOrderStatus called before ready');
      toast.error('Sistem belum siap');
      return false;
    },
    deleteOrder: async () => {
      logger.warn('OrderProvider', 'deleteOrder called before ready');
      toast.error('Sistem belum siap');
      return false;
    },
    bulkUpdateStatus: async () => {
      logger.warn('OrderProvider', 'bulkUpdateStatus called before ready');
      toast.error('Sistem belum siap');
      return false;
    },
    bulkDeleteOrders: async () => {
      logger.warn('OrderProvider', 'bulkDeleteOrders called before ready');
      toast.error('Sistem belum siap');
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
    getCompletedOrdersCount: () => 0,
    getCancelledOrdersCount: () => 0,
  }), []);

  // ✅ FIXED: Final context value with updateOrderStatus
  const contextValue = useMemo(() => {
    if (!isReady) {
      logger.debug('OrderProvider', 'Context not ready, returning empty state');
      return {
        orders: [],
        loading: true,
        isConnected: false,
        ...emptyContextMethods,
        contextReady: false,
      };
    }

    // ✅ FIXED: Return full context with updateOrderStatus
    const fullContext = {
      // Core data
      orders: orderData.orders,
      loading: orderData.loading,
      isConnected: orderData.isConnected,
      
      // ✅ FIXED: CRUD operations including updateOrderStatus
      addOrder: orderData.addOrder,
      updateOrder: orderData.updateOrder,
      updateOrderStatus: orderData.updateOrderStatus, // ✅ THIS WAS MISSING!
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
      getCompletedOrdersCount: utilityMethods.getCompletedOrdersCount,
      getCancelledOrdersCount: utilityMethods.getCancelledOrdersCount,
      
      // Ready flag
      contextReady: true,
    };

    logger.success('OrderProvider', '✅ Context fully ready', {
      userId: userId,
      orderCount: orderData.orders.length,
      loading: fullContext.loading,
      connected: fullContext.isConnected,
      hasUpdateOrderStatus: typeof fullContext.updateOrderStatus === 'function', // ✅ DEBUG
      timestamp: new Date().toISOString()
    });

    return fullContext;
  }, [
    isReady,
    orderData.orders,
    orderData.loading,
    orderData.isConnected,
    orderData.addOrder,
    orderData.updateOrder,
    orderData.updateOrderStatus, // ✅ FIXED: Add to dependencies
    orderData.deleteOrder,
    orderData.bulkUpdateStatus,
    orderData.bulkDeleteOrders,
    orderData.refreshData,
    orderData.getOrderById,
    orderData.getOrdersByStatus,
    utilityMethods,
    emptyContextMethods,
    userId
  ]);

  return (
    <FollowUpTemplateProvider>
      <OrderContext.Provider value={contextValue}>
        {children}
      </OrderContext.Provider>
    </FollowUpTemplateProvider>
  );
};