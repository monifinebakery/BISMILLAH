// src/components/financial/components/VirtualTransactionTable.tsx
// Virtual scrolling implementation for large transaction datasets
import React, { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  RefreshCw,
  AlertCircle,
  Trash2,
  Edit,
  TrendingUp,
  TrendingDown,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatUtils';
import { cn } from '@/lib/utils';
import VirtualTable from '@/components/ui/VirtualTable';
import VirtualList from '@/components/ui/VirtualList';

// Import VirtualTableColumn type
interface VirtualTableColumn<T> {
  key: string;
  header: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  render: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}
import { useAuth } from '@/contexts/AuthContext';
import { deleteFinancialTransaction } from '../services/financialApi';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Types
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

interface VirtualTransactionTableProps {
  transactions: FinancialTransaction[];
  onEditTransaction?: (transaction: FinancialTransaction) => void;
  onAddTransaction?: () => void;
  onDeleteTransaction?: (id: string) => void;
  className?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  // Bulk operations props
  selectedIds?: string[];
  onSelectionChange?: (transactionId: string, isSelected: boolean) => void;
  isSelectionMode?: boolean;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
  // Virtual scrolling props
  itemHeight?: number;
  containerHeight?: number;
  // Sorting props
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
}

const VirtualTransactionTable: React.FC<VirtualTransactionTableProps> = ({
  transactions,
  onEditTransaction,
  onAddTransaction,
  onDeleteTransaction,
  className,
  isLoading = false,
  onRefresh,
  selectedIds = [],
  onSelectionChange,
  isSelectionMode = false,
  onSelectAll,
  isAllSelected = false,
  itemHeight = 80,
  containerHeight = 600,
  sortKey,
  sortDirection,
  onSort,
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteFinancialTransaction,
    onSuccess: () => {
      toast.success('Transaksi berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['financial'] });
      onRefresh?.();
    },
    onError: (error) => {
      console.error('Error deleting transaction:', error);
      toast.error('Gagal menghapus transaksi');
    },
  });

  // Handle delete transaction
  const handleDelete = useCallback(async (transaction: FinancialTransaction) => {
    if (!window.confirm(`Hapus transaksi "${transaction.description}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(transaction.id);
      onDeleteTransaction?.(transaction.id);
    } catch (error) {
      console.error('Error in handleDelete:', error);
    }
  }, [deleteMutation, onDeleteTransaction]);

  // Handle row selection for virtual table
  const handleVirtualSelectionChange = useCallback((selectedSet: Set<string>) => {
    if (!onSelectionChange) return;
    
    // Convert Set to individual selection changes
    const currentSelectedSet = new Set(selectedIds);
    
    // Find newly selected items
    selectedSet.forEach(id => {
      if (!currentSelectedSet.has(id)) {
        onSelectionChange(id, true);
      }
    });
    
    // Find newly deselected items
    currentSelectedSet.forEach(id => {
      if (!selectedSet.has(id)) {
        onSelectionChange(id, false);
      }
    });
  }, [selectedIds, onSelectionChange]);

  // Define columns for virtual table
  const columns: VirtualTableColumn<FinancialTransaction>[] = useMemo(() => [
    {
      key: 'date',
      header: 'Tanggal',
      width: 120,
      sortable: true,
      render: (transaction: FinancialTransaction) => (
        <div className="text-sm">
          {transaction.date ? format(new Date(transaction.date), 'dd MMM yyyy', { locale: id }) : '-'}
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Deskripsi',
      sortable: true,
      render: (transaction: FinancialTransaction) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{transaction.description || 'Tidak ada deskripsi'}</div>
          {transaction.category && (
            <div className="text-xs text-gray-500">{transaction.category}</div>
          )}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Jenis',
      width: 120,
      sortable: true,
      align: 'center',
      render: (transaction: FinancialTransaction) => (
        <Badge
          variant={transaction.type === 'income' ? 'default' : 'destructive'}
          className={transaction.type === 'income'
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : ''
          }
        >
          {transaction.type === 'income' ? (
            <><TrendingUp className="w-3 h-3 mr-1" />Pemasukan</>
          ) : (
            <><TrendingDown className="w-3 h-3 mr-1" />Pengeluaran</>
          )}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Jumlah',
      width: 150,
      sortable: true,
      align: 'right',
      render: (transaction: FinancialTransaction) => (
        <div className={`font-medium ${
          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatCurrency(transaction.amount)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: 100,
      align: 'center',
      render: (transaction: FinancialTransaction) => (
        <div className="flex items-center justify-center gap-1">
          {onEditTransaction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEditTransaction(transaction);
              }}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(transaction);
            }}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], [onEditTransaction, handleDelete]);

  // Mobile card renderer
  const renderMobileCard = useCallback((transaction: FinancialTransaction, index: number) => {
    const isSelected = selectedIds.includes(transaction.id);
    
    return (
      <div
        key={transaction.id}
        className={cn(
          'p-4 border border-gray-200 rounded-lg bg-white transition-all duration-200',
          isSelected && 'ring-2 ring-blue-500 bg-blue-50',
          'hover:shadow-md cursor-pointer'
        )}
        onClick={() => onEditTransaction?.(transaction)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {isSelectionMode && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => {
                  onSelectionChange?.(transaction.id, !!checked);
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="flex-1">
              <div className="font-medium text-sm mb-1">
                {transaction.description || 'Tidak ada deskripsi'}
              </div>
              <div className="text-xs text-gray-500">
                {transaction.date ? format(new Date(transaction.date), 'dd MMM yyyy', { locale: id }) : '-'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={transaction.type === 'income' ? 'default' : 'destructive'}
              className={transaction.type === 'income'
                ? 'bg-green-100 text-green-800'
                : ''
              }
            >
              {transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {transaction.category || 'Tanpa kategori'}
          </div>
          <div className={`font-bold text-lg ${
            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(transaction.amount)}
          </div>
        </div>
        
        <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
          {onEditTransaction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEditTransaction(transaction);
              }}
              className="h-8 px-3"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(transaction);
            }}
            className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Hapus
          </Button>
        </div>
      </div>
    );
  }, [selectedIds, isSelectionMode, onSelectionChange, onEditTransaction, handleDelete]);

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-sm text-gray-500">Memuat data transaksi...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <CardTitle>Daftar Transaksi</CardTitle>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              )}
              {onAddTransaction && (
                <Button size="sm" onClick={onAddTransaction}>
                  <Plus className="mr-2 h-4 w-4" />
                  Transaksi Baru
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3 py-12">
            <Package className="h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-medium">Belum Ada Transaksi</h3>
            <p className="text-sm text-gray-500 max-w-md">
              Mulai dengan menambahkan transaksi pertama Anda untuk melacak keuangan bisnis.
            </p>
            {onAddTransaction && (
              <Button onClick={onAddTransaction} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Transaksi
              </Button>
            )}
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
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Virtual Scrolling
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            )}
            {onAddTransaction && (
              <Button size="sm" onClick={onAddTransaction}>
                <Plus className="mr-2 h-4 w-4" />
                Transaksi Baru
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {isMobile ? (
          // Mobile: Virtual List
          <VirtualList
            data={transactions}
            renderItem={renderMobileCard}
            itemHeight={itemHeight}
            containerHeight={containerHeight}
            className="p-4 space-y-3"
          />
        ) : (
          // Desktop: Virtual Table
          <VirtualTable
            data={transactions}
            columns={columns}
            itemHeight={itemHeight}
            containerHeight={containerHeight}
            selectable={isSelectionMode}
            selectedItems={new Set(selectedIds)}
            onSelectionChange={handleVirtualSelectionChange}
            getItemId={(item: FinancialTransaction) => item.id}
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
            stickyHeader
            striped
            hoverable
          />
        )}
      </CardContent>
      
      {transactions.length > 0 && (
        <CardFooter className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-gray-500">
            Menampilkan {transactions.length} transaksi dengan virtual scrolling
          </div>
          {isSelectionMode && (
            <div className="text-sm text-blue-600">
              {selectedIds.length} item dipilih
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default VirtualTransactionTable;