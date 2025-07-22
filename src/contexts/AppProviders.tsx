// src/providers/AppProviders.tsx

import React, { ReactNode } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';

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
import { FollowUpTemplateProvider } from './FollowUpTemplateContext'; // <-- Provider baru ditambahkan

/**
 * Komponen ini berfungsi sebagai "pembungkus" utama untuk seluruh aplikasi.
 * Ia mengatur semua context provider dalam urutan yang benar berdasarkan dependensi,
 * serta setup untuk routing dan notifikasi toast.
 */
export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    // Router membungkus semua agar routing berfungsi di seluruh aplikasi
    <Router>
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
                              {/* 7. FollowUpTemplateProvider dibungkus di dalam OrderProvider
                                  sesuai catatan, karena secara konseptual terkait erat dengan order. */}
                              <FollowUpTemplateProvider>
                                
                                {/* Di sinilah komponen utama aplikasi Anda (seperti <Routes>) akan dirender */}
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

      {/* Komponen Toaster untuk notifikasi global, ditempatkan di luar children */}
      <Toaster 
        position="top-right"
        richColors
        closeButton
      />
    </Router>
  );
};
