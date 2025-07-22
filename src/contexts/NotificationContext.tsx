// contexts/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

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
  priority: 1 | 2 | 3 | 4; // 1=low, 2=normal, 3=high, 4=urgent
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
  
  // CRUD operations
  addNotification: (notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  archiveNotification: (notificationId: string) => Promise<boolean>;
  
  // Bulk operations
  bulkMarkAsRead: (notificationIds: string[]) => Promise<boolean>;
  bulkDelete: (notificationIds: string[]) => Promise<boolean>;
  bulkArchive: (notificationIds: string[]) => Promise<boolean>;
  
  // Settings
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<boolean>;
  
  // Utility functions
  refreshNotifications: () => Promise<void>;
  getNotificationsByType: (type: string) => Notification[];
  getUnreadNotifications: () => Notification[];
  getUrgentNotifications: () => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const { user } = useAuth();

  // Load notifications and settings
  const loadNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setUrgentCount(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Load notifications
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(100);

      if (notificationsError) throw notificationsError;

      // Load settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') { // Not found error is OK
        console.warn('Settings load error:', settingsError);
      }

      setNotifications(notificationsData || []);
      setSettings(settingsData);
      
      // Calculate counts
      const unread = (notificationsData || []).filter(n => !n.is_read).length;
      const urgent = (notificationsData || []).filter(n => !n.is_read && n.priority >= 3).length;
      
      setUnreadCount(unread);
      setUrgentCount(urgent);

    } catch (error) {
      console.error('Error loading notifications:', error);
      toast.error('Gagal memuat notifikasi');
    } finally {
      setIsLoading(false);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    if (!user) return;

    loadNotifications();

    // Real-time subscription for notifications
    const notificationSubscription = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('Notification change:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
            if (newNotification.priority >= 3) {
              setUrgentCount(prev => prev + 1);
            }
            
            // Show toast for new notifications
            toast.success(newNotification.title, {
              description: newNotification.message,
              duration: 5000
            });
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          
          // Recalculate counts
          setTimeout(() => {
            setNotifications(current => {
              const unread = current.filter(n => !n.is_read).length;
              const urgent = current.filter(n => !n.is_read && n.priority >= 3).length;
              setUnreadCount(unread);
              setUrgentCount(urgent);
              return current;
            });
          }, 100);
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old.id;
          setNotifications(prev => prev.filter(n => n.id !== deletedId));
          
          // Recalculate counts
          setTimeout(() => {
            setNotifications(current => {
              const unread = current.filter(n => !n.is_read).length;
              const urgent = current.filter(n => !n.is_read && n.priority >= 3).length;
              setUnreadCount(unread);
              setUrgentCount(urgent);
              return current;
            });
          }, 100);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationSubscription);
    };
  }, [user]);

  // Add new notification
  const addNotification = async (notificationData: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          ...notificationData,
          user_id: user.id
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding notification:', error);
      toast.error('Gagal menambahkan notifikasi');
      return false;
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking as read:', error);
      return false;
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      
      toast.success('Semua notifikasi telah dibaca');
      return true;
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Gagal menandai semua sebagai dibaca');
      return false;
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  };

  // Archive notification
  const archiveNotification = async (notificationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_archived: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error archiving notification:', error);
      return false;
    }
  };

  // Bulk mark as read
  const bulkMarkAsRead = async (notificationIds: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error bulk marking as read:', error);
      return false;
    }
  };

  // Bulk delete
  const bulkDelete = async (notificationIds: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error bulk deleting:', error);
      return false;
    }
  };

  // Bulk archive
  const bulkArchive = async (notificationIds: string[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_archived: true })
        .in('id', notificationIds);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error bulk archiving:', error);
      return false;
    }
  };

  // Update notification settings
  const updateSettings = async (newSettings: Partial<NotificationSettings>): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          ...newSettings
        });

      if (error) throw error;
      
      setSettings(prev => ({ ...prev, ...newSettings } as NotificationSettings));
      toast.success('Pengaturan notifikasi berhasil disimpan');
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Gagal menyimpan pengaturan');
      return false;
    }
  };

  // Refresh notifications
  const refreshNotifications = async (): Promise<void> => {
    await loadNotifications();
  };

  // Utility functions
  const getNotificationsByType = (type: string): Notification[] => {
    return notifications.filter(n => n.type === type);
  };

  const getUnreadNotifications = (): Notification[] => {
    return notifications.filter(n => !n.is_read);
  };

  const getUrgentNotifications = (): Notification[] => {
    return notifications.filter(n => !n.is_read && n.priority >= 3);
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
    bulkMarkAsRead,
    bulkDelete,
    bulkArchive,
    updateSettings,
    refreshNotifications,
    getNotificationsByType,
    getUnreadNotifications,
    getUrgentNotifications
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

// Helper function to create notifications for common actions
export const createNotificationHelper = {
  orderCreated: (orderId: string, orderNumber: string, customerName: string) => ({
    title: 'Pesanan Baru Dibuat',
    message: `Pesanan #${orderNumber} dari ${customerName} telah dibuat`,
    type: 'success' as const,
    related_id: orderId,
    related_type: 'order' as const,
    action_url: `/orders/${orderId}`,
    icon: 'shopping-cart',
    priority: 2 as const
  }),

  orderStatusChanged: (orderId: string, orderNumber: string, newStatus: string) => ({
    title: 'Status Pesanan Berubah',
    message: `Pesanan #${orderNumber} sekarang ${newStatus}`,
    type: 'info' as const,
    related_id: orderId,
    related_type: 'order' as const,
    action_url: `/orders/${orderId}`,
    icon: 'refresh-cw',
    priority: 2 as const
  }),

  lowStock: (itemName: string, currentStock: number, minStock: number) => ({
    title: 'Stok Rendah!',
    message: `${itemName} stok tinggal ${currentStock} (minimum: ${minStock})`,
    type: 'warning' as const,
    related_type: 'inventory' as const,
    action_url: '/inventory',
    icon: 'alert-triangle',
    priority: 3 as const
  }),

  systemError: (errorMessage: string) => ({
    title: 'Terjadi Kesalahan Sistem',
    message: errorMessage,
    type: 'error' as const,
    related_type: 'system' as const,
    icon: 'alert-circle',
    priority: 4 as const,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  })
};