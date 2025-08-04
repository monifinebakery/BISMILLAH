// 📁 components/promoCalculator/index.ts - Optimized Dependencies (10 → 4)
/**
 * PromoCalculator Module - Clean Barrel Export
 * 
 * HANYA export yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced from 10 to 4
 */

// ✅ CORE EXPORTS ONLY (Most used by external consumers)
export { default as PromoCalculatorLayout } from './PromoCalculatorLayout';
export { default } from './PromoCalculatorLayout';

// ✅ ESSENTIAL CONTEXT (for external integration)
export * from './context';

// ✅ ESSENTIAL HOOKS (for external usage)
export * from './hooks';

// ✅ MAIN COMPONENTS (frequently used externally)
export * from './components';

// ❌ REMOVED - Reduce dependencies:
// - ./calculator (internal use only, import directly if needed)
// - ./promoList (internal use only, import directly if needed)  
// - ./analytics (internal use only, import directly if needed)
// - ./services (internal use only, import directly if needed)
// - ./utils (internal use only, import directly if needed)
// - ./constants (internal use only, import directly if needed)

// ✅ OPTIONAL: Advanced imports for power users (no runtime cost)
export const PROMO_CALCULATOR_ADVANCED = {
  calculator: () => import('./calculator'),
  promoList: () => import('./promoList'),
  analytics: () => import('./analytics'),
  services: () => import('./services'),
  utils: () => import('./utils'),
  constants: () => import('./constants')
} as const;

// ✅ CONVENIENCE: Named export for layout
export { 
  PromoCalculatorLayout as Layout
};