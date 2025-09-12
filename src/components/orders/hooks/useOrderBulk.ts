// src/components/orders/hooks/useOrderBulk.ts
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';
import * as orderService from '../services/orderService';
import type { Order } from '../types';

interface BulkEditData {
  status?: Order['status'];
  tanggalPengiriman?: Date;
  catatan?: string;
}

interface BulkOperationProgress {
  total: number;
  completed: number;
  failed: number;
  errors: string[];
}

interface UseBulkOperationsProps {
  updateOrder: (id: string, updates: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  bulkDeleteOrders?: (ids: string[]) => Promise<boolean>;
  selectedItems: string[];
  clearSelection: () => void;
}

// Enhanced bulk operations hook with purchase-like implementation
export const useBulkOperations = (props: UseBulkOperationsProps) => {
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<BulkEditData>({});

  const { updateOrder, deleteOrder, bulkDeleteOrders, selectedItems, clearSelection } = props;

  // Validate bulk edit data
  const validateBulkEditData = useCallback((data: BulkEditData): boolean => {
    if (!data.status && !data.catatan && !data.tanggalPengiriman) {
      toast.error('Pilih minimal satu field untuk diedit');
      return false;
    }
    return true;
  }, []);

  // Reset bulk edit data
  const resetBulkEditData = useCallback(() => {
    setBulkEditData({});
  }, []);

  // Enhanced handleBulkEdit with proper validation
  const handleBulkEdit = useCallback(async (selectedOrdersData: Order[]): Promise<boolean> => {
    if (selectedItems.length === 0) {
      toast.error('Pilih pesanan yang ingin diedit terlebih dahulu');
      return false;
    }

    if (!validateBulkEditData(bulkEditData)) {
      return false;
    }

    setIsBulkEditing(true);
    logger.info(`📝 Starting bulk edit for ${selectedItems.length} orders`);

    try {
      let successCount = 0;
      
      for (const orderId of selectedItems) {
        try {
          const updateData: Partial<Order> = {
            ...(bulkEditData.status !== undefined && { status: bulkEditData.status }),
            ...(bulkEditData.catatan !== undefined && { catatan: bulkEditData.catatan }),
            ...(bulkEditData.tanggalPengiriman !== undefined && { tanggalPengiriman: bulkEditData.tanggalPengiriman }),
          };

          const success = await updateOrder(orderId, updateData);
          if (success) {
            successCount++;
          } else {
            logger.warn(`❌ Failed to edit order: ${orderId}`);
          }
        } catch (error) {
          logger.error(`❌ Exception during individual edit for order ${orderId}:`, error);
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} pesanan berhasil diedit`);
        clearSelection();
        resetBulkEditData();
        return true;
      } else {
        toast.error('Gagal mengedit pesanan');
        return false;
      }
    } catch (error) {
      logger.error('❌ Bulk edit error:', error);
      toast.error('Terjadi kesalahan saat melakukan bulk edit');
      return false;
    } finally {
      setIsBulkEditing(false);
    }
  }, [selectedItems, bulkEditData, validateBulkEditData, updateOrder, clearSelection, resetBulkEditData]);

  // Enhanced handleBulkDelete with fallback logic
  const handleBulkDelete = useCallback(async (): Promise<boolean> => {
    if (selectedItems.length === 0) {
      toast.error('Pilih pesanan yang ingin dihapus terlebih dahulu');
      return false;
    }

    setIsBulkDeleting(true);
    logger.info(`🗑️ Starting bulk delete for ${selectedItems.length} orders`);

    try {
      let success = false;

      // Try bulk delete first if available
      if (bulkDeleteOrders) {
        logger.debug('🚀 Using bulk delete API');
        success = await bulkDeleteOrders(selectedItems);
        logger.debug(`📊 Bulk delete API result: ${success}`);
      } else {
        // Fallback to individual deletes
        logger.debug('🔄 Fallback to individual deletes');
        
        let successCount = 0;
        for (const id of selectedItems) {
          try {
            logger.debug(`🗑️ Deleting individual order: ${id}`);
            const itemSuccess = await deleteOrder(id);
            if (itemSuccess) {
              successCount++;
            } else {
              logger.warn(`❌ Failed to delete order: ${id}`);
            }
          } catch (error) {
            logger.error(`❌ Exception during individual delete for order ${id}:`, error);
          }
        }
        
        success = successCount > 0;
        logger.info(`📊 Individual deletes: ${successCount}/${selectedItems.length} successful`);
        
        if (successCount < selectedItems.length) {
          const failedCount = selectedItems.length - successCount;
          toast.error(`${failedCount} pesanan gagal dihapus`);
        }
      }
      
      if (success) {
        toast.success(`${selectedItems.length} pesanan berhasil dihapus`);
        clearSelection();
        return true;
      } else {
        toast.error('Gagal menghapus pesanan');
        return false;
      }
    } catch (error) {
      logger.error('❌ Bulk delete error:', error);
      toast.error('Terjadi kesalahan saat menghapus pesanan');
      return false;
    } finally {
      setIsBulkDeleting(false);
    }
  }, [selectedItems, bulkDeleteOrders, deleteOrder, clearSelection]);

  return {
    isBulkEditing,
    isBulkDeleting,
    bulkEditData,
    setBulkEditData,
    handleBulkEdit,
    handleBulkDelete,
    resetBulkEditData,
    validateBulkEditData,
  };
};

// Legacy hook for backward compatibility
export const useOrderBulk = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [operationType, setOperationType] = useState<'edit' | 'delete'>('edit');
  const [progress, setProgress] = useState<BulkOperationProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    errors: []
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (orderIds: string[]) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      setIsProcessing(true);
      setProgress({ total: orderIds.length, completed: 0, failed: 0, errors: [] });

      const results = [] as { id: string; success: boolean; error?: string }[];

      for (let i = 0; i < orderIds.length; i++) {
        const orderId = orderIds[i];
        try {
          await orderService.deleteOrder(user.id, orderId);
          results.push({ id: orderId, success: true });
          setProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
        } catch (error: any) {
          logger.error(`Failed to delete order ${orderId}:`, error);
          results.push({ id: orderId, success: false, error: error.message });
          setProgress(prev => ({
            ...prev,
            failed: prev.failed + 1,
            errors: [...prev.errors, `Gagal menghapus pesanan ${orderId}: ${error.message}`]
          }));
        }
      }

      setIsProcessing(false);
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        toast.success(`${successCount} pesanan berhasil dihapus`);
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        // ✅ INVALIDATE PROFIT ANALYSIS: Bulk order deletion affects profit calculations
        console.log('📈 Invalidating profit analysis cache after bulk order deletion');
        queryClient.invalidateQueries({ 
          queryKey: ['profit-analysis'] 
        });
      }
      
      if (failedCount > 0) {
        toast.error(`${failedCount} pesanan gagal dihapus`);
      }
    },
    onError: (error: any) => {
      logger.error('Bulk delete failed:', error);
      toast.error('Gagal menghapus pesanan');
      setIsProcessing(false);
    }
  });

  // Bulk edit mutation
  const bulkEditMutation = useMutation({
    mutationFn: async ({ orderIds, editData }: { orderIds: string[], editData: BulkEditData }) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      setIsProcessing(true);
      setProgress({ total: orderIds.length, completed: 0, failed: 0, errors: [] });

      const results = [] as { id: string; success: boolean; error?: string }[];

      for (let i = 0; i < orderIds.length; i++) {
        const orderId = orderIds[i];
        try {
          const updateData: Partial<Order> = {
            ...(editData.status !== undefined && { status: editData.status as Order['status'] }),
            ...(editData.catatan !== undefined && { catatan: editData.catatan }),
          };

          if (editData.tanggalPengiriman !== undefined) {
            (updateData as any).tanggalPengiriman = editData.tanggalPengiriman;
          }

          await orderService.updateOrder(user.id, orderId, updateData);
          results.push({ id: orderId, success: true });
          setProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
        } catch (error: any) {
          logger.error(`Failed to update order ${orderId}:`, error);
          results.push({ id: orderId, success: false, error: error.message });
          setProgress(prev => ({
            ...prev,
            failed: prev.failed + 1,
            errors: [...prev.errors, `Gagal memperbarui pesanan ${orderId}: ${error.message}`]
          }));
        }
      }

      setIsProcessing(false);
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.filter(r => !r.success).length;
      
      if (successCount > 0) {
        toast.success(`${successCount} pesanan berhasil diperbarui`);
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        // ✅ INVALIDATE PROFIT ANALYSIS: Bulk order updates affect profit calculations
        console.log('📈 Invalidating profit analysis cache after bulk order update');
        queryClient.invalidateQueries({ 
          queryKey: ['profit-analysis'] 
        });
      }
      
      if (failedCount > 0) {
        toast.error(`${failedCount} pesanan gagal diperbarui`);
      }
    },
    onError: (error: any) => {
      logger.error('Bulk edit failed:', error);
      toast.error('Gagal memperbarui pesanan');
      setIsProcessing(false);
    }
  });

  const openDialog = (type: 'edit' | 'delete') => {
    setOperationType(type);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setProgress({ total: 0, completed: 0, failed: 0, errors: [] });
  };

  const executeBulkDelete = (orderIds: string[]) => {
    bulkDeleteMutation.mutate(orderIds);
  };

  const executeBulkEdit = (orderIds: string[], editData: BulkEditData) => {
    bulkEditMutation.mutate({ orderIds, editData });
  };

  return {
    // State
    isDialogOpen,
    operationType,
    progress,
    isProcessing,
    
    // Actions
    openDialog,
    closeDialog,
    executeBulkDelete,
    executeBulkEdit,
    
    // Mutation states
    isDeleting: bulkDeleteMutation.isPending,
    isEditing: bulkEditMutation.isPending,
  };
};

export type { Order, BulkEditData, UseBulkOperationsProps };
