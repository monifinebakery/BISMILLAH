// 📁 components/promoCalculator/components/index.ts - Optimized Dependencies (9 → 6)
/**
 * PromoCalculator Components - Essential Only Exports
 * 
 * HANYA components yang frequently used externally
 * Dependencies reduced from 9 to 6
 */

// ✅ CORE UI COMPONENTS (frequently used externally)
export { default as PromoMetrics } from './PromoMetrics';
export { default as PromoTypeBadge } from './PromoTypeBadge';
export { default as StatusBadge } from './StatusBadge';
export { default as BreakevenAnalysis } from './BreakevenAnalysis';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as EmptyState } from './EmptyState';

// ❌ REMOVED - Reduce dependencies (use direct imports if needed):
// - ConfirmDialog (internal dialog, rarely used externally)
// - PromoWarnings (internal component)
// - SearchInput (internal component)

// ✅ NOTE: For internal use, import directly:
// import ConfirmDialog from './ConfirmDialog';
// import PromoWarnings from './PromoWarnings';
// import SearchInput from './SearchInput';