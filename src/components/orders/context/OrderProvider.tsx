// src/components/orders/context/OrderProvider.tsx - FINAL SIMPLIFIED

import React, { ReactNode, useMemo } from 'react';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

// Context imports
import OrderContext from './OrderContext';
import { FollowUpTemplateProvider } from '@/contexts/FollowUpTemplateContext';

// ✅ ONLY Auth dependency
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

  // ✅ LOCAL IMPLEMENTATIONS - No external context dependencies
  const addActivityLocal = async (activity: { title: string; description: string; type: string }) => {
    try {
      // Simple toast notification instead of context
      toast(`📝 ${activity.title}`, { 
        description: activity.description,
        duration: 3000 
      });
      
      logger.debug('OrderProvider', 'Activity logged:', activity.title);
    } catch (error) {
      logger.error('OrderProvider', 'Failed to log activity:', error);
    }
  };

  const addTransactionLocal = async (transaction: any) => {
    try {
      // Simple toast notification for financial transaction
      toast.success(`💰 Transaksi Dicatat`, { 
        description: `${transaction.description}: ${new Intl.NumberFormat('id-ID', { 
          style: 'currency', 
          currency: 'IDR' 
        }).format(transaction.amount)}`,
        duration: 4000 
      });
      
      logger.debug('OrderProvider', 'Transaction logged:', transaction.description);
    } catch (error) {
      logger.error('OrderProvider', 'Failed to log transaction:', error);
    }
  };

  const settingsLocal = {
    financialCategories: {
      income: ['Penjualan Produk', 'Penjualan Jasa', 'Lainnya'],
      expense: ['Biaya Operasional', 'Biaya Bahan', 'Lainnya']
    },
    currency: 'IDR',
    taxRate: 0.11
  };

  const addNotificationLocal = async (notification: any) => {
    try {
      // Simple toast notification instead of notification context
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
      
      logger.debug('OrderProvider', 'Notification shown:', title);
    } catch (error) {
      logger.error('OrderProvider', 'Failed to show notification:', error);
    }
  };

  // ✅ CALL useOrderData with local implementations
  const orderData = useOrderData(
    user,
    addActivityLocal,
    addTransactionLocal,
    settingsLocal,
    addNotificationLocal
  );

  const isReady = !!user;

  logger.context('OrderProvider', 'Simplified mode ready', {
    hasUser: !!user,
    userId: user?.id || 'no_user',
    isReady,
    orderCount: orderData.orders.length,
    loading: orderData.loading,
    connected: orderData.isConnected
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

    logger.success('OrderProvider', '🚀 SIMPLIFIED MODE FULLY READY!', {
      userId: user?.id,
      orderCount: orderData.orders.length,
      loading: baseValue.loading,
      connected: baseValue.isConnected,
      mode: 'simplified_no_external_deps',
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