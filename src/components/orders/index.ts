// src/components/orders/index.ts
// 🎯 Clean main exports - NO DUPLICATES

// Main page component
export { default as OrdersPage } from './components/OrdersPage';

// Context (from context folder)
export { OrderProvider } from './context/OrderProvider';
export { useOrder } from './context/OrderContext';

// Hooks (from hooks folder)  
export { useOrderData } from './hooks/useOrderData';
export { useOrderUI } from './hooks/useOrderUI';

// Types (for external usage)
export type {
  Order,
  NewOrder,
  OrderStatus,
  OrderItem,
  OrderFilters,
  UseOrderDataReturn,
  UseOrderUIReturn
} from './types';

// Constants (for external usage)
export {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  getStatusText,
  getStatusColor
} from './constants';

// Utilities (for external usage)
export {
  transformOrderFromDB,
  transformOrderToDB,
  validateOrderData,
  formatDateForDisplay
} from './utils';