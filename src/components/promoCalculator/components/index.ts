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
// REFACTORED COMPONENTS - New architecture
// ============================================
export { PromoWizard } from './PromoWizard';
export { PromoCalculationDisplay } from './PromoCalculationDisplay';
export { PromoNavigation } from './PromoNavigation';

// Step Components
export { PromoBasicInfoStep } from './steps/PromoBasicInfoStep';
export { PromoSettingsStep } from './steps/PromoSettingsStep';
export { PromoStatusStep } from './steps/PromoStatusStep';
export { PromoCalculationStep } from './steps/PromoCalculationStep';

// ============================================
// STATIC COMPONENT GROUPS - Removed dynamic imports
// ============================================
export const PROMO_COMPONENT_GROUPS = {
  essential: ['PromoCard', 'PromoTypeBadge', 'StatusBadge'],
  display: ['PromoCard', 'PromoMetrics', 'PromoTypeBadge', 'StatusBadge'],
  analysis: ['BreakevenAnalysis', 'PromoMetrics'],
  utilities: ['LoadingSpinner', 'EmptyState', 'ConfirmDialog'],
  forms: ['PromoWarnings', 'SearchInput']
} as const;

// ============================================
// COMPONENT LOADERS - Removed to fix dynamic imports
// ============================================
// Use direct imports instead: import { PromoCard } from './PromoCard';

// ============================================
// REMOVED: Individual loaders to fix dynamic import conflicts
// Use direct imports instead:
// import PromoCard from './PromoCard';
// ============================================

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
    loadingMessage: ''
  },
  PromoMetrics: {
    category: 'analysis',
    size: 'large', 
    priority: 'high',
    dependencies: ['LoadingSpinner'],
    loadingMessage: ''
  },
  PromoTypeBadge: {
    category: 'display',
    size: 'small',
    priority: 'high',
    dependencies: [],
    loadingMessage: ''
  },
  StatusBadge: {
    category: 'display',
    size: 'small',
    priority: 'critical',
    dependencies: [],
    loadingMessage: ''
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
    loadingMessage: ''
  },
  EmptyState: {
    category: 'utility',
    size: 'large',
    priority: 'high',
    dependencies: [],
    loadingMessage: ''
  },
  ConfirmDialog: {
    category: 'utility',
    size: 'medium',
    priority: 'medium',
    dependencies: [],
    loadingMessage: ''
  },
  PromoWarnings: {
    category: 'form',
    size: 'medium',
    priority: 'low',
    dependencies: ['ConfirmDialog'],
    loadingMessage: ''
  },
  SearchInput: {
    category: 'form',
    size: 'medium',
    priority: 'medium',
    dependencies: ['LoadingSpinner'],
    loadingMessage: ''
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
// BATCH LOADING UTILITIES - Removed to fix dynamic imports
// ============================================
// Use direct imports instead:
// import { PromoCard, StatusBadge } from './components';
// Or use React.lazy for dynamic loading:
// const PromoCard = React.lazy(() => import('./PromoCard'));

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
