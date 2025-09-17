// Removed external skeleton imports to keep bundle lean


// src/contexts/AppProviders.tsx - MOBILE-OPTIMIZED PROGRESSIVE LOADING
import React, { ReactNode, Suspense, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
// Lazy provider wrappers
const LazyFinancialProvider: React.FC<{ enabled: boolean; children: ReactNode }> = ({ enabled, children }) => {
  const [ProviderComp, setProviderComp] = useState<React.ComponentType<any> | null>(null);
  useEffect(() => {
    if (enabled && !ProviderComp) {
      import('@/components/financial/contexts/FinancialContext').then(m => {
        setProviderComp(() => (m as any).FinancialProvider);
      });
    }
  }, [enabled, ProviderComp]);
  if (!enabled) return <>{children}</>;
  if (!ProviderComp) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center text-gray-600">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <div className="text-sm">Memuat Laporan Keuangan...</div>
      </div>
    </div>
  );
  const Comp = ProviderComp as React.ComponentType<any>;
  return <Comp>{children}</Comp>;
};

const LazyProfitAnalysisProvider: React.FC<{ enabled: boolean; children: ReactNode }> = ({ enabled, children }) => {
  const [ProviderComp, setProviderComp] = useState<React.ComponentType<any> | null>(null);
  useEffect(() => {
    if (enabled && !ProviderComp) {
      import('@/components/profitAnalysis/contexts/ProfitAnalysisContext').then(m => {
        setProviderComp(() => (m as any).ProfitAnalysisProvider);
      });
    }
  }, [enabled, ProviderComp]);
  if (!enabled) return <>{children}</>;
  if (!ProviderComp) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center text-gray-600">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <div className="text-sm">Memuat Analisis Profit...</div>
      </div>
    </div>
  );
  const Comp = ProviderComp as React.ComponentType<any>;
  return <Comp>{children}</Comp>;
};

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [loadingStage, setLoadingStage] = useState(1);

  useEffect(() => {
    const stageTimers: NodeJS.Timeout[] = [];
    const advanceStage = (stage: number, delay: number) => {
      stageTimers.push(setTimeout(() => {
        logger.info(`AppProviders: Advancing to loading stage ${stage}`);
        setLoadingStage(stage);
      }, delay));
    };

    const baseDelay = isMobile ? 80 : 120;
    advanceStage(2, baseDelay);
    advanceStage(3, baseDelay * 2);
    advanceStage(4, baseDelay * 3);

    return () => stageTimers.forEach(clearTimeout);
  }, [isMobile]);

  // Financial provider is heavy; mount only when needed on mobile routes
  const onFinancialRoute = location.pathname.startsWith('/laporan') || location.pathname.startsWith('/purchase') || location.pathname.startsWith('/pembelian');
  const FinancialProviderWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <LazyFinancialProvider enabled={isMobile ? onFinancialRoute : true}>{children}</LazyFinancialProvider>
  );
  
  // Define providers for each stage
  const criticalProviders = [
    { component: NotificationProvider, name: 'Notification', priority: 'critical' as const },
    { component: UserSettingsProvider, name: 'UserSettings', priority: 'critical' as const },
    { component: FinancialProviderWrapper, name: 'Financial', priority: 'critical' as const },
  ];

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
  // Profit analysis provider is heavy; mount only when needed on mobile routes
  const onProfitRoute = location.pathname.startsWith('/analisis-profit');
  const ProfitAnalysisProviderWrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <LazyProfitAnalysisProvider enabled={isMobile ? onProfitRoute : true}>{children}</LazyProfitAnalysisProvider>
  );

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
      return providers.reduceRight((acc, p) => {
          const ProviderComponent = p.component;
          return <ProviderComponent>{acc}</ProviderComponent>;
      }, <>{content}</>);
  };

  // Core providers that are always present
  const CoreProviders: React.FC<{ children: ReactNode }> = ({ children }) => (
      <AuthProvider>
        <PaymentProvider>{children}</PaymentProvider>
      </AuthProvider>
  );

  // This structure ensures that children are only rendered inside the fully composed provider tree.
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
