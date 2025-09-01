// src/components/financial/hooks/useTransactionFilters.ts
import { useState, useCallback, useMemo } from 'react';

interface FinancialTransaction {
  id: string;
  date: Date | string | null;
  description: string | null;
  amount: number;
  type: 'income' | 'expense';
  category: string | null;
  userId?: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
}

export interface TransactionFilters {
  type: 'all' | 'income' | 'expense';
  category: string; // 'all' or specific category name
  search: string;
}

export interface UseTransactionFiltersReturn {
  // Filter state
  filters: TransactionFilters;
  updateFilters: (newFilters: Partial<TransactionFilters>) => void;
  clearFilters: () => void;
  
  // Filter functions
  filteredTransactions: FinancialTransaction[];
  availableCategories: string[];
  hasActiveFilters: boolean;
  
  // Bulk selection state
  selectedIds: string[];
  isSelectionMode: boolean;
  isAllSelected: boolean;
  
  // Bulk selection actions
  toggleSelection: (id: string) => void;
  toggleAllSelection: (transactions: FinancialTransaction[]) => void;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  clearSelection: () => void;
}

const DEFAULT_FILTERS: TransactionFilters = {
  type: 'all',
  category: 'all',
  search: '',
};

export const useTransactionFilters = (
  transactions: FinancialTransaction[]
): UseTransactionFiltersReturn => {
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Get available categories from transactions
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    transactions.forEach(transaction => {
      if (transaction.category) {
        categories.add(transaction.category);
      }
    });
    return Array.from(categories).sort();
  }, [transactions]);

  // Filter transactions based on current filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Type filter
      if (filters.type !== 'all' && transaction.type !== filters.type) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && transaction.category !== filters.category) {
        return false;
      }

      // Search filter
      if (filters.search.trim()) {
        const searchLower = filters.search.toLowerCase();
        const description = transaction.description?.toLowerCase() || '';
        const category = transaction.category?.toLowerCase() || '';
        
        if (!description.includes(searchLower) && !category.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      filters.type !== 'all' ||
      filters.category !== 'all' ||
      filters.search.trim() !== ''
    );
  }, [filters]);

  // Selection logic
  const isAllSelected = useMemo(() => {
    return filteredTransactions.length > 0 && 
           filteredTransactions.every(t => selectedIds.includes(t.id));
  }, [filteredTransactions, selectedIds]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  }, []);

  const toggleAllSelection = useCallback((transactions: FinancialTransaction[]) => {
    const allIds = transactions.map(t => t.id);
    const allSelected = allIds.every(id => selectedIds.includes(id));
    
    if (allSelected) {
      // Deselect all from current view
      setSelectedIds(prev => prev.filter(id => !allIds.includes(id)));
    } else {
      // Select all in current view
      setSelectedIds(prev => {
        const newIds = [...prev];
        allIds.forEach(id => {
          if (!newIds.includes(id)) {
            newIds.push(id);
          }
        });
        return newIds;
      });
    }
  }, [selectedIds]);

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    filters,
    updateFilters,
    clearFilters,
    filteredTransactions,
    availableCategories,
    hasActiveFilters,
    selectedIds,
    isSelectionMode,
    isAllSelected,
    toggleSelection,
    toggleAllSelection,
    enterSelectionMode,
    exitSelectionMode,
    clearSelection,
  };
};
