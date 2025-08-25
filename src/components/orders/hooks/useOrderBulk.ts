// src/components/orders/hooks/useOrderBulk.ts
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';
import * as orderService from '../services/orderService';
import type { Order } from '../types';

interface BulkEditData {
  status?: string;
  tanggalPengiriman?: Date;
  catatan?: string;
}

interface BulkOperationProgress {
  total: number;
  completed: number;
  failed: number;
  errors: string[];
}

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
            ...(editData.status !== undefined && { status: editData.status }),
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

export type { Order, BulkEditData };
