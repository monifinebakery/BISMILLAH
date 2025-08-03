// src/contexts/UserSettingsContext.tsx
// 🔧 FIXED - Save & Persistence Issues Resolved

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

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
      
      // ✅ FIXED: Query dengan error handling yang lebih baik
      const { data, error } = await supabase
        .from('user_settings')
        .select('*') // Select semua kolom untuk debug
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('🔍 Database response:', { data, error });

      if (error) {
        console.error('[UserSettings] Fetch error:', error);
        if (error.code === 'PGRST116') {
          // No data found, create default
          console.log('🔍 No settings found, creating default...');
          await createDefaultSettings();
          return;
        }
        toast.error('Gagal memuat pengaturan: ' + error.message);
        setSettings(defaultSettings);
        return;
      }

      if (data) {
        // ✅ FIXED: Map database columns dengan benar
        const loadedSettings: UserSettings = { 
          ...defaultSettings, // Start with defaults
          // Map database fields to our interface
          businessName: data.business_name || data.businessName || defaultSettings.businessName,
          ownerName: data.owner_name || data.ownerName || defaultSettings.ownerName,
          email: data.email || user.email || defaultSettings.email,
          phone: data.phone || defaultSettings.phone,
          address: data.address || defaultSettings.address,
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

  // ✅ FIXED: Create default settings dengan retry logic
  const createDefaultSettings = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 Creating default settings for user:', user.id);
      
      // ✅ Prepare data dengan mapping yang benar
      const settingsData = {
        user_id: user.id,
        business_name: defaultSettings.businessName,
        owner_name: defaultSettings.ownerName,
        email: user.email || '',
        phone: defaultSettings.phone,
        address: defaultSettings.address,
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
        
        // Handle duplicate key error
        if (error.code === '23505') {
          console.log('🔍 Settings already exist, fetching...');
          // Try to fetch existing
          await fetchSettings();
          return;
        }
        
        toast.error('Gagal membuat pengaturan default: ' + error.message);
        setSettings(defaultSettings);
      } else {
        console.log('✅ Default settings created:', data);
        
        // Map created data back to our interface
        const newSettings: UserSettings = {
          ...defaultSettings,
          businessName: data.business_name || defaultSettings.businessName,
          ownerName: data.owner_name || defaultSettings.ownerName,
          email: data.email || defaultSettings.email,
          phone: data.phone || defaultSettings.phone,
          address: data.address || defaultSettings.address,
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

  // ✅ FIXED: Save settings dengan validation dan error handling
  const saveSettings = async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    if (!user) {
      toast.error('Anda harus login untuk menyimpan pengaturan.');
      return false;
    }

    try {
      console.log('🔍 Saving settings:', newSettings);
      
      // ✅ Merge with current settings
      const updatedSettings = { 
        ...settings, 
        ...newSettings,
        updatedAt: new Date().toISOString()
      };

      // ✅ FIXED: Map to database columns dengan benar
      const dbData = {
        user_id: user.id,
        business_name: updatedSettings.businessName,
        owner_name: updatedSettings.ownerName,
        email: updatedSettings.email,
        phone: updatedSettings.phone,
        address: updatedSettings.address,
        updated_at: updatedSettings.updatedAt
      };

      console.log('🔍 Database data to save:', dbData);

      // ✅ Use upsert dengan proper conflict resolution
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

      // ✅ Update local state dengan data yang berhasil disave
      const savedSettings: UserSettings = {
        ...updatedSettings,
        businessName: data.business_name,
        ownerName: data.owner_name,
        email: data.email,
        phone: data.phone || '',
        address: data.address || '',
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