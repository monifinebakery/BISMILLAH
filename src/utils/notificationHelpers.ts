// src/utils/notificationHelpers.ts

// Impor tipe data Notifikasi dari context-nya.
// Pastikan path-nya sesuai dengan struktur folder Anda.
import { Notification } from '@/contexts/NotificationContext';

// Membuat tipe data baru yang lebih sederhana untuk membuat notifikasi,
// karena id, user_id, dan timestamp akan diatur secara otomatis.
type NotificationData = Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_read' | 'is_archived'>;

// Objek ini berisi kumpulan fungsi "cetakan" untuk membuat notifikasi
export const createNotificationHelper = {
  /**
   * Notifikasi saat pesanan baru berhasil dibuat.
   */
  orderCreated: (orderId: string, orderNumber: string, customerName: string): NotificationData => ({
    title: '🛍️ Pesanan Baru',
    message: `Pesanan #${orderNumber} dari ${customerName} telah dibuat.`,
    type: 'success',
    icon: 'shopping-cart',
    priority: 2,
    related_id: orderId,
    related_type: 'order',
    action_url: `/pesanan?id=${orderId}`,
  }),

  /**
   * Notifikasi saat status pesanan berubah.
   */
  orderStatusChanged: (orderId: string, orderNumber: string, newStatus: string): NotificationData => ({
    title: '🔄 Status Pesanan Berubah',
    message: `Status pesanan #${orderNumber} diubah menjadi "${newStatus}".`,
    type: 'info',
    icon: 'refresh-cw',
    priority: 2,
    related_id: orderId,
    related_type: 'order',
    action_url: `/pesanan?id=${orderId}`,
  }),

  /**
   * Notifikasi peringatan saat stok bahan baku menipis.
   */
  lowStock: (itemName: string, currentStock: number, minStock: number): NotificationData => ({
    title: '⚠️ Stok Menipis',
    message: `${itemName} tersisa ${currentStock} dari minimum ${minStock}.`,
    type: 'warning',
    icon: 'alert-triangle',
    priority: 3, // Prioritas tinggi
    related_type: 'inventory',
    action_url: '/gudang',
  }),

  /**
   * Notifikasi darurat saat stok bahan baku habis.
   */
  outOfStock: (itemName: string): NotificationData => ({
    title: '🚫 Stok Habis!',
    message: `${itemName} sudah habis. Segera lakukan pembelian!`,
    type: 'error',
    icon: 'alert-circle',
    priority: 4, // Prioritas darurat
    related_type: 'inventory',
    action_url: '/gudang',
  }),
  
  /**
   * Notifikasi saat pembelian dari supplier selesai.
   */
  purchaseCompleted: (purchaseId: string, supplierName: string): NotificationData => ({
    title: '✅ Pembelian Selesai',
    message: `Pembelian dari ${supplierName} telah selesai dan stok diperbarui.`,
    type: 'success',
    icon: 'package',
    priority: 2,
    related_id: purchaseId,
    related_type: 'purchase',
    action_url: `/pembelian?id=${purchaseId}`,
  }),

  /**
   * Notifikasi untuk error sistem umum.
   */
  systemError: (errorMessage: string): NotificationData => ({
    title: '❌ Terjadi Kesalahan Sistem',
    message: errorMessage,
    type: 'error',
    icon: 'alert-circle',
    priority: 4, // Prioritas darurat
    related_type: 'system',
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Expired dalam 24 jam
  }),
};
