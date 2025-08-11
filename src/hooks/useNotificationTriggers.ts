// src/hooks/useNotificationTriggers.ts
// ✅ CLEAN TRIGGERS - No circular dependencies, simple logic

import { useCallback } from 'react';
import { useNotification } from '@/contexts/NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
import { logger } from '@/utils/logger';

/**
 * Simple hook for triggering notifications
 * No complex context imports or circular dependencies
 */
export const useNotificationTriggers = () => {
  const { addNotification } = useNotification();

  // ===========================================
  // ✅ ORDER TRIGGERS
  // ===========================================

  const triggerOrderCreated = useCallback(async (
    orderId: string, 
    orderNumber: string, 
    customerName: string = 'Pelanggan'
  ): Promise<boolean> => {
    try {
      if (!orderId || !orderNumber) {
        logger.warn('Missing order information for notification');
        return false;
      }
      
      const notificationData = createNotificationHelper.orderCreated(
        orderId, 
        orderNumber, 
        customerName
      );
      return await addNotification(notificationData);
    } catch (error) {
      logger.error('Failed to trigger order created notification:', error);
      return false;
    }
  }, [addNotification]);

  const triggerOrderStatusChanged = useCallback(async (
    orderId: string, 
    orderNumber: string, 
    oldStatus: string, 
    newStatus: string
  ): Promise<boolean> => {
    try {
      if (!orderId || !orderNumber || !newStatus) {
        logger.warn('Missing order status information for notification');
        return false;
      }
      
      const notificationData = createNotificationHelper.orderStatusChanged(
        orderId, 
        orderNumber, 
        oldStatus || 'Unknown', 
        newStatus
      );
      return await addNotification(notificationData);
    } catch (error) {
      logger.error('Failed to trigger order status notification:', error);
      return false;
    }
  }, [addNotification]);

  // ===========================================
  // ✅ INVENTORY TRIGGERS
  // ===========================================

  const triggerLowStock = useCallback(async (
    itemName: string, 
    currentStock: number, 
    minStock: number = 0
  ): Promise<boolean> => {
    try {
      if (!itemName) {
        logger.warn('Missing item name for low stock notification');
        return false;
      }
      
      const notificationData = createNotificationHelper.lowStock(
        itemName, 
        Number(currentStock) || 0, 
        Number(minStock) || 0
      );
      return await addNotification(notificationData);
    } catch (error) {
      logger.error('Failed to trigger low stock notification:', error);
      return false;
    }
  }, [addNotification]);

  const triggerOutOfStock = useCallback(async (itemName: string): Promise<boolean> => {
    try {
      if (!itemName) {
        logger.warn('Missing item name for out of stock notification');
        return false;
      }
      
      const notificationData = createNotificationHelper.outOfStock(itemName);
      return await addNotification(notificationData);
    } catch (error) {
      logger.error('Failed to trigger out of stock notification:', error);
      return false;
    }
  }, [addNotification]);

  const triggerExpiringSoon = useCallback(async (
    itemName: string, 
    daysLeft: number
  ): Promise<boolean> => {
    try {
      if (!itemName || daysLeft < 0) {
        logger.warn('Invalid data for expiring notification');
        return false;
      }
      
      const notificationData = createNotificationHelper.expiringSoon(itemName, daysLeft);
      return await addNotification(notificationData);
    } catch (error) {
      logger.error('Failed to trigger expiring notification:', error);
      return false;
    }
  }, [addNotification]);

  // ===========================================
  // ✅ PURCHASE TRIGGERS
  // ===========================================

  const triggerPurchaseCreated = useCallback(async (
    purchaseId: string, 
    supplierName: string, 
    totalValue: number = 0, 
    itemCount: number = 0
  ): Promise<boolean> => {
    try {
      if (!purchaseId || !supplierName) {
        logger.warn('Missing purchase information for notification');
        return false;
      }
      
      const notificationData = createNotificationHelper.purchaseCreated(
        purchaseId,
        supplierName,
        Number(totalValue) || 0,
        Number(itemCount) || 0
      );
      return await addNotification(notificationData);
    } catch (error) {
      logger.error('Failed to trigger purchase created notification:', error);
      return false;
    }
  }, [addNotification]);

  const triggerPurchaseCompleted = useCallback(async (
    purchaseId: string, 
    supplierName: string, 
    totalValue: number = 0
  ): Promise<boolean> => {
    try {
      if (!purchaseId || !supplierName) {
        logger.warn('Missing purchase information for notification');
        return false;
      }
      
      const notificationData = createNotificationHelper.purchaseCompleted(
        purchaseId,
        supplierName,
        Number(totalValue) || 0
      );
      return await addNotification(notificationData);
    } catch (error) {
      logger.error('Failed to trigger purchase completed notification:', error);
      return false;
    }
  }, [addNotification]);

  // ===========================================
  // ✅ FINANCIAL TRIGGERS
  // ===========================================

  const triggerFinancialTransaction = useCallback(async (
    type: 'income' | 'expense',
    amount: number,
    description: string = 'Transaksi keuangan'
  ): Promise<boolean> => {
    try {
      if (!type || amount <= 0) {
        logger.warn('Invalid financial transaction data for notification');
        return false;
      }
      
      const notificationData = createNotificationHelper.financialTransactionAdded(
        type,
        Number(amount),
        description
      );
      return await addNotification(notificationData);
    } catch (error) {
      logger.error('Failed to trigger financial transaction notification:', error);
      return false;
    }
  }, [addNotification]);

  // ===========================================
  // ✅ SYSTEM TRIGGERS
  // ===========================================

  const triggerSystemError = useCallback(async (errorMessage: string): Promise<boolean> => {
    try {
      if (!errorMessage) {
        logger.warn('Missing error message for system notification');
        return false;
      }
      
      const notificationData = createNotificationHelper.systemError(errorMessage);
      return await addNotification(notificationData);
    } catch (error) {
      logger.error('Failed to trigger system error notification:', error);
      return false;
    }
  }, [addNotification]);

  const triggerBackupSuccess = useCallback(async (): Promise<boolean> => {
    try {
      const notificationData = createNotificationHelper.backupSuccess();
      return await addNotification(notificationData);
    } catch (error) {
      logger.error('Failed to trigger backup success notification:', error);
      return false;
    }
  }, [addNotification]);

  const triggerBackupFailed = useCallback(async (reason: string = 'Unknown error'): Promise<boolean> => {
    try {
      const notificationData = createNotificationHelper.backupFailed(reason);
      return await addNotification(notificationData);
    } catch (error) {
      logger.error('Failed to trigger backup failed notification:', error);
      return false;
    }
  }, [addNotification]);

  // ===========================================
  // ✅ USER TRIGGERS
  // ===========================================

  const triggerWelcome = useCallback(async (userName: string = 'User'): Promise<boolean> => {
    try {
      const notificationData = createNotificationHelper.welcome(userName);
      return await addNotification(notificationData);
    } catch (error) {
      logger.error('Failed to trigger welcome notification:', error);
      return false;
    }
  }, [addNotification]);

  const triggerDailySummary = useCallback(async (
    ordersCount: number = 0, 
    revenue: number = 0
  ): Promise<boolean> => {
    try {
      const notificationData = createNotificationHelper.dailySummary(
        Number(ordersCount) || 0,
        Number(revenue) || 0
      );
      return await addNotification(notificationData);
    } catch (error) {
      logger.error('Failed to trigger daily summary notification:', error);
      return false;
    }
  }, [addNotification]);

  // ===========================================
  // ✅ CUSTOM TRIGGER
  // ===========================================

  const triggerCustomNotification = useCallback(async (
    title: string, 
    message: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info', 
    priority: 1 | 2 | 3 | 4 = 2
  ): Promise<boolean> => {
    try {
      if (!title || !message) {
        logger.warn('Missing title or message for custom notification');
        return false;
      }

      const notificationData = createNotificationHelper.custom(
        title,
        message,
        type,
        priority
      );
      return await addNotification(notificationData);
    } catch (error) {
      logger.error('Failed to trigger custom notification:', error);
      return false;
    }
  }, [addNotification]);

  // ===========================================
  // ✅ RETURN ALL TRIGGERS
  // ===========================================

  return {
    // Order triggers
    triggerOrderCreated,
    triggerOrderStatusChanged,
    
    // Inventory triggers
    triggerLowStock,
    triggerOutOfStock,
    triggerExpiringSoon,
    
    // Purchase triggers
    triggerPurchaseCreated,
    triggerPurchaseCompleted,
    
    // Financial triggers
    triggerFinancialTransaction,
    
    // System triggers
    triggerSystemError,
    triggerBackupSuccess,
    triggerBackupFailed,
    
    // User triggers
    triggerWelcome,
    triggerDailySummary,
    
    // Custom trigger
    triggerCustomNotification
  };
};

// ===========================================
// ✅ SIMPLE NOTIFICATION TEMPLATES HOOK
// ===========================================

export const useNotificationTemplates = () => {
  const { addNotification } = useNotification();

  const createFromTemplate = useCallback(async (
    templateName: string, 
    ...args: any[]
  ): Promise<boolean> => {
    try {
      let notificationData;

      switch (templateName) {
        case 'welcome':
          notificationData = createNotificationHelper.welcome(args[0] || 'User');
          break;
        case 'dailySummary':
          notificationData = createNotificationHelper.dailySummary(
            args[0] || 0, 
            args[1] || 0
          );
          break;
        case 'backupSuccess':
          notificationData = createNotificationHelper.backupSuccess();
          break;
        case 'backupFailed':
          notificationData = createNotificationHelper.backupFailed(
            args[0] || 'Unknown error'
          );
          break;
        case 'systemError':
          notificationData = createNotificationHelper.systemError(
            args[0] || 'System error occurred'
          );
          break;
        default:
          logger.warn(`Unknown template: ${templateName}`);
          return false;
      }

      return await addNotification(notificationData);
    } catch (error) {
      logger.error(`Failed to create notification from template '${templateName}':`, error);
      return false;
    }
  }, [addNotification]);

  return {
    createFromTemplate
  };
};

// ===========================================
// ✅ SIMPLE NOTIFICATION STATS HOOK
// ===========================================

export const useNotificationStats = () => {
  const { notifications, unreadCount, urgentCount } = useNotification();

  // Simple stats calculation
  const stats = {
    total: notifications.length,
    unread: unreadCount,
    urgent: urgentCount,
    read: notifications.length - unreadCount,
    
    // By type
    byType: {
      info: notifications.filter(n => n.type === 'info').length,
      success: notifications.filter(n => n.type === 'success').length,
      warning: notifications.filter(n => n.type === 'warning').length,
      error: notifications.filter(n => n.type === 'error').length
    },
    
    // By priority
    byPriority: {
      low: notifications.filter(n => n.priority === 1).length,
      normal: notifications.filter(n => n.priority === 2).length,
      high: notifications.filter(n => n.priority === 3).length,
      urgent: notifications.filter(n => n.priority === 4).length
    },
    
    // Recent notifications (last hour)
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