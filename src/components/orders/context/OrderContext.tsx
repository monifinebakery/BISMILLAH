// src/components/orders/context/OrderContext.tsx - FIXED with proper types
import { createContext, useContext } from 'react';
import type { Order } from '../types';

// ✅ COMPLETE: Enhanced context interface dengan semua features
export interface EnhancedOrderContextType {
  // Core data
  orders: Order[];
  loading: boolean;
  isConnected: boolean;
  
  // CRUD operations
  addOrder: (order: any) => Promise<boolean>;
  updateOrder: (id: string, updatedData: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  getOrderById: (id: string) => Order | undefined;
  getOrdersByStatus: (status: string) => Order[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  bulkUpdateStatus: (orderIds: string[], newStatus: string) => Promise<boolean>;
  bulkDeleteOrders: (orderIds: string[]) => Promise<boolean>;

  // React Query specific features
  invalidateOrders: () => void;
  prefetchOrders: () => void;
  getCachedOrderById: (id: string) => Order | undefined;
  getOrderStats: () => {
    total: number;
    thisMonth: number;
    lastMonth: number;
    completed: number;
    pending: number;
    totalRevenue: number;
    averageOrderValue: number;
  };

  // Query state information
  queryInfo: {
    isFetching: boolean;
    isError: boolean;
    lastUpdated: Date | null;
    cacheStatus: 'fresh' | 'stale' | 'idle';
  };
}

// ✅ SAFE: Default context value yang complete
const createDefaultContextValue = (): EnhancedOrderContextType => ({
  orders: [],
  loading: false,
  isConnected: false,
  addOrder: async () => {
    console.warn('OrderContext: addOrder called without provider');
    return false;
  },
  updateOrder: async () => {
    console.warn('OrderContext: updateOrder called without provider');
    return false;
  },
  deleteOrder: async () => {
    console.warn('OrderContext: deleteOrder called without provider');
    return false;
  },
  refreshData: async () => {
    console.warn('OrderContext: refreshData called without provider');
  },
  getOrderById: () => {
    console.warn('OrderContext: getOrderById called without provider');
    return undefined;
  },
  getOrdersByStatus: () => {
    console.warn('OrderContext: getOrdersByStatus called without provider');
    return [];
  },
  getOrdersByDateRange: () => {
    console.warn('OrderContext: getOrdersByDateRange called without provider');
    return [];
  },
  bulkUpdateStatus: async () => {
    console.warn('OrderContext: bulkUpdateStatus called without provider');
    return false;
  },
  bulkDeleteOrders: async () => {
    console.warn('OrderContext: bulkDeleteOrders called without provider');
    return false;
  },
  invalidateOrders: () => {
    console.warn('OrderContext: invalidateOrders called without provider');
  },
  prefetchOrders: () => {
    console.warn('OrderContext: prefetchOrders called without provider');
  },
  getCachedOrderById: () => {
    console.warn('OrderContext: getCachedOrderById called without provider');
    return undefined;
  },
  getOrderStats: () => {
    console.warn('OrderContext: getOrderStats called without provider');
    return {
      total: 0,
      thisMonth: 0,
      lastMonth: 0,
      completed: 0,
      pending: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };
  },
  queryInfo: {
    isFetching: false,
    isError: false,
    lastUpdated: null,
    cacheStatus: 'idle'
  }
});

// ✅ PROPER: Context creation dengan default value
const OrderContext = createContext<EnhancedOrderContextType>(createDefaultContextValue());

// ✅ ENHANCED: useOrder hook dengan better error handling dan development warnings
export const useOrder = () => {
  const context = useContext(OrderContext);
  
  // ✅ DEVELOPMENT: Warning untuk missing provider
  if (process.env.NODE_ENV === 'development') {
    // Check if we're using the default context (indicating missing provider)
    const defaultValue = createDefaultContextValue();
    if (context.orders === defaultValue.orders && 
        context.loading === defaultValue.loading &&
        !context.isConnected) {
      console.warn(
        'useOrder: Detected usage of default context value. ' +
        'Make sure OrderProvider wraps your component tree.'
      );
    }
  }
  
  return context;
};

// ✅ UTILITY: Hook untuk checking provider availability
export const useOrderAvailable = (): boolean => {
  const context = useOrder();
  return context.isConnected || context.orders.length > 0;
};

export default OrderContext;