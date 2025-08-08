// src/contexts/UserSettingsContext.tsx
// 🔧 UPDATED - Removed recipe_categories and financial_categories

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

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
  // recipeCategories dan financialCategories dihapus
  updatedAt?: string;
}

interface UserSettingsContextType {
  settings: UserSettings;
  saveSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>; // ✅ Alias for backward compatibility
  isLoading: boolean;
  refreshSettings: () => Promise<void>; // ✅ Force refresh from database
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
  // recipeCategories dan financialCategories dihapus dari default
};

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const UserSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ VALIDASI USER ID
  const isValidUserId = useCallback((userId: string | undefined): boolean => {
    if (!userId) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(userId);
  }, []);

  const fetchSettings = useCallback(async () => {
    // ✅ Validasi user object lebih ketat
    if (!user || !isValidUserId(user.id)) {
      logger.context('UserSettings', 'No valid user found or user ID invalid, using default settings', {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email
      });
      setSettings(defaultSettings);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      logger.context('UserSettings', 'Fetching settings for user:', { userId: user.id, userEmail: user.email });

      const { data, error } = await supabase
        .from('user_settings')
        .select('*') // Hapus financial_categories dan recipe_categories dari select jika tidak digunakan
        .eq('user_id', user.id)
        .maybeSingle();

      logger.debug('Database response for user settings:', { data, error });

      if (error) {
        logger.error('[UserSettings] Fetch error:', error);
        if (error.code === 'PGRST116') { // No rows returned
          logger.info('No settings found for user, creating default...', { userId: user.id });
          await createDefaultSettings();
          return;
        }
        toast.error('Gagal memuat pengaturan: ' + error.message);
        setSettings(defaultSettings);
        return;
      }

      if (data) {
        const loadedSettings: UserSettings = {
          ...defaultSettings,
          businessName: data.business_name || data.businessName || defaultSettings.businessName,
          ownerName: data.owner_name || data.ownerName || defaultSettings.ownerName,
          email: data.email || user.email || defaultSettings.email,
          phone: data.phone || defaultSettings.phone,
          address: data.address || defaultSettings.address,
          // Hapus financialCategories dan recipeCategories
          updatedAt: data.updated_at || data.updatedAt || new Date().toISOString()
        };

        logger.success('Settings loaded for user:', { userId: user.id, settings: loadedSettings });
        setSettings(loadedSettings);
      } else {
        logger.info('No data found for user, creating default settings...', { userId: user.id });
        await createDefaultSettings();
      }
    } catch (error) {
      logger.error('[UserSettings] Unexpected error during fetch:', error);
      toast.error('Error memuat pengaturan: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, [user, isValidUserId]);

  const createDefaultSettings = async () => {
    // ✅ Validasi user object lebih ketat sebelum operasi database
    if (!user || !isValidUserId(user.id)) {
      logger.warn('[UserSettings] Cannot create default settings: No valid user ID');
      toast.error('Gagal membuat pengaturan: User tidak valid.');
      setIsLoading(false);
      return;
    }

    try {
      logger.context('UserSettings', 'Creating default settings for user:', { userId: user.id, userEmail: user.email });

      const settingsData = {
        user_id: user.id, // ✅ Gunakan user.id yang sudah divalidasi
        business_name: defaultSettings.businessName,
        owner_name: defaultSettings.ownerName,
        email: user.email || '', // ✅ Gunakan email dari user object
        phone: defaultSettings.phone,
        address: defaultSettings.address,
        // Hapus financial_categories dan recipe_categories
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      logger.debug('Attempting to insert default settings for user:', { userId: user.id, settingsData });

      const { data, error } = await supabase
        .from('user_settings')
        .insert(settingsData)
        .select()
        .single();

      if (error) {
        logger.error('[UserSettings] Insert error for user:', { userId: user.id, error });
        // ✅ Tangani error secara lebih spesifik
        if (error.code === '23505') { // Unique violation
          logger.info('Settings already exist for user, fetching...', { userId: user.id });
          await fetchSettings(); // Coba fetch ulang
          return;
        } else if (error.code === '23503') { // Foreign key violation
          logger.criticalError('[UserSettings] Foreign key constraint violation for user:', {
            userId: user.id,
            errorMessage: error.message,
            hint: 'Pastikan user.id ada di tabel auth.users'
          });
          toast.error('Gagal membuat pengaturan: User ID tidak valid di database. Silakan hubungi admin.');
        } else if (error.code === '403') { // Forbidden
          logger.criticalError('[UserSettings] 403 Forbidden error for user:', {
            userId: user.id,
            errorMessage: error.message
          });
          toast.error('Gagal membuat pengaturan: Akses ditolak. Silakan coba login ulang.');
        } else {
          toast.error('Gagal membuat pengaturan: ' + error.message);
        }
        setSettings(defaultSettings);
      } else {
        logger.success('Default settings created for user:', { userId: user.id, data });

        const newSettings: UserSettings = {
          ...defaultSettings,
          businessName: data.business_name || defaultSettings.businessName,
          ownerName: data.owner_name || defaultSettings.ownerName,
          email: data.email || defaultSettings.email,
          phone: data.phone || defaultSettings.phone,
          address: data.address || defaultSettings.address,
          // Hapus financialCategories dan recipeCategories
          updatedAt: data.updated_at || new Date().toISOString()
        };

        setSettings(newSettings);
      }
    } catch (error) {
      logger.error('[UserSettings] Error in createDefaultSettings:', error);
      toast.error('Error membuat pengaturan: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setSettings(defaultSettings);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    // ✅ Validasi user object lebih ketat
    if (!user || !isValidUserId(user.id)) {
      toast.error('Anda harus login dengan akun yang valid untuk menyimpan pengaturan.');
      return false;
    }

    try {
      logger.context('UserSettings', 'Saving settings for user:', { userId: user.id, newSettings });

      const updatedSettings = {
        ...settings,
        ...newSettings,
        updatedAt: new Date().toISOString()
      };

      const dbData: any = {
        user_id: user.id, // ✅ Gunakan user.id yang sudah divalidasi
        business_name: updatedSettings.businessName,
        owner_name: updatedSettings.ownerName,
        email: updatedSettings.email,
        phone: updatedSettings.phone,
        address: updatedSettings.address,
        // Hapus recipe_categories dan financial_categories
        updated_at: updatedSettings.updatedAt
      };

      // Hapus bagian financial_categories

      logger.debug('Database data to save for user:', { userId: user.id, dbData });

      const { data, error } = await supabase
        .from('user_settings')
        .upsert(dbData, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        logger.error('[UserSettings] Save error for user:', { userId: user.id, error });
        // ✅ Tangani error secara lebih spesifik
        if (error.code === '23503') { // Foreign key violation
          logger.criticalError('[UserSettings] Foreign key constraint violation on save for user:', {
            userId: user.id,
            errorMessage: error.message
          });
          toast.error('Gagal menyimpan pengaturan: User ID tidak valid. Silakan hubungi admin.');
        } else if (error.code === '403') { // Forbidden
          logger.criticalError('[UserSettings] 403 Forbidden error on save for user:', {
            userId: user.id,
            errorMessage: error.message
          });
          toast.error('Gagal menyimpan pengaturan: Akses ditolak. Silakan coba login ulang.');
        } else {
          toast.error('Gagal menyimpan pengaturan: ' + error.message);
        }
        return false;
      }

      logger.success('Settings saved to database for user:', { userId: user.id, data });

      const savedSettings: UserSettings = {
        ...updatedSettings,
        businessName: data.business_name,
        ownerName: data.owner_name,
        email: data.email,
        phone: data.phone || '',
        address: data.address || '',
        // Hapus financialCategories dan recipeCategories
        updatedAt: data.updated_at
      };

      setSettings(savedSettings);
      logger.success('Local state updated for user:', { userId: user.id, savedSettings });

      toast.success('Pengaturan berhasil disimpan!');
      return true;

    } catch (error) {
      logger.error('[UserSettings] Error in saveSettings for user:', { userId: user.id, error });
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Gagal menyimpan pengaturan: ' + errorMessage);
      return false;
    }
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  const updateSettings = saveSettings;

  return (
    <UserSettingsContext.Provider value={{
      settings,
      saveSettings,
      updateSettings,
      isLoading,
      refreshSettings
    }}>
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