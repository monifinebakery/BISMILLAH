// src/components/assets/index.ts

// Main exports
export { AssetManagement } from './AssetManagement';
// AssetPage removed to allow dynamic imports only

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
  AssetFormState,
  AssetFormActions,
  AssetFormConfig,
  DatabaseAsset,
  ApiResponse,
} from './types';

// Re-export key components for external use
export {
  AssetStatistics,
  AssetTable,
  AssetCard,
  AssetForm,
  AssetFormFields,
  AssetDeleteDialog,
  AssetActions,
  AssetConditionBadge,
  AssetCategoryBadge,
} from './components';

// Re-export key hooks for external use
export {
  useAssetQuery,
  useAssetMutations,
  useAssetForm,
  useAssetCalculations,
  useAssetValidation,
} from './hooks';

// Re-export API functions for external use
export {
  useAssetsQuery,
  useAssetQuery as useAssetDetailQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  assetQueryKeys,
} from './api';

// Re-export utilities for external use
export {
  formatCurrency,
  formatDateForDisplay,
  formatDateToYYYYMMDD,
  formatPercentage,
  getInputValue,
  parseNumericInput,
  calculateAssetStatistics,
  calculateDepreciationPercentage,
  calculateCurrentValue,
  validateField,
  validateForm,
  isFormValid,
  hasRequiredFields,
  transformAssetFromDB,
  transformAssetForDB,
  safeParseDate,
  ASSET_CATEGORIES,
  ASSET_CONDITIONS,
  CONDITION_COLORS,
  DEFAULT_FORM_DATA,
} from './utils';