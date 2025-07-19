// src/contexts/UserSettingsContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// PERBAIKAN: Struktur data untuk kategori dipisah
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
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>; // Nama fungsi diperbaiki
  isLoading: boolean;
}

const defaultSettings: UserSettings = {
  backup: { auto: true },
  // PERBAIKAN: Nilai default disesuaikan dengan struktur baru
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
      const { data, error } = await supabase
        .from('user_settings')
        .select('backup_settings, income_categories, expense_categories, recipe_categories') // Ambil kolom terpisah
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings({
          ...defaultSettings,
          backup: data.backup_settings ?? defaultSettings.backup,
          // PERBAIKAN: Muat data dari kolom terpisah
          financialCategories: {
              income: data.income_categories ?? defaultSettings.financialCategories.income,
              expense: data.expense_categories ?? defaultSettings.financialCategories.expense,
          },
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

  // PERBAIKAN: Nama fungsi adalah updateSettings
  const updateSettings = async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    if (!session) {
      toast.error("Anda harus login untuk mengubah pengaturan.");
      return false;
    }

    const currentSettings = { ...settings, ...newSettings };
    setSettings(currentSettings); // Update optimis

    // PERBAIKAN: Simpan ke kolom database yang terpisah
    const settingsToSave = {
      user_id: session.user.id,
      backup_settings: currentSettings.backup,
      income_categories: currentSettings.financialCategories.income,
      expense_categories: currentSettings.financialCategories.expense,
      recipe_categories: currentSettings.recipeCategories,
    };

    const { error } = await supabase.from('user_settings').upsert(settingsToSave);

    if (error) {
      toast.error("Gagal menyimpan pengaturan: " + error.message);
      loadSettings(); // Kembalikan ke state sebelumnya jika gagal
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