// src/components/financial/components/BulkActions.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  X,
  Trash2,
  Edit3,
  CheckSquare,
  Square,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatUtils';
import { useTransactionBulk, type FinancialTransaction, type BulkEditData } from '../hooks/useTransactionBulk';

interface BulkActionsProps {
  selectedTransactions: FinancialTransaction[];
  selectedIds: string[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  totalCount: number;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedTransactions,
  selectedIds,
  onClearSelection,
  onSelectAll,
  isAllSelected,
  totalCount,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editData, setEditData] = useState<BulkEditData>({
    type: undefined,
    category: undefined,
    description: undefined,
  });

  const {
    bulkDelete,
    bulkEdit,
    progress,
    isLoading,
    isBulkDeleting,
    isBulkEditing,
    resetProgress,
  } = useTransactionBulk();

  const handleBulkDelete = async () => {
    try {
      await bulkDelete(selectedIds);
      setShowDeleteDialog(false);
      onClearSelection();
    } catch (error) {
      console.error('Bulk delete failed:', error);
    }
  };

  const handleBulkEdit = async () => {
    // Validate that at least one field is being edited
    const hasChanges = editData.type || editData.category || editData.description;
    if (!hasChanges) {
      toast.error('Pilih minimal satu field untuk diedit');
      return;
    }

    try {
      await bulkEdit({ transactionIds: selectedIds, editData });
      setShowEditDialog(false);
      setEditData({ type: undefined, category: undefined, description: undefined });
      onClearSelection();
    } catch (error) {
      console.error('Bulk edit failed:', error);
    }
  };

  const handleCloseDialogs = () => {
    setShowDeleteDialog(false);
    setShowEditDialog(false);
    resetProgress();
  };

  const totalAmount = selectedTransactions.reduce((sum, transaction) => {
    return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
  }, 0);

  const incomeCount = selectedTransactions.filter(t => t.type === 'income').length;
  const expenseCount = selectedTransactions.filter(t => t.type === 'expense').length;

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="mb-4 border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {selectedIds.length} dipilih
                </Badge>
                <div className="text-sm text-gray-600">
                  dari {totalCount} transaksi
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                {incomeCount > 0 && (
                  <div className="text-green-600">
                    {incomeCount} pemasukan
                  </div>
                )}
                {expenseCount > 0 && (
                  <div className="text-red-600">
                    {expenseCount} pengeluaran
                  </div>
                )}
                <div className={`font-medium ${
                  totalAmount >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  Total: {formatCurrency(Math.abs(totalAmount))}
                  {totalAmount >= 0 ? ' (surplus)' : ' (defisit)'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={isAllSelected ? onClearSelection : onSelectAll}
                className="flex items-center gap-2"
              >
                {isAllSelected ? (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    Batalkan Semua
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    Pilih Semua
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditDialog(true)}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Edit Massal
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Hapus Massal
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Batal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={handleCloseDialogs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Konfirmasi Hapus Massal
            </DialogTitle>
            <DialogDescription>
              Anda akan menghapus {selectedIds.length} transaksi. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Ringkasan transaksi yang akan dihapus:</h4>
              <div className="space-y-1 text-sm">
                <div>• {incomeCount} transaksi pemasukan</div>
                <div>• {expenseCount} transaksi pengeluaran</div>
                <div className="font-medium">
                  • Total nilai: {formatCurrency(Math.abs(totalAmount))}
                  {totalAmount >= 0 ? ' (surplus)' : ' (defisit)'}
                </div>
              </div>
            </div>
            
            {progress.isRunning && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menghapus transaksi...</span>
                </div>
                <div className="text-sm text-gray-600">
                  {progress.completed} dari {progress.total} selesai
                  {progress.failed > 0 && (
                    <span className="text-red-600 ml-2">
                      ({progress.failed} gagal)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialogs}
              disabled={isBulkDeleting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="flex items-center gap-2"
            >
              {isBulkDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Hapus {selectedIds.length} Transaksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={handleCloseDialogs}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Massal Transaksi</DialogTitle>
            <DialogDescription>
              Edit {selectedIds.length} transaksi sekaligus. Kosongkan field yang tidak ingin diubah.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-type">Tipe Transaksi</Label>
              <Select
                value={editData.type || ''}
                onValueChange={(value) => 
                  setEditData(prev => ({ 
                    ...prev, 
                    type: value as 'income' | 'expense' | undefined 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Pemasukan</SelectItem>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bulk-category">Kategori</Label>
              <Input
                id="bulk-category"
                placeholder="Kategori baru (opsional)"
                value={editData.category || ''}
                onChange={(e) => 
                  setEditData(prev => ({ ...prev, category: e.target.value || undefined }))
                }
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bulk-description">Deskripsi</Label>
              <Textarea
                id="bulk-description"
                placeholder="Deskripsi baru (opsional)"
                value={editData.description || ''}
                onChange={(e) => 
                  setEditData(prev => ({ ...prev, description: e.target.value || undefined }))
                }
                rows={3}
              />
            </div>
            
            {progress.isRunning && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengedit transaksi...</span>
                </div>
                <div className="text-sm text-gray-600">
                  {progress.completed} dari {progress.total} selesai
                  {progress.failed > 0 && (
                    <span className="text-red-600 ml-2">
                      ({progress.failed} gagal)
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseDialogs}
              disabled={isBulkEditing}
            >
              Batal
            </Button>
            <Button
              onClick={handleBulkEdit}
              disabled={isBulkEditing}
              className="flex items-center gap-2"
            >
              {isBulkEditing && <Loader2 className="h-4 w-4 animate-spin" />}
              Edit {selectedIds.length} Transaksi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkActions;