// Main purchase feature exports with dynamic imports and code splitting

// Contexts - immediately available
export { PurchaseProvider, usePurchase } from './PurchaseContext';
export { PurchaseTableProvider, usePurchaseTable } from './PurchaseTableContext';

// Services - lazy loaded
export const PurchaseServices = {
  service: () => import('./services/purchaseService').then(m => m.PurchaseService),
  transformers: () => import('./services/purchaseTransformers'),
  validators: () => import('./services/purchaseValidators'),
  utils: () => import('./services/index'),
};

// Hooks - lazy loaded
export const PurchaseHooks = {
  operations: () => import('./hooks/usePurchaseOperations').then(m => m.usePurchaseOperations),
  form: () => import('./hooks/usePurchaseForm').then(m => m.usePurchaseForm),
  search: () => import('./hooks/usePurchaseSearch').then(m => m.usePurchaseSearch),
  bulk: () => import('./hooks/useBulkOperations').then(m => m.useBulkOperations),
  notifications: () => import('./hooks/usePurchaseNotifications').then(m => m.usePurchaseNotifications),
  management: () => import('./hooks/index').then(m => m.usePurchaseManagement),
};

// Components - lazy loaded with React.lazy
export const PurchaseComponents = {
  // Main page component
  ManagementPage: () => import('../layout/PurchasePage').then(m => m.default),
  
  // Layout components
  Header: () => import('../layout/PurchaseHeader').then(m => m.default),
  
  // Table components
  Table: () => import('../table/PurchaseTable').then(m => m.default),
  TableRow: () => import('../table/PurchaseTableRow').then(m => m.default),
  TableControls: () => import('../table/PurchaseTableControls').then(m => m.default),
  BulkToolbar: () => import('../table/BulkActionsToolbar').then(m => m.default),
  Pagination: () => import('../table/PaginationFooter').then(m => m.default),
  
  // Form components
  Dialog: () => import('../forms/PurchaseDialog').then(m => m.default),
  Form: () => import('../forms/PurchaseForm').then(m => m.default),
  ItemForm: () => import('../forms/ItemForm').then(m => m.default),
  ItemsTable: () => import('../forms/ItemsTable').then(m => m.default),
  
  // Dialog components
  BulkDeleteDialog: () => import('../dialogs/BulkDeleteDialog').then(m => m.default),
  ConfirmationDialog: () => import('../dialogs/ConfirmationDialog').then(m => m.default),
  
  // State components
  EmptyState: () => import('../states/EmptyPurchaseState').then(m => m.default),
  LoadingState: () => import('../states/LoadingPurchaseState').then(m => m.default),
  ErrorState: () => import('../states/ErrorPurchaseState').then(m => m.default),
};

// Types - immediately available
export type { Purchase, PurchaseItem } from '@/types/supplier';

// Utility functions
export const PurchaseUtils = {
  // Create service factory
  createService: async (userId: string) => {
    const { createPurchaseService } = await import('./services/index');
    return createPurchaseService(userId);
  },
  
  // Create batch operations
  createBatchOps: async (userId: string) => {
    const { createBatchOperations } = await import('./services/index');
    return createBatchOperations(userId);
  },
  
  // Get transformers
  getTransformers: () => import('./services/purchaseTransformers'),
  
  // Get validators
  getValidators: () => import('./services/purchaseValidators'),
};

// React lazy components for use in routing
export const LazyPurchaseComponents = {
  ManagementPage: React.lazy(() => import('../layout/PurchasePage')),
  Table: React.lazy(() => import('../table/PurchaseTable')),
  Form: React.lazy(() => import('../forms/PurchaseForm')),
};

// Feature configuration and initialization
export const PurchaseFeature = {
  // Initialize feature with required dependencies
  initialize: async (config: {
    userId: string;
    suppliers: any[];
    bahanBaku: any[];
  }) => {
    // Load core services
    const [service, transformers, validators, hooks] = await Promise.all([
      PurchaseUtils.createService(config.userId),
      PurchaseUtils.getTransformers(),
      PurchaseUtils.getValidators(),
      Promise.all([
        PurchaseHooks.operations(),
        PurchaseHooks.form(),
        PurchaseHooks.search(),
        PurchaseHooks.bulk(),
        PurchaseHooks.notifications(),
      ])
    ]);

    return {
      service,
      transformers,
      validators,
      hooks: {
        operations: hooks[0],
        form: hooks[1],
        search: hooks[2],
        bulk: hooks[3],
        notifications: hooks[4],
      },
      ready: true,
    };
  },
  
  // Preload critical components
  preload: async () => {
    return Promise.all([
      PurchaseComponents.ManagementPage(),
      PurchaseComponents.Table(),
      PurchaseComponents.Form(),
    ]);
  },
  
  // Get feature metadata
  getInfo: () => ({
    name: 'Purchase Management',
    version: '1.0.0',
    description: 'Modular purchase management system with lazy loading',
    components: Object.keys(PurchaseComponents).length,
    hooks: Object.keys(PurchaseHooks).length,
    services: Object.keys(PurchaseServices).length,
  }),
};

// Default export for main component
export default LazyPurchaseComponents.ManagementPage;