// src/contexts/AppDataContext.tsx
// FILE INI TELAH DI-REFACTOR DAN SEKARANG BERTINDAK SEBAGAI PENYATU SEMUA PROVIDER.
// Fungsinya telah digantikan oleh komponen AppProviders yang baru.
// Disarankan untuk mengganti nama file ini menjadi `AppProviders.tsx` untuk kejelasan.

import React, { ReactNode } from 'react';

// 1. Impor semua provider dari setiap file konteks yang telah dibuat
import { AuthProvider } from './AuthContext';
import { PaymentProvider } from './PaymentContext';
import { ActivityProvider } from './ActivityContext';
import { BahanBakuProvider } from './BahanBakuContext';
import { SupplierProvider } from './SupplierContext';
import { RecipeProvider } from './RecipeContext';
import { AssetProvider } from './AssetContext';
import { FinancialProvider } from './FinancialContext';
import { PurchaseProvider } from './PurchaseContext';
import { OrderProvider } from './OrderContext';

/**
 * Komponen ini menggantikan fungsi AppDataContext yang lama.
 * Tujuannya adalah untuk membungkus aplikasi dengan semua provider konteks
 * dalam urutan yang benar untuk memastikan semua dependensi terpenuhi.
 * Nama komponen tetap AppDataProvider agar kompatibel dengan file App.tsx Anda saat ini.
 */
export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    // 2. Bungkus semua provider dengan urutan nesting yang benar
    <AuthProvider>
      <PaymentProvider>
        <ActivityProvider>
          <BahanBakuProvider>
            <SupplierProvider>
              <RecipeProvider>
                <AssetProvider>
                  <FinancialProvider>
                    <PurchaseProvider>
                      <OrderProvider>
                        {/* Di sini semua konteks tersedia untuk komponen children */}
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

// 3. Hook useAppData sudah tidak relevan dan dihapus.
// Setiap komponen sekarang harus memanggil hook spesifik yang dibutuhkannya,
// contoh: const { bahanBaku } = useBahanBaku(); atau const { session } = useAuth();