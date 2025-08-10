// src/components/assets/index.ts

// Main exports
export { AssetManagement } from './AssetManagement';
export { AssetPage } from './AssetPage';

// Re-export types for external use
export type {
  Asset,
  AssetCategory,
  AssetCondition,
  AssetCreateInput,
  AssetUpdateInput,
  AssetStatistics,
  AssetFormData,
  AssetFormErrors,
} from './types';

// Re-export key components for external use
export {
  AssetStatistics,
  AssetTable,
  AssetCard,
  AssetForm,
  AssetConditionBadge,
  AssetCategoryBadge,
} from './components';

// Re-export key hooks for external use
export {
  useAssetQuery,
  useAssetMutations,
  useAssetForm,
  useAssetCalculations,
} from './hooks';

// Re-export utilities for external use
export {
  formatCurrency,
  formatDateForDisplay,
  calculateAssetStatistics,
  validateField,
  validateForm,
} from './utils';