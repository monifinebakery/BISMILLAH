// src/contexts/NotificationContext.tsx
// ✅ CLEAN CONTEXT - No circular dependencies, simplified structure

import React, { createContext, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Type imports only
import { 
  Notification, 
  NotificationSettings,
  NotificationContextType,
  CreateNotificationData
} from '@/types/notification';

// API imports
import {
  getNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  archiveNotification,
  clearAllNotifications,
  getNotificationSettings,
  updateNotificationSettings
} from '@/services/notificationApi';

// Auth context
import { useAuth } from '@/contexts/AuthContext';

// ===========================================
// ✅ QUERY KEYS
// ===========================================

export const notificationQueryKeys = {
  all: ['notifications'] as const,
  list: (userId?: string) => [...notificationQueryKeys.all, 'list', userId] as const,
  settings: (userId?: string) => [...notificationQueryKeys.all, 'settings', userId] as const,
} as const;

// ===========================================
// ✅ CONTEXT SETUP
// ===========================================

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ===========================================
// ✅ CUSTOM HOOKS FOR DATA FETCHING
// ===========================================

const useNotificationsQuery = (userId?: string) => {
  return useQuery({
    queryKey: notificationQueryKeys.list(userId),
    queryFn: () => getNotifications(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

const useNotificationSettingsQuery = (userId?: string) => {
  return useQuery({
    queryKey: notificationQueryKeys.settings(userId),
    queryFn: () => getNotificationSettings(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// ===========================================
// ✅ CUSTOM HOOKS FOR MUTATIONS
// ===========================================

const useNotificationMutations = (userId?: string) => {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (data: CreateNotificationData) => addNotification(data, userId!),
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
      logger.error('Add notification error:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list(userId) });
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => markAsRead(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.list(userId) });

      const previousNotifications = queryClient.getQueryData(notificationQueryKeys.list(userId));

      queryClient.setQueryData(
        notificationQueryKeys.list(userId),
        (old: Notification[] = []) =>
          old.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
      );

      return { previousNotifications };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationQueryKeys.list(userId), context.previousNotifications);
      }
      toast.error('Gagal menandai sebagai dibaca');
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllAsRead(userId!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.list(userId) });

      const previousNotifications = queryClient.getQueryData(notificationQueryKeys.list(userId));

      queryClient.setQueryData(
        notificationQueryKeys.list(userId),
        (old: Notification[] = []) =>
          old.map(notification => ({ ...notification, is_read: true }))
      );

      return { previousNotifications };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationQueryKeys.list(userId), context.previousNotifications);
      }
      toast.error('Gagal menandai semua sebagai dibaca');
    },
    onSuccess: () => {
      toast.success('Semua notifikasi telah dibaca');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (notificationId: string) => deleteNotification(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.list(userId) });

      const previousNotifications = queryClient.getQueryData(notificationQueryKeys.list(userId));

      queryClient.setQueryData(
        notificationQueryKeys.list(userId),
        (old: Notification[] = []) => old.filter(n => n.id !== notificationId)
      );

      return { previousNotifications };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationQueryKeys.list(userId), context.previousNotifications);
      }
      toast.error('Gagal menghapus notifikasi');
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (notificationId: string) => archiveNotification(notificationId),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.list(userId) });

      const previousNotifications = queryClient.getQueryData(notificationQueryKeys.list(userId));

      queryClient.setQueryData(
        notificationQueryKeys.list(userId),
        (old: Notification[] = []) => old.filter(n => n.id !== notificationId)
      );

      return { previousNotifications };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationQueryKeys.list(userId), context.previousNotifications);
      }
      toast.error('Gagal mengarsipkan notifikasi');
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: () => clearAllNotifications(userId!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.list(userId) });

      const previousNotifications = queryClient.getQueryData(notificationQueryKeys.list(userId));

      queryClient.setQueryData(notificationQueryKeys.list(userId), []);

      return { previousNotifications };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationQueryKeys.list(userId), context.previousNotifications);
      }
      toast.error('Gagal menghapus semua notifikasi');
    },
    onSuccess: () => {
      toast.success('Semua notifikasi telah dihapus');
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<NotificationSettings>) =>
      updateNotificationSettings(userId!, newSettings),
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: notificationQueryKeys.settings(userId) });

      const previousSettings = queryClient.getQueryData(notificationQueryKeys.settings(userId));

      if (previousSettings) {
        queryClient.setQueryData(
          notificationQueryKeys.settings(userId),
          { ...previousSettings, ...newSettings }
        );
      }

      return { previousSettings };
    },
    onError: (error: any, variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(notificationQueryKeys.settings(userId), context.previousSettings);
      }
      toast.error('Gagal menyimpan pengaturan');
    },
    onSuccess: () => {
      toast.success('Pengaturan berhasil disimpan');
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

// ===========================================
// ✅ PROVIDER COMPONENT
// ===========================================

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Fetch data
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    refetch: refetchNotifications
  } = useNotificationsQuery(userId);

  const {
    data: settings = null,
    isLoading: settingsLoading
  } = useNotificationSettingsQuery(userId);

  // Get mutations
  const {
    addMutation,
    markAsReadMutation,
    markAllAsReadMutation,
    deleteMutation,
    archiveMutation,
    clearAllMutation,
    updateSettingsMutation
  } = useNotificationMutations(userId);

  // ===========================================
  // ✅ COMPUTED VALUES
  // ===========================================

  const { unreadCount, urgentCount } = useMemo(() => {
    const unread = notifications.filter(n => !n.is_read).length;
    const urgent = notifications.filter(n => !n.is_read && n.priority >= 4).length;
    return { unreadCount: unread, urgentCount: urgent };
  }, [notifications]);

  // ===========================================
  // ✅ REAL-TIME SUBSCRIPTION
  // ===========================================

  useEffect(() => {
    if (!userId) return;

    logger.debug('Setting up notification real-time subscription');

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        logger.debug('Notification real-time event:', payload.eventType);
        
        // Invalidate queries to refetch fresh data
        queryClient.invalidateQueries({
          queryKey: notificationQueryKeys.list(userId)
        });

        // Show toast for new notifications
        if (payload.eventType === 'INSERT' && payload.new) {
          const newNotification = payload.new as any;
          if (settings?.push_notifications !== false) {
            toast.info(newNotification.title, {
              description: newNotification.message,
              duration: newNotification.priority >= 4 ? 8000 : 4000
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, settings?.push_notifications]);

  // ===========================================
  // ✅ CONTEXT FUNCTIONS
  // ===========================================

  const addNotificationFn = useCallback(async (data: CreateNotificationData): Promise<boolean> => {
    if (!userId) return false;
    try {
      await addMutation.mutateAsync(data);
      return true;
    } catch (error) {
      return false;
    }
  }, [userId, addMutation]);

  const markAsReadFn = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      await markAsReadMutation.mutateAsync(notificationId);
      return true;
    } catch (error) {
      return false;
    }
  }, [markAsReadMutation]);

  const markAllAsReadFn = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    try {
      await markAllAsReadMutation.mutateAsync();
      return true;
    } catch (error) {
      return false;
    }
  }, [userId, markAllAsReadMutation]);

  const deleteNotificationFn = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(notificationId);
      return true;
    } catch (error) {
      return false;
    }
  }, [deleteMutation]);

  const archiveNotificationFn = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      await archiveMutation.mutateAsync(notificationId);
      return true;
    } catch (error) {
      return false;
    }
  }, [archiveMutation]);

  const clearAllNotificationsFn = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    try {
      await clearAllMutation.mutateAsync();
      return true;
    } catch (error) {
      return false;
    }
  }, [userId, clearAllMutation]);

  const updateSettingsFn = useCallback(async (newSettings: Partial<NotificationSettings>): Promise<boolean> => {
    if (!userId) return false;
    try {
      await updateSettingsMutation.mutateAsync(newSettings);
      return true;
    } catch (error) {
      return false;
    }
  }, [userId, updateSettingsMutation]);

  const refreshNotifications = useCallback(async () => {
    await refetchNotifications();
  }, [refetchNotifications]);

  // ===========================================
  // ✅ CONTEXT VALUE
  // ===========================================

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    urgentCount,
    isLoading: notificationsLoading || settingsLoading || 
               addMutation.isPending || markAsReadMutation.isPending ||
               markAllAsReadMutation.isPending || deleteMutation.isPending ||
               archiveMutation.isPending || clearAllMutation.isPending ||
               updateSettingsMutation.isPending,
    settings,
    addNotification: addNotificationFn,
    markAsRead: markAsReadFn,
    markAllAsRead: markAllAsReadFn,
    deleteNotification: deleteNotificationFn,
    archiveNotification: archiveNotificationFn,
    updateSettings: updateSettingsFn,
    refreshNotifications,
    clearAllNotifications: clearAllNotificationsFn,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// ===========================================
// ✅ HOOK
// ===========================================

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;