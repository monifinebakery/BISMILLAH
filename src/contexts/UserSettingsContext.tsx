// src/contexts/UserSettingsContext.tsx
// 🔧 UPDATED - Added Financial Categories JSONB Support and Improved Error Handling

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

// --- UPDATED INTERFACES ---
// ✅ Support both legacy (string array) and new (object array) formats
interface FinancialCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  isDefault: boolean;
}

interface FinancialCategories {
  income: (string | FinancialCategory)[];
  expense: (string | FinancialCategory)[];
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
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>; // ✅ Alias for backward compatibility
  isLoading: boolean;
  refreshSettings: () => Promise<void>; // ✅ Force refresh from database
}

// ✅ UPDATED: Default categories with new object structure
const defaultFinancialCategories: FinancialCategories = {
  income: [
    {
      id: 'income_penjualan_produk',
      name: 'Penjualan Produk',
      type: 'income',
      color: '#10b981',
      isDefault: true
    },
    {
      id: 'income_pendapatan_jasa',
      name: 'Pendapatan Jasa',
      type: 'income',
      color: '#3b82f6',
      isDefault: true
    }
  ],
  expense: [
    {
      id: 'expense_bahan_baku',
      name: 'Pembelian Bahan Baku',
      type: 'expense',
      color: '#ef4444',
      isDefault: true
    },
    {
      id: 'expense_gaji',
      name: 'Gaji',
      type: 'expense',
      color: '#f59e0b',
      isDefault: true
    },
    {
      id: 'expense_sewa',
      name: 'Sewa',
      type: 'expense',
      color: '#8b5cf6',
      isDefault: true
    },
    {
      id: 'expense_marketing',
      name: 'Marketing',
      type: 'expense',
      color: '#ec4899',
      isDefault: true
    }
  ]
};

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
  financialCategories: defaultFinancialCategories,
  recipeCategories: ['Makanan Utama', 'Minuman', 'Dessert'],
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
        .select('*')
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
        let financialCategories = defaultFinancialCategories;

        if (data.financial_categories) {
          try {
            const parsedCategories = typeof data.financial_categories === 'string'
              ? JSON.parse(data.financial_categories)
              : data.financial_categories;

            logger.debug('Parsed financial categories:', parsedCategories);

            if (parsedCategories && typeof parsedCategories === 'object') {
              financialCategories = {
                income: parsedCategories.income || [],
                expense: parsedCategories.expense || []
              };
            }
          } catch (parseError) {
            logger.error('Error parsing financial_categories:', parseError);
          }
        }

        const loadedSettings: UserSettings = {
          ...defaultSettings,
          businessName: data.business_name || data.businessName || defaultSettings.businessName,
          ownerName: data.owner_name || data.ownerName || defaultSettings.ownerName,
          email: data.email || user.email || defaultSettings.email,
          phone: data.phone || defaultSettings.phone,
          address: data.address || defaultSettings.address,
          financialCategories: financialCategories,
          recipeCategories: data.recipe_categories || defaultSettings.recipeCategories,
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
        financial_categories: defaultFinancialCategories,
        recipe_categories: defaultSettings.recipeCategories,
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
        
        let financialCategories = defaultFinancialCategories;
        if (data.financial_categories) {
          try {
            const parsed = typeof data.financial_categories === 'string'
              ? JSON.parse(data.financial_categories)
              : data.financial_categories;

            if (parsed && typeof parsed === 'object') {
              financialCategories = {
                income: parsed.income || [],
                expense: parsed.expense || []
              };
            }
          } catch (parseError) {
            logger.error('Error parsing created financial_categories:', parseError);
          }
        }

        const newSettings: UserSettings = {
          ...defaultSettings,
          businessName: data.business_name || defaultSettings.businessName,
          ownerName: data.owner_name || defaultSettings.ownerName,
          email: data.email || defaultSettings.email,
          phone: data.phone || defaultSettings.phone,
          address: data.address || defaultSettings.address,
          financialCategories: financialCategories,
          recipeCategories: data.recipe_categories || defaultSettings.recipeCategories,
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
        recipe_categories: updatedSettings.recipeCategories,
        updated_at: updatedSettings.updatedAt
      };

      // ✅ Include financial_categories if provided
      if (newSettings.financialCategories) {
        dbData.financial_categories = newSettings.financialCategories;
        logger.debug('Saving financial_categories:', newSettings.financialCategories);
      }

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

      let savedFinancialCategories = updatedSettings.financialCategories;
      if (data.financial_categories) {
        try {
          const parsed = typeof data.financial_categories === 'string'
            ? JSON.parse(data.financial_categories)
            : data.financial_categories;

          if (parsed && typeof parsed === 'object') {
            savedFinancialCategories = {
              income: parsed.income || [],
              expense: parsed.expense || []
            };
          }
        } catch (parseError) {
          logger.error('Error parsing saved financial_categories:', parseError);
        }
      }

      const savedSettings: UserSettings = {
        ...updatedSettings,
        businessName: data.business_name,
        ownerName: data.owner_name,
        email: data.email,
        phone: data.phone || '',
        address: data.address || '',
        financialCategories: savedFinancialCategories,
        recipeCategories: data.recipe_categories || defaultSettings.recipeCategories,
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