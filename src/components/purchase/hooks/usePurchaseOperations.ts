import { useState, useCallback } from 'react';
import { Purchase } from '@/types/supplier';
import { PurchaseService, CreatePurchaseData, UpdatePurchaseData } from '../services/purchaseService';
import { transformPurchaseFromDB, getSupplierName, formatPurchaseSummary } from '../services/purchaseTransformers';
import { validatePurchaseForm, validateStatusChange, PurchaseFormData } from '../services/purchaseValidators';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity } from '@/contexts/ActivityContext';
import { useFinancial } from '@/components/financial/contexts/FinancialContext';
import { useNotification } from '@/contexts/NotificationContext';
import { createNotificationHelper } from '@/utils/notificationHelpers';
import { formatCurrency } from '@/utils/formatUtils';

export interface UsePurchaseOperationsOptions {
  suppliers: any[];
  onSuccess?: (action: string, purchase?: Purchase) => void;
  onError?: (action: string, error: any) => void;
}

export const usePurchaseOperations = (options: UsePurchaseOperationsOptions) => {
  const { suppliers, onSuccess, onError } = options;
  const { user } = useAuth();
  const { addActivity } = useActivity();
  const { addFinancialTransaction } = useFinancial();
  const { addNotification } = useNotification();
  
  const [isLoading, setIsLoading] = useState(false);

  // Initialize service
  const purchaseService = user ? new PurchaseService({ userId: user.id }) : null;

  /**
   * Create a new purchase
   */
  const createPurchase = useCallback(async (formData: PurchaseFormData): Promise<boolean> => {
    if (!purchaseService) {
      toast.error('Anda harus login untuk menambahkan pembelian');
      return false;
    }

    // Validate form data
    const validation = validatePurchaseForm(formData);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return false;
    }

    setIsLoading(true);
    try {
      const totalNilai = formData.items.reduce((sum, item) => sum + item.totalHarga, 0);
      
      const purchaseData: CreatePurchaseData = {
        supplier: formData.supplier,
        totalNilai,
        tanggal: formData.tanggal,
        items: formData.items,
        status: formData.status,
      };

      const { error } = await purchaseService.createPurchase(purchaseData);

      if (error) {
        throw new Error(error.message);
      }

      const supplierName = getSupplierName(formData.supplier, suppliers);
      const itemCount = formData.items.length;

      // Activity log
      addActivity({
        title: 'Pembelian Ditambahkan',
        description: `Pembelian dari ${supplierName} senilai ${formatCurrency(totalNilai)}`,
        type: 'purchase',
        value: null
      });

      // Success notification
      await addNotification({
        title: '📦 Pembelian Baru Dibuat!',
        message: `Pembelian dari ${supplierName} senilai ${formatCurrency(totalNilai)} dengan ${itemCount} item berhasil dibuat dan stok diperbarui`,
        type: 'success',
        icon: 'package',
        priority: 2,
        related_type: 'purchase',
        action_url: '/pembelian', // Updated to match your route
        is_read: false,
        is_archived: false
      });

      toast.success('Pembelian berhasil diproses dan stok telah diperbarui!');
      onSuccess?.('create');
      return true;

    } catch (error: any) {
      console.error('Error creating purchase:', error);
      toast.error(`Gagal memproses pembelian: ${error.message}`);
      
      await addNotification(createNotificationHelper.systemError(
        `Gagal memproses pembelian: ${error.message}`
      ));
      
      onError?.('create', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [purchaseService, suppliers, addActivity, addNotification, onSuccess, onError]);

  /**
   * Update an existing purchase
   */
  const updatePurchase = useCallback(async (id: string, updatedData: Partial<Purchase>, oldPurchase: Purchase): Promise<boolean> => {
    if (!purchaseService) {
      toast.error('Anda harus login.');
      return false;
    }

    setIsLoading(true);
    try {
      const updateData: UpdatePurchaseData = {};
      
      if (updatedData.supplier !== undefined) updateData.supplier = updatedData.supplier;
      if (updatedData.totalNilai !== undefined) updateData.totalNilai = updatedData.totalNilai;
      if (updatedData.tanggal !== undefined) updateData.tanggal = updatedData.tanggal;
      if (updatedData.items !== undefined) updateData.items = updatedData.items;
      if (updatedData.status !== undefined) updateData.status = updatedData.status;
      if (updatedData.metodePerhitungan !== undefined) updateData.metodePerhitungan = updatedData.metodePerhitungan;

      const { error } = await purchaseService.updatePurchase(id, updateData);

      if (error) {
        throw new Error(error.message);
      }

      const supplierName = getSupplierName(oldPurchase.supplier, suppliers);
      const oldStatus = oldPurchase.status;
      const newStatus = updatedData.status;
      let wasExpenseRecorded = false;

      // Handle status change to completed
      if (oldStatus !== 'completed' && newStatus === 'completed') {
        const successFinancial = await addFinancialTransaction({
          type: 'expense',
          category: 'Pembelian Bahan Baku',
          description: `Pembelian dari ${supplierName}`,
          amount: oldPurchase.totalNilai,
          date: new Date(oldPurchase.tanggal),
          relatedId: oldPurchase.id,
        });

        if (successFinancial) {
          wasExpenseRecorded = true;
          addActivity({
            title: 'Pengeluaran Dicatat',
            description: `Pengeluaran ${formatCurrency(oldPurchase.totalNilai)} untuk pembelian dari ${supplierName}.`,
            type: 'keuangan',
            value: oldPurchase.totalNilai.toString()
          });

          await addNotification({
            title: '✅ Pembelian Selesai!',
            message: `Pembelian dari ${supplierName} senilai ${formatCurrency(oldPurchase.totalNilai)} telah selesai dan pengeluaran tercatat`,
            type: 'success',
            icon: 'check-circle',
            priority: 2,
            related_type: 'purchase',
            related_id: id,
            action_url: `/purchases`,
            is_read: false,
            is_archived: false
          });
        } else {
          await addNotification({
            title: '⚠️ Pembelian Diperbarui, Pengeluaran Gagal',
            message: `Status pembelian dari ${supplierName} berhasil diubah, tetapi gagal mencatat pengeluaran ${formatCurrency(oldPurchase.totalNilai)}`,
            type: 'warning',
            icon: 'alert-triangle',
            priority: 3,
            related_type: 'purchase',
            related_id: id,
            action_url: `/purchases`,
            is_read: false,
            is_archived: false
          });
        }
      }

      // Success messages
      if (wasExpenseRecorded) {
        toast.success('Status diubah & pengeluaran berhasil dicatat.');
      } else {
        toast.success('Pembelian berhasil diperbarui.');

        // Create status change notification (if status changed)
        if (newStatus && oldStatus !== newStatus) {
          await addNotification({
            title: '📝 Status Pembelian Diubah',
            message: `Pembelian dari ${supplierName} diubah dari "${oldStatus}" menjadi "${newStatus}"`,
            type: 'info',
            icon: 'refresh-cw',
            priority: 2,
            related_type: 'purchase',
            related_id: id,
            action_url: `/purchases`,
            is_read: false,
            is_archived: false
          });
        }
      }

      onSuccess?.('update', oldPurchase);
      return true;

    } catch (error: any) {
      console.error('Error updating purchase:', error);
      toast.error(`Gagal memperbarui pembelian: ${error.message}`);

      await addNotification(createNotificationHelper.systemError(
        `Gagal memperbarui pembelian dari ${getSupplierName(oldPurchase.supplier, suppliers)}: ${error.message}`
      ));

      onError?.('update', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [purchaseService, suppliers, addFinancialTransaction, addActivity, addNotification, onSuccess, onError]);

  /**
   * Delete a purchase
   */
  const deletePurchase = useCallback(async (id: string, purchase: Purchase): Promise<boolean> => {
    if (!purchaseService) {
      toast.error('Anda harus login.');
      return false;
    }

    setIsLoading(true);
    try {
      const { error } = await purchaseService.deletePurchase(id);

      if (error) {
        throw new Error(error.message);
      }

      const supplierName = getSupplierName(purchase.supplier, suppliers);

      // Activity log
      addActivity({
        title: 'Pembelian Dihapus',
        description: `Pembelian dari ${supplierName} telah dihapus.`,
        type: 'purchase',
        value: null
      });

      // Delete notification
      await addNotification({
        title: '🗑️ Pembelian Dihapus',
        message: `Pembelian dari ${supplierName} senilai ${formatCurrency(purchase.totalNilai)} telah dihapus dari sistem`,
        type: 'warning',
        icon: 'trash-2',
        priority: 2,
        related_type: 'purchase',
        action_url: `/purchases`,
        is_read: false,
        is_archived: false
      });

      toast.success('Pembelian berhasil dihapus.');
      onSuccess?.('delete', purchase);
      return true;

    } catch (error: any) {
      console.error('Error deleting purchase:', error);
      toast.error(`Gagal menghapus pembelian: ${error.message}`);

      await addNotification(createNotificationHelper.systemError(
        `Gagal menghapus pembelian dari ${getSupplierName(purchase.supplier, suppliers)}: ${error.message}`
      ));

      onError?.('delete', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [purchaseService, suppliers, addActivity, addNotification, onSuccess, onError]);

  /**
   * Change purchase status
   */
  const changeStatus = useCallback(async (id: string, newStatus: string, purchase: Purchase): Promise<boolean> => {
    // Validate status change
    const validation = validateStatusChange(purchase.status, newStatus);
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return false;
    }

    return await updatePurchase(id, { status: newStatus }, purchase);
  }, [updatePurchase]);

  return {
    isLoading,
    createPurchase,
    updatePurchase,
    deletePurchase,
    changeStatus,
  };
};