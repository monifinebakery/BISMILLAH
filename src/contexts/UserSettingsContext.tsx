import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// --- INTERFACES & DEFAULTS ---

interface FinancialCategories {
  income: string[];
  expense: string[];
}

// ✨ MENGGUNAKAN INTERFACE ANDA YANG LEBIH LENGKAP
export interface UserSettings {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  notifications: {
    lowStock: boolean;
    newOrder: boolean;
  };
  financialCategories: FinancialCategories;
  recipeCategories: string[];
}

interface UserSettingsContextType {
  settings: UserSettings;
  saveSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
  isLoading: boolean;
}

// ✨ PENGATURAN DEFAULT DISESUAIKAN DENGAN INTERFACE LENGKAP
const defaultSettings: UserSettings = {
  businessName: 'Bisnis Anda',
  ownerName: 'Nama Anda',
  email: '',
  phone: '',
  address: '',
  notifications: {
    lowStock: true,
    newOrder: true,
  },
  financialCategories: {
    income: ['Penjualan Produk', 'Pendapatan Jasa'],
    expense: ['Gaji', 'Pembelian Bahan Baku', 'Sewa', 'Marketing', 'Lainnya'],
  },
  recipeCategories: ['Makanan Utama', 'Minuman', 'Dessert'],
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

// --- PROVIDER COMPONENT ---

export const UserSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(defaultSettings);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_settings')
      .select('settings_data')
      .eq('user_id', user.id)
      .limit(1) // ✨ Ambil hanya 1 baris
      .single();

    if (error && error.code !== 'PGRST116') {
      toast.error("Gagal memuat pengaturan.");
    }

    if (data?.settings_data) {
      // Gabungkan data dari DB dengan default untuk memastikan semua properti ada
      setSettings({ ...defaultSettings, ...data.settings_data });
    } else {
      setSettings(defaultSettings);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk menyimpan pengaturan.");
      return false;
    }

    const updatedSettings = { ...settings, ...newSettings };

    const { error } = await supabase
      .from('user_settings')
      .upsert({ 
        user_id: user.id, 
        settings_data: updatedSettings 
      }, { onConflict: 'user_id' });

    if (error) {
      toast.error("Gagal menyimpan pengaturan: " + error.message);
      return false;
    }

    setSettings(updatedSettings);
    // Tidak perlu toast sukses di sini agar tidak mengganggu saat auto-save
    return true;
  };

  return (
    <UserSettingsContext.Provider value={{ settings, saveSettings, isLoading }}>
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