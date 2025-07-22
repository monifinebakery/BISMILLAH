// src/providers/AppProviders.tsx

import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { useIsMobile } from "@/hooks/use-mobile";

// Import semua context provider Anda
import { AuthProvider } from './AuthContext';
import { UserSettingsProvider } from './UserSettingsContext';
import { ActivityProvider } from './ActivityContext';
import { FinancialProvider } from './FinancialContext';
import { PaymentProvider } from './PaymentContext';
import { PromoProvider } from './PromoContext';
import { BahanBakuProvider } from './BahanBakuContext';
import { SupplierProvider } from './SupplierContext';
import { RecipeProvider } from './RecipeContext';
import { AssetProvider } from './AssetContext';
import { PurchaseProvider } from './PurchaseContext';
import { OrderProvider } from './OrderContext';
import { FollowUpTemplateProvider } from './FollowUpTemplateContext';

/**
 * Komponen ini berfungsi sebagai "pembungkus" utama untuk seluruh aplikasi.
 * Ia mengatur semua context provider dalam urutan yang benar berdasarkan dependensi.
 * Router dan Toaster akan diatur di level yang lebih tinggi (misal: App.jsx atau main.jsx).
 */
export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <>
      {/* 1. AuthProvider paling luar, karena hampir semua bergantung padanya */}
      <AuthProvider>
        {/* 2. UserSettingsProvider, mungkin dibutuhkan oleh provider lain */}
        <UserSettingsProvider>
          {/* 3. ActivityProvider, dibutuhkan oleh Financial & Order */}
          <ActivityProvider>
            {/* 4. FinancialProvider, dibutuhkan oleh Order */}
            <FinancialProvider>
              {/* 5. PaymentProvider & PromoProvider */}
              <PaymentProvider>
                <PromoProvider>
                  {/* Provider-provider untuk manajemen data inti */}
                  <BahanBakuProvider>
                    <SupplierProvider>
                      <RecipeProvider>
                        <AssetProvider>
                          <PurchaseProvider>
                            {/* 6. OrderProvider */}
                            <OrderProvider>
                              {/* 7. FollowUpTemplateProvider terkait erat dengan order. */}
                              <FollowUpTemplateProvider>
                                
                                {/* Di sinilah komponen utama aplikasi Anda akan dirender */}
                                {children}

                              </FollowUpTemplateProvider>
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

      {/* Komponen Toaster untuk notifikasi global */}
      <Toaster 
        position={isMobile ? 'top-center' : 'bottom-right'}
        closeButton
        // TAMBAHKAN INI: Atur jarak dari tepi layar
        // Nilai default adalah 16px. Kita kurangi menjadi 8px di mobile
        // agar posisinya sedikit lebih naik.
        offset={isMobile ? 8 : 16}
        toastOptions={{
          classNames: {
            toast: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
          },
        }}
      />
    </>
  );
};
