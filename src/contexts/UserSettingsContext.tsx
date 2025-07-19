// src/contexts/UserSettingsContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface FinancialCategories {
  income: string[];
  expense: string[];
}

interface UserSettings {
  backup: { auto: boolean; };
  financialCategories: FinancialCategories;
  recipeCategories: string[];
}

interface UserSettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
  isLoading: boolean;
}

const defaultSettings: UserSettings = {
  backup: { auto: true },
  financialCategories: {
    income: ['Penjualan Produk', 'Pendapatan Jasa'],
    expense: ['Gaji', 'Bahan Baku', 'Sewa', 'Marketing', 'Lainnya'],
  },
  recipeCategories: ['Makanan Utama', 'Minuman', 'Dessert', 'Snack'],
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const UserSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    if (!session) {
      setSettings(defaultSettings);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // PERUBAHAN: Membaca dari satu kolom 'financial_categories'
      const { data, error } = await supabase
        .from('user_settings')
        .select('backup_settings, financial_categories, recipe_categories')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          ...defaultSettings,
          backup: data.backup_settings ?? defaultSettings.backup,
          // PERUBAHAN: Mengambil objek kategori langsung dari kolom 'financial_categories'
          financialCategories: data.financial_categories ?? defaultSettings.financialCategories,
          recipeCategories: data.recipe_categories ?? defaultSettings.recipeCategories,
        });
      } else {
        setSettings(defaultSettings);
      }
    } catch (error: any) {
      toast.error("Gagal memuat pengaturan: " + error.message);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    if (!session) {
      toast.error("Anda harus login untuk mengubah pengaturan.");
      return false;
    }

    const currentSettings = { ...settings, ...newSettings };
    setSettings(currentSettings); // Update optimis

    // PERUBAHAN: Menyimpan objek kategori ke dalam satu kolom 'financial_categories'
    const settingsToSave = {
      user_id: session.user.id,
      backup_settings: currentSettings.backup,
      financial_categories: currentSettings.financialCategories,
      recipe_categories: currentSettings.recipeCategories,
    };

    const { error } = await supabase.from('user_settings').upsert(settingsToSave);

    if (error) {
      toast.error("Gagal menyimpan pengaturan: " + error.message);
      loadSettings();
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