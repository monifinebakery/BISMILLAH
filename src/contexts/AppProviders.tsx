// src/contexts/AppProviders.tsx - UPDATED WITH PROFIT ANALYSIS PROVIDER
import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
// ✅ ORIGINAL: Back to original structure
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { UserSettingsProvider } from './UserSettingsContext';
import { ActivityProvider } from './ActivityContext';
import { FinancialProvider } from '@/components/financial/contexts/FinancialContext';
import { PaymentProvider } from './PaymentContext';
import { PromoProvider } from '@/components/promoCalculator/context/PromoContext';
// BahanBakuProvider will be loaded dynamically
import { SupplierProvider } from './SupplierContext';
import { RecipeProvider } from './RecipeContext';
import { PurchaseProvider } from '@/components/purchase/context/PurchaseContext';
import { OrderProvider } from '@/components/orders/context/OrderProvider';
import { FollowUpTemplateProvider } from './FollowUpTemplateContext';
import { OperationalCostProvider } from '@/components/operational-costs/context/OperationalCostContext';



// ✅ NEW: Import ProfitAnalysisProvider
import { ProfitAnalysisProvider } from '@/components/profitAnalysis';

// ✅ NEW: Import DeviceProvider
import { DeviceProvider } from './DeviceContext';

interface AppProvidersProps {
  children: ReactNode;
}

// Dynamic BahanBakuProvider wrapper
const DynamicBahanBakuProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [BahanBakuProvider, setBahanBakuProvider] = React.useState<React.ComponentType<{ children: ReactNode }> | null>(null);

  React.useEffect(() => {
    import('@/components/warehouse/context/WarehouseContext')
      .then(({ BahanBakuProvider }) => {
        setBahanBakuProvider(() => BahanBakuProvider);
      })
      .catch(error => {
        console.error('Failed to load BahanBakuProvider:', error);
        // Provide fallback
        setBahanBakuProvider(() => ({ children }: { children: ReactNode }) => <>{children}</>);
      });
  }, []);

  if (!BahanBakuProvider) {
    return <div className="loading-warehouse">Loading warehouse...</div>;
  }

  return <BahanBakuProvider>{children}</BahanBakuProvider>;
};

/**
 * ✅ UPDATED - Add ProfitAnalysisProvider to Original Working Structure
 * Keeping the exact same structure as before but adding ProfitAnalysisProvider
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const isMobile = useIsMobile();
  
  return (
    <>
      {/* ✅ ORIGINAL STRUCTURE - Proven to work + ProfitAnalysisProvider */}
      <AuthProvider>
        <PaymentProvider>
          <NotificationProvider>
            <UserSettingsProvider>
              <ActivityProvider>
                <FinancialProvider>
                  <DynamicBahanBakuProvider>
                    <SupplierProvider>
                      <RecipeProvider>
                        <PurchaseProvider>
                          <OrderProvider>
                            <OperationalCostProvider>
                              <PromoProvider>
                                <FollowUpTemplateProvider>
                                  {/* ✅ NEW: Add DeviceProvider */}
                                  <DeviceProvider>
                                    {/* ✅ NEW: Add ProfitAnalysisProvider */}
                                    <ProfitAnalysisProvider>
                                        {/* ✅ APP CONTENT */}
                                        {children}
                                    </ProfitAnalysisProvider>
                                  </DeviceProvider>
                                </FollowUpTemplateProvider>
                              </PromoProvider>
                            </OperationalCostProvider>
                          </OrderProvider>
                        </PurchaseProvider>
                      </RecipeProvider>
                    </SupplierProvider>
                  </DynamicBahanBakuProvider>
                </FinancialProvider>
              </ActivityProvider>
            </UserSettingsProvider>
          </NotificationProvider>
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
