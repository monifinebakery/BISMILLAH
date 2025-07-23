// contexts/NotificationContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

// --- TYPES (Sebaiknya dipindah ke src/types/notification.ts) ---
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  is_archived: boolean;
  related_id?: string;
  related_type?: 'order' | 'purchase' | 'inventory' | 'system';
  action_url?: string;
  icon?: string;
  priority: 1 | 2 | 3 | 4;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id?: string;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  order_notifications: boolean;
  inventory_notifications: boolean;
  system_notifications: boolean;
  low_stock_threshold: number;
  auto_archive_days: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  urgentCount: number;
  isLoading: boolean;
  settings: NotificationSettings | null;
  // 🔧 FIXED: Consistent signature with helper functions
  addNotification: (notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  archiveNotification: (notificationId: string) => Promise<boolean>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const { user } = useAuth();

  const loadNotifications = useCallback(async (isInitialLoad = false) => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setUrgentCount(0);
      setIsLoading(false);
      return;
    }

    if (isInitialLoad) setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const notificationsData = data || [];
      const unread = notificationsData.filter(n => !n.is_read).length;
      const urgent = notificationsData.filter(n => !n.is_read && n.priority >= 3).length;
      
      setNotifications(notificationsData);
      setUnreadCount(unread);
      setUrgentCount(urgent);

      if (isInitialLoad) {
        const { data: settingsData } = await supabase
          .from('notification_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setSettings(settingsData);
      }

    } catch (error) {
      console.error('Error loading notifications:', error);
      if (isInitialLoad) toast.error('Gagal memuat notifikasi');
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications(true);
  }, [loadNotifications]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Perubahan notifikasi terdeteksi!', payload);
        
        loadNotifications(false);

        if (payload.eventType === 'INSERT') {
          const newNotification = payload.new as Notification;
          toast.info(newNotification.title, {
            description: newNotification.message,
            duration: 5000
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadNotifications]);

  // 🔧 FIXED: Accept both is_read and is_archived, with defaults
  const addNotification = async (notificationData: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    if (!user) return false;
    try {
      const dataToInsert = {
        ...notificationData,
        user_id: user.id,
        is_read: notificationData.is_read ?? false,
        is_archived: notificationData.is_archived ?? false
      };
      
      const { error } = await supabase.from('notifications').insert(dataToInsert);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding notification:', error);
      toast.error('Gagal menambahkan notifikasi');
      return false;
    }
  };

  const markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking as read:', error);
      return false;
    }
  };

  const markAllAsRead = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      if (error) throw error;
      toast.success('Semua notifikasi telah dibaca');
      return true;
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Gagal menandai semua sebagai dibaca');
      return false;
    }
  };

  const deleteNotification = async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', notificationId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  };

  const archiveNotification = async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase.from('notifications').update({ is_archived: true }).eq('id', notificationId);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error archiving notification:', error);
      return false;
    }
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({ user_id: user.id, ...settings, ...newSettings })
        .select()
        .single();
      if (error) throw error;
      setSettings(data);
      toast.success('Pengaturan notifikasi berhasil disimpan');
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Gagal menyimpan pengaturan');
      return false;
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    urgentCount,
    isLoading,
    settings,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    archiveNotification,
    updateSettings,
    refreshNotifications: () => loadNotifications(true),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};