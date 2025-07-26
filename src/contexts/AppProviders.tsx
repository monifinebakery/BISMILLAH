import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

// Import semua context provider dengan path yang konsisten
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import { UserSettingsProvider } from './UserSettingsContext';
import { ActivityProvider } from './ActivityContext';
import { FinancialProvider } from '@/components/financial/contexts/FinancialContext';
import { PaymentProvider } from './PaymentContext';
// ✅ NEW: Import PromoProvider
import { PromoProvider } from '@/components/promoCalculator/context/PromoContext';
import { BahanBakuProvider } from '@/components/warehouse/context/BahanBakuContext';
import { SupplierProvider } from './SupplierContext';
import { RecipeProvider } from './RecipeContext';
import { AssetProvider } from './AssetContext';
import { PurchaseProvider } from '@/components/purchase/context/PurchaseContext';
import { OrderProvider } from '@/components/orders/context/OrderContext';
import { FollowUpTemplateProvider } from './FollowUpTemplateContext';

/**
 * Komponen ini berfungsi sebagai "pembungkus" utama untuk seluruh aplikasi.
 * Ia mengatur semua context provider dalam urutan yang benar berdasarkan dependensi.
 */
export const AppProviders = ({ children }) => {
  const isMobile = useIsMobile();
  
  return (
    <>
      {/* 1. AuthProvider paling luar */}
      <AuthProvider>
        {/* 2. NotificationProvider di sini, karena provider lain di bawahnya akan menggunakannya */}
        <NotificationProvider>
          <UserSettingsProvider>
            <ActivityProvider>
              <FinancialProvider>
                <PaymentProvider>
                  {/* ✅ NEW: PromoProvider setelah PaymentProvider */}
                  <PromoProvider>
                    <BahanBakuProvider>
                      <SupplierProvider>
                        {/* ✅ IMPORTANT: RecipeProvider sebelum PromoProvider 
                            karena PromoCalculator depend on RecipeContext */}
                        <RecipeProvider>
                          <AssetProvider>
                            <PurchaseProvider>
                              <OrderProvider>
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
        </NotificationProvider>
      </AuthProvider>
      
      {/* Komponen Toaster untuk notifikasi global */}
      <Toaster 
        position={isMobile ? 'top-center' : 'top-right'}
        closeButton
        offset={isMobile ? 24 : 16}
        toastOptions={{
          classNames: {
            toast: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
          },
        }}
      />
    </>
  );
};