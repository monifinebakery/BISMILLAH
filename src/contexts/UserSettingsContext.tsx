// src/contexts/UserSettingsContext.tsx
// 🔔 UPDATED WITH NOTIFICATION SYSTEM

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
// 🔔 ADD NOTIFICATION IMPORTS
import { useNotification } from './NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

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
  // 🔔 ADD TIMESTAMPS FOR TRACKING
  updatedAt?: string;
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
  // 🔔 ADD NOTIFICATION CONTEXT
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
      const { data, error } = await supabase
        .from('user_settings')
        .select('settings_data')
        .eq('user_id', user.id)
        .limit(1) // ✨ Ambil hanya 1 baris
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[UserSettingsContext] Error fetching settings:', error);
        toast.error("Gagal memuat pengaturan.");
        
        // 🔔 CREATE ERROR NOTIFICATION
        await addNotification(createNotificationHelper.systemError(
          `Gagal memuat pengaturan pengguna: ${error.message}`
        ));
      }

      if (data?.settings_data) {
        // Gabungkan data dari DB dengan default untuk memastikan semua properti ada
        const mergedSettings = { 
          ...defaultSettings, 
          ...data.settings_data,
          updatedAt: new Date().toISOString()
        };
        setSettings(mergedSettings);
       logger.context('UserSettingsContext', 'Settings loaded successfully');
      } else {
        setSettings(defaultSettings);
        logger.context('UserSettingsContext', 'Using default settings');
      }
    } catch (error) {
      console.error('[UserSettingsContext] Unexpected error:', error);
      await addNotification(createNotificationHelper.systemError(
        `Error tidak terduga saat memuat pengaturan: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
    } finally {
      setIsLoading(false);
    }
  }, [user, addNotification]); // 🔔 ADD addNotification dependency

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
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({ 
          user_id: user.id, 
          settings_data: updatedSettings 
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('[UserSettingsContext] Error saving settings:', error);
        toast.error("Gagal menyimpan pengaturan: " + error.message);
        
        // 🔔 CREATE ERROR NOTIFICATION
        await addNotification(createNotificationHelper.systemError(
          `Gagal menyimpan pengaturan: ${error.message}`
        ));
        
        return false;
      }

      setSettings(updatedSettings);
      logger.context('[UserSettingsContext] Settings saved successfully');

      // 🔔 CREATE SUCCESS NOTIFICATION (only for significant changes)
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

        // Show toast for significant changes
        toast.success("Pengaturan berhasil disimpan!");
      }

      return true;
    } catch (error) {
      console.error('[UserSettingsContext] Error in saveSettings:', error);
      toast.error(`Gagal menyimpan pengaturan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // 🔔 CREATE ERROR NOTIFICATION
      await addNotification(createNotificationHelper.systemError(
        `Error saat menyimpan pengaturan: ${error instanceof Error ? error.message : 'Unknown error'}`
      ));
      
      return false;
    }
  };

  // 🔔 HELPER FUNCTION: Check if changes are significant enough for notification
  const hasSignificantChanges = (oldSettings: UserSettings, newSettings: Partial<UserSettings>): boolean => {
    // Consider business info changes as significant
    const significantFields = ['businessName', 'ownerName', 'email', 'phone', 'address'];
    
    return significantFields.some(field => {
      const fieldKey = field as keyof UserSettings;
      return newSettings[fieldKey] !== undefined && 
             newSettings[fieldKey] !== oldSettings[fieldKey];
    }) || 
    // Or notification preferences changes
    (newSettings.notifications && 
     JSON.stringify(newSettings.notifications) !== JSON.stringify(oldSettings.notifications)) ||
    // Or category changes
    (newSettings.financialCategories && 
     JSON.stringify(newSettings.financialCategories) !== JSON.stringify(oldSettings.financialCategories)) ||
    (newSettings.recipeCategories && 
     JSON.stringify(newSettings.recipeCategories) !== JSON.stringify(oldSettings.recipeCategories));
  };

  // 🔔 HELPER FUNCTION: Generate update message
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