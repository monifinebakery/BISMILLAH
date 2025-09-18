// src/components/assets/api/queryKeys.ts

export const assetQueryKeys = {
  // Base key
  all: ['assets'] as const,
  
  // Lists
  lists: () => [...assetQueryKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...assetQueryKeys.lists(), { filters }] as const,
  
  // Details
  details: () => [...assetQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetQueryKeys.details(), id] as const,
  
  // Statistics
  statistics: () => [...assetQueryKeys.all, 'statistics'] as const,
  
  // Search
  search: (query: string) => [...assetQueryKeys.all, 'search', query] as const,
  
  // Categories
  categories: () => [...assetQueryKeys.all, 'categories'] as const,
  
  // Conditions
  conditions: () => [...assetQueryKeys.all, 'conditions'] as const,
} as const;

export type AssetQueryKeys = typeof assetQueryKeys;
