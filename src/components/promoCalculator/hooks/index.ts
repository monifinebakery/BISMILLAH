// src/components/promoCalculator/hooks/index.ts - Optimized Dependencies (4 → 2)
/**
 * PromoCalculator Hooks - Essential Only Exports
 * 
 * HANYA export hooks yang benar-benar diperlukan untuk external consumers
 * Dependencies reduced from 4 to 2 - 50% reduction!
 */

// ✅ CORE HOOKS: Most commonly used hooks externally
export { usePromoCalculation } from './usePromoCalculation';
export { usePromoForm } from './usePromoForm';

// ❌ REMOVED - Reduce dependencies:
// - usePromoAnalytics (use direct import if needed)
// - usePromoList (use direct import if needed)
// - Hook types (import from types if needed)
//
// Use direct imports for better tree-shaking:
// import { usePromoAnalytics } from './usePromoAnalytics';
// import { usePromoList } from './usePromoList';

// ✅ HOOK TYPES: Essential hook return types
export type {
  UsePromoCalculationReturn,
  UsePromoFormReturn
} from '../types';

// ✅ OPTIONAL: Advanced hooks for power users (lazy-loaded)
export const PROMO_CALCULATOR_HOOKS_ADVANCED = {
  // Analytics hooks
  analytics: () => import('./usePromoAnalytics').then(m => ({ 
    usePromoAnalytics: m.usePromoAnalytics 
  })),
  
  // List management hooks
  list: () => import('./usePromoList').then(m => ({ 
    usePromoList: m.usePromoList 
  })),
  
  // All hook types
  types: () => import('../types').then(m => ({
    UsePromoCalculationReturn: m.UsePromoCalculationReturn,
    UsePromoFormReturn: m.UsePromoFormReturn,
    UsePromoAnalyticsReturn: m.UsePromoAnalyticsReturn,
    UsePromoListReturn: m.UsePromoListReturn
  }))
} as const;

// ✅ HOOK PRESETS: Common hook combinations
export const PROMO_CALCULATOR_HOOK_PRESETS = {
  // Basic promo calculator - calculation + form
  basic: async () => {
    const [calc, form] = await Promise.all([
      import('./usePromoCalculation'),
      import('./usePromoForm')
    ]);
    
    return {
      usePromoCalculation: calc.usePromoCalculation,
      usePromoForm: form.usePromoForm
    };
  },
  
  // Complete promo management - all hooks
  complete: async () => {
    const [calc, form, analytics, list] = await Promise.all([
      import('./usePromoCalculation'),
      import('./usePromoForm'),
      import('./usePromoAnalytics'),
      import('./usePromoList')
    ]);
    
    return {
      usePromoCalculation: calc.usePromoCalculation,
      usePromoForm: form.usePromoForm,
      usePromoAnalytics: analytics.usePromoAnalytics,
      usePromoList: list.usePromoList
    };
  },
  
  // Analytics only - for reporting components
  analyticsOnly: async () => {
    const [analytics, list] = await Promise.all([
      import('./usePromoAnalytics'),
      import('./usePromoList')
    ]);
    
    return {
      usePromoAnalytics: analytics.usePromoAnalytics,
      usePromoList: list.usePromoList
    };
  }
} as const;

// ✅ HOOK UTILITIES: Helper functions for hook management
export const PROMO_HOOK_UTILS = {
  // Validate hook dependencies
  validateHookDependencies: (hookName: string, dependencies: any[]) => {
    const missingDeps = dependencies.filter(dep => dep === undefined || dep === null);
    
    if (missingDeps.length > 0) {
      console.warn(`Hook ${hookName} has missing dependencies:`, missingDeps);
      return false;
    }
    
    return true;
  },
  
  // Create hook combination
  createHookCombination: async (hookNames: Array<'calculation' | 'form' | 'analytics' | 'list'>) => {
    const importMap = {
      calculation: () => import('./usePromoCalculation'),
      form: () => import('./usePromoForm'),
      analytics: () => import('./usePromoAnalytics'),
      list: () => import('./usePromoList')
    };
    
    const hooks = await Promise.all(
      hookNames.map(name => importMap[name]())
    );
    
    return hookNames.reduce((result, name, index) => {
      const hookModule = hooks[index];
      const hookName = `usePromo${name.charAt(0).toUpperCase() + name.slice(1)}`;
      result[hookName] = hookModule[hookName];
      return result;
    }, {} as Record<string, any>);
  },
  
  // Get hook performance info
  getHookPerformanceInfo: () => {
    return {
      essential: ['usePromoCalculation', 'usePromoForm'],
      advanced: ['usePromoAnalytics', 'usePromoList'],
      loadingStrategy: 'lazy',
      bundleSplit: true
    };
  }
} as const;

// ✅ HOOK CONSTANTS: Hook-specific constants
export const HOOK_CONSTANTS = {
  // Hook names
  names: {
    CALCULATION: 'usePromoCalculation',
    FORM: 'usePromoForm',
    ANALYTICS: 'usePromoAnalytics',
    LIST: 'usePromoList'
  } as const,
  
  // Default hook options
  defaults: {
    calculation: {
      autoCalculate: true,
      debounceMs: 300
    },
    form: {
      validateOnChange: true,
      resetOnSubmit: true
    },
    analytics: {
      refreshInterval: 30000,
      cacheResults: true
    },
    list: {
      pageSize: 10,
      sortBy: 'createdAt'
    }
  }
} as const;

// ✅ MIGRATION HELPER: For hook usage patterns
export const PROMO_HOOKS_MIGRATION = {
  instructions: `
    // CURRENT (essential hooks - still exported):
    import { usePromoCalculation, usePromoForm } from '@/components/promoCalculator/hooks';
    
    // FOR ADVANCED HOOKS (direct import - better tree-shaking):
    import { usePromoAnalytics } from '@/components/promoCalculator/hooks/usePromoAnalytics';
    import { usePromoList } from '@/components/promoCalculator/hooks/usePromoList';
    
    // OR (preset combinations):
    const basicHooks = await PROMO_CALCULATOR_HOOK_PRESETS.basic();
    const { usePromoCalculation, usePromoForm } = basicHooks;
    
    // OR (custom combination):
    const hooks = await PROMO_HOOK_UTILS.createHookCombination(['calculation', 'analytics']);
  `,
  
  // Quick access to essential hooks
  getEssentialHooks: async () => {
    return await PROMO_CALCULATOR_HOOK_PRESETS.basic();
  },
  
  // Migration checker
  checkMigrationNeeded: (currentImports: string[]) => {
    const removedHooks = ['usePromoAnalytics', 'usePromoList'];
    const needsMigration = currentImports.some(imp => removedHooks.includes(imp));
    
    return {
      needsMigration,
      affectedImports: currentImports.filter(imp => removedHooks.includes(imp)),
      recommendation: needsMigration 
        ? 'Use direct imports or hook presets for removed hooks'
        : 'No migration needed'
    };
  }
} as const;