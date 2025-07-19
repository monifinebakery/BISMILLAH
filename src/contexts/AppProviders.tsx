// src/contexts/AppProviders.tsx

import React, { ReactNode } from 'react';

// Import semua provider yang telah Anda buat
import { AuthProvider } from './AuthContext';
import { PaymentProvider } from './PaymentContext';
import { ActivityProvider } from './ActivityContext';
import { BahanBakuProvider } from './BahanBakuContext';
import { SupplierProvider } from './SupplierContext';
import { RecipeProvider } from './RecipeContext';
import { PurchaseProvider } from './PurchaseContext';
import { OrderProvider } from './OrderContext';
import { AssetProvider } from './AssetContext';
import { FinancialProvider } from './FinancialContext';
import { UserSettingsProvider } from './UserSettingsContext'; // Asumsi Anda juga membuat ini

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <PaymentProvider> {/* PaymentProvider membutuhkan session dari AuthProvider */}
        <UserSettingsProvider> {/* UserSettingsProvider mungkin membutuhkan session */}
          <ActivityProvider>
            <BahanBakuProvider>
              <SupplierProvider>
                <RecipeProvider>
                  <AssetProvider>
                    <FinancialProvider>
                      <PurchaseProvider>
                        <OrderProvider>
                          {/* Semua provider lain yang mungkin Anda buat */}
                          {children}
                        </OrderProvider>
                      </PurchaseProvider>
                    </FinancialProvider>
                  </AssetProvider>
                </RecipeProvider>
              </SupplierProvider>
            </BahanBakuProvider>
          </ActivityProvider>
        </UserSettingsProvider>
      </PaymentProvider>
    </AuthProvider>
  );
};
