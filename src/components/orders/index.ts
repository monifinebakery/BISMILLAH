// ✅ CORE COMPONENT
export { default as OrdersPage } from './components/OrdersPage';

// ✅ CONTEXT EXPORTS
export { OrderProvider } from './context/OrderProvider';
export { useOrder } from './context/OrderContext';

// ✅ ESSENTIAL TYPES
export type { Order, NewOrder, OrderStatus, OrderItem } from './types';

// ✅ STANDARDIZED HOOKS - Following Purchase module pattern
export { useOrderCore } from './hooks/useOrderCore';
export { useOrderData, useOrderOperations, useOrderStats, useOrderQuery, orderQueryKeys } from './hooks/useOrderData';
export { useOrderConnection } from './hooks/useOrderConnection';
export { useOrderSubscription } from './hooks/useOrderSubscription';
export { useOrderUI } from './hooks/useOrderUI';

// ✅ CENTRALIZED VALIDATION - Following other modules pattern
export {
  validateOrderData,
  validateOrderItem,
  validateCustomerInfo,
  validateOrderItems,
  validateOrderFinancials,
  validateOrderStatusTransition,
  monitorOrderDataQuality,
  ORDER_VALIDATION_RULES
} from '../../utils/orderValidation';
