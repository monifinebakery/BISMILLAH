// src/components/assets/components/AssetDeleteDialog.tsx

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
import { Loader2, Trash2 } from 'lucide-react';

interface AssetDeleteDialogProps {
  isOpen: boolean;
  assetName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export const AssetDeleteDialog: React.FC<AssetDeleteDialogProps> = ({
  isOpen,
  assetName,
  onConfirm,
  onCancel,
  isDeleting,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center text-red-600">
            <Trash2 className="h-5 w-5 mr-2" />
            Hapus Aset
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            Apakah Anda yakin ingin menghapus aset{' '}
            <span className="font-semibold text-gray-900">"{assetName}"</span>?
            <br />
            <br />
            Tindakan ini tidak dapat dibatalkan dan semua data terkait aset ini akan dihapus permanen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onCancel}
            disabled={isDeleting}
            className="border-gray-500 hover:bg-gray-50"
          >
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Aset
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};