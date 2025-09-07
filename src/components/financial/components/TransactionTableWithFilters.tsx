// src/components/financial/components/TransactionTableWithFilters.tsx
// Enhanced TransactionTable with filters and bulk delete functionality

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  CheckSquare, 
  Square, 
  Settings,
  RefreshCw 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

import { useTransactionFilters } from '../hooks/useTransactionFilters';
import TransactionFiltersComponent from './TransactionFilters';
import TransactionBulkActions from './TransactionBulkActions';
import TransactionTable from './TransactionTable';

import {
  getTransactionsByDateRange,
  getFinancialTransactionsPaginated,
  bulkDeleteFinancialTransactions,
} from '../services/financialApi';

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

interface TransactionTableWithFiltersProps {
  dateRange?: { from: Date; to?: Date };
  onEditTransaction?: (transaction: FinancialTransaction) => void;
  onAddTransaction?: () => void;
  onDeleteTransaction?: (id: string) => void;
  className?: string;
  // Legacy props for backward compatibility
  transactions?: FinancialTransaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

const TransactionTableWithFilters: React.FC<TransactionTableWithFiltersProps> = ({
  dateRange,
  onEditTransaction,
  onAddTransaction,
  onDeleteTransaction,
  className,
  // Legacy props
  transactions: legacyTransactions,
  isLoading: legacyIsLoading,
  onRefresh: legacyOnRefresh,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Query for transactions data
  const { data: transactions = [], isLoading, refetch } = useQuery({
    queryKey: ['financial', 'transactions', user?.id, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      if (!user?.id) return [];
      
      if (dateRange?.from && dateRange?.to) {
        return await getTransactionsByDateRange(user.id, dateRange.from, dateRange.to);
      }
      
      // Get all transactions if no date range specified
      const result = await getFinancialTransactionsPaginated(user.id, { limit: 1000 });
      return result.data;
    },
    enabled: !!user?.id && !legacyTransactions, // Only query if not using legacy props
  });

  // Use filter hook
  const filterHook = useTransactionFilters(legacyTransactions || transactions);
  
  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user?.id) throw new Error('User not authenticated');
      return await bulkDeleteFinancialTransactions(ids, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      if (legacyOnRefresh) legacyOnRefresh();
      else refetch();
    },
    onError: (error: Error) => {
      logger.error('Bulk delete failed:', error);
      toast.error(`Gagal menghapus transaksi: ${error.message}`);
    },
  });

  const handleBulkDelete = async (ids: string[]) => {
    await bulkDeleteMutation.mutateAsync(ids);
  };

  const selectedTransactions = filterHook.selectedIds
    .map(id => filterHook.filteredTransactions.find(t => t.id === id))
    .filter(Boolean) as FinancialTransaction[];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <TransactionFiltersComponent
        filters={filterHook.filters}
        availableCategories={filterHook.availableCategories}
        hasActiveFilters={filterHook.hasActiveFilters}
        onUpdateFilters={filterHook.updateFilters}
        onClearFilters={filterHook.clearFilters}
      />

      {/* Selection Mode Toggle */}
      {!filterHook.isSelectionMode && filterHook.filteredTransactions.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {filterHook.hasActiveFilters && (
              <span>
                Menampilkan {filterHook.filteredTransactions.length} dari{' '}
                {(legacyTransactions || transactions).length} transaksi
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={filterHook.enterSelectionMode}
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Mode Pilih
          </Button>
        </div>
      )}

      {/* Bulk Actions */}
      {filterHook.isSelectionMode && (
        <TransactionBulkActions
          selectedIds={filterHook.selectedIds}
          selectedTransactions={selectedTransactions}
          isAllSelected={filterHook.isAllSelected}
          totalCount={filterHook.filteredTransactions.length}
          onSelectAll={() => filterHook.toggleAllSelection(filterHook.filteredTransactions)}
          onClearSelection={filterHook.clearSelection}
          onBulkDelete={handleBulkDelete}
          onExitSelectionMode={filterHook.exitSelectionMode}
        />
      )}

      {/* Transaction Table */}
      <TransactionTable
        dateRange={dateRange}
        onEditTransaction={onEditTransaction}
        onAddTransaction={onAddTransaction}
        onDeleteTransaction={onDeleteTransaction}
        className={className}
        transactions={filterHook.filteredTransactions}
        isLoading={legacyIsLoading ?? isLoading}
        onRefresh={legacyOnRefresh || refetch}
        selectedIds={filterHook.selectedIds}
        onSelectionChange={filterHook.toggleSelection}
        isSelectionMode={filterHook.isSelectionMode}
        onSelectAll={() => filterHook.toggleAllSelection(filterHook.filteredTransactions)}
        isAllSelected={filterHook.isAllSelected}
      />
    </div>
  );
};

export default TransactionTableWithFilters;
