import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Settings2, Trash2, AlertTriangle, Save, Edit } from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';
import type { Purchase, PurchaseStatus } from '../../types/purchase.types';

interface BulkOperationsDialogProps {
  type: 'edit' | 'delete';
  isOpen: boolean;
  isLoading: boolean;
  selectedCount: number;
  selectedItems: Purchase[];
  bulkEditData?: any;
  onBulkEditDataChange?: (data: any) => void;
  onConfirm: (data?: any) => Promise<void>;
  onCancel: () => void;
  suppliers?: Array<{ id: string; nama: string }>;
}

// Internal state interface for bulk edit data
interface BulkEditData {
  supplier?: string;
  tanggal?: string; // Date string for input compatibility
  status?: PurchaseStatus;
  metodePerhitungan?: 'AVERAGE';
}

// Status options for the select dropdown
const STATUS_OPTIONS: Array<{ value: PurchaseStatus; label: string; color: string }> = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
  { value: 'completed', label: 'Selesai', color: 'text-green-600' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'text-red-600' },
];

/**
 * BulkOperationsDialog - Dialog for bulk edit and delete operations on purchases
 * Supports both edit and delete modes with appropriate UI and validation
 */
const BulkOperationsDialog: React.FC<BulkOperationsDialogProps> = ({
  type,
  isOpen,
  isLoading,
  selectedCount,
  selectedItems,
  bulkEditData: externalBulkEditData,
  onBulkEditDataChange,
  onConfirm,
  onCancel,
  suppliers = [],
}) => {
  const isEditMode = type === 'edit';
  
  // Internal state for bulk edit data
  const [internalBulkEditData, setInternalBulkEditData] = useState<BulkEditData>({
    metodePerhitungan: 'AVERAGE'
  });

  // Use external data if provided, otherwise use internal state
  const bulkEditData = externalBulkEditData || internalBulkEditData;
  const setBulkEditData = onBulkEditDataChange || setInternalBulkEditData;

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen && isEditMode) {
      const resetData = { metodePerhitungan: 'AVERAGE' as const };
      if (onBulkEditDataChange) {
        onBulkEditDataChange(resetData);
      } else {
        setInternalBulkEditData(resetData);
      }
    }
  }, [isOpen, isEditMode, onBulkEditDataChange]);

  // Handle form submission
  const handleSubmit = async () => {
    if (isEditMode) {
      // Filter out empty values for edit mode
      const filteredData = Object.fromEntries(
        Object.entries(bulkEditData).filter(([_, value]) => value !== undefined && value !== '')
      );
      await onConfirm(filteredData);
    } else {
      // Delete mode doesn't need data
      await onConfirm();
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof BulkEditData, value: any) => {
    setBulkEditData({ ...bulkEditData, [field]: value });
  };

  // Calculate totals for selected items
  const calculateTotals = (items: Purchase[]) => {
    return items.reduce(
      (acc, item) => {
        acc.totalItems += item.items?.length || 0;
        acc.totalAmount += item.totalNilai || 0;
        return acc;
      },
      { totalItems: 0, totalAmount: 0 }
    );
  };

  const totals = calculateTotals(selectedItems);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onCancel()}>
      <DialogContent centerMode="overlay" size="lg">
          <DialogHeader className="dialog-header-pad">
            <DialogTitle className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isEditMode ? 'bg-blue-100' : 'bg-red-100'
              }`}>
                {isEditMode ? (
                  <Settings2 className={`w-5 h-5 ${isEditMode ? 'text-blue-600' : 'text-red-600'}`} />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isEditMode ? 'Edit Massal Pembelian' : 'Hapus Pembelian'}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedCount} pembelian dipilih
                </p>
              </div>
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Ubah data untuk semua pembelian yang dipilih. Field yang kosong tidak akan diubah.'
                : `Apakah Anda yakin ingin menghapus ${selectedCount} pembelian? Tindakan ini tidak dapat dibatalkan.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="dialog-body">
            {/* Summary Card */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Ringkasan Pembelian</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total Pembelian:</span>
                  <span className="ml-2 font-medium">{selectedCount}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Item:</span>
                  <span className="ml-2 font-medium">{totals.totalItems}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">Total Nilai:</span>
                  <span className="ml-2 font-medium text-lg">{formatCurrency(totals.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Edit Form - Only show in edit mode */}
            {isEditMode && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Supplier Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier
                    </label>
                    <Select
                      value={bulkEditData.supplier || ''}
                      onValueChange={(value) => handleInputChange('supplier', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih supplier (opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Pembelian
                    </label>
                    <Input
                      type="date"
                      value={bulkEditData.tanggal || ''}
                      onChange={(e) => handleInputChange('tanggal', e.target.value)}
                      placeholder="Pilih tanggal (opsional)"
                    />
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <Select
                      value={bulkEditData.status || ''}
                      onValueChange={(value) => handleInputChange('status', value as PurchaseStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status (opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <span className={option.color}>{option.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Calculation Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Metode Perhitungan
                    </label>
                    <Select
                      value={bulkEditData.metodePerhitungan || 'AVERAGE'}
                      onValueChange={(value) => handleInputChange('metodePerhitungan', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVERAGE">Rata-rata (AVERAGE)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Help Text */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Edit className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Tips Edit Massal:</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Field yang kosong tidak akan mengubah data yang ada</li>
                        <li>Semua pembelian yang dipilih akan diubah sesuai input</li>
                        <li>Metode perhitungan akan mempengaruhi kalkulasi harga</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation - Only show in delete mode */}
            {!isEditMode && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-900 mb-2">Peringatan!</h4>
                    <p className="text-sm text-red-800 mb-3">
                      Anda akan menghapus {selectedCount} pembelian dengan total nilai {formatCurrency(totals.totalAmount)}.
                    </p>
                    <p className="text-sm text-red-800">
                      Data yang dihapus tidak dapat dikembalikan. Pastikan Anda yakin dengan tindakan ini.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="dialog-footer-pad">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`flex items-center gap-2 ${
                isEditMode 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  {isEditMode ? 'Menyimpan...' : 'Menghapus...'}
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <>
                      <Save className="w-4 h-4" />
                      Simpan Perubahan
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Hapus {selectedCount} Pembelian
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkOperationsDialog;
