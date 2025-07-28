// src/components/warehouse/dialogs/AddEditDialog.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Edit2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { warehouseUtils } from '../services/warehouseUtils';
import type { BahanBaku } from '../types';

interface AddEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  item?: BahanBaku;
  onSave: (data: any) => Promise<void>;
  availableCategories: string[];
  availableSuppliers: string[];
}

interface FormData {
  nama: string;
  kategori: string;
  supplier: string;
  stok: number;
  minimum: number;
  satuan: string;
  harga: number;
  expiry: string;
}

const initialFormData: FormData = {
  nama: '',
  kategori: '',
  supplier: '',
  stok: 0,
  minimum: 0,
  satuan: '',
  harga: 0,
  expiry: '',
};

/**
 * Combined Add/Edit Dialog Component
 * 
 * Features:
 * - Single component for both add and edit modes
 * - Real-time validation
 * - Auto-complete for categories and suppliers
 * - Responsive design
 * - Accessibility support
 * 
 * Size: ~8KB (loaded lazily)
 */
const AddEditDialog: React.FC<AddEditDialogProps> = ({
  isOpen,
  onClose,
  mode,
  item,
  onSave,
  availableCategories,
  availableSuppliers,
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const isEditMode = mode === 'edit' || !!item;
  const title = isEditMode ? 'Edit Bahan Baku' : 'Tambah Bahan Baku';
  const saveText = isEditMode ? 'Simpan Perubahan' : 'Tambah Item';

  // Initialize form data
  useEffect(() => {
    if (isEditMode && item) {
      setFormData({
        nama: item.nama || '',
        kategori: item.kategori || '',
        supplier: item.supplier || '',
        stok: item.stok || 0,
        minimum: item.minimum || 0,
        satuan: item.satuan || '',
        harga: item.harga || 0,
        expiry: item.expiry ? item.expiry.split('T')[0] : '', // Format for date input
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors([]);
  }, [isEditMode, item, isOpen]);

  // Handle form field changes
  const handleFieldChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear related errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const validation = warehouseUtils.validateBahanBaku(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Mohon perbaiki kesalahan pada form');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        expiry: formData.expiry || undefined, // Convert empty string to undefined
      };

      await onSave(submitData);
      
      // Success handling is done in parent component
      onClose();
      
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast.error(error.message || 'Terjadi kesalahan saat menyimpan data');
    } finally {
      setIsSubmitting(false);
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
    cat.toLowerCase().includes(formData.kategori.toLowerCase())
  );

  const filteredSuppliers = availableSuppliers.filter(sup =>
    sup.toLowerCase().includes(formData.supplier.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              {isEditMode ? (
                <Edit2 className="w-5 h-5 text-orange-600" />
              ) : (
                <Plus className="w-5 h-5 text-orange-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">
                {isEditMode ? 'Ubah data bahan baku yang dipilih' : 'Tambahkan bahan baku baru ke inventori'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">
                  Terdapat kesalahan pada form:
                </h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Basic Information */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Dasar</h3>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Bahan Baku *
              </label>
              <Input
                type="text"
                value={formData.nama}
                onChange={(e) => handleFieldChange('nama', e.target.value)}
                placeholder="Masukkan nama bahan baku"
                className="w-full"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Category with Auto-complete */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori *
              </label>
              <Input
                type="text"
                value={formData.kategori}
                onChange={(e) => {
                  handleFieldChange('kategori', e.target.value);
                  setShowCategoryDropdown(true);
                }}
                onFocus={() => setShowCategoryDropdown(true)}
                onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                placeholder="Masukkan atau pilih kategori"
                className="w-full"
                disabled={isSubmitting}
                required
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

            {/* Supplier with Auto-complete */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier *
              </label>
              <Input
                type="text"
                value={formData.supplier}
                onChange={(e) => {
                  handleFieldChange('supplier', e.target.value);
                  setShowSupplierDropdown(true);
                }}
                onFocus={() => setShowSupplierDropdown(true)}
                onBlur={() => setTimeout(() => setShowSupplierDropdown(false), 200)}
                placeholder="Masukkan atau pilih supplier"
                className="w-full"
                disabled={isSubmitting}
                required
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

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Satuan *
              </label>
              <Input
                type="text"
                value={formData.satuan}
                onChange={(e) => handleFieldChange('satuan', e.target.value)}
                placeholder="kg, pcs, liter, dll"
                className="w-full"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Stock Information */}
            <div className="md:col-span-2 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Stok</h3>
            </div>

            {/* Current Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stok Saat Ini *
              </label>
              <Input
                type="number"
                value={formData.stok}
                onChange={(e) => handleFieldChange('stok', Number(e.target.value))}
                placeholder="0"
                min="0"
                className="w-full"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Minimum Stock */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Stok *
              </label>
              <Input
                type="number"
                value={formData.minimum}
                onChange={(e) => handleFieldChange('minimum', Number(e.target.value))}
                placeholder="0"
                min="0"
                className="w-full"
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Alert akan muncul ketika stok mencapai batas minimum
              </p>
            </div>

            {/* Price Information */}
            <div className="md:col-span-2 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Harga</h3>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Harga per Satuan *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  Rp
                </span>
                <Input
                  type="number"
                  value={formData.harga}
                  onChange={(e) => handleFieldChange('harga', Number(e.target.value))}
                  placeholder="0"
                  min="0"
                  className="w-full pl-12"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Kadaluarsa
              </label>
              <Input
                type="date"
                value={formData.expiry}
                onChange={(e) => handleFieldChange('expiry', e.target.value)}
                className="w-full"
                disabled={isSubmitting}
                min={new Date().toISOString().split('T')[0]} // Prevent past dates
              />
              <p className="text-xs text-gray-500 mt-1">
                Opsional - untuk bahan yang memiliki tanggal kadaluarsa
              </p>
            </div>
          </div>

          {/* Stock Level Indicator */}
          {formData.stok > 0 && formData.minimum > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview Status Stok</h4>
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${
                  formData.stok === 0 ? 'bg-red-500' :
                  formData.stok <= formData.minimum ? 'bg-yellow-500' :
                  formData.stok <= formData.minimum * 1.5 ? 'bg-blue-500' : 'bg-green-500'
                }`} />
                <span className="text-sm text-gray-600">
                  {formData.stok === 0 ? 'Stok Habis' :
                   formData.stok <= formData.minimum ? 'Stok Rendah' :
                   formData.stok <= formData.minimum * 1.5 ? 'Stok Sedang' : 'Stok Aman'}
                </span>
                <span className="text-sm text-gray-500">
                  ({formData.stok} / min: {formData.minimum})
                </span>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {saveText}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddEditDialog;