// src/providers/AppProviders.tsx
import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

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
// 🔔 NOTIFICATION PROVIDER IMPORT
import { NotificationProvider } from './NotificationContext';

/**
 * Komponen ini berfungsi sebagai "pembungkus" utama untuk seluruh aplikasi.
 * Ia mengatur semua context provider dalam urutan yang benar berdasarkan dependensi.
 */
export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Panggil hook useIsMobile untuk membuat variabel isMobile
  const isMobile = useIsMobile();
  
  return (
    <>
      {/* 1. AuthProvider paling luar, karena hampir semua bergantung padanya */}
      <AuthProvider>
        {/* 2. UserSettingsProvider, mungkin dibutuhkan oleh provider lain */}
        <UserSettingsProvider>
          {/* 3. ActivityProvider, dibutuhkan oleh Financial & Order */}
          <ActivityProvider>
            {/* 🔔 4. NotificationProvider - MOVED EARLIER, needed by business logic providers */}
            <NotificationProvider>
              {/* 5. FinancialProvider, dibutuhkan oleh Order */}
              <FinancialProvider>
                {/* 6. PaymentProvider & PromoProvider */}
                <PaymentProvider>
                  <PromoProvider>
                    {/* Provider-provider untuk manajemen data inti - NOW WRAPPED BY NOTIFICATIONS */}
                    <BahanBakuProvider>
                      <SupplierProvider>
                        <RecipeProvider>
                          <AssetProvider>
                            <PurchaseProvider>
                              {/* 7. OrderProvider */}
                              <OrderProvider>
                                {/* 8. FollowUpTemplateProvider terkait erat dengan order. */}
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
            </NotificationProvider>
          </ActivityProvider>
        </UserSettingsProvider>
      </AuthProvider>
      
      {/* Komponen Toaster untuk notifikasi global */}
      <Toaster 
        // UPDATE: Posisi diubah ke bawah untuk semua perangkat
        position={isMobile ? 'top-center' : 'top-right'}
        closeButton
        // Atur jarak dari tepi layar
        offset={isMobile ? 160 : 32} // Sedikit lebih jauh agar tidak menempel di navigasi mobile
        toastOptions={{
          classNames: {
            toast: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
          },
        }}
      />
    </>
  );
};