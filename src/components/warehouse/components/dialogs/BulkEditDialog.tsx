// src/components/warehouse/components/dialogs/BulkEditDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  AlertCircle,
  Loader2,
  Edit3,
  Package,
  DollarSign,
  User,
  Tag,
  TrendingDown,
} from 'lucide-react';
import { BahanBaku, BulkEditData } from '../../types/warehouse';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '@/lib/utils';

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedItemsData: BahanBaku[]) => Promise<boolean>;
  selectedItems: string[];
  selectedItemsData: BahanBaku[];
  isBulkEditing: boolean;
  bulkEditData: BulkEditData;
  setBulkEditData: (data: Partial<BulkEditData>) => void;
  resetBulkEditData: () => void;
  validateBulkEditData: () => { isValid: boolean; errors: string[] };
  availableCategories?: string[];
  availableSuppliers?: string[];
}

const BulkEditDialog: React.FC<BulkEditDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedItems,
  selectedItemsData,
  isBulkEditing,
  bulkEditData,
  setBulkEditData,
  resetBulkEditData,
  validateBulkEditData,
  availableCategories = [],
  availableSuppliers = [],
}) => {
  const [fieldsToUpdate, setFieldsToUpdate] = useState<Record<string, boolean>>({
    kategori: false,
    supplier: false,
    minimum: false,
    hargaSatuan: false,
    tanggalKadaluwarsa: false,
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setFieldsToUpdate({
        kategori: false,
        supplier: false,
        minimum: false,
        hargaSatuan: false,
        tanggalKadaluwarsa: false,
      });
      setValidationErrors([]);
      resetBulkEditData();
    }
  }, [isOpen, resetBulkEditData]);

  // Update validation errors when data changes
  useEffect(() => {
    const validation = validateBulkEditData();
    setValidationErrors(validation.errors);
  }, [bulkEditData, validateBulkEditData]);

  const handleFieldToggle = (field: string, checked: boolean) => {
    setFieldsToUpdate(prev => ({ ...prev, [field]: checked }));
    
    if (!checked) {
      // Clear the field value when unchecked
      setBulkEditData({ [field]: undefined });
    }
  };

  const handleSubmit = async () => {
    // Only include fields that are selected for update
    const finalData: Partial<BulkEditData> = {};
    
    if (fieldsToUpdate.kategori && bulkEditData.kategori) {
      finalData.kategori = bulkEditData.kategori;
    }
    if (fieldsToUpdate.supplier && bulkEditData.supplier) {
      finalData.supplier = bulkEditData.supplier;
    }
    if (fieldsToUpdate.minimum && bulkEditData.minimum !== undefined) {
      finalData.minimum = bulkEditData.minimum;
    }
    if (fieldsToUpdate.hargaSatuan && bulkEditData.hargaSatuan !== undefined) {
      finalData.hargaSatuan = bulkEditData.hargaSatuan;
    }
    if (fieldsToUpdate.tanggalKadaluwarsa && bulkEditData.tanggalKadaluwarsa !== undefined) {
      finalData.tanggalKadaluwarsa = bulkEditData.tanggalKadaluwarsa;
    }

    // Update bulkEditData with final data
    setBulkEditData(finalData);

    const success = await onConfirm(selectedItemsData);
    if (success) {
      onClose();
    }
  };

  const hasSelectedFields = Object.values(fieldsToUpdate).some(Boolean);
  const canSubmit = hasSelectedFields && validationErrors.length === 0 && !isBulkEditing;

  // Get unique values from selected items for comparison
  const uniqueCategories = Array.from(new Set(selectedItemsData.map(item => item.kategori).filter(Boolean)));
  const uniqueSuppliers = Array.from(new Set(selectedItemsData.map(item => item.supplier).filter(Boolean)));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-orange-500" />
            Bulk Edit Bahan Baku
          </DialogTitle>
          <DialogDescription>
            Ubah beberapa item sekaligus. Pilih field yang ingin diubah dan masukkan nilai baru.
          </DialogDescription>
        </DialogHeader>

        {/* Selected Items Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-gray-900">
              {selectedItems.length} item dipilih
            </span>
          </div>
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
            {selectedItemsData.slice(0, 8).map((item) => (
              <Badge key={item.id} variant="secondary" className="text-xs">
                {item.nama}
              </Badge>
            ))}
            {selectedItemsData.length > 8 && (
              <Badge variant="outline" className="text-xs">
                +{selectedItemsData.length - 8} lainnya
              </Badge>
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium text-red-900">Error Validasi</span>
            </div>
            <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-6">
          {/* Kategori */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="kategori"
                checked={fieldsToUpdate.kategori}
                onCheckedChange={(checked) => handleFieldToggle('kategori', checked as boolean)}
              />
              <Label htmlFor="kategori" className="flex items-center gap-2 cursor-pointer">
                <Tag className="h-4 w-4" />
                Kategori
              </Label>
            </div>
            
            {fieldsToUpdate.kategori && (
              <div className="ml-6 space-y-2">
                <Select
                  value={bulkEditData.kategori || ''}
                  onValueChange={(value) => setBulkEditData({ kategori: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori baru" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {uniqueCategories.length > 0 && (
                  <div className="text-xs text-gray-500">
                    Kategori saat ini: {uniqueCategories.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Supplier */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="supplier"
                checked={fieldsToUpdate.supplier}
                onCheckedChange={(checked) => handleFieldToggle('supplier', checked as boolean)}
              />
              <Label htmlFor="supplier" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                Supplier
              </Label>
            </div>
            
            {fieldsToUpdate.supplier && (
              <div className="ml-6 space-y-2">
                <Select
                  value={bulkEditData.supplier || ''}
                  onValueChange={(value) => setBulkEditData({ supplier: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih supplier baru" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSuppliers.map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {uniqueSuppliers.length > 0 && (
                  <div className="text-xs text-gray-500">
                    Supplier saat ini: {uniqueSuppliers.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Minimum Stok */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="minimum"
                checked={fieldsToUpdate.minimum}
                onCheckedChange={(checked) => handleFieldToggle('minimum', checked as boolean)}
              />
              <Label htmlFor="minimum" className="flex items-center gap-2 cursor-pointer">
                <TrendingDown className="h-4 w-4" />
                Minimum Stok
              </Label>
            </div>
            
            {fieldsToUpdate.minimum && (
              <div className="ml-6 space-y-2">
                <Input
                  type="number"
                  min="0"
                  value={bulkEditData.minimum || ''}
                  onChange={(e) => setBulkEditData({ minimum: parseInt(e.target.value) || 0 })}
                  placeholder="Masukkan minimum stok baru"
                />
                <div className="text-xs text-gray-500">
                  Minimum saat ini bervariasi: {Math.min(...selectedItemsData.map(item => item.minimum))} - {Math.max(...selectedItemsData.map(item => item.minimum))}
                </div>
              </div>
            )}
          </div>

          {/* Harga Satuan */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hargaSatuan"
                checked={fieldsToUpdate.hargaSatuan}
                onCheckedChange={(checked) => handleFieldToggle('hargaSatuan', checked as boolean)}
              />
              <Label htmlFor="hargaSatuan" className="flex items-center gap-2 cursor-pointer">
                <DollarSign className="h-4 w-4" />
                Harga Satuan
              </Label>
            </div>
            
            {fieldsToUpdate.hargaSatuan && (
              <div className="ml-6 space-y-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bulkEditData.hargaSatuan || ''}
                  onChange={(e) => setBulkEditData({ hargaSatuan: parseFloat(e.target.value) || 0 })}
                  placeholder="Masukkan harga satuan baru"
                />
                <div className="text-xs text-gray-500">
                  Harga saat ini: {formatCurrency(Math.min(...selectedItemsData.map(item => item.hargaSatuan)))} - {formatCurrency(Math.max(...selectedItemsData.map(item => item.hargaSatuan)))}
                </div>
              </div>
            )}
          </div>

          {/* Tanggal Kadaluwarsa */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tanggalKadaluwarsa"
                checked={fieldsToUpdate.tanggalKadaluwarsa}
                onCheckedChange={(checked) => handleFieldToggle('tanggalKadaluwarsa', checked as boolean)}
              />
              <Label htmlFor="tanggalKadaluwarsa" className="flex items-center gap-2 cursor-pointer">
                <Calendar className="h-4 w-4" />
                Tanggal Kadaluwarsa
              </Label>
            </div>
            
            {fieldsToUpdate.tanggalKadaluwarsa && (
              <div className="ml-6 space-y-2">
                <Input
                  type="date"
                  value={bulkEditData.tanggalKadaluwarsa ? 
                    new Date(bulkEditData.tanggalKadaluwarsa).toISOString().split('T')[0] : 
                    ''
                  }
                  onChange={(e) => setBulkEditData({ 
                    tanggalKadaluwarsa: e.target.value ? new Date(e.target.value) : null 
                  })}
                  min={new Date().toISOString().split('T')[0]}
                />
                <div className="text-xs text-gray-500">
                  Tanggal akan diubah untuk semua item yang dipilih
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isBulkEditing}>
            Batal
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "bg-orange-500 hover:bg-orange-600 text-white",
              !canSubmit && "opacity-50 cursor-not-allowed"
            )}
          >
            {isBulkEditing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memperbarui...
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4 mr-2" />
                Update {selectedItems.length} Item
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkEditDialog;