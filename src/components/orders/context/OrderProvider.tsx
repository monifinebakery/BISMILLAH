// src/components/orders/context/OrderProvider.tsx - Optimized Dependencies (4 → 3)

import React, { ReactNode, useMemo } from 'react';
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

// ✅ ESSENTIAL: Local imports
import { useOrderData } from '../hooks/useOrderData';
import type { Order } from '../types';
import { safeParseDate, isValidDate } from '../utils';

// ❌ REMOVED: None - already well optimized

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  // ✅ CONTEXTS: All required contexts
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addFinancialTransaction } = useFinancial();
  const { settings } = useUserSettings();
  const { addNotification } = useNotification();

  // ✅ MEMOIZED: Dependency check for performance
  const contextDependencies = useMemo(() => {
    const hasAllDependencies = !!(user && addActivity && addFinancialTransaction && settings && addNotification);
    
    logger.context('OrderProvider', 'Dependency check', {
      user: user?.id,
      hasActivity: !!addActivity,
      hasFinancial: !!addFinancialTransaction,
      hasSettings: !!settings,
      hasNotification: !!addNotification,
      allReady: hasAllDependencies
    });

    return { hasAllDependencies, user };
  }, [user, addActivity, addFinancialTransaction, settings, addNotification]);

  // ✅ OPTIMIZED: Main data hook with all dependencies
  const orderData = useOrderData(
    contextDependencies.user,
    addActivity,
    addFinancialTransaction,
    settings,
    addNotification
  );

  // ✅ MEMOIZED: Utility methods for better performance
  const utilityMethods = useMemo(() => ({
    getOrdersByDateRange: (startDate: Date, endDate: Date): Order[] => {
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
    }
  }), [orderData.orders]);

  // ✅ MEMOIZED: Context value with all features
  const contextValue = useMemo(() => {
    const baseValue = {
      // Core data
      orders: orderData.orders,
      loading: orderData.loading,
      
      // CRUD operations
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
    };

    logger.context('OrderProvider', 'Context value created', {
      orderCount: orderData.orders.length,
      loading: orderData.loading,
      connected: orderData.isConnected,
      hasAllDependencies: contextDependencies.hasAllDependencies
    });

    return baseValue;
  }, [orderData, utilityMethods, contextDependencies.hasAllDependencies]);

  // ✅ MEMOIZED: Limited context for when user is not available
  const limitedContextValue = useMemo(() => {
    logger.context('OrderProvider', 'Providing limited context - no user');
    
    const noOpAsync = async () => {
      console.warn('OrderProvider: Operation called without user');
      return false;
    };

    const noOpVoid = async () => {
      console.warn('OrderProvider: Operation called without user');
    };

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
      getOrderById: () => undefined,
      getOrdersByStatus: () => [],
      getOrdersByDateRange: () => [],
    };
  }, []);

  // ✅ EARLY RETURN: Handle missing user with limited functionality
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