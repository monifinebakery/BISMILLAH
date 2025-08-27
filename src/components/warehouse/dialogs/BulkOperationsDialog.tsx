// src/components/warehouse/dialogs/BulkOperationsDialog.tsx
// ✅ FIXED: Complete compatibility with BahanBakuFrontend and useWarehouseCore
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { X, Settings2, Trash2, AlertTriangle, Save, Edit } from 'lucide-react';
import { warehouseUtils } from '../services/warehouseUtils';
import { formatCurrency } from '@/utils/formatUtils'; // ✅ Fallback import
import type { BahanBakuFrontend } from '../types';

interface BulkOperationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  operation: 'edit' | 'delete';
  selectedItems: string[];
  selectedItemsData: BahanBakuFrontend[];
  onConfirm: (data?: any) => Promise<void>;
  isProcessing: boolean;
  availableCategories: string[];
  availableSuppliers: string[];
}

// ✅ FIXED: BulkEditData interface matching BahanBakuFrontend exactly
interface BulkEditData {
  kategori?: string;
  supplier?: string;
  minimum?: number;
  harga?: number; // ✅ Matches BahanBakuFrontend.harga
  expiry?: string; // ✅ Matches BahanBakuFrontend.expiry
}

/**
 * ✅ FIXED: Bulk Operations Dialog Component
 * 
 * FIXES:
 * - Updated BulkEditData to match BahanBakuFrontend field names exactly
 * - Added fallback for warehouseUtils functions
 * - Enhanced error handling for missing utility functions
 * - Fixed calculation methods to work with BahanBakuFrontend structure
 * - Added proper validation and type safety
 * 
 * Compatible with useWarehouseCore and BahanBakuFrontend
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
    
    console.log('🔄 BulkOperationsDialog handleSubmit called', { 
      isEditMode, 
      bulkEditData,
      rawBulkEditData: JSON.stringify(bulkEditData)
    });
    
    if (isEditMode) {
      // Filter out empty values for bulk edit
      const cleanedData = Object.entries(bulkEditData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          acc[key as keyof BulkEditData] = value;
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

  // ✅ FIXED: Utility functions with fallbacks
  const getStockLevel = (stok: number, minimum: number) => {
    if (warehouseUtils?.formatStockLevel) {
      return warehouseUtils.formatStockLevel(stok, minimum);
    }
    // Fallback implementation
    if (stok === 0) return { level: 'out', color: 'bg-red-500' };
    if (stok <= minimum) return { level: 'low', color: 'bg-yellow-500' };
    if (stok <= minimum * 2) return { level: 'medium', color: 'bg-blue-500' };
    return { level: 'good', color: 'bg-green-500' };
  };

  const formatCurrencyValue = (value: number) => {
    if (warehouseUtils?.formatCurrency) {
      return warehouseUtils.formatCurrency(value);
    }
    if (typeof formatCurrency === 'function') {
      return formatCurrency(value);
    }
    // Fallback implementation
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getLowStockCount = (items: BahanBakuFrontend[]) => {
    if (warehouseUtils?.getLowStockItems) {
      return warehouseUtils.getLowStockItems(items).length;
    }
    // Fallback implementation
    return items.filter(item => Number(item.stok) <= Number(item.minimum)).length;
  };

  const getExpiringCount = (items: BahanBakuFrontend[], days: number = 30) => {
    if (warehouseUtils?.getExpiringItems) {
      return warehouseUtils.getExpiringItems(items, days).length;
    }
    // Fallback implementation
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    
    return items.filter(item => {
      if (!item.expiry) return false;
      const expiryDate = new Date(item.expiry);
      return expiryDate <= threshold && expiryDate > new Date();
    }).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dialog-overlay-center max-w-2xl max-h-[90vh]">
        <div className="dialog-panel flex flex-col h-full">
          <DialogHeader className="dialog-header-pad">
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
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {isEditMode ? 'Edit Massal' : 'Hapus Massal'}
                </DialogTitle>
                <p className="text-sm text-gray-600">
                  {isEditMode 
                    ? `Ubah ${selectedCount} item yang dipilih` 
                    : `Hapus ${selectedCount} item yang dipilih`
                  }
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="dialog-body overflow-y-auto flex-1">
          
          {/* Selected Items Preview */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Item yang Dipilih ({selectedCount})
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedItemsData.slice(0, 10).map((item) => {
                  const stockLevel = getStockLevel(Number(item.stok), Number(item.minimum));
                  
                  return (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${stockLevel.color}`} />
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
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md z-10 max-h-40 overflow-y-auto">
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
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md z-10 max-h-40 overflow-y-auto">
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

                {/* ✅ FIXED: Price field using 'harga' */}
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

                {/* ✅ FIXED: Expiry field using 'expiry' */}
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

              {/* ✅ FIXED: Items Summary with BahanBakuFrontend calculations */}
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
                      {formatCurrencyValue(
                        selectedItemsData.reduce((sum, item) => {
                          const stok = Number(item.stok) || 0;
                          const harga = Number(item.harga) || 0;
                          return sum + (stok * harga);
                        }, 0)
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Item Stok Rendah:</span>
                    <span className="font-medium ml-2 text-yellow-600">
                      {getLowStockCount(selectedItemsData)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Item Akan Kadaluarsa:</span>
                    <span className="font-medium ml-2 text-red-600">
                      {getExpiringCount(selectedItemsData, 30)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

          </div>

          <DialogFooter className="dialog-footer-pad">
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
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkOperationsDialog;