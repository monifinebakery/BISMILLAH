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
import { PromoProvider } from './PromoContext'; // ✨ DITAMBAHKAN

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <UserSettingsProvider>
        <PaymentProvider>
          <ActivityProvider>
            <FinancialProvider>
              <BahanBakuProvider>
                <SupplierProvider>
                  <PurchaseProvider>
                    <OrderProvider>
                      <RecipeProvider>
                        <AssetProvider>
                          <PromoProvider> {/* ✨ DITAMBAHKAN */}
                            {children}
                          </PromoProvider>
                        </AssetProvider>
                      </RecipeProvider>
                    </OrderProvider>
                  </PurchaseProvider>
                </SupplierProvider>
              </BahanBakuProvider>
            </FinancialProvider>
          </ActivityProvider>
        </PaymentProvider>
      </UserSettingsProvider>
    </AuthProvider>
  );
};