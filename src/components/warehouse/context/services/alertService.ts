// src/components/warehouse/context/services/alertService.ts
import { BahanBaku } from '../../types/warehouse';
import { formatCurrency } from '../../utils/formatters';
import { logger } from '@/utils/logger';

interface AlertServiceDeps {
  addNotification: (notification: any) => Promise<void>;
  shouldSendNotification: (key: string) => boolean;
  getLowStockItems: (items: BahanBaku[]) => BahanBaku[];
  getOutOfStockItems: (items: BahanBaku[]) => BahanBaku[];
  getExpiringItems: (days: number, items: BahanBaku[]) => BahanBaku[];
  getDaysUntilExpiry: (date: Date | null) => number;
}

export class AlertService {
  private deps: AlertServiceDeps;

  constructor(deps: AlertServiceDeps) {
    this.deps = deps;
  }

  async processInventoryAlerts(items: BahanBaku[]): Promise<void> {
    if (items.length === 0) return;

    logger.context('AlertService', 'Processing inventory alerts for', items.length, 'items');

    try {
      const lowStockItems = this.deps.getLowStockItems(items);
      const outOfStockItems = this.deps.getOutOfStockItems(items);
      const expiringItems = this.deps.getExpiringItems(7, items);
      const criticalExpiringItems = this.deps.getExpiringItems(3, items);

      logger.context('AlertService', 'Alert counts:', {
        lowStock: lowStockItems.length,
        outOfStock: outOfStockItems.length,
        expiring: expiringItems.length,
        criticalExpiring: criticalExpiringItems.length,
      });

      // Process out of stock alerts
      await this.processOutOfStockAlerts(outOfStockItems);

      // Process low stock alerts
      await this.processLowStockAlerts(lowStockItems);

      // Process expiry alerts
      await this.processExpiryAlerts(criticalExpiringItems);

      // Process summary alert if many issues
      await this.processSummaryAlert(outOfStockItems, lowStockItems, criticalExpiringItems);

    } catch (error) {
      logger.error('AlertService', 'Error processing inventory alerts:', error);
    }
  }

  private async processOutOfStockAlerts(outOfStockItems: BahanBaku[]): Promise<void> {
    const maxAlerts = 3;
    const itemsToAlert = outOfStockItems.slice(0, maxAlerts);

    for (const item of itemsToAlert) {
      const notificationKey = `out-of-stock-${item.id}`;
      
      if (this.deps.shouldSendNotification(notificationKey)) {
        await this.deps.addNotification({
          title: '🚫 Stok Habis!',
          message: `${item.nama} sudah habis. Segera lakukan pembelian untuk menghindari gangguan produksi.`,
          type: 'error',
          icon: 'alert-circle',
          priority: 4,
          related_type: 'inventory',
          action_url: '/gudang',
          is_read: false,
          is_archived: false,
          metadata: {
            itemId: item.id,
            alertType: 'out_of_stock',
            category: item.kategori,
            supplier: item.supplier,
          },
        });
      }
    }
  }

  private async processLowStockAlerts(lowStockItems: BahanBaku[]): Promise<void> {
    const maxAlerts = 3;
    const itemsToAlert = lowStockItems.slice(0, maxAlerts);

    for (const item of itemsToAlert) {
      const notificationKey = `low-stock-${item.id}`;
      
      if (this.deps.shouldSendNotification(notificationKey)) {
        const stockPercentage = Math.round((item.stok / item.minimum) * 100);
        
        await this.deps.addNotification({
          title: '⚠️ Stok Menipis!',
          message: `${item.nama} tersisa ${item.stok} ${item.satuan} (${stockPercentage}% dari minimum). Pertimbangkan untuk melakukan pembelian.`,
          type: 'warning',
          icon: 'alert-triangle',
          priority: 3,
          related_type: 'inventory',
          action_url: '/gudang',
          is_read: false,
          is_archived: false,
          metadata: {
            itemId: item.id,
            alertType: 'low_stock',
            currentStock: item.stok,
            minimumStock: item.minimum,
            stockPercentage,
            category: item.kategori,
          },
        });
      }
    }
  }

  private async processExpiryAlerts(criticalExpiringItems: BahanBaku[]): Promise<void> {
    const maxAlerts = 2;
    const itemsToAlert = criticalExpiringItems.slice(0, maxAlerts);

    for (const item of itemsToAlert) {
      const notificationKey = `expiring-${item.id}`;
      
      if (this.deps.shouldSendNotification(notificationKey)) {
        const daysLeft = this.deps.getDaysUntilExpiry(item.tanggalKadaluwarsa);
        const potentialLoss = item.stok * item.hargaSatuan;
        
        let urgencyText = '';
        if (daysLeft <= 1) {
          urgencyText = daysLeft === 0 ? 'hari ini' : 'besok';
        } else {
          urgencyText = `${daysLeft} hari lagi`;
        }

        await this.deps.addNotification({
          title: '🔥 Segera Expired!',
          message: `${item.nama} akan expired ${urgencyText}! Gunakan segera atau akan mengalami kerugian ${formatCurrency(potentialLoss)}.`,
          type: 'error',
          icon: 'calendar',
          priority: 4,
          related_type: 'inventory',
          action_url: '/gudang',
          is_read: false,
          is_archived: false,
          metadata: {
            itemId: item.id,
            alertType: 'expiring_soon',
            daysLeft,
            potentialLoss,
            expiryDate: item.tanggalKadaluwarsa,
            currentStock: item.stok,
          },
        });
      }
    }
  }

  private async processSummaryAlert(
    outOfStockItems: BahanBaku[],
    lowStockItems: BahanBaku[],
    criticalExpiringItems: BahanBaku[]
  ): Promise<void> {
    const totalIssues = outOfStockItems.length + lowStockItems.length + criticalExpiringItems.length;
    
    if (totalIssues > 5) {
      const summaryKey = `inventory-summary-${totalIssues}`;
      
      if (this.deps.shouldSendNotification(summaryKey)) {
        const parts: string[] = [];
        
        if (outOfStockItems.length > 0) parts.push(`${outOfStockItems.length} habis`);
        if (lowStockItems.length > 0) parts.push(`${lowStockItems.length} menipis`);
        if (criticalExpiringItems.length > 0) parts.push(`${criticalExpiringItems.length} akan expired`);

        await this.deps.addNotification({
          title: '📊 Ringkasan Alert Gudang',
          message: `Total ${totalIssues} masalah inventory: ${parts.join(', ')}. Perlu tindakan segera untuk menjaga kelancaran operasional.`,
          type: 'warning',
          icon: 'alert-triangle',
          priority: 3,
          related_type: 'inventory',
          action_url: '/gudang',
          is_read: false,
          is_archived: false,
          metadata: {
            alertType: 'inventory_summary',
            totalIssues,
            outOfStockCount: outOfStockItems.length,
            lowStockCount: lowStockItems.length,
            expiringCount: criticalExpiringItems.length,
          },
        });
      }
    }
  }

  async processItemSpecificAlert(item: BahanBaku, alertType: 'added' | 'updated' | 'deleted'): Promise<void> {
    try {
      switch (alertType) {
        case 'added':
          await this.processItemAddedAlert(item);
          break;
        case 'updated':
          await this.processItemUpdatedAlert(item);
          break;
        case 'deleted':
          await this.processItemDeletedAlert(item);
          break;
      }
    } catch (error) {
      logger.error('AlertService', `Error processing ${alertType} alert for item:`, error);
    }
  }

  private async processItemAddedAlert(item: BahanBaku): Promise<void> {
    const notificationKey = `item-added-${item.id}`;
    
    if (this.deps.shouldSendNotification(notificationKey)) {
      await this.deps.addNotification({
        title: '📦 Item Baru Ditambahkan!',
        message: `${item.nama} berhasil ditambahkan dengan stok ${item.stok} ${item.satuan}`,
        type: 'success',
        icon: 'package',
        priority: 2,
        related_type: 'inventory',
        action_url: '/gudang',
        is_read: false,
        is_archived: false,
        metadata: {
          itemId: item.id,
          alertType: 'item_added',
          initialStock: item.stok,
          category: item.kategori,
        },
      });
    }
  }

  private async processItemUpdatedAlert(item: BahanBaku): Promise<void> {
    // Only send notifications for significant updates
    const notificationKey = `item-updated-${item.id}`;
    
    if (this.deps.shouldSendNotification(notificationKey)) {
      await this.deps.addNotification({
        title: '✏️ Item Diperbarui',
        message: `${item.nama} telah diperbarui`,
        type: 'info',
        icon: 'edit',
        priority: 1,
        related_type: 'inventory',
        action_url: '/gudang',
        is_read: false,
        is_archived: false,
        metadata: {
          itemId: item.id,
          alertType: 'item_updated',
          currentStock: item.stok,
        },
      });
    }
  }

  private async processItemDeletedAlert(item: BahanBaku): Promise<void> {
    const notificationKey = `item-deleted-${item.id}`;
    
    if (this.deps.shouldSendNotification(notificationKey)) {
      await this.deps.addNotification({
        title: '🗑️ Item Dihapus',
        message: `${item.nama} telah dihapus dari inventory`,
        type: 'warning',
        icon: 'trash-2',
        priority: 2,
        related_type: 'inventory',
        action_url: '/gudang',
        is_read: false,
        is_archived: false,
        metadata: {
          itemId: item.id,
          alertType: 'item_deleted',
          deletedStock: item.stok,
          category: item.kategori,
        },
      });
    }
  }

  async processBulkOperationAlert(
    operationType: 'bulk_delete' | 'bulk_update',
    affectedCount: number,
    details?: any
  ): Promise<void> {
    try {
      const notificationKey = `${operationType}-${Date.now()}`;
      
      if (this.deps.shouldSendNotification(notificationKey)) {
        let title: string;
        let message: string;
        let icon: string;

        switch (operationType) {
          case 'bulk_delete':
            title = '🗑️ Bulk Delete Inventory';
            message = `${affectedCount} item berhasil dihapus dari inventory`;
            icon = 'trash-2';
            break;
          case 'bulk_update':
            title = '✏️ Bulk Update Inventory';
            message = `${affectedCount} item berhasil diperbarui`;
            icon = 'edit';
            break;
        }

        await this.deps.addNotification({
          title,
          message,
          type: 'warning',
          icon,
          priority: 2,
          related_type: 'inventory',
          action_url: '/gudang',
          is_read: false,
          is_archived: false,
          metadata: {
            alertType: operationType,
            affectedCount,
            details,
          },
        });
      }
    } catch (error) {
      logger.error('AlertService', `Error processing ${operationType} alert:`, error);
    }
  }
}