// src/components/financial/hooks/useFinancialCore.ts
// ✅ FIXED - No circular dependencies, correct imports

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { startOfMonth, endOfDay } from 'date-fns';

// Context imports
import { useFinancial } from '../contexts/FinancialContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { useAuth } from '@/contexts/AuthContext';

// Import query keys for manual refresh
import { financialQueryKeys } from './useFinancialHooks';

// Utility imports - ✅ FIXED: Changed from financialUtils to financialCalculations
import { 
  filterByDateRange, 
  calculateTotalIncome, 
  calculateTotalExpense 
} from '../utils/financialCalculations';

export const useFinancialCore = () => {
  // Core context data
  const { 
    financialTransactions: transactions, 
    addFinancialTransaction, 
    updateFinancialTransaction, 
    deleteFinancialTransaction, 
    isLoading: financialLoading 
  } = useFinancial();
  
  const { settings, saveSettings, isLoading: settingsLoading } = useUserSettings();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Local state
  const [dateRange, setDateRange] = useState({ 
    from: startOfMonth(new Date()), 
    to: endOfDay(new Date()) 
  });
  
  // ✅ AUTO-REFRESH: Add state to track last refresh time
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ✅ CONSOLIDATED: Filtered transactions and calculations
  const financialData = useMemo(() => {
    const filteredTransactions = filterByDateRange(transactions, dateRange, 'date')
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

    const totalIncome = calculateTotalIncome(filteredTransactions);
    const totalExpense = calculateTotalExpense(filteredTransactions);
    const balance = totalIncome - totalExpense;

    return {
      filteredTransactions,
      totalIncome,
      totalExpense,
      balance,
      transactionCount: filteredTransactions.length
    };
  }, [transactions, dateRange]);

  // ✅ CONSOLIDATED: Transaction operations with error handling
  const transactionOperations = {
    add: useCallback(async (transactionData: any) => {
      try {
        const success = await addFinancialTransaction(transactionData);
        return { success, error: success ? null : 'Gagal menambah transaksi' };
      } catch (error) {
        return { success: false, error: 'Terjadi kesalahan saat menambah transaksi' };
      }
    }, [addFinancialTransaction]),

    update: useCallback(async (id: string, transactionData: any) => {
      try {
        const success = await updateFinancialTransaction(id, transactionData);
        return { success, error: success ? null : 'Gagal memperbarui transaksi' };
      } catch (error) {
        return { success: false, error: 'Terjadi kesalahan saat memperbarui transaksi' };
      }
    }, [updateFinancialTransaction]),

    delete: useCallback(async (id: string) => {
      try {
        const success = await deleteFinancialTransaction(id);
        return { success, error: success ? null : 'Gagal menghapus transaksi' };
      } catch (error) {
        return { success: false, error: 'Terjadi kesalahan saat menghapus transaksi' };
      }
    }, [deleteFinancialTransaction])
  };

  // ✅ AUTO-REFRESH: Manual refresh functionality
  const refreshOperations = {
    refresh: useCallback(async () => {
      if (!user?.id) return;
      
      try {
        setIsRefreshing(true);
        await queryClient.invalidateQueries({
          queryKey: financialQueryKeys.transactions(user.id)
        });
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Failed to refresh financial data:', error);
      } finally {
        setIsRefreshing(false);
      }
    }, [user?.id, queryClient]),
    
    forceRefresh: useCallback(async () => {
      if (!user?.id) return;
      
      try {
        setIsRefreshing(true);
        await queryClient.refetchQueries({
          queryKey: financialQueryKeys.transactions(user.id)
        });
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Failed to force refresh financial data:', error);
      } finally {
        setIsRefreshing(false);
      }
    }, [user?.id, queryClient])
  };

  // ✅ AUTO-REFRESH: Automatic refresh on mount
  useEffect(() => {
    if (user?.id) {
      refreshOperations.refresh();
    }
  }, [user?.id]); // Only run when user changes

  // ✅ CONSOLIDATED: Date range management
  const dateRangeOperations = {
    setDateRange: useCallback((range: { from: Date; to?: Date }) => {
      setDateRange(range);
    }, []),

    resetToCurrentMonth: useCallback(() => {
      setDateRange({ 
        from: startOfMonth(new Date()), 
        to: endOfDay(new Date()) 
      });
    }, [])
  };

  return {
    // Raw data
    transactions,
    
    // Processed data
    ...financialData,
    
    // State
    isLoading: financialLoading || settingsLoading,
    isRefreshing,
    dateRange,
    lastRefresh,
    
    // Transaction operations
    addTransaction: transactionOperations.add,
    updateTransaction: transactionOperations.update,
    deleteTransaction: transactionOperations.delete,
    
    // Refresh operations
    refresh: refreshOperations.refresh,
    forceRefresh: refreshOperations.forceRefresh,
    
    // Date management
    setDateRange: dateRangeOperations.setDateRange,
    resetToCurrentMonth: dateRangeOperations.resetToCurrentMonth,
    
    // Settings
    settings,
    saveSettings,
    
    // Computed flags
    hasTransactions: transactions.length > 0,
    hasFilteredTransactions: financialData.filteredTransactions.length > 0,
    isPositiveBalance: financialData.balance >= 0
  };
};