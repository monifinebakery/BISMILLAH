// src/components/promoCalculator/components/index.ts - Optimized Dependencies (9 → 4)
/**
 * PromoCalculator Components - Essential Only Exports
 * 
 * HANYA components yang frequently used externally
 * Dependencies reduced from 9 to 4 - 56% reduction!
 */

// ✅ CORE UI COMPONENTS: Most commonly used externally (4 exports)
export { default as PromoMetrics } from './PromoMetrics';
export { default as PromoTypeBadge } from './PromoTypeBadge';
export { default as StatusBadge } from './StatusBadge';
export { default as BreakevenAnalysis } from './BreakevenAnalysis';

// ❌ REMOVED - Better code splitting (5 exports removed):
// - LoadingSpinner (use direct import or shared component)
// - EmptyState (use direct import or shared component)
// - ConfirmDialog (internal dialog, rarely used externally)
// - PromoWarnings (internal component)
// - SearchInput (internal component)
//
// Use direct imports for better tree-shaking:
// import LoadingSpinner from './LoadingSpinner';
// import EmptyState from './EmptyState';

// ✅ COMPONENT GROUPS: For batch loading related components
export const PROMO_COMPONENT_GROUPS = {
  // Core display components - badges and metrics
  display: () => Promise.all([
    import('./PromoMetrics'),
    import('./PromoTypeBadge'), 
    import('./StatusBadge')
  ]).then(([metrics, typeBadge, statusBadge]) => ({
    PromoMetrics: metrics.default,
    PromoTypeBadge: typeBadge.default,
    StatusBadge: statusBadge.default
  })),
  
  // Analysis components - calculations and breakeven
  analysis: () => Promise.all([
    import('./BreakevenAnalysis'),
    import('./PromoMetrics')
  ]).then(([breakeven, metrics]) => ({
    BreakevenAnalysis: breakeven.default,
    PromoMetrics: metrics.default
  })),
  
  // UI utility components - loading, empty states, dialogs
  utilities: () => Promise.all([
    import('./LoadingSpinner'),
    import('./EmptyState'),
    import('./ConfirmDialog')
  ]).then(([loading, empty, confirm]) => ({
    LoadingSpinner: loading.default,
    EmptyState: empty.default,
    ConfirmDialog: confirm.default
  })),
  
  // Form components - warnings, inputs, validations
  forms: () => Promise.all([
    import('./PromoWarnings'),
    import('./SearchInput')
  ]).then(([warnings, search]) => ({
    PromoWarnings: warnings.default,
    SearchInput: search.default
  })),
  
  // All components
  all: () => Promise.all([
    PROMO_COMPONENT_GROUPS.display(),
    PROMO_COMPONENT_GROUPS.analysis(),
    PROMO_COMPONENT_GROUPS.utilities(),
    PROMO_COMPONENT_GROUPS.forms()
  ]).then(([display, analysis, utilities, forms]) => ({
    ...display,
    ...analysis,
    ...utilities,
    ...forms
  }))
} as const;

// ✅ COMPONENT TYPES: For different use cases
export const PROMO_COMPONENT_TYPES = {
  // Visual components - badges, metrics, displays
  visual: () => PROMO_COMPONENT_GROUPS.display(),
  
  // Interactive components - forms, inputs, dialogs
  interactive: () => Promise.all([
    PROMO_COMPONENT_GROUPS.forms(),
    PROMO_COMPONENT_GROUPS.utilities()
  ]).then(([forms, utilities]) => ({
    ...forms,
    ...utilities
  })),
  
  // Business logic components - analysis, calculations
  business: () => PROMO_COMPONENT_GROUPS.analysis()
} as const;

// ✅ COMPONENT UTILITIES: Helper functions for component management
export const PROMO_COMPONENT_UTILS = {
  // Check if component should be lazy loaded
  shouldLazyLoad: (componentName: string): boolean => {
    const heavyComponents = ['BreakevenAnalysis', 'PromoMetrics'];
    return heavyComponents.includes(componentName);
  },
  
  // Get component by category
  getComponentsByCategory: async (category: 'visual' | 'interactive' | 'business') => {
    return await PROMO_COMPONENT_TYPES[category]();
  },
  
  // Preload essential components
  preloadEssential: async () => {
    return await PROMO_COMPONENT_GROUPS.display();
  },
  
  // Get component loading priority
  getLoadingPriority: (componentName: string): 'high' | 'medium' | 'low' => {
    const priorityMap: Record<string, 'high' | 'medium' | 'low'> = {
      PromoMetrics: 'high',
      PromoTypeBadge: 'high', 
      StatusBadge: 'high',
      BreakevenAnalysis: 'medium',
      LoadingSpinner: 'low',
      EmptyState: 'low'
    };
    
    return priorityMap[componentName] || 'low';
  }
} as const;

// ✅ COMPONENT CONSTANTS: Component-specific configurations
export const COMPONENT_CONSTANTS = {
  // Component sizes
  sizes: {
    PromoMetrics: 'large',
    PromoTypeBadge: 'small',
    StatusBadge: 'small',
    BreakevenAnalysis: 'large'
  },
  
  // Loading states
  loading: {
    PromoMetrics: 'Memuat metrik promo...',
    BreakevenAnalysis: 'Menghitung analisis breakeven...',
    default: 'Memuat komponen...'
  },
  
  // Component categories
  categories: {
    display: ['PromoMetrics', 'PromoTypeBadge', 'StatusBadge'],
    analysis: ['BreakevenAnalysis'],
    utility: ['LoadingSpinner', 'EmptyState', 'ConfirmDialog'],
    form: ['PromoWarnings', 'SearchInput']
  }
} as const;

// ✅ MIGRATION HELPER: For component usage patterns
export const PROMO_COMPONENTS_MIGRATION = {
  instructions: `
    // CURRENT (essential components - still exported):
    import { PromoMetrics, PromoTypeBadge, StatusBadge, BreakevenAnalysis } from '@/components/promoCalculator/components';
    
    // FOR REMOVED COMPONENTS (direct import - better performance):
    import LoadingSpinner from '@/components/promoCalculator/components/LoadingSpinner';
    import EmptyState from '@/components/promoCalculator/components/EmptyState';
    
    // OR (group loading - batch imports):
    const displayComponents = await PROMO_COMPONENT_GROUPS.display();
    const utilityComponents = await PROMO_COMPONENT_GROUPS.utilities();
    
    // OR (by category):
    const visualComponents = await PROMO_COMPONENT_TYPES.visual();
  `,
  
  // Check what components are affected by migration
  checkMigrationImpact: (currentComponents: string[]) => {
    const removedComponents = ['LoadingSpinner', 'EmptyState', 'ConfirmDialog', 'PromoWarnings', 'SearchInput'];
    const affectedComponents = currentComponents.filter(comp => removedComponents.includes(comp));
    
    return {
      needsMigration: affectedComponents.length > 0,
      affectedComponents,
      recommendation: affectedComponents.length > 0 
        ? 'Use direct imports or component groups for removed components'
        : 'No migration needed - all components still exported'
    };
  },
  
  // Get essential components setup
  getEssentialSetup: async () => {
    const display = await PROMO_COMPONENT_GROUPS.display();
    
    return {
      components: display,
      utils: PROMO_COMPONENT_UTILS,
      constants: COMPONENT_CONSTANTS
    };
  }
} as const;