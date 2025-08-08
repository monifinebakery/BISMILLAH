// src/components/orders/context/index.ts - Optimized Dependencies (2 → 2)
/**
 * Orders Context - Essential Context Exports
 * 
 * Clean context exports with no component mixing
 * Dependencies maintained at 2 for essential context functionality
 */
// ✅ ESSENTIAL CONTEXT: Core context exports
export { OrderProvider } from './OrderProvider';
export { useOrder } from './OrderContext';
import { logger } from '@/utils/logger';
// ✅ CONTEXT COMPONENT: Default context export for advanced usage
export { default as OrderContext } from './OrderContext';
// ❌ NOT CHANGED: These are the minimal essential context exports
// No reduction possible without breaking functionality
// ✅ CONTEXT UTILITIES: Helper functions for context usage
export const ORDERS_CONTEXT_UTILS = {
  // Context validation helper
  validateContext: (contextValue: any) => {
    const requiredMethods = [
      'orders',
      'loading', 
      'addOrder',
      'updateOrder',
      'deleteOrder'
    ];
    
    return requiredMethods.every(method => 
      contextValue && typeof contextValue[method] !== 'undefined'
    );
  },
  
  // Context debugging helper
  debugContext: (contextValue: any) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Orders Context Debug');
      logger.debug('Orders count:', contextValue?.orders?.length || 0);
      logger.debug('Loading state:', contextValue?.loading || false);
      logger.debug('Available methods:', Object.keys(contextValue || {}));
    }
  },
  
  // Context status checker
  getContextStatus: (contextValue: any) => {
    return {
      isInitialized: !!contextValue,
      hasOrders: !!(contextValue?.orders?.length),
      isLoading: !!(contextValue?.loading),
      isConnected: !!(contextValue?.isConnected),
      methodCount: Object.keys(contextValue || {}).length
    };
  }
} as const;
// ✅ CONTEXT CONFIGURATION: Context-specific settings
export const CONTEXT_CONFIG = {
  // Provider settings
  provider: {
    displayName: 'OrderProvider',
    errorBoundary: true,
    devtools: process.env.NODE_ENV === 'development'
  },
  
  // Hook settings
  hook: {
    displayName: 'useOrder',
    throwOnMissingProvider: true,
    enableWarnings: process.env.NODE_ENV === 'development'
  },
  
  // Performance settings
  performance: {
    memoizeSelectors: true,
    debounceUpdates: 100, // ms
    maxRecentOrders: 1000 // Keep in memory
  }
} as const;
// ✅ CONTEXT TYPES: Re-export context types for convenience
export type {
  OrderContextType,
  UseOrderReturn
} from '../types';
// ✅ MIGRATION HELPER: For context usage patterns
export const ORDERS_CONTEXT_MIGRATION = {
  instructions: `
    // RECOMMENDED (current pattern):
    import { OrderProvider, useOrder } from '@/components/orders/context';
    
    // FOR ADVANCED USAGE:
    import OrderContext from '@/components/orders/context/OrderContext';
    
    // USAGE PATTERN:
    function MyApp() {
      return (
        <OrderProvider>
          <MyOrderComponent />
        </OrderProvider>
      );
    }
    
    function MyOrderComponent() {
      const { orders, loading, addOrder } = useOrder();
      return <div>{/* component content */}</div>;
    }
  `,
  
  // Context setup helper
  createContextSetup: () => ({
    Provider: OrderProvider,
    useContext: useOrder,
    Context: OrderContext,
    utils: ORDERS_CONTEXT_UTILS,
    config: CONTEXT_CONFIG
  })
} as const;