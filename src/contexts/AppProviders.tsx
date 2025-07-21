// src/providers/AppProviders.tsx (Nama file ini bisa saja di sesuaikan)

import React, { ReactNode } from 'react';

// Import semua provider dari setiap file konteks Anda
import { AuthProvider } from './AuthContext';
import { UserSettingsProvider } from './UserSettingsContext';
import { ActivityProvider } from './ActivityContext'; // Harus di atas Financial & Order
import { FinancialProvider } from './FinancialContext'; // Harus di atas Order
import { PaymentProvider } from './PaymentContext'; // Mungkin ada dependensi ke Financial/Auth? Sesuaikan jika ada.
import { BahanBakuProvider } from './BahanBakuContext';
import { SupplierProvider } from './SupplierContext';
import { RecipeProvider } from './RecipeContext';
import { AssetProvider } from './AssetContext';
import { PurchaseProvider } from './PurchaseContext';
import { OrderProvider } from './OrderContext';
import { PromoProvider } from './PromoContext';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthProvider> {/* 1. AuthProvider: Hampir semua bergantung padanya */}
      {/* 2. UserSettingsProvider: OrderContext menggunakan settings */}
      <UserSettingsProvider>
        {/* 3. ActivityProvider: FinancialContext & OrderContext menggunakan addActivity */}
        <ActivityProvider>
          {/* 4. FinancialProvider: OrderContext menggunakan addFinancialTransaction */}
          <FinancialProvider>
            {/* PaymentProvider: Periksa apakah PaymentContext bergantung pada FinancialContext atau sebaliknya. 
                Jika PaymentContext juga mencatat transaksi finansial, PaymentProvider harus di dalam FinancialProvider.
                Jika tidak ada ketergantungan langsung, posisinya lebih fleksibel setelah Activity. */}
            <PaymentProvider> 
              {/* Contexts di bawah ini urutannya bisa lebih fleksibel, 
                  kecuali ada dependensi silang yang jelas antar mereka.
                  Pastikan jika ada 'useX' di 'YProvider', maka 'XProvider' membungkus 'YProvider'. */}
              <BahanBakuProvider>
                <SupplierProvider>
                  <RecipeProvider>
                    <AssetProvider>
                      <PromoProvider>
                        {/* PurchaseProvider & OrderProvider: Jika ada ketergantungan antara keduanya 
                            (misal, order mempengaruhi purchase, atau purchase mempengaruhi order), 
                            atur urutannya dengan hati-hati. Saat ini, OrderContext perlu FinancialContext. */}
                        <PurchaseProvider> 
                          <OrderProvider>
                            {children}
                          </OrderProvider>
                        </PurchaseProvider>
                      </PromoProvider>
                    </AssetProvider>
                  </RecipeProvider>
                </SupplierProvider>
              </BahanBakuProvider>
            </PaymentProvider>
          </FinancialProvider>
        </ActivityProvider>
      </UserSettingsProvider>
    </AuthProvider>
  );
};