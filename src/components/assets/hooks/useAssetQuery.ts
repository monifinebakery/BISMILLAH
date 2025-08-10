// src/components/assets/hooks/useAssetQuery.ts

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAssetsQuery } from '../api/queries';
import { assetQueryKeys, subscribeToAssets } from '../api';
import { Asset } from '../types';

interface UseAssetQueryProps {
  userId: string | undefined;
  enableRealtime?: boolean;
}

interface UseAssetQueryReturn {
  assets: Asset[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isRefetching: boolean;
}

/**
 * Main hook for fetching assets with realtime updates
 */
export const useAssetQuery = ({ 
  userId, 
  enableRealtime = true 
}: UseAssetQueryProps): UseAssetQueryReturn => {
  const queryClient = useQueryClient();
  
  const {
    data: assets = [],
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useAssetsQuery(userId);

  // Setup realtime subscription
  useEffect(() => {
    if (!userId || !enableRealtime) return;

    const unsubscribe = subscribeToAssets(
      userId,
      // On Insert
      (newAsset: Asset) => {
        queryClient.setQueryData<Asset[]>(
          assetQueryKeys.list(),
          (oldAssets = []) => {
            // Check if asset already exists to prevent duplicates
            const exists = oldAssets.find(asset => asset.id === newAsset.id);
            if (exists) return oldAssets;
            
            return [newAsset, ...oldAssets];
          }
        );
        
        // Invalidate statistics
        queryClient.invalidateQueries({
          queryKey: assetQueryKeys.statistics()
        });
      },
      // On Update
      (updatedAsset: Asset) => {
        queryClient.setQueryData<Asset[]>(
          assetQueryKeys.list(),
          (oldAssets = []) =>
            oldAssets.map(asset =>
              asset.id === updatedAsset.id ? updatedAsset : asset
            )
        );
        
        // Update detail cache
        queryClient.setQueryData(
          assetQueryKeys.detail(updatedAsset.id),
          updatedAsset
        );
        
        // Invalidate statistics
        queryClient.invalidateQueries({
          queryKey: assetQueryKeys.statistics()
        });
      },
      // On Delete
      (deletedAssetId: string) => {
        queryClient.setQueryData<Asset[]>(
          assetQueryKeys.list(),
          (oldAssets = []) => oldAssets.filter(asset => asset.id !== deletedAssetId)
        );
        
        // Remove from detail cache
        queryClient.removeQueries({
          queryKey: assetQueryKeys.detail(deletedAssetId)
        });
        
        // Invalidate statistics
        queryClient.invalidateQueries({
          queryKey: assetQueryKeys.statistics()
        });
      }
    );

    return unsubscribe;
  }, [userId, enableRealtime, queryClient]);

  return {
    assets,
    isLoading,
    error: error as Error | null,
    refetch,
    isRefetching,
  };
};