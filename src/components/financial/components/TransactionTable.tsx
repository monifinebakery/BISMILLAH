import { useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Edit, Trash2, AlertCircle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/shared';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useSupplier } from '@/contexts/SupplierContext';
import { getSupplierName } from '@/utils/purchaseHelpers';
import { createSmartMemo } from '@/utils/performance/componentOptimizations';

import type { FinancialTransaction } from '../types/financial';
import { useTransactionData } from '../hooks/useTransactionData';
import TransactionTableToolbar from './transaction-table/TransactionTableToolbar';
import TransactionRows from './transaction-table/TransactionRows';
import TransactionPagination from './transaction-table/TransactionPagination';

interface TransactionTableProps {
  dateRange?: { from: Date; to?: Date };
  onEditTransaction?: (transaction: FinancialTransaction) => void;
  onAddTransaction?: () => void;
  onDeleteTransaction?: (id: string) => void;
  className?: string;
  transactions?: FinancialTransaction[];
  isLoading?: boolean;
  onRefresh?: () => void;
  selectedIds?: string[];
  onSelectionChange?: (transactionId: string, isSelected: boolean) => void;
  isSelectionMode?: boolean;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
}

const TransactionTableComponent = ({
  dateRange,
  onEditTransaction,
  onAddTransaction,
  onDeleteTransaction,
  className,
  transactions: legacyTransactions,
  isLoading: legacyIsLoading,
  onRefresh: legacyOnRefresh,
  selectedIds = [],
  onSelectionChange,
  isSelectionMode = false,
  onSelectAll,
  isAllSelected = false,
}: TransactionTableProps) => {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { suppliers } = useSupplier();

  const hasLegacyTransactions = Array.isArray(legacyTransactions);

  const initialItemsPerPage = useMemo(() => (isMobile ? 5 : 8), [isMobile]);

  const data = useTransactionData({
    dateRange,
    userId: user?.id,
    useServerPagination: !hasLegacyTransactions,
    initialItemsPerPage,
    legacyData: hasLegacyTransactions
      ? {
          transactions: legacyTransactions ?? [],
          isLoading: legacyIsLoading,
          onRefresh: legacyOnRefresh,
        }
      : undefined,
  });

  const {
    transactions,
    visibleTransactions,
    paginationInfo,
    totalItems,
    totalPages,
    startItem,
    endItem,
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    handlePageChange,
    handleNextPage,
    handlePreviousPage,
    isRefetching,
    showInitialLoading,
    showBackgroundLoading,
    onRefresh,
    lastUpdated,
    deleteTransaction,
    isDeleting,
    error,
    hasTransactions,
  } = data;

  const getDisplayDescription = useCallback(
    (description: string | null): string => {
      if (!description) return '-';

      const purchasePattern = /Pembelian dari\s+(.+)/;
      const match = description.match(purchasePattern);

      if (match && match[1]) {
        const supplierId = match[1];
        const supplierName = getSupplierName(supplierId, suppliers);
        return `Pembelian dari ${supplierName}`;
      }

      return description;
    },
    [suppliers],
  );

  const handleDeleteTransaction = useCallback(
    async (transaction: FinancialTransaction) => {
      if (!window.confirm(`Yakin ingin menghapus transaksi "${transaction.description}"?`)) {
        return;
      }

      if (onDeleteTransaction) {
        await onDeleteTransaction(transaction.id);
        return;
      }

      await deleteTransaction(transaction.id);
    },
    [deleteTransaction, onDeleteTransaction],
  );

  if (error && !hasLegacyTransactions) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h3 className="text-lg font-medium">Gagal Memuat Data</h3>
            <p className="text-sm text-gray-500">Terjadi kesalahan saat mengambil data transaksi</p>
            <Button onClick={onRefresh} variant="outline">
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <TransactionTableToolbar
        lastUpdated={lastUpdated}
        onRefresh={onRefresh}
        isRefreshing={isRefetching}
        onAddTransaction={onAddTransaction}
        paginationInfo={paginationInfo}
      />
      <CardContent className="p-0">
        {showInitialLoading ? (
          <div className="p-4">
            <div className="flex items-center justify-center p-4">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table role="table" aria-label="Financial transactions table">
              <TransactionRows
                transactions={visibleTransactions}
                selectedIds={selectedIds}
                isSelectionMode={isSelectionMode}
                isAllSelected={isAllSelected}
                onSelectAll={onSelectAll}
                onSelectionChange={onSelectionChange}
                onEditTransaction={onEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                isDeleting={isDeleting}
                getDisplayDescription={getDisplayDescription}
                dateRange={dateRange}
                onAddTransaction={onAddTransaction}
              />
            </Table>
          </div>
        )}

        {/* Mobile Card View */}
        {!showInitialLoading && isMobile && visibleTransactions.length > 0 && (
          <div className="md:hidden space-y-3 p-4">
            {visibleTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
                role="row"
                aria-label={`Transaction: ${getDisplayDescription(transaction.description)} - ${formatCurrency(transaction.amount)}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {isSelectionMode && (
                        <Checkbox
                          checked={selectedIds.includes(transaction.id)}
                          onCheckedChange={() => onSelectionChange?.(transaction.id, !selectedIds.includes(transaction.id))}
                          aria-label={`Select transaction ${getDisplayDescription(transaction.description)}`}
                          className="flex-shrink-0"
                        />
                      )}
                      <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} className="text-xs">
                        {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {transaction.category}
                      </Badge>
                    </div>
                    <h4 className="font-medium text-gray-900 truncate mb-1">
                      {getDisplayDescription(transaction.description)}
                    </h4>
                    <div className="text-sm text-gray-500">
                      {transaction.date ? (() => {
                        try {
                          const date = new Date(transaction.date);
                          if (!Number.isNaN(date.getTime())) {
                            return format(date, 'dd MMM yyyy', { locale: id });
                          }
                        } catch (error) {
                          // Ignore date parsing errors
                        }
                        return 'Tanggal tidak valid';
                      })() : 'Tanggal tidak tersedia'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                    <div className="text-right">
                      <div className={`font-bold text-lg ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end pt-2 border-t border-gray-100 gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditTransaction?.(transaction)}
                    disabled={isDeleting}
                    className="h-9 w-9 p-0 hover:bg-blue-50 active:bg-blue-100"
                    aria-label={`Edit transaction ${getDisplayDescription(transaction.description)}`}
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTransaction(transaction)}
                    disabled={isDeleting}
                    className="h-9 w-9 p-0 hover:bg-red-50 active:bg-red-100"
                    aria-label={`Delete transaction ${getDisplayDescription(transaction.description)}`}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {hasTransactions && !showInitialLoading && (
        <TransactionPagination
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          startItem={startItem}
          endItem={endItem}
          onPageChange={handlePageChange}
          onNextPage={handleNextPage}
          onPreviousPage={handlePreviousPage}
        />
      )}

      {showBackgroundLoading && (
        <div className="px-4 pb-4 text-xs text-muted-foreground">Memuat pembaruan terbaru...</div>
      )}

      {import.meta.env.DEV && (
        <div className="p-2 text-xs text-gray-500 border border-gray-200 bg-gray-50 rounded mt-4">
          <div className="flex justify-between items-center">
            <span>🚀 Optimized TransactionTable Performance Stats:</span>
            <div className="flex gap-4">
              <span>Transactions: {totalItems}</span>
              <span>Page: {currentPage}/{Math.max(totalPages, 1)}</span>
              <span>Memoized rows: {visibleTransactions.length}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

const TransactionTable = createSmartMemo(TransactionTableComponent, ['transactions', 'dateRange'], 'TransactionTable');

export default TransactionTable;
