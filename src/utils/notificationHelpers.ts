// utils/notificationHelpers.ts
import { Notification } from '@/contexts/NotificationContext';

type NotificationInput = Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

/**
 * Helper functions to create standardized notification templates
 * for consistent messaging across the application
 */
export const createNotificationHelper = {
  // === ORDER NOTIFICATIONS ===
  
  orderCreated: (orderId: string, orderNumber: string, customerName: string): NotificationInput => ({
    title: '🛍️ Pesanan Baru Dibuat!',
    message: `Pesanan #${orderNumber} dari ${customerName} berhasil dibuat`,
    type: 'success',
    icon: 'shopping-cart',
    priority: 2,
    related_id: orderId,
    related_type: 'order',
    action_url: '/orders',
    is_read: false,
    is_archived: false
  }),

  orderStatusChanged: (orderId: string, orderNumber: string, oldStatus: string, newStatus: string): NotificationInput => ({
    title: '📝 Status Pesanan Diubah',
    message: `Pesanan #${orderNumber} dari "${oldStatus}" menjadi "${newStatus}"`,
    type: 'info',
    icon: 'refresh-cw',
    priority: 2,
    related_id: orderId,
    related_type: 'order',
    action_url: '/orders',
    is_read: false,
    is_archived: false
  }),

  orderCompleted: (orderId: string, orderNumber: string, revenue: number): NotificationInput => ({
    title: '🎉 Pesanan Selesai!',
    message: `Pesanan #${orderNumber} telah selesai. Revenue Rp ${revenue.toLocaleString()} tercatat`,
    type: 'success',
    icon: 'check-circle',
    priority: 2,
    related_id: orderId,
    related_type: 'order',
    action_url: '/orders',
    is_read: false,
    is_archived: false
  }),

  orderDeleted: (orderNumber: string, customerName: string): NotificationInput => ({
    title: '🗑️ Pesanan Dihapus',
    message: `Pesanan #${orderNumber} dari ${customerName} telah dihapus`,
    type: 'warning',
    icon: 'trash-2',
    priority: 2,
    related_type: 'order',
    action_url: '/orders',
    is_read: false,
    is_archived: false
  }),

  // === PURCHASE NOTIFICATIONS ===

  purchaseCreated: (purchaseId: string, supplierName: string, totalValue: number, itemCount: number): NotificationInput => ({
    title: '📦 Pembelian Baru Dibuat!',
    message: `Pembelian dari ${supplierName} senilai Rp ${totalValue.toLocaleString()} dengan ${itemCount} item berhasil dibuat`,
    type: 'success',
    icon: 'package',
    priority: 2,
    related_id: purchaseId,
    related_type: 'purchase',
    action_url: '/purchases',
    is_read: false,
    is_archived: false
  }),

  purchaseCompleted: (purchaseId: string, supplierName: string, totalValue: number): NotificationInput => ({
    title: '✅ Pembelian Selesai!',
    message: `Pembelian dari ${supplierName} senilai Rp ${totalValue.toLocaleString()} telah selesai dan pengeluaran tercatat`,
    type: 'success',
    icon: 'check-circle',
    priority: 2,
    related_id: purchaseId,
    related_type: 'purchase',
    action_url: '/purchases',
    is_read: false,
    is_archived: false
  }),

  purchaseStatusChanged: (purchaseId: string, supplierName: string, oldStatus: string, newStatus: string): NotificationInput => ({
    title: '📝 Status Pembelian Diubah',
    message: `Pembelian dari ${supplierName} diubah dari "${oldStatus}" menjadi "${newStatus}"`,
    type: 'info',
    icon: 'refresh-cw',
    priority: 2,
    related_id: purchaseId,
    related_type: 'purchase',
    action_url: '/purchases',
    is_read: false,
    is_archived: false
  }),

  purchaseDeleted: (supplierName: string, totalValue: number): NotificationInput => ({
    title: '🗑️ Pembelian Dihapus',
    message: `Pembelian dari ${supplierName} senilai Rp ${totalValue.toLocaleString()} telah dihapus`,
    type: 'warning',
    icon: 'trash-2',
    priority: 2,
    related_type: 'purchase',
    action_url: '/purchases',
    is_read: false,
    is_archived: false
  }),

  // === INVENTORY NOTIFICATIONS ===

  lowStock: (itemName: string, currentStock: number, minStock: number): NotificationInput => ({
    title: '⚠️ Stok Menipis!',
    message: `${itemName} tersisa ${currentStock} dari minimum ${minStock}. Pertimbangkan untuk melakukan pembelian.`,
    type: 'warning',
    icon: 'alert-triangle',
    priority: 3,
    related_type: 'inventory',
    action_url: '/inventory',
    is_read: false,
    is_archived: false
  }),

  outOfStock: (itemName: string): NotificationInput => ({
    title: '🚫 Stok Habis!',
    message: `${itemName} sudah habis. Segera lakukan pembelian untuk menghindari gangguan produksi.`,
    type: 'error',
    icon: 'alert-circle',
    priority: 4,
    related_type: 'inventory',
    action_url: '/inventory',
    is_read: false,
    is_archived: false
  }),

  stockIncreased: (itemName: string, increase: number, unit: string, totalStock: number): NotificationInput => ({
    title: '📈 Stok Ditambahkan',
    message: `${itemName} bertambah ${increase} ${unit}. Total stok sekarang ${totalStock} ${unit}`,
    type: 'success',
    icon: 'trending-up',
    priority: 1,
    related_type: 'inventory',
    action_url: '/inventory',
    is_read: false,
    is_archived: false
  }),

  stockDecreased: (itemName: string, decrease: number, unit: string, remainingStock: number): NotificationInput => ({
    title: '📉 Stok Berkurang',
    message: `${itemName} berkurang ${decrease} ${unit}. Sisa stok ${remainingStock} ${unit}`,
    type: 'info',
    icon: 'trending-down',
    priority: 1,
    related_type: 'inventory',
    action_url: '/inventory',
    is_read: false,
    is_archived: false
  }),

  itemAdded: (itemName: string, initialStock: number, unit: string, totalValue: number): NotificationInput => ({
    title: '📦 Item Baru Ditambahkan!',
    message: `${itemName} berhasil ditambahkan dengan stok ${initialStock} ${unit} dan nilai Rp ${totalValue.toLocaleString()}`,
    type: 'success',
    icon: 'package',
    priority: 2,
    related_type: 'inventory',
    action_url: '/inventory',
    is_read: false,
    is_archived: false
  }),

  itemDeleted: (itemName: string): NotificationInput => ({
    title: '🗑️ Item Dihapus',
    message: `${itemName} telah dihapus dari inventory`,
    type: 'warning',
    icon: 'trash-2',
    priority: 2,
    related_type: 'inventory',
    action_url: '/inventory',
    is_read: false,
    is_archived: false
  }),

  expiringSoon: (itemName: string, daysLeft: number): NotificationInput => ({
    title: '⏰ Akan Expired',
    message: `${itemName} akan expired dalam ${daysLeft} hari. Pertimbangkan untuk menggunakannya terlebih dahulu.`,
    type: 'warning',
    icon: 'calendar',
    priority: 3,
    related_type: 'inventory',
    action_url: '/inventory',
    is_read: false,
    is_archived: false
  }),

  expiringCritical: (itemName: string, daysLeft: number, potentialLoss: number): NotificationInput => ({
    title: '🔥 Segera Expired!',
    message: `${itemName} akan expired dalam ${daysLeft} hari! Gunakan segera atau akan mengalami kerugian Rp ${potentialLoss.toLocaleString()}.`,
    type: 'error',
    icon: 'calendar',
    priority: 4,
    related_type: 'inventory',
    action_url: '/inventory',
    is_read: false,
    is_archived: false
  }),

  insufficientStock: (itemName: string, requested: number, available: number, unit: string): NotificationInput => ({
    title: '⚠️ Stok Tidak Cukup',
    message: `${itemName} hanya tersisa ${available} ${unit}, tidak cukup untuk dikurangi ${requested}`,
    type: 'warning',
    icon: 'alert-triangle',
    priority: 3,
    related_type: 'inventory',
    action_url: '/inventory',
    is_read: false,
    is_archived: false
  }),

  itemNotFound: (itemName: string): NotificationInput => ({
    title: '❌ Item Tidak Ditemukan',
    message: `Bahan baku "${itemName}" tidak ditemukan saat mencoba mengurangi stok`,
    type: 'error',
    icon: 'alert-circle',
    priority: 3,
    related_type: 'inventory',
    action_url: '/inventory',
    is_read: false,
    is_archived: false
  }),

  bulkDeleteInventory: (itemCount: number, itemNames: string[]): NotificationInput => ({
    title: '🗑️ Bulk Delete Inventory',
    message: `${itemCount} item berhasil dihapus dari inventory (${itemNames.join(', ').substring(0, 50)}${itemNames.length > 3 ? '...' : ''})`,
    type: 'warning',
    icon: 'trash-2',
    priority: 2,
    related_type: 'inventory',
    action_url: '/inventory',
    is_read: false,
    is_archived: false
  }),

  // === SYSTEM NOTIFICATIONS ===

  systemError: (errorMessage: string): NotificationInput => ({
    title: '❌ Terjadi Kesalahan Sistem',
    message: errorMessage,
    type: 'error',
    icon: 'alert-circle',
    priority: 4,
    related_type: 'system',
    is_read: false,
    is_archived: false,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  }),

  backupSuccess: (): NotificationInput => ({
    title: '✅ Backup Berhasil',
    message: 'Data aplikasi berhasil di-backup ke cloud',
    type: 'success',
    icon: 'check-circle',
    priority: 1,
    related_type: 'system',
    is_read: false,
    is_archived: false
  }),

  backupFailed: (reason: string): NotificationInput => ({
    title: '❌ Backup Gagal',
    message: `Backup gagal: ${reason}. Silakan coba lagi.`,
    type: 'error',
    icon: 'alert-circle',
    priority: 3,
    related_type: 'system',
    is_read: false,
    is_archived: false
  }),

  maintenanceMode: (duration: string): NotificationInput => ({
    title: '🔧 Mode Maintenance',
    message: `Sistem akan maintenance selama ${duration}. Harap simpan pekerjaan Anda.`,
    type: 'warning',
    icon: 'alert-triangle',
    priority: 4,
    related_type: 'system',
    is_read: false,
    is_archived: false,
    expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 hours
  }),

  dailySummary: (ordersCount: number, revenue: number): NotificationInput => ({
    title: '📊 Ringkasan Harian',
    message: `Hari ini: ${ordersCount} pesanan dengan total revenue Rp ${revenue.toLocaleString()}`,
    type: 'info',
    icon: 'calendar',
    priority: 1,
    related_type: 'system',
    action_url: '/dashboard',
    is_read: false,
    is_archived: false
  }),

  weeklySummary: (ordersCount: number, newCustomers: number): NotificationInput => ({
    title: '📈 Ringkasan Mingguan',
    message: `Minggu ini: ${ordersCount} pesanan, ${newCustomers} pelanggan baru`,
    type: 'info',
    icon: 'calendar',
    priority: 1,
    related_type: 'system',
    action_url: '/reports',
    is_read: false,
    is_archived: false
  }),

  monthlyReport: (month: string): NotificationInput => ({
    title: '📈 Laporan Bulanan Siap',
    message: `Laporan bulan ${month} telah selesai dibuat dan siap untuk ditinjau`,
    type: 'info',
    icon: 'calendar',
    priority: 2,
    related_type: 'system',
    action_url: '/reports',
    is_read: false,
    is_archived: false
  }),

  // === FINANCIAL NOTIFICATIONS ===

  financialRecordCreated: (type: 'income' | 'expense', amount: number, description: string): NotificationInput => ({
    title: type === 'income' ? '💰 Pemasukan Dicatat' : '💸 Pengeluaran Dicatat',
    message: `${description} - Rp ${amount.toLocaleString()}`,
    type: 'success',
    icon: type === 'income' ? 'trending-up' : 'trending-down',
    priority: 2,
    related_type: 'system',
    action_url: '/financial',
    is_read: false,
    is_archived: false
  }),

  budgetAlert: (category: string, spent: number, budget: number, percentage: number): NotificationInput => ({
    title: '⚠️ Mendekati Budget Limit',
    message: `${category}: Rp ${spent.toLocaleString()} dari Rp ${budget.toLocaleString()} (${percentage}%)`,
    type: 'warning',
    icon: 'alert-triangle',
    priority: 3,
    related_type: 'system',
    action_url: '/financial',
    is_read: false,
    is_archived: false
  }),

  budgetExceeded: (category: string, spent: number, budget: number): NotificationInput => ({
    title: '🚫 Budget Terlampaui!',
    message: `${category}: Rp ${spent.toLocaleString()} melebihi budget Rp ${budget.toLocaleString()}`,
    type: 'error',
    icon: 'alert-circle',
    priority: 4,
    related_type: 'system',
    action_url: '/financial',
    is_read: false,
    is_archived: false
  }),

  // === SUPPLIER NOTIFICATIONS ===

  supplierAdded: (supplierName: string): NotificationInput => ({
    title: '🏪 Supplier Baru Ditambahkan',
    message: `${supplierName} berhasil ditambahkan ke daftar supplier`,
    type: 'success',
    icon: 'user-plus',
    priority: 2,
    related_type: 'system',
    action_url: '/suppliers',
    is_read: false,
    is_archived: false
  }),

  supplierUpdated: (supplierName: string): NotificationInput => ({
    title: '📝 Info Supplier Diperbarui',
    message: `Informasi ${supplierName} berhasil diperbarui`,
    type: 'info',
    icon: 'edit',
    priority: 1,
    related_type: 'system',
    action_url: '/suppliers',
    is_read: false,
    is_archived: false
  }),

  supplierDeleted: (supplierName: string): NotificationInput => ({
    title: '🗑️ Supplier Dihapus',
    message: `${supplierName} telah dihapus dari daftar supplier`,
    type: 'warning',
    icon: 'trash-2',
    priority: 2,
    related_type: 'system',
    action_url: '/suppliers',
    is_read: false,
    is_archived: false
  }),

  // === CUSTOM NOTIFICATIONS ===

  custom: (
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    priority: 1 | 2 | 3 | 4 = 2,
    icon: string = 'bell',
    actionUrl?: string,
    relatedType?: 'order' | 'purchase' | 'inventory' | 'system',
    relatedId?: string
  ): NotificationInput => ({
    title,
    message,
    type,
    icon,
    priority,
    related_type: relatedType,
    related_id: relatedId,
    action_url: actionUrl,
    is_read: false,
    is_archived: false
  }),

  // === WELCOME & ONBOARDING ===

  welcome: (userName?: string): NotificationInput => ({
    title: '🎉 Selamat Datang!',
    message: `${userName ? `Halo ${userName}! ` : ''}Sistem notifikasi Anda sudah aktif dan siap digunakan.`,
    type: 'success',
    icon: 'welcome',
    priority: 2,
    related_type: 'system',
    is_read: false,
    is_archived: false
  })
};

// Utility functions untuk notification management
export const notificationUtils = {
  /**
   * Get notification color based on type and priority
   */
  getNotificationColor: (type: string, priority: number): string => {
    if (priority >= 4) return 'text-red-600 bg-red-50 border-red-200';
    if (priority >= 3) return 'text-orange-600 bg-orange-50 border-orange-200';
    
    switch (type) {
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'info': 
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  },

  /**
   * Get priority label
   */
  getPriorityLabel: (priority: number): string => {
    switch (priority) {
      case 4: return 'URGENT';
      case 3: return 'PENTING';
      case 2: return 'NORMAL';
      case 1: return 'RENDAH';
      default: return 'NORMAL';
    }
  },

  /**
   * Check if notification is expiring
   */
  isExpiring: (notification: Notification): boolean => {
    if (!notification.expires_at) return false;
    return new Date(notification.expires_at) < new Date();
  },

  /**
   * Get time until expiry in hours
   */
  getHoursUntilExpiry: (notification: Notification): number => {
    if (!notification.expires_at) return Infinity;
    const now = new Date().getTime();
    const expiry = new Date(notification.expires_at).getTime();
    return Math.ceil((expiry - now) / (1000 * 60 * 60));
  }
};