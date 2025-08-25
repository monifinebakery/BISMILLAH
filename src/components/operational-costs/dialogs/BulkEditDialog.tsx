// src/components/operational-costs/dialogs/BulkEditDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, Settings } from 'lucide-react';
import { formatCurrency } from '../utils/costHelpers';
import type { OperationalCost } from '../types/operationalCost.types';

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (editData: {
    jenis?: 'tetap' | 'variabel';
    status?: 'aktif' | 'nonaktif';
    group?: 'HPP' | 'OPERASIONAL';
    deskripsi?: string;
  }) => void;
  selectedCosts: OperationalCost[];
  isProcessing: boolean;
}

const BulkEditDialog: React.FC<BulkEditDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCosts,
  isProcessing
}) => {
  const [editData, setEditData] = useState({
    jenis: undefined as 'tetap' | 'variabel' | undefined,
    status: undefined as 'aktif' | 'nonaktif' | undefined,
    group: undefined as 'HPP' | 'OPERASIONAL' | undefined,
    deskripsi: undefined as string | undefined
  });

  const handleConfirm = () => {
    // Filter out undefined values
    const filteredEditData = Object.fromEntries(
      Object.entries(editData).filter(([_, value]) => value !== undefined)
    ) as any;
    
    onConfirm(filteredEditData);
  };

  const selectedCount = selectedCosts.length;
  const totalSelectedAmount = selectedCosts.reduce((sum, cost) => sum + cost.jumlah_per_bulan, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Edit Massal Biaya Operasional
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Ringkasan biaya yang akan diedit:</h4>
            <div className="space-y-1 text-sm">
              <div className="font-medium">{selectedCount} item biaya terpilih</div>
              <div>Total nilai: {formatCurrency(totalSelectedAmount)}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedCosts.slice(0, 3).map((cost) => (
                  <Badge key={cost.id} variant="secondary" className="text-xs">
                    {cost.nama_biaya}
                  </Badge>
                ))}
                {selectedCount > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedCount - 3} lainnya
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jenis">Jenis Biaya</Label>
              <Select
                value={editData.jenis || ''}
                onValueChange={(value) => 
                  setEditData(prev => ({ 
                    ...prev, 
                    jenis: value === 'tetap' || value === 'variabel' ? value : undefined 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tetap">Tetap</SelectItem>
                  <SelectItem value="variabel">Variabel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editData.status || ''}
                onValueChange={(value) => 
                  setEditData(prev => ({ 
                    ...prev, 
                    status: value === 'aktif' || value === 'nonaktif' ? value : undefined 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aktif">Aktif</SelectItem>
                  <SelectItem value="nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="group">Kelompok Biaya</Label>
              <Select
                value={editData.group || ''}
                onValueChange={(value) => 
                  setEditData(prev => ({ 
                    ...prev, 
                    group: value === 'HPP' || value === 'OPERASIONAL' ? value : undefined 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelompok (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HPP">Overhead Pabrik (HPP)</SelectItem>
                  <SelectItem value="OPERASIONAL">Biaya Operasional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="deskripsi">Deskripsi</Label>
              <Input
                id="deskripsi"
                placeholder="Deskripsi baru (opsional)"
                value={editData.deskripsi || ''}
                onChange={(e) => 
                  setEditData(prev => ({ ...prev, deskripsi: e.target.value || undefined }))
                }
              />
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Edit {selectedCount} Biaya
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditDialog;
