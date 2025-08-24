// src/components/financial/hooks/useTransactionTable.ts
import { useState, useCallback, useMemo } from 'react';
import type { FinancialTransaction } from './useTransactionBulk';

export const useTransactionTable = (transactions: FinancialTransaction[]) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Get selected transactions
  const selectedTransactions = useMemo(() => {
    return transactions.filter(transaction => selectedIds.includes(transaction.id));
  }, [transactions, selectedIds]);

  // Check if all transactions are selected
  const isAllSelected = useMemo(() => {
    return transactions.length > 0 && selectedIds.length === transactions.length;
  }, [transactions.length, selectedIds.length]);

  // Handle individual selection
  const handleSelectionChange = useCallback((transactionId: string, isSelected: boolean) => {
    setSelectedIds(prev => {
      if (isSelected) {
        return [...prev, transactionId];
      } else {
        return prev.filter(id => id !== transactionId);
      }
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map(transaction => transaction.id));
    }
  }, [transactions, isAllSelected]);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setIsSelectionMode(false);
  }, []);

  // Enter selection mode
  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  // Exit selection mode
  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  }, []);

  // Auto-enter selection mode when first item is selected
  const handleFirstSelection = useCallback((transactionId: string) => {
    setIsSelectionMode(true);
    setSelectedIds([transactionId]);
  }, []);

  return {
    // State
    selectedIds,
    selectedTransactions,
    isSelectionMode,
    isAllSelected,
    
    // Actions
    handleSelectionChange,
    handleSelectAll,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
    handleFirstSelection,
    
    // Computed
    hasSelection: selectedIds.length > 0,
    selectionCount: selectedIds.length,
  };
};

export type { FinancialTransaction };