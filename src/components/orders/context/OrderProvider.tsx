// 🎯 Enhanced OrderProvider dengan FollowUpTemplate Integration
import React, { ReactNode } from 'react';
import { logger } from '@/utils/logger';
import OrderContext from './OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useFinancial } from '@/components/financial/contexts/FinancialContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useNotification } from '@/contexts/NotificationContext';
import { FollowUpTemplateProvider } from '@/contexts/FollowUpTemplateContext';
import { useOrderData } from '../hooks/useOrderData';
import type { Order } from '../types';
import { safeParseDate, isValidDate } from '../utils';

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addFinancialTransaction } = useFinancial();
  const { settings } = useUserSettings();
  const { addNotification } = useNotification();

  logger.context('OrderProvider', 'Provider render', { 
    user: user?.id,
    hasActivity: !!addActivity,
    hasFinancial: !!addFinancialTransaction,
    hasSettings: !!settings,
    hasNotification: !!addNotification,
  });

  // Initialize main data hook dengan semua dependencies dari kode asli
  const orderData = useOrderData(
    user,
    addActivity,
    addFinancialTransaction,
    settings,
    addNotification
  );

  // Enhanced utility methods dari kode asli
  const getOrdersByDateRange = (startDate: Date, endDate: Date): Order[] => {
    try {
      if (!isValidDate(startDate) || !isValidDate(endDate)) {
        console.error('OrderProvider: Invalid dates for getOrdersByDateRange:', { startDate, endDate });
        return [];
      }
      
      return orderData.orders.filter(order => {
        try {
          const orderDate = safeParseDate(order.tanggal);
          if (!orderDate) return false;
          return orderDate >= startDate && orderDate <= endDate;
        } catch (error) {
          console.error('OrderProvider: Error processing order date:', error, order);
          return false;
        }
      });
    } catch (error) {
      console.error('OrderProvider: Error in getOrdersByDateRange:', error);
      return [];
    }
  };

  // Enhanced context value dengan semua fitur dari kode asli
  const value = {
    // Core data
    orders: orderData.orders,
    loading: orderData.loading,
    
    // CRUD operations dengan semua logika asli
    addOrder: orderData.addOrder,
    updateOrder: orderData.updateOrder, 
    deleteOrder: orderData.deleteOrder,
    
    // Enhanced features dari kode asli
    isConnected: orderData.isConnected,
    refreshData: orderData.refreshData,
    getOrderById: orderData.getOrderById,
    getOrdersByStatus: orderData.getOrdersByStatus,
    getOrdersByDateRange,
    bulkUpdateStatus: orderData.bulkUpdateStatus,
    bulkDeleteOrders: orderData.bulkDeleteOrders,
  };

  logger.context('OrderProvider', 'Providing context value:', {
    orderCount: orderData.orders.length,
    loading: orderData.loading,
    connected: orderData.isConnected,
    hasAllDependencies: !!(user && addActivity && addFinancialTransaction && settings && addNotification)
  });

  // Handle missing dependencies seperti kode asli
  if (!user) {
    logger.context('OrderProvider', 'No user found, providing limited context');
    return (
      <FollowUpTemplateProvider>
        <OrderContext.Provider value={{
          ...value,
          orders: [],
          loading: false,
          isConnected: false,
          addOrder: async () => {
            console.warn('OrderProvider: addOrder called without user');
            return false;
          },
          updateOrder: async () => {
            console.warn('OrderProvider: updateOrder called without user');
            return false;
          },
          deleteOrder: async () => {
            console.warn('OrderProvider: deleteOrder called without user');
            return false;
          },
          bulkUpdateStatus: async () => {
            console.warn('OrderProvider: bulkUpdateStatus called without user');
            return false;
          },
          bulkDeleteOrders: async () => {
            console.warn('OrderProvider: bulkDeleteOrders called without user');
            return false;
          },
          refreshData: async () => {
            console.warn('OrderProvider: refreshData called without user');
          },
          getOrderById: () => undefined,
          getOrdersByStatus: () => [],
          getOrdersByDateRange: () => [],
        }}>
          {children}
        </OrderContext.Provider>
      </FollowUpTemplateProvider>
    );
  }

  return (
    <FollowUpTemplateProvider>
      <OrderContext.Provider value={value}>
        {children}
      </OrderContext.Provider>
    </FollowUpTemplateProvider>
  );
};