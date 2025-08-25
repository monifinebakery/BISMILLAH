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

// ✅ OPTIONAL: Advanced imports for power users (lazy-loaded)
export const PROMO_CALCULATOR_ADVANCED = {
  // Calculator components
  calculator: () => import('./calculator'),
  
  // Promo list management
  promoList: () => import('./promoList'),
  
  // Analytics and reports
  analytics: () => import('./analytics'),
  
  // Service layer
  services: () => import('./services'),
  
  // Utility functions
  utils: () => import('./utils'),
  
  // Constants and configurations
  constants: () => import('./constants'),
  
  // All hooks for advanced usage
  hooks: () => import('./hooks'),
  
  // All components for advanced usage
  components: () => import('./components')
} as const;

// ✅ COMPONENT GROUPS: For batch loading
export const PROMO_CALCULATOR_COMPONENTS = {
  // Core calculator components
  core: () => Promise.all([
    import('./calculator/PromoCalculator'),
    import('./calculator/PromoTypeSelector'),
    import('./calculator/PromoPreview')
  ]).then(([calc, selector, preview]) => ({
    PromoCalculator: calc.default,
    PromoTypeSelector: selector.default,
    PromoPreview: preview.default
  })),
  
  // Promo management components
  management: () => Promise.all([
    import('./promoList/PromoList'),
    import('./promoList/PromoTable'),
    import('./promoList/PromoFilters')
  ]).then(([list, table, filters]) => ({
    PromoList: list.default,
    PromoTable: table.default,
    PromoFilters: filters.default
  })),
  
  // Analytics components
  analytics: () => Promise.all([
    import('./analytics/PromoAnalytics'),
    import('./analytics/PromoPerformanceCard')
  ]).then(([analytics, performance]) => ({
    PromoAnalytics: analytics.default,
    PromoPerformanceCard: performance.default
  })),
  
  // All components
  all: () => Promise.all([
    PROMO_CALCULATOR_COMPONENTS.core(),
    PROMO_CALCULATOR_COMPONENTS.management(),
    PROMO_CALCULATOR_COMPONENTS.analytics()
  ]).then(([core, management, analytics]) => ({
    ...core,
    ...management,
    ...analytics
  }))
} as const;

// ✅ HOOK UTILITIES: Grouped hook access
export const PROMO_CALCULATOR_HOOKS = {
  // Essential hooks (already exported above)
  essential: () => Promise.all([
    import('./hooks/usePromoCalculation'),
    import('./hooks/usePromoForm')
  ]).then(([calc, form]) => ({
    usePromoCalculation: calc.usePromoCalculation,
    usePromoForm: form.usePromoForm
  })),
  
  // Analytics hooks
  analytics: () => Promise.all([
    import('./hooks/usePromoAnalytics'),
    import('./hooks/usePromoList')
  ]).then(([analytics, list]) => ({
    usePromoAnalytics: analytics.usePromoAnalytics,
    usePromoList: list.usePromoList
  })),
  
  // All hooks
  all: () => import('./hooks')
} as const;

// ✅ CONVENIENCE: Named exports for better DX
export { 
  PromoCalculatorLayout as Layout,
  PromoCalculatorLayout as Calculator
};

// ✅ MIGRATION HELPER: For upgrading from full exports
export const PROMO_CALCULATOR_MIGRATION = {
  instructions: `
    // OLD (full import - loads all modules):
    import { PromoCalculator, PromoList, PromoAnalytics } from '@/components/promoCalculator';
    
    // NEW (direct import - better code splitting):
    import { PromoCalculator } from '@/components/promoCalculator/calculator';
    import { PromoList } from '@/components/promoCalculator/promoList';
    import { PromoAnalytics } from '@/components/promoCalculator/analytics';
    
    // OR (component groups - batch loading):
    const { PromoCalculator } = await PROMO_CALCULATOR_COMPONENTS.core();
    const { PromoList } = await PROMO_CALCULATOR_COMPONENTS.management();
    const { PromoAnalytics } = await PROMO_CALCULATOR_COMPONENTS.analytics();
    
    // OR (lazy import - best performance):
    const PromoCalculator = React.lazy(() => import('@/components/promoCalculator/calculator/PromoCalculator'));
  `,
  
  // Quick access to common items
  getCommonComponents: async () => {
    const [core, hooks] = await Promise.all([
      PROMO_CALCULATOR_COMPONENTS.core(),
      PROMO_CALCULATOR_HOOKS.essential()
    ]);
    
    return {
      ...core,
      ...hooks
    };
  }
} as const;
