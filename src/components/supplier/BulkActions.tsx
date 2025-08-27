// src/components/supplier/BulkActions.tsx
// Bulk action controls for multiple supplier operations

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { CheckSquare, X, Trash2, AlertTriangle } from 'lucide-react';
import type { Supplier } from '@/types/supplier';

interface BulkActionsProps {
  isVisible: boolean;
  selectedCount: number;
  totalFilteredCount: number;
  onCancel: () => void;
  onSelectAll: () => void;
  onBulkDelete: () => void;
  suppliers: Supplier[]; // Selected suppliers for display in delete dialog
}

const BulkActions: React.FC<BulkActionsProps> = ({
  isVisible,
  selectedCount,
  totalFilteredCount,
  onCancel,
  onSelectAll,
  onBulkDelete,
  suppliers
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleBulkDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmBulkDelete = () => {
    onBulkDelete();
    setShowDeleteDialog(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Bulk Actions Toolbar */}
      <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 border">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left side - Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-700">Mode Pilih Multiple</span>
              </div>
              {selectedCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 font-semibold"
                >
                  {selectedCount} item dipilih
                </Badge>
              )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              {/* Cancel button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="border-gray-500 hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                Batalkan
              </Button>

              {/* Select all toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={onSelectAll}
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                {selectedCount === totalFilteredCount ? 'Batalkan Semua' : `Pilih Semua (${totalFilteredCount})`}
              </Button>

              {/* Bulk delete */}
              {selectedCount > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Hapus {selectedCount} Item
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Konfirmasi Hapus Multiple Item
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menghapus <strong>{selectedCount} item</strong> supplier:
              
              {/* List of suppliers to be deleted */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                <ul className="space-y-1">
                  {suppliers.slice(0, 5).map(supplier => (
                    <li key={supplier.id} className="flex items-center gap-2 text-sm">
                      <Trash2 className="h-3 w-3 text-red-500 flex-shrink-0" />
                      <span className="font-medium">{supplier.nama}</span>
                    </li>
                  ))}
                  {selectedCount > 5 && (
                    <li className="text-sm text-gray-500 italic">
                      ... dan {selectedCount - 5} item lainnya
                    </li>
                  )}
                </ul>
              </div>

              <p className="mt-3 text-red-600 font-medium text-sm">
                ⚠️ Tindakan ini tidak dapat dibatalkan!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus {selectedCount} Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BulkActions;