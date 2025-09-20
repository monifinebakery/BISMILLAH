// src/contexts/UserSettingsContext.tsx - REFACTORED with React Query
import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { logger } from '@/utils/logger';
import {
  DEFAULT_FINANCIAL_CATEGORIES,
  FinancialCategories,
} from '@/components/financial/types/financial';

// ===== TYPES =====
export interface UserSettings {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  whatsappType: 'personal' | 'business'; // Added WhatsApp type selection
  notifications: {
    lowStock: boolean;
    newOrder: boolean;
  };
  updatedAt?: string;
}

interface UserSettingsContextType {
  settings: UserSettings;
  saveSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<boolean>;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

// ===== QUERY KEYS =====
export const userSettingsQueryKeys = {
  all: ['userSettings'] as const,
  settings: (userId?: string) => [...userSettingsQueryKeys.all, 'settings', userId] as const,
} as const;

// ===== HELPER FUNCTIONS =====

/**
 * Helper function to safely extract object data from JSONB fields
 * Handles cases where JSONB might contain boolean false, null, or non-object values
 */
const safeGetJsonbObject = (jsonbData: any, fallback: any) => {
  // Handle null, undefined, or boolean false values
  if (!jsonbData || typeof jsonbData === 'boolean') {
    return fallback;
  }
  // Handle non-object types
  if (typeof jsonbData !== 'object') {
    return fallback;
  }
  return jsonbData;
};

// ===== DEFAULT SETTINGS =====
const defaultSettings: UserSettings = {
  businessName: 'Bisnis Anda',
  ownerName: 'Nama Anda',
  email: '',
  phone: '',
  address: '',
  whatsappType: 'personal', // Default to personal WhatsApp
  notifications: {
    lowStock: true,
    newOrder: true,
  }
};

// ===== API FUNCTIONS =====
const userSettingsApi = {
  async getSettings(userId: string, userEmail: string): Promise<UserSettings> {
    logger.context('UserSettings', 'Fetching settings for user:', { userId, userEmail });

    // 🚀 PERFORMANCE: Minimal field selection for faster query
    const { data, error } = await supabase
      .from('user_settings')
      .select(`
        business_name,
        owner_name,
        email,
        phone,
        address,
        whatsapp_type,
        notifications
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        logger.info('No settings found for user, will create default...', { userId });
        // Return default settings, creation will be handled by mutation
        return {
          ...defaultSettings,
          email: userEmail || defaultSettings.email,
        };
      }
      
      logger.error('[UserSettings] Fetch error:', error);
      throw new Error('Gagal memuat pengaturan: ' + error.message);
    }

    if (!data) {
      logger.info('No data found for user, returning default settings...', { userId });
      return {
        ...defaultSettings,
        email: userEmail || defaultSettings.email,
      };
    }

    const notifications = safeGetJsonbObject(data.notifications, defaultSettings.notifications);

    const loadedSettings: UserSettings = {
      businessName: data.business_name || defaultSettings.businessName,
      ownerName: data.owner_name || defaultSettings.ownerName,
      email: data.email || userEmail || defaultSettings.email,
      phone: data.phone || defaultSettings.phone,
      address: data.address || defaultSettings.address,
      whatsappType: (data.whatsapp_type as 'personal' | 'business') || defaultSettings.whatsappType,
      notifications: {
        lowStock: notifications?.lowStock ?? defaultSettings.notifications.lowStock,
        newOrder: notifications?.newOrder ?? defaultSettings.notifications.newOrder,
      },
      updatedAt: data.updated_at || new Date().toISOString()
    };

    logger.success('Settings loaded for user:', { userId, settings: loadedSettings });
    return loadedSettings;
  },

  async saveSettings(userId: string, settings: UserSettings): Promise<UserSettings> {
    logger.context('UserSettings', 'Saving settings for user:', { userId, settings });

    const dbData = {
      user_id: userId,
      business_name: settings.businessName,
      owner_name: settings.ownerName,
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
      whatsapp_type: settings.whatsappType,
      notifications: settings.notifications,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_settings')
      .upsert(dbData, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      logger.error('[UserSettings] Save error for user:', { userId, error });
      
      if (error.code === '23503') { // Foreign key violation
        throw new Error('User ID tidak valid. Silakan hubungi admin.');
      } else if (error.code === '403') { // Forbidden
        throw new Error('Akses ditolak. Silakan coba login ulang.');
      } else {
        throw new Error('Gagal menyimpan pengaturan: ' + error.message);
      }
    }

    // Use the same defensive approach for saved settings
    const savedNotifications = safeGetJsonbObject(data.notifications, defaultSettings.notifications);

    const savedSettings: UserSettings = {
      businessName: data.business_name,
      ownerName: data.owner_name,
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      whatsappType: (data.whatsapp_type as 'personal' | 'business') || defaultSettings.whatsappType,
      notifications: {
        lowStock: savedNotifications?.lowStock ?? defaultSettings.notifications.lowStock,
        newOrder: savedNotifications?.newOrder ?? defaultSettings.notifications.newOrder,
      },
      updatedAt: data.updated_at
    };

    logger.success('Settings saved to database for user:', { userId, savedSettings });
    return savedSettings;
  }
};

// ===== UTILITY FUNCTIONS =====
const isValidUserId = (userId: string | undefined): boolean => {
  if (!userId) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(userId);
};

// ===== CUSTOM HOOKS =====

/**
 * Hook for fetching user settings with React Query
 */
const useUserSettingsQuery = (userId?: string, userEmail?: string) => {
  return useQuery({
    queryKey: userSettingsQueryKeys.settings(userId),
    queryFn: () => userSettingsApi.getSettings(userId!, userEmail || ''),
    enabled: !!userId && isValidUserId(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on client errors
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for user settings mutations
 */
const useUserSettingsMutations = (userId?: string, userEmail?: string) => {
  const queryClient = useQueryClient();

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: (newSettings: Partial<UserSettings>) => {
      if (!userId || !isValidUserId(userId)) {
        throw new Error('User tidak valid untuk menyimpan pengaturan.');
      }

      // Get current settings from cache
      const currentSettings = queryClient.getQueryData(userSettingsQueryKeys.settings(userId)) as UserSettings || defaultSettings;
      
      const updatedSettings: UserSettings = {
        ...currentSettings,
        ...newSettings,
        updatedAt: new Date().toISOString()
      };

      return userSettingsApi.saveSettings(userId, updatedSettings);
    },
    onMutate: async (newSettings) => {
      // ✅ Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ 
        queryKey: userSettingsQueryKeys.settings(userId) 
      });

      // ✅ Snapshot previous value for rollback
      const previousSettings = queryClient.getQueryData(userSettingsQueryKeys.settings(userId));

      // ✅ Optimistic update
      if (previousSettings) {
        const optimisticSettings = {
          ...(previousSettings as UserSettings),
          ...newSettings,
          updatedAt: new Date().toISOString()
        };

        queryClient.setQueryData(
          userSettingsQueryKeys.settings(userId),
          optimisticSettings
        );
      }

      return { previousSettings };
    },
    onError: (error: any, variables, context) => {
      // ✅ Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(userSettingsQueryKeys.settings(userId), context.previousSettings);
      }
      
      logger.error('UserSettings: Save mutation error:', error);
      toast.error(error.message || 'Gagal menyimpan pengaturan');
    },
    onSuccess: (savedSettings, variables) => {
      // ✅ Update cache with fresh data from server
      queryClient.setQueryData(userSettingsQueryKeys.settings(userId), savedSettings);
      
      // ✅ Invalidate related queries if any
      queryClient.invalidateQueries({ queryKey: userSettingsQueryKeys.all });

      toast.success('Pengaturan berhasil disimpan!');
      logger.success('UserSettings: Settings saved successfully for user:', userId);
    }
  });

  return { saveMutation };
};

// ===== CONTEXT SETUP =====
const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

// ===== PROVIDER COMPONENT =====
export const UserSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const userEmail = user?.email;

  // ✅ Fetch settings using React Query
  const {
    data: settings = defaultSettings,
    isLoading,
    error,
    refetch
  } = useUserSettingsQuery(userId, userEmail);

  // ✅ Get mutations
  const { saveMutation } = useUserSettingsMutations(userId, userEmail);

  // ===== CONTEXT FUNCTIONS =====
  const saveSettings = useCallback(async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    if (!userId || !isValidUserId(userId)) {
      toast.error('Anda harus login dengan akun yang valid untuk menyimpan pengaturan.');
      return false;
    }

    try {
      await saveMutation.mutateAsync(newSettings);
      return true;
    } catch (error) {
      // Error already handled in mutation
      return false;
    }
  }, [userId, saveMutation]);

  const refreshSettings = useCallback(async () => {
    logger.context('UserSettings', 'Manual refresh requested');
    await refetch();
  }, [refetch]);

  // Alias for backward compatibility
  const updateSettings = saveSettings;

  // ===== ERROR HANDLING =====
  React.useEffect(() => {
    if (error) {
      logger.error('UserSettings: Query error:', error);
      // Don't show toast here as it might be too noisy
    }
  }, [error]);

  // ===== CONTEXT VALUE =====
  const value: UserSettingsContextType = {
    settings,
    saveSettings,
    updateSettings,
    isLoading: isLoading || saveMutation.isPending,
    refreshSettings,
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
};

// ===== CUSTOM HOOK =====
export const useUserSettings = () => {
  const context = useContext(UserSettingsContext);
  if (context === undefined) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
};

// ===== ADDITIONAL HOOKS FOR REACT QUERY UTILITIES =====

/**
 * Hook for accessing React Query specific functions
 */
export const useUserSettingsUtils = () => {
  const queryClient = useQueryClient();

  const invalidateSettings = useCallback((userId?: string) => {
    queryClient.invalidateQueries({ queryKey: userSettingsQueryKeys.settings(userId) });
  }, [queryClient]);

  const prefetchSettings = useCallback((userId: string, userEmail: string) => {
    queryClient.prefetchQuery({
      queryKey: userSettingsQueryKeys.settings(userId),
      queryFn: () => userSettingsApi.getSettings(userId, userEmail),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);

  return {
    invalidateSettings,
    prefetchSettings,
  };
};

export default UserSettingsContext;