// src/contexts/AppProviders.tsx

import React, { ReactNode } from 'react';

// Import semua provider
import { AuthProvider } from './AuthContext';
import { ActivityProvider } from './ActivityContext';
import { BahanBakuProvider } from './BahanBakuContext';
import { SupplierProvider } from './SupplierContext';
import { RecipeProvider } from './RecipeContext';
import { PurchaseProvider } from './PurchaseContext';
import { OrderProvider } from './OrderContext';
import { AssetProvider } from './AssetContext';
import { FinancialProvider } from './FinancialContext';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    // 1. AuthProvider sebagai lapisan terluar
    <AuthProvider>
      {/* 2. ActivityProvider karena banyak yg butuh log */}
      <ActivityProvider>
        {/* 3. Konteks domain data dasar */}
        <BahanBakuProvider>
          <SupplierProvider>
            <RecipeProvider>
              <AssetProvider>
                <FinancialProvider>
                  {/* 4. Konteks yg punya dependensi ke konteks lain */}
                  <PurchaseProvider>
                    <OrderProvider>
                      {/* Di sini semua konteks sudah tersedia */}
                      {children}
                    </OrderProvider>
                  </PurchaseProvider>
                </FinancialProvider>
              </AssetProvider>
            </RecipeProvider>
          </SupplierProvider>
        </BahanBakuProvider>
      </ActivityProvider>
    </AuthProvider>
  );
};