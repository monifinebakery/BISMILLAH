// src/components/purchase/hooks/usePurchaseStats.ts

import { useMemo } from 'react';
import { Purchase, PurchaseStats, UsePurchaseStatsReturn } from '../types/purchase.types';
import { calculatePurchaseStats } from '../utils/purchaseHelpers';

/**
 * Hook to calculate purchase statistics with memoization
 */
export const usePurchaseStats = (purchases: Purchase[]): UsePurchaseStatsReturn => {
  // Calculate stats with memoization for performance
  const stats = useMemo(() => {
    return calculatePurchaseStats(purchases);
  }, [purchases]);

  // Track if calculation is in progress (for large datasets)
  const isCalculating = useMemo(() => {
    return purchases.length > 1000; // Show loading for large datasets
  }, [purchases.length]);

  return {
    stats,
    isCalculating,
  };
};