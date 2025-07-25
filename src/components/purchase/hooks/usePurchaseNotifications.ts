import { useCallback } from 'react';
import { Purchase } from '@/types/supplier';
import { useNotification } from '@/contexts/NotificationContext';
import { formatCurrency } from '@/utils/formatUtils';
import { getSupplierName, getStatusDisplayText } from '../services/purchaseTransformers';

export interface UsePurchaseNotificationsOptions {
  suppliers: any[];
}

export const usePurchaseNotifications = (options: UsePurchaseNotificationsOptions) => {
  const { suppliers } = options;
  const { addNotification } = useNotification();

  /**
   * Create purchase success notification
   */
  const notifyPurchaseCreated = useCallback(async (purchase: Purchase) => {
    const supplierName = getSupplierName(purchase.supplier, suppliers);
    const itemCount = purchase.items?.length || 0;

    await addNotification({
      title: '📦 Pembelian Baru Dibuat!',
      message: `Pembelian dari ${supplierName} senilai ${formatCurrency(purchase.totalNilai)} dengan ${itemCount} item berhasil dibuat`,
      type: 'success',
      icon: 'package',
      priority: 2,
      related_type: 'purchase',
      related_id: purchase.id,
      action_url: '/purchases',
      is_read: false,
      is_archived: false
    });
  }, [suppliers, addNotification]);

  /**
   * Create purchase updated notification
   */
  const notifyPurchaseUpdated = useCallback(async (purchase: Purchase, changes?: string[]) => {
    const supplierName = getSupplierName(purchase.supplier, suppliers);
    const changeText = changes?.length ? ` (${changes.join(', ')})` : '';

    await addNotification({
      title: '📝 Pembelian Diperbarui',
      message: `Pembelian dari ${supplierName} berhasil diperbarui${changeText}`,
      type: 'info',
      icon: 'edit',
      priority: 2,
      related_type: 'purchase',
      related_id: purchase.id,
      action_url: '/purchases',
      is_read: false,
      is_archived: false
    });
  }, [suppliers, addNotification]);

  /**
   * Create status change notification
   */
  const notifyStatusChanged = useCallback(async (purchase: Purchase, oldStatus: string, newStatus: string) => {
    const supplierName = getSupplierName(purchase.supplier, suppliers);
    const oldStatusText = getStatusDisplayText(oldStatus);
    const newStatusText = getStatusDisplayText(newStatus);

    const iconMap: { [key: string]: string } = {
      'pending': 'clock',
      'completed': 'check-circle',
      'cancelled': 'x-circle'
    };

    await addNotification({
      title: '🔄 Status Pembelian Diubah',
      message: `Pembelian dari ${supplierName} diubah dari "${oldStatusText}" menjadi "${newStatusText}"`,
      type: newStatus === 'completed' ? 'success' : newStatus === 'cancelled' ? 'warning' : 'info',
      icon: iconMap[newStatus] || 'refresh-cw',
      priority: newStatus === 'completed' ? 3 : 2,
      related_type: 'purchase',
      related_id: purchase.id,
      action_url: '/purchases',
      is_read: false,
      is_archived: false
    });
  }, [suppliers, addNotification]);

  /**
   * Create purchase completed notification with financial record
   */
  const notifyPurchaseCompleted = useCallback(async (purchase: Purchase, expenseRecorded: boolean = false) => {
    const supplierName = getSupplierName(purchase.supplier, suppliers);
    const message = expenseRecorded 
      ? `Pembelian dari ${supplierName} senilai ${formatCurrency(purchase.totalNilai)} telah selesai dan pengeluaran tercatat`
      : `Pembelian dari ${supplierName} senilai ${formatCurrency(purchase.totalNilai)} telah selesai`;

    await addNotification({
      title: '✅ Pembelian Selesai!',
      message,
      type: 'success',
      icon: 'check-circle',
      priority: 3,
      related_type: 'purchase',
      related_id: purchase.id,
      action_url: '/purchases',
      is_read: false,
      is_archived: false
    });
  }, [suppliers, addNotification]);

  /**
   * Create purchase deleted notification
   */
  const notifyPurchaseDeleted = useCallback(async (purchase: Purchase) => {
    const supplierName = getSupplierName(purchase.supplier, suppliers);

    await addNotification({
      title: '🗑️ Pembelian Dihapus',
      message: `Pembelian dari ${supplierName} senilai ${formatCurrency(purchase.totalNilai)} telah dihapus dari sistem`,
      type: 'warning',
      icon: 'trash-2',
      priority: 2,
      related_type: 'purchase',
      action_url: '/purchases',
      is_read: false,
      is_archived: false
    });
  }, [suppliers, addNotification]);

  /**
   * Create bulk operation notification
   */
  const notifyBulkOperation = useCallback(async (
    operation: 'delete' | 'statusUpdate',
    count: number,
    totalValue?: number,
    newStatus?: string
  ) => {
    const titles = {
      delete: '🗑️ Penghapusan Massal Berhasil',
      statusUpdate: '📝 Pembaruan Status Massal Berhasil'
    };

    const messages = {
      delete: `${count} pembelian berhasil dihapus${totalValue ? ` dengan total nilai ${formatCurrency(totalValue)}` : ''}`,
      statusUpdate: `${count} pembelian berhasil diperbarui statusnya${newStatus ? ` menjadi "${getStatusDisplayText(newStatus)}"` : ''}`
    };

    const icons = {
      delete: 'trash-2',
      statusUpdate: 'refresh-cw'
    };

    await addNotification({
      title: titles[operation],
      message: messages[operation],
      type: operation === 'delete' ? 'warning' : 'success',
      icon: icons[operation],
      priority: 2,
      related_type: 'purchase',
      action_url: '/purchases',
      is_read: false,
      is_archived: false
    });
  }, [addNotification]);

  /**
   * Create error notification
   */
  const notifyError = useCallback(async (operation: string, error: string, purchaseId?: string) => {
    await addNotification({
      title: '❌ Operasi Gagal',
      message: `Gagal ${operation}: ${error}`,
      type: 'error',
      icon: 'alert-circle',
      priority: 4,
      related_type: 'purchase',
      related_id: purchaseId,
      action_url: '/purchases',
      is_read: false,
      is_archived: false
    });
  }, [addNotification]);

  /**
   * Create low stock warning notification (should only be called from inventory context)
   */
  const notifyLowStock = useCallback(async (itemName: string, currentStock: number, minStock: number) => {
    // Only create low stock notifications from inventory/warehouse context
    // This should not be called from purchase management
    await addNotification({
      title: '⚠️ Stok Menipis',
      message: `Stok ${itemName} tersisa ${currentStock} unit (minimum: ${minStock}). Pertimbangkan untuk memesan ulang.`,
      type: 'warning',
      icon: 'alert-triangle',
      priority: 3,
      related_type: 'inventory',
      action_url: '/gudang', // Updated to match your route
      is_read: false,
      is_archived: false
    });
  }, [addNotification]);

  /**
   * Create stock updated notification
   */
  const notifyStockUpdated = useCallback(async (purchase: Purchase) => {
    const supplierName = getSupplierName(purchase.supplier, suppliers);
    const itemCount = purchase.items?.length || 0;

    await addNotification({
      title: '📈 Stok Diperbarui',
      message: `Stok ${itemCount} item telah diperbarui dari pembelian ${supplierName}`,
      type: 'info',
      icon: 'trending-up',
      priority: 2,
      related_type: 'inventory',
      related_id: purchase.id,
      action_url: '/inventory',
      is_read: false,
      is_archived: false
    });
  }, [suppliers, addNotification]);

  /**
   * Create financial record notification
   */
  const notifyFinancialRecorded = useCallback(async (purchase: Purchase, recordType: 'expense' | 'income') => {
    const supplierName = getSupplierName(purchase.supplier, suppliers);
    const typeText = recordType === 'expense' ? 'Pengeluaran' : 'Pemasukan';

    await addNotification({
      title: `💰 ${typeText} Tercatat`,
      message: `${typeText} ${formatCurrency(purchase.totalNilai)} untuk pembelian dari ${supplierName} telah tercatat`,
      type: 'success',
      icon: 'dollar-sign',
      priority: 2,
      related_type: 'financial',
      related_id: purchase.id,
      action_url: '/financial',
      is_read: false,
      is_archived: false
    });
  }, [suppliers, addNotification]);

  return {
    notifyPurchaseCreated,
    notifyPurchaseUpdated,
    notifyStatusChanged,
    notifyPurchaseCompleted,
    notifyPurchaseDeleted,
    notifyBulkOperation,
    notifyError,
    notifyLowStock,
    notifyStockUpdated,
    notifyFinancialRecorded,
  };
};