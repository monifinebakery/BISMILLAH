// src/components/warehouse/dialogs/BulkOperationsDialog.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Settings2, Trash2, AlertTriangle, Save, Edit } from 'lucide-react';
import { warehouseUtils } from '../services/warehouseUtils';
import type { BahanBakuFrontend } from '../types'; // ✅ Updated import

interface BulkOperationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  operation: 'edit' | 'delete';
  selectedItems: string[];
  selectedItemsData: BahanBakuFrontend[]; // ✅ Updated type
  onConfirm: (data?: any) => Promise<void>;
  isProcessing: boolean;
  availableCategories: string[];
  availableSuppliers: string[];
}

// ✅ Updated BulkEditData to match BahanBakuFrontend field names
interface BulkEditData {
  kategori?: string;
  supplier?: string;
  minimum?: number;
  harga?: number; // ✅ Changed from harga_satuan to harga
  expiry?: string; // ✅ Changed from tanggal_kadaluwarsa to expiry
}

/**
 * Combined Bulk Operations Dialog Component
 * 
 * ✅ Updated to use BahanBakuFrontend interface
 * ✅ Fixed field naming consistency (camelCase)
 * ✅ Enhanced with updated warehouseUtils functions
 * 
 * Handles both bulk edit and bulk delete operations:
 * - Bulk Edit: Update multiple items with same values
 * - Bulk Delete: Delete multiple items with confirmation
 * - Progress indication
 * - Validation and error handling
 * - Compatible with updated type system
 * 
 * Size: ~6KB (loaded lazily)
 */
const BulkOperationsDialog: React.FC<BulkOperationsDialogProps> = ({
  isOpen,
  onClose,
  operation,
  selectedItems,
  selectedItemsData,
  onConfirm,
  isProcessing,
  availableCategories,
  availableSuppliers,
}) => {
  const [bulkEditData, setBulkEditData] = useState<BulkEditData>({});
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const isEditMode = operation === 'edit';
  const selectedCount = selectedItems.length;

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setBulkEditData({});
    }
  }, [isOpen]);

  // Handle form field changes
  const handleFieldChange = (field: keyof BulkEditData, value: string | number | undefined) => {
    setBulkEditData(prev => ({ ...prev, [field]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode) {
      // Filter out empty values for bulk edit
      const cleanedData = Object.entries(bulkEditData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          acc[key as keyof BulkEditData] = value;
        }
        return acc;
      }, {} as BulkEditData);

      await onConfirm(cleanedData);
    } else {
      // For delete, no data needed
      await onConfirm();
    }
  };

  // Auto-complete handlers
  const handleCategorySelect = (category: string) => {
    handleFieldChange('kategori', category);
    setShowCategoryDropdown(false);
  };

  const handleSupplierSelect = (supplier: string) => {
    handleFieldChange('supplier', supplier);
    setShowSupplierDropdown(false);
  };

  // Filter suggestions based on input
  const filteredCategories = availableCategories.filter(cat =>
    cat.toLowerCase().includes((bulkEditData.kategori || '').toLowerCase())
  );

  const filteredSuppliers = availableSuppliers.filter(sup =>
    sup.toLowerCase().includes((bulkEditData.supplier || '').toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        
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
                {isEditMode ? 'Edit Massal' : 'Hapus Massal'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditMode 
                  ? `Ubah ${selectedCount} item yang dipilih` 
                  : `Hapus ${selectedCount} item yang dipilih`
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          
          {/* Selected Items Preview */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Item yang Dipilih ({selectedCount})
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedItemsData.slice(0, 10).map((item) => {
                  // ✅ Use updated helper functions
                  const stockLevel = warehouseUtils.getStockLevel(item);
                  
                  return (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        stockLevel.level === 'out' ? 'bg-red-500' :
                        stockLevel.level === 'low' ? 'bg-yellow-500' :
                        stockLevel.level === 'medium' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      <span className="truncate">{item.nama}</span>
                      <span className="text-gray-500 text-xs">
                        ({item.stok} {item.satuan})
                      </span>
                    </div>
                  );
                })}
                {selectedCount > 10 && (
                  <div className="text-sm text-gray-500 italic col-span-full">
                    ... dan {selectedCount - 10} item lainnya
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
                      Edit Massal
                    </h4>
                    <p className="text-sm text-blue-700">
                      Hanya isi field yang ingin Anda ubah. Field yang kosong tidak akan diubah.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Category */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori
                  </label>
                  <Input
                    type="text"
                    value={bulkEditData.kategori || ''}
                    onChange={(e) => {
                      handleFieldChange('kategori', e.target.value || undefined);
                      setShowCategoryDropdown(true);
                    }}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                    placeholder="Biarkan kosong jika tidak ingin mengubah"
                    className="w-full"
                    disabled={isProcessing}
                  />
                  
                  {/* Category Dropdown */}
                  {showCategoryDropdown && filteredCategories.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                      {filteredCategories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => handleCategorySelect(category)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Supplier */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier
                  </label>
                  <Input
                    type="text"
                    value={bulkEditData.supplier || ''}
                    onChange={(e) => {
                      handleFieldChange('supplier', e.target.value || undefined);
                      setShowSupplierDropdown(true);
                    }}
                    onFocus={() => setShowSupplierDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                    placeholder="Biarkan kosong jika tidak ingin mengubah"
                    className="w-full"
                    disabled={isProcessing}
                  />
                  
                  {/* Supplier Dropdown */}
                  {showSupplierDropdown && filteredSuppliers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                      {filteredSuppliers.map((supplier) => (
                        <button
                          key={supplier}
                          type="button"
                          onClick={() => handleSupplierSelect(supplier)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                        >
                          {supplier}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Minimum Stock */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Stok
                  </label>
                  <Input
                    type="number"
                    value={bulkEditData.minimum || ''}
                    onChange={(e) => handleFieldChange('minimum', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Biarkan kosong jika tidak ingin mengubah"
                    min="0"
                    className="w-full"
                    disabled={isProcessing}
                  />
                </div>

                {/* Price - ✅ Updated field name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga per Satuan
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      Rp
                    </span>
                    <Input
                      type="number"
                      value={bulkEditData.harga || ''}
                      onChange={(e) => handleFieldChange('harga', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="Biarkan kosong jika tidak ingin mengubah"
                      min="0"
                      className="w-full pl-12"
                      disabled={isProcessing}
                    />
                  </div>
                </div>

                {/* Expiry Date - ✅ Updated field name */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Kadaluarsa
                  </label>
                  <Input
                    type="date"
                    value={bulkEditData.expiry || ''}
                    onChange={(e) => handleFieldChange('expiry', e.target.value || undefined)}
                    className="w-full md:w-1/2"
                    disabled={isProcessing}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Biarkan kosong jika tidak ingin mengubah tanggal kadaluarsa
                  </p>
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
                      Anda akan menghapus <strong>{selectedCount} item</strong> secara permanen. 
                      Tindakan ini <strong>tidak dapat dibatalkan</strong>.
                    </p>
                    <p className="text-sm text-red-600">
                      Pastikan Anda sudah yakin sebelum melanjutkan.
                    </p>
                  </div>
                </div>
              </div>

              {/* ✅ Enhanced Items Summary with updated calculations */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Ringkasan Item yang Akan Dihapus:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Item:</span>
                    <span className="font-medium ml-2">{selectedCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Nilai Stok:</span>
                    <span className="font-medium ml-2">
                      {warehouseUtils.formatCurrency(
                        selectedItemsData.reduce((sum, item) => sum + (item.stok * item.harga), 0)
                      )}
                    </span>
                  </div>
                  {/* ✅ Additional analytics */}
                  <div>
                    <span className="text-gray-600">Item Stok Rendah:</span>
                    <span className="font-medium ml-2 text-yellow-600">
                      {selectedItemsData.filter(item => warehouseUtils.isLowStockItem(item)).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Item Akan Kadaluarsa:</span>
                    <span className="font-medium ml-2 text-red-600">
                      {selectedItemsData.filter(item => warehouseUtils.isExpiringItem(item)).length}
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
            onClick={onClose}
            disabled={isProcessing}
          >
            Batal
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isProcessing}
            className={`flex items-center gap-2 ${
              isEditMode 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isProcessing ? (
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
                    Hapus {selectedCount} Item
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