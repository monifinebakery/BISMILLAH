// contexts/NotificationContext.tsx - FIXED VERSION
// Anti-loop protection and better real-time handling

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface Notification {
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
}

interface NotificationSettings {
  id?: string;
  user_id: string;
  email_notifications: boolean;
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
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  
  const { user } = useAuth();
  
  // Anti-loop protection
  const recentNotificationsRef = useRef<Set<string>>(new Set());
  const lastLoadTimeRef = useRef<number>(0);
  const loadingRef = useRef<boolean>(false);

  const loadNotifications = useCallback(async (isInitialLoad = false) => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setUrgentCount(0);
      setIsLoading(false);
      return;
    }

    // Prevent rapid successive loads (throttle to max 1 per 2 seconds)
    const now = Date.now();
    if (!isInitialLoad && now - lastLoadTimeRef.current < 2000) {
      console.log('NotificationContext: Throttling load request');
      return;
    }

    // Prevent concurrent loads
    if (loadingRef.current) {
      console.log('NotificationContext: Load already in progress');
      return;
    }

    loadingRef.current = true;
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
      lastLoadTimeRef.current = now;

      console.log('NotificationContext: Loaded', notificationsData.length, 'notifications');

      // Load settings on initial load only
      if (isInitialLoad) {
        try {
          const { data: settingsData } = await supabase
            .from('notification_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();
          setSettings(settingsData);
        } catch (settingsError) {
          console.log('No notification settings found, using defaults');
          setSettings({
            user_id: user.id,
            email_notifications: true,
            push_notifications: true,
            inventory_alerts: true,
            order_alerts: true,
            financial_alerts: true
          });
        }
      }

    } catch (error) {
      console.error('Error loading notifications:', error);
      if (isInitialLoad) toast.error('Gagal memuat notifikasi');
    } finally {
      loadingRef.current = false;
      if (isInitialLoad) setIsLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    console.log('NotificationContext: Initial load for user:', user?.id);
    recentNotificationsRef.current.clear(); // Reset tracking
    loadNotifications(true);
  }, [user, loadNotifications]);

  // Real-time subscription with anti-loop protection
  useEffect(() => {
    if (!user) return;

    console.log('NotificationContext: Setting up real-time subscription');

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('NotificationContext: Real-time event:', payload.eventType, payload);
        
        // Handle different events without triggering full reload
        if (payload.eventType === 'INSERT') {
          const newNotification = payload.new as Notification;
          
          // Check if we've already processed this notification recently
          const notificationKey = `${newNotification.id}_${newNotification.created_at}`;
          if (recentNotificationsRef.current.has(notificationKey)) {
            console.log('NotificationContext: Duplicate notification ignored');
            return;
          }
          
          // Add to recent notifications tracking
          recentNotificationsRef.current.add(notificationKey);
          
          // Update local state directly instead of full reload
          setNotifications(prev => {
            const exists = prev.find(n => n.id === newNotification.id);
            if (exists) return prev; // Prevent duplicates
            
            const updated = [newNotification, ...prev].slice(0, 100); // Keep latest 100
            return updated;
          });
          
          // Update counts
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
            if (newNotification.priority >= 3) {
              setUrgentCount(prev => prev + 1);
            }
          }
          
          // Show toast notification (with throttling)
          if (settings?.push_notifications !== false) {
            const toastKey = `toast_${newNotification.id}`;
            if (!recentNotificationsRef.current.has(toastKey)) {
              toast.info(newNotification.title, {
                description: newNotification.message,
                duration: 5000
              });
              recentNotificationsRef.current.add(toastKey);
            }
          }
          
        } else if (payload.eventType === 'UPDATE') {
          const updatedNotification = payload.new as Notification;
          
          setNotifications(prev => 
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );
          
          // Recalculate counts
          setNotifications(current => {
            const unread = current.filter(n => !n.is_read).length;
            const urgent = current.filter(n => !n.is_read && n.priority >= 3).length;
            setUnreadCount(unread);
            setUrgentCount(urgent);
            return current;
          });
          
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => {
            const filtered = prev.filter(n => n.id !== payload.old.id);
            const unread = filtered.filter(n => !n.is_read).length;
            const urgent = filtered.filter(n => !n.is_read && n.priority >= 3).length;
            setUnreadCount(unread);
            setUrgentCount(urgent);
            return filtered;
          });
        }
        
        // Clean up old tracking entries periodically
        if (recentNotificationsRef.current.size > 100) {
          recentNotificationsRef.current.clear();
        }
      })
      .subscribe((status) => {
        console.log('NotificationContext: Subscription status:', status);
      });

    return () => {
      console.log('NotificationContext: Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [user, settings?.push_notifications]);

  // Clean up tracking periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      if (recentNotificationsRef.current.size > 50) {
        console.log('NotificationContext: Cleaning up tracking cache');
        recentNotificationsRef.current.clear();
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(cleanup);
  }, []);

  // Enhanced addNotification with deduplication
  const addNotification = async (notificationData: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // Create a hash to check for near-duplicate notifications
      const contentHash = `${notificationData.title}_${notificationData.message}_${notificationData.type}`;
      const recentKey = `add_${contentHash}`;
      
      // Prevent adding the same notification within 30 seconds
      if (recentNotificationsRef.current.has(recentKey)) {
        console.log('NotificationContext: Duplicate add notification prevented');
        return true; // Return true to avoid error handling, but don't actually add
      }
      
      recentNotificationsRef.current.add(recentKey);
      
      // Remove the key after 30 seconds to allow similar notifications later
      setTimeout(() => {
        recentNotificationsRef.current.delete(recentKey);
      }, 30000);
      
      const dataToInsert = {
        ...notificationData,
        user_id: user.id,
        is_read: notificationData.is_read ?? false,
        is_archived: notificationData.is_archived ?? false
      };
      
      const { error } = await supabase.from('notifications').insert(dataToInsert);
      if (error) throw error;
      
      console.log('NotificationContext: Added notification:', notificationData.title);
      return true;
    } catch (error) {
      console.error('Error adding notification:', error);
      // Don't show toast error for notification failures to prevent feedback loops
      return false;
    }
  };

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

  const updateSettings = async (newSettings: Partial<NotificationSettings>): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .upsert({ 
          user_id: user.id, 
          ...settings, 
          ...newSettings 
        })
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

  const refreshNotifications = useCallback(async () => {
    console.log('NotificationContext: Manual refresh requested');
    await loadNotifications(true);
  }, [loadNotifications]);

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
    refreshNotifications,
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