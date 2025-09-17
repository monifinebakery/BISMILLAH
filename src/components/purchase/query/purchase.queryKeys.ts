// src/components/purchase/query/purchase.queryKeys.ts
// Centralized query keys for purchases to ensure reuse and consistency

export const purchaseQueryKeys = {
  all: ['purchases'] as const,
  list: (userId?: string) => [...purchaseQueryKeys.all, 'list', userId] as const,
  stats: (userId?: string) => [...purchaseQueryKeys.all, 'stats', userId] as const,
  byStatus: (userId?: string, status?: string) => [...purchaseQueryKeys.all, 'byStatus', userId, status] as const,
} as const;

export type PurchaseQueryKey = ReturnType<typeof purchaseQueryKeys.list>;

