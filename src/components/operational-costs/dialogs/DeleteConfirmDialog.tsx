// src/components/operational-costs/dialogs/DeleteConfirmDialog.tsx

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from 'lucide-react';
import { OperationalCost } from '../types';
import { formatCurrency } from '../utils/costHelpers';

interface DeleteConfirmDialogProps {
  cost: OperationalCost;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  cost,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const success = await onConfirm();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error deleting cost:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          {/* Icon */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>

          <AlertDialogTitle className="text-center">
            Hapus Biaya Operasional
          </AlertDialogTitle>
          
          <AlertDialogDescription className="text-center">
            <div className="space-y-4">
              <p>
                Apakah Anda yakin ingin menghapus biaya operasional berikut?
              </p>
              
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {cost.nama_biaya}
                </div>
                <div className="text-lg font-semibold text-red-600 mb-1">
                  {formatCurrency(cost.jumlah_per_bulan)}
                </div>
                <div className="text-xs text-gray-500">
                  {cost.jenis === 'tetap' ? 'Biaya Tetap' : 'Biaya Variabel'} • {' '}
                  {cost.status === 'aktif' ? 'Aktif' : 'Non Aktif'}
                </div>
              </div>

              <p className="text-sm text-red-600">
                <strong>Perhatian:</strong> Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi perhitungan total biaya operasional.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="justify-center space-x-3">
          <AlertDialogCancel disabled={loading}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ya, Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmDialog;