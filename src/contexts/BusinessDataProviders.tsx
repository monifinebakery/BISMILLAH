// contexts/BusinessDataProviders.tsx - Consolidated Business Providers
import React, { ReactNode } from 'react';

// ✅ CONSOLIDATED: All business data providers in one file
import { ActivityProvider } from './ActivityContext';
import { BahanBakuProvider } from '@/components/warehouse/context/WarehouseContext';
import { SupplierProvider } from './SupplierContext';
import { RecipeProvider } from './RecipeContext';
import { AssetProvider } from './AssetContext';
import { PurchaseProvider } from '@/components/purchase/context/PurchaseContext';
import { OrderProvider } from '@/components/orders/context/OrderProvider';
import { OperationalCostProvider } from '@/components/operational-costs/context/OperationalCostContext';
import { PromoProvider } from '@/components/promoCalculator/context/PromoContext';
import { FollowUpTemplateProvider } from './FollowUpTemplateContext';

interface BusinessDataProvidersProps {
  children: ReactNode;
}

/**
 * ✅ CONSOLIDATED: Business Data Providers
 * 
 * Groups all business-related context providers to reduce 
 * dependency complexity in AppProviders.tsx
 * 
 * Hierarchy optimized for dependency order:
 * Activity → Warehouse → Supplier → Recipe → Assets → Purchase → Orders → Costs → Promo → Templates
 */
export const BusinessDataProviders: React.FC<BusinessDataProvidersProps> = ({ children }) => {
  return (
    <ActivityProvider>
      <BahanBakuProvider>
        <SupplierProvider>
          <RecipeProvider>
            <AssetProvider>
              <PurchaseProvider>
                <OrderProvider>
                  <OperationalCostProvider>
                    <PromoProvider>
                      <FollowUpTemplateProvider>
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
    </ActivityProvider>
  );
};