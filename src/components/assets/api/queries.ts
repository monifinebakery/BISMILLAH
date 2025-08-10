// src/components/assets/api/queries.ts

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { Asset, AssetQueryOptions } from '../types';
import { assetQueryKeys } from './queryKeys';
import * as assetApi from './assetApi';

/**
 * Hook to fetch all assets
 */
export const useAssetsQuery = (
  userId: string | undefined,
  options?: AssetQueryOptions
) => {
  return useQuery({
    queryKey: assetQueryKeys.list(),
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return assetApi.getAssets(userId);
    },
    enabled: !!userId && (options?.enabled !== false),
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch single asset
 */
export const useAssetQuery = (
  id: string | undefined,
  userId: string | undefined,
  options?: AssetQueryOptions
) => {
  return useQuery({
    queryKey: assetQueryKeys.detail(id || ''),
    queryFn: () => {
      if (!id || !userId) throw new Error('Asset ID and User ID are required');
      return assetApi.getAsset(id, userId);
    },
    enabled: !!id && !!userId && (options?.enabled !== false),
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to search assets
 */
export const useSearchAssetsQuery = (
  userId: string | undefined,
  searchTerm: string,
  options?: AssetQueryOptions
) => {
  return useQuery({
    queryKey: assetQueryKeys.search(searchTerm),
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return assetApi.searchAssets(userId, searchTerm);
    },
    enabled: !!userId && searchTerm.length > 0 && (options?.enabled !== false),
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    staleTime: options?.staleTime ?? 2 * 60 * 1000, // 2 minutes for search
  });
};

/**
 * Hook to fetch assets by category
 */
export const useAssetsByCategoryQuery = (
  userId: string | undefined,
  category: string,
  options?: AssetQueryOptions
) => {
  return useQuery({
    queryKey: assetQueryKeys.list({ category }),
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return assetApi.getAssetsByCategory(userId, category);
    },
    enabled: !!userId && !!category && (options?.enabled !== false),
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch assets by condition
 */
export const useAssetsByConditionQuery = (
  userId: string | undefined,
  condition: string,
  options?: AssetQueryOptions
) => {
  return useQuery({
    queryKey: assetQueryKeys.list({ condition }),
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return assetApi.getAssetsByCondition(userId, condition);
    },
    enabled: !!userId && !!condition && (options?.enabled !== false),
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
  });
};