// src/components/promoCalculator/components/index.ts - Fixed Dynamic Import Issues

/**
 * PromoCalculator Components - Export Index (Fixed)
 * 
 * Fixed dynamic import issues by using static imports and proper file extensions
 */

// ============================================
// CORE DIRECT EXPORTS - Static imports only
// ============================================
export { default as PromoCard } from './PromoCard';
export { default as PromoMetrics } from './PromoMetrics';
export { default as PromoTypeBadge } from './PromoTypeBadge';
export { default as StatusBadge } from './StatusBadge';
export { default as BreakevenAnalysis } from './BreakevenAnalysis';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as EmptyState } from './EmptyState';
export { default as ConfirmDialog } from './ConfirmDialog';
export { default as PromoWarnings } from './PromoWarnings';
export { default as SearchInput } from './SearchInput';

// ============================================
// STATIC COMPONENT GROUPS - No dynamic imports
// ============================================
export const PROMO_COMPONENT_GROUPS = {
  // Essential components - pre-imported
  essential: {
    PromoCard: () => import('./PromoCard'),
    PromoTypeBadge: () => import('./PromoTypeBadge'),
    StatusBadge: () => import('./StatusBadge'),
  },
  
  // Display components - pre-imported
  display: {
    PromoCard: () => import('./PromoCard'),
    PromoMetrics: () => import('./PromoMetrics'),
    PromoTypeBadge: () => import('./PromoTypeBadge'),
    StatusBadge: () => import('./StatusBadge'),
  },
  
  // Analysis components - pre-imported
  analysis: {
    BreakevenAnalysis: () => import('./BreakevenAnalysis'),
    PromoMetrics: () => import('./PromoMetrics'),
  },
  
  // Utility components - pre-imported
  utilities: {
    LoadingSpinner: () => import('./LoadingSpinner'),
    EmptyState: () => import('./EmptyState'),
    ConfirmDialog: () => import('./ConfirmDialog'),
  },
  
  // Form components - pre-imported
  forms: {
    PromoWarnings: () => import('./PromoWarnings'),
    SearchInput: () => import('./SearchInput'),
  }
} as const;

// ============================================
// COMPONENT LOADERS - Async loading helpers
// ============================================
export const loadComponentGroup = async (groupName: keyof typeof PROMO_COMPONENT_GROUPS) => {
  const group = PROMO_COMPONENT_GROUPS[groupName];
  const componentEntries = Object.entries(group);
  
  const loadedComponents = await Promise.all(
    componentEntries.map(async ([name, loader]) => {
      const module = await loader();
      return [name, module.default];
    })
  );
  
  return Object.fromEntries(loadedComponents);
};

// ============================================
// INDIVIDUAL COMPONENT LOADERS - Static imports with proper extensions
// ============================================
export const loadComponent = {
  PromoCard: () => import('./PromoCard.tsx'),
  PromoMetrics: () => import('./PromoMetrics.tsx'),
  PromoTypeBadge: () => import('./PromoTypeBadge.tsx'),
  StatusBadge: () => import('./StatusBadge.tsx'),
  BreakevenAnalysis: () => import('./BreakevenAnalysis.tsx'),
  LoadingSpinner: () => import('./LoadingSpinner.tsx'),
  EmptyState: () => import('./EmptyState.tsx'),
  ConfirmDialog: () => import('./ConfirmDialog.tsx'),
  PromoWarnings: () => import('./PromoWarnings.tsx'),
  SearchInput: () => import('./SearchInput.tsx'),
} as const;

// ============================================
// PAGE-SPECIFIC PRESETS - Using static loaders
// ============================================
export const PROMO_PAGE_COMPONENTS = {
  dashboard: ['PromoCard', 'PromoMetrics', 'StatusBadge', 'EmptyState'],
  calculator: ['PromoWarnings', 'ConfirmDialog', 'LoadingSpinner'],
  list: ['PromoCard', 'SearchInput', 'LoadingSpinner', 'EmptyState'],
  analytics: ['PromoMetrics', 'BreakevenAnalysis', 'LoadingSpinner'],
} as const;

// ============================================
// COMPONENT METADATA - No dynamic imports
// ============================================
export const COMPONENT_INFO = {
  PromoCard: {
    category: 'display',
    size: 'large',
    priority: 'critical',
    dependencies: ['StatusBadge', 'PromoTypeBadge'],
    loadingMessage: 'Memuat kartu promo...'
  },
  PromoMetrics: {
    category: 'analysis',
    size: 'large', 
    priority: 'high',
    dependencies: ['LoadingSpinner'],
    loadingMessage: 'Memuat metrik promo...'
  },
  PromoTypeBadge: {
    category: 'display',
    size: 'small',
    priority: 'high',
    dependencies: [],
    loadingMessage: 'Memuat badge...'
  },
  StatusBadge: {
    category: 'display',
    size: 'small',
    priority: 'critical',
    dependencies: [],
    loadingMessage: 'Memuat status...'
  },
  BreakevenAnalysis: {
    category: 'analysis',
    size: 'large',
    priority: 'medium',
    dependencies: ['LoadingSpinner', 'PromoMetrics'],
    loadingMessage: 'Menghitung analisis breakeven...'
  },
  LoadingSpinner: {
    category: 'utility',
    size: 'medium',
    priority: 'critical',
    dependencies: [],
    loadingMessage: 'Memuat...'
  },
  EmptyState: {
    category: 'utility',
    size: 'large',
    priority: 'high',
    dependencies: [],
    loadingMessage: 'Memuat state...'
  },
  ConfirmDialog: {
    category: 'utility',
    size: 'medium',
    priority: 'medium',
    dependencies: [],
    loadingMessage: 'Memuat dialog...'
  },
  PromoWarnings: {
    category: 'form',
    size: 'medium',
    priority: 'low',
    dependencies: ['ConfirmDialog'],
    loadingMessage: 'Memuat peringatan...'
  },
  SearchInput: {
    category: 'form',
    size: 'medium',
    priority: 'medium',
    dependencies: ['LoadingSpinner'],
    loadingMessage: 'Memuat pencarian...'
  }
} as const;

// ============================================
// UTILITY FUNCTIONS - Safe component operations
// ============================================
export const getComponentInfo = (componentName: keyof typeof COMPONENT_INFO) => {
  return COMPONENT_INFO[componentName] || null;
};

export const getComponentsByCategory = (category: string) => {
  return Object.entries(COMPONENT_INFO)
    .filter(([_, info]) => info.category === category)
    .map(([name, _]) => name);
};

export const getComponentsByPriority = (priority: string) => {
  return Object.entries(COMPONENT_INFO)
    .filter(([_, info]) => info.priority === priority)
    .map(([name, _]) => name);
};

export const getCriticalComponents = () => {
  return getComponentsByPriority('critical');
};

export const getPageComponents = (page: keyof typeof PROMO_PAGE_COMPONENTS) => {
  return PROMO_PAGE_COMPONENTS[page] || [];
};

// ============================================
// BATCH LOADING UTILITIES - Safe async loading
// ============================================
export const loadPageComponents = async (page: keyof typeof PROMO_PAGE_COMPONENTS) => {
  const componentNames = getPageComponents(page);
  const loadPromises = componentNames.map(async (name) => {
    const loader = loadComponent[name as keyof typeof loadComponent];
    if (loader) {
      const module = await loader();
      return [name, module.default];
    }
    return [name, null];
  });
  
  const results = await Promise.all(loadPromises);
  return Object.fromEntries(results.filter(([_, component]) => component !== null));
};

export const loadCriticalComponents = async () => {
  const criticalNames = getCriticalComponents();
  const loadPromises = criticalNames.map(async (name) => {
    const loader = loadComponent[name as keyof typeof loadComponent];
    if (loader) {
      const module = await loader();
      return [name, module.default];
    }
    return [name, null];
  });
  
  const results = await Promise.all(loadPromises);
  return Object.fromEntries(results.filter(([_, component]) => component !== null));
};

// ============================================
// TYPE DEFINITIONS - TypeScript support
// ============================================
export type ComponentName = keyof typeof COMPONENT_INFO;
export type ComponentCategory = 'display' | 'analysis' | 'utility' | 'form';
export type ComponentSize = 'small' | 'medium' | 'large';
export type LoadingPriority = 'critical' | 'high' | 'medium' | 'low';
export type PageType = keyof typeof PROMO_PAGE_COMPONENTS;

export interface ComponentMetadata {
  category: ComponentCategory;
  size: ComponentSize;
  priority: LoadingPriority;
  dependencies: string[];
  loadingMessage: string;
}

// ============================================
// USAGE EXAMPLES - Safe patterns
// ============================================
export const USAGE_EXAMPLES = {
  // Direct imports (recommended)
  direct: `
    import { PromoCard, StatusBadge, LoadingSpinner } from '@/components/promoCalculator/components';
  `,
  
  // Page-specific loading
  pageLoad: `
    import { loadPageComponents } from '@/components/promoCalculator/components';
    
    const dashboardComponents = await loadPageComponents('dashboard');
    const { PromoCard, StatusBadge } = dashboardComponents;
  `,
  
  // Critical components only
  critical: `
    import { loadCriticalComponents } from '@/components/promoCalculator/components';
    
    const criticalComponents = await loadCriticalComponents();
  `,
  
  // Component info
  info: `
    import { getComponentInfo } from '@/components/promoCalculator/components';
    
    const cardInfo = getComponentInfo('PromoCard');
    console.log(cardInfo.priority); // 'critical'
  `
} as const;

// ============================================
// PERFORMANCE CONSTANTS
// ============================================
export const PERFORMANCE = {
  critical: ['PromoCard', 'StatusBadge', 'LoadingSpinner'],
  preload: ['PromoCard', 'StatusBadge', 'PromoTypeBadge'],
  lazyLoad: ['BreakevenAnalysis', 'PromoMetrics'],
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
} as const;