// src/components/operational-costs/hooks/useOperationalCostBulk.ts
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { operationalCostApi } from '../services/operationalCostApi';
import type { OperationalCost } from '../types/operationalCost.types';

interface BulkEditData {
  jenis?: 'tetap' | 'variabel';
  status?: 'aktif' | 'nonaktif';
  group?: 'hpp' | 'operasional';
  deskripsi?: string;
}

interface BulkOperationProgress {
  total: number;
  completed: number;
  failed: number;
  errors: string[];
}

export const useOperationalCostBulk = () => {
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

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (costIds: string[]) => {
      setIsProcessing(true);
      setProgress({ total: costIds.length, completed: 0, failed: 0, errors: [] });
      
      const results = [];
      
      for (let i = 0; i < costIds.length; i++) {
        const costId = costIds[i];
        try {
          const result = await operationalCostApi.deleteCost(costId);
          if (result.error) {
            throw new Error(result.error);
          }
          results.push({ id: costId, success: true });
          setProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
        } catch (error: any) {
          logger.error(`Failed to delete cost ${costId}:`, error);
          results.push({ id: costId, success: false, error: error.message });
          setProgress(prev => ({ 
            ...prev, 
            failed: prev.failed + 1,
            errors: [...prev.errors, `Gagal menghapus biaya ${costId}: ${error.message}`]
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
        toast.success(`${successCount} biaya berhasil dihapus`);
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['operational-costs'] });
      }
      
      if (failedCount > 0) {
        toast.error(`${failedCount} biaya gagal dihapus`);
      }
    },
    onError: (error: any) => {
      logger.error('Bulk delete failed:', error);
      toast.error('Gagal menghapus biaya operasional');
      setIsProcessing(false);
    }
  });

  // Bulk edit mutation (placeholder - implement based on your API)
  const bulkEditMutation = useMutation({
    mutationFn: async ({ costIds, editData }: { costIds: string[], editData: BulkEditData }) => {
      setIsProcessing(true);
      setProgress({ total: costIds.length, completed: 0, failed: 0, errors: [] });
      
      const results = [];
      
      for (let i = 0; i < costIds.length; i++) {
        const costId = costIds[i];
        try {
          const result = await operationalCostApi.updateCost(costId, editData);
          if (result.error) {
            throw new Error(result.error);
          }
          results.push({ id: costId, success: true });
          setProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
        } catch (error: any) {
          logger.error(`Failed to update cost ${costId}:`, error);
          results.push({ id: costId, success: false, error: error.message });
          setProgress(prev => ({ 
            ...prev, 
            failed: prev.failed + 1,
            errors: [...prev.errors, `Gagal memperbarui biaya ${costId}: ${error.message}`]
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
        toast.success(`${successCount} biaya berhasil diperbarui`);
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['operational-costs'] });
      }
      
      if (failedCount > 0) {
        toast.error(`${failedCount} biaya gagal diperbarui`);
      }
    },
    onError: (error: any) => {
      logger.error('Bulk edit failed:', error);
      toast.error('Gagal memperbarui biaya operasional');
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

  const executeBulkDelete = (costIds: string[]) => {
    bulkDeleteMutation.mutate(costIds);
  };

  const executeBulkEdit = (costIds: string[], editData: BulkEditData) => {
    bulkEditMutation.mutate({ costIds, editData });
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

export type { OperationalCost, BulkEditData };