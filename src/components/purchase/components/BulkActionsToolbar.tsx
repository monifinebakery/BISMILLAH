// src/components/purchase/components/BulkActionsToolbar.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  X,
  MoreHorizontal 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePurchaseTable } from '../context/PurchaseTableContext';
import { PurchaseStatus } from '../types/purchase.types';

const BulkActionsToolbar: React.FC = () => {
  const {
    selectedItems,
    clearSelection,
    bulkDelete,
    bulkUpdateStatus,
    isBulkDeleting,
    setShowBulkDeleteDialog,
    filteredPurchases,
  } = usePurchaseTable();

  // Don't show toolbar if no items selected
  if (selectedItems.length === 0) {
    return null;
  }

  const selectedCount = selectedItems.length;
  const totalItems = filteredPurchases.length;

  const handleBulkStatusUpdate = async (status: PurchaseStatus) => {
    await bulkUpdateStatus(status);
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteDialog(true);
  };

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50">
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Selection info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
              <div className="h-4 w-4 rounded bg-blue-600 flex items-center justify-center">
                <span className="text-xs text-white font-bold">{selectedCount}</span>
              </div>
              <span>
                {selectedCount} dari {totalItems} item dipilih
              </span>
            </div>
            
            {selectedCount === totalItems && (
              <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                Semua item dipilih
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Status Update Actions */}
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('completed')}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Selesaikan
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('pending')}
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              >
                <Clock className="h-4 w-4 mr-1" />
                Pending
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('cancelled')}
                className="text-red-700 border-red-300 hover:bg-red-100"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Batalkan
              </Button>
            </div>

            {/* More actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => {/* TODO: Export selected */}}
                  className="text-blue-600"
                >
                  Export Data Terpilih
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {/* TODO: Print selected */}}
                  className="text-blue-600"
                >
                  Print Data Terpilih
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {/* TODO: Archive selected */}}
                  className="text-gray-600"
                >
                  Arsipkan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete action */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {isBulkDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>

            {/* Clear selection */}
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              className="text-gray-600 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Additional info */}
        {selectedCount > 5 && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="text-xs text-blue-700">
              💡 Tip: Operasi bulk pada {selectedCount} item mungkin membutuhkan waktu beberapa detik
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default BulkActionsToolbar;