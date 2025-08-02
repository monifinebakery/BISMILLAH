// src/types/notification.ts
/**
 * Mendefinisikan struktur data untuk satu notifikasi.
 * Ini akan digunakan di seluruh aplikasi untuk memastikan konsistensi.
 */
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
  priority: 1 | 2 | 3 | 4; // 1=rendah, 2=normal, 3=tinggi, 4=darurat
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Mendefinisikan struktur data untuk pengaturan notifikasi pengguna.
 * Updated untuk mencocokkan dengan form state di NotificationSettingsForm
 */
export interface NotificationSettings {
  id?: string;
  user_id: string;
  
  // Basic notifications
  push_notifications: boolean;
  
  // Business notifications
  order_notifications: boolean;
  inventory_notifications: boolean;
  system_notifications: boolean;
  
  // Financial & alerts
  financial_alerts: boolean;
  inventory_alerts: boolean;
  stock_alerts: boolean;
  payment_alerts: boolean;
  low_stock_alerts: boolean;
  
  // Reports
  daily_reports: boolean;
  weekly_reports: boolean;
  monthly_reports: boolean;
  
  // Additional
  reminder_notifications: boolean;
  security_alerts: boolean;
  
  // Settings
  low_stock_threshold: number;
  auto_archive_days: number;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

/**
 * Partial type untuk update settings - semua field opsional kecuali user_id
 */
export type NotificationSettingsUpdate = Partial<Omit<NotificationSettings, 'user_id'>> & {
  user_id: string;
};

/**
 * Type untuk form state di komponen NotificationSettingsForm
 */
export type NotificationFormState = Omit<NotificationSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

/**
 * Enum untuk jenis-jenis notifikasi yang tersedia
 */
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success', 
  WARNING = 'warning',
  ERROR = 'error'
}

/**
 * Enum untuk prioritas notifikasi
 */
export enum NotificationPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  URGENT = 4
}

/**
 * Enum untuk tipe relasi notifikasi
 */
export enum NotificationRelatedType {
  ORDER = 'order',
  PURCHASE = 'purchase',
  INVENTORY = 'inventory',
  SYSTEM = 'system'
}

/**
 * Interface untuk response API ketika mengambil notifikasi
 */
export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  page?: number;
  per_page?: number;
}

/**
 * Interface untuk filter notifikasi
 */
export interface NotificationFilter {
  type?: NotificationType;
  is_read?: boolean;
  is_archived?: boolean;
  priority?: NotificationPriority;
  related_type?: NotificationRelatedType;
  date_from?: string;
  date_to?: string;
}

/**
 * Interface untuk create notification payload
 */
export interface CreateNotificationPayload {
  user_id: string;
  title: string;
  message?: string;
  type: NotificationType;
  related_id?: string;
  related_type?: NotificationRelatedType;
  action_url?: string;
  icon?: string;
  priority?: NotificationPriority;
  expires_at?: string;
}