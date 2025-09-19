// Route preloader utilities for performance optimization
// Provides smart preloading strategies for route-based code splitting

export interface PreloadStrategy {
  immediate?: boolean;
  onHover?: boolean;
  onVisible?: boolean;
  delay?: number;
  priority?: 'high' | 'medium' | 'low';
}

// Route preload registry
const routePreloaders = new Map<string, () => Promise<any>>();
const preloadedRoutes = new Set<string>();

/**
 * Register a route for preloading
 */
export const registerRoutePreloader = (
  routeName: string, 
  preloader: () => Promise<any>
) => {
  routePreloaders.set(routeName, preloader);
};

/**
 * Preload a specific route
 */
export const preloadRoute = async (routeName: string) => {
  if (preloadedRoutes.has(routeName)) {
    return; // Already preloaded
  }

  const preloader = routePreloaders.get(routeName);
  if (!preloader) {
    console.warn(`No preloader registered for route: ${routeName}`);
    return;
  }

  try {
    await preloader();
    preloadedRoutes.add(routeName);
    console.log(`✅ Route preloaded: ${routeName}`);
  } catch (error) {
    console.error(`❌ Failed to preload route ${routeName}:`, error);
  }
};

/**
 * Preload multiple routes with priority
 */
export const preloadRoutes = async (
  routes: Array<{ name: string; priority?: 'high' | 'medium' | 'low' }>
) => {
  const sortedRoutes = routes.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority || 'medium'] - priorityOrder[a.priority || 'medium']);
  });

  // Preload high priority routes immediately
  const highPriorityRoutes = sortedRoutes.filter(r => r.priority === 'high');
  await Promise.all(highPriorityRoutes.map(r => preloadRoute(r.name)));

  // Preload medium priority routes with small delay
  const mediumPriorityRoutes = sortedRoutes.filter(r => r.priority === 'medium');
  setTimeout(() => {
    mediumPriorityRoutes.forEach(r => preloadRoute(r.name));
  }, 100);

  // Preload low priority routes with longer delay
  const lowPriorityRoutes = sortedRoutes.filter(r => r.priority === 'low');
  setTimeout(() => {
    lowPriorityRoutes.forEach(r => preloadRoute(r.name));
  }, 1000);
};

/**
 * Smart preloader hook for components
 */
export const useRoutePreloader = (routeName: string, strategy: PreloadStrategy = {}) => {
  const { 
    immediate = false, 
    onHover = false, 
    onVisible = false, 
    delay = 0,
    priority = 'medium'
  } = strategy;

  React.useEffect(() => {
    if (immediate) {
      if (delay > 0) {
        setTimeout(() => preloadRoute(routeName), delay);
      } else {
        preloadRoute(routeName);
      }
    }
  }, [routeName, immediate, delay]);

  const handleMouseEnter = React.useCallback(() => {
    if (onHover) {
      preloadRoute(routeName);
    }
  }, [routeName, onHover]);

  const visibilityRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (onVisible && visibilityRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              preloadRoute(routeName);
              observer.disconnect();
            }
          });
        },
        { threshold: 0.1 }
      );

      observer.observe(visibilityRef.current);

      return () => observer.disconnect();
    }
  }, [routeName, onVisible]);

  return {
    onMouseEnter: handleMouseEnter,
    ref: visibilityRef
  };
};

/**
 * Preload critical app routes
 */
export const preloadCriticalRoutes = () => {
  preloadRoutes([
    { name: 'dashboard', priority: 'high' },
    { name: 'orders', priority: 'high' },
    { name: 'warehouse', priority: 'medium' },
    { name: 'purchase', priority: 'medium' },
    { name: 'financial', priority: 'medium' },
    { name: 'recipes', priority: 'low' },
    { name: 'promo', priority: 'low' },
    { name: 'operational-costs', priority: 'low' }
  ]);
};

/**
 * Register all route preloaders
 */
export const initializeRoutePreloaders = () => {
  // Core routes
  registerRoutePreloader('dashboard', () => import('../routes/dashboard'));
  registerRoutePreloader('orders', () => import('../components/orders/components/OrdersPage'));
  registerRoutePreloader('warehouse', () => import('../components/warehouse/WarehousePageRefactored'));
  registerRoutePreloader('purchase', () => import('../components/purchase/PurchasePage'));
  registerRoutePreloader('financial', () => import('../components/financial/FinancialReportPage'));
  // Financial tabs and heavy sub-chunks
  registerRoutePreloader('financial:charts-tab', async () => {
    await Promise.all([
      import('../components/financial/report/ChartsTab'),
      import('../components/financial/components/FinancialCharts'),
      import('../components/financial/components/CategoryCharts'),
    ]);
  });
  registerRoutePreloader('financial:transactions-tab', async () => {
    await Promise.all([
      import('../components/financial/report/TransactionsTab'),
      import('../components/financial/components/TransactionTable'),
      import('../components/financial/components/BulkActions'),
    ]);
  });
  registerRoutePreloader('financial:umkm-tab', async () => {
    await Promise.all([
      import('../components/financial/report/UmkmTab'),
      import('../components/financial/components/DailySummaryWidget'),
      import('../components/financial/components/DailyCashFlowTracker'),
      import('../components/financial/components/ProfitLossSimple'),
      import('../components/financial/components/UMKMExpenseCategories'),
      import('../components/financial/components/SavingsGoalTracker'),
      import('../components/financial/components/DebtTracker'),
      import('../components/financial/components/ExpenseAlerts'),
    ]);
  });
  
  // Feature routes
  registerRoutePreloader('recipes', () => import('../pages/Recipes'));
  registerRoutePreloader('promo', () => import('../pages/PromoCalculatorPage'));
  registerRoutePreloader('operational-costs', () => import('../components/operational-costs/OperationalCostPage'));
  registerRoutePreloader('assets', () => import('../components/assets/AssetPage'));
  registerRoutePreloader('invoice', () => import('../components/invoice/InvoicePage'));
  
  // Analysis routes
  // Load dashboard directly to avoid barrel default export issues
  registerRoutePreloader('profit-analysis', () => import('../components/profitAnalysis/components/ImprovedProfitDashboard'));
  
  // Settings routes
  registerRoutePreloader('settings', () => import('../pages/Settings'));
  registerRoutePreloader('devices', () => import('../components/devices/DeviceManagementPage'));
};

// React import for hooks
import React from 'react';
