// src/components/purchase/components/index.ts

// Lazy imports for code splitting
import { lazy } from 'react';

// Immediately loaded components (critical)
export { default as LoadingState } from './LoadingState';
export { default as EmptyState } from './EmptyState';
export { default as DataWarningBanner } from './DataWarningBanner';
export { default as PurchaseHeader } from './PurchaseHeader';

// Lazy loaded components (non-critical)
export const PurchaseDialog = lazy(() => import('./PurchaseDialog'));
export const PurchaseTable = lazy(() => import('./PurchaseTable'));
export const BulkActionsToolbar = lazy(() => import('./BulkActionsToolbar'));
export const BulkDeleteDialog = lazy(() => import('./BulkDeleteDialog'));

// Type exports
export type {
  PurchaseDialogProps,
  PurchaseTableProps,
  PurchaseHeaderProps,
  DataWarningBannerProps,
} from '../types/purchase.types';