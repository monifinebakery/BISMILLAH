// src/config/codeSplitting.ts - Konfigurasi Code Splitting Prioritas Tinggi
import React from 'react';
import { logger } from '@/utils/logger';

// ===================================
// 🎯 PRIORITAS TINGGI - CRITICAL COMPONENTS
// ===================================

/**
 * Komponen dengan prioritas sangat tinggi yang membutuhkan code splitting optimal
 * Komponen ini memiliki bundle size besar atau jarang digunakan
 */

// 📊 ANALYTICS & REPORTING COMPONENTS (Bundle Size: ~150KB)
export const ProfitAnalysisComponents = {
  // Komponen dashboard profit yang sangat berat
};

// 🛒 ORDER MANAGEMENT COMPONENTS (Bundle Size: ~120KB)
export const OrderComponents = {
  // Tabel order dengan optimasi
  OrderTable: React.lazy(() => 
    import(/* webpackChunkName: "order-table" */ '@/components/orders/components/OrderTable')
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat tabel pesanan') }))
  ),
  
  // Analytics komponen yang berat
  RecipeAnalytics: React.lazy(() => 
    import(/* webpackChunkName: "recipe-analytics" */ '@/components/orders/components/RecipeAnalytics')
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat analisis resep') }))
  ),
  
  // Dialog komponen yang jarang digunakan
  OrderDialogs: React.lazy(() => 
    import(/* webpackChunkName: "order-dialogs" */ '@/components/orders/components/OrderDialogs')
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat dialog pesanan') }))
  ),

  // OrdersPage dengan mobile enhancements
  OrdersPage: React.lazy(() =>
    import(/* webpackChunkName: "orders-page" */ '@/components/orders/components/OrdersPage')
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat halaman pesanan') }))
  )
};

// 📦 WAREHOUSE & INVENTORY COMPONENTS (Bundle Size: ~100KB)
export const WarehouseComponents = {
  // Tabel warehouse dengan data besar
  WarehouseTable: React.lazy(() => 
    import(/* webpackChunkName: "warehouse-table" */ '@/components/warehouse/components/WarehouseTable')
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat tabel gudang') }))
  )
};

// 💰 FINANCIAL COMPONENTS (Bundle Size: ~90KB)
export const FinancialComponents = {
  // Komponen biaya operasional yang kompleks
  CostList: React.lazy(() => 
    import(/* webpackChunkName: "cost-list" */ '@/components/operational-costs/components/CostList')
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat daftar biaya') }))
  ),
  
  // Invoice page yang berat
  InvoicePage: React.lazy(() => 
    import(/* webpackChunkName: "invoice-page" */ '@/components/invoice/InvoicePage')
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat halaman invoice') }))
  ),
  
  // Invoice template yang kompleks
  InvoiceTemplate: React.lazy(() => 
    import(/* webpackChunkName: "invoice-template" */ '@/components/invoice/templates/InvoiceTemplate')
      .then(module => ({ default: module.InvoiceTemplate }))
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat template invoice') }))
  ),

  // Financial reporting components
  FinancialReportPage: React.lazy(() =>
    import(/* webpackChunkName: "financial-report" */ '@/components/financial/FinancialReportPage')
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat laporan keuangan') }))
  ),

  // Debt tracker component
  DebtTracker: React.lazy(() =>
    import(/* webpackChunkName: "debt-tracker" */ '@/components/financial/components/DebtTracker')
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat debt tracker') }))
  )
};

// ===================================
// 🎯 PRIORITAS SEDANG - SECONDARY COMPONENTS
// ===================================

// 🍳 RECIPE COMPONENTS (Bundle Size: ~70KB)
export const RecipeComponents = {
  RecipeForm: React.lazy(() => 
    import(/* webpackChunkName: "recipe-form" */ '@/components/recipe/components/RecipeForm')
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat form resep') }))
  ),
  
  // Enhanced Recipe Form (Refactored)
  EnhancedRecipeForm: React.lazy(() => 
    import(/* webpackChunkName: "enhanced-recipe-form" */ '@/components/EnhancedRecipeFormRefactored')
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat form resep enhanced') }))
  ),
  
  RecipeTable: React.lazy(() => 
    import(/* webpackChunkName: "recipe-table" */ '@/components/recipe/components/RecipeList/RecipeTable')
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat tabel resep') }))
  ),
  
  RecipeFilters: React.lazy(() => 
    import(/* webpackChunkName: "recipe-filters" */ '@/components/recipe/components/RecipeList/RecipeFilters')
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat filter resep') }))
  ),
  
  IngredientsStep: React.lazy(() =>
    import(/* webpackChunkName: "ingredients-step" */ '@/components/recipe/components/RecipeForm/IngredientsStep')
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat langkah bahan') }))
  )
};

// 🎁 PROMO COMPONENTS (Bundle Size: ~60KB)
export const PromoComponents = {
  PromoCalculator: React.lazy(() => 
    import(/* webpackChunkName: "promo-calculator" */ '@/components/promoCalculator/calculator/PromoCalculator')
      .catch(() => ({ default: () => React.createElement('div', { className: 'p-4 text-center text-red-500' }, 'Gagal memuat kalkulator promo') }))
  )
};

// ===================================
// 🛠️ UTILITY FUNCTIONS
// ===================================

/**
 * Preload komponen berdasarkan prioritas
 * Digunakan untuk preload komponen yang kemungkinan akan digunakan
 */
export const preloadComponents = {
  // Preload komponen prioritas tinggi saat idle
  high: async () => {
    try {
      logger.debug('Code Splitting: Preloading high priority components');
      
  // Preload komponen yang sering digunakan
  await Promise.allSettled([
    import(/* webpackChunkName: "order-table" */ '@/components/orders/components/OrderTable'),
    import(/* webpackChunkName: "warehouse-table" */ '@/components/warehouse/components/WarehouseTable'),
    // ✅ NEW: Preload enhanced financial components
    import(/* webpackChunkName: "financial-report" */ '@/components/financial/FinancialReportPage'),
    import(/* webpackChunkName: "debt-tracker" */ '@/components/financial/components/DebtTracker')
  ]);
      
      logger.debug('Code Splitting: High priority components preloaded');
    } catch (error) {
      logger.error('Code Splitting: Error preloading high priority components:', error);
    }
  },
  
  // Preload komponen berdasarkan route
  byRoute: async (routeName: string) => {
    try {
      logger.debug(`Code Splitting: Preloading components for route: ${routeName}`);
      
      switch (routeName) {
        case 'orders':
          await Promise.allSettled([
            import('@/components/orders/components/OrderTable'),
            import('@/components/orders/components/RecipeAnalytics')
          ]);
          break;
          
        case 'profit-analysis':
          await Promise.allSettled([
          ]);
          break;
          
        case 'warehouse':
          await Promise.allSettled([
            import('@/components/warehouse/components/WarehouseTable')
          ]);
          break;

        case 'financial':
          await Promise.allSettled([
            // ✅ NEW: Preload financial components when navigating to financial routes
            import('@/components/financial/FinancialReportPage'),
            import('@/components/financial/components/DebtTracker'),
            import('@/components/operational-costs/components/CostList')
          ]);
          break;
      }
      
      logger.debug(`Code Splitting: Components for route ${routeName} preloaded`);
    } catch (error) {
      logger.error(`Code Splitting: Error preloading components for route ${routeName}:`, error);
    }
  }
};

/**
 * Hook untuk menggunakan code splitting dengan preloading
 */
export const useCodeSplitting = () => {
  const preloadHighPriority = React.useCallback(() => {
    // Preload saat browser idle
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        preloadComponents.high();
      });
    } else {
      // Fallback untuk browser yang tidak support requestIdleCallback
      setTimeout(() => {
        preloadComponents.high();
      }, 2000);
    }
  }, []);
  
  const preloadByRoute = React.useCallback((routeName: string) => {
    preloadComponents.byRoute(routeName);
  }, []);
  
  return {
    preloadHighPriority,
    preloadByRoute
  };
};

// ===================================
// 📊 BUNDLE ANALYSIS HELPERS
// ===================================

/**
 * Informasi bundle size untuk monitoring
 */
export const BUNDLE_INFO = {
  'profit-dashboard': { estimatedSize: '~150KB', priority: 'high' },
  'profit-breakdown': { estimatedSize: '~80KB', priority: 'high' },
  'profit-summary': { estimatedSize: '~70KB', priority: 'high' },
  'order-form': { estimatedSize: '~60KB', priority: 'high' },
  'order-table': { estimatedSize: '~50KB', priority: 'high' },
  'order-bulk': { estimatedSize: '~40KB', priority: 'medium' },
  'orders-page': { estimatedSize: '~75KB', priority: 'high' }, // ✅ NEW: Enhanced OrdersPage
  'warehouse-table': { estimatedSize: '~45KB', priority: 'high' },
  'stock-management': { estimatedSize: '~55KB', priority: 'medium' },
  'cost-list': { estimatedSize: '~35KB', priority: 'medium' },
  'financial-report': { estimatedSize: '~65KB', priority: 'high' }, // ✅ NEW: FinancialReportPage
  'debt-tracker': { estimatedSize: '~40KB', priority: 'medium' }, // ✅ NEW: DebtTracker
  'invoice-generator': { estimatedSize: '~55KB', priority: 'medium' },
  'recipe-form': { estimatedSize: '~30KB', priority: 'low' },
  'recipe-calculator': { estimatedSize: '~40KB', priority: 'low' },
  'promo-calculator': { estimatedSize: '~35KB', priority: 'low' }
} as const;

export default {
  ProfitAnalysisComponents,
  OrderComponents,
  WarehouseComponents,
  FinancialComponents,
  RecipeComponents,
  PromoComponents,
  preloadComponents,
  useCodeSplitting,
  BUNDLE_INFO
};
