import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
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
  email?: string;
  phone?: string;
  address?: string;
  bankName?: string; // Nomor rekening dihapus
  backup: { auto: boolean };
  notifications: { // Objek notifikasi ditambahkan
    lowStock: boolean;
    newOrder: boolean;
  };
  financialCategories: FinancialCategories;
  recipeCategories: string[];
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
  email: '',
  phone: '',
  address: '',
  bankName: 'Contoh: Bank Central Asia (BCA)',
  backup: { auto: true },
  notifications: { // Nilai default untuk notifikasi
    lowStock: true,
    newOrder: true,
  },
  financialCategories: {
    income: ['Penjualan Produk', 'Pendapatan Jasa'],
    expense: ['Gaji', 'Bahan Baku', 'Sewa', 'Marketing', 'Lainnya'],
  },
  recipeCategories: ['Makanan Utama', 'Minuman', 'Dessert', 'Snack'],
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---

export const UserSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const transformSettingsFromDB = (dbData: any): UserSettings => {
    return {
      ...defaultSettings,
      businessName: dbData.business_name ?? defaultSettings.businessName,
      ownerName: dbData.owner_name ?? defaultSettings.ownerName,
      email: dbData.email ?? defaultSettings.email,
      phone: dbData.phone ?? defaultSettings.phone,
      address: dbData.address ?? defaultSettings.address,
      bankName: dbData.bank_name ?? defaultSettings.bankName,
      backup: dbData.backup_settings ?? defaultSettings.backup,
      notifications: dbData.notifications ?? defaultSettings.notifications, // Memuat notifikasi
      financialCategories: dbData.financial_categories ?? defaultSettings.financialCategories,
      recipeCategories: dbData.recipe_categories ?? defaultSettings.recipeCategories,
    };
  };

  useEffect(() => {
    const fetchAndListen = async () => {
      if (!session) {
        setSettings(defaultSettings);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        toast.error("Gagal memuat pengaturan: " + error.message);
      } else {
        setSettings(transformSettingsFromDB(data));
      }
      setIsLoading(false);

      const channel = supabase
        .channel(`settings-${session.user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_settings', filter: `user_id=eq.${session.user.id}` },
          (payload) => {
            setSettings(transformSettingsFromDB(payload.new));
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    };

    const subscription = fetchAndListen();

    return () => {
        // Membersihkan subscription saat komponen unmount
        Promise.resolve(subscription).then(sub => sub && sub());
    };
  }, [session]);

  const updateSettings = async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    if (!session) {
      toast.error("Anda harus login untuk mengubah pengaturan.");
      return false;
    }

    const updatedSettings = { ...settings, ...newSettings };

    const settingsToSave = {
      user_id: session.user.id,
      business_name: updatedSettings.businessName,
      owner_name: updatedSettings.ownerName,
      email: updatedSettings.email,
      phone: updatedSettings.phone,
      address: updatedSettings.address,
      bank_name: updatedSettings.bankName,
      backup_settings: updatedSettings.backup,
      notifications: updatedSettings.notifications, // Menyimpan notifikasi
      financial_categories: updatedSettings.financialCategories,
      recipe_categories: updatedSettings.recipeCategories,
    };

    const { error } = await supabase.from('user_settings').upsert(settingsToSave);

    if (error) {
      toast.error("Gagal menyimpan pengaturan: " + error.message);
      return false;
    }
    
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

export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
};
