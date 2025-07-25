// contexts/NotificationContext.tsx - ENHANCED VERSION
// Superior anti-loop protection and better real-time handling

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

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
  clearAllNotifications: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// 🔧 ENHANCED: Advanced deduplication helper
class NotificationDeduplicator {
  private cache = new Map<string, number>();
  private readonly ttl = 60000; // 1 minute TTL
  private readonly maxSize = 1000;

  private cleanup() {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.cache.forEach((timestamp, key) => {
      if (now - timestamp > this.ttl) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    // If still too large, remove oldest entries
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

  // Generate smart key for notification deduplication
  generateKey(notification: Partial<Notification>): string {
    const parts = [
      notification.title?.toLowerCase(),
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

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  
  const { user } = useAuth();
  
  // 🔧 ENHANCED: Advanced anti-loop protection
  const deduplicatorRef = useRef(new NotificationDeduplicator());
  const lastLoadTimeRef = useRef<number>(0);
  const loadingRef = useRef<boolean>(false);
  const subscriptionRef = useRef<any>(null);
  
  // 🔧 ENHANCED: Throttled loading with better error handling
  const loadNotifications = useCallback(async (isInitialLoad = false) => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setUrgentCount(0);
      setIsLoading(false);
      return;
    }

    // 🔧 ENHANCED: More aggressive throttling
    const now = Date.now();
    if (!isInitialLoad && now - lastLoadTimeRef.current < 3000) {
      console.log('NotificationContext: Load throttled');
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
      // 🔧 ENHANCED: Better query with timestamp filtering to prevent old duplicates
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .gte('created_at', fiveMinutesAgo) // Only recent notifications for dedup
        .order('created_at', { ascending: false })
        .limit(50); // Reduced limit for better performance

      if (error) throw error;

      const notificationsData = data || [];
      
      // 🔧 ENHANCED: Deduplicate based on content similarity
      const deduplicatedNotifications = notificationsData.filter((notification, index, arr) => {
        const key = deduplicatorRef.current.generateKey(notification);
        return arr.findIndex(n => deduplicatorRef.current.generateKey(n) === key) === index;
      });

      const unread = deduplicatedNotifications.filter(n => !n.is_read).length;
      const urgent = deduplicatedNotifications.filter(n => !n.is_read && n.priority >= 4).length;
      
      setNotifications(deduplicatedNotifications);
      setUnreadCount(unread);
      setUrgentCount(urgent);
      lastLoadTimeRef.current = now;

      console.log('NotificationContext: Loaded', deduplicatedNotifications.length, 'notifications (deduplicated)');

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
      if (isInitialLoad) {
        // Only show error toast on initial load
        toast.error('Gagal memuat notifikasi');
      }
    } finally {
      loadingRef.current = false;
      if (isInitialLoad) setIsLoading(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    console.log('NotificationContext: Initial load for user:', user?.id);
    deduplicatorRef.current.clear(); // Reset deduplication
    loadNotifications(true);
  }, [user, loadNotifications]);

  // 🔧 ENHANCED: Real-time subscription with superior anti-loop protection
  useEffect(() => {
    if (!user) return;

    // Clean up existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    console.log('NotificationContext: Setting up enhanced real-time subscription');

    const channel = supabase
      .channel(`notifications-${user.id}-${Date.now()}`) // Unique channel name
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        console.log('NotificationContext: Real-time event:', payload.eventType);
        
        // 🔧 ENHANCED: Smart event handling
        if (payload.eventType === 'INSERT') {
          const newNotification = payload.new as Notification;
          const notificationKey = deduplicatorRef.current.generateKey(newNotification);
          
          // 🔧 ENHANCED: Better deduplication check
          if (!deduplicatorRef.current.shouldAllow(notificationKey)) {
            console.log('NotificationContext: Duplicate real-time notification ignored:', newNotification.title);
            return;
          }
          
          // Update local state directly
          setNotifications(prev => {
            // Check if notification already exists
            const exists = prev.find(n => n.id === newNotification.id);
            if (exists) {
              console.log('NotificationContext: Notification already exists, skipping');
              return prev;
            }
            
            // Add new notification and keep only latest 50
            const updated = [newNotification, ...prev].slice(0, 50);
            return updated;
          });
          
          // Update counts
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
            if (newNotification.priority >= 4) {
              setUrgentCount(prev => prev + 1);
            }
          }
          
          // 🔧 ENHANCED: Smart toast notifications
          if (settings?.push_notifications !== false) {
            const toastKey = `toast_${notificationKey}`;
            if (deduplicatorRef.current.shouldAllow(toastKey)) {
              toast.info(newNotification.title, {
                description: newNotification.message,
                duration: newNotification.priority >= 4 ? 8000 : 5000
              });
            }
          }
          
        } else if (payload.eventType === 'UPDATE') {
          const updatedNotification = payload.new as Notification;
          
          setNotifications(prev => {
            const updated = prev.map(n => n.id === updatedNotification.id ? updatedNotification : n);
            
            // Recalculate counts
            const unread = updated.filter(n => !n.is_read).length;
            const urgent = updated.filter(n => !n.is_read && n.priority >= 4).length;
            setUnreadCount(unread);
            setUrgentCount(urgent);
            
            return updated;
          });
          
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => {
            const filtered = prev.filter(n => n.id !== payload.old.id);
            const unread = filtered.filter(n => !n.is_read).length;
            const urgent = filtered.filter(n => !n.is_read && n.priority >= 4).length;
            setUnreadCount(unread);
            setUrgentCount(urgent);
            return filtered;
          });
        }
      })
      .subscribe((status) => {
        console.log('NotificationContext: Enhanced subscription status:', status);
        if (status === 'SUBSCRIBED') {
          subscriptionRef.current = channel;
        }
      });

    return () => {
      console.log('NotificationContext: Cleaning up enhanced subscription');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user, settings?.push_notifications]);

  // 🔧 ENHANCED: Periodic cleanup
  useEffect(() => {
    const cleanup = setInterval(() => {
      console.log('NotificationContext: Running periodic cleanup');
      deduplicatorRef.current.clear();
    }, 2 * 60 * 1000); // Every 2 minutes

    return () => clearInterval(cleanup);
  }, []);

  // 🔧 ENHANCED: Superior addNotification with database-level deduplication
  const addNotification = async (notificationData: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      // 🔧 ENHANCED: Check deduplicator first
      const notificationKey = deduplicatorRef.current.generateKey(notificationData);
      if (!deduplicatorRef.current.shouldAllow(notificationKey)) {
        console.log('NotificationContext: Duplicate add notification prevented:', notificationData.title);
        return true; // Return true to avoid error handling
      }

      // 🔧 ENHANCED: Database-level duplicate check
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('id, title, related_type, related_id')
        .eq('user_id', user.id)
        .eq('title', notificationData.title)
        .gte('created_at', fiveMinutesAgo)
        .limit(1);

      if (existingNotifications && existingNotifications.length > 0) {
        // Check if it's truly the same notification
        const isDuplicate = existingNotifications.some(existing => 
          existing.related_type === notificationData.related_type &&
          existing.related_id === notificationData.related_id
        );
        
        if (isDuplicate) {
          console.log('NotificationContext: Database duplicate prevented:', notificationData.title);
          return true;
        }
      }
      
      const dataToInsert = {
        ...notificationData,
        user_id: user.id,
        is_read: notificationData.is_read ?? false,
        is_archived: notificationData.is_archived ?? false
      };
      
      const { error } = await supabase.from('notifications').insert(dataToInsert);
      if (error) throw error;
      
      console.log('NotificationContext: Successfully added notification:', notificationData.title);
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
        .update({ is_read: true, updated_at: new Date().toISOString() })
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
        .update({ is_read: true, updated_at: new Date().toISOString() })
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
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error archiving notification:', error);
      return false;
    }
  };

  // 🔧 ENHANCED: New method to clear all notifications
  const clearAllNotifications = async (): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setNotifications([]);
      setUnreadCount(0);
      setUrgentCount(0);
      deduplicatorRef.current.clear();
      
      toast.success('Semua notifikasi telah dihapus');
      return true;
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      toast.error('Gagal menghapus semua notifikasi');
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
          ...newSettings,
          updated_at: new Date().toISOString()
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
    deduplicatorRef.current.clear(); // Clear cache before refresh
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
    clearAllNotifications,
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