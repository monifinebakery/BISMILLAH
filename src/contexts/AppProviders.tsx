// src/providers/AppProviders.tsx

import React, { ReactNode } from 'react';

import { AuthProvider } from './AuthContext';
import { UserSettingsProvider } from './UserSettingsContext';
import { ActivityProvider } from './ActivityContext'; // Perlu di atas Financial & Order
import { FinancialProvider } from './FinancialContext'; // Perlu di atas Order
import { PaymentProvider } from './PaymentContext'; // Perlu di atas Promo (jika promo ada fitur berbayar) atau di posisi awal jika independen
import { PromoProvider } from './PromoContext'; // Relatif independen dari banyak hal kecuali Auth
import { BahanBakuProvider } from './BahanBakuContext';
import { SupplierProvider } from './SupplierContext';
import { RecipeProvider } from './RecipeContext';
import { AssetProvider } from './AssetContext';
import { PurchaseProvider } from './PurchaseContext';
import { OrderProvider } from './OrderContext';


export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthProvider> {/* 1. Paling luar, karena hampir semua bergantung padanya */}
      <UserSettingsProvider> {/* 2. OrderContext menggunakan settings */}
        <ActivityProvider> {/* 3. Financial & Order Contexts menggunakan addActivity */}
          <FinancialProvider> {/* 4. OrderContext menggunakan addFinancialTransaction */}
            <PaymentProvider> {/* 5. Jika fitur promo bisa berbayar, PaymentProvider harus di atas PromoProvider */}
              <PromoProvider> {/* 6. PromoProvider memerlukan AuthProvider */}
                {/* Provider-provider lain yang mungkin kurang memiliki dependensi silang yang kompleks */}
                <BahanBakuProvider>
                  <SupplierProvider>
                    <RecipeProvider>
                      <AssetProvider>
                        <PurchaseProvider>
                          <OrderProvider>
                            {children}
                          </OrderProvider>
                        </PurchaseProvider>
                      </AssetProvider>
                    </RecipeProvider>
                  </SupplierProvider>
                </BahanBakuProvider>
              </PromoProvider>
            </PaymentProvider>
          </FinancialProvider>
        </ActivityProvider>
      </UserSettingsProvider>
    </AuthProvider>
  );
};