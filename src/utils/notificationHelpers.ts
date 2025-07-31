// utils/notificationHelpers.ts - PRODUCTION READY VERSION
import { Notification } from '@/contexts/NotificationContext';

type NotificationInput = Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

/**
 * Helper functions to create standardized notification templates
 * Enhanced with proper error handling and validation
 */
export const createNotificationHelper = {
  // === ORDER NOTIFICATIONS ===
  
  orderCreated: (orderId: string, orderNumber: string, customerName: string): NotificationInput => {
    const safeOrderNumber = String(orderNumber || 'N/A');
    const safeCustomerName = String(customerName || 'Pelanggan');
    
    return {
      title: '🛍️ Pesanan Baru Dibuat!',
      message: `Pesanan #${safeOrderNumber} dari ${safeCustomerName} berhasil dibuat`,
      type: 'success',
      icon: 'shopping-cart',
      priority: 2,
      related_id: String(orderId || ''),
      related_type: 'order',
      action_url: '/orders',
      is_read: false,
      is_archived: false
    };
  },

  orderStatusChanged: (orderId: string, orderNumber: string, oldStatus: string, newStatus: string): NotificationInput => {
    const safeOrderNumber = String(orderNumber || 'N/A');
    const safeOldStatus = String(oldStatus || 'Unknown');
    const safeNewStatus = String(newStatus || 'Unknown');
    
    return {
      title: '📝 Status Pesanan Diubah',
      message: `Pesanan #${safeOrderNumber} dari "${safeOldStatus}" menjadi "${safeNewStatus}"`,
      type: 'info',
      icon: 'refresh-cw',
      priority: 2,
      related_id: String(orderId || ''),
      related_type: 'order',
      action_url: '/orders',
      is_read: false,
      is_archived: false
    };
  },

  orderCompleted: (orderId: string, orderNumber: string, revenue: number): NotificationInput => {
    const safeOrderNumber = String(orderNumber || 'N/A');
    const safeRevenue = Number(revenue) || 0;
    
    return {
      title: '🎉 Pesanan Selesai!',
      message: `Pesanan #${safeOrderNumber} telah selesai. Revenue Rp ${safeRevenue.toLocaleString('id-ID')} tercatat`,
      type: 'success',
      icon: 'check-circle',
      priority: 2,
      related_id: String(orderId || ''),
      related_type: 'order',
      action_url: '/orders',
      is_read: false,
      is_archived: false
    };
  },

  orderDeleted: (orderNumber: string, customerName: string): NotificationInput => {
    const safeOrderNumber = String(orderNumber || 'N/A');
    const safeCustomerName = String(customerName || 'Pelanggan');
    
    return {
      title: '🗑️ Pesanan Dihapus',
      message: `Pesanan #${safeOrderNumber} dari ${safeCustomerName} telah dihapus`,
      type: 'warning',
      icon: 'trash-2',
      priority: 2,
      related_type: 'order',
      action_url: '/orders',
      is_read: false,
      is_archived: false
    };
  },

  // === PURCHASE NOTIFICATIONS ===

  purchaseCreated: (purchaseId: string, supplierName: string, totalValue: number, itemCount: number): NotificationInput => {
    const safeSupplierName = String(supplierName || 'Supplier');
    const safeTotalValue = Number(totalValue) || 0;
    const safeItemCount = Number(itemCount) || 0;
    
    return {
      title: '📦 Pembelian Baru Dibuat!',
      message: `Pembelian dari ${safeSupplierName} senilai Rp ${safeTotalValue.toLocaleString('id-ID')} dengan ${safeItemCount} item berhasil dibuat`,
      type: 'success',
      icon: 'package',
      priority: 2,
      related_id: String(purchaseId || ''),
      related_type: 'purchase',
      action_url: '/purchases',
      is_read: false,
      is_archived: false
    };
  },

  purchaseCompleted: (purchaseId: string, supplierName: string, totalValue: number): NotificationInput => {
    const safeSupplierName = String(supplierName || 'Supplier');
    const safeTotalValue = Number(totalValue) || 0;
    
    return {
      title: '✅ Pembelian Selesai!',
      message: `Pembelian dari ${safeSupplierName} senilai Rp ${safeTotalValue.toLocaleString('id-ID')} telah selesai dan stok warehouse diperbarui`,
      type: 'success',
      icon: 'check-circle',
      priority: 2,
      related_id: String(purchaseId || ''),
      related_type: 'purchase',
      action_url: '/purchases',
      is_read: false,
      is_archived: false
    };
  },

  purchaseStatusChanged: (purchaseId: string, supplierName: string, oldStatus: string, newStatus: string): NotificationInput => {
    const safeSupplierName = String(supplierName || 'Supplier');
    const safeOldStatus = String(oldStatus || 'Unknown');
    const safeNewStatus = String(newStatus || 'Unknown');
    
    return {
      title: '📝 Status Pembelian Diubah',
      message: `Pembelian dari ${safeSupplierName} diubah dari "${safeOldStatus}" menjadi "${safeNewStatus}"`,
      type: 'info',
      icon: 'refresh-cw',
      priority: 2,
      related_id: String(purchaseId || ''),
      related_type: 'purchase',
      action_url: '/purchases',
      is_read: false,
      is_archived: false
    };
  },

  purchaseDeleted: (supplierName: string, totalValue: number): NotificationInput => {
    const safeSupplierName = String(supplierName || 'Supplier');
    const safeTotalValue = Number(totalValue) || 0;
    
    return {
      title: '🗑️ Pembelian Dihapus',
      message: `Pembelian dari ${safeSupplierName} senilai Rp ${safeTotalValue.toLocaleString('id-ID')} telah dihapus`,
      type: 'warning',
      icon: 'trash-2',
      priority: 2,
      related_type: 'purchase',
      action_url: '/purchases',
      is_read: false,
      is_archived: false
    };
  },

  // === INVENTORY NOTIFICATIONS ===

  lowStock: (itemName: string, currentStock: number, minStock: number): NotificationInput => {
    const safeItemName = String(itemName || 'Item Tidak Dikenal');
    const safeCurrentStock = Number(currentStock) || 0;
    const safeMinStock = Number(minStock) || 0;
    
    return {
      title: '⚠️ Stok Menipis!',
      message: `${safeItemName} tersisa ${safeCurrentStock} dari minimum ${safeMinStock}. Pertimbangkan untuk melakukan pembelian.`,
      type: 'warning',
      icon: 'alert-triangle',
      priority: 3,
      related_type: 'inventory',
      action_url: '/warehouse',
      is_read: false,
      is_archived: false
    };
  },

  outOfStock: (itemName: string): NotificationInput => {
    const safeItemName = String(itemName || 'Item Tidak Dikenal');
    
    return {
      title: '🚫 Stok Habis!',
      message: `${safeItemName} sudah habis. Segera lakukan pembelian untuk menghindari gangguan produksi.`,
      type: 'error',
      icon: 'alert-circle',
      priority: 4,
      related_type: 'inventory',
      action_url: '/warehouse',
      is_read: false,
      is_archived: false
    };
  },

  stockIncreased: (itemName: string, increase: number, unit: string, totalStock: number): NotificationInput => {
    const safeItemName = String(itemName || 'Item');
    const safeIncrease = Number(increase) || 0;
    const safeUnit = String(unit || 'unit');
    const safeTotalStock = Number(totalStock) || 0;
    
    return {
      title: '📈 Stok Ditambahkan',
      message: `${safeItemName} bertambah ${safeIncrease} ${safeUnit}. Total stok sekarang ${safeTotalStock} ${safeUnit}`,
      type: 'success',
      icon: 'trending-up',
      priority: 1,
      related_type: 'inventory',
      action_url: '/warehouse',
      is_read: false,
      is_archived: false
    };
  },

  stockDecreased: (itemName: string, decrease: number, unit: string, remainingStock: number): NotificationInput => {
    const safeItemName = String(itemName || 'Item');
    const safeDecrease = Number(decrease) || 0;
    const safeUnit = String(unit || 'unit');
    const safeRemainingStock = Number(remainingStock) || 0;
    
    return {
      title: '📉 Stok Berkurang',
      message: `${safeItemName} berkurang ${safeDecrease} ${safeUnit}. Sisa stok ${safeRemainingStock} ${safeUnit}`,
      type: 'info',
      icon: 'trending-down',
      priority: 1,
      related_type: 'inventory',
      action_url: '/warehouse',
      is_read: false,
      is_archived: false
    };
  },

  itemAdded: (itemName: string, initialStock: number, unit: string, totalValue: number): NotificationInput => {
    const safeItemName = String(itemName || 'Item Baru');
    const safeInitialStock = Number(initialStock) || 0;
    const safeUnit = String(unit || 'unit');
    const safeTotalValue = Number(totalValue) || 0;
    
    return {
      title: '📦 Item Baru Ditambahkan!',
      message: `${safeItemName} berhasil ditambahkan dengan stok ${safeInitialStock} ${safeUnit} dan nilai Rp ${safeTotalValue.toLocaleString('id-ID')}`,
      type: 'success',
      icon: 'package',
      priority: 2,
      related_type: 'inventory',
      action_url: '/warehouse',
      is_read: false,
      is_archived: false
    };
  },

  expiringSoon: (itemName: string, daysLeft: number): NotificationInput => {
    const safeItemName = String(itemName || 'Item');
    const safeDaysLeft = Number(daysLeft) || 0;
    
    return {
      title: '⏰ Akan Expired',
      message: `${safeItemName} akan expired dalam ${safeDaysLeft} hari. Pertimbangkan untuk menggunakannya terlebih dahulu.`,
      type: 'warning',
      icon: 'calendar',
      priority: 3,
      related_type: 'inventory',
      action_url: '/warehouse',
      is_read: false,
      is_archived: false
    };
  },

  // === SYSTEM NOTIFICATIONS ===

  systemError: (errorMessage: string): NotificationInput => {
    const safeErrorMessage = String(errorMessage || 'Terjadi kesalahan yang tidak diketahui');
    
    return {
      title: '❌ Terjadi Kesalahan Sistem',
      message: safeErrorMessage.length > 100 ? safeErrorMessage.substring(0, 100) + '...' : safeErrorMessage,
      type: 'error',
      icon: 'alert-circle',
      priority: 4,
      related_type: 'system',
      is_read: false,
      is_archived: false,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    };
  },

  backupSuccess: (): NotificationInput => ({
    title: '✅ Backup Berhasil',
    message: 'Data aplikasi berhasil di-backup ke cloud storage',
    type: 'success',
    icon: 'check-circle',
    priority: 1,
    related_type: 'system',
    is_read: false,
    is_archived: false
  }),

  backupFailed: (reason: string): NotificationInput => {
    const safeReason = String(reason || 'Alasan tidak diketahui');
    
    return {
      title: '❌ Backup Gagal',
      message: `Backup gagal: ${safeReason}. Silakan coba lagi nanti.`,
      type: 'error',
      icon: 'alert-circle',
      priority: 3,
      related_type: 'system',
      is_read: false,
      is_archived: false
    };
  },

  dailySummary: (ordersCount: number, revenue: number): NotificationInput => {
    const safeOrdersCount = Number(ordersCount) || 0;
    const safeRevenue = Number(revenue) || 0;
    
    return {
      title: '📊 Ringkasan Harian',
      message: `Hari ini: ${safeOrdersCount} pesanan dengan total revenue Rp ${safeRevenue.toLocaleString('id-ID')}`,
      type: 'info',
      icon: 'calendar',
      priority: 1,
      related_type: 'system',
      action_url: '/dashboard',
      is_read: false,
      is_archived: false
    };
  },

  weeklySummary: (ordersCount: number, newCustomers: number): NotificationInput => {
    const safeOrdersCount = Number(ordersCount) || 0;
    const safeNewCustomers = Number(newCustomers) || 0;
    
    return {
      title: '📈 Ringkasan Mingguan',
      message: `Minggu ini: ${safeOrdersCount} pesanan, ${safeNewCustomers} pelanggan baru`,
      type: 'info',
      icon: 'calendar',
      priority: 1,
      related_type: 'system',
      action_url: '/reports',
      is_read: false,
      is_archived: false
    };
  },

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
  ): NotificationInput => {
    const safeTitle = String(title || 'Notifikasi');
    const safeMessage = String(message || 'Tidak ada pesan');
    const safeIcon = String(icon || 'bell');
    
    return {
      title: safeTitle.length > 50 ? safeTitle.substring(0, 50) + '...' : safeTitle,
      message: safeMessage.length > 200 ? safeMessage.substring(0, 200) + '...' : safeMessage,
      type,
      icon: safeIcon,
      priority,
      related_type: relatedType,
      related_id: relatedId ? String(relatedId) : undefined,
      action_url: actionUrl,
      is_read: false,
      is_archived: false
    };
  },

  // === WELCOME & ONBOARDING ===

  welcome: (userName?: string): NotificationInput => {
    const safeUserName = userName ? String(userName) : null;
    
    return {
      title: '🎉 Selamat Datang!',
      message: `${safeUserName ? `Halo ${safeUserName}! ` : ''}Sistem notifikasi Anda sudah aktif dan siap digunakan.`,
      type: 'success',
      icon: 'welcome',
      priority: 2,
      related_type: 'system',
      is_read: false,
      is_archived: false
    };
  }
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
    try {
      if (!notification.expires_at) return false;
      return new Date(notification.expires_at) < new Date();
    } catch {
      return false;
    }
  },

  /**
   * Get time until expiry in hours
   */
  getHoursUntilExpiry: (notification: Notification): number => {
    try {
      if (!notification.expires_at) return Infinity;
      const now = new Date().getTime();
      const expiry = new Date(notification.expires_at).getTime();
      return Math.ceil((expiry - now) / (1000 * 60 * 60));
    } catch {
      return Infinity;
    }
  },

  /**
   * Validate notification data
   */
  validateNotification: (notification: Partial<NotificationInput>): boolean => {
    if (!notification.title || typeof notification.title !== 'string') return false;
    if (!notification.message || typeof notification.message !== 'string') return false;
    if (!['info', 'success', 'warning', 'error'].includes(notification.type || '')) return false;
    if (!notification.priority || ![1, 2, 3, 4].includes(notification.priority)) return false;
    return true;
  }
};