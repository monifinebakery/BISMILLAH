// 🎯 25 lines - Main exports
// Main page component
export { default as OrdersPage } from './components/OrdersPage';

// Context
export { OrderProvider } from './context/OrderProvider';
export { useOrder } from './context/OrderContext';

// Hooks
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