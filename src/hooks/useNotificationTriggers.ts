// hooks/useNotificationTriggers.js
import { useEffect } from 'react';
// 🔧 FIXED: Separate imports
import { useNotification } from '@/contexts/NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
import { useOrder } from '@/components/orders/context/OrderContext';
import { useBahanBaku } from '@/components/warehouse/context/BahanBakuContext';
import { usePurchase } from '@/components/purchase/context/PurchaseContext';

/**
 * Hook to automatically create notifications based on system events
 */
export const useNotificationTriggers = () => {
  const { addNotification } = useNotification();
  const { orders } = useOrder();
  const { bahanBaku } = useBahanBaku();
  const { purchases } = usePurchase();

  // Monitor order changes
  useEffect(() => {
    // This would typically be triggered by order context events
    // For now, we'll set up listeners for common scenarios
  }, [orders, addNotification]);

  // Monitor inventory changes
  useEffect(() => {
    if (!bahanBaku || !Array.isArray(bahanBaku)) return;

    // Check for low stock items
    bahanBaku.forEach(item => {
      if (item.stok <= item.minimum) {
        // Only create notification if it doesn't already exist for this item
        const notificationData = createNotificationHelper.lowStock(
          item.nama,
          item.stok,
          item.minimum
        );
        
        // We might want to debounce this or check if notification already exists
        addNotification(notificationData);
      }
    });
  }, [bahanBaku, addNotification]);

  // Return functions to manually trigger notifications
  return {
    triggerOrderCreated: (orderId: string, orderNumber: string, customerName: string) => {
      const notificationData = createNotificationHelper.orderCreated(orderId, orderNumber, customerName);
      return addNotification(notificationData);
    },

    triggerOrderStatusChanged: (orderId: string, orderNumber: string, newStatus: string) => {
      const notificationData = createNotificationHelper.orderStatusChanged(orderId, orderNumber, '', newStatus);
      return addNotification(notificationData);
    },

    triggerLowStock: (itemName: string, currentStock: number, minStock: number) => {
      const notificationData = createNotificationHelper.lowStock(itemName, currentStock, minStock);
      return addNotification(notificationData);
    },

    triggerSystemError: (errorMessage: string) => {
      const notificationData = createNotificationHelper.systemError(errorMessage);
      return addNotification(notificationData);
    },

    triggerCustomNotification: (title: string, message: string, type = 'info', priority = 2) => {
      return addNotification({
        title,
        message,
        type: type as any,
        icon: 'bell',
        priority: priority as any,
        is_read: false,
        is_archived: false
      });
    }
  };
};

// Hook for creating notification templates
export const useNotificationTemplates = () => {
  const { addNotification } = useNotification();

  const templates = {
    // Order templates
    newOrder: (customerName: string, orderNumber: string) => ({
      title: '🛍️ Pesanan Baru!',
      message: `${customerName} baru saja membuat pesanan #${orderNumber}`,
      type: 'success' as const,
      icon: 'shopping-cart',
      priority: 2 as const,
      related_type: 'order' as const,
      is_read: false,
      is_archived: false
    }),

    orderConfirmed: (orderNumber: string) => ({
      title: '✅ Pesanan Dikonfirmasi',
      message: `Pesanan #${orderNumber} telah dikonfirmasi dan siap diproses`,
      type: 'success' as const,
      icon: 'check-circle',
      priority: 2 as const,
      related_type: 'order' as const,
      is_read: false,
      is_archived: false
    }),

    orderShipped: (orderNumber: string, customerName: string) => ({
      title: '🚚 Pesanan Dikirim',
      message: `Pesanan #${orderNumber} untuk ${customerName} sedang dalam perjalanan`,
      type: 'info' as const,
      icon: 'package',
      priority: 2 as const,
      related_type: 'order' as const,
      is_read: false,
      is_archived: false
    }),

    orderDelivered: (orderNumber: string) => ({
      title: '🎉 Pesanan Sampai',
      message: `Pesanan #${orderNumber} telah berhasil diterima pelanggan`,
      type: 'success' as const,
      icon: 'check-circle',
      priority: 1 as const,
      related_type: 'order' as const,
      is_read: false,
      is_archived: false
    }),

    // Inventory templates
    stockAlert: (itemName: string, currentStock: number) => ({
      title: '⚠️ Stok Menipis',
      message: `${itemName} tersisa ${currentStock} unit. Segera lakukan pembelian!`,
      type: 'warning' as const,
      icon: 'alert-triangle',
      priority: 3 as const,
      related_type: 'inventory' as const,
      action_url: '/gudang',
      is_read: false,
      is_archived: false
    }),

    stockOut: (itemName: string) => ({
      title: '🚫 Stok Habis',
      message: `${itemName} sudah habis! Segera lakukan pembelian bahan baku.`,
      type: 'error' as const,
      icon: 'alert-circle',
      priority: 4 as const,
      related_type: 'inventory' as const,
      action_url: '/gudang',
      is_read: false,
      is_archived: false
    }),

    expiringStock: (itemName: string, daysLeft: number) => ({
      title: '⏰ Bahan Akan Expired',
      message: `${itemName} akan expired dalam ${daysLeft} hari`,
      type: 'warning' as const,
      icon: 'calendar',
      priority: 3 as const,
      related_type: 'inventory' as const,
      is_read: false,
      is_archived: false
    }),

    // Purchase templates
    purchaseReceived: (supplierName: string, totalItems: number) => ({
      title: '📦 Pembelian Diterima',
      message: `Pembelian dari ${supplierName} (${totalItems} item) telah diterima`,
      type: 'success' as const,
      icon: 'package',
      priority: 2 as const,
      related_type: 'purchase' as const,
      action_url: '/pembelian',
      is_read: false,
      is_archived: false
    }),

    // System templates
    backupSuccess: () => ({
      title: '✅ Backup Berhasil',
      message: 'Data aplikasi berhasil di-backup ke cloud',
      type: 'success' as const,
      icon: 'check-circle',
      priority: 1 as const,
      related_type: 'system' as const,
      is_read: false,
      is_archived: false
    }),

    backupFailed: (reason: string) => ({
      title: '❌ Backup Gagal',
      message: `Backup gagal: ${reason}. Silakan coba lagi.`,
      type: 'error' as const,
      icon: 'alert-circle',
      priority: 3 as const,
      related_type: 'system' as const,
      is_read: false,
      is_archived: false
    }),

    maintenanceMode: (duration: string) => ({
      title: '🔧 Mode Maintenance',
      message: `Sistem akan maintenance selama ${duration}. Harap simpan pekerjaan Anda.`,
      type: 'warning' as const,
      icon: 'alert-triangle',
      priority: 4 as const,
      related_type: 'system' as const,
      expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
      is_read: false,
      is_archived: false
    }),

    // Business templates
    dailySummary: (orders: number, revenue: number) => ({
      title: '📊 Ringkasan Harian',
      message: `Hari ini: ${orders} pesanan dengan total revenue Rp ${revenue.toLocaleString()}`,
      type: 'info' as const,
      icon: 'calendar',
      priority: 1 as const,
      related_type: 'system' as const,
      action_url: '/',
      is_read: false,
      is_archived: false
    }),

    monthlyReport: (month: string) => ({
      title: '📈 Laporan Bulanan Siap',
      message: `Laporan bulan ${month} telah selesai dibuat dan siap untuk ditinjau`,
      type: 'info' as const,
      icon: 'calendar',
      priority: 2 as const,
      related_type: 'system' as const,
      action_url: '/laporan',
      is_read: false,
      is_archived: false
    })
  };

  const createFromTemplate = async (templateName: keyof typeof templates, ...args: any[]) => {
    const template = templates[templateName];
    if (!template) {
      console.error(`Template '${templateName}' not found`);
      return false;
    }

    const notificationData = template(...args);
    return addNotification(notificationData);
  };

  return {
    templates,
    createFromTemplate,
    addNotification
  };
};

// Hook for notification statistics
export const useNotificationStats = () => {
  const { notifications, unreadCount, urgentCount } = useNotification();

  const stats = {
    total: notifications.length,
    unread: unreadCount,
    urgent: urgentCount,
    read: notifications.length - unreadCount,
    byType: {
      info: notifications.filter(n => n.type === 'info').length,
      success: notifications.filter(n => n.type === 'success').length,
      warning: notifications.filter(n => n.type === 'warning').length,
      error: notifications.filter(n => n.type === 'error').length
    },
    byPriority: {
      low: notifications.filter(n => n.priority === 1).length,
      normal: notifications.filter(n => n.priority === 2).length,
      high: notifications.filter(n => n.priority === 3).length,
      urgent: notifications.filter(n => n.priority === 4).length
    },
    recent: notifications.filter(n => {
      const notificationTime = new Date(n.created_at).getTime();
      const hourAgo = Date.now() - (60 * 60 * 1000);
      return notificationTime > hourAgo;
    }).length
  };

  return stats;
};

export default useNotificationTriggers;