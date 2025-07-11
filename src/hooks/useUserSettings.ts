import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserSettings {
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
};

export const useUserSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Load from localStorage if not authenticated
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings({
            businessName: parsed.businessName || defaultSettings.businessName,
            ownerName: parsed.ownerName || defaultSettings.ownerName,
            email: parsed.email || defaultSettings.email,
            phone: parsed.phone || defaultSettings.phone,
            address: parsed.address || defaultSettings.address,
            currency: parsed.currency || defaultSettings.currency,
            language: parsed.language || defaultSettings.language,
            notifications: { ...defaultSettings.notifications, ...parsed.notifications },
            backup: { ...defaultSettings.backup, ...parsed.backup },
            security: { ...defaultSettings.security, ...parsed.security },
          });
        }
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
        setLoading(false);
        return;
      }

      if (data) {
        // Type-safe parsing of JSONB fields
        const notifications = typeof data.notifications === 'object' && data.notifications !== null 
          ? data.notifications as UserSettings['notifications']
          : defaultSettings.notifications;
        
        const backup = typeof data.backup_settings === 'object' && data.backup_settings !== null 
          ? data.backup_settings as UserSettings['backup']
          : defaultSettings.backup;
        
        const security = typeof data.security_settings === 'object' && data.security_settings !== null 
          ? data.security_settings as UserSettings['security']
          : defaultSettings.security;

        setSettings({
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
        });
      } else {
        // Create default settings for new user
        await saveSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error in loadSettings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Save to localStorage if not authenticated
        localStorage.setItem('appSettings', JSON.stringify(newSettings));
        setSettings(newSettings);
        toast.success('Pengaturan berhasil disimpan!');
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
      };

      const { error } = await supabase
        .from('user_settings')
        .upsert(settingsData, { onConflict: 'user_id' });

      if (error) {
        console.error('Error saving settings:', error);
        toast.error('Gagal menyimpan pengaturan');
        return false;
      }

      setSettings(newSettings);
      toast.success('Pengaturan berhasil disimpan!');
      return true;
    } catch (error) {
      console.error('Error in saveSettings:', error);
      toast.error('Gagal menyimpan pengaturan');
      return false;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    setSettings,
    saveSettings,
    loading,
    loadSettings,
  };
};