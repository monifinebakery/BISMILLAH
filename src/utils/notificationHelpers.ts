// src/utils/notificationHelpers.ts
// ✅ SIMPLE NOTIFICATION HELPERS - No complex logic, pure functions

import { CreateNotificationData } from '@/types/notification';

// ===========================================
// ✅ NOTIFICATION TEMPLATE CREATORS
// ===========================================

export const createNotificationHelper = {
  // Order notifications
  orderCreated: (orderId: string, orderNumber: string, customerName: string): CreateNotificationData => ({
    title: `Pesanan Baru #${orderNumber}`,
    message: `Pesanan dari ${customerName} telah dibuat`,
    type: 'success',
    icon: 'shopping-cart',
    priority: 2,
    related_type: 'order',
    related_id: orderId,
    action_url: `/orders/${orderId}`,
    is_read: false,
    is_archived: false
  }),

  orderStatusChanged: (orderId: string, orderNumber: string, oldStatus: string, newStatus: string): CreateNotificationData => ({
    title: `Status Pesanan #${orderNumber} Berubah`,
    message: `Status berubah dari ${oldStatus} menjadi ${newStatus}`,
    type: 'info',
    icon: 'package',
    priority: 2,
    related_type: 'order',
    related_id: orderId,
    action_url: `/orders/${orderId}`,
    is_read: false,
    is_archived: false
  }),

  // Inventory notifications
  lowStock: (itemName: string, currentStock: number, minStock: number): CreateNotificationData => ({
    title: `Stok Rendah: ${itemName}`,
    message: `Stok tersisa ${currentStock}, minimum ${minStock}`,
    type: 'warning',
    icon: 'alert-triangle',
    priority: 3,
    related_type: 'inventory',
    action_url: '/warehouse',
    is_read: false,
    is_archived: false
  }),

  outOfStock: (itemName: string): CreateNotificationData => ({
    title: `Stok Habis: ${itemName}`,
    message: `Item telah habis dan perlu direstock`,
    type: 'error',
    icon: 'alert-circle',
    priority: 4,
    related_type: 'inventory',
    action_url: '/warehouse',
    is_read: false,
    is_archived: false
  }),

  expiringSoon: (itemName: string, daysLeft: number): CreateNotificationData => ({
    title: `Item Mendekati Expired`,
    message: `${itemName} akan expired dalam ${daysLeft} hari`,
    type: 'warning',
    icon: 'calendar',
    priority: 3,
    related_type: 'inventory',
    action_url: '/warehouse',
    is_read: false,
    is_archived: false
  }),

  // Purchase notifications
  purchaseCreated: (purchaseId: string, supplierName: string, totalValue: number, itemCount: number): CreateNotificationData => ({
    title: `Purchase Order Baru`,
    message: `PO dari ${supplierName} dengan ${itemCount} item, total ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalValue)}`,
    type: 'success',
    icon: 'package',
    priority: 2,
    related_type: 'purchase',
    related_id: purchaseId,
    action_url: `/purchase/${purchaseId}`,
    is_read: false,
    is_archived: false
  }),

  purchaseCompleted: (purchaseId: string, supplierName: string, totalValue: number): CreateNotificationData => ({
    title: `Purchase Order Selesai`,
    message: `PO dari ${supplierName} senilai ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalValue)} telah selesai`,
    type: 'success',
    icon: 'check-circle',
    priority: 2,
    related_type: 'purchase',
    related_id: purchaseId,
    action_url: `/purchase/${purchaseId}`,
    is_read: false,
    is_archived: false
  }),

  // Financial notifications
  financialTransactionAdded: (type: 'income' | 'expense', amount: number, description: string): CreateNotificationData => ({
    title: `Transaksi ${type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Baru`,
    message: `${description} - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)}`,
    type: 'info',
    icon: type === 'income' ? 'check-circle' : 'alert-circle',
    priority: 2,
    related_type: 'financial',
    action_url: '/financial',
    is_read: false,
    is_archived: false
  }),

  // System notifications
  systemError: (errorMessage: string): CreateNotificationData => ({
    title: `System Error`,
    message: errorMessage,
    type: 'error',
    icon: 'alert-circle',
    priority: 4,
    related_type: 'system',
    is_read: false,
    is_archived: false
  }),

  backupSuccess: (): CreateNotificationData => ({
    title: `Backup Berhasil`,
    message: `Data berhasil di-backup`,
    type: 'success',
    icon: 'check-circle',
    priority: 1,
    related_type: 'system',
    is_read: false,
    is_archived: false
  }),

  backupFailed: (reason: string): CreateNotificationData => ({
    title: `Backup Gagal`,
    message: `Backup gagal: ${reason}`,
    type: 'error',
    icon: 'alert-circle',
    priority: 3,
    related_type: 'system',
    is_read: false,
    is_archived: false
  }),

  // User notifications
  welcome: (userName: string): CreateNotificationData => ({
    title: `Selamat Datang ${userName}!`,
    message: `Terima kasih telah bergabung dengan sistem kami`,
    type: 'success',
    icon: 'welcome',
    priority: 1,
    related_type: 'system',
    is_read: false,
    is_archived: false
  }),

  dailySummary: (ordersCount: number, revenue: number): CreateNotificationData => ({
    title: `Ringkasan Harian`,
    message: `${ordersCount} pesanan hari ini dengan total pendapatan ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(revenue)}`,
    type: 'info',
    icon: 'info',
    priority: 1,
    related_type: 'system',
    action_url: '/dashboard',
    is_read: false,
    is_archived: false
  }),

  // Custom notification
  custom: (
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info', 
    priority: 1 | 2 | 3 | 4 = 2
  ): CreateNotificationData => ({
    title,
    message,
    type,
    icon: 'bell',
    priority,
    related_type: 'system',
    is_read: false,
    is_archived: false
  })
};

// ===========================================
// ✅ UTILITY FUNCTIONS
// ===========================================

/**
 * Format currency for Indonesian locale
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(amount);
};

/**
 * Validate notification data
 */
export const validateNotificationData = (data: CreateNotificationData): boolean => {
  return !!(data.title && data.message && data.type);
};

/**
 * Get notification priority label
 */
export const getPriorityLabel = (priority: number): string => {
  switch (priority) {
    case 1: return 'Rendah';
    case 2: return 'Normal';
    case 3: return 'Tinggi';
    case 4: return 'Darurat';
    default: return 'Normal';
  }
};

/**
 * Get notification type label
 */
export const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'info': return 'Informasi';
    case 'success': return 'Sukses';
    case 'warning': return 'Peringatan';
    case 'error': return 'Error';
    default: return 'Informasi';
  }
};

export default createNotificationHelper;