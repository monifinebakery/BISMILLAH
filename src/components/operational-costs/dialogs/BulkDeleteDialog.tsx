// src/components/operational-costs/dialogs/BulkDeleteDialog.tsx
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2 } from 'lucide-react';
import { formatCurrency } from '../utils/costHelpers';
import type { OperationalCost } from '../types/operationalCost.types';

interface BulkDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCosts: OperationalCost[];
  isProcessing: boolean;
}

const BulkDeleteDialog: React.FC<BulkDeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCosts,
  isProcessing
}) => {
  const selectedCount = selectedCosts.length;
  const totalSelectedAmount = selectedCosts.reduce((sum, cost) => sum + cost.jumlah_per_bulan, 0);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          
          <AlertDialogTitle className="text-center">
            Hapus Massal Biaya Operasional
          </AlertDialogTitle>
          
          <AlertDialogDescription className="text-center space-y-4">
            <p>
              Anda akan menghapus <strong>{selectedCount} biaya operasional</strong> secara permanen. 
              Tindakan ini tidak dapat dibatalkan.
            </p>
            
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="text-sm font-medium text-gray-900 mb-2">
                Ringkasan biaya yang akan dihapus:
              </div>
              <div className="space-y-1 text-sm">
                <div className="font-semibold text-red-600">
                  Total nilai: {formatCurrency(totalSelectedAmount)}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedCosts.slice(0, 3).map((cost) => (
                    <Badge key={cost.id} variant="destructive" className="text-xs">
                      {cost.nama_biaya}
                    </Badge>
                  ))}
                  {selectedCount > 3 && (
                    <Badge variant="destructive" className="text-xs">
                      +{selectedCount - 3} lainnya
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <p className="text-sm text-red-600">
              <strong>Perhatian:</strong> Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi perhitungan total biaya operasional.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="justify-center space-x-3">
          <AlertDialogCancel disabled={isProcessing}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isProcessing}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ya, Hapus {selectedCount} Biaya
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BulkDeleteDialog;