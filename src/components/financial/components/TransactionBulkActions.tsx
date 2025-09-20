// src/components/financial/components/TransactionBulkActions.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Trash2,
  X,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/shared';

import type { FinancialTransaction } from '../types/financial';

interface TransactionBulkActionsProps {
  selectedIds: string[];
  selectedTransactions: FinancialTransaction[];
  isAllSelected: boolean;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onExitSelectionMode: () => void;
  className?: string;
}

const TransactionBulkActions: React.FC<TransactionBulkActionsProps> = ({
  selectedIds,
  selectedTransactions,
  isAllSelected,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onExitSelectionMode,
  className
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const selectedCount = selectedIds.length;
  const totalSelectedAmount = selectedTransactions.reduce(
    (sum, transaction) => sum + transaction.amount, 
    0
  );

  const incomeCount = selectedTransactions.filter(t => t.type === 'income').length;
  const expenseCount = selectedTransactions.filter(t => t.type === 'expense').length;

  const handleBulkDelete = async () => {
    if (selectedCount === 0) return;

    setIsDeleting(true);
    try {
      await onBulkDelete(selectedIds);
      setShowConfirmDialog(false);
      onClearSelection();
    } catch (error) {
      console.error('Bulk delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const ConfirmDialog = () => (
    showConfirmDialog && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-500" />
            <h3 className="text-lg font-semibold">Konfirmasi Hapus</h3>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-3">
              Yakin ingin menghapus <strong>{selectedCount}</strong> transaksi yang dipilih?
            </p>
            
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total transaksi:</span>
                <span className="font-medium">{selectedCount}</span>
              </div>
              {incomeCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Pemasukan:</span>
                  <span className="text-green-600">{incomeCount}</span>
                </div>
              )}
              {expenseCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Pengeluaran:</span>
                  <span className="text-red-600">{expenseCount}</span>
                </div>
              )}
            </div>
            
            <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
              ⚠️ Aksi ini tidak dapat dibatalkan!
            </div>
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Hapus {selectedCount} Transaksi
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  );

  if (selectedCount === 0) return null;

  return (
    <>
      <Card className={cn("mb-4 border-blue-200 bg-blue-50", className)}>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Select All Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isAllSelected ? onClearSelection : onSelectAll}
                  className="h-8 px-2"
                >
                  {isAllSelected ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </Button>
                <span className="text-sm font-medium text-blue-900">
                  {selectedCount} dari {totalCount} transaksi dipilih
                </span>
              </div>
              
              {/* Summary Info */}
              <div className="flex items-center gap-2">
                {incomeCount > 0 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {incomeCount} Pemasukan
                  </Badge>
                )}
                {expenseCount > 0 && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    {expenseCount} Pengeluaran
                  </Badge>
                )}
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Total: {formatCurrency(Math.abs(totalSelectedAmount))}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmDialog(true)}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Hapus ({selectedCount})
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onExitSelectionMode}
                className="text-gray-600 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Transaction breakdown */}
          {selectedCount > 5 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="text-xs text-blue-700">
                <span className="font-medium">Ringkasan transaksi terpilih:</span>
                {' '}
                {incomeCount > 0 && `${incomeCount} pemasukan`}
                {incomeCount > 0 && expenseCount > 0 && ', '}
                {expenseCount > 0 && `${expenseCount} pengeluaran`}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog />
    </>
  );
};

export default TransactionBulkActions;
