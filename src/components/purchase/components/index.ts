// src/components/purchase/components/index.ts - Optimized Dependencies (4 → 2)
/**
 * Purchase Components - Static Only Exports
 * 
 * HANYA components yang always loaded (critical path)
 * Dependencies reduced from 4 to 2
 */

// ✅ STATIC COMPONENTS ONLY (Always loaded)
export { default as LoadingState } from './LoadingState';
export { default as EmptyState } from './EmptyState';
export { default as DataWarningBanner } from './DataWarningBanner';
export { default as PurchaseHeader } from './PurchaseHeader';

// ❌ REMOVED: Lazy components - import directly when needed
// - PurchaseDialog, PurchaseTable, BulkActionsToolbar, BulkDeleteDialog
// These should be imported directly in components that need them

// ✅ TYPE-ONLY EXPORTS (zero runtime cost)
export type {
  PurchaseHeaderProps,
  DataWarningBannerProps
} from '../types/purchase.types';

// ✅ LAZY COMPONENT REFERENCES (for documentation)
// Use these for direct imports:
// import PurchaseDialog from './PurchaseDialog';
// import PurchaseTable from './PurchaseTable';
// import BulkActionsToolbar from './BulkActionsToolbar'; 
// import BulkDeleteDialog from './BulkDeleteDialog';