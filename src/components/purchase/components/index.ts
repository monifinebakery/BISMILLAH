// src/components/purchase/components/index.ts - Optimized Dependencies (12 → 4)
/**
 * Purchase Components - Static Only Exports
 * 
 * HANYA components yang always loaded (critical path)
 * Dependencies reduced from 12 to 4 - better code splitting
 */

// ✅ STATIC COMPONENTS: Always loaded (critical rendering path)
export { default as LoadingState } from './LoadingState';
export { default as EmptyState } from './EmptyState';
export { default as PurchaseHeader } from './PurchaseHeader';

// ✅ TYPE-ONLY EXPORTS: Zero runtime cost
export type {
  PurchaseHeaderProps,
  EmptyStateProps,
  LoadingStateProps
} from '../types/purchase.types';

// ❌ REMOVED: Lazy components - import directly when needed
// These components should be imported directly where used for better code splitting:
// 
// import PurchaseDialog from './PurchaseDialog';
// import PurchaseTable from './PurchaseTable';
// import BulkActions from './BulkActions';
// import BulkActionsToolbar from './BulkActionsToolbar';
// import BulkDeleteDialog from './BulkDeleteDialog';
// import StatusChangeConfirmationDialog from './StatusChangeConfirmationDialog';
// import SimplePurchaseItemForm from './SimplePurchaseItemForm';

// ✅ LAZY COMPONENT REFERENCES: For documentation and lazy loading
export const PURCHASE_COMPONENTS_LAZY = {
  // Main components (heavy - load on demand)
  PurchaseDialog: () => import('./PurchaseDialog'),
  PurchaseTable: () => import('./PurchaseTable'),
  BulkActions: () => import('./BulkActions'),
  
  // Action components (medium - load when needed)
  BulkActionsToolbar: () => import('./BulkActionsToolbar'),
  BulkDeleteDialog: () => import('./BulkDeleteDialog'),
  StatusChangeConfirmationDialog: () => import('./StatusChangeConfirmationDialog'),

  // Utility components
  PurchaseFilters: () => import('./PurchaseFilters'),
  PurchaseStats: () => import('./PurchaseStats'),

  // Import dialog
  PurchaseImportDialog: () => import('./dialogs/PurchaseImportDialog')
} as const;

// ✅ COMPONENT GROUPS: For batch loading
export const PURCHASE_COMPONENTS_GROUPS = {
  // Core dialogs - load together
  dialogs: () => Promise.all([
    import('./PurchaseDialog'),
    import('./BulkDeleteDialog'),
    import('./StatusChangeConfirmationDialog')
  ]),
  
  // Table related - load together
  table: () => Promise.all([
    import('./PurchaseTable'),
    import('./BulkActions'),
    import('./BulkActionsToolbar')
  ]),
  
  // Form components - load together
  forms: () => Promise.all([
    import('./PurchaseDialog')
  ]),
  
  // Import dialog - load separately
  import: () => Promise.all([
    import('./dialogs/PurchaseImportDialog')
  ]),
  
  // All lazy components - for preloading
  all: () => Promise.all(Object.values(PURCHASE_COMPONENTS_LAZY).map(fn => fn()))
} as const;

// ✅ MIGRATION HELPER: For upgrading from barrel imports
export const PURCHASE_COMPONENTS_MIGRATION = {
  // Instructions for migrating from barrel imports
  instructions: `
    // OLD (barrel import - loads all components):
    import { PurchaseDialog, PurchaseTable } from '@/components/purchase/components';
    
    // NEW (direct import - better code splitting):
    import PurchaseDialog from '@/components/purchase/components/PurchaseDialog';
    import PurchaseTable from '@/components/purchase/components/PurchaseTable';
    import BulkActions from '@/components/purchase/components/BulkActions';
    
    // OR (lazy import - best performance):
    const PurchaseDialog = React.lazy(() => import('@/components/purchase/components/PurchaseDialog'));
    const PurchaseTable = React.lazy(() => import('@/components/purchase/components/PurchaseTable'));
    const BulkActions = React.lazy(() => import('@/components/purchase/components/BulkActions'));
  `,
  
  // Quick migration function
  getLazyComponent: (componentName: keyof typeof PURCHASE_COMPONENTS_LAZY) => {
    return PURCHASE_COMPONENTS_LAZY[componentName];
  }
} as const;