// src/contexts/SimpleNotificationContext.tsx
// ✅ SIMPLE NOTIFICATION CONTEXT - Minimal implementation

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Simple notification type
export interface SimpleNotification {
  id: string;
  title: string;
  message?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: Date;
  isRead: boolean;
}

// Context type
export interface SimpleNotificationContextType {
  notifications: SimpleNotification[];
  unreadCount: number;
  addNotification: (notification: Omit<SimpleNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

// Create context
const SimpleNotificationContext = createContext<SimpleNotificationContextType | undefined>(undefined);

// Provider component
export const SimpleNotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<SimpleNotification[]>([]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Add a new notification
  const addNotification = (notification: Omit<SimpleNotification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: SimpleNotification = {
      id: Math.random().toString(36).substr(2, 9),
      ...notification,
      createdAt: new Date(),
      isRead: false
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only last 50
  };

  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
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
    clearAll
  };

  return (
    <SimpleNotificationContext.Provider value={value}>
      {children}
    </SimpleNotificationContext.Provider>
  );
};

// Custom hook
export const useSimpleNotification = (): SimpleNotificationContextType => {
  const context = useContext(SimpleNotificationContext);
  if (context === undefined) {
    throw new Error('useSimpleNotification must be used within a SimpleNotificationProvider');
  }
  return context;
};

export default SimpleNotificationContext;