// src/components/orders/context/OrderProvider.tsx - FINAL FIX: No Conditional Hooks

import React, { ReactNode, useMemo } from 'react';
import { logger } from '@/utils/logger';

// Context imports
import OrderContext from './OrderContext';
import { FollowUpTemplateProvider } from '@/contexts/FollowUpTemplateContext';

// External contexts
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useFinancial } from '@/components/financial/contexts/FinancialContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useNotification } from '@/contexts/NotificationContext';

// Local imports
import { useOrderData } from '../hooks/useOrderData';
import type { Order } from '../types';
import { safeParseDate, isValidDate } from '../utils';

interface OrderProviderProps {
  children: ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  // ✅ FIXED: ALL HOOKS CALLED UNCONDITIONALLY AT TOP LEVEL
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addTransaction } = useFinancial();
  const { settings } = useUserSettings();
  const { addNotification } = useNotification();

  // ✅ FIXED: ALWAYS call useOrderData with all parameters
  // Pass the actual values, useOrderData will handle null checks internally
  const orderData = useOrderData(
    user,           // Always pass user (can be null)
    addActivity,    // Always pass addActivity (can be null)
    addTransaction, // Always pass addTransaction (can be null)
    settings,       // Always pass settings (can be null)
    addNotification // Always pass addNotification (can be null)
  );

  // ✅ DEPENDENCY CHECK: Moved after hooks
  const contextDependencies = useMemo(() => {
    const hasUser = !!user;
    const hasActivity = !!addActivity;
    const hasFinancial = !!addTransaction;
    const hasSettings = !!settings;
    const hasNotification = !!addNotification;
    
    const hasAllDependencies = hasUser && hasActivity && hasFinancial && hasSettings && hasNotification;
    
    logger.context('OrderProvider', 'Dependency check', {
      user: user?.id || 'not_ready',
      hasActivity,
      hasFinancial,
      hasSettings,
      hasNotification,
      allReady: hasAllDependencies
    });

    return { 
      hasAllDependencies, 
      user,
      hasUser,
      hasActivity,
      hasFinancial, 
      hasSettings,
      hasNotification
    };
  }, [user, addActivity, addTransaction, settings, addNotification]);

  // ✅ UTILITY METHODS: With dependency checks
  const utilityMethods = useMemo(() => ({
    getOrdersByDateRange: (startDate: Date, endDate: Date): Order[] => {
      try {
        if (!contextDependencies.hasAllDependencies) {
          logger.warn('OrderProvider: getOrdersByDateRange called before contexts ready');
          return [];
        }
        
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
    }
  }), [orderData.orders, contextDependencies.hasAllDependencies]);

  // ✅ CONTEXT VALUE: With proper loading states
  const contextValue = useMemo(() => {
    // If contexts not ready, provide loading state
    if (!contextDependencies.hasAllDependencies) {
      logger.context('OrderProvider', 'Providing loading context - dependencies not ready');
      
      const noOpAsync = async () => {
        logger.warn('OrderProvider: Operation called before contexts ready');
        return false;
      };

      const noOpVoid = async () => {
        logger.warn('OrderProvider: Operation called before contexts ready');
      };

      return {
        orders: [],
        loading: true,
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
        contextReady: false,
      };
    }

    // All contexts ready, provide full functionality
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
      
      // Context state
      contextReady: true,
    };

    logger.context('OrderProvider', 'Providing full context - all ready', {
      orderCount: orderData.orders.length,
      loading: baseValue.loading,
      connected: baseValue.isConnected
    });

    return baseValue;
  }, [orderData, utilityMethods, contextDependencies.hasAllDependencies]);

  // ✅ NO LOADING FALLBACK: Just provide limited context and render children
  // The loading state will be handled by individual components that need the data

  // ✅ ALWAYS RENDER: Let individual components handle loading states
  return (
    <FollowUpTemplateProvider>
      <OrderContext.Provider value={contextValue}>
        {children}
      </OrderContext.Provider>
    </FollowUpTemplateProvider>
  );
};