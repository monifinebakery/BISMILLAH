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
import { BahanBakuProvider } from '@/components/warehouse/context/WarehouseContext';
import { SupplierProvider } from './SupplierContext';
import { RecipeProvider } from './RecipeContext';
import { PurchaseProvider } from '@/components/purchase/context/PurchaseContext';
import { OrderProvider } from '@/components/orders/context/OrderProvider';
import { FollowUpTemplateProvider } from './FollowUpTemplateContext';
import { OperationalCostProvider } from '@/components/operational-costs/context/OperationalCostContext';

// ✅ NEW: Import UpdateProvider
import { UpdateProvider } from '@/components/update';

// ✅ NEW: Import ProfitAnalysisProvider
import { ProfitAnalysisProvider } from '@/components/profitAnalysis';

interface AppProvidersProps {
  children: ReactNode;
}

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
                  <BahanBakuProvider>
                    <SupplierProvider>
                      <RecipeProvider>
                        <PurchaseProvider>
                          <OrderProvider>
                            <OperationalCostProvider>
                              <PromoProvider>
                                <FollowUpTemplateProvider>
                                  {/* ✅ NEW: Add ProfitAnalysisProvider */}
                                  <ProfitAnalysisProvider>
                                    {/* ✅ NEW: Add UpdateProvider at the end */}
                                    <UpdateProvider>
                                      
                                      {/* ✅ APP CONTENT */}
                                      {children}
                                      
                                    </UpdateProvider>
                                  </ProfitAnalysisProvider>
                                </FollowUpTemplateProvider>
                              </PromoProvider>
                            </OperationalCostProvider>
                          </OrderProvider>
                        </PurchaseProvider>
                      </RecipeProvider>
                    </SupplierProvider>
                  </BahanBakuProvider>
                </FinancialProvider>
              </ActivityProvider>
            </UserSettingsProvider>
          </NotificationProvider>
        </PaymentProvider>
      </AuthProvider>
      
      {/* ✅ GLOBAL UI */}
      <Toaster 
        position={isMobile ? 'top-center' : 'top-right'}
        closeButton
        offset={isMobile ? 24 : 16}
        toastOptions={{
          classNames: {
            toast: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
            title: 'text-gray-900 font-medium',
            description: 'text-gray-600',
            actionButton: 'bg-orange-500 text-white hover:bg-orange-600',
            cancelButton: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
            closeButton: 'bg-gray-100 text-gray-400 hover:text-gray-600',
            success: 'border-green-200 bg-green-50',
            error: 'border-red-200 bg-red-50',
            warning: 'border-orange-200 bg-orange-50',
            info: 'border-blue-200 bg-blue-50',
          },
          duration: 4000,
        }}
      />
    </>
  );
};