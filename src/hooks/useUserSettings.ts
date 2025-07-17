import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { loadFromStorage, saveToStorage } from '@/utils/localStorageHelpers';
import { generateUUID } from '@/utils/uuid'; // MODIFIED: Import generateUUID

export interface UserSettings {
  id?: string;
  businessName: string;
  ownerName: string;
  email?: string;
  phone?: string;
  address?: string;
  currency: string;
  language: string;
  notifications: {
    lowStock: boolean;
    newOrder: boolean;
    financial: boolean;
    email: boolean;
    push: boolean;
  };
  backup: {
    auto: boolean;
    frequency: string;
    location: string;
  };
  security: {
    twoFactor: boolean;
    sessionTimeout: string;
    passwordRequirement: string;
  };
  recipeCategories: string[];
  financialCategories: {
    income: string[];
    expense: string[];
  };
}

const defaultSettings: UserSettings = {
  businessName: 'Toko Roti Bahagia',
  ownerName: 'John Doe',
  email: 'john@example.com',
  phone: '08123456789',
  address: 'Jl. Raya No. 123',
  currency: 'IDR',
  language: 'id',
  notifications: {
    lowStock: true,
    newOrder: true,
    financial: false,
    email: true,
    push: false,
  },
  backup: {
    auto: false,
    frequency: 'daily',
    location: 'cloud',
  },
  security: {
    twoFactor: false,
    sessionTimeout: '30',
    passwordRequirement: 'medium',
  },
  recipeCategories: [],
  financialCategories: {
    income: ['Penjualan Produk', 'Jasa', 'Lain-lain'],
    expense: ['Bahan Baku', 'Gaji', 'Sewa', 'Utilitas', 'Lain-lain'],
  },
};

const STORAGE_KEY = 'hpp_app_user_settings';

export const useUserSettings = (currentUserId: string | undefined) => { // MODIFIED: Terima currentUserId
  const [settings, setSettings] = useState<UserSettings>(() => 
    loadFromStorage(STORAGE_KEY, defaultSettings)
  );
  const [loading, setLoading] = useState(true);

  // loadSettings sekarang menerima session secara eksplisit
  const loadSettings = async (session: any | null) => {
    setLoading(true);
    try {
      if (!session) {
        // MODIFIED: Reset ke default dan hapus dari localStorage jika tidak ada sesi
        setSettings(defaultSettings);
        localStorage.removeItem(STORAGE_KEY);
        console.log('No active session, settings reset to default.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        toast.error(`Gagal memuat pengaturan: ${error.message}`);
        // Fallback to local storage on error
        const savedSettings = loadFromStorage(STORAGE_KEY, defaultSettings);
        setSettings(savedSettings);
        return;
      }

      if (data) {
        const notifications = typeof data.notifications === 'object' && data.notifications !== null 
          ? data.notifications as UserSettings['notifications']
          : defaultSettings.notifications;
        
        const backup = typeof data.backup_settings === 'object' && data.backup_settings !== null 
          ? data.backup_settings as UserSettings['backup']
          : defaultSettings.backup;
        
        const security = typeof data.security_settings === 'object' && data.security_settings !== null 
          ? data.security_settings as UserSettings['security']
          : defaultSettings.security;
        
        const recipeCategories = Array.isArray(data.recipe_categories) 
          ? data.recipe_categories as string[]
          : defaultSettings.recipeCategories;

        const financialCategories = typeof data.financial_categories === 'object' && data.financial_categories !== null 
          ? data.financial_categories as UserSettings['financialCategories']
          : defaultSettings.financialCategories;

        const loadedSettings: UserSettings = {
          id: data.id,
          businessName: data.business_name,
          ownerName: data.owner_name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          currency: data.currency,
          language: data.language,
          notifications,
          backup,
          security,
          recipeCategories,
          financialCategories,
        };
        setSettings(loadedSettings);
        saveToStorage(STORAGE_KEY, loadedSettings);
      } else {
        // Data tidak ditemukan, buat default settings dan simpan ke DB
        const newDefaultSettings = { ...defaultSettings, id: generateUUID() }; // Beri ID jika perlu
        await saveSettings(newDefaultSettings);
        setSettings(newDefaultSettings);
        saveToStorage(STORAGE_KEY, newDefaultSettings);
      }
    } catch (error) {
      console.error('Error in loadSettings:', error);
      toast.error(`Terjadi kesalahan saat memuat pengaturan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // MODIFIED: useEffect untuk berlangganan perubahan autentikasi
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadSettings(session); // Panggil loadSettings dengan sesi yang baru
    });

    // Panggil loadSettings untuk sesi awal
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadSettings(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Dependensi kosong agar hanya berjalan sekali saat mount


  // Simpan status cloudSyncEnabled ke localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEY, settings);
  }, [settings]);


  const saveSettings = async (newSettings: UserSettings) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        saveToStorage(STORAGE_KEY, newSettings);
        setSettings(newSettings);
        toast.success('Pengaturan berhasil disimpan (lokal)!');
        return true;
      }

      const settingsData = {
        user_id: session.user.id,
        business_name: newSettings.businessName,
        owner_name: newSettings.ownerName,
        email: newSettings.email,
        phone: newSettings.phone,
        address: newSettings.address,
        currency: newSettings.currency,
        language: newSettings.language,
        notifications: newSettings.notifications,
        backup_settings: newSettings.backup,
        security_settings: newSettings.security,
        recipe_categories: newSettings.recipeCategories,
        financial_categories: newSettings.financialCategories,
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert(settingsData, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving settings:', error);
        toast.error(`Gagal menyimpan pengaturan: ${error.message}`);
        return false;
      }

      setSettings(newSettings);
      toast.success('Pengaturan berhasil disimpan (cloud)!');
      return true;
    } catch (error) {
      console.error('Error in saveSettings:', error);
      toast.error(`Gagal menyimpan pengaturan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };

  return {
    settings,
    setSettings,
    saveSettings,
    loading,
    loadSettings, // loadSettings masih diekspos jika ada kebutuhan eksternal untuk memicu pemuatan ulang
  };
};
