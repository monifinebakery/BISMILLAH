import { useState, useCallback } from 'react';
import { Purchase } from '@/types/supplier';
import { PurchaseService } from './services/purchaseService';
import { validateBulkDelete } from '../services/purchaseValidators';
import { getSupplierName } from '../services/purchaseTransformers';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useNotification } from '@/contexts/NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
import { formatCurrency } from '@/utils/formatUtils';

export interface UseBulkOperationsOptions {
  purchases: Purchase[];
  suppliers: any[];
  selectedIds: string[];
  onSuccess?: (action: string, count: number) => void;
  onError?: (action: string, errors: any[]) => void;
}

export const useBulkOperations = (options: UseBulkOperationsOptions) => {
  const { purchases, suppliers, selectedIds, onSuccess, onError } = options;
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addNotification } = useNotification();
  
  const [isLoading, setIsLoading] = useState(false);

  // Initialize service
  const purchaseService = user ? new PurchaseService({ userId: user.id }) : null;

  /**
   * Get selected purchases data
   */
  const getSelectedPurchases = useCallback(() => {
    return purchases.filter(p => selectedIds.includes(p.id));
  }, [purchases, selectedIds]);

  /**
   * Calculate total value of selected purchases
   */
  const getSelectedTotal = useCallback(() => {
    const selected = getSelectedPurchases();
    return selected.reduce((sum, p) => sum + p.totalNilai, 0);
  }, [getSelectedPurchases]);

  /**
   * Get selected purchases summary
   */
  const getSelectedSummary = useCallback(() => {
    const selected = getSelectedPurchases();
    const totalValue = getSelectedTotal();
    const supplierNames = [...new Set(selected.map(p => getSupplierName(p.supplier, suppliers)))];
    
    return {
      count: selected.length,
      totalValue,
      suppliers: supplierNames,
      purchases: selected
    };
  }, [getSelectedPurchases, getSelectedTotal, suppliers]);

  /**
   * Bulk delete selected purchases
   */
  const bulkDelete = useCallback(async (): Promise<boolean> => {
    if (!purchaseService) {
      toast.error('Anda harus login.');
      return false;
    }

    // Validate selection
    const validation = validateBulkDelete(selectedIds);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return false;
    }

    const selected = getSelectedPurchases();
    const summary = getSelectedSummary();

    setIsLoading(true);
    try {
      const { errors } = await purchaseService.bulkDeletePurchases(selectedIds);

      if (errors.length > 0) {
        // Partial failure
        const successCount = selectedIds.length - errors.length;
        const failedIds = errors.map(e => e.id);
        
        toast.error(`${errors.length} item gagal dihapus dari total ${selectedIds.length} item`);
        
        // Notify about partial failure
        await addNotification({
          title: '⚠️ Penghapusan Sebagian Berhasil',
          message: `${successCount} dari ${selectedIds.length} pembelian berhasil dihapus. ${errors.length} item gagal dihapus.`,
          type: 'warning',
          icon: 'alert-triangle',
          priority: 3,
          related_type: 'purchase',
          action_url: '/purchases',
          is_read: false,
          is_archived: false
        });

        onError?.('bulkDelete', errors);
        return false;
      }

      // Success - all deleted
      addActivity({
        title: 'Penghapusan Massal Pembelian',
        description: `${summary.count} pembelian berhasil dihapus senilai total ${formatCurrency(summary.totalValue)}`,
        type: 'purchase',
        value: null
      });

      await addNotification({
        title: '🗑️ Penghapusan Massal Berhasil',
        message: `${summary.count} pembelian berhasil dihapus dengan total nilai ${formatCurrency(summary.totalValue)}`,
        type: 'success',
        icon: 'trash-2',
        priority: 2,
        related_type: 'purchase',
        action_url: '/purchases',
        is_read: false,
        is_archived: false
      });

      toast.success(`${summary.count} pembelian berhasil dihapus!`);
      onSuccess?.('bulkDelete', summary.count);
      return true;

    } catch (error: any) {
      console.error('Error bulk deleting purchases:', error);
      toast.error(`Gagal menghapus pembelian: ${error.message}`);

      await addNotification(createNotificationHelper.systemError(
        `Gagal menghapus ${selectedIds.length} pembelian: ${error.message}`
      ));

      onError?.('bulkDelete', [error]);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [purchaseService, selectedIds, getSelectedPurchases, getSelectedSummary, addActivity, addNotification, onSuccess, onError]);

  /**
   * Bulk status update
   */
  const bulkUpdateStatus = useCallback(async (newStatus: string): Promise<boolean> => {
    if (!purchaseService) {
      toast.error('Anda harus login.');
      return false;
    }

    const validation = validateBulkDelete(selectedIds); // Reuse validation
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return false;
    }

    const selected = getSelectedPurchases();
    const summary = getSelectedSummary();

    setIsLoading(true);
    try {
      const updatePromises = selectedIds.map(id => 
        purchaseService.updatePurchase(id, { status: newStatus })
      );

      const results = await Promise.allSettled(updatePromises);
      const errors = results
        .map((result, index) => ({ result, id: selectedIds[index] }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ result, id }) => ({ id, error: result.reason }));

      if (errors.length > 0) {
        const successCount = selectedIds.length - errors.length;
        toast.error(`${errors.length} item gagal diperbarui dari total ${selectedIds.length} item`);
        
        await addNotification({
          title: '⚠️ Pembaruan Status Sebagian Berhasil',
          message: `${successCount} dari ${selectedIds.length} pembelian berhasil diperbarui statusnya.`,
          type: 'warning',
          icon: 'alert-triangle',
          priority: 3,
          related_type: 'purchase',
          action_url: '/purchases',
          is_read: false,
          is_archived: false
        });

        onError?.('bulkUpdateStatus', errors);
        return false;
      }

      // Success
      addActivity({
        title: 'Pembaruan Status Massal',
        description: `${summary.count} pembelian berhasil diperbarui statusnya menjadi "${newStatus}"`,
        type: 'purchase',
        value: null
      });

      await addNotification({
        title: '📝 Pembaruan Status Massal Berhasil',
        message: `${summary.count} pembelian berhasil diperbarui statusnya menjadi "${newStatus}"`,
        type: 'success',
        icon: 'refresh-cw',
        priority: 2,
        related_type: 'purchase',
        action_url: '/purchases',
        is_read: false,
        is_archived: false
      });

      toast.success(`Status ${summary.count} pembelian berhasil diperbarui!`);
      onSuccess?.('bulkUpdateStatus', summary.count);
      return true;

    } catch (error: any) {
      console.error('Error bulk updating status:', error);
      toast.error(`Gagal memperbarui status: ${error.message}`);

      await addNotification(createNotificationHelper.systemError(
        `Gagal memperbarui status ${selectedIds.length} pembelian: ${error.message}`
      ));

      onError?.('bulkUpdateStatus', [error]);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [purchaseService, selectedIds, getSelectedPurchases, getSelectedSummary, addActivity, addNotification, onSuccess, onError]);

  /**
   * Export selected purchases to CSV/Excel
   */
  const exportSelected = useCallback(async (format: 'csv' | 'excel' = 'csv'): Promise<boolean> => {
    const validation = validateBulkDelete(selectedIds);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return false;
    }

    try {
      const selected = getSelectedPurchases();
      const summary = getSelectedSummary();

      // Prepare export data
      const exportData = selected.map(purchase => ({
        'Tanggal': new Date(purchase.tanggal).toLocaleDateString('id-ID'),
        'Supplier': getSupplierName(purchase.supplier, suppliers),
        'Total Nilai': purchase.totalNilai,
        'Status': purchase.status,
        'Jumlah Item': purchase.items?.length || 0,
        'Metode Perhitungan': purchase.metodePerhitungan || 'FIFO',
      }));

      // Convert to CSV
      if (format === 'csv') {
        const headers = Object.keys(exportData[0]);
        const csvContent = [
          headers.join(','),
          ...exportData.map(row => 
            headers.map(header => `"${row[header as keyof typeof row]}"`).join(',')
          )
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `pembelian_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      }

      toast.success(`${summary.count} pembelian berhasil diekspor!`);
      return true;

    } catch (error: any) {
      console.error('Error exporting purchases:', error);
      toast.error(`Gagal mengekspor data: ${error.message}`);
      return false;
    }
  }, [selectedIds, getSelectedPurchases, getSelectedSummary, suppliers]);

  return {
    isLoading,
    selectedSummary: getSelectedSummary(),
    bulkDelete,
    bulkUpdateStatus,
    exportSelected,
  };
};