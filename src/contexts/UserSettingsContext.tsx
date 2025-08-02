// src/contexts/UserSettingsContext.tsx
// 🔧 FIXED - Sesuaikan dengan database schema

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// --- INTERFACES & DEFAULTS ---
interface FinancialCategories {
  income: string[];
  expense: string[];
}

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
  updatedAt?: string;
}

interface UserSettingsContextType {
  settings: UserSettings;
  saveSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
  isLoading: boolean;
}

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

export const UserSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(defaultSettings);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      logger.context('UserSettingsContext', 'Fetching settings for user:', user.id);
      
      // 🔧 QUERY SESUAI DATABASE SCHEMA
      const { data, error } = await supabase
        .from('user_settings')
        .select(`
          settings_data,
          email,
          business_name,
          owner_name,
          updated_at
        `)
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle(); // 🔧 Gunakan maybeSingle() untuk handle null

      if (error) {
        console.error('[UserSettingsContext] Error fetching settings:', error);
        toast.error("Gagal memuat pengaturan.");
        
        await addNotification(createNotificationHelper.systemError(
          `Gagal memuat pengaturan pengguna: ${error.message}`
        ));
        
        setSettings(defaultSettings);
        return;
      }

      if (data) {
        // 🔧 GABUNGKAN DATA DARI KOLOM TERPISAH + JSONB
        const mergedSettings: UserSettings = { 
          ...defaultSettings,
          // Data dari kolom terpisah
          email: data.email || defaultSettings.email,
          businessName: data.business_name || defaultSettings.businessName,
          ownerName: data.owner_name || defaultSettings.ownerName,
          // Data dari JSONB settings_data
          ...(data.settings_data || {}),
          updatedAt: data.updated_at || new Date().toISOString()
        };
        
        setSettings(mergedSettings);
        logger.context('UserSettingsContext', 'Settings loaded successfully');
      } else {
        // 🔧 JIKA BELUM ADA DATA, CREATE DEFAULT
        await createDefaultSettings();
      }
    } catch (error) {
      console.error('[UserSettingsContext] Unexpected error:', error);
      await addNotification(createNotificationHelper.systemError(
        `Error tidak terduga saat memuat pengaturan: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, [user, addNotification]);

  // 🔧 FUNCTION UNTUK CREATE DEFAULT SETTINGS
  const createDefaultSettings = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          settings_data: defaultSettings,
          email: user.email || '',
          business_name: defaultSettings.businessName,
          owner_name: defaultSettings.ownerName
        });

      if (error) {
        console.error('[UserSettingsContext] Error creating default settings:', error);
      } else {
        setSettings(defaultSettings);
        logger.context('UserSettingsContext', 'Default settings created');
      }
    } catch (error) {
      console.error('[UserSettingsContext] Error in createDefaultSettings:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    if (!user) {
      toast.error("Anda harus login untuk menyimpan pengaturan.");
      return false;
    }

    try {
      const updatedSettings = { 
        ...settings, 
        ...newSettings,
        updatedAt: new Date().toISOString()
      };

      logger.context('UserSettingsContext', 'Saving settings:', updatedSettings);
      
      // 🔧 SAVE KE DATABASE DENGAN STRUCTURE YANG BENAR
      const dbData = {
        user_id: user.id,
        settings_data: updatedSettings,
        // Simpan juga di kolom terpisah untuk compatibility
        email: updatedSettings.email,
        business_name: updatedSettings.businessName,
        owner_name: updatedSettings.ownerName,
        updated_at: updatedSettings.updatedAt
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert(dbData, { onConflict: 'user_id' });

      if (error) {
        console.error('[UserSettingsContext] Error saving settings:', error);
        toast.error("Gagal menyimpan pengaturan: " + error.message);
        
        await addNotification(createNotificationHelper.systemError(
          `Gagal menyimpan pengaturan: ${error.message}`
        ));
        
        return false;
      }

      setSettings(updatedSettings);
      logger.context('UserSettingsContext', 'Settings saved successfully');

      // Success notification for significant changes
      if (hasSignificantChanges(settings, newSettings)) {
        await addNotification({
          title: '⚙️ Pengaturan Diperbarui',
          message: getUpdateMessage(newSettings),
          type: 'success',
          icon: 'settings',
          priority: 1,
          related_type: 'system',
          action_url: '/pengaturan',
          is_read: false,
          is_archived: false
        });

        toast.success("Pengaturan berhasil disimpan!");
      }

      return true;
    } catch (error) {
      console.error('[UserSettingsContext] Error in saveSettings:', error);
      toast.error(`Gagal menyimpan pengaturan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      await addNotification(createNotificationHelper.systemError(
        `Error saat menyimpan pengaturan: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
      
      return false;
    }
  };

  const hasSignificantChanges = (oldSettings: UserSettings, newSettings: Partial<UserSettings>): boolean => {
    const significantFields = ['businessName', 'ownerName', 'email', 'phone', 'address'];
    
    return significantFields.some(field => {
      const fieldKey = field as keyof UserSettings;
      return newSettings[fieldKey] !== undefined && 
             newSettings[fieldKey] !== oldSettings[fieldKey];
    }) || 
    (newSettings.notifications && 
     JSON.stringify(newSettings.notifications) !== JSON.stringify(oldSettings.notifications)) ||
    (newSettings.financialCategories && 
     JSON.stringify(newSettings.financialCategories) !== JSON.stringify(oldSettings.financialCategories)) ||
    (newSettings.recipeCategories && 
     JSON.stringify(newSettings.recipeCategories) !== JSON.stringify(oldSettings.recipeCategories));
  };

  const getUpdateMessage = (newSettings: Partial<UserSettings>): string => {
    if (newSettings.businessName || newSettings.ownerName) {
      return 'Informasi bisnis telah diperbarui';
    }
    if (newSettings.email || newSettings.phone) {
      return 'Informasi kontak telah diperbarui';
    }
    if (newSettings.notifications) {
      return 'Pengaturan notifikasi telah diperbarui';
    }
    if (newSettings.financialCategories) {
      return 'Kategori keuangan telah diperbarui';
    }
    if (newSettings.recipeCategories) {
      return 'Kategori resep telah diperbarui';
    }
    return 'Pengaturan aplikasi telah diperbarui';
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