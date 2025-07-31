// src/components/purchase/index.ts

// Main exports
export { default as PurchasePage } from './PurchasePage';

// Context exports
export {
  PurchaseProvider,
  usePurchase,
  PurchaseTableProvider,
  usePurchaseTable,
} from './context';

// Component exports (lazy loaded)
export {
  LoadingState,
  EmptyState,
  DataWarningBanner,
  PurchaseHeader,
  PurchaseDialog,
  PurchaseTable,
  BulkActionsToolbar,
  BulkDeleteDialog,
} from './components';

// Utility exports
export {
  calculatePurchaseStats,
  filterPurchasesByStatus,
  searchPurchases,
  sortPurchases,
  getStatusDisplayText,
  getStatusColor,
  validatePurchaseData,
  exportPurchasesToCSV,
  transformPurchaseFromDB,
  transformPurchaseForDB,
} from './utils';

// Type exports
export type {
  Purchase,
  PurchaseItem,
  PurchaseStatus,
  CalculationMethod,
  PurchaseStats,
  PurchaseContextType,
  PurchaseTableContextType,
} from './types/purchase.types';