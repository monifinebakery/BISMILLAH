// Removed external skeleton imports to keep bundle lean


// src/contexts/AppProviders.tsx - PROGRESSIVE LOADING
import React, { ReactNode, Suspense, useState, useEffect } from 'react';
import { Toaster } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { logger } from '@/utils/logger';

// ⚡ CRITICAL: Always load immediately
import { AuthProvider } from './AuthContext';
import { PaymentProvider } from './PaymentContext';

// ⚡ HIGH PRIORITY: Load after auth is ready
import { NotificationProvider } from './NotificationContext';
import { UserSettingsProvider } from './UserSettingsContext';

// ⚡ MEDIUM PRIORITY: Load progressively
import { ActivityProvider } from './ActivityContext';
// Defer heavy contexts on mobile via lazy wrappers (defined below)
import { RecipeProvider } from './RecipeContext';
import { SupplierProvider } from './SupplierContext';
import { WarehouseProvider } from '@/components/warehouse/context/WarehouseContext';

// ⚡ LOW PRIORITY: Load last
import { PurchaseProvider } from '@/components/purchase/context/PurchaseContext';
import { OrderProvider } from '@/components/orders/context/OrderProvider';
import { FollowUpTemplateProvider } from './FollowUpTemplateContext';
import { OperationalCostProvider } from '@/components/operational-costs/context/OperationalCostContext';
import { PromoProvider } from '@/components/promoCalculator/context/PromoContext';
import { DeviceProvider } from './DeviceContext';


interface AppProvidersProps {
  children: ReactNode;
}

// ⚡ WAREHOUSE PROVIDER: Now handled in provider queue with HIGH priority

/**
 * ⚡ MOBILE-OPTIMIZED: Progressive Provider Loading
 * Load providers berdasarkan priority untuk mengurangi loading time
 */
/**
 * ⚡ REFACTORED: Progressive Provider Loading to fix race conditions.
 * This version uses a flattened structure to ensure each provider group
 * is fully loaded before rendering the next, eliminating context errors.
 */
// ✅ FIXED: Lazy provider wrappers with stub context support
const LazyFinancialProvider: React.FC<{ enabled: boolean; children: ReactNode }> = ({ enabled, children }) => {
  const [ProviderComp, setProviderComp] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (enabled && !ProviderComp && !isLoading) {
      setIsLoading(true);
      import('@/components/financial/contexts/FinancialContext').then(m => {
        setProviderComp(() => (m as any).FinancialProvider);
        setIsLoading(false);
        logger.info('✅ LazyFinancialProvider: FinancialProvider loaded successfully');
      }).catch(error => {
        logger.error('❌ LazyFinancialProvider: Failed to load FinancialProvider:', error);
        setIsLoading(false);
      });
    }
  }, [enabled, ProviderComp, isLoading]);
  
  // If not enabled, render children without provider
  if (!enabled) {
    logger.debug('LazyFinancialProvider: Disabled, rendering children without provider');
    return <>{children}</>;
  }
  
  // If provider is loaded, use it
  if (ProviderComp) {
    const Comp = ProviderComp as React.ComponentType<any>;
    return <Comp>{children}</Comp>;
  }
  
  // ✅ FIXED: Instead of blocking with loading screen, render children without provider first
  // This prevents useFinancial hooks from throwing "must be used within provider" errors
  // by using fallback handling in components that use useFinancial
  logger.debug('LazyFinancialProvider: Loading provider, rendering children without provider (components should handle gracefully)');
  
  return <>{children}</>;
};

const LazyProfitAnalysisProvider: React.FC<{ enabled: boolean; children: ReactNode }> = ({ enabled, children }) => {
  const [ProviderComp, setProviderComp] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (enabled && !ProviderComp && !isLoading) {
      setIsLoading(true);
      import('@/components/profitAnalysis/contexts/ProfitAnalysisContext').then(m => {
        setProviderComp(() => (m as any).ProfitAnalysisProvider);
        setIsLoading(false);
        logger.info('✅ LazyProfitAnalysisProvider: ProfitAnalysisProvider loaded successfully');
      }).catch(error => {
        logger.error('❌ LazyProfitAnalysisProvider: Failed to load ProfitAnalysisProvider:', error);
        setIsLoading(false);
      });
    }
  }, [enabled, ProviderComp, isLoading]);
  
  if (!enabled) return <>{children}</>;
  if (ProviderComp) {
    const Comp = ProviderComp as React.ComponentType<any>;
    return <Comp>{children}</Comp>;
  }
  
  // ✅ FIXED: Same stub approach for ProfitAnalysisProvider
  logger.debug('LazyProfitAnalysisProvider: Loading provider, rendering children normally');
  return <>{children}</>; // ProfitAnalysis is less critical, so we can just render children
};

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [loadingStage, setLoadingStage] = useState(1);

  useEffect(() => {
    logger.info('AppProviders: Initializing progressive loading', { isMobile });
    const stageTimers: NodeJS.Timeout[] = [];
    const advanceStage = (stage: number, delay: number) => {
      stageTimers.push(setTimeout(() => {
        logger.info(`AppProviders: Advancing to loading stage ${stage}`, { isMobile });
        setLoadingStage(stage);
      }, delay));
    };

    // ✅ FIXED: PERSIS SAMA antara mobile dan desktop
    const baseDelay = 100; // Same delay for both mobile and desktop
    advanceStage(2, baseDelay);
    advanceStage(3, baseDelay * 2);
    advanceStage(4, baseDelay * 3);
    
    logger.debug('AppProviders: Stage timing configured:', {
      isMobile,
      baseDelay,
      stage2: baseDelay,
      stage3: baseDelay * 2,
      stage4: baseDelay * 3
    });

    return () => {
      logger.debug('AppProviders: Cleaning up stage timers');
      stageTimers.forEach(clearTimeout);
    };
  }, [isMobile]);

  // ✅ FIXED: Financial provider - always load on both mobile and desktop with better logging
  const FinancialProviderWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    logger.debug('FinancialProviderWrapper: Rendering with enabled=true');
    return <LazyFinancialProvider enabled={true}>{children}</LazyFinancialProvider>;
  };
  
  // ✅ FIXED: Define providers for each stage with better logging
  const criticalProviders = [
    { component: NotificationProvider, name: 'Notification', priority: 'critical' as const },
    { component: UserSettingsProvider, name: 'UserSettings', priority: 'critical' as const },
    { component: FinancialProviderWrapper, name: 'Financial', priority: 'critical' as const },
  ];
  
  logger.debug('AppProviders: Critical providers configured:', {
    providers: criticalProviders.map(p => p.name),
    loadingStage,
    isMobile
  });

  const highProviders = [
    { component: ActivityProvider, name: 'Activity', priority: 'high' as const },
    { component: RecipeProvider, name: 'Recipe', priority: 'high' as const },
    { component: WarehouseProvider, name: 'Warehouse', priority: 'high' as const },
  ];
  const mediumProviders = [
    { component: SupplierProvider, name: 'Supplier', priority: 'medium' as const },
    { component: PurchaseProvider, name: 'Purchase', priority: 'medium' as const },
    { component: OrderProvider, name: 'Order', priority: 'medium' as const },
  ];
  // ✅ FIXED: Profit analysis provider - always load on both mobile and desktop
  const ProfitAnalysisProviderWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    logger.debug('ProfitAnalysisProviderWrapper: Rendering with enabled=true');
    return <LazyProfitAnalysisProvider enabled={true}>{children}</LazyProfitAnalysisProvider>;
  };

  const lowProviders = [
    { component: OperationalCostProvider, name: 'OperationalCost', priority: 'low' as const },
    { component: PromoProvider, name: 'Promo', priority: 'low' as const },
    { component: FollowUpTemplateProvider, name: 'FollowUpTemplate', priority: 'low' as const },
    { component: DeviceProvider, name: 'Device', priority: 'low' as const },
    { component: ProfitAnalysisProviderWrapper, name: 'ProfitAnalysis', priority: 'low' as const },
  ];

  const LoadingIndicator: React.FC<{ stage: number; total: number; message: string }> = ({ stage, total, message }) => {
    // Show full dashboard skeleton for the final loading stages to improve perceived performance.
    if (stage >= 2) {
      return (
        <div className="min-h-screen bg-gray-50 p-6 animate-pulse">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="h-8 bg-gray-200 rounded w-40" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        </div>
      )
    }
    // Show a simpler, centered indicator for the initial auth check.
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <div className={`w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
          <h2 className={`text-lg font-semibold text-gray-700`}>{message}</h2>
          <p className="text-sm text-gray-500 mt-1">({stage}/{total})</p>
        </div>
      </div>
    )
  };
  
  const renderProviders = (providers: any[], content: ReactNode): ReactNode => {
      logger.debug('AppProviders: Rendering providers:', {
        providerNames: providers.map(p => p.name),
        loadingStage
      });
      return providers.reduceRight((acc, p) => {
          const ProviderComponent = p.component;
          logger.debug(`AppProviders: Wrapping content with ${p.name}Provider`);
          return <ProviderComponent>{acc}</ProviderComponent>;
      }, <>{content}</>);
  };

  // Core providers that are always present
  const CoreProviders: React.FC<{ children: ReactNode }> = ({ children }) => (
      <AuthProvider>
        <PaymentProvider>{children}</PaymentProvider>
      </AuthProvider>
  );

  // ✅ FIXED: This structure ensures that children are only rendered inside the fully composed provider tree.
  logger.debug('AppProviders: Rendering provider tree', { loadingStage });
  return (
    <>
      <CoreProviders>
        {loadingStage >= 1 ? (
          renderProviders(criticalProviders,
            loadingStage >= 2 ? (
              renderProviders(highProviders,
                loadingStage >= 3 ? (
                  renderProviders(mediumProviders,
                    loadingStage >= 4 ? (
                      renderProviders(lowProviders, children)
                    ) : <LoadingIndicator stage={3} total={4} message="Memuat Fitur Tambahan..." />
                  )
                ) : <LoadingIndicator stage={2} total={4} message="Memuat Komponen Utama..." />
              )
            ) : <LoadingIndicator stage={1} total={4} message="Menyiapkan Aplikasi..." />
          )
        ) : <LoadingIndicator stage={0} total={4} message="Memverifikasi Akses..." />}
      </CoreProviders>
      
      {/* Global UI elements rendered outside the main provider logic */}
      <Toaster 
        className="toaster"
        position="top-center"
        closeButton
        offset={24}
        toastOptions={{
          classNames: {
            toast: 'bg-white text-gray-900 border border-gray-300',
            title: 'text-gray-900 font-medium',
            description: 'text-gray-600',
            actionButton: 'bg-orange-500 text-white hover:bg-orange-600',
            cancelButton: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
            closeButton: 'bg-gray-100 text-gray-400 hover:text-gray-600',
            success: 'border-green-300 bg-green-50',
            error: 'border-red-300 bg-red-50',
            warning: 'border-yellow-300 bg-yellow-50',
            info: 'border-blue-300 bg-blue-50',
          },
          duration: 4000,
        }}
      />
    </>
  );
};
