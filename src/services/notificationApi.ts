// src/services/notificationApi.ts
// ✅ CLEAN API LAYER - Pure functions, no complex logic

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { toSafeISOString } from '@/utils/unifiedDateUtils';
import { 
  Notification, 
  NotificationSettings, 
  CreateNotificationData,
  NotificationApiResponse
} from '@/types/notification';

// ===========================================
// ✅ DATABASE INTERFACE
// ===========================================

interface NotificationDB {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  icon?: string;
  priority: number;
  related_type?: string;
  related_id?: string;
  action_url?: string;
  is_read: boolean;
  is_archived: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

interface NotificationSettingsDB {
  id?: string;
  user_id: string;
  push_notifications: boolean;
  inventory_alerts: boolean;
  order_alerts: boolean;
  financial_alerts: boolean;
  created_at?: string;
  updated_at?: string;
}

// ===========================================
// ✅ TRANSFORM FUNCTIONS (Pure)
// ===========================================

const transformFromDB = (data: NotificationDB): Notification => ({
  id: data.id,
  user_id: data.user_id,
  title: data.title,
  message: data.message,
  type: data.type as 'info' | 'success' | 'warning' | 'error',
  icon: data.icon,
  priority: data.priority,
  related_type: data.related_type,
  related_id: data.related_id,
  action_url: data.action_url,
  is_read: data.is_read,
  is_archived: data.is_archived,
  expires_at: data.expires_at,
  created_at: data.created_at,
  updated_at: data.updated_at
});

const transformForDB = (data: CreateNotificationData, userId: string): Partial<NotificationDB> => ({
  user_id: userId,
  title: data.title,
  message: data.message,
  type: data.type,
  icon: data.icon || 'bell',
  priority: data.priority || 2,
  related_type: data.related_type,
  related_id: data.related_id,
  action_url: data.action_url,
  is_read: data.is_read || false,
  is_archived: data.is_archived || false,
  expires_at: data.expires_at
});

// ===========================================
// ✅ API FUNCTIONS
// ===========================================

export const getNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    
    return (data || []).map(transformFromDB);
  } catch (error: any) {
    logger.error('Error fetching notifications:', error);
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }
};

export const addNotification = async (
  notification: CreateNotificationData,
  userId: string
): Promise<Notification> => {
  try {
    const dbData = transformForDB(notification, userId);
    
    const { data, error } = await supabase
      .from('notifications')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;
    
    return transformFromDB(data);
  } catch (error: any) {
    logger.error('Error adding notification:', error);
    throw new Error(`Failed to add notification: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const markAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        updated_at: toSafeISOString(new Date()) || new Date().toISOString() 
      })
      .eq('id', notificationId);

    if (error) throw error;
    
    return true;
  } catch (error: any) {
    logger.error('Error marking as read:', error);
    throw new Error(`Failed to mark as read: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const markAllAsRead = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        updated_at: toSafeISOString(new Date()) || new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    
    return true;
  } catch (error: any) {
    logger.error('Error marking all as read:', error);
    throw new Error(`Failed to mark all as read: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    
    return true;
  } catch (error: any) {
    logger.error('Error deleting notification:', error);
    throw new Error(`Failed to delete notification: ${error.message}`);
  }
};

export const archiveNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_archived: true, 
        updated_at: toSafeISOString(new Date()) || new Date().toISOString() 
      })
      .eq('id', notificationId);

    if (error) throw error;
    
    return true;
  } catch (error: any) {
    logger.error('Error archiving notification:', error);
    throw new Error(`Failed to archive notification: ${error.message}`);
  }
};

export const clearAllNotifications = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    
    return true;
  } catch (error: any) {
    logger.error('Error clearing all notifications:', error);
    throw new Error(`Failed to clear all notifications: ${error.message}`);
  }
};

export const getNotificationSettings = async (userId: string): Promise<NotificationSettings> => {
  try {
    // ✅ FIXED: Use maybeSingle() instead of single() to avoid error when no data
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    
    if (!data) {
      // ✅ FIXED: Create default settings using upsert to avoid duplicate key error
      const defaultSettings = {
        user_id: userId,
        push_notifications: true,
        inventory_alerts: true,
        order_alerts: true,
        financial_alerts: true
      };

      const { data: newData, error: insertError } = await supabase
        .from('notification_settings')
        .upsert(defaultSettings, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .maybeSingle();

      if (insertError) {
        logger.warn('Could not create default settings, returning defaults:', insertError);
        return defaultSettings;
      }
      
      return newData || defaultSettings;
    }
    
    return data;
  } catch (error: any) {
    logger.error('Error fetching notification settings:', error);
    
    // ✅ FALLBACK: Return default settings if all else fails
    return {
      user_id: userId,
      push_notifications: true,
      inventory_alerts: true,
      order_alerts: true,
      financial_alerts: true
    };
  }
};

export const updateNotificationSettings = async (
  userId: string,
  settings: Partial<NotificationSettings>
): Promise<NotificationSettings> => {
  try {
    // ✅ FIXED: Use upsert to handle both insert and update
    const { data, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        ...settings,
        updated_at: toSafeISOString(new Date()) || new Date().toISOString()
      }, {
        onConflict: 'user_id', // Specify conflict resolution
        ignoreDuplicates: false // Always update if conflict
      })
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error: any) {
    logger.error('Error updating notification settings:', error);
    throw new Error(`Failed to update settings: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// ===========================================
// ✅ EXPORT
// ===========================================

export default {
  getNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  archiveNotification,
  clearAllNotifications,
  getNotificationSettings,
  updateNotificationSettings
};