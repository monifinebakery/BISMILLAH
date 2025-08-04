// contexts/AppProviders.tsx - Temporary Fallback (use original structure)
import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

// Import semua context provider dengan path yang konsisten
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { UserSettingsProvider } from './UserSettingsContext';
import { ActivityProvider } from './ActivityContext';
import { FinancialProvider } from '@/components/financial/contexts/FinancialContext';
import { PaymentProvider } from './PaymentContext';

// ✅ NEW: Import PromoProvider
import { PromoProvider } from '@/components/promoCalculator/context/PromoContext';

// ⚡ WAREHOUSE: Import both versions for performance testing
import { BahanBakuProvider } from '@/components/warehouse/context/WarehouseContext';
// import { SimpleBahanBakuProvider as BahanBakuProvider } from '@/components/warehouse/context/SimpleBahanBakuContext'; // 🔧 Uncomment untuk testing

import { SupplierProvider } from './SupplierContext';
import { RecipeProvider } from './RecipeContext';
import { AssetProvider } from './AssetContext';
import { PurchaseProvider } from '@/components/purchase/context/PurchaseContext';
import { OrderProvider } from '@/components/orders/context/OrderProvider';
import { FollowUpTemplateProvider } from './FollowUpTemplateContext';

// ✅ NEW: Import OperationalCostProvider
import { OperationalCostProvider } from '@/components/operational-costs/context/OperationalCostContext';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * ⚡ FALLBACK AppProviders - Original structure to fix error
 * Using original nesting until we identify the FinancialProvider issue
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const isMobile = useIsMobile();
  
  return (
    <>
      {/* 1. Foundation Layer - Core authentication & system */}
      <AuthProvider>
        {/* 2. Core Services Layer - Essential app services */}
        <NotificationProvider>
          <UserSettingsProvider>
            <ActivityProvider>
              
              {/* 3. Business Logic Layer - Financial & payment systems */}
              <FinancialProvider>
                <PaymentProvider>
                  
                  {/* 4. Core Business Entities - Main data providers */}
                  {/* ⚡ WAREHOUSE: Enhanced modular context */}
                  <BahanBakuProvider>
                    <SupplierProvider>
                      
                      {/* 5. Complex Business Logic - Recipe management */}
                      <RecipeProvider>
                        
                        {/* 6. Asset & Operations - Business operations */}
                        <AssetProvider>
                          <PurchaseProvider>
                            <OrderProvider>
                              
                              {/* 7. Cost Management - Operational costs for HPP calculation */}
                              {/* ✅ NEW: OperationalCostProvider for overhead calculation */}
                              <OperationalCostProvider>
                                
                                {/* 8. Advanced Features - Enhanced capabilities */}
                                {/* ✅ UPDATED: PromoProvider after RecipeProvider */}
                                <PromoProvider>
                                  <FollowUpTemplateProvider>
                                    
                                    {/* 9. Application Layer - Final app content */}
                                    {children}
                                    
                                  </FollowUpTemplateProvider>
                                </PromoProvider>
                              </OperationalCostProvider>
                            </OrderProvider>
                          </PurchaseProvider>
                        </AssetProvider>
                      </RecipeProvider>
                    </SupplierProvider>
                  </BahanBakuProvider>
                </PaymentProvider>
              </FinancialProvider>
            </ActivityProvider>
          </UserSettingsProvider>
        </NotificationProvider>
      </AuthProvider>
      
      {/* Global UI Components - Enhanced notifications */}
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