// src/components/assets/hooks/useAssetMutations.ts

import { useCreateAssetMutation, useUpdateAssetMutation, useDeleteAssetMutation } from '../api/mutations';
import { AssetCreateInput, AssetUpdateInput } from '../types';

interface UseAssetMutationsProps {
  userId: string;
  onSuccess?: {
    onCreate?: (assetName: string) => void;
    onUpdate?: (assetName: string) => void;
    onDelete?: (assetName: string) => void;
  };
  onError?: {
    onCreate?: (error: Error) => void;
    onUpdate?: (error: Error) => void;
    onDelete?: (error: Error) => void;
  };
}

interface UseAssetMutationsReturn {
  createAsset: (asset: AssetCreateInput) => Promise<void>;
  updateAsset: (id: string, asset: AssetUpdateInput) => Promise<void>;
  deleteAsset: (id: string, name?: string) => Promise<void>;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isLoading: boolean;
}

/**
 * Hook for asset mutations with custom callbacks
 */
export const useAssetMutations = ({
  userId,
  onSuccess,
  onError,
}: UseAssetMutationsProps): UseAssetMutationsReturn => {
  const createMutation = useCreateAssetMutation(userId);
  const updateMutation = useUpdateAssetMutation(userId);
  const deleteMutation = useDeleteAssetMutation(userId);

  const createAsset = async (asset: AssetCreateInput): Promise<void> => {
    try {
      const result = await createMutation.mutateAsync(asset);
      onSuccess?.onCreate?.(result.nama);
    } catch (error) {
      onError?.onCreate?.(error as Error);
      throw error;
    }
  };

  const updateAsset = async (id: string, asset: AssetUpdateInput): Promise<void> => {
    try {
      const result = await updateMutation.mutateAsync({ id, asset });
      onSuccess?.onUpdate?.(result.nama);
    } catch (error) {
      onError?.onUpdate?.(error as Error);
      throw error;
    }
  };

  const deleteAsset = async (id: string, name?: string): Promise<void> => {
    try {
      await deleteMutation.mutateAsync({ id, name });
      onSuccess?.onDelete?.(name || 'Aset');
    } catch (error) {
      onError?.onDelete?.(error as Error);
      throw error;
    }
  };

  return {
    createAsset,
    updateAsset,
    deleteAsset,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
};