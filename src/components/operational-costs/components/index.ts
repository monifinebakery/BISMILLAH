// src/components/operational-costs/components/index.ts - Optimized Dependencies (3 → 1)
/**
 * Operational Cost Components - Static Only Exports
 * 
 * HANYA components yang always loaded (essential components)
 * Dependencies reduced by removing lazy loading complexity
 */

// ✅ STATIC COMPONENTS ONLY (Always loaded)
export { default as CostForm } from './CostForm';
export { default as CostList } from './CostList';
export { default as CostSummaryCard } from './CostSummaryCard';
export { default as AllocationSettings } from './AllocationSettings';
export { default as LoadingState } from './LoadingState';
export { default as EmptyState } from './EmptyState';
export { default as ProgressSetup } from './ProgressSetup';
export { default as OnboardingModal } from './OnboardingModal';
export { default as OperationalCostHeader } from './OperationalCostHeader';
export { default as CostManagementTab } from './CostManagementTab';
export { default as CalculatorTab } from './CalculatorTab';
export { default as DualModeCalculator } from './DualModeCalculator';
export { default as BulkActions } from './BulkActions';
export { default as BulkActionsNew } from './BulkActionsNew';

// ❌ REMOVED: Lazy loaded components - use direct imports when needed
// - CostFormLazy, CostListLazy, etc.
// These can be imported directly where needed for lazy loading