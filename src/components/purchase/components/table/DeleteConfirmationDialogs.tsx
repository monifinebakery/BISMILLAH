// src/components/purchase/components/table/DeleteConfirmationDialogs.tsx
// Extracted delete confirmation dialogs from PurchaseTable

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Purchase } from '../../types/purchase.types';
import { formatCurrency } from '@/utils/formatUtils';
import { getStatusDisplayText, getSupplierName } from '../../utils/purchaseHelpers';

interface DeleteDialogState {
  isOpen: boolean;
  purchase: Purchase | null;
  isDeleting: boolean;
}

interface BulkDeleteDialogState {
  isOpen: boolean;
  selectedCount: number;
  isDeleting: boolean;
}

interface DeleteConfirmationDialogsProps {
  deleteDialog: DeleteDialogState;
  bulkDeleteDialog: BulkDeleteDialogState;
  onDeleteConfirm: () => Promise<void>;
  onBulkDeleteConfirm: () => Promise<void>;
  onDeleteCancel: () => void;
  onBulkDeleteCancel: () => void;
}

export const DeleteConfirmationDialogs: React.FC<DeleteConfirmationDialogsProps> = ({
  deleteDialog,
  bulkDeleteDialog,
  onDeleteConfirm,
  onBulkDeleteConfirm,
  onDeleteCancel,
  onBulkDeleteCancel,
}) => {
  return (
    <>
      {/* Single Delete Confirmation Dialog */}
      <AlertDialog 
        open={deleteDialog.isOpen} 
        onOpenChange={onDeleteCancel}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Konfirmasi Hapus Pembelian
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Apakah Anda yakin ingin menghapus pembelian ini?</p>
              {deleteDialog.purchase && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <div className="font-medium">
                    {getSupplierName(deleteDialog.purchase.supplier)}
                  </div>
                  <div className="text-gray-600">
                    {new Date(deleteDialog.purchase.tanggal).toLocaleDateString('id-ID')} • {' '}
                    {formatCurrency(deleteDialog.purchase.totalNilai)} • {' '}
                    Status: <span className="font-medium">{getStatusDisplayText(deleteDialog.purchase.status)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {deleteDialog.purchase.items?.length || 0} item
                  </div>
                </div>
              )}
              {deleteDialog.purchase?.status === 'completed' && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Perhatian</span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Pembelian ini sudah selesai. Menghapus akan mempengaruhi laporan dan data stok yang sudah tercatat.
                  </p>
                </div>
              )}
              <p className="text-red-600 text-sm font-medium">
                ⚠️ Tindakan ini tidak dapat dibatalkan!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={deleteDialog.isDeleting}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteConfirm}
              disabled={deleteDialog.isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteDialog.isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus Pembelian
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog 
        open={bulkDeleteDialog.isOpen} 
        onOpenChange={onBulkDeleteCancel}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Konfirmasi Hapus Massal
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Apakah Anda yakin ingin menghapus <strong>{bulkDeleteDialog.selectedCount}</strong> pembelian sekaligus?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Peringatan</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  Semua data pembelian yang dipilih akan dihapus permanen. Jika ada pembelian dengan status "Selesai", 
                  hal ini dapat mempengaruhi laporan dan data stok yang sudah tercatat.
                </p>
              </div>
              <p className="text-red-600 text-sm font-medium">
                ⚠️ Tindakan ini tidak dapat dibatalkan!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={bulkDeleteDialog.isDeleting}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onBulkDeleteConfirm}
              disabled={bulkDeleteDialog.isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {bulkDeleteDialog.isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus {bulkDeleteDialog.selectedCount} Pembelian
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
