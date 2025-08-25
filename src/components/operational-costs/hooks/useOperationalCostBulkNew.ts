// src/components/operational-costs/hooks/useOperationalCostBulkNew.ts
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { operationalCostApi } from '../services/operationalCostApi';
import type { OperationalCost } from '../types/operationalCost.types';

interface BulkEditData {
  jenis?: 'tetap' | 'variabel';
  status?: 'aktif' | 'nonaktif';
  group?: 'HPP' | 'OPERASIONAL';
  deskripsi?: string;
}

interface BulkOperationProgress {
  total: number;
  completed: number;
  failed: number;
  errors: string[];
}

export const useOperationalCostBulkNew = () => {
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
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
      
      // Close dialog
      setIsBulkDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      logger.error('Bulk delete failed:', error);
      toast.error('Gagal menghapus biaya operasional');
      setIsProcessing(false);
    }
  });

  // Bulk edit mutation
  const bulkEditMutation = useMutation({
    mutationFn: async ({ costIds, editData }: { costIds: string[], editData: BulkEditData }) => {
      setIsProcessing(true);
      setProgress({ total: costIds.length, completed: 0, failed: 0, errors: [] });
      
      const results = [];
      
      for (let i = 0; i < costIds.length; i++) {
        const costId = costIds[i];
        try {
          // Get current cost data
          const currentCostResponse = await operationalCostApi.getCostById(costId);
          if (currentCostResponse.error) {
            throw new Error(currentCostResponse.error);
          }
          
          const currentCost = currentCostResponse.data;
          
          // Merge current data with edit data
          const updatedData = {
            ...currentCost,
            ...editData
          };
          
          const result = await operationalCostApi.updateCost(costId, updatedData);
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
      
      // Close dialog
      setIsBulkEditDialogOpen(false);
    },
    onError: (error: any) => {
      logger.error('Bulk edit failed:', error);
      toast.error('Gagal memperbarui biaya operasional');
      setIsProcessing(false);
    }
  });

  const openBulkEditDialog = () => {
    setIsBulkEditDialogOpen(true);
  };

  const closeBulkEditDialog = () => {
    setIsBulkEditDialogOpen(false);
    setProgress({ total: 0, completed: 0, failed: 0, errors: [] });
  };

  const openBulkDeleteDialog = () => {
    setIsBulkDeleteDialogOpen(true);
  };

  const closeBulkDeleteDialog = () => {
    setIsBulkDeleteDialogOpen(false);
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
    isBulkEditDialogOpen,
    isBulkDeleteDialogOpen,
    progress,
    isProcessing,
    
    // Actions
    openBulkEditDialog,
    closeBulkEditDialog,
    openBulkDeleteDialog,
    closeBulkDeleteDialog,
    executeBulkDelete,
    executeBulkEdit,
    
    // Mutation states
    isDeleting: bulkDeleteMutation.isPending,
    isEditing: bulkEditMutation.isPending,
  };
};