// src/components/operational-costs/hooks/useOperationalCostMutation.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { CostFormData, AllocationFormData } from '../types';
import { operationalCostApi, allocationApi, productionOutputApi } from '../services';
import { OPERATIONAL_COST_QUERY_KEYS } from './useOperationalCostQuery';
import { logger } from '@/utils/logger';

interface UseOperationalCostMutationProps {
  isAuthenticated: boolean;
  onError?: (error: string) => void;
}

export const useOperationalCostMutation = ({
  isAuthenticated,
  onError
}: UseOperationalCostMutationProps) => {
  const queryClient = useQueryClient();

  // Create Cost Mutation
  const createCostMutation = useMutation({
    mutationFn: async (data: CostFormData) => {
      logger.info('🔄 Creating new cost:', data.nama_biaya);
      const response = await operationalCostApi.createCost(data);
      if (response.error) {
        logger.error('❌ Error creating cost:', response.error);
        throw new Error(response.error);
      }
      logger.success('✅ Cost created successfully:', response.data?.id);
      return response.data;
    },
    onSuccess: (newCost) => {
      logger.info('🎉 Cost mutation success, invalidating queries');
      // Invalidate and refetch costs (partial key to match all filter variants)
      queryClient.invalidateQueries({ queryKey: ['operational-costs', 'costs'] });
      // Also invalidate overhead calculations since costs changed
      queryClient.invalidateQueries({ queryKey: ['operational-costs', 'overhead-calculation'] });
    },
    onError: (error: Error) => {
      logger.error('❌ Create cost mutation error:', error.message);
      if (onError) {
        onError(error.message || 'Gagal menambahkan biaya operasional');
      }
    },
  });

  // Update Cost Mutation
  const updateCostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CostFormData> }) => {
      logger.info('🔄 Updating cost:', id);
      const response = await operationalCostApi.updateCost(id, data);
      if (response.error) {
        logger.error('❌ Error updating cost:', response.error);
        throw new Error(response.error);
      }
      logger.success('✅ Cost updated successfully:', id);
      return response.data;
    },
    onSuccess: (updatedCost) => {
      logger.info('🎉 Update cost mutation success, invalidating queries');
      // Invalidate and refetch costs (partial key)
      queryClient.invalidateQueries({ queryKey: ['operational-costs', 'costs'] });
      // Also invalidate overhead calculations since costs changed
      queryClient.invalidateQueries({ queryKey: ['operational-costs', 'overhead-calculation'] });
    },
    onError: (error: Error) => {
      logger.error('❌ Update cost mutation error:', error.message);
      if (onError) {
        onError(error.message || 'Gagal memperbarui biaya operasional');
      }
    },
  });

  // Delete Cost Mutation
  const deleteCostMutation = useMutation({
    mutationFn: async (id: string) => {
      logger.info('🔄 Deleting cost:', id);
      const response = await operationalCostApi.deleteCost(id);
      if (response.error) {
        logger.error('❌ Error deleting cost:', response.error);
        throw new Error(response.error);
      }
      logger.success('✅ Cost deleted successfully:', id);
      return id;
    },
    onSuccess: (deletedId) => {
      logger.info('🎉 Delete cost mutation success, invalidating queries');
      // Invalidate and refetch costs (partial key)
      queryClient.invalidateQueries({ queryKey: ['operational-costs', 'costs'] });
      // Also invalidate overhead calculations since costs changed
      queryClient.invalidateQueries({ queryKey: ['operational-costs', 'overhead-calculation'] });
    },
    onError: (error: Error) => {
      logger.error('❌ Delete cost mutation error:', error.message);
      if (onError) {
        onError(error.message || 'Gagal menghapus biaya operasional');
      }
    },
  });

  // Save Allocation Settings Mutation
  const saveAllocationMutation = useMutation({
    mutationFn: async (data: AllocationFormData) => {
      logger.info('🔄 Saving allocation settings:', data);
      const response = await allocationApi.upsertSettings(data);
      if (response.error) {
        logger.error('❌ Error saving allocation settings:', response.error);
        throw new Error(response.error);
      }
      logger.success('✅ Allocation settings saved successfully');
      return response.data;
    },
    onSuccess: (settings) => {
      logger.info('🎉 Save allocation mutation success, invalidating queries');
      // Invalidate and refetch allocation settings
      queryClient.invalidateQueries({ queryKey: OPERATIONAL_COST_QUERY_KEYS.allocationSettings() });
      // Also invalidate overhead calculations since allocation settings changed
      queryClient.invalidateQueries({ queryKey: ['operational-costs', 'overhead-calculation'] });
    },
    onError: (error: Error) => {
      logger.error('❌ Save allocation mutation error:', error.message);
      if (onError) {
        onError(error.message || 'Gagal menyimpan pengaturan alokasi');
      }
    },
  });

  // Update Production Target Mutation
  const updateProductionTargetMutation = useMutation({
    mutationFn: async (targetPcs: number) => {
      logger.info('🎯 Updating production target:', targetPcs);
      const response = await productionOutputApi.saveProductionTarget(targetPcs, 'manual_input');
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: async (result, targetPcs) => {
      logger.info('🎉 Production target updated successfully, invalidating queries');
      
      // Comprehensive query invalidation for auto-update
      const invalidationPromises = [
        // Core operational cost queries
        queryClient.invalidateQueries({ queryKey: ['operational-costs'] }),
        
        // Overhead calculations (all variants)
        queryClient.invalidateQueries({ queryKey: ['operational-costs', 'overhead-calculation'] }),
        
        // Production target queries
        queryClient.invalidateQueries({ queryKey: OPERATIONAL_COST_QUERY_KEYS.productionTarget() }),
        
        // Recipe-related overhead queries
        queryClient.invalidateQueries({ queryKey: ['recipe-overhead'] }),
        
        // App settings queries (where production target is stored)
        queryClient.invalidateQueries({ queryKey: ['app-settings'] }),
        
        // Enhanced HPP calculations
        queryClient.invalidateQueries({ queryKey: ['enhanced-hpp'] }),
        
        // Cost calculations
        queryClient.invalidateQueries({ queryKey: ['cost-calculation'] }),
      ];
      
      // Execute all invalidations simultaneously
      await Promise.all(invalidationPromises);
      
      logger.success('✅ Production target updated and all queries invalidated:', targetPcs);
    },
    onError: (error: Error) => {
      logger.error('❌ Error updating production target:', error);
      if (onError) {
        onError(error.message || 'Gagal memperbarui target produksi');
      }
    },
  });

  // Action wrappers that return promises for backward compatibility
  const createCost = useCallback(async (data: CostFormData): Promise<boolean> => {
    if (!isAuthenticated) {
      logger.warn('🔐 Create cost attempted without authentication');
      if (onError) {
        onError('Silakan login terlebih dahulu');
      }
      return false;
    }

    return new Promise((resolve) => {
      createCostMutation.mutate(data, {
        onSuccess: (result) => {
          resolve(!!result); // Return true if result exists
        },
        onError: (error) => {
          logger.error('❌ Create cost failed:', error);
          resolve(false);
        }
      });
    });
  }, [isAuthenticated, createCostMutation, onError]);

  const updateCost = useCallback(async (id: string, data: Partial<CostFormData>): Promise<boolean> => {
    if (!isAuthenticated) {
      logger.warn('🔐 Update cost attempted without authentication');
      if (onError) {
        onError('Silakan login terlebih dahulu');
      }
      return false;
    }

    try {
      await updateCostMutation.mutateAsync({ id, data });
      return true;
    } catch (error) {
      logger.error('❌ Update cost failed:', error);
      return false;
    }
  }, [isAuthenticated, updateCostMutation, onError]);

  const deleteCost = useCallback(async (id: string): Promise<boolean> => {
    if (!isAuthenticated) {
      logger.warn('🔐 Delete cost attempted without authentication');
      if (onError) {
        onError('Silakan login terlebih dahulu');
      }
      return false;
    }

    try {
      await deleteCostMutation.mutateAsync(id);
      return true;
    } catch (error) {
      logger.error('❌ Delete cost failed:', error);
      return false;
    }
  }, [isAuthenticated, deleteCostMutation, onError]);

  const saveAllocationSettings = useCallback(async (data: AllocationFormData): Promise<boolean> => {
    if (!isAuthenticated) {
      logger.warn('🔐 Save allocation settings attempted without authentication');
      if (onError) {
        onError('Silakan login terlebih dahulu');
      }
      return false;
    }

    try {
      await saveAllocationMutation.mutateAsync(data);
      return true;
    } catch (error) {
      logger.error('❌ Save allocation settings failed:', error);
      return false;
    }
  }, [isAuthenticated, saveAllocationMutation, onError]);

  const updateProductionTarget = useCallback(async (targetPcs: number): Promise<boolean> => {
    if (!isAuthenticated) {
      logger.warn('🔐 Update production target attempted without authentication');
      if (onError) {
        onError('Silakan login terlebih dahulu');
      }
      return false;
    }

    try {
      await updateProductionTargetMutation.mutateAsync(targetPcs);
      return true;
    } catch (error) {
      logger.error('❌ Update production target failed:', error);
      return false;
    }
  }, [isAuthenticated, updateProductionTargetMutation, onError]);

  return {
    // Mutation objects
    mutations: {
      createCost: createCostMutation,
      updateCost: updateCostMutation,
      deleteCost: deleteCostMutation,
      saveAllocation: saveAllocationMutation,
      updateProductionTarget: updateProductionTargetMutation,
    },
    
    // Action functions (backward compatibility)
    actions: {
      createCost,
      updateCost,
      deleteCost,
      saveAllocationSettings,
      updateProductionTarget,
    },
    
    // Loading states
    loading: {
      creating: createCostMutation.isPending,
      updating: updateCostMutation.isPending,
      deleting: deleteCostMutation.isPending,
      savingAllocation: saveAllocationMutation.isPending,
      updatingTarget: updateProductionTargetMutation.isPending,
    },
  };
};