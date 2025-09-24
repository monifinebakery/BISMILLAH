import { useCallback, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Edit, Trash2, AlertCircle, ChevronDown, ChevronRight, MoreVertical } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { cn } from '@/lib/utils';
import { formatPercentage } from '@/lib/shared';
import { useCurrency } from '@/contexts/CurrencyContext';
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

// ✅ NEW: Transaction Row Actions Component
const TransactionRowActions: React.FC<{
  transaction: FinancialTransaction;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}> = ({ transaction, onEdit, onDelete, disabled = false }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={disabled}>
          <span className="sr-only">Open menu</span>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi ini?`)) {
              onDelete();
            }
          }}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Hapus</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ✅ NEW: Mobile Transaction Row Component with expandable details
const MobileTransactionRow: React.FC<{
  transaction: FinancialTransaction;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelectionChange?: (transactionId: string, isSelected: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}> = ({
  transaction,
  isSelected,
  isSelectionMode,
  onSelectionChange,
  onEdit,
  onDelete,
  isDeleting
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getDisplayDescription = (description: string | null): string => {
    return description || 'Tanpa deskripsi';
  };

  const formatTransactionDate = (date: Date | string | null): string => {
    if (!date) return 'Tanggal tidak tersedia';

    try {
      const dateObj = new Date(date);
      if (!Number.isNaN(dateObj.getTime())) {
        return format(dateObj, 'dd MMM yyyy', { locale: id });
      }
    } catch (error) {
      // Ignore date parsing errors
    }
    return 'Tanggal tidak valid';
  };

  return (
    <div
      className={`
        border rounded-lg overflow-hidden transition-all duration-200
        ${isSelected ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'}
        ${transaction.type === 'expense' ? 'border-red-200 bg-red-50' : ''}
        ${transaction.type === 'income' ? 'border-green-200 bg-green-50' : ''}
      `}
    >
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {isSelectionMode && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelectionChange?.(transaction.id, checked === true)}
                aria-label={`Select transaction ${getDisplayDescription(transaction.description)}`}
                className="mt-1 flex-shrink-0"
              />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} className="text-xs">
                      {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {transaction.category}
                    </Badge>
                  </div>
                  <h3 className="font-medium text-gray-900 truncate">
                    {getDisplayDescription(transaction.description)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatTransactionDate(transaction.date)}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  {!isSelectionMode && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-1 rounded hover:bg-gray-100 transition-colors"
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} details`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  )}
                  <div className="text-right">
                    <div className={`font-bold text-lg ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isSelectionMode && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                disabled={isDeleting}
                className="flex-1 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi ini?`)) {
                    onDelete();
                  }
                }}
                disabled={isDeleting}
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Hapus
              </Button>
            </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">ID Transaksi:</span>
              <span className="font-medium text-gray-900">{transaction.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">User ID:</span>
              <span className="font-medium text-gray-900">{transaction.userId.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tipe:</span>
              <span className={`font-medium ${transaction.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kategori:</span>
              <span className="font-medium text-gray-900">{transaction.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Jumlah:</span>
              <span className={`font-medium ${transaction.type === 'income' ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(Math.abs(transaction.amount))}
              </span>
            </div>
            {transaction.relatedId && (
              <div className="flex justify-between">
                <span className="text-gray-500">Related ID:</span>
                <span className="font-medium text-gray-900">{transaction.relatedId.slice(0, 8)}...</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-300">
              <span className="text-gray-500">Dibuat:</span>
              <span className="font-medium text-gray-900">
                {transaction.createdAt ? formatTransactionDate(transaction.createdAt) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Diperbarui:</span>
              <span className="font-medium text-gray-900">
                {transaction.updatedAt ? formatTransactionDate(transaction.updatedAt) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TransactionTableCore: React.FC<TransactionTableProps> = ({
  onEdit,
  onDelete,
  onStatusChange,
  validateStatusChange,
  dateRange,
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
          <>
            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden md:block">
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
            </div>

            {/* ✅ FULLY RESPONSIVE Mobile Card View - Like OrderTable */}
            <div className="block md:hidden">
              {visibleTransactions.length > 0 ? (
                <div className="space-y-3 p-4">
                  {visibleTransactions.map((transaction) => (
                    <MobileTransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      isSelected={selectedIds.includes(transaction.id)}
                      isSelectionMode={isSelectionMode}
                      onSelectionChange={onSelectionChange}
                      onEdit={() => onEditTransaction?.(transaction)}
                      onDelete={() => handleDeleteTransaction(transaction)}
                      isDeleting={isDeleting}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-gray-400 mb-2">📊</div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">Tidak ada transaksi</h3>
                  <p className="text-xs text-gray-500">Belum ada transaksi untuk ditampilkan</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>

      {/* ✅ RESPONSIVE PAGINATION CONTROLS - like OrderTable */}
      {totalPages > 1 && !showInitialLoading && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 py-3 border-t">
          <div className="text-sm text-gray-700 text-center sm:text-left">
            <span className="sm:hidden">
              {startItem}-{endItem} / {totalItems}
            </span>
            <span className="hidden sm:inline">
              Menampilkan {startItem} - {endItem} dari {totalItems} transaksi
            </span>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              Sebelumnya
            </button>

            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-sm font-medium">
              {currentPage}
            </span>

            <button
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Selanjutnya
            </button>
          </div>
        </div>
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
