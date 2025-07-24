// Purchase hooks exports with dynamic imports for code splitting

// Core operations hook
export { usePurchaseOperations } from './usePurchaseOperations';

// Table management hook  
export const PurchaseTableHook = {
  usePurchaseTable: () => import('./usePurchaseTable').then(m => m.usePurchaseTable),
};

// Form management hook
export { usePurchaseForm } from './usePurchaseForm';

// Bulk operations hook
export { useBulkOperations } from './useBulkOperations';

// Search and filter hook
export { usePurchaseSearch } from './usePurchaseSearch';

// Notifications hook
export { usePurchaseNotifications } from './usePurchaseNotifications';

// Combined hook for main purchase page
export const usePurchaseManagement = (options: {
  suppliers: any[];
  bahanBaku: any[];
}) => {
  // This could be a combined hook that uses multiple hooks
  // and provides a unified interface for the main component
  
  return {
    // Lazy load individual hooks as needed
    operations: () => import('./usePurchaseOperations').then(m => 
      m.usePurchaseOperations({ suppliers: options.suppliers })
    ),
    form: () => import('./usePurchaseForm').then(m => 
      m.usePurchaseForm()
    ),
    search: () => import('./usePurchaseSearch').then(m => 
      m.usePurchaseSearch({ 
        purchases: [], // Would be passed from parent
        suppliers: options.suppliers 
      })
    ),
    bulk: () => import('./useBulkOperations').then(m => 
      m.useBulkOperations({
        purchases: [], // Would be passed from parent
        suppliers: options.suppliers,
        selectedIds: []
      })
    ),
    notifications: () => import('./usePurchaseNotifications').then(m => 
      m.usePurchaseNotifications({ suppliers: options.suppliers })
    ),
  };
};