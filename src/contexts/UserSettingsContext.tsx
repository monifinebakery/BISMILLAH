// src/contexts/UserSettingsContext.tsx
// VERSI REALTIME - FULL UPDATE

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext'; // Bergantung pada AuthContext yang sudah direfaktor
import { toast } from 'sonner';

// --- INTERFACES & DEFAULTS ---

interface FinancialCategories {
  income: string[];
  expense: string[];
}

// Interface ini mendefinisikan bentuk data pengaturan di dalam aplikasi (camelCase)
export interface UserSettings {
  businessName: string;
  ownerName: string;
  backup: { auto: boolean; };
  financialCategories: FinancialCategories;
  recipeCategories: string[];
  // Tambahkan properti lain yang mungkin ada di DB, misal untuk invoice
  bankName?: string;
  accountNumber?: string;
}

// Interface untuk tipe context yang akan di-provide
interface UserSettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
  isLoading: boolean;
}

// Pengaturan default yang digunakan saat pengguna baru atau saat logout
const defaultSettings: UserSettings = {
  businessName: 'Bisnis Anda',
  ownerName: 'Nama Anda',
  backup: { auto: true },
  financialCategories: {
    income: ['Penjualan Produk', 'Pendapatan Jasa'],
    expense: ['Gaji', 'Bahan Baku', 'Sewa', 'Marketing', 'Lainnya'],
  },
  recipeCategories: ['Makanan Utama', 'Minuman', 'Dessert', 'Snack'],
  bankName: 'Contoh: Bank Central Asia (BCA)',
  accountNumber: 'Contoh: 123-456-7890',
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---

export const UserSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // --- STATE & DEPENDENCIES ---
  const { user } = useAuth(); // Menggunakan `user` object, bukan `session`
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // --- HELPER FUNCTION ---
  // Mengubah data dari DB (snake_case) dan menggabungkannya dengan default
  const transformSettingsFromDB = (dbData: any): UserSettings => {
    return {
      ...defaultSettings,
      businessName: dbData.business_name ?? defaultSettings.businessName,
      ownerName: dbData.owner_name ?? defaultSettings.ownerName,
      backup: dbData.backup_settings ?? defaultSettings.backup,
      financialCategories: dbData.financial_categories ?? defaultSettings.financialCategories,
      recipeCategories: dbData.recipe_categories ?? defaultSettings.recipeCategories,
      bankName: dbData.bank_name ?? defaultSettings.bankName,
      accountNumber: dbData.account_number ?? defaultSettings.accountNumber,
    };
  };

  // --- EFEK UTAMA: FETCH DATA AWAL & SET UP REALTIME LISTENER ---
  useEffect(() => {
    // 1. Tunggu hingga status otentikasi user jelas
    if (user === undefined) {
      setIsLoading(true);
      return;
    }

    // 2. Jika user logout, reset state ke default
    if (!user) {
      console.log("[UserSettingsContext] User logout, mereset pengaturan ke default.");
      setSettings(defaultSettings);
      setIsLoading(false);
      return;
    }

    // --- PENGGUNA LOGIN ---
    
    // 3. Ambil data awal dari database
    const fetchInitialSettings = async () => {
      console.log(`[UserSettingsContext] User terdeteksi (${user.id}), memuat pengaturan...`);
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single(); // .single() karena kita hanya mengharapkan 0 atau 1 baris

      // Abaikan error "row not found", karena itu normal untuk user baru.
      if (error && error.code !== 'PGRST116') {
        toast.error("Gagal memuat pengaturan: " + error.message);
        setSettings(defaultSettings); // Kembali ke default jika ada error serius
      } else if (data) {
        setSettings(transformSettingsFromDB(data)); // Gunakan data dari DB
      } else {
        setSettings(defaultSettings); // Gunakan default jika data null (user baru)
      }
      setIsLoading(false);
    };

    fetchInitialSettings();

    // 4. Setup Realtime Subscription
    const channel = supabase
      .channel(`realtime-settings-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Dengarkan INSERT, UPDATE, dan DELETE
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${user.id}`, // Filter hanya untuk user ini
        },
        (payload) => {
          console.log('[UserSettingsContext] Pengaturan diperbarui via realtime:', payload);
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setSettings(transformSettingsFromDB(payload.new));
          }
          if (payload.eventType === 'DELETE') {
            setSettings(defaultSettings);
          }
        }
      )
      .subscribe();

    // 5. Cleanup: Wajib untuk unsubscribe channel saat komponen tidak lagi digunakan
    return () => {
      console.log("[UserSettingsContext] Membersihkan channel realtime pengaturan.");
      supabase.removeChannel(channel);
    };
  }, [user]); // KUNCI UTAMA: Jalankan ulang efek ini hanya saat status `user` berubah

  // --- FUNGSI UPDATE ---
  const updateSettings = async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk mengubah pengaturan.");
      return false;
    }

    // Gabungkan dengan state saat ini untuk memastikan semua data ada
    const updatedSettings = { ...settings, ...newSettings };

    // Transformasi ke snake_case untuk dikirim ke database
    const settingsToSave = {
      user_id: user.id, // Kunci utama untuk upsert
      business_name: updatedSettings.businessName,
      owner_name: updatedSettings.ownerName,
      backup_settings: updatedSettings.backup,
      financial_categories: updatedSettings.financialCategories,
      recipe_categories: updatedSettings.recipeCategories,
      bank_name: updatedSettings.bankName,
      account_number: updatedSettings.accountNumber,
    };

    // `upsert` akan membuat baris baru jika belum ada, atau memperbaruinya.
    const { error } = await supabase.from('user_settings').upsert(settingsToSave);

    if (error) {
      toast.error("Gagal menyimpan pengaturan: " + error.message);
      return false;
    }

    // TIDAK PERLU `setSettings` di sini. Listener realtime yang akan melakukannya.
    toast.success("Pengaturan berhasil disimpan.");
    return true;
  };
  
  const value = { settings, updateSettings, isLoading };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
};

// --- CUSTOM HOOK ---
export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
};