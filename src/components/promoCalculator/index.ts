// src/components/promoCalculator/index.ts - Optimized Dependencies (10 → 4)
/**
 * PromoCalculator Module - Clean Barrel Export
 * 
 * HANYA export yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced from 10 to 4 - 60% reduction!
 */

// ✅ CORE COMPONENT: Main layout component
export { default as PromoCalculatorLayout } from './PromoCalculatorLayout';
export { default } from './PromoCalculatorLayout';

// ✅ ESSENTIAL CONTEXT: For external integration
export * from './context';

// ✅ ESSENTIAL HOOKS: Most commonly used hooks only
export { usePromoCalculation, usePromoForm } from './hooks';

// ✅ ESSENTIAL TYPES: Core types for external usage
export type {
  PromoType,
  PromoCalculation,
  PromoFormData,
  PromoResult
} from './types';

// ❌ REMOVED - Reduce dependencies (6+ exports removed):
// - ./components (use direct imports for better code splitting)
// - ./calculator (internal use only, import directly if needed)
// - ./promoList (internal use only, import directly if needed)  
// - ./analytics (internal use only, import directly if needed)
// - ./services (internal use only, import directly if needed)
// - ./utils (internal use only, import directly if needed)
// - ./constants (internal use only, import directly if needed)
// - Additional hooks (use direct imports if needed)
//
// Use direct imports for better performance:
// import { PromoCalculator } from './calculator/PromoCalculator';
// import { PromoList } from './promoList/PromoList';

// ✅ REMOVED: Dynamic imports that conflict with static imports
// Use direct imports instead:
// import PromoCalculator from './calculator/PromoCalculator';
// import PromoList from './promoList/PromoList';

// ✅ REMOVED: Component groups that use dynamic imports
// Use direct imports for better performance:
// import PromoCalculator from './calculator/PromoCalculator';
// import PromoList from './promoList/PromoList';

// ✅ REMOVED: Hook utilities that use dynamic imports
// Use direct imports instead:
// import { usePromoCalculation, usePromoForm } from './hooks';

// ✅ CONVENIENCE: Named exports for better DX
export { 
  PromoCalculatorLayout as Layout,
  PromoCalculatorLayout as Calculator
};

// ✅ MIGRATION HELPER: Clean imports only
export const PROMO_CALCULATOR_MIGRATION = {
  instructions: `
    // RECOMMENDED (direct imports - best performance):
    import PromoCalculatorLayout from '@/components/promoCalculator/PromoCalculatorLayout';
    import { usePromoCalculation, usePromoForm } from '@/components/promoCalculator/hooks';
    
    // For specific components:
    import PromoCalculator from '@/components/promoCalculator/calculator/PromoCalculator';
    import PromoList from '@/components/promoCalculator/promoList/PromoList';
    
    // For lazy loading:
    const PromoCalculator = React.lazy(() => import('@/components/promoCalculator/calculator/PromoCalculator'));
  `
} as const;
