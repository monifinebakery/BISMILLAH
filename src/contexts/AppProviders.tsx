// src/contexts/AppProviders.tsx
// 🔧 FIXED IMPORT PATHS TO MATCH YOUR PROJECT STRUCTURE

import React, { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

// Import semua context provider Anda dengan path yang konsisten
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext'; // 🔧 FIXED: Local import path
import { UserSettingsProvider } from './UserSettingsContext';
import { ActivityProvider } from './ActivityContext';
import { FinancialProvider } from '@/components/financial/contexts/FinancialContext';
import { PaymentProvider } from './PaymentContext';
import { PromoProvider } from './PromoContext';
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
export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
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
                  <PromoProvider>
                    <BahanBakuProvider>
                      <SupplierProvider>
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