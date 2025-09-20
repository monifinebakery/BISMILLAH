// src/services/simpleNotificationApi.ts
// ✅ SIMPLE NOTIFICATION API - Basic CRUD operations

import { supabase } from '@/integrations/supabase/client';

// Simple notification type matching Supabase notifications table structure
export interface SimpleNotification {
  id: string; // uuid
  user_id: string; // uuid
  title: string;
  message?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
  priority: number; // 1-5
  related_type?: string;
  related_id?: string;
  action_url?: string;
  is_read: boolean;
  is_archived: boolean;
  metadata?: Record<string, any>; // jsonb
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
  expires_at?: string; // timestamp with time zone
}

// Get notifications for a user
export const getSimpleNotifications = async (userId: string): Promise<SimpleNotification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// Add a new notification
export const addSimpleNotification = async (
  notification: Omit<SimpleNotification, 'id' | 'created_at' | 'updated_at'>,
  userId: string
): Promise<SimpleNotification | null> => {
  try {
    const now = new Date().toISOString();
    const newNotification = {
      ...notification,
      user_id: userId,
      created_at: now,
      updated_at: now
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert([newNotification])
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error adding notification:', error);
    return null;
  }
};

// Mark a notification as read
export const markSimpleNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Mark all notifications as read
export const markAllSimpleNotificationsAsRead = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

// Archive a notification
export const archiveSimpleNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_archived: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error archiving notification:', error);
    return false;
  }
};

// Delete a notification
export const deleteSimpleNotification = async (notificationId: string): Promise<boolean> => {
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

// Clear all notifications
export const clearAllSimpleNotifications = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    return false;
  }
};