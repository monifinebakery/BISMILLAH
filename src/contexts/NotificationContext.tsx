// contexts/NotificationContext.tsx - PRODUCTION READY VERSION
// Clean, optimized, and error-free - FIXED PGRST116 ERROR

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
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

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Enhanced deduplication with memory cleanup
class NotificationDeduplicator {
  private cache = new Map<string, number>();
  private readonly ttl = 30000; // 30 seconds TTL
  private readonly maxSize = 500;

  private cleanup() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, timestamp] of this.cache.entries()) {
      if (now - timestamp > this.ttl) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

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

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  
  const { user } = useAuth();
  
  // Enhanced protection refs
  const deduplicatorRef = useRef(new NotificationDeduplicator());
  const lastLoadTimeRef = useRef<number>(0);
  const loadingRef = useRef<boolean>(false);
  const subscriptionRef = useRef<any>(null);
  const mountedRef = useRef<boolean>(true);
  
  // Throttled loading with error handling
  const loadNotifications = useCallback(async (isInitialLoad = false) => {
    if (!user || !mountedRef.current) {
      setNotifications([]);
      setUnreadCount(0);
      setUrgentCount(0);
      setIsLoading(false);
      return;
    }

    // Throttling check
    const now = Date.now();
    if (!isInitialLoad && now - lastLoadTimeRef.current < 2000) {
      return;
    }

    // Prevent concurrent loads
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    if (isInitialLoad) setIsLoading(true);

    try {
      // Fetch recent notifications only
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!mountedRef.current) return;

      const notificationsData = data || [];
      
      // Simple deduplication by ID
      const uniqueNotifications = notificationsData.filter((notification, index, arr) => 
        arr.findIndex(n => n.id === notification.id) === index
      );

      const unread = uniqueNotifications.filter(n => !n.is_read).length;
      const urgent = uniqueNotifications.filter(n => !n.is_read && n.priority >= 4).length;
      
      setNotifications(uniqueNotifications);
      setUnreadCount(unread);
      setUrgentCount(urgent);
      lastLoadTimeRef.current = now;

      // ✅ FIXED: Load settings on initial load only - USING maybeSingle()
      if (isInitialLoad) {
        try {
          const { data: settingsData, error: settingsError } = await supabase
            .from('notification_settings')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle(); // ✅ CHANGED: .single() -> .maybeSingle()
          
          if (settingsError) {
            logger.warn('Error loading notification settings:', settingsError);
          }
          
          if (mountedRef.current) {
            // If no settings found (data is null), create default settings
            if (!settingsData) {
              const defaultSettings = {
                user_id: user.id,
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
                  .maybeSingle(); // ✅ ALSO FIXED: Use maybeSingle() here too
                
                if (!insertError && newSettings) {
                  setSettings(newSettings);
                } else {
                  setSettings(defaultSettings);
                }
              } catch (insertError) {
                logger.warn('Could not create default settings:', insertError);
                setSettings(defaultSettings);
              }
            } else {
              setSettings(settingsData);
            }
          }
        } catch (settingsError) {
          logger.warn('Settings loading error:', settingsError);
          // Use defaults if settings loading fails completely
          if (mountedRef.current) {
            setSettings({
              user_id: user.id,
              push_notifications: true,
              inventory_alerts: true,
              order_alerts: true,
              financial_alerts: true
            });
          }
        }
      }

    } catch (error) {
      logger.error('Error loading notifications:', error);
      if (isInitialLoad && mountedRef.current) {
        toast.error('Gagal memuat notifikasi');
      }
    } finally {
      loadingRef.current = false;
      if (isInitialLoad && mountedRef.current) setIsLoading(false);
    }
  }, [user]);

  // Initial load effect
  useEffect(() => {
    mountedRef.current = true;
    deduplicatorRef.current.clear();
    loadNotifications(true);
    
    return () => {
      mountedRef.current = false;
    };
  }, [user, loadNotifications]);

  // Real-time subscription with cleanup
  useEffect(() => {
    if (!user || !mountedRef.current) return;

    // Clean up existing subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
      subscriptionRef.current = null;
    }

    const channel = supabase
      .channel(`notifications-${user.id}-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (!mountedRef.current) return;
        
        if (payload.eventType === 'INSERT') {
          const newNotification = payload.new as Notification;
          const notificationKey = deduplicatorRef.current.generateKey(newNotification);
          
          // Check deduplication
          if (!deduplicatorRef.current.shouldAllow(notificationKey)) {
            return;
          }
          
          // Update state
          setNotifications(prev => {
            const exists = prev.find(n => n.id === newNotification.id);
            if (exists) return prev;
            
            return [newNotification, ...prev].slice(0, 50);
          });
          
          // Update counts
          if (!newNotification.is_read) {
            setUnreadCount(prev => prev + 1);
            if (newNotification.priority >= 4) {
              setUrgentCount(prev => prev + 1);
            }
          }
          
          // Show toast if enabled
          if (settings?.push_notifications !== false) {
            const toastKey = `toast_${notificationKey}`;
            if (deduplicatorRef.current.shouldAllow(toastKey)) {
              toast.info(newNotification.title, {
                description: newNotification.message,
                duration: newNotification.priority >= 4 ? 8000 : 4000
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
        if (status === 'SUBSCRIBED') {
          subscriptionRef.current = channel;
        }
      });

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user, settings?.push_notifications]);

  // Periodic cleanup
  useEffect(() => {
    const cleanup = setInterval(() => {
      if (mountedRef.current) {
        deduplicatorRef.current.clear();
      }
    }, 60000); // Every minute

    return () => clearInterval(cleanup);
  }, []);

  // Enhanced addNotification with error handling
  const addNotification = async (notificationData: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    if (!user || !mountedRef.current) return false;
    
    try {
      // Check deduplication
      const notificationKey = deduplicatorRef.current.generateKey(notificationData);
      if (!deduplicatorRef.current.shouldAllow(notificationKey)) {
        return true; // Return true to avoid error handling
      }

      // Database duplicate check (recent only)
      const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', notificationData.title)
        .gte('created_at', oneMinuteAgo)
        .limit(1);

      if (existingNotifications && existingNotifications.length > 0) {
        return true; // Skip duplicate
      }
      
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
      logger.error('Error adding notification:', error);
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
      logger.error('Error marking as read:', error);
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
      logger.error('Error marking all as read:', error);
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
      logger.error('Error deleting notification:', error);
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
      logger.error('Error archiving notification:', error);
      return false;
    }
  };

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
      logger.error('Error clearing all notifications:', error);
      toast.error('Gagal menghapus semua notifikasi');
      return false;
    }
  };

  // ✅ FIXED: updateSettings also uses maybeSingle() for upsert
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
        .maybeSingle(); // ✅ CHANGED: .single() -> .maybeSingle()
      
      if (error) throw error;
      if (mountedRef.current && data) {
        setSettings(data);
        toast.success('Pengaturan notifikasi berhasil disimpan');
      }
      return true;
    } catch (error) {
      logger.error('Error updating settings:', error);
      toast.error('Gagal menyimpan pengaturan');
      return false;
    }
  };

  const refreshNotifications = useCallback(async () => {
    deduplicatorRef.current.clear();
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