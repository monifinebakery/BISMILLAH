// src/components/purchase/components/dialogs/BulkOperationsDialog.tsx
// Bulk Operations Dialog for Purchase Table - Compatible with Purchase types
import React, { useState, useEffect } from 'react';
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

// BulkEditData interface matching Purchase field names
interface BulkEditData {
  supplier?: string;
  tanggal?: string; // Date string for input compatibility
  status?: PurchaseStatus;
  metodePerhitungan?: 'AVERAGE';
}

// Status options for purchases
const STATUS_OPTIONS: Array<{ value: PurchaseStatus; label: string; color: string }> = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
  { value: 'completed', label: 'Selesai', color: 'text-green-600' },
  { value: 'cancelled', label: 'Dibatalkan', color: 'text-red-600' },
];

/**
 * Bulk Operations Dialog Component for Purchase Table
 * 
 * Compatible with Purchase types and provides bulk edit/delete functionality
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
  const [internalBulkEditData, setInternalBulkEditData] = useState<BulkEditData>({});
  
  const isEditMode = type === 'edit';
  const bulkEditData = externalBulkEditData || internalBulkEditData;
  const setBulkEditData = onBulkEditDataChange || setInternalBulkEditData;

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen && setBulkEditData) {
      setBulkEditData({});
    }
  }, [isOpen, setBulkEditData]);

  // Handle form field changes
  const handleFieldChange = (field: keyof BulkEditData, value: string | undefined) => {
    if (setBulkEditData) {
      setBulkEditData(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔄 BulkOperationsDialog handleSubmit called', { 
      isEditMode, 
      bulkEditData,
      rawBulkEditData: JSON.stringify(bulkEditData)
    });
    
    if (isEditMode) {
      // Filter out empty values for bulk edit and transform data
      const cleanedData = Object.entries(bulkEditData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          // Transform date string to Date object for tanggal field
          if (key === 'tanggal' && typeof value === 'string') {
            acc[key as keyof BulkEditData] = new Date(value) as any;
          } else {
            acc[key as keyof BulkEditData] = value;
          }
        }
        return acc;
      }, {} as BulkEditData);

      console.log('📝 BulkOperationsDialog cleaned data:', {
        original: bulkEditData,
        cleaned: cleanedData,
        cleanedKeys: Object.keys(cleanedData),
        cleanedJSON: JSON.stringify(cleanedData)
      });

      await onConfirm(cleanedData);
    } else {
      // For delete, no data needed
      console.log('🗑️ BulkOperationsDialog calling delete');
      await onConfirm();
    }
  };

  // Calculate totals for selected purchases
  const calculateTotals = (purchases: Purchase[]) => {
    if (!purchases || !Array.isArray(purchases)) {
      return {
        totalValue: 0,
        totalItems: 0,
        pendingCount: 0,
        completedCount: 0,
        cancelledCount: 0,
      };
    }
    
    return {
      totalValue: purchases.reduce((sum, p) => sum + (Number(p.totalNilai) || 0), 0),
      totalItems: purchases.reduce((sum, p) => sum + (Array.isArray(p.items) ? p.items.length : 0), 0),
      pendingCount: purchases.filter(p => p.status === 'pending').length,
      completedCount: purchases.filter(p => p.status === 'completed').length,
      cancelledCount: purchases.filter(p => p.status === 'cancelled').length,
    };
  };

  const totals = calculateTotals(selectedItems);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border w-full max-w-2xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isEditMode ? 'bg-blue-100' : 'bg-red-100'
            }`}>
              {isEditMode ? (
                <Settings2 className={`w-5 h-5 ${isEditMode ? 'text-blue-600' : 'text-red-600'}`} />
              ) : (
                <Trash2 className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit Massal Pembelian' : 'Hapus Massal Pembelian'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditMode 
                  ? `Ubah ${selectedCount} pembelian yang dipilih` 
                  : `Hapus ${selectedCount} pembelian yang dipilih`
                }
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          
          {/* Selected Items Preview */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Pembelian yang Dipilih ({selectedCount})
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedItems.slice(0, 10).map((purchase) => {
                  const statusColor = STATUS_OPTIONS.find(opt => opt.value === purchase.status)?.color || 'text-gray-600';
                  
                  return (
                    <div key={purchase.id} className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        purchase.status === 'pending' ? 'bg-yellow-500' :
                        purchase.status === 'completed' ? 'bg-green-500' :
                        'bg-red-500'
                      }`} />
                      <span className="truncate">{purchase.supplier}</span>
                      <span className="text-gray-500 text-xs">
                        ({formatCurrency(purchase.totalNilai)})
                      </span>
                    </div>
                  );
                })}
                {selectedCount > 10 && (
                  <div className="text-sm text-gray-500 italic col-span-full">
                    ... dan {selectedCount - 10} pembelian lainnya
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bulk Edit Form */}
          {isEditMode ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Edit className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 mb-1">
                      Edit Massal Pembelian
                    </h4>
                    <p className="text-sm text-blue-700">
                      Hanya isi field yang ingin Anda ubah. Field yang kosong tidak akan diubah.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Supplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier
                  </label>
                  <Select
                    value={bulkEditData.supplier || ''}
                    onValueChange={(value) => handleFieldChange('supplier', value || undefined)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih supplier (kosong = tidak diubah)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Tidak diubah --</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <Select
                    value={bulkEditData.status || ''}
                    onValueChange={(value) => handleFieldChange('status', value as PurchaseStatus || undefined)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih status (kosong = tidak diubah)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Tidak diubah --</SelectItem>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <span className={status.color}>{status.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tanggal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Pembelian
                  </label>
                  <Input
                    type="date"
                    value={bulkEditData.tanggal || ''}
                    onChange={(e) => handleFieldChange('tanggal', e.target.value || undefined)}
                    className="w-full"
                    disabled={isLoading}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Biarkan kosong jika tidak ingin mengubah tanggal
                  </p>
                </div>

                {/* Metode Perhitungan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Metode Perhitungan
                  </label>
                  <Select
                    value={bulkEditData.metodePerhitungan || ''}
                    onValueChange={(value) => handleFieldChange('metodePerhitungan', value as 'AVERAGE' || undefined)}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih metode (kosong = tidak diubah)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Tidak diubah --</SelectItem>
                      <SelectItem value="AVERAGE">Average (Rata-rata)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          ) : (
            /* Bulk Delete Confirmation */
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900 mb-1">
                      Peringatan Penghapusan
                    </h4>
                    <p className="text-sm text-red-700 mb-3">
                      Anda akan menghapus <strong>{selectedCount} pembelian</strong> secara permanen. 
                      Tindakan ini <strong>tidak dapat dibatalkan</strong>.
                    </p>
                    <p className="text-sm text-red-600">
                      Pastikan Anda sudah yakin sebelum melanjutkan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Ringkasan Pembelian yang Akan Dihapus:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Pembelian:</span>
                    <span className="font-medium ml-2">{selectedCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Nilai:</span>
                    <span className="font-medium ml-2">
                      {formatCurrency(totals.totalValue)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Item:</span>
                    <span className="font-medium ml-2">{totals.totalItems}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-medium ml-2 text-yellow-600">
                      {totals.pendingCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Selesai:</span>
                    <span className="font-medium ml-2 text-green-600">
                      {totals.completedCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dibatalkan:</span>
                    <span className="font-medium ml-2 text-red-600">
                      {totals.cancelledCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}            disabled={isLoading}
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
        </div>
      </div>
    </div>
  );
};

export default BulkOperationsDialog;
