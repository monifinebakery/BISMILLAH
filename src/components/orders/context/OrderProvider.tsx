// src/components/orders/context/OrderProvider.tsx - ULTRA SIMPLIFIED (No External Context Dependencies)

import React, { ReactNode, useMemo, useEffect, useRef } from 'react';
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

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const mountedRef = useRef(true);

  // ✅ ULTRA SIMPLE: Direct implementations with no external dependencies
  const addActivityDirect = async (activity: { title: string; description: string; type: string }) => {
    try {
      // Direct database insert instead of context
      if (user?.id) {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('activities').insert({
          user_id: user.id,
          title: activity.title,
          description: activity.description,
          type: activity.type,
          value: null
        });
      }
      
      // Show simple toast
      toast(`📝 ${activity.title}`, { 
        description: activity.description,
        duration: 3000 
      });
      
      logger.debug('OrderProvider', 'Activity logged directly:', activity.title);
    } catch (error) {
      logger.error('OrderProvider', 'Failed to log activity:', error);
    }
  };

  const addTransactionDirect = async (transaction: any) => {
    try {
      // Direct database insert instead of context
      if (user?.id) {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('financial_transactions').insert({
          user_id: user.id,
          type: 'income',
          category: transaction.category || 'Penjualan Produk',
          amount: transaction.amount,
          description: transaction.description,
          date: transaction.date || new Date().toISOString(),
          notes: null,
          related_id: transaction.relatedId
        });
      }
      
      // Show formatted toast
      toast.success(`💰 Transaksi Dicatat`, { 
        description: `${transaction.description}: ${new Intl.NumberFormat('id-ID', { 
          style: 'currency', 
          currency: 'IDR' 
        }).format(transaction.amount)}`,
        duration: 4000 
      });
      
      logger.debug('OrderProvider', 'Transaction logged directly:', transaction.description);
    } catch (error) {
      logger.error('OrderProvider', 'Failed to log transaction:', error);
      // Fallback to toast only
      toast.success(`💰 Pemasukan Dicatat`, { 
        description: `${transaction.description}: ${new Intl.NumberFormat('id-ID', { 
          style: 'currency', 
          currency: 'IDR' 
        }).format(transaction.amount)}`,
        duration: 4000 
      });
    }
  };

  const settingsDirect = {
    financialCategories: {
      income: ['Penjualan Produk', 'Penjualan Jasa', 'Lainnya'],
      expense: ['Biaya Operasional', 'Biaya Bahan', 'Lainnya']
    },
    currency: 'IDR',
    taxRate: 0.11
  };

  const addNotificationDirect = async (notification: any) => {
    try {
      // Direct database insert instead of context
      if (user?.id) {
        const { supabase } = await import('@/integrations/supabase/client');
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: notification.title,
          message: notification.message,
          type: notification.type || 'info',
          icon: notification.icon,
          priority: notification.priority || 2,
          related_type: notification.related_type,
          related_id: notification.related_id,
          action_url: notification.action_url,
          is_read: false,
          is_archived: false
        });
      }
      
      // Show toast notification
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
      
      logger.debug('OrderProvider', 'Notification created directly:', title);
    } catch (error) {
      logger.error('OrderProvider', 'Failed to create notification:', error);
      
      // Fallback to toast only
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
    }
  };

  // ✅ CALL useOrderData with direct implementations
  const orderData = useOrderData(
    user,
    addActivityDirect,
    addTransactionDirect,
    settingsDirect,
    addNotificationDirect
  );

  const isReady = !!user;

  // ✅ Component mount/unmount tracking
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  logger.context('OrderProvider', 'Ultra simplified mode', {
    hasUser: !!user,
    userId: user?.id || 'no_user',
    isReady,
    orderCount: orderData.orders.length,
    loading: orderData.loading,
    connected: orderData.isConnected,
    mode: 'ultra_simplified_direct_db'
  });

  // ✅ UTILITY METHODS
  const utilityMethods = useMemo(() => ({
    getOrdersByDateRange: (startDate: Date, endDate: Date): Order[] => {
      try {
        if (!isValidDate(startDate) || !isValidDate(endDate)) {
          return [];
        }
        
        return orderData.orders.filter(order => {
          try {
            const orderDate = safeParseDate(order.tanggal);
            if (!orderDate) return false;
            return orderDate >= startDate && orderDate <= endDate;
          } catch (error) {
            return false;
          }
        });
      } catch (error) {
        logger.error('OrderProvider: Error in getOrdersByDateRange:', error);
        return [];
      }
    }
  }), [orderData.orders]);

  // ✅ CONTEXT VALUE
  const contextValue = useMemo(() => {
    if (!isReady) {
      return {
        orders: [],
        loading: true,
        isConnected: false,
        addOrder: async () => false,
        updateOrder: async () => false,
        deleteOrder: async () => false,
        bulkUpdateStatus: async () => false,
        bulkDeleteOrders: async () => false,
        refreshData: async () => {},
        getOrderById: () => undefined,
        getOrdersByStatus: () => [],
        getOrdersByDateRange: () => [],
        contextReady: false,
      };
    }

    const baseValue = {
      orders: orderData.orders,
      loading: orderData.loading,
      addOrder: orderData.addOrder,
      updateOrder: orderData.updateOrder,
      deleteOrder: orderData.deleteOrder,
      isConnected: orderData.isConnected,
      refreshData: orderData.refreshData,
      getOrderById: orderData.getOrderById,
      getOrdersByStatus: orderData.getOrdersByStatus,
      getOrdersByDateRange: utilityMethods.getOrdersByDateRange,
      bulkUpdateStatus: orderData.bulkUpdateStatus,
      bulkDeleteOrders: orderData.bulkDeleteOrders,
      contextReady: true,
    };

    logger.success('OrderProvider', '🚀 ULTRA SIMPLIFIED MODE READY!', {
      userId: user?.id,
      orderCount: orderData.orders.length,
      loading: baseValue.loading,
      connected: baseValue.isConnected,
      mode: 'ultra_simplified_direct_operations',
      loadTime: Date.now()
    });

    return baseValue;
  }, [orderData, utilityMethods, isReady, user]);

  return (
    <FollowUpTemplateProvider>
      <OrderContext.Provider value={contextValue}>
        {children}
      </OrderContext.Provider>
    </FollowUpTemplateProvider>
  );
};