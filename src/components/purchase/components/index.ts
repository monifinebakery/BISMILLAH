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

// ✅ FORM COMPONENTS: For purchase form usage
export { default as MaterialComboBox } from './MaterialComboBox';
export { default as SupplierComboBox } from './SupplierComboBox';

// ✅ TYPE-ONLY EXPORTS: Zero runtime cost
export type {
  PurchaseHeaderProps,
  EmptyStateProps
} from '../types/purchase.types';

// REMOVED: Legacy components - use direct imports when needed
// These components should be imported directly where used for better code splitting:
// 
// import PurchaseTable from './PurchaseTable';
// import StatusChangeConfirmationDialog from './StatusChangeConfirmationDialog';

// MIGRATION HELPER: Clean imports only
export const PURCHASE_COMPONENTS_MIGRATION = {
  instructions: `
    // RECOMMENDED (direct imports - best performance):
    import PurchaseTable from '@/components/purchase/components/PurchaseTable';
    
    // For lazy loading:
    const PurchaseTable = React.lazy(() => import('@/components/purchase/components/PurchaseTable'));
    
    // NOTE: PurchaseDialog has been replaced with PurchaseAddEditPage (full page)
  `
} as const;
