import React, { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { SafeSuspense } from '@/components/common/UniversalErrorBoundary';

const BulkActions = React.lazy(() => 
  import('../components/BulkActions').catch(() => ({ default: () => null }))
);

const TransactionTable = React.lazy(() => 
  import('../components/TransactionTable').catch((error) => {
    console.error('Failed to load TransactionTable', error);
    return { default: () => null };
  })
);

const FallbackSpinner = () => (
  <div className="min-h-[120px] flex items-center justify-center">
    <div className="h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full motion-safe:animate-spin" />
    <span className="sr-only">Memuat…</span>
  </div>
);

interface TransactionsTabProps {
  filteredTransactions: any[];
  isLoading: boolean;
  // selection/bulk props
  isSelectionMode: boolean;
  selectedTransactions: any[];
  selectedIds: string[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  onSelectionChange: (id: string) => void;
  // actions
  onEditTransaction: (t: any) => void;
  onAddTransaction: () => void;
  onDeleteTransaction: (id: string) => Promise<boolean> | void;
  dateRange?: { from: Date; to?: Date };
}

const TransactionsTab: React.FC<TransactionsTabProps> = ({
  filteredTransactions,
  isLoading,
  isSelectionMode,
  selectedTransactions,
  selectedIds,
  onClearSelection,
  onSelectAll,
  isAllSelected,
  onSelectionChange,
  onEditTransaction,
  onAddTransaction,
  onDeleteTransaction,
  dateRange
}) => {
  return (
    <div className="space-y-6">
      {isSelectionMode && (
        <SafeSuspense loadingMessage="Memuat bulk actions...">
          <BulkActions
            selectedTransactions={selectedTransactions}
            selectedIds={selectedIds}
            onClearSelection={onClearSelection}
            onSelectAll={onSelectAll}
            isAllSelected={isAllSelected}
            totalCount={filteredTransactions.length}
          />
        </SafeSuspense>
      )}

      <Suspense fallback={<FallbackSpinner />}>
        <TransactionTable
          transactions={filteredTransactions}
          onEditTransaction={onEditTransaction}
          onAddTransaction={onAddTransaction}
          onDeleteTransaction={onDeleteTransaction as any}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          isSelectionMode={isSelectionMode}
          onSelectAll={onSelectAll}
          isAllSelected={isAllSelected}
          dateRange={dateRange}
        />
      </Suspense>
    </div>
  );
};

export default TransactionsTab;