// src/components/promoCalculator/analytics/index.ts - Optimized Dependencies (8 → 4)
/**
 * PromoCalculator Analytics - Essential Components Only
 * 
 * HANYA components yang essential untuk analytics functionality
 * Dependencies reduced from 8 to 4 - 50% reduction!
 */

// ✅ CORE ANALYTICS COMPONENTS: Essential analytics functionality (4 exports)
export { default as PromoAnalytics } from './PromoAnalytics';
export { default as HppAnalysisChart } from './HppAnalysisChart';
export { default as ProfitAnalysisChart } from './ProfitAnalysisChart';
export { default as PromoPerformanceCard } from './PromoPerformanceCard';

// ❌ REMOVED - Better code splitting (4+ exports removed):
// - Re-exports with wildcard (export * from './...')
// - Internal chart utilities
// - Chart configuration objects
// - Analytics helper components
//
// Use direct imports for better tree-shaking:
// import { chartConfig } from './PromoAnalytics';
// import { analyticsHelpers } from './HppAnalysisChart';

// ✅ ANALYTICS GROUPS: For batch loading related components
export const PROMO_ANALYTICS_GROUPS = {
  // Core analytics - main component with performance card
  core: () => Promise.all([
    import('./PromoAnalytics'),
    import('./PromoPerformanceCard')
  ]).then(([analytics, performance]) => ({
    PromoAnalytics: analytics.default,
    PromoPerformanceCard: performance.default
  })),
  
  // Chart components - analysis charts
  charts: () => Promise.all([
    import('./HppAnalysisChart'),
    import('./ProfitAnalysisChart')
  ]).then(([hpp, profit]) => ({
    HppAnalysisChart: hpp.default,
    ProfitAnalysisChart: profit.default
  })),
  
  // Complete analytics - all components
  complete: () => Promise.all([
    import('./PromoAnalytics'),
    import('./HppAnalysisChart'),
    import('./ProfitAnalysisChart'),
    import('./PromoPerformanceCard')
  ]).then(([analytics, hpp, profit, performance]) => ({
    PromoAnalytics: analytics.default,
    HppAnalysisChart: hpp.default,
    ProfitAnalysisChart: profit.default,
    PromoPerformanceCard: performance.default
  }))
} as const;

// ✅ ANALYTICS TYPES: For different analysis needs
export const PROMO_ANALYTICS_TYPES = {
  // Financial analysis - HPP and profit charts
  financial: () => PROMO_ANALYTICS_GROUPS.charts(),
  
  // Performance analysis - analytics with performance metrics
  performance: () => PROMO_ANALYTICS_GROUPS.core(),
  
  // Comprehensive analysis - all analytics components
  comprehensive: () => PROMO_ANALYTICS_GROUPS.complete()
} as const;

// ✅ ANALYTICS UTILITIES: Helper functions for analytics management
export const PROMO_ANALYTICS_UTILS = {
  // Get components by analysis type
  getComponentsByAnalysisType: async (type: 'financial' | 'performance' | 'comprehensive') => {
    return await PROMO_ANALYTICS_TYPES[type]();
  },
  
  // Check if component is data-heavy (needs lazy loading)
  isDataHeavyComponent: (componentName: string): boolean => {
    const dataHeavyComponents = ['PromoAnalytics', 'HppAnalysisChart', 'ProfitAnalysisChart'];
    return dataHeavyComponents.includes(componentName);
  },
  
  // Get component loading strategy
  getLoadingStrategy: (componentName: string): 'eager' | 'lazy' | 'onDemand' => {
    const strategyMap: Record<string, 'eager' | 'lazy' | 'onDemand'> = {
      PromoAnalytics: 'lazy',
      HppAnalysisChart: 'onDemand',
      ProfitAnalysisChart: 'onDemand', 
      PromoPerformanceCard: 'eager'
    };
    
    return strategyMap[componentName] || 'lazy';
  },
  
  // Preload based on user access level
  preloadByAccessLevel: async (accessLevel: 'basic' | 'advanced' | 'admin') => {
    switch (accessLevel) {
      case 'basic':
        return await PROMO_ANALYTICS_GROUPS.core();
      
      case 'advanced':
        return await PROMO_ANALYTICS_GROUPS.complete();
      
      case 'admin':
        const complete = await PROMO_ANALYTICS_GROUPS.complete();
        // Admin gets additional utilities if available
        return complete;
      
      default:
        return await PROMO_ANALYTICS_GROUPS.core();
    }
  },
  
  // Calculate component bundle size priority
  getBundlePriority: (componentName: string): 'high' | 'medium' | 'low' => {
    const sizeMap: Record<string, 'high' | 'medium' | 'low'> = {
      PromoAnalytics: 'high',
      HppAnalysisChart: 'medium',
      ProfitAnalysisChart: 'medium',
      PromoPerformanceCard: 'low'
    };
    
    return sizeMap[componentName] || 'medium';
  }
} as const;

// ✅ ANALYTICS CONSTANTS: Analytics-specific configurations
export const ANALYTICS_CONSTANTS = {
  // Component types
  componentTypes: {
    PromoAnalytics: 'dashboard',
    HppAnalysisChart: 'chart',
    ProfitAnalysisChart: 'chart',
    PromoPerformanceCard: 'metric'
  },
  
  // Data refresh intervals (in ms)
  refreshIntervals: {
    PromoAnalytics: 30000,      // 30 seconds
    HppAnalysisChart: 60000,    // 1 minute
    ProfitAnalysisChart: 60000, // 1 minute
    PromoPerformanceCard: 15000 // 15 seconds
  },
  
  // Loading messages
  loading: {
    PromoAnalytics: 'Memuat dashboard analytics...',
    HppAnalysisChart: 'Menghitung analisis HPP...',
    ProfitAnalysisChart: 'Menganalisis profitabilitas...',
    PromoPerformanceCard: 'Memuat metrik performa...'
  },
  
  // Error messages
  errors: {
    dataFetch: 'Gagal memuat data analytics',
    chartRender: 'Gagal merender chart',
    calculation: 'Error dalam perhitungan analytics'
  },
  
  // Chart configurations
  charts: {
    defaultHeight: 300,
    defaultWidth: '100%',
    animationDuration: 750,
    colors: {
      primary: '#3B82F6',
      success: '#10B981', 
      warning: '#F59E0B',
      danger: '#EF4444'
    }
  }
} as const;

// ✅ MIGRATION HELPER: For analytics usage patterns
export const PROMO_ANALYTICS_MIGRATION = {
  instructions: `
    // CURRENT (essential components - still exported):
    import { 
      PromoAnalytics, 
      HppAnalysisChart, 
      ProfitAnalysisChart, 
      PromoPerformanceCard 
    } from '@/components/promoCalculator/analytics';
    
    // REMOVED (wildcard re-exports):
    // export * from './PromoAnalytics';         // ❌ No longer available
    // export * from './HppAnalysisChart';       // ❌ No longer available
    
    // FOR INTERNAL EXPORTS (direct import):
    import { chartConfig } from '@/components/promoCalculator/analytics/PromoAnalytics';
    import { analyticsHelpers } from '@/components/promoCalculator/analytics/HppAnalysisChart';
    
    // OR (group loading - batch imports):
    const coreAnalytics = await PROMO_ANALYTICS_GROUPS.core();
    const allCharts = await PROMO_ANALYTICS_GROUPS.charts();
    
    // OR (by analysis type):
    const financialAnalytics = await PROMO_ANALYTICS_TYPES.financial();
    const comprehensiveAnalytics = await PROMO_ANALYTICS_TYPES.comprehensive();
    
    // OR (by access level):
    const components = await PROMO_ANALYTICS_UTILS.preloadByAccessLevel('advanced');
  `,
  
  // Migration impact checker
  checkMigrationImpact: (currentImports: string[]) => {
    const wildcardImports = currentImports.filter(imp => imp.includes('*'));
    const affectedWildcards = wildcardImports.length;
    
    return {
      needsMigration: affectedWildcards > 0,
      wildcardImports: affectedWildcards,
      severity: affectedWildcards > 2 ? 'high' : affectedWildcards > 0 ? 'medium' : 'low',
      recommendation: affectedWildcards > 0 
        ? `Replace ${affectedWildcards} wildcard imports with direct imports or use component groups`
        : 'No migration needed - no wildcard imports detected'
    };
  },
  
  // Get optimized setup for common scenarios
  getOptimizedSetups: async () => {
    const [financial, performance, comprehensive] = await Promise.all([
      PROMO_ANALYTICS_TYPES.financial(),
      PROMO_ANALYTICS_TYPES.performance(),
      PROMO_ANALYTICS_TYPES.comprehensive()
    ]);
    
    return {
      financial,
      performance, 
      comprehensive,
      utils: PROMO_ANALYTICS_UTILS,
      constants: ANALYTICS_CONSTANTS
    };
  },
  
  // Bundle size optimizer
  optimizeBundleSize: (requiredComponents: string[]) => {
    const prioritized = requiredComponents.sort((a, b) => {
      const aPriority = PROMO_ANALYTICS_UTILS.getBundlePriority(a);
      const bPriority = PROMO_ANALYTICS_UTILS.getBundlePriority(b);
      
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[bPriority] - priorityOrder[aPriority];
    });
    
    return {
      loadOrder: prioritized,
      lazyLoadCandidates: prioritized.filter(comp => 
        PROMO_ANALYTICS_UTILS.isDataHeavyComponent(comp)
      ),
      eagerLoadCandidates: prioritized.filter(comp => 
        !PROMO_ANALYTICS_UTILS.isDataHeavyComponent(comp)
      )
    };
  }
} as const;