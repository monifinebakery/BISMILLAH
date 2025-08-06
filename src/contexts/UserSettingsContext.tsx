// src/contexts/UserSettingsContext.tsx
// 🔧 UPDATED - Added Financial Categories JSONB Support

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
  income: (string | FinancialCategory)[]; // Support both formats
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
      isDefault: false
    },
    {
      id: 'income_pendapatan_jasa',
      name: 'Pendapatan Jasa',
      type: 'income',
      color: '#3b82f6',
      isDefault: false
    }
  ],
  expense: [
    {
      id: 'expense_bahan_baku',
      name: 'Pembelian Bahan Baku',
      type: 'expense',
      color: '#ef4444',
      isDefault: false
    },
    {
      id: 'expense_gaji',
      name: 'Gaji',
      type: 'expense',
      color: '#f59e0b',
      isDefault: false
    },
    {
      id: 'expense_sewa',
      name: 'Sewa',
      type: 'expense',
      color: '#8b5cf6',
      isDefault: false
    },
    {
      id: 'expense_marketing',
      name: 'Marketing',
      type: 'expense',
      color: '#ec4899',
      isDefault: false
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

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(defaultSettings);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('🔍 Fetching settings for user:', user.id);
      
      // ✅ UPDATED: Include financial_categories in select
      const { data, error } = await supabase
        .from('user_settings')
        .select('*') // This will include financial_categories JSONB column
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('🔍 Database response:', { data, error });

      if (error) {
        console.error('[UserSettings] Fetch error:', error);
        if (error.code === 'PGRST116') {
          console.log('🔍 No settings found, creating default...');
          await createDefaultSettings();
          return;
        }
        toast.error('Gagal memuat pengaturan: ' + error.message);
        setSettings(defaultSettings);
        return;
      }

      if (data) {
        // ✅ UPDATED: Parse financial_categories from JSONB
        let financialCategories = defaultFinancialCategories;
        
        if (data.financial_categories) {
          try {
            // Parse JSONB data
            const parsedCategories = typeof data.financial_categories === 'string' 
              ? JSON.parse(data.financial_categories) 
              : data.financial_categories;
            
            console.log('🔍 Parsed financial categories:', parsedCategories);
            
            // Validate structure and use parsed data
            if (parsedCategories && typeof parsedCategories === 'object') {
              financialCategories = {
                income: parsedCategories.income || [],
                expense: parsedCategories.expense || []
              };
            }
          } catch (parseError) {
            console.error('Error parsing financial_categories:', parseError);
            // Use default if parsing fails
          }
        }

        const loadedSettings: UserSettings = { 
          ...defaultSettings,
          // Map database fields to our interface
          businessName: data.business_name || data.businessName || defaultSettings.businessName,
          ownerName: data.owner_name || data.ownerName || defaultSettings.ownerName,
          email: data.email || user.email || defaultSettings.email,
          phone: data.phone || defaultSettings.phone,
          address: data.address || defaultSettings.address,
          financialCategories: financialCategories, // ✅ Include parsed categories
          updatedAt: data.updated_at || data.updatedAt || new Date().toISOString()
        };
        
        console.log('✅ Settings loaded:', loadedSettings);
        setSettings(loadedSettings);
      } else {
        console.log('🔍 No data found, creating default settings...');
        await createDefaultSettings();
      }
    } catch (error) {
      console.error('[UserSettings] Unexpected error:', error);
      toast.error('Error memuat pengaturan: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // ✅ UPDATED: Create default settings with financial_categories
  const createDefaultSettings = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 Creating default settings for user:', user.id);
      
      const settingsData = {
        user_id: user.id,
        business_name: defaultSettings.businessName,
        owner_name: defaultSettings.ownerName,
        email: user.email || '',
        phone: defaultSettings.phone,
        address: defaultSettings.address,
        financial_categories: defaultFinancialCategories, // ✅ Include default categories
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🔍 Inserting data:', settingsData);

      const { data, error } = await supabase
        .from('user_settings')
        .insert(settingsData)
        .select()
        .single();

      if (error) {
        console.error('[UserSettings] Insert error:', error);
        
        if (error.code === '23505') {
          console.log('🔍 Settings already exist, fetching...');
          await fetchSettings();
          return;
        }
        
        toast.error('Gagal membuat pengaturan default: ' + error.message);
        setSettings(defaultSettings);
      } else {
        console.log('✅ Default settings created:', data);
        
        // Parse financial_categories from created data
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
            console.error('Error parsing created financial_categories:', parseError);
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
          updatedAt: data.updated_at || new Date().toISOString()
        };
        
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('[UserSettings] Error in createDefaultSettings:', error);
      toast.error('Error membuat pengaturan: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setSettings(defaultSettings);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ✅ UPDATED: Save settings with financial_categories support
  const saveSettings = async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menyimpan pengaturan.');
      return false;
    }

    try {
      console.log('🔍 Saving settings:', newSettings);
      
      const updatedSettings = { 
        ...settings, 
        ...newSettings,
        updatedAt: new Date().toISOString()
      };

      // ✅ UPDATED: Include financial_categories in database update
      const dbData: any = {
        user_id: user.id,
        business_name: updatedSettings.businessName,
        owner_name: updatedSettings.ownerName,
        email: updatedSettings.email,
        phone: updatedSettings.phone,
        address: updatedSettings.address,
        updated_at: updatedSettings.updatedAt
      };

      // ✅ Include financial_categories if provided
      if (newSettings.financialCategories) {
        dbData.financial_categories = newSettings.financialCategories;
        console.log('🔍 Saving financial_categories:', newSettings.financialCategories);
      }

      console.log('🔍 Database data to save:', dbData);

      const { data, error } = await supabase
        .from('user_settings')
        .upsert(dbData, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('[UserSettings] Save error:', error);
        toast.error('Gagal menyimpan pengaturan: ' + error.message);
        return false;
      }

      console.log('✅ Settings saved to database:', data);

      // ✅ UPDATED: Parse financial_categories from saved data
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
          console.error('Error parsing saved financial_categories:', parseError);
        }
      }

      const savedSettings: UserSettings = {
        ...updatedSettings,
        businessName: data.business_name,
        ownerName: data.owner_name,
        email: data.email,
        phone: data.phone || '',
        address: data.address || '',
        financialCategories: savedFinancialCategories, // ✅ Include parsed categories
        updatedAt: data.updated_at
      };

      setSettings(savedSettings);
      console.log('✅ Local state updated:', savedSettings);

      toast.success('Pengaturan berhasil disimpan!');
      return true;

    } catch (error) {
      console.error('[UserSettings] Error in saveSettings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Gagal menyimpan pengaturan: ' + errorMessage);
      return false;
    }
  };

  // ✅ NEW: Force refresh from database
  const refreshSettings = async () => {
    await fetchSettings();
  };

  // ✅ NEW: Alias for backward compatibility
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