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
  EmptyStateProps
} from '../types/purchase.types';

// ❌ REMOVED: Lazy components - import directly when needed
// These components should be imported directly where used for better code splitting:
// 
// import PurchaseDialog from './PurchaseDialog';
// import PurchaseTable from './PurchaseTable';

// import StatusChangeConfirmationDialog from './StatusChangeConfirmationDialog';
// import SimplePurchaseItemForm from './SimplePurchaseItemForm';

// ✅ REMOVED: Dynamic import references that conflict with static imports
// Use direct imports instead:
// import PurchaseDialog from './PurchaseDialog';
// import PurchaseTable from './PurchaseTable';

// ✅ REMOVED: Component groups that use dynamic imports
// Use direct imports instead:
// import PurchaseDialog from './PurchaseDialog';
// import PurchaseTable from './PurchaseTable';

// ✅ MIGRATION HELPER: Clean imports only
export const PURCHASE_COMPONENTS_MIGRATION = {
  instructions: `
    // RECOMMENDED (direct imports - best performance):
    import PurchaseDialog from '@/components/purchase/components/PurchaseDialog';
    import PurchaseTable from '@/components/purchase/components/PurchaseTable';
    
    // For lazy loading:
    const PurchaseDialog = React.lazy(() => import('@/components/purchase/components/PurchaseDialog'));
    const PurchaseTable = React.lazy(() => import('@/components/purchase/components/PurchaseTable'));
  `
} as const;
