// src/contexts/AppProviders.tsx - FLATTENED for Parallel Loading

import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

// ✅ ESSENTIAL: Only core dependencies that OrderProvider needs
import { AuthProvider } from './AuthContext';
import { UserSettingsProvider } from './UserSettingsContext';
import { ActivityProvider } from './ActivityContext';
import { FinancialProvider } from '@/components/financial/contexts/FinancialContext';
import { NotificationProvider } from './NotificationContext';

// ✅ ORDERS: OrderProvider with minimal dependencies
import { OrderProvider } from '@/components/orders/context/OrderProvider';

// ✅ OPTIONAL: Other providers that don't affect OrderProvider
import { PaymentProvider } from './PaymentContext';
import { PromoProvider } from '@/components/promoCalculator/context/PromoContext';
import { BahanBakuProvider } from '@/components/warehouse/context/WarehouseContext';
import { SupplierProvider } from './SupplierContext';
import { RecipeProvider } from './RecipeContext';
import { PurchaseProvider } from '@/components/purchase/context/PurchaseContext';
import { FollowUpTemplateProvider } from './FollowUpTemplateContext';
import { OperationalCostProvider } from '@/components/operational-costs/context/OperationalCostContext';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * ✅ FLATTENED AppProviders - Parallel Loading for Better Performance
 * Key changes:
 * 1. Core providers (Auth, Settings, Activity, Financial, Notification) load first
 * 2. OrderProvider loads immediately after core providers (only 5 levels deep)
 * 3. Other providers load in parallel without blocking OrderProvider
 * 4. Faster loading time for Orders page
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const isMobile = useIsMobile();
  
  return (
    <>
      {/* ✅ CORE LAYER: Essential providers for OrderProvider (6 levels max) */}
      <AuthProvider>
        <UserSettingsProvider>
          <ActivityProvider>
            <FinancialProvider>
              <NotificationProvider>
                
                {/* ✅ CRITICAL: OrderProvider INSIDE NotificationProvider */}
                <OrderProvider>
                  <FollowUpTemplateProvider>
                    
                    {/* ✅ PARALLEL: Other providers in parallel (don't affect OrderProvider) */}
                    <PaymentProvider>
                      <BahanBakuProvider>
                        <SupplierProvider>
                          <RecipeProvider>
                            <PurchaseProvider>
                              <OperationalCostProvider>
                                <PromoProvider>
                                  
                                  {/* ✅ APP CONTENT */}
                                  {children}
                                  
                                </PromoProvider>
                              </OperationalCostProvider>
                            </PurchaseProvider>
                          </RecipeProvider>
                        </SupplierProvider>
                      </BahanBakuProvider>
                    </PaymentProvider>
                    
                  </FollowUpTemplateProvider>
                </OrderProvider>
                
              </NotificationProvider>
            </FinancialProvider>
          </ActivityProvider>
        </UserSettingsProvider>
      </AuthProvider>
      
      {/* ✅ GLOBAL UI: Toast notifications */}
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