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

// ✅ NEW AUTO-MODE COMPONENTS
export { AutoModeOperationalCost } from './AutoModeOperationalCost';
export { SimpleAllocationSettings } from './SimpleAllocationSettings';

// ❌ REMOVED: Lazy loaded components - use direct imports when needed
// - CostFormLazy, CostListLazy, etc.
// These can be imported directly where needed for lazy loading