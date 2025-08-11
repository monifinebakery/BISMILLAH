// src/components/orders/context/OrderProvider.tsx - Fixed with graceful loading

import React, { ReactNode, useMemo, useEffect, useState } from 'react';
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

// ✅ LOADING STATES: Track individual context loading states
interface ContextLoadingState {
  auth: boolean;
  activity: boolean;
  financial: boolean;
  settings: boolean;
  notification: boolean;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  // ✅ LOADING STATE: Track context readiness
  const [contextLoading, setContextLoading] = useState<ContextLoadingState>({
    auth: true,
    activity: true,
    financial: true,
    settings: true,
    notification: true
  });

  // Contexts with error handling
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addTransaction } = useFinancial();
  const { settings } = useUserSettings();
  const { addNotification } = useNotification();

  // ✅ ENHANCED: Context dependency tracking with individual loading states
  const contextDependencies = useMemo(() => {
    const hasUser = !!user;
    const hasActivity = !!addActivity;
    const hasFinancial = !!addTransaction;
    const hasSettings = !!settings;
    const hasNotification = !!addNotification;
    
    const hasAllDependencies = hasUser && hasActivity && hasFinancial && hasSettings && hasNotification;
    
    // Update loading states
    setContextLoading(prev => ({
      auth: !hasUser,
      activity: !hasActivity,
      financial: !hasFinancial,
      settings: !hasSettings,
      notification: !hasNotification
    }));
    
    logger.context('OrderProvider', 'Dependency check', {
      user: user?.id || 'loading',
      hasActivity,
      hasFinancial,
      hasSettings,
      hasNotification,
      allReady: hasAllDependencies,
      loadingStates: {
        auth: !hasUser,
        activity: !hasActivity,
        financial: !hasFinancial,
        settings: !hasSettings,
        notification: !hasNotification
      }
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

  // ✅ CONDITIONAL HOOK USAGE: Only use orderData when all dependencies are ready
  const orderData = useOrderData(
    contextDependencies.hasAllDependencies ? contextDependencies.user : null,
    contextDependencies.hasAllDependencies ? addActivity : null,
    contextDependencies.hasAllDependencies ? addTransaction : null,
    contextDependencies.hasAllDependencies ? settings : null,
    contextDependencies.hasAllDependencies ? addNotification : null
  );

  // ✅ ENHANCED: Utility methods with error boundaries
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

  // ✅ ENHANCED: Context value with loading states
  const contextValue = useMemo(() => {
    const baseValue = {
      // Core data
      orders: orderData.orders,
      loading: orderData.loading || !contextDependencies.hasAllDependencies,
      
      // CRUD operations
      addOrder: orderData.addOrder,
      updateOrder: orderData.updateOrder,
      deleteOrder: orderData.deleteOrder,
      
      // Enhanced features
      isConnected: orderData.isConnected && contextDependencies.hasAllDependencies,
      refreshData: orderData.refreshData,
      getOrderById: orderData.getOrderById,
      getOrdersByStatus: orderData.getOrdersByStatus,
      getOrdersByDateRange: utilityMethods.getOrdersByDateRange,
      bulkUpdateStatus: orderData.bulkUpdateStatus,
      bulkDeleteOrders: orderData.bulkDeleteOrders,
      
      // ✅ NEW: Loading state info
      contextReady: contextDependencies.hasAllDependencies,
      contextLoadingStates: contextLoading,
    };

    logger.context('OrderProvider', 'Context value created', {
      orderCount: orderData.orders.length,
      loading: baseValue.loading,
      connected: baseValue.isConnected,
      contextReady: contextDependencies.hasAllDependencies,
      loadingStates: contextLoading
    });

    return baseValue;
  }, [orderData, utilityMethods, contextDependencies.hasAllDependencies, contextLoading]);

  // ✅ ENHANCED: Limited context for when dependencies are not ready
  const limitedContextValue = useMemo(() => {
    logger.context('OrderProvider', 'Providing limited context - dependencies not ready');
    
    const noOpAsync = async () => {
      logger.warn('OrderProvider: Operation called before contexts ready');
      return false;
    };

    const noOpVoid = async () => {
      logger.warn('OrderProvider: Operation called before contexts ready');
    };

    return {
      orders: [],
      loading: true, // ✅ Show loading when contexts not ready
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
      contextLoadingStates: contextLoading,
    };
  }, [contextLoading]);

  // ✅ LOADING COMPONENT: Show loading while contexts are initializing
  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Memuat Order System</h3>
          <p className="text-sm text-gray-600 mb-4">Menginisialisasi sistem pesanan...</p>
          
          {/* ✅ LOADING DETAILS: Show which contexts are still loading */}
          <div className="space-y-2 text-xs text-left">
            {Object.entries(contextLoading).map(([context, isLoading]) => (
              <div key={context} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="capitalize">{context} Context</span>
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-orange-500"></div>
                    <span className="text-orange-600">Loading...</span>
                  </div>
                ) : (
                  <span className="text-green-600">✓ Ready</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ✅ CONDITIONAL RENDERING: Show loading until all contexts are ready
  if (!contextDependencies.hasAllDependencies) {
    return (
      <FollowUpTemplateProvider>
        <OrderContext.Provider value={limitedContextValue}>
          <LoadingFallback />
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