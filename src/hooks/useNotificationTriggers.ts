// hooks/useNotificationTriggers.ts - PRODUCTION READY
import { useEffect, useCallback, useRef } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';

// Safe context imports with fallbacks
let useOrderContext: any;
let useBahanBakuContext: any;
let usePurchaseContext: any;

try {
  const orderModule = require('@/components/orders/context/OrderContext');
  useOrderContext = orderModule.useOrder || (() => ({ orders: [] }));
} catch {
  useOrderContext = () => ({ orders: [] });
}

try {
  const warehouseModule = require('@/components/warehouse/context/WarehouseContext');
  useBahanBakuContext = warehouseModule.useBahanBaku || (() => ({ bahanBaku: [] }));
} catch {
  useBahanBakuContext = () => ({ bahanBaku: [] });
}

try {
  const purchaseModule = require('@/components/purchase/context/PurchaseContext');
  usePurchaseContext = purchaseModule.usePurchase || (() => ({ purchases: [] }));
} catch {
  usePurchaseContext = () => ({ purchases: [] });
}

/**
 * Hook to automatically create notifications based on system events
 * Enhanced with proper error handling and deduplication
 */
export const useNotificationTriggers = () => {
  const { addNotification } = useNotification();
  const lastCheckRef = useRef<Record<string, number>>({});
  const processedItemsRef = useRef<Set<string>>(new Set());

  // Safe context usage with error handling
  let orders: any[] = [];
  let bahanBaku: any[] = [];
  let purchases: any[] = [];

  try {
    const orderData = useOrderContext();
    orders = Array.isArray(orderData?.orders) ? orderData.orders : [];
  } catch (error) {
    console.warn('Orders context not available');
  }

  try {
    const warehouseData = useBahanBakuContext();
    bahanBaku = Array.isArray(warehouseData?.bahanBaku) ? warehouseData.bahanBaku : [];
  } catch (error) {
    console.warn('Warehouse context not available');
  }

  try {
    const purchaseData = usePurchaseContext();
    purchases = Array.isArray(purchaseData?.purchases) ? purchaseData.purchases : [];
  } catch (error) {
    console.warn('Purchase context not available');
  }

  // Enhanced inventory monitoring with throttling
  useEffect(() => {
    if (!bahanBaku.length) return;

    const now = Date.now();
    const lastInventoryCheck = lastCheckRef.current.inventory || 0;

    // Throttle inventory checks to every 30 seconds
    if (now - lastInventoryCheck < 30000) return;

    lastCheckRef.current.inventory = now;

    // Process each item safely
    bahanBaku.forEach((item) => {
      if (!item || typeof item !== 'object') return;

      const itemId = item.id || item.nama || 'unknown';
      const itemKey = `inventory_${itemId}`;

      // Skip if already processed recently
      if (processedItemsRef.current.has(itemKey)) return;

      try {
        const stok = Number(item.stok) || 0;
        const minimum = Number(item.minimum) || 0;
        const nama = String(item.nama || 'Item Tidak Dikenal');

        // Check for low stock
        if (stok <= minimum && stok > 0) {
          addNotification(createNotificationHelper.lowStock(nama, stok, minimum))
            .then(() => {
              processedItemsRef.current.add(itemKey);
              // Remove from processed after 5 minutes
              setTimeout(() => {
                processedItemsRef.current.delete(itemKey);
              }, 300000);
            })
            .catch(error => {
              console.warn('Failed to create low stock notification:', error);
            });
        }

        // Check for out of stock
        if (stok === 0) {
          addNotification(createNotificationHelper.outOfStock(nama))
            .then(() => {
              processedItemsRef.current.add(`${itemKey}_out`);
              setTimeout(() => {
                processedItemsRef.current.delete(`${itemKey}_out`);
              }, 300000);
            })
            .catch(error => {
              console.warn('Failed to create out of stock notification:', error);
            });
        }

        // Check for expiring items
        if (item.expiry) {
          try {
            const expiryDate = new Date(item.expiry);
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
              addNotification(createNotificationHelper.expiringSoon(nama, daysUntilExpiry))
                .catch(error => {
                  console.warn('Failed to create expiring notification:', error);
                });
            }
          } catch (dateError) {
            // Invalid date format, skip
          }
        }
      } catch (itemError) {
        console.warn('Error processing inventory item:', itemError);
      }
    });
  }, [bahanBaku, addNotification]);

  // Cleanup processed items periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      processedItemsRef.current.clear();
    }, 600000); // Every 10 minutes

    return () => clearInterval(cleanup);
  }, []);

  // Manual trigger functions with error handling
  const triggerOrderCreated = useCallback(async (orderId: string, orderNumber: string, customerName: string) => {
    try {
      if (!orderId || !orderNumber) {
        throw new Error('Missing required order information');
      }
      
      const notificationData = createNotificationHelper.orderCreated(
        orderId, 
        orderNumber, 
        customerName || 'Pelanggan'
      );
      return await addNotification(notificationData);
    } catch (error) {
      console.error('Failed to trigger order created notification:', error);
      return false;
    }
  }, [addNotification]);

  const triggerOrderStatusChanged = useCallback(async (orderId: string, orderNumber: string, oldStatus: string, newStatus: string) => {
    try {
      if (!orderId || !orderNumber) {
        throw new Error('Missing required order information');
      }
      
      const notificationData = createNotificationHelper.orderStatusChanged(
        orderId, 
        orderNumber, 
        oldStatus || '', 
        newStatus || ''
      );
      return await addNotification(notificationData);
    } catch (error) {
      console.error('Failed to trigger order status notification:', error);
      return false;
    }
  }, [addNotification]);

  const triggerLowStock = useCallback(async (itemName: string, currentStock: number, minStock: number) => {
    try {
      if (!itemName) {
        throw new Error('Item name is required');
      }
      
      const notificationData = createNotificationHelper.lowStock(
        itemName, 
        Number(currentStock) || 0, 
        Number(minStock) || 0
      );
      return await addNotification(notificationData);
    } catch (error) {
      console.error('Failed to trigger low stock notification:', error);
      return false;
    }
  }, [addNotification]);

  const triggerSystemError = useCallback(async (errorMessage: string) => {
    try {
      if (!errorMessage) {
        throw new Error('Error message is required');
      }
      
      const notificationData = createNotificationHelper.systemError(errorMessage);
      return await addNotification(notificationData);
    } catch (error) {
      console.error('Failed to trigger system error notification:', error);
      return false;
    }
  }, [addNotification]);

  const triggerCustomNotification = useCallback(async (
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info', 
    priority: 1 | 2 | 3 | 4 = 2
  ) => {
    try {
      if (!title || !message) {
        throw new Error('Title and message are required');
      }

      const notificationData = createNotificationHelper.custom(
        title,
        message,
        type,
        priority
      );
      return await addNotification(notificationData);
    } catch (error) {
      console.error('Failed to trigger custom notification:', error);
      return false;
    }
  }, [addNotification]);

  // Purchase notification triggers
  const triggerPurchaseCreated = useCallback(async (purchaseId: string, supplierName: string, totalValue: number, itemCount: number) => {
    try {
      if (!purchaseId || !supplierName) {
        throw new Error('Missing required purchase information');
      }
      
      const notificationData = createNotificationHelper.purchaseCreated(
        purchaseId,
        supplierName,
        Number(totalValue) || 0,
        Number(itemCount) || 0
      );
      return await addNotification(notificationData);
    } catch (error) {
      console.error('Failed to trigger purchase created notification:', error);
      return false;
    }
  }, [addNotification]);

  const triggerPurchaseCompleted = useCallback(async (purchaseId: string, supplierName: string, totalValue: number) => {
    try {
      if (!purchaseId || !supplierName) {
        throw new Error('Missing required purchase information');
      }
      
      const notificationData = createNotificationHelper.purchaseCompleted(
        purchaseId,
        supplierName,
        Number(totalValue) || 0
      );
      return await addNotification(notificationData);
    } catch (error) {
      console.error('Failed to trigger purchase completed notification:', error);
      return false;
    }
  }, [addNotification]);

  return {
    // Manual triggers
    triggerOrderCreated,
    triggerOrderStatusChanged,
    triggerLowStock,
    triggerSystemError,
    triggerCustomNotification,
    triggerPurchaseCreated,
    triggerPurchaseCompleted,
    
    // Stats
    stats: {
      ordersCount: orders.length,
      inventoryCount: bahanBaku.length,
      purchasesCount: purchases.length,
      lowStockCount: bahanBaku.filter(item => {
        try {
          return Number(item?.stok) <= Number(item?.minimum);
        } catch {
          return false;
        }
      }).length
    }
  };
};

// Simplified notification templates hook
export const useNotificationTemplates = () => {
  const { addNotification } = useNotification();

  const createFromTemplate = useCallback(async (templateName: string, ...args: any[]) => {
    try {
      let notificationData;

      switch (templateName) {
        case 'welcome':
          notificationData = createNotificationHelper.welcome(args[0]);
          break;
        case 'dailySummary':
          notificationData = createNotificationHelper.dailySummary(args[0] || 0, args[1] || 0);
          break;
        case 'backupSuccess':
          notificationData = createNotificationHelper.backupSuccess();
          break;
        case 'backupFailed':
          notificationData = createNotificationHelper.backupFailed(args[0] || 'Unknown error');
          break;
        default:
          throw new Error(`Template '${templateName}' not found`);
      }

      return await addNotification(notificationData);
    } catch (error) {
      console.error(`Failed to create notification from template '${templateName}':`, error);
      return false;
    }
  }, [addNotification]);

  return {
    createFromTemplate,
    addNotification
  };
};

// Simple notification statistics
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
      try {
        const notificationTime = new Date(n.created_at).getTime();
        const hourAgo = Date.now() - (60 * 60 * 1000);
        return notificationTime > hourAgo;
      } catch {
        return false;
      }
    }).length
  };

  return stats;
};

export default useNotificationTriggers;