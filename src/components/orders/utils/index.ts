// src/components/orders/utils/index.ts - Export dari utils yang sudah Anda buat
// Re-export dari utils.ts dan constants.ts yang sudah dioptimasi
export * from './utils';
export * from './constants';

// Pastikan semua exports yang diperlukan tersedia
export {
  // Date utilities
  isValidDate,
  safeParseDate,
  toSafeISOString,
  formatDateForDisplay,
  
  // Data transformers
  transformOrderFromDB,
  transformOrderToDB,
  
  // Validation
  validateOrderData,
  
  // Analytics
  calculateOrderStats,
  groupOrdersByStatus,
  
  // Search & filter
  searchOrders,
  filterOrdersByStatus,
  
  // Utils object
  OrderUtils
} from './utils';

export {
  // Status definitions
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  EDITABLE_STATUSES,
  FINAL_STATUSES,
  ACTIVE_STATUSES,
  DEFAULT_ORDER_STATUS,
  
  // Helper functions
  getStatusText,
  getStatusColor,
  isEditableStatus,
  isFinalStatus,
  isActiveStatus,
  canTransitionTo,
  
  // Constants object
  OrderConstants
} from './constants';

// Recipe integration helpers (if available in your types)
export {
  calculateRecipeStats,
  getRecipeUsageByOrder
} from '../types';