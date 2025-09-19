// src/components/financial/utils/performanceOptimizations.ts
// Performance optimizations untuk financial module

import { useMemo, useCallback } from 'react';
import { logger } from '@/utils/logger';

/**
 * Debounce hook untuk mengurangi excessive API calls
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  return useCallback(
    (...args: Parameters<T>) => {
      const timeoutId = setTimeout(() => callback(...args), delay);
      return () => clearTimeout(timeoutId);
    },
    [callback, delay]
  ) as T;
};

/**
 * Memoized calculation untuk financial summary
 */
export const useMemoizedFinancialSummary = (transactions: any[]) => {
  return useMemo(() => {
    if (!transactions?.length) {
      return { totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 };
    }

    let totalIncome = 0;
    let totalExpense = 0;

    for (const transaction of transactions) {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount || 0;
      } else {
        totalExpense += transaction.amount || 0;
      }
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: transactions.length
    };
  }, [transactions]);
};

/**
 * Optimized filtering untuk large datasets
 */
export const useOptimizedTransactionFilter = (
  transactions: any[],
  dateRange?: { from: Date; to?: Date }
) => {
  return useMemo(() => {
    if (!transactions?.length) return [];
    
    if (!dateRange?.from) return transactions;

    const startTime = dateRange.from.getTime();
    const endTime = dateRange.to ? dateRange.to.getTime() : Date.now();

    return transactions.filter(transaction => {
      if (!transaction.date) return false;
      const transactionTime = new Date(transaction.date).getTime();
      return transactionTime >= startTime && transactionTime <= endTime;
    });
  }, [transactions, dateRange]);
};

/**
 * Performance monitor untuk development
 */
export const usePerformanceMonitor = (name: string) => {
  const startTime = performance.now();
  
  return useCallback(() => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (import.meta.env.DEV && duration > 100) {
      logger.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }
  }, [name, startTime]);
};

/**
 * Virtualization helper untuk large lists
 */
export const useVirtualization = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  return useMemo(() => {
    const visibleItems = Math.ceil(containerHeight / itemHeight) + 2; // Buffer
    
    return {
      totalItems: items.length,
      visibleItems: Math.min(visibleItems, items.length),
      itemHeight
    };
  }, [items.length, itemHeight, containerHeight]);
};

export default {
  useDebounce,
  useMemoizedFinancialSummary,
  useOptimizedTransactionFilter,
  usePerformanceMonitor,
  useVirtualization
};