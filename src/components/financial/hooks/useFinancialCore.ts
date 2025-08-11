// src/components/financial/hooks/useFinancialCore.ts
// ✅ FIXED - No circular dependencies, correct imports

import { useMemo, useCallback, useState } from 'react';
import { startOfMonth, endOfDay } from 'date-fns';

// Context imports
import { useFinancial } from '../contexts/FinancialContext';
import { useUserSettings } from '@/contexts/UserSettingsContext';

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

  // Local state
  const [dateRange, setDateRange] = useState({ 
    from: startOfMonth(new Date()), 
    to: endOfDay(new Date()) 
  });

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
    dateRange,
    
    // Transaction operations
    addTransaction: transactionOperations.add,
    updateTransaction: transactionOperations.update,
    deleteTransaction: transactionOperations.delete,
    
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