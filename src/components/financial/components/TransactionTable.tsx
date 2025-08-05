// src/components/financial/components/TransactionTable.tsx
// ✅ Fixed: Uses Supabase via financialApi, no REST fetch
import React, { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal, 
  RefreshCw, 
  AlertCircle,
  Trash2,
  Edit
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatUtils';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger';

// ✅ Import API functions from your existing service
import {
  getTransactionsByDateRange,
  deleteFinancialTransaction,
} from '../../services/financialApi';

// ✅ Types
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

interface TransactionTableProps {
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

// ✅ Query keys
const transactionQueryKeys = {
  all: ['financial'] as const,
  list: () => [...transactionQueryKeys.all, 'transactions'] as const,
  byRange: (from: Date, to?: Date) => 
    [...transactionQueryKeys.list(), 'range', from.toISOString(), to?.toISOString()] as const,
};

// ✅ Custom hook untuk transaction data — menggunakan financialApi langsung
const useTransactionData = (dateRange?: { from: Date; to?: Date }, userId?: string) => {
  const queryClient = useQueryClient();

  // Hanya fetch jika userId ada dan dateRange valid
  const enabled = !!userId && !!dateRange?.from;

  const {
    data: transactions = [],
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
    isRefetching,
  } = useQuery({
    queryKey: dateRange 
      ? transactionQueryKeys.byRange(dateRange.from, dateRange.to)
      : transactionQueryKeys.list(),
    queryFn: () => {
      if (!userId || !dateRange?.from) {
        return Promise.resolve([]);
      }
      return getTransactionsByDateRange(userId, dateRange.from, dateRange.to);
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 menit
    refetchInterval: 5 * 60 * 1000, // Refresh tiap 5 menit
    retry: 1,
  });

  // Mutation: Hapus transaksi
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFinancialTransaction(id),
    onSuccess: (response) => {
      if (response.success) {
        // Invalidate cache
        queryClient.invalidateQueries({ queryKey: transactionQueryKeys.list() });
        toast.success('Transaksi berhasil dihapus');
      } else {
        toast.error(response.error || 'Gagal menghapus transaksi');
      }
    },
    onError: (error: Error) => {
      logger.error('Failed to delete transaction:', error);
      toast.error(`Gagal menghapus transaksi: ${error.message}`);
    },
  });

  return {
    transactions,
    isLoading,
    error,
    refetch,
    isRefetching,
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : undefined,
    deleteTransaction: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
};

// ✅ Loading Skeleton
const TableSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }, (_, i) => (
      <div key={i} className="flex items-center space-x-4 p-4">
        <div className="bg-gray-200 rounded h-4 w-20 animate-pulse" />
        <div className="bg-gray-200 rounded h-4 w-48 animate-pulse" />
        <div className="bg-gray-200 rounded h-4 w-16 animate-pulse" />
        <div className="bg-gray-200 rounded h-4 w-20 animate-pulse" />
        <div className="bg-gray-200 rounded h-4 w-24 animate-pulse ml-auto" />
        <div className="bg-gray-200 rounded h-8 w-16 animate-pulse" />
      </div>
    ))}
  </div>
);

// ✅ Main Component
const TransactionTable: React.FC<TransactionTableProps> = ({ 
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Ambil userId dari context Auth (jika tersedia)
  const { useAuth } = require('@/contexts/AuthContext');
  const { user } = useAuth();

  // Gunakan data dari useQuery (Supabase) atau dari props
  const queryData = useTransactionData(dateRange, user?.id);
  const transactions = legacyTransactions || queryData.transactions;
  const isLoading = legacyIsLoading ?? queryData.isLoading;
  const onRefresh = legacyOnRefresh || queryData.refetch;
  const lastUpdated = queryData.lastUpdated;
  const isRefetching = queryData.isRefetching;

  // Pagination logic
  const currentTransactions = useMemo(() => {
    const firstItem = (currentPage - 1) * itemsPerPage;
    return transactions.slice(firstItem, firstItem + itemsPerPage);
  }, [transactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, transactions.length);

  // Reset page saat data berubah
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [transactions.length, totalPages, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const handlePreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleDelete = async (transaction: FinancialTransaction) => {
    if (!window.confirm(`Yakin ingin menghapus transaksi "${transaction.description}"?`)) return;

    try {
      if (onDeleteTransaction) {
        await onDeleteTransaction(transaction.id);
      } else {
        await queryData.deleteTransaction(transaction.id);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  // Tampilkan error hanya jika pakai query dan error
  if (queryData.error && !legacyTransactions) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h3 className="text-lg font-medium">Gagal Memuat Data</h3>
            <p className="text-sm text-gray-500">
              Terjadi kesalahan saat mengambil data transaksi
            </p>
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <CardTitle>Daftar Transaksi</CardTitle>
            {lastUpdated && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isRefetching}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isRefetching && "animate-spin")} />
              {isRefetching ? 'Memuat...' : 'Refresh'}
            </Button>
            {onAddTransaction && (
              <Button size="sm" onClick={onAddTransaction}>
                <Plus className="mr-2 h-4 w-4" />
                Transaksi Baru
              </Button>
            )}
          </div>
        </div>
        {lastUpdated && (
          <p className="text-xs text-gray-400">
            Terakhir diperbarui: {lastUpdated.toLocaleString('id-ID')}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTransactions.length > 0 ? (
                  currentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {transaction.date 
                          ? format(new Date(transaction.date), 'dd MMM yyyy', { locale: id })
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {transaction.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.category || 'Lainnya'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.type === 'income' ? 'default' : 'destructive'}
                          className={transaction.type === 'income' 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : ''
                          }
                        >
                          {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onEditTransaction && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => onEditTransaction(transaction)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(transaction)}
                            disabled={queryData.isDeleting}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-gray-400 mb-2">📊</div>
                        <p className="text-gray-500">
                          {dateRange ? 'Tidak ada transaksi pada rentang tanggal ini.' : 'Belum ada transaksi.'}
                        </p>
                        {onAddTransaction && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={onAddTransaction}
                            className="mt-2"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Transaksi Pertama
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {transactions.length > 0 && !isLoading && (
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-4">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div>
              Menampilkan {startItem}-{endItem} dari {transactions.length} transaksi
            </div>
            <div className="flex items-center gap-2">
              <span>Per halaman:</span>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(value) => setItemsPerPage(Number(value))}
              >
                <SelectTrigger className="w-16 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-3 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Sebelumnya
              </Button>

              <div className="flex items-center gap-1 mx-2">
                {getPageNumbers().map((pageNum) => (
                  <React.Fragment key={pageNum}>
                    {pageNum === 1 && currentPage > 3 && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          className="w-8 h-8 p-0"
                        >
                          1
                        </Button>
                        <div className="px-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </div>
                      </>
                    )}
                    <Button 
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                    {pageNum === totalPages && currentPage < totalPages - 2 && (
                      <>
                        <div className="px-2">
                          <MoreHorizontal className="h-4 w-4" />
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          className="w-8 h-8 p-0"
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="px-3 disabled:opacity-50"
              >
                Selanjutnya
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default TransactionTable;