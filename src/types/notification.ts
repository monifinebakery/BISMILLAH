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
 */
export interface NotificationSettings {
  id?: string;
  user_id: string;
  push_notifications: boolean;
  order_notifications: boolean;
  inventory_notifications: boolean;
  system_notifications: boolean;
  low_stock_threshold: number;
  auto_archive_days: number;
}
