// src/contexts/AppProviders.tsx

import React, { ReactNode } from 'react';

// Import semua provider dari setiap file konteks Anda
import { AuthProvider } from './AuthContext';
import { UserSettingsProvider } from './UserSettingsContext';
import { PaymentProvider } from './PaymentContext';
import { ActivityProvider } from './ActivityContext';
import { BahanBakuProvider } from './BahanBakuContext';
import { SupplierProvider } from './SupplierContext';
import { RecipeProvider } from './RecipeContext';
import { AssetProvider } from './AssetContext';
import { FinancialProvider } from './FinancialContext';
import { PurchaseProvider } from './PurchaseContext';
import { OrderProvider } from './OrderContext';

// ✅ Pastikan ada "export" di sini
export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <UserSettingsProvider>
        <PaymentProvider>
          <ActivityProvider>
            <BahanBakuProvider>
              <SupplierProvider>
                <RecipeProvider>
                  <AssetProvider>
                    <FinancialProvider>
                      <PurchaseProvider>
                        <OrderProvider>
                          {children}
                        </OrderProvider>
                      </PurchaseProvider>
                    </FinancialProvider>
                  </AssetProvider>
                </RecipeProvider>
              </SupplierProvider>
            </BahanBakuProvider>
          </ActivityProvider>
        </PaymentProvider>
      </UserSettingsProvider>
    </AuthProvider>
  );
};