// src/contexts/AppProviders.tsx - UPDATED with Modular Assets
import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

// ✅ UPDATED: Import enhanced AuthProvider (no race condition)
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { UserSettingsProvider } from './UserSettingsContext';
import { ActivityProvider } from './ActivityContext';
import { FinancialProvider } from '@/components/financial/contexts/FinancialContext';

// ✅ UPDATED: Import enhanced PaymentProvider (now uses AuthContext)
import { PaymentProvider } from './PaymentContext';

// ✅ NEW: Import PromoProvider
import { PromoProvider } from '@/components/promoCalculator/context/PromoContext';

// ⚡ WAREHOUSE: Import both versions for performance testing
import { BahanBakuProvider } from '@/components/warehouse/context/WarehouseContext';
// import { SimpleBahanBakuProvider as BahanBakuProvider } from '@/components/warehouse/context/SimpleBahanBakuContext'; // 🔧 Uncomment untuk testing

import { SupplierProvider } from './SupplierContext';
import { RecipeProvider } from './RecipeContext';

// ❌ REMOVED: AssetProvider - no longer needed with modular approach
// import { AssetProvider } from '@/components/assets';

import { PurchaseProvider } from '@/components/purchase/context/PurchaseContext';
import { OrderProvider } from '@/components/orders/context/OrderProvider';
import { FollowUpTemplateProvider } from './FollowUpTemplateContext';

// ✅ NEW: Import OperationalCostProvider
import { OperationalCostProvider } from '@/components/operational-costs/context/OperationalCostContext';

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * ✅ ENHANCED AppProviders - Fixed Race Condition & Modular Assets
 * Key changes:
 * 1. AuthProvider is now the MASTER auth state (single source of truth)
 * 2. PaymentProvider immediately follows AuthProvider (no conflicts)
 * 3. All auth redirects handled centrally in AuthContext
 * 4. No duplicate auth listeners or state management
 * 5. ✅ REMOVED AssetProvider - assets now use React Query with modular hooks
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  const isMobile = useIsMobile();
  
  return (
    <>
      {/* 1. Foundation Layer - MASTER AUTH STATE (Enhanced, no race condition) */}
      <AuthProvider>
        
        {/* 2. Payment Layer - IMMEDIATELY after auth (uses AuthContext) */}
        <PaymentProvider>
          
          {/* 3. Core Services Layer - Essential app services */}
          <NotificationProvider>
            <UserSettingsProvider>
              <ActivityProvider>
                
                {/* 4. Business Logic Layer - Financial systems */}
                <FinancialProvider>
                  
                  {/* 5. Core Business Entities - Main data providers */}
                  {/* ⚡ WAREHOUSE: Enhanced modular context */}
                  <BahanBakuProvider>
                    <SupplierProvider>
                      
                      {/* 6. Complex Business Logic - Recipe management */}
                      <RecipeProvider>
                        
                        {/* 7. Operations & Purchases - Business operations */}
                        {/* ✅ ASSETS: Now handled by React Query hooks in components */}
                        <PurchaseProvider>
                          <OrderProvider>
                            
                            {/* 8. Cost Management - Operational costs for HPP calculation */}
                            {/* ✅ NEW: OperationalCostProvider for overhead calculation */}
                            <OperationalCostProvider>
                              
                              {/* 9. Advanced Features - Enhanced capabilities */}
                              {/* ✅ UPDATED: PromoProvider after RecipeProvider */}
                              <PromoProvider>
                                <FollowUpTemplateProvider>
                                  
                                  {/* 10. Application Layer - Final app content */}
                                  {children}
                                  
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