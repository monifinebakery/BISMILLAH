// src/contexts/SimpleNotificationContext.tsx
// ✅ SIMPLE NOTIFICATION CONTEXT - Minimal implementation

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Simple notification type - matches Supabase notifications table structure
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
  isRead: boolean; // is_read in DB
  is_archived: boolean;
  metadata?: Record<string, any>; // jsonb
  created_at: string; // timestamp with time zone
  updated_at: string; // timestamp with time zone
  expires_at?: string; // timestamp with time zone
}

// Context type
export interface SimpleNotificationContextType {
  notifications: SimpleNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<SimpleNotification, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'isRead' | 'is_archived'> & { user_id: string }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  archiveNotification: (id: string) => void;
}

// Create context
const SimpleNotificationContext = createContext<SimpleNotificationContextType | undefined>(undefined);

// Provider component
export const SimpleNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<SimpleNotification[]>([]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Add a new notification
  const addNotification = (notification: Omit<SimpleNotification, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'isRead' | 'is_archived'> & { user_id: string }) => {
    const now = new Date().toISOString();
    const newNotification: SimpleNotification = {
      id: Math.random().toString(36).substr(2, 9), // In real implementation, this would be a UUID from Supabase
      user_id: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      icon: notification.icon,
      priority: notification.priority || 1,
      related_type: notification.related_type,
      related_id: notification.related_id,
      action_url: notification.action_url,
      isRead: false,
      is_archived: notification.is_archived || false,
      metadata: notification.metadata,
      created_at: now,
      updated_at: now,
      expires_at: notification.expires_at
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only last 50
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true, updated_at: new Date().toISOString() } : n)
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const now = new Date().toISOString();
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true, updated_at: now }))
    );
  };

  // Remove a notification (delete from DB)
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Archive a notification
  const archiveNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_archived: true, updated_at: new Date().toISOString() } : n)
    );
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Context value
  const value: SimpleNotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    archiveNotification
  };

  return (
    <SimpleNotificationContext.Provider value={value}>
      {children}
    </SimpleNotificationContext.Provider>
  );
};

// Custom hook with better error handling
export const useSimpleNotification = (): SimpleNotificationContextType => {
  const context = useContext(SimpleNotificationContext);
  if (context === undefined) {
    // 🔧 FIX: Provide more helpful error message with debugging info
    console.error('useSimpleNotification hook called outside provider. Stack trace:', new Error().stack);
    throw new Error(
      'useSimpleNotification must be used within a SimpleNotificationProvider. ' +
      'Make sure the component using this hook is wrapped in <SimpleNotificationProvider> ' +
      'or ensure AppProviders is properly set up in your app root.'
    );
  }
  return context;
};

// 🔧 FIX: Safe hook that returns null instead of throwing when provider is not available
// This can be used for components that might render before providers are ready
export const useSimpleNotificationSafe = (): SimpleNotificationContextType | null => {
  const context = useContext(SimpleNotificationContext);
  return context || null;
};

export default SimpleNotificationContext;