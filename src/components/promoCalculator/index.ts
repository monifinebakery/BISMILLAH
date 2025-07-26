// 🎯 Entry point untuk Promo Calculator Module
// Barrel exports untuk semua komponen, hooks, services, dan utilities

// === MAIN LAYOUT COMPONENT ===
export { default as PromoCalculatorLayout } from './PromoCalculatorLayout';

// === CALCULATOR TAB COMPONENTS ===
export { default as PromoCalculator } from './calculator/PromoCalculator';
export { default as PromoPreview } from './calculator/PromoPreview';
export { default as PromoTypeSelector } from './calculator/PromoTypeSelector';

// === CALCULATOR FORMS ===
export { default as BogoForm } from './calculator/forms/BogoForm';
export { default as BundleForm } from './calculator/forms/BundleForm';
export { default as DiscountForm } from './calculator/forms/DiscountForm';

// === PROMO LIST COMPONENTS ===
export { default as PromoList } from './promoList/PromoList';
export { default as BulkActions } from './promoList/BulkActions';
export { default as PromoEditModal } from './promoList/PromoEditModal';
export { default as PromoFilters } from './promoList/PromoFilters';
export { default as PromoTable } from './promoList/PromoTable';
export { default as PromoTableRow } from './promoList/PromoTableRow';

// === ANALYTICS COMPONENTS ===
export { default as PromoAnalytics } from './analytics/PromoAnalytics';

// === REUSABLE UI COMPONENTS ===
export * from './components';
// Individual component exports
export { default as BreakevenAnalysis } from './components/BreakevenAnalysis';
export { default as ConfirmDialog } from './components/ConfirmDialog';
export { default as EmptyState } from './components/EmptyState';
export { default as LoadingSpinner } from './components/LoadingSpinner';
export { default as PromoMetrics } from './components/PromoMetrics';
export { default as PromoTypeBadge } from './components/PromoTypeBadge';
export { default as PromoWarnings } from './components/PromoWarnings';
export { default as SearchInput } from './components/SearchInput';
export { default as StatusBadge } from './components/StatusBadge';

// === HOOKS ===
export { usePromoAnalytics } from './hooks/usePromoAnalytics';
export { usePromoCalculation } from './hooks/usePromoCalculation';
export { usePromoForm } from './hooks/usePromoForm';
export { usePromoList } from './hooks/usePromoList';

// === SERVICES ===
export { analyticsService } from './services/analyticsService';
export { calculationService } from './services/calculationService';
export { promosService } from './services/promosService';

// === CONTEXT ===
export { PromoCalculatorContext, PromoCalculatorProvider, usePromoCalculatorContext } from './context/PromoContext';

// === CONSTANTS ===
export * from './constants/constants';

// === UTILITIES ===
export * from './utils';
// Individual utility exports
export * from './utils/calculations';
export * from './utils/formatters';
export * from './utils/helpers';
export * from './utils/storage';
export * from './utils/validation';

// === DEFAULT EXPORT ===
// Export default untuk kemudahan import
export { default } from './PromoCalculatorLayout';

// === NAMED EXPORTS UNTUK CONVENIENCE ===
// Re-export dengan nama yang lebih jelas
export { 
  PromoCalculatorLayout as Layout,
  PromoCalculator as Calculator,
  PromoList as List,
  PromoAnalytics as Analytics 
};