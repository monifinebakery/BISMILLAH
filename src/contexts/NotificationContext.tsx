// contexts/NotificationContext.tsx - REFACTORED with React Query
import React, { createContext, useContext, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { useAuth } from './AuthContext';

// ===== TYPES =====
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
  priority: number;
  related_type?: string;
  related_id?: string;
  action_url?: string;
  is_read: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

interface NotificationSettings {
  id?: string;
  user_id: string;
  push_notifications: boolean;
  inventory_alerts: boolean;
  order_alerts: boolean;
  financial_alerts: boolean;
  created_at?: string;
  updated_at?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  urgentCount: number;
  isLoading: boolean;
  settings: NotificationSettings | null;
  addNotification: (notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  archiveNotification: (notificationId: string) => Promise<boolean>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
  clearAllNotifications: () => Promise<boolean>;
}

// ===== QUERY KEYS =====
export const notificationQueryKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationQueryKeys.all, 'list'] as const,
  list: (userId?: string) => [...notificationQueryKeys.lists(), userId] as const,
  settings: (userId?: string) => [...notificationQueryKeys.all, 'settings', userId] as const,
  counts: (userId?: string) => [...notificationQueryKeys.all, 'counts', userId] as const,
} as const;

// ===== API FUNCTIONS =====
const notificationApi = {
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('NotificationAPI: Error fetching notifications:', error);
      throw new Error('Gagal memuat notifikasi: ' + error.message);
    }

    return data || [];
  },

  async getSettings(userId: string): Promise<NotificationSettings> {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      logger.warn('NotificationAPI: Error loading settings:', error);
    }
    
    // Return default settings if none found
    if (!data) {
      const defaultSettings = {
        user_id: userId,
        push_notifications: true,
        inventory_alerts: true,
        order_alerts: true,
        financial_alerts: true
      };

      // Try to create default settings
      try {
        const { data: newSettings, error: insertError } = await supabase
          .from('notification_settings')
          .insert(defaultSettings)
          .select()
          .maybeSingle();
        
        if (!insertError && newSettings) {
          return newSettings;
        }
      } catch (insertError) {
        logger.warn('NotificationAPI: Could not create default settings:', insertError);
      }
      
      return defaultSettings;
    }
    
    return data;
  },

  async createNotification(userId: string, notificationData: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Notification> {
    // Check for recent duplicates
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: existingNotifications } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('title', notificationData.title)
      .gte('created_at', oneMinuteAgo)
      .limit(1);

    if (existingNotifications && existingNotifications.length > 0) {
      throw new Error('Duplicate notification detected');
    }
    
    const dataToInsert = {
      ...notificationData,
      user_id: userId,
      is_read: notificationData.is_read ?? false,
      is_archived: notificationData.is_archived ?? false
    };
    
    const { data, error } = await supabase
      .from('notifications')
      .insert(dataToInsert)
      .select()
      .single();
    
    if (error) {
      logger.error('NotificationAPI: Error creating notification:', error);
      throw new Error('Gagal menambahkan notifikasi: ' + error.message);
    }
    
    return data;
  },

  async markAsRead(notificationId: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) {
      logger.error('NotificationAPI: Error marking as read:', error);
      throw new Error('Gagal menandai sebagai dibaca');
    }
    
    return data;
  },

  async markAllAsRead(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) {
      logger.error('NotificationAPI: Error marking all as read:', error);
      throw new Error('Gagal menandai semua sebagai dibaca');
    }
    
    return true;
  },

  async deleteNotification(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    
    if (error) {
      logger.error('NotificationAPI: Error deleting notification:', error);
      throw new Error('Gagal menghapus notifikasi');
    }
    
    return true;
  },

  async archiveNotification(notificationId: string): Promise<Notification> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) {
      logger.error('NotificationAPI: Error archiving notification:', error);
      throw new Error('Gagal mengarsipkan notifikasi');
    }
    
    return data;
  },

  async clearAllNotifications(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      logger.error('NotificationAPI: Error clearing all notifications:', error);
      throw new Error('Gagal menghapus semua notifikasi');
    }
    
    return true;
  },

  async updateSettings(userId: string, currentSettings: NotificationSettings | null, newSettings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const settingsToUpdate = {
      user_id: userId,
      ...currentSettings,
      ...newSettings,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('notification_settings')
      .upsert(settingsToUpdate)
      .select()
      .maybeSingle();
    
    if (error) {
      logger.error('NotificationAPI: Error updating settings:', error);
      throw new Error('Gagal menyimpan pengaturan');
    }
    
    return data || settingsToUpdate;
  }
};

// ===== UTILITY CLASS =====
class NotificationDeduplicator {
  private cache = new Map<string, number>();
  private readonly ttl = 30000; // 30 seconds TTL
  private readonly maxSize = 500;

  private cleanup() {
    const now = Date.now();
    
    for (const [key, timestamp] of this.cache.entries()) {
      if (now - timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }

    if (this.cache.size > this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, this.cache.size - this.maxSize);
      
      entries.forEach(([key]) => this.cache.delete(key));
    }
  }

  shouldAllow(key: string): boolean {
    this.cleanup();
    
    const now = Date.now();
    const lastTime = this.cache.get(key);
    
    if (!lastTime || (now - lastTime) > this.ttl) {
      this.cache.set(key, now);
      return true;
    }
    
    return false;
  }

  generateKey(notification: Partial<Notification>): string {
    const parts = [
      notification.title?.toLowerCase().substring(0, 50),
      notification.type,
      notification.related_type,
      notification.related_id
    ].filter(Boolean);
    
    return parts.join('|');
  }

  clear() {
    this.cache.clear();
  }
}

// ===== CUSTOM HOOKS =====

/**
 * Hook for fetching notifications with React Query
 */
const useNotificationsQuery = (userId?: string) => {
  return useQuery({
    queryKey: notificationQueryKeys.list(userId),
    queryFn: () => notificationApi.getNotifications(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

/**
 * Hook for fetching notification settings
 */
const useNotificationSettingsQuery = (userId?: string) => {
  return useQuery({
    queryKey: notificationQueryKeys.settings(userId),
    queryFn: () => notificationApi.getSettings(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

/**
 * Hook for notification mutations
 */
const useNotificationMutations = (userId?: string) => {
  const queryClient = useQueryClient();

  // Add notification mutation
  const addMutation = useMutation({
    mutationFn: (notificationData: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => 
      notificationApi.createNotification(userId!, notificationData),
    onMutate: async (newNotification) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.list(userId) });

      const previousNotifications = queryClient.getQueryData(notificationQueryKeys.list(userId));

      // Optimistic update
      const optimisticNotification: Notification = {
        id: `temp-${Date.now()}`,
        user_id: userId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...newNotification,
      };

      queryClient.setQueryData(
        notificationQueryKeys.list(userId),
        (old: Notification[] = []) => [optimisticNotification, ...old].slice(0, 50)
      );

      return { previousNotifications };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationQueryKeys.list(userId), context.previousNotifications);
      }
      
      // Only show error if it's not a duplicate
      if (!error.message?.includes('Duplicate')) {
        logger.error('NotificationContext: Add mutation error:', error);
      }
    },
    onSuccess: (newNotification, variables) => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list(userId) });
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.counts(userId) });

      logger.debug('NotificationContext: Notification added successfully:', newNotification.id);
    }
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.list(userId) });

      const previousNotifications = queryClient.getQueryData(notificationQueryKeys.list(userId));

      // Optimistic update
      queryClient.setQueryData(
        notificationQueryKeys.list(userId),
        (old: Notification[] = []) =>
          old.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true, updated_at: new Date().toISOString() }
              : notification
          )
      );

      return { previousNotifications };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationQueryKeys.list(userId), context.previousNotifications);
      }
      
      logger.error('NotificationContext: Mark as read error:', error);
      toast.error('Gagal menandai sebagai dibaca');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.counts(userId) });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(userId!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.list(userId) });

      const previousNotifications = queryClient.getQueryData(notificationQueryKeys.list(userId));

      // Optimistic update
      queryClient.setQueryData(
        notificationQueryKeys.list(userId),
        (old: Notification[] = []) =>
          old.map(notification => ({ ...notification, is_read: true, updated_at: new Date().toISOString() }))
      );

      return { previousNotifications };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationQueryKeys.list(userId), context.previousNotifications);
      }
      
      logger.error('NotificationContext: Mark all as read error:', error);
      toast.error('Gagal menandai semua sebagai dibaca');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.counts(userId) });
      toast.success('Semua notifikasi telah dibaca');
    }
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) => notificationApi.deleteNotification(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.list(userId) });

      const previousNotifications = queryClient.getQueryData(notificationQueryKeys.list(userId));

      // Optimistic update
      queryClient.setQueryData(
        notificationQueryKeys.list(userId),
        (old: Notification[] = []) => old.filter(notification => notification.id !== notificationId)
      );

      return { previousNotifications };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationQueryKeys.list(userId), context.previousNotifications);
      }
      
      logger.error('NotificationContext: Delete error:', error);
      toast.error('Gagal menghapus notifikasi');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.counts(userId) });
    }
  });

  // Archive notification mutation
  const archiveMutation = useMutation({
    mutationFn: (notificationId: string) => notificationApi.archiveNotification(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.list(userId) });

      const previousNotifications = queryClient.getQueryData(notificationQueryKeys.list(userId));

      // Optimistic update (remove from list since we don't show archived)
      queryClient.setQueryData(
        notificationQueryKeys.list(userId),
        (old: Notification[] = []) => old.filter(notification => notification.id !== notificationId)
      );

      return { previousNotifications };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationQueryKeys.list(userId), context.previousNotifications);
      }
      
      logger.error('NotificationContext: Archive error:', error);
      toast.error('Gagal mengarsipkan notifikasi');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.counts(userId) });
    }
  });

  // Clear all notifications mutation
  const clearAllMutation = useMutation({
    mutationFn: () => notificationApi.clearAllNotifications(userId!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.list(userId) });

      const previousNotifications = queryClient.getQueryData(notificationQueryKeys.list(userId));

      // Optimistic update
      queryClient.setQueryData(notificationQueryKeys.list(userId), []);

      return { previousNotifications };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationQueryKeys.list(userId), context.previousNotifications);
      }
      
      logger.error('NotificationContext: Clear all error:', error);
      toast.error('Gagal menghapus semua notifikasi');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.counts(userId) });
      toast.success('Semua notifikasi telah dihapus');
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<NotificationSettings>) => {
      const currentSettings = queryClient.getQueryData(notificationQueryKeys.settings(userId)) as NotificationSettings | null;
      return notificationApi.updateSettings(userId!, currentSettings, newSettings);
    },
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.settings(userId) });

      const previousSettings = queryClient.getQueryData(notificationQueryKeys.settings(userId));

      // Optimistic update
      if (previousSettings) {
        queryClient.setQueryData(
          notificationQueryKeys.settings(userId),
          { ...previousSettings, ...newSettings, updated_at: new Date().toISOString() }
        );
      }

      return { previousSettings };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(notificationQueryKeys.settings(userId), context.previousSettings);
      }
      
      logger.error('NotificationContext: Update settings error:', error);
      toast.error('Gagal menyimpan pengaturan');
    },
    onSuccess: () => {
      toast.success('Pengaturan notifikasi berhasil disimpan');
    }
  });

  return {
    addMutation,
    markAsReadMutation,
    markAllAsReadMutation,
    deleteMutation,
    archiveMutation,
    clearAllMutation,
    updateSettingsMutation
  };
};

// ===== CONTEXT SETUP =====
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ===== PROVIDER COMPONENT =====
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;
  
  // Refs for deduplication and state management
  const deduplicatorRef = useRef(new NotificationDeduplicator());
  const mountedRef = useRef<boolean>(true);

  // ✅ Fetch notifications using React Query
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useNotificationsQuery(userId);

  // ✅ Fetch settings using React Query
  const {
    data: settings = null
  } = useNotificationSettingsQuery(userId);

  // ✅ Get mutations
  const {
    addMutation,
    markAsReadMutation,
    markAllAsReadMutation,
    deleteMutation,
    archiveMutation,
    clearAllMutation,
    updateSettingsMutation
  } = useNotificationMutations(userId);

  // ===== COMPUTED VALUES =====
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const urgentCount = notifications.filter(n => !n.is_read && n.priority >= 4).length;

  // ===== REAL-TIME SUBSCRIPTION =====
  useEffect(() => {
    if (!userId || !mountedRef.current) return;

    logger.debug('NotificationContext: Setting up real-time subscription for user:', userId);
    
    const channel = supabase
      .channel(`notifications-${userId}-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        if (!mountedRef.current) return;
        
        logger.debug('NotificationContext: Real-time event detected:', payload.eventType, payload.new?.id || payload.old?.id);
        
        // ✅ RACE CONDITION FIX: Use invalidateQueries instead of direct state manipulation
        queryClient.invalidateQueries({ 
          queryKey: notificationQueryKeys.list(userId) 
        });
        
        queryClient.invalidateQueries({ 
          queryKey: notificationQueryKeys.counts(userId) 
        });

        // ✅ Handle new notifications for toast
        if (payload.eventType === 'INSERT') {
          const newNotification = payload.new as Notification;
          const notificationKey = deduplicatorRef.current.generateKey(newNotification);
          
          // Show toast if enabled and not duplicate
          if (settings?.push_notifications !== false && deduplicatorRef.current.shouldAllow(`toast_${notificationKey}`)) {
            toast.info(newNotification.title, {
              description: newNotification.message,
              duration: newNotification.priority >= 4 ? 8000 : 4000
            });
          }
        }

        // ✅ Optional: Trigger background refetch for immediate updates
        queryClient.refetchQueries({ 
          queryKey: notificationQueryKeys.list(userId),
          type: 'active' 
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.success('NotificationContext: Successfully subscribed to real-time updates');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.error('NotificationContext: Subscription error/timeout:', status);
        }
      });

    return () => {
      logger.debug('NotificationContext: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, settings?.push_notifications]);

  // ===== COMPONENT MOUNT/UNMOUNT TRACKING =====
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      deduplicatorRef.current.clear();
    };
  }, []);

  // ===== PERIODIC CLEANUP =====
  useEffect(() => {
    const cleanup = setInterval(() => {
      if (mountedRef.current) {
        deduplicatorRef.current.clear();
      }
    }, 60000); // Every minute

    return () => clearInterval(cleanup);
  }, []);

  // ===== CONTEXT FUNCTIONS =====
  const addNotification = useCallback(async (notificationData: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    if (!userId || !mountedRef.current) return false;
    
    // Check deduplication
    const notificationKey = deduplicatorRef.current.generateKey(notificationData);
    if (!deduplicatorRef.current.shouldAllow(notificationKey)) {
      return true; // Return true to avoid error handling for duplicates
    }

    try {
      await addMutation.mutateAsync(notificationData);
      return true;
    } catch (error) {
      // Error already handled in mutation
      return false;
    }
  }, [userId, addMutation]);

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
      return true;
    } catch (error) {
      return false;
    }
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    try {
      await markAllAsReadMutation.mutateAsync();
      return true;
    } catch (error) {
      return false;
    }
  }, [userId, markAllAsReadMutation]);

  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(notificationId);
      return true;
    } catch (error) {
      return false;
    }
  }, [deleteMutation]);

  const archiveNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      await archiveMutation.mutateAsync(notificationId);
      return true;
    } catch (error) {
      return false;
    }
  }, [archiveMutation]);

  const clearAllNotifications = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    try {
      await clearAllMutation.mutateAsync();
      deduplicatorRef.current.clear();
      return true;
    } catch (error) {
      return false;
    }
  }, [userId, clearAllMutation]);

  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>): Promise<boolean> => {
    if (!userId) return false;
    try {
      await updateSettingsMutation.mutateAsync(newSettings);
      return true;
    } catch (error) {
      return false;
    }
  }, [userId, updateSettingsMutation]);

  const refreshNotifications = useCallback(async () => {
    logger.debug('NotificationContext: Manual refresh requested');
    deduplicatorRef.current.clear();
    await refetch();
  }, [refetch]);

  // ===== ERROR HANDLING =====
  useEffect(() => {
    if (error) {
      logger.error('NotificationContext: Query error:', error);
      // Don't show toast on initial load errors to avoid noise
    }
  }, [error]);

  // ===== CONTEXT VALUE =====
  const value: NotificationContextType = {
    notifications,
    unreadCount,
    urgentCount,
    isLoading: isLoading || addMutation.isPending || markAsReadMutation.isPending || 
               markAllAsReadMutation.isPending || deleteMutation.isPending || 
               archiveMutation.isPending || clearAllMutation.isPending || updateSettingsMutation.isPending,
    settings,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    updateSettings,
    refreshNotifications,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// ===== CUSTOM HOOK =====
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// ===== ADDITIONAL HOOKS FOR REACT QUERY UTILITIES =====

/**
 * Hook for accessing React Query specific functions
 */
export const useNotificationUtils = () => {
  const queryClient = useQueryClient();

  const invalidateNotifications = useCallback((userId?: string) => {
    queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list(userId) });
    queryClient.invalidateQueries({ queryKey: notificationQueryKeys.counts(userId) });
    queryClient.invalidateQueries({ queryKey: notificationQueryKeys.settings(userId) });
  }, [queryClient]);

  const prefetchNotifications = useCallback((userId: string) => {
    queryClient.prefetchQuery({
      queryKey: notificationQueryKeys.list(userId),
      queryFn: () => notificationApi.getNotifications(userId),
      staleTime: 30 * 1000,
    });
  }, [queryClient]);

  return {
    invalidateNotifications,
    prefetchNotifications,
  };
};

export default NotificationContext;