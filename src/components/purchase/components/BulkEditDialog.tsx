// src/components/purchase/components/BulkEditDialog.tsx
import React, { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { usePurchaseTable } from '../context/PurchaseTableContext';
import { useSupplier } from '@/contexts/SupplierContext';
import type { PurchaseStatus, CalculationMethod } from '../types/purchase.types';

interface BulkEditData {
  supplier?: string;
  status?: PurchaseStatus;
  metodePerhitungan?: CalculationMethod;
}

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const BulkEditDialog: React.FC<BulkEditDialogProps> = ({ isOpen, onClose }) => {
  const { selectedItems, bulkUpdatePurchases } = usePurchaseTable();
  const { suppliers } = useSupplier();
  const [isProcessing, setIsProcessing] = useState(false);
  const [editData, setEditData] = useState<BulkEditData>({
    supplier: undefined,
    status: undefined,
    metodePerhitungan: undefined,
  });

  const handleBulkEdit = async () => {
    // Validate that at least one field is being edited
    const hasChanges = editData.supplier || editData.status || editData.metodePerhitungan;
    if (!hasChanges) {
      toast.error('Pilih minimal satu field untuk diedit');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Filter out undefined values
      const cleanedData = Object.entries(editData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '') {
          acc[key as keyof BulkEditData] = value;
        }
        return acc;
      }, {} as BulkEditData);

      await bulkUpdatePurchases(selectedItems, cleanedData);
      
      toast.success(`${selectedItems.length} pembelian berhasil diupdate`);
      onClose();
      setEditData({
        supplier: undefined,
        status: undefined,
        metodePerhitungan: undefined,
      });
    } catch (error) {
      console.error('Bulk edit failed:', error);
      toast.error('Gagal mengupdate pembelian');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
      setEditData({
        supplier: undefined,
        status: undefined,
        metodePerhitungan: undefined,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-orange-600" />
            Edit Massal Pembelian
          </DialogTitle>
          <DialogDescription>
            Edit {selectedItems.length} pembelian sekaligus. Kosongkan field yang tidak ingin diubah.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bulk-supplier">Supplier</Label>
            <Select
              value={editData.supplier || ''}
              onValueChange={(value) => 
                setEditData(prev => ({ 
                  ...prev, 
                  supplier: value || undefined 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih supplier (opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tidak diubah</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-status">Status</Label>
            <Select
              value={editData.status || ''}
              onValueChange={(value) => 
                setEditData(prev => ({ 
                  ...prev, 
                  status: value as PurchaseStatus || undefined 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih status (opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tidak diubah</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-method">Metode Perhitungan</Label>
            <Select
              value={editData.metodePerhitungan || ''}
              onValueChange={(value) => 
                setEditData(prev => ({ 
                  ...prev, 
                  metodePerhitungan: value as CalculationMethod || undefined 
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih metode (opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tidak diubah</SelectItem>
                <SelectItem value="AVERAGE">Average (Rata-rata)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Batal
          </Button>
          <Button
            onClick={handleBulkEdit}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
            Edit {selectedItems.length} Pembelian
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditDialog;