// src/components/promoCalculator/components/index.ts - Complete Export Index
/**
 * PromoCalculator Components - Complete Export Index
 * 
 * Organized exports for all components based on actual folder structure
 * Optimized for tree-shaking and performance
 */

// ============================================
// CORE DISPLAY COMPONENTS - Most frequently used
// ============================================
export { default as PromoCard } from './PromoCard';
export { default as PromoMetrics } from './PromoMetrics';
export { default as PromoTypeBadge } from './PromoTypeBadge';
export { default as StatusBadge } from './StatusBadge';

// ============================================
// ANALYSIS & CALCULATION COMPONENTS
// ============================================
export { default as BreakevenAnalysis } from './BreakevenAnalysis';

// ============================================
// UI UTILITY COMPONENTS - Direct import recommended
// ============================================
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as EmptyState } from './EmptyState';
export { default as ConfirmDialog } from './ConfirmDialog';

// ============================================
// FORM & INPUT COMPONENTS
// ============================================
export { default as PromoWarnings } from './PromoWarnings';
export { default as SearchInput } from './SearchInput';

// ============================================
// COMPONENT GROUPS - For batch loading
// ============================================
export const PROMO_COMPONENT_GROUPS = {
  // Essential display components - always needed
  essential: () => Promise.all([
    import('./PromoCard'),
    import('./PromoTypeBadge'),
    import('./StatusBadge')
  ]).then(([card, typeBadge, statusBadge]) => ({
    PromoCard: card.default,
    PromoTypeBadge: typeBadge.default,
    StatusBadge: statusBadge.default
  })),
  
  // Display components - visual elements
  display: () => Promise.all([
    import('./PromoCard'),
    import('./PromoMetrics'),
    import('./PromoTypeBadge'), 
    import('./StatusBadge')
  ]).then(([card, metrics, typeBadge, statusBadge]) => ({
    PromoCard: card.default,
    PromoMetrics: metrics.default,
    PromoTypeBadge: typeBadge.default,
    StatusBadge: statusBadge.default
  })),
  
  // Analysis components - calculations and insights
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
  
  // Dashboard components - for main layout
  dashboard: () => Promise.all([
    import('./PromoCard'),
    import('./PromoMetrics'),
    import('./StatusBadge'),
    import('./EmptyState')
  ]).then(([card, metrics, status, empty]) => ({
    PromoCard: card.default,
    PromoMetrics: metrics.default,
    StatusBadge: status.default,
    EmptyState: empty.default
  })),
  
  // List components - for promo list page
  list: () => Promise.all([
    import('./PromoCard'),
    import('./SearchInput'),
    import('./LoadingSpinner'),
    import('./EmptyState')
  ]).then(([card, search, loading, empty]) => ({
    PromoCard: card.default,
    SearchInput: search.default,
    LoadingSpinner: loading.default,
    EmptyState: empty.default
  })),
  
  // Calculator components - for promo calculator
  calculator: () => Promise.all([
    import('./PromoWarnings'),
    import('./ConfirmDialog'),
    import('./LoadingSpinner')
  ]).then(([warnings, confirm, loading]) => ({
    PromoWarnings: warnings.default,
    ConfirmDialog: confirm.default,
    LoadingSpinner: loading.default
  })),
  
  // All components - complete set
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

// ============================================
// COMPONENT TYPES - By functionality
// ============================================
export const PROMO_COMPONENT_TYPES = {
  // Visual components - display and badges
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
  business: () => PROMO_COMPONENT_GROUPS.analysis(),
  
  // Layout components - cards, containers
  layout: () => Promise.all([
    import('./PromoCard'),
    import('./EmptyState')
  ]).then(([card, empty]) => ({
    PromoCard: card.default,
    EmptyState: empty.default
  }))
} as const;

// ============================================
// PAGE-SPECIFIC COMPONENT PRESETS
// ============================================
export const PROMO_PAGE_PRESETS = {
  // Dashboard page components
  dashboard: () => PROMO_COMPONENT_GROUPS.dashboard(),
  
  // Calculator page components
  calculator: () => PROMO_COMPONENT_GROUPS.calculator(),
  
  // List page components
  list: () => PROMO_COMPONENT_GROUPS.list(),
  
  // Analytics page components
  analytics: () => Promise.all([
    import('./PromoMetrics'),
    import('./BreakevenAnalysis'),
    import('./LoadingSpinner')
  ]).then(([metrics, breakeven, loading]) => ({
    PromoMetrics: metrics.default,
    BreakevenAnalysis: breakeven.default,
    LoadingSpinner: loading.default
  }))
} as const;

// ============================================
// COMPONENT UTILITIES - Management helpers
// ============================================
export const PROMO_COMPONENT_UTILS = {
  // Check if component should be lazy loaded
  shouldLazyLoad: (componentName: string): boolean => {
    const heavyComponents = ['BreakevenAnalysis', 'PromoMetrics', 'PromoCard'];
    return heavyComponents.includes(componentName);
  },
  
  // Get component by category
  getComponentsByCategory: async (category: 'visual' | 'interactive' | 'business' | 'layout') => {
    return await PROMO_COMPONENT_TYPES[category]();
  },
  
  // Get components by page
  getComponentsByPage: async (page: 'dashboard' | 'calculator' | 'list' | 'analytics') => {
    return await PROMO_PAGE_PRESETS[page]();
  },
  
  // Preload essential components
  preloadEssential: async () => {
    return await PROMO_COMPONENT_GROUPS.essential();
  },
  
  // Get component loading priority
  getLoadingPriority: (componentName: string): 'critical' | 'high' | 'medium' | 'low' => {
    const priorityMap: Record<string, 'critical' | 'high' | 'medium' | 'low'> = {
      // Critical - always needed
      PromoCard: 'critical',
      StatusBadge: 'critical',
      LoadingSpinner: 'critical',
      
      // High - frequently used
      PromoTypeBadge: 'high',
      PromoMetrics: 'high',
      EmptyState: 'high',
      
      // Medium - specific use cases
      BreakevenAnalysis: 'medium',
      SearchInput: 'medium',
      ConfirmDialog: 'medium',
      
      // Low - specialized
      PromoWarnings: 'low'
    };
    
    return priorityMap[componentName] || 'low';
  },
  
  // Check component dependencies
  getDependencies: (componentName: string): string[] => {
    const dependencyMap: Record<string, string[]> = {
      PromoCard: ['StatusBadge', 'PromoTypeBadge'],
      PromoMetrics: ['LoadingSpinner'],
      BreakevenAnalysis: ['LoadingSpinner', 'PromoMetrics'],
      SearchInput: ['LoadingSpinner'],
      PromoWarnings: ['ConfirmDialog']
    };
    
    return dependencyMap[componentName] || [];
  },
  
  // Validate component availability
  validateComponents: async (requiredComponents: string[]) => {
    const results = await Promise.allSettled(
      requiredComponents.map(async (name) => {
        try {
          await import(`./${name}`);
          return { name, available: true };
        } catch {
          return { name, available: false };
        }
      })
    );
    
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : { name: 'unknown', available: false }
    );
  }
} as const;

// ============================================
// COMPONENT CONSTANTS - Configurations
// ============================================
export const COMPONENT_CONSTANTS = {
  // Component sizes for layout
  sizes: {
    PromoCard: 'large',
    PromoMetrics: 'large',
    PromoTypeBadge: 'small',
    StatusBadge: 'small',
    BreakevenAnalysis: 'large',
    LoadingSpinner: 'medium',
    EmptyState: 'large',
    ConfirmDialog: 'medium',
    PromoWarnings: 'medium',
    SearchInput: 'medium'
  },
  
  // Loading messages
  loading: {
    PromoCard: 'Memuat kartu promo...',
    PromoMetrics: 'Memuat metrik promo...',
    BreakevenAnalysis: 'Menghitung analisis breakeven...',
    SearchInput: 'Memuat pencarian...',
    default: 'Memuat komponen...'
  },
  
  // Component categories
  categories: {
    critical: ['PromoCard', 'StatusBadge', 'LoadingSpinner'],
    display: ['PromoMetrics', 'PromoTypeBadge', 'StatusBadge', 'PromoCard'],
    analysis: ['BreakevenAnalysis', 'PromoMetrics'],
    utility: ['LoadingSpinner', 'EmptyState', 'ConfirmDialog'],
    form: ['PromoWarnings', 'SearchInput']
  },
  
  // Performance hints
  performance: {
    preload: ['PromoCard', 'StatusBadge', 'LoadingSpinner'],
    lazyLoad: ['BreakevenAnalysis', 'PromoMetrics'],
    critical: ['PromoCard', 'LoadingSpinner', 'EmptyState']
  }
} as const;

// ============================================
// USAGE PATTERNS - Common import patterns
// ============================================
export const USAGE_PATTERNS = {
  // Quick imports for common scenarios
  examples: {
    dashboard: `
      // Dashboard components
      import { PromoCard, StatusBadge, EmptyState } from '@/components/promoCalculator/components';
      
      // Or batch load
      const components = await PROMO_PAGE_PRESETS.dashboard();
    `,
    
    list: `
      // List page components
      import { PromoCard, SearchInput, LoadingSpinner } from '@/components/promoCalculator/components';
      
      // Or batch load
      const components = await PROMO_PAGE_PRESETS.list();
    `,
    
    calculator: `
      // Calculator components
      import { PromoWarnings, ConfirmDialog } from '@/components/promoCalculator/components';
      
      // Or batch load
      const components = await PROMO_PAGE_PRESETS.calculator();
    `,
    
    essential: `
      // Essential components only
      import { PromoCard, StatusBadge, PromoTypeBadge } from '@/components/promoCalculator/components';
      
      // Or batch load
      const components = await PROMO_COMPONENT_GROUPS.essential();
    `
  },
  
  // Migration helpers
  migration: {
    beforeOptimization: `
      // OLD: Import everything
      import * as PromoComponents from '@/components/promoCalculator/components';
    `,
    
    afterOptimization: `
      // NEW: Import only what you need
      import { PromoCard, StatusBadge } from '@/components/promoCalculator/components';
      
      // Or use batch loading for related components
      const displayComponents = await PROMO_COMPONENT_GROUPS.display();
    `
  }
} as const;

// ============================================
// TYPE DEFINITIONS - TypeScript support
// ============================================
export type ComponentName = 
  | 'PromoCard'
  | 'PromoMetrics' 
  | 'PromoTypeBadge'
  | 'StatusBadge'
  | 'BreakevenAnalysis'
  | 'LoadingSpinner'
  | 'EmptyState'
  | 'ConfirmDialog'
  | 'PromoWarnings'
  | 'SearchInput';

export type ComponentCategory = 'critical' | 'display' | 'analysis' | 'utility' | 'form';
export type ComponentSize = 'small' | 'medium' | 'large';
export type LoadingPriority = 'critical' | 'high' | 'medium' | 'low';
export type PageType = 'dashboard' | 'calculator' | 'list' | 'analytics';

export interface ComponentInfo {
  name: ComponentName;
  category: ComponentCategory;
  size: ComponentSize;
  priority: LoadingPriority;
  dependencies: ComponentName[];
  loadingMessage: string;
}

// ============================================
// EXPORTS SUMMARY
// ============================================
export const EXPORTS_SUMMARY = {
  totalComponents: 10,
  categories: {
    critical: 3,
    display: 4, 
    analysis: 2,
    utility: 3,
    form: 2
  },
  recommendedUsage: 'Import specific components or use batch loading for related components',
  performanceNote: 'Use PROMO_COMPONENT_GROUPS for better code splitting and loading performance'
} as const;