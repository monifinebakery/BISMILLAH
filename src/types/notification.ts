// src/types/notification.ts
// ✅ SINGLE SOURCE OF TRUTH - All notification types centralized

/**
 * Core Notification interface - matches database schema exactly
 */
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: string;
  priority: number; // 1=low, 2=normal, 3=high, 4=urgent
  related_type?: string;
  related_id?: string;
  action_url?: string;
  is_read: boolean;
  is_archived: boolean;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Settings interface - simplified version
 */
export interface NotificationSettings {
  id?: string;
  user_id: string;
  push_notifications: boolean;
  inventory_alerts: boolean;
  order_alerts: boolean;
  financial_alerts: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * API Response types
 */
export interface NotificationApiResponse<T = any> {
  data: T;
  error?: string;
  success: boolean;
}

/**
 * Context interface
 */
export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  urgentCount: number;
  isLoading: boolean;
  settings: NotificationSettings | null;
  addNotification: (notification: CreateNotificationData) => Promise<boolean>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  archiveNotification: (notificationId: string) => Promise<boolean>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<boolean>;
  refreshNotifications: () => Promise<void>;
  clearAllNotifications: () => Promise<boolean>;
}

/**
 * Helper types
 */
export type CreateNotificationData = Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type UpdateNotificationData = Partial<Omit<Notification, 'id' | 'user_id' | 'created_at'>>;

/**
 * Default values
 */
export const DEFAULT_NOTIFICATION_SETTINGS: Omit<NotificationSettings, 'user_id'> = {
  push_notifications: true,
  inventory_alerts: true,
  order_alerts: true,
  financial_alerts: true
};

/**
 * Constants
 */
export const NOTIFICATION_ICONS = {
  'bell': 'Bell',
  'alert-circle': 'AlertCircle',
  'alert-triangle': 'AlertTriangle',
  'info': 'Info',
  'check-circle': 'CheckCircle',
  'refresh-cw': 'RefreshCw',
  'shopping-cart': 'ShoppingCart',
  'package': 'Package',
  'user': 'User',
  'calendar': 'Calendar',
  'welcome': 'CheckCircle'
} as const;

export const NOTIFICATION_COLORS = {
  info: 'text-blue-600 bg-blue-50 border-blue-200',
  success: 'text-green-600 bg-green-50 border-green-200',
  warning: 'text-orange-600 bg-orange-50 border-orange-200',
  error: 'text-red-600 bg-red-50 border-red-200'
} as const;