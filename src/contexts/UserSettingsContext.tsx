// src/contexts/UserSettingsContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Definisikan tipe untuk objek settings
interface UserSettings {
  backup: {
    auto: boolean;
  };
  financialCategories: string[];
  recipeCategories: string[];
  // Tambahkan properti pengaturan lain jika ada
}

interface UserSettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
  isLoading: boolean;
}

// Nilai default untuk settings
const defaultSettings: UserSettings = {
  backup: {
    auto: true, // Asumsikan backup otomatis aktif secara default
  },
  financialCategories: ['Gaji', 'Bahan Baku', 'Sewa', 'Marketing', 'Lainnya'],
  recipeCategories: ['Makanan Utama', 'Minuman', 'Dessert', 'Snack'],
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const UserSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi untuk memuat pengaturan dari Supabase
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
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = baris tidak ditemukan, itu bukan error
        throw error;
      }
      
      if (data) {
        // Gabungkan data dari DB dengan default untuk memastikan semua properti ada
        setSettings({
          ...defaultSettings,
          backup: data.backup_settings ?? defaultSettings.backup,
          financialCategories: data.financial_categories ?? defaultSettings.financialCategories,
          recipeCategories: data.recipe_categories ?? defaultSettings.recipeCategories,
        });
      } else {
        // Jika tidak ada data di DB, gunakan default
        setSettings(defaultSettings);
      }
    } catch (error: any) {
      toast.error("Gagal memuat pengaturan: " + error.message);
      setSettings(defaultSettings); // Kembali ke default jika gagal
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  // Muat pengaturan saat sesi berubah (login/logout)
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Fungsi untuk memperbarui pengaturan
  const updateSettings = async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    if (!session) {
      toast.error("Anda harus login untuk mengubah pengaturan.");
      return false;
    }

    const currentSettings = { ...settings, ...newSettings };
    setSettings(currentSettings); // Update state secara optimis

    const settingsToSave = {
      user_id: session.user.id,
      backup_settings: currentSettings.backup,
      financial_categories: currentSettings.financialCategories,
      recipe_categories: currentSettings.recipeCategories,
    };

    const { error } = await supabase
      .from('user_settings')
      .upsert(settingsToSave, { onConflict: 'user_id' });

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