// src/components/financial/hooks/useFinancialQueryKeys.ts
/**
 * Financial Query Keys
 * Standardized query keys for React Query
 */

export const financialQueryKeys = {
  all: ['financial'] as const,
  transactions: (userId?: string) => [...financialQueryKeys.all, 'transactions', userId] as const,
  // ✅ ADD: Additional keys for comprehensive functionality
  summary: (userId?: string, dateRange?: any) => [...financialQueryKeys.all, 'summary', userId, dateRange] as const,
  categories: (userId?: string) => [...financialQueryKeys.all, 'categories', userId] as const,
} as const;