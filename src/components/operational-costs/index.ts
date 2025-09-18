// src/components/operational-costs/index.ts - Optimized Dependencies (8 → 4)
/**
 * Operational Costs Module - Clean Barrel Export
 * 
 * HANYA export yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced from 8+ to 4
 */

// ✅ CORE EXPORTS ONLY
export { default as OperationalCostPage } from './OperationalCostPage';

// ✅ ESSENTIAL CONTEXT
export * from './context';

// ✅ ESSENTIAL TYPES ONLY
export * from './types';

// ✅ ESSENTIAL COMPONENTS (most used)
export { 
  CostForm,
  CostList,
  CostSummaryCard,
  AllocationSettings,
  LoadingState,
  EmptyState 
} from './components';

// ✅ NEW: Auto-Sync Recipe Integration Component (Simplified)
export { default as AutoSyncRecipeDisplay } from './components/AutoSyncRecipeDisplay';

// ✅ NEW: Essential Hooks for Recipe Integration
export { useEnhancedHppCalculation } from './hooks/useEnhancedHppCalculation';
export { useAutoSyncRecipe } from './hooks/useAutoSyncRecipe';
export { useCostClassification } from './hooks/useCostClassification';

// ❌ REMOVED - Reduce dependencies:
// - All hooks exports (use direct imports if needed)
// - All constants exports (use direct imports if needed)  
// - All utils exports (use direct imports if needed)
// - All services exports (use direct imports if needed)

// ✅ OPTIONAL: Advanced imports for power users
export const OPERATIONAL_COST_ADVANCED = {
  hooks: () => import('./hooks'),
  constants: () => import('./constants'),
  utils: () => import('./utils'),
  services: () => import('./services'),
  dialogs: () => import('./dialogs'),
  features: () => import('./features')
} as const;