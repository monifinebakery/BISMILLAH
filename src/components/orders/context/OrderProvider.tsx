// src/components/orders/context/OrderProvider.tsx - DEBUG VERSION

import React, { ReactNode, useMemo, useEffect } from 'react';
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
  // ✅ DEBUG: Detailed logging for each context
  const authContext = useAuth();
  const activityContext = useActivity();
  const financialContext = useFinancial();
  const settingsContext = useUserSettings();
  const notificationContext = useNotification();

  // Extract values
  const { user } = authContext || {};
  const { addActivity } = activityContext || {};
  const { addTransaction } = financialContext || {};
  const { settings } = settingsContext || {};
  const { addNotification } = notificationContext || {};

  // ✅ DEBUG: Log each context state
  useEffect(() => {
    logger.debug('OrderProvider', 'Context states:', {
      authContext: {
        exists: !!authContext,
        user: user?.id || 'no_user',
        userEmail: user?.email || 'no_email'
      },
      activityContext: {
        exists: !!activityContext,
        hasAddActivity: !!addActivity,
        addActivityType: typeof addActivity
      },
      financialContext: {
        exists: !!financialContext,
        hasAddTransaction: !!addTransaction,
        addTransactionType: typeof addTransaction
      },
      settingsContext: {
        exists: !!settingsContext,
        hasSettings: !!settings,
        settingsType: typeof settings
      },
      notificationContext: {
        exists: !!notificationContext,
        hasAddNotification: !!addNotification,
        addNotificationType: typeof addNotification
      }
    });
  }, [authContext, activityContext, financialContext, settingsContext, notificationContext, user, addActivity, addTransaction, settings, addNotification]);

  // ✅ ALWAYS call useOrderData with all parameters
  const orderData = useOrderData(
    user,
    addActivity,
    addTransaction,
    settings,
    addNotification
  );

  // ✅ DEPENDENCY CHECK: Enhanced debugging
  const contextDependencies = useMemo(() => {
    const hasUser = !!user;
    const hasActivity = !!addActivity;
    const hasFinancial = !!addTransaction;
    const hasSettings = !!settings;
    const hasNotification = !!addNotification;
    
    const hasAllDependencies = hasUser && hasActivity && hasFinancial && hasSettings && hasNotification;
    
    // ✅ DETAILED LOGGING: Which dependencies are missing
    const missingDependencies = [];
    if (!hasUser) missingDependencies.push('user');
    if (!hasActivity) missingDependencies.push('activity');
    if (!hasFinancial) missingDependencies.push('financial');
    if (!hasSettings) missingDependencies.push('settings');
    if (!hasNotification) missingDependencies.push('notification');
    
    logger.context('OrderProvider', 'Dependency check', {
      user: user?.id || 'MISSING',
      hasActivity,
      hasFinancial,
      hasSettings,
      hasNotification,
      allReady: hasAllDependencies,
      missingDependencies,
      readyCount: [hasUser, hasActivity, hasFinancial, hasSettings, hasNotification].filter(Boolean).length,
      totalCount: 5
    });

    // ✅ WARNING: If stuck loading for too long
    if (!hasAllDependencies) {
      logger.warn('OrderProvider', 'Some dependencies still not ready:', {
        missing: missingDependencies,
        authContextExists: !!authContext,
        activityContextExists: !!activityContext,
        financialContextExists: !!financialContext,
        settingsContextExists: !!settingsContext,
        notificationContextExists: !!notificationContext
      });
    }

    return { 
      hasAllDependencies, 
      user,
      hasUser,
      hasActivity,
      hasFinancial, 
      hasSettings,
      hasNotification,
      missingDependencies
    };
  }, [user, addActivity, addTransaction, settings, addNotification, authContext, activityContext, financialContext, settingsContext, notificationContext]);

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
      logger.context('OrderProvider', 'Providing loading context - dependencies not ready', {
        missing: contextDependencies.missingDependencies
      });
      
      const noOpAsync = async () => {
        logger.warn('OrderProvider: Operation called before contexts ready, missing:', contextDependencies.missingDependencies);
        return false;
      };

      const noOpVoid = async () => {
        logger.warn('OrderProvider: Operation called before contexts ready, missing:', contextDependencies.missingDependencies);
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
        // ✅ DEBUG INFO: Add debug info to context
        debugInfo: {
          missingDependencies: contextDependencies.missingDependencies,
          hasUser: contextDependencies.hasUser,
          hasActivity: contextDependencies.hasActivity,
          hasFinancial: contextDependencies.hasFinancial,
          hasSettings: contextDependencies.hasSettings,
          hasNotification: contextDependencies.hasNotification
        }
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
      debugInfo: {
        allReady: true,
        orderCount: orderData.orders.length
      }
    };

    logger.success('OrderProvider', 'Providing full context - all ready!', {
      orderCount: orderData.orders.length,
      loading: baseValue.loading,
      connected: baseValue.isConnected
    });

    return baseValue;
  }, [orderData, utilityMethods, contextDependencies.hasAllDependencies, contextDependencies.missingDependencies]);

  // ✅ TIMEOUT WARNING: Warn if loading too long
  useEffect(() => {
    if (!contextDependencies.hasAllDependencies) {
      const timeout = setTimeout(() => {
        logger.error('OrderProvider', '🚨 CONTEXTS STILL NOT READY AFTER 10 SECONDS!', {
          missing: contextDependencies.missingDependencies,
          troubleshooting: {
            checkAuthProvider: 'Is AuthProvider wrapping the app?',
            checkActivityProvider: 'Is ActivityProvider wrapping the app?',
            checkFinancialProvider: 'Is FinancialProvider wrapping the app?',
            checkSettingsProvider: 'Is UserSettingsProvider wrapping the app?',
            checkNotificationProvider: 'Is NotificationProvider wrapping the app?'
          }
        });
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [contextDependencies.hasAllDependencies, contextDependencies.missingDependencies]);

  // ✅ ALWAYS RENDER: Let individual components handle loading states
  return (
    <FollowUpTemplateProvider>
      <OrderContext.Provider value={contextValue}>
        {children}
      </OrderContext.Provider>
    </FollowUpTemplateProvider>
  );
};