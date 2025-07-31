// src/components/operational-costs/components/index.ts

import { lazy } from 'react';

// Immediate load components
export { default as CostForm } from './CostForm';
export { default as CostList } from './CostList';
export { default as CostSummaryCard } from './CostSummaryCard';
export { default as AllocationSettings } from './AllocationSettings';
export { default as LoadingState } from './LoadingState';
export { default as EmptyState } from './EmptyState';

// Lazy loaded components (for better performance)
export const CostFormLazy = lazy(() => import('./CostForm'));
export const CostListLazy = lazy(() => import('./CostList'));
export const CostSummaryCardLazy = lazy(() => import('./CostSummaryCard'));
export const AllocationSettingsLazy = lazy(() => import('./AllocationSettings'));