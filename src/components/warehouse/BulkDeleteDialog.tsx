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
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { BahanBaku } from '../../types/warehouse';

interface BulkDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedItems: string[];
  selectedItemsData: BahanBaku[];
  isBulkDeleting: boolean;
}

const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedItems,
  selectedItemsData,
  isBulkDeleting
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Konfirmasi Hapus Multiple Item
          </AlertDialogTitle>
          <AlertDialogDescription>
            Anda akan menghapus <strong>{selectedItems.length} item</strong> bahan baku:
            
            <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
              <ul className="space-y-1">
                {selectedItemsData.slice(0, 5).map((item) => (
                  <li key={item.id} className="flex items-center gap-2 text-sm">
                    <Trash2 className="h-3 w-3 text-red-500 flex-shrink-0" />
                    <span className="font-medium">{item.nama}</span>
                    <span className="text-gray-500">({item.kategori})</span>
                  </li>
                ))}
                {selectedItems.length > 5 && (
                  <li className="text-sm text-gray-500 italic">
                    ... dan {selectedItems.length - 5} item lainnya
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
          <AlertDialogCancel disabled={isBulkDeleting}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isBulkDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isBulkDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus {selectedItems.length} Item
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BulkDeleteDialog;