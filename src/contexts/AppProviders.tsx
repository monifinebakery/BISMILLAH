// src/contexts/AppProviders.tsx - MOBILE-OPTIMIZED PROGRESSIVE LOADING
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
import { FinancialProvider } from '@/components/financial/contexts/FinancialContext';
import { RecipeProvider } from './RecipeContext';
import { SupplierProvider } from './SupplierContext';

// ⚡ LOW PRIORITY: Load last
import { PurchaseProvider } from '@/components/purchase/context/PurchaseContext';
import { OrderProvider } from '@/components/orders/context/OrderProvider';
import { FollowUpTemplateProvider } from './FollowUpTemplateContext';
import { OperationalCostProvider } from '@/components/operational-costs/context/OperationalCostContext';
import { PromoProvider } from '@/components/promoCalculator/context/PromoContext';
import { ProfitAnalysisProvider } from '@/components/profitAnalysis';
import { DeviceProvider } from './DeviceContext';

// ⚡ MOBILE: Import lazy wrapper components
import { LazyProviderWrapper, MobileProviderQueue } from './LazyProviderWrapper';

interface AppProvidersProps {
  children: ReactNode;
}

// ⚡ MOBILE-OPTIMIZED: Dynamic BahanBakuProvider dengan timeout dan fallback
const DynamicBahanBakuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [BahanBakuProvider, setBahanBakuProvider] = React.useState<React.ComponentType<{ children: ReactNode }> | null>(null);
  const isMobile = useIsMobile();

  React.useEffect(() => {
    const loadProvider = async () => {
      try {
        // ⚡ MOBILE: Shorter timeout untuk mobile
        const timeout = isMobile ? 3000 : 5000;
        const importPromise = import('@/components/warehouse/context/WarehouseContext');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('BahanBakuProvider import timeout')), timeout)
        );

        const { BahanBakuProvider } = await Promise.race([importPromise, timeoutPromise]) as any;
        setBahanBakuProvider(() => BahanBakuProvider);
        logger.debug('BahanBakuProvider loaded successfully (mobile:', isMobile, ')');
      } catch (error) {
        logger.error('Failed to load BahanBakuProvider:', error);
        // Provide non-blocking fallback
        setBahanBakuProvider(() => ({ children }: { children: ReactNode }) => <>{children}</>);
      }
    };

    // ⚡ MOBILE: Delayed load to not block initial render
    const delay = isMobile ? 200 : 100;
    const timer = setTimeout(loadProvider, delay);
    
    return () => clearTimeout(timer);
  }, [isMobile]);

  if (!BahanBakuProvider) {
    // ⚡ MOBILE: Lighter loading state
    return (
      <div className={`${
        isMobile ? 'text-xs py-1' : 'text-sm py-2'
      } text-center text-gray-500`}>
        Loading warehouse...
      </div>
    );
  }

  return <BahanBakuProvider>{children}</BahanBakuProvider>;
};

/**
 * ⚡ MOBILE-OPTIMIZED: Progressive Provider Loading
 * Load providers berdasarkan priority untuk mengurangi loading time
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [loadingStage, setLoadingStage] = useState(1);

  // ⚡ MOBILE: Auto-advance loading stages
  useEffect(() => {
    const stageDelay = isMobile ? 150 : 200;
    
    // Auto-advance stages dengan delay
    const timers = [
      setTimeout(() => setLoadingStage(2), stageDelay),
      setTimeout(() => setLoadingStage(3), stageDelay * 2),
      setTimeout(() => setLoadingStage(4), stageDelay * 3),
    ];
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [isMobile]);

  // ⚡ MOBILE: Define provider queue dengan priority
  const providerQueue = [
    // CRITICAL: Load immediately
    { component: NotificationProvider, name: 'Notification', priority: 'critical' as const },
    { component: UserSettingsProvider, name: 'UserSettings', priority: 'critical' as const },
    
    // HIGH: Load after critical
    { component: ActivityProvider, name: 'Activity', priority: 'high' as const },
    { component: FinancialProvider, name: 'Financial', priority: 'high' as const },
    { component: RecipeProvider, name: 'Recipe', priority: 'high' as const },
    
    // MEDIUM: Load progressively
    { component: SupplierProvider, name: 'Supplier', priority: 'medium' as const },
    { component: PurchaseProvider, name: 'Purchase', priority: 'medium' as const },
    { component: OrderProvider, name: 'Order', priority: 'medium' as const },
    
    // LOW: Load last
    { component: OperationalCostProvider, name: 'OperationalCost', priority: 'low' as const },
    { component: PromoProvider, name: 'Promo', priority: 'low' as const },
    { component: FollowUpTemplateProvider, name: 'FollowUpTemplate', priority: 'low' as const },
    { component: DeviceProvider, name: 'Device', priority: 'low' as const },
    { component: ProfitAnalysisProvider, name: 'ProfitAnalysis', priority: 'low' as const },
  ];
  
  return (
    <>
      {/* ⚡ CRITICAL: Always load immediately */}
      <AuthProvider>
        <PaymentProvider>
          {loadingStage >= 1 && (
            <MobileProviderQueue providers={providerQueue.filter(p => p.priority === 'critical')}>
              {loadingStage >= 2 && (
                <LazyProviderWrapper priority="high">
                  <MobileProviderQueue providers={providerQueue.filter(p => p.priority === 'high')}>
                    {loadingStage >= 3 && (
                      <LazyProviderWrapper priority="medium">
                        <MobileProviderQueue providers={providerQueue.filter(p => p.priority === 'medium')}>
                          {loadingStage >= 4 && (
                            <LazyProviderWrapper priority="low">
                              <MobileProviderQueue providers={providerQueue.filter(p => p.priority === 'low')}>
                                <DynamicBahanBakuProvider>
                                  {/* ⚡ APP CONTENT - Load when all providers ready */}
                                  {children}
                                </DynamicBahanBakuProvider>
                              </MobileProviderQueue>
                            </LazyProviderWrapper>
                          )}
                          {loadingStage < 4 && (
                            <div className={`min-h-screen flex items-center justify-center bg-gray-50`}>
                              <div className="text-center">
                                <div className={`${
                                  isMobile ? 'w-8 h-8' : 'w-12 h-12'
                                } border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3`}></div>
                                <p className={`${
                                  isMobile ? 'text-sm' : 'text-base'
                                } text-gray-600`}>Memuat fitur tambahan...</p>
                                <p className="text-xs text-gray-400 mt-1">Stage {loadingStage}/4</p>
                              </div>
                            </div>
                          )}
                        </MobileProviderQueue>
                      </LazyProviderWrapper>
                    )}
                    {loadingStage < 3 && (
                      <div className={`min-h-screen flex items-center justify-center bg-gray-50`}>
                        <div className="text-center">
                          <div className={`${
                            isMobile ? 'w-10 h-10' : 'w-14 h-14'
                          } border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
                          <p className={`${
                            isMobile ? 'text-base' : 'text-lg'
                          } text-gray-700 font-medium`}>Memuat komponen utama...</p>
                          <p className="text-xs text-gray-400 mt-1">Stage {loadingStage}/4</p>
                        </div>
                      </div>
                    )}
                  </MobileProviderQueue>
                </LazyProviderWrapper>
              )}
              {loadingStage < 2 && (
                <div className={`min-h-screen flex items-center justify-center bg-gray-50`}>
                  <div className="text-center">
                    <div className={`${
                      isMobile ? 'w-12 h-12' : 'w-16 h-16'
                    } border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6`}></div>
                    <h2 className={`${
                      isMobile ? 'text-lg' : 'text-xl'
                    } font-semibold text-gray-700 mb-2`}>Memuat Aplikasi</h2>
                    <p className="text-gray-500">Menyiapkan sistem...</p>
                    <p className="text-xs text-gray-400 mt-2">Stage {loadingStage}/4</p>
                  </div>
                </div>
              )}
            </MobileProviderQueue>
          )}
          {loadingStage < 1 && (
            <div className={`min-h-screen flex items-center justify-center bg-gray-50`}>
              <div className="text-center">
                <div className={`${
                  isMobile ? 'w-12 h-12' : 'w-16 h-16'
                } border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6`}></div>
                <h2 className={`${
                  isMobile ? 'text-lg' : 'text-xl'
                } font-semibold text-gray-700 mb-2`}>Memuat Autentikasi</h2>
                <p className="text-gray-500">Memverifikasi akses...</p>
              </div>
            </div>
          )}
        </PaymentProvider>
      </AuthProvider>
      
      {/* ✅ GLOBAL UI */}
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
