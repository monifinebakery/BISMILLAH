// src/contexts/AppProviders.tsx

import React, { ReactNode } from 'react';

// Import semua provider yang telah kita buat
import { AuthProvider } from './AuthContext';
import { ActivityProvider } from './ActivityContext';
import { BahanBakuProvider } from './BahanBakuContext';
import { SupplierProvider } from './SupplierContext';
import { RecipeProvider } from './RecipeContext';
import { PurchaseProvider } from './PurchaseContext';
import { OrderProvider } from './OrderContext';
import { AssetProvider } from './AssetContext';
import { FinancialProvider } from './FinancialContext';

// Import PaymentProvider yang Anda gunakan
import { PaymentProvider } from './PaymentContext'; // Pastikan path ini benar

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    // Urutan nesting ini penting sesuai dependensi
    <AuthProvider>
      <PaymentProvider> {/* PaymentProvider membutuhkan session dari AuthProvider */}
        <ActivityProvider>
          <BahanBakuProvider>
            <SupplierProvider>
              <RecipeProvider>
                <AssetProvider>
                  <FinancialProvider>
                    <PurchaseProvider>
                      <OrderProvider>
                        {/* Di sini semua konteks sudah tersedia untuk aplikasi */}
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
    </AuthProvider>
  );
};