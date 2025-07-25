// Components exports with dynamic imports for code splitting

// Layout components - immediately available
export { default as PurchaseHeader } from '../layout/PurchaseHeader';

// Main page component - lazy loaded
export const PurchasePage = () => import('../layout/PurchasePage').then(m => ({ default: m.default }));

// Table components - lazy loaded
export const PurchaseTableComponents = {
  Table: () => import('../table/PurchaseTable').then(m => ({ default: m.default })),
  TableRow: () => import('../table/PurchaseTableRow').then(m => ({ default: m.default })),
  TableControls: () => import('../table/PurchaseTableControls').then(m => ({ default: m.default })),
  BulkToolbar: () => import('../table/BulkActionsToolbar').then(m => ({ default: m.default })),
  Pagination: () => import('../table/PaginationFooter').then(m => ({ default: m.default })),
};

// Form components - lazy loaded
export const PurchaseFormComponents = {
  Dialog: () => import('../forms/PurchaseDialog').then(m => ({ default: m.default })),
  Form: () => import('../forms/PurchaseForm').then(m => ({ default: m.default })),
  ItemForm: () => import('../forms/ItemForm').then(m => ({ default: m.default })),
  ItemsTable: () => import('../forms/ItemsTable').then(m => ({ default: m.default })),
};

// Dialog components - lazy loaded
export const PurchaseDialogComponents = {
  BulkDelete: () => import('../dialogs/BulkDeleteDialog').then(m => ({ default: m.default })),
};

// State components - immediately available for error boundaries
export { default as LoadingPurchaseState } from '../states/LoadingPurchaseState';
export { default as EmptyPurchaseState } from '../states/EmptyPurchaseState';
export { default as ErrorPurchaseState } from '../states/ErrorPurchaseState';

// React lazy components for routing
export const LazyPurchaseComponents = {
  Page: React.lazy(() => import('../layout/PurchasePage')),
  Table: React.lazy(() => import('../table/PurchaseTable')),
  Dialog: React.lazy(() => import('../forms/PurchaseDialog')),
  Form: React.lazy(() => import('../forms/PurchaseForm')),
  BulkToolbar: React.lazy(() => import('../table/BulkActionsToolbar')),
  Pagination: React.lazy(() => import('../table/PaginationFooter')),
};

// Component factory functions
export const createPurchaseComponents = () => ({
  // Layout
  Header: PurchaseHeader,
  Page: LazyPurchaseComponents.Page,

  // Table
  Table: LazyPurchaseComponents.Table,
  BulkToolbar: LazyPurchaseComponents.BulkToolbar,
  Pagination: LazyPurchaseComponents.Pagination,

  // Forms
  Dialog: LazyPurchaseComponents.Dialog,
  Form: LazyPurchaseComponents.Form,

  // States
  Loading: LoadingPurchaseState,
  Empty: EmptyPurchaseState,
  Error: ErrorPurchaseState,
});

// Preload functions
export const preloadPurchaseComponents = {
  // Preload critical components
  critical: async () => {
    return Promise.all([
      import('../layout/PurchasePage'),
      import('../table/PurchaseTable'),
      import('../states/LoadingPurchaseState'),
    ]);
  },

  // Preload table components
  table: async () => {
    return Promise.all([
      import('../table/PurchaseTable'),
      import('../table/PurchaseTableRow'),
      import('../table/PurchaseTableControls'),
      import('../table/BulkActionsToolbar'),
      import('../table/PaginationFooter'),
    ]);
  },

  // Preload form components
  forms: async () => {
    return Promise.all([
      import('../forms/PurchaseDialog'),
      import('../forms/PurchaseForm'),
      import('../forms/ItemForm'),
      import('../forms/ItemsTable'),
    ]);
  },

  // Preload all components
  all: async () => {
    const [critical, table, forms, dialogs] = await Promise.all([
      preloadPurchaseComponents.critical(),
      preloadPurchaseComponents.table(),
      preloadPurchaseComponents.forms(),
      import('../dialogs/BulkDeleteDialog'),
    ]);
    return { critical, table, forms, dialogs };
  },
};

// Component bundle sizes (for monitoring)
export const componentBundleSizes = {
  // Estimated sizes in KB (gzipped)
  layout: {
    PurchaseHeader: 2,
    PurchasePage: 8,
  },
  table: {
    PurchaseTable: 12,
    PurchaseTableRow: 4,
    PurchaseTableControls: 6,
    BulkActionsToolbar: 8,
    PaginationFooter: 5,
  },
  forms: {
    PurchaseDialog: 3,
    PurchaseForm: 15,
    ItemForm: 8,
    ItemsTable: 10,
  },
  dialogs: {
    BulkDeleteDialog: 6,
  },
  states: {
    LoadingPurchaseState: 2,
    EmptyPurchaseState: 3,
    ErrorPurchaseState: 4,
  },
};

// Default export for main component
export default LazyPurchaseComponents.Page;