// src/contexts/NotificationContext.tsx
// ✅ CLEAN CONTEXT - No circular dependencies, simplified structure

import React, { createContext, useContext, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
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

// Cleanup utilities
import { cleanupExpiredNotifications } from '@/utils/notificationCleanup';

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
    staleTime: 2 * 60 * 1000, // 2 minutes - IMPROVED: Match other contexts
    gcTime: 10 * 60 * 1000, // 10 minutes - IMPROVED: Extended cache time
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) return false;
      return failureCount < 2;
    },
    refetchOnWindowFocus: false, // IMPROVED: Prevent unnecessary refetches
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
  // ✅ DEDUPLICATION LOGIC
  // ===========================================

  const recentNotificationsRef = useRef<Map<string, number>>(new Map());
  const DUPLICATE_THRESHOLD = 5 * 60 * 1000; // 5 minutes - Extended to reduce duplicates

  const generateNotificationKey = useCallback((data: CreateNotificationData): string => {
    // Enhanced key generation to prevent cross-context duplicates
    return [
      userId || 'anonymous',
      data.title.toLowerCase().trim(),
      data.related_type || '',
      data.related_id || '',
      data.message.substring(0, 50) // Include message snippet for better uniqueness
    ].join('|');
  }, [userId]);

  const cleanupExpiredNotifications = useCallback(() => {
    const now = Date.now();
    recentNotificationsRef.current.forEach((timestamp, key) => {
      if (now - timestamp > DUPLICATE_THRESHOLD) {
        recentNotificationsRef.current.delete(key);
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(cleanupExpiredNotifications, DUPLICATE_THRESHOLD);
    return () => clearInterval(interval);
  }, [cleanupExpiredNotifications, DUPLICATE_THRESHOLD]);

  // ✅ AUTO-CLEANUP: Clean expired notifications every hour
  useEffect(() => {
    if (!userId) return;

    const autoCleanupExpired = async () => {
      try {
        const removed = await cleanupExpiredNotifications(userId);
        if (removed > 0) {
          logger.info(`🗑️ Auto-cleanup: removed ${removed} expired notifications`);
          // Refresh notification list if any were removed
          queryClient.invalidateQueries({ queryKey: notificationQueryKeys.list(userId) });
        }
      } catch (error) {
        logger.warn('Auto-cleanup expired notifications failed:', error);
      }
    };

    // Run immediately on mount
    autoCleanupExpired();

    // Then run every hour
    const cleanupInterval = setInterval(autoCleanupExpired, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(cleanupInterval);
  }, [userId, queryClient]);

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

  const notifDebounceRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (!userId) return;

    logger.debug('Setting up notification real-time subscription');

    const requestInvalidate = () => {
      if (notifDebounceRef.current) {
        window.clearTimeout(notifDebounceRef.current);
      }
      notifDebounceRef.current = window.setTimeout(() => {
        // Invalidate queries to refetch fresh data
        queryClient.invalidateQueries({
          queryKey: notificationQueryKeys.list(userId)
        });
        notifDebounceRef.current = null;
      }, 250);
    };

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        logger.debug('Notification real-time event:', payload.eventType);
        requestInvalidate();

        // Show toast for new notifications (but not for local actions to prevent duplicates)
        if (payload.eventType === 'INSERT' && payload.new) {
          const newNotification = payload.new as any;
          
          // ✅ FIXED: Check if notification was created from current session to avoid duplicate toast
          const isLocalAction = newNotification.metadata?.source === 'local' ||
                               recentNotificationsRef.current.has(generateNotificationKey(newNotification));
          
          if (!isLocalAction && settings?.push_notifications !== false) {
            toast.info(newNotification.title, {
              description: newNotification.message,
              duration: newNotification.priority >= 4 ? 8000 : 4000
            });
          }
        }
      })
      .subscribe();

    return () => {
      if (notifDebounceRef.current) {
        window.clearTimeout(notifDebounceRef.current);
        notifDebounceRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, settings?.push_notifications]);

  // ===========================================
  // ✅ CONTEXT FUNCTIONS
  // ===========================================

  const addNotificationFn = useCallback(async (data: CreateNotificationData): Promise<boolean> => {
    if (!userId) return false;

    const notificationKey = generateNotificationKey(data);
    const now = Date.now();

    cleanupExpiredNotifications();

    const lastSent = recentNotificationsRef.current.get(notificationKey);
    if (lastSent && (now - lastSent) < DUPLICATE_THRESHOLD) {
      logger.debug(`Duplicate notification prevented: ${data.title}`);
      return false;
    }

    try {
      await addMutation.mutateAsync(data);
      recentNotificationsRef.current.set(notificationKey, now);
      return true;
    } catch (error) {
      return false;
    }
  }, [userId, addMutation, generateNotificationKey, cleanupExpiredNotifications]);

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

  const value: NotificationContextType = useMemo(() => ({
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
  }), [
    notifications,
    unreadCount,
    urgentCount,
    notificationsLoading,
    settingsLoading,
    addMutation.isPending,
    markAsReadMutation.isPending,
    markAllAsReadMutation.isPending,
    deleteMutation.isPending,
    archiveMutation.isPending,
    clearAllMutation.isPending,
    updateSettingsMutation.isPending,
    settings,
    addNotificationFn,
    markAsReadFn,
    markAllAsReadFn,
    deleteNotificationFn,
    archiveNotificationFn,
    updateSettingsFn,
    refreshNotifications,
    clearAllNotificationsFn
  ]);

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
