// src/components/assets/api/mutations.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AssetCreateInput, AssetUpdateInput, Asset } from '../types';
import { assetQueryKeys } from './queryKeys';
import * as assetApi from './assetApi';

/**
 * Hook to create asset
 */
export const useCreateAssetMutation = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (asset: AssetCreateInput) => assetApi.createAsset(userId, asset),
    onSuccess: (newAsset: Asset) => {
      // Update the assets list cache
      queryClient.setQueryData<Asset[]>(
        assetQueryKeys.list(),
        (oldAssets = []) => [newAsset, ...oldAssets]
      );

      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: assetQueryKeys.lists()
      });
      
      queryClient.invalidateQueries({
        queryKey: assetQueryKeys.statistics()
      });

      toast.success(`Aset ${newAsset.nama} berhasil ditambahkan!`);
    },
    onError: (error: Error) => {
      console.error('Error creating asset:', error);
      toast.error(`Gagal menambahkan aset: ${error.message}`);
    },
  });
};

/**
 * Hook to update asset
 */
export const useUpdateAssetMutation = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, asset }: { id: string; asset: AssetUpdateInput }) =>
      assetApi.updateAsset(id, userId, asset),
    onSuccess: (updatedAsset: Asset) => {
      // Update the asset in the list cache
      queryClient.setQueryData<Asset[]>(
        assetQueryKeys.list(),
        (oldAssets = []) =>
          oldAssets.map(asset =>
            asset.id === updatedAsset.id ? updatedAsset : asset
          )
      );

      // Update the specific asset cache
      queryClient.setQueryData(
        assetQueryKeys.detail(updatedAsset.id),
        updatedAsset
      );

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: assetQueryKeys.lists()
      });
      
      queryClient.invalidateQueries({
        queryKey: assetQueryKeys.statistics()
      });

      toast.success(`Aset ${updatedAsset.nama} berhasil diperbarui!`);
    },
    onError: (error: Error) => {
      console.error('Error updating asset:', error);
      toast.error(`Gagal memperbarui aset: ${error.message}`);
    },
  });
};

/**
 * Hook to delete asset
 */
export const useDeleteAssetMutation = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) => {
      return assetApi.deleteAsset(id, userId).then(() => ({ id, name }));
    },
    onSuccess: ({ id, name }) => {
      // Remove asset from the list cache
      queryClient.setQueryData<Asset[]>(
        assetQueryKeys.list(),
        (oldAssets = []) => oldAssets.filter(asset => asset.id !== id)
      );

      // Remove the specific asset cache
      queryClient.removeQueries({
        queryKey: assetQueryKeys.detail(id)
      });

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: assetQueryKeys.lists()
      });
      
      queryClient.invalidateQueries({
        queryKey: assetQueryKeys.statistics()
      });

      toast.success(`Aset ${name || ''} berhasil dihapus!`);
    },
    onError: (error: Error) => {
      console.error('Error deleting asset:', error);
      toast.error(`Gagal menghapus aset: ${error.message}`);
    },
  });
};

/**
 * Hook for optimistic updates
 */
export const useOptimisticAssetMutation = (userId: string) => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (asset: AssetCreateInput) => assetApi.createAsset(userId, asset),
    onMutate: async (newAsset) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: assetQueryKeys.list() });

      // Snapshot the previous value
      const previousAssets = queryClient.getQueryData<Asset[]>(assetQueryKeys.list());

      // Optimistically update the cache
      const optimisticAsset: Asset = {
        id: `temp-${Date.now()}`,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...newAsset,
      };

      queryClient.setQueryData<Asset[]>(
        assetQueryKeys.list(),
        (old = []) => [optimisticAsset, ...old]
      );

      return { previousAssets };
    },
    onError: (err, newAsset, context) => {
      // Rollback on error
      if (context?.previousAssets) {
        queryClient.setQueryData(assetQueryKeys.list(), context.previousAssets);
      }
      toast.error(`Gagal menambahkan aset: ${err.message}`);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.list() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, asset }: { id: string; asset: AssetUpdateInput }) =>
      assetApi.updateAsset(id, userId, asset),
    onMutate: async ({ id, asset }) => {
      await queryClient.cancelQueries({ queryKey: assetQueryKeys.list() });
      await queryClient.cancelQueries({ queryKey: assetQueryKeys.detail(id) });

      const previousAssets = queryClient.getQueryData<Asset[]>(assetQueryKeys.list());
      const previousAsset = queryClient.getQueryData<Asset>(assetQueryKeys.detail(id));

      // Optimistically update
      if (previousAssets) {
        queryClient.setQueryData<Asset[]>(
          assetQueryKeys.list(),
          previousAssets.map(a =>
            a.id === id ? { ...a, ...asset, updatedAt: new Date() } : a
          )
        );
      }

      if (previousAsset) {
        queryClient.setQueryData(
          assetQueryKeys.detail(id),
          { ...previousAsset, ...asset, updatedAt: new Date() }
        );
      }

      return { previousAssets, previousAsset };
    },
    onError: (err, { id }, context) => {
      if (context?.previousAssets) {
        queryClient.setQueryData(assetQueryKeys.list(), context.previousAssets);
      }
      if (context?.previousAsset) {
        queryClient.setQueryData(assetQueryKeys.detail(id), context.previousAsset);
      }
      toast.error(`Gagal memperbarui aset: ${err.message}`);
    },
    onSettled: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.detail(id) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) =>
      assetApi.deleteAsset(id, userId).then(() => ({ id, name })),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: assetQueryKeys.list() });

      const previousAssets = queryClient.getQueryData<Asset[]>(assetQueryKeys.list());

      // Optimistically remove
      queryClient.setQueryData<Asset[]>(
        assetQueryKeys.list(),
        (old = []) => old.filter(asset => asset.id !== id)
      );

      return { previousAssets };
    },
    onError: (err, { id }, context) => {
      if (context?.previousAssets) {
        queryClient.setQueryData(assetQueryKeys.list(), context.previousAssets);
      }
      toast.error(`Gagal menghapus aset: ${err.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: assetQueryKeys.list() });
    },
  });

  return {
    createAsset: createMutation,
    updateAsset: updateMutation,
    deleteAsset: deleteMutation,
  };
};