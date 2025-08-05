// ===== 3. UPDATE AddEditDialog.tsx dengan useQuery =====
// src/components/warehouse/dialogs/AddEditDialog.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Edit2, Save, AlertCircle, Calculator, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
// ✅ TAMBAH: Import useQuery
import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../services/warehouseApi';
import { supabase } from '@/integrations/supabase/client';
import { warehouseUtils } from '../services/warehouseUtils';
import { logger } from '@/utils/logger';
import type { BahanBakuFrontend } from '../types';

interface AddEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  item?: BahanBakuFrontend;
  onSave: (data: any) => Promise<void>;
  availableCategories: string[];
  availableSuppliers: string[];
}

// ✅ TAMBAH: Query keys for dialog data
const dialogQueryKeys = {
  categories: ['warehouse', 'dialog', 'categories'] as const,
  suppliers: ['warehouse', 'dialog', 'suppliers'] as const,
  item: (id: string) => ['warehouse', 'dialog', 'item', id] as const,
};

// ✅ TAMBAH: API functions for dialog
const fetchDialogCategories = async (): Promise<string[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const service = await warehouseApi.createService('crud', {
      userId: user?.id,
      enableDebugLogs: process.env.NODE_ENV === 'development'
    });
    
    const items = await service.fetchBahanBaku();
    const categories = [...new Set(items.map(item => item.kategori).filter(Boolean))];
    return categories.sort();
  } catch (error) {
    logger.error('Failed to fetch dialog categories:', error);
    return [];
  }
};

const fetchDialogSuppliers = async (): Promise<string[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const service = await warehouseApi.createService('crud', {
      userId: user?.id,
      enableDebugLogs: process.env.NODE_ENV === 'development'
    });
    
    const items = await service.fetchBahanBaku();
    const suppliers = [...new Set(items.map(item => item.supplier).filter(Boolean))];
    return suppliers.sort();
  } catch (error) {
    logger.error('Failed to fetch dialog suppliers:', error);
    return [];
  }
};

const fetchItemForEdit = async (itemId: string): Promise<BahanBakuFrontend | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const service = await warehouseApi.createService('crud', {
      userId: user?.id,
      enableDebugLogs: process.env.NODE_ENV === 'development'
    });
    
    const items = await service.fetchBahanBaku();
    const item = items.find(item => item.id === itemId);
    
    if (!item) return null;
    
    // Ensure proper typing
    return {
      ...item,
      stok: Number(item.stok) || 0,
      minimum: Number(item.minimum) || 0,
      harga: Number(item.harga) || 0,
      jumlahBeliKemasan: item.jumlahBeliKemasan ? Number(item.jumlahBeliKemasan) : undefined,
      hargaTotalBeliKemasan: item.hargaTotalBeliKemasan ? Number(item.hargaTotalBeliKemasan) : undefined,
    };
  } catch (error) {
    logger.error('Failed to fetch item for edit:', error);
    return null;
  }
};

// Updated FormData to match BahanBakuFrontend interface
interface FormData {
  nama: string;
  kategori: string;
  supplier: string;
  stok: number;
  minimum: number;
  satuan: string;
  harga: number;
  expiry: string;
  jumlahBeliKemasan: number;
  satuanKemasan: string;
  hargaTotalBeliKemasan: number;
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
  jumlahBeliKemasan: 0,
  satuanKemasan: '',
  hargaTotalBeliKemasan: 0,
};

/**
 * ✅ ENHANCED: Add/Edit Dialog Component dengan useQuery
 * 
 * Features:
 * - useQuery untuk categories & suppliers
 * - useQuery untuk fetch item saat edit
 * - Fallback ke props untuk backward compatibility
 * - Enhanced loading states
 * - Real-time data refresh
 */
const AddEditDialog: React.FC<AddEditDialogProps> = ({
  isOpen,
  onClose,
  mode,
  item,
  onSave,
  availableCategories: propCategories,
  availableSuppliers: propSuppliers,
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const isEditMode = mode === 'edit' || !!item;
  const title = isEditMode ? 'Edit Bahan Baku' : 'Tambah Bahan Baku';
  const saveText = isEditMode ? 'Simpan Perubahan' : 'Tambah Item';

  // ✅ TAMBAH: useQuery untuk categories
  const {
    data: queriedCategories = [],
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: dialogQueryKeys.categories,
    queryFn: fetchDialogCategories,
    enabled: isOpen, // Only fetch when dialog is open
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ✅ TAMBAH: useQuery untuk suppliers
  const {
    data: queriedSuppliers = [],
    isLoading: suppliersLoading,
    refetch: refetchSuppliers,
  } = useQuery({
    queryKey: dialogQueryKeys.suppliers,
    queryFn: fetchDialogSuppliers,
    enabled: isOpen, // Only fetch when dialog is open
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // ✅ TAMBAH: useQuery untuk fetch item saat edit
  const {
    data: fetchedItem,
    isLoading: itemLoading,
    refetch: refetchItem,
  } = useQuery({
    queryKey: dialogQueryKeys.item(item?.id || ''),
    queryFn: () => fetchItemForEdit(item?.id || ''),
    enabled: isEditMode && !!item?.id && isOpen,
    staleTime: 1 * 60 * 1000, // 1 minute - fresh data untuk edit
  });

  // ✅ TAMBAH: Use queried data dengan fallback
  const availableCategories = queriedCategories.length > 0 ? queriedCategories : propCategories;
  const availableSuppliers = queriedSuppliers.length > 0 ? queriedSuppliers : propSuppliers;

  // ✅ TAMBAH: Refresh dialog data
  const handleRefreshDialogData = async () => {
    try {
      await Promise.all([
        refetchCategories(),
        refetchSuppliers(),
        isEditMode && item?.id ? refetchItem() : Promise.resolve()
      ]);
      toast.success('Data dialog berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui data dialog');
    }
  };

  // ✅ UPDATE: Initialization dengan useQuery data
  useEffect(() => {
    if (isEditMode && (fetchedItem || item)) {
      const sourceItem = fetchedItem || item;
      setFormData({
        nama: sourceItem.nama || '',
        kategori: sourceItem.kategori || '',
        supplier: sourceItem.supplier || '',
        stok: Number(sourceItem.stok) || 0,
        minimum: Number(sourceItem.minimum) || 0,
        satuan: sourceItem.satuan || '',
        harga: Number(sourceItem.harga) || 0,
        expiry: sourceItem.expiry ? sourceItem.expiry.split('T')[0] : '',
        jumlahBeliKemasan: Number(sourceItem.jumlahBeliKemasan) || 0,
        satuanKemasan: sourceItem.satuanKemasan || '',
        hargaTotalBeliKemasan: Number(sourceItem.hargaTotalBeliKemasan) || 0,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors([]);
  }, [isEditMode, fetchedItem, item, isOpen]);

  // Handle form field changes
  const handleFieldChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate unit price when purchase details change
      if (field === 'jumlahBeliKemasan' || field === 'hargaTotalBeliKemasan') {
        const jumlah = field === 'jumlahBeliKemasan' ? Number(value) : updated.jumlahBeliKemasan;
        const total = field === 'hargaTotalBeliKemasan' ? Number(value) : updated.hargaTotalBeliKemasan;
        
        if (jumlah > 0 && total > 0) {
          updated.harga = Math.round(total / jumlah);
        }
      }
      
      return updated;
    });
    
    // Clear related errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // Calculate total value from unit price and quantity
  const handleCalculateTotal = () => {
    if (formData.jumlahBeliKemasan > 0 && formData.harga > 0) {
      const calculatedTotal = formData.jumlahBeliKemasan * formData.harga;
      handleFieldChange('hargaTotalBeliKemasan', calculatedTotal);
      toast.success(`Total harga dihitung: ${warehouseUtils.formatCurrency(calculatedTotal)}`);
    } else {
      toast.error('Masukkan jumlah kemasan dan harga per satuan terlebih dahulu');
    }
  };

  // Updated validation to use updated warehouseUtils
  const validateForm = (): boolean => {
    const validation = warehouseUtils.validateBahanBaku(formData);
    
    // Additional validation for purchase details
    const additionalErrors: string[] = [];
    
    if (formData.jumlahBeliKemasan > 0 && !formData.satuanKemasan.trim()) {
      additionalErrors.push('Satuan kemasan harus diisi jika ada jumlah beli kemasan');
    }
    
    if (formData.jumlahBeliKemasan > 0 && formData.hargaTotalBeliKemasan <= 0) {
      additionalErrors.push('Harga total beli kemasan harus lebih dari 0 jika ada jumlah beli kemasan');
    }
    
    const allErrors = [...validation.errors, ...additionalErrors];
    setErrors(allErrors);
    
    return allErrors.length === 0;
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
      // Prepare data for submission with proper field mapping
      const submitData = {
        ...formData,
        expiry: formData.expiry || undefined,
        jumlahBeliKemasan: formData.jumlahBeliKemasan || undefined,
        satuanKemasan: formData.satuanKemasan.trim() || undefined,
        hargaTotalBeliKemasan: formData.hargaTotalBeliKemasan || undefined,
      };

      await onSave(submitData);
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

  // ✅ TAMBAH: Loading state untuk edit mode
  if (isEditMode && itemLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-3 border-orange-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">Memuat data item...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
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
          <div className="flex items-center gap-2">
            {/* ✅ TAMBAH: Refresh button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRefreshDialogData}
              disabled={categoriesLoading || suppliersLoading || isSubmitting}
              className="text-gray-500 hover:text-gray-700"
              title="Refresh data categories dan suppliers"
            >
              <RefreshCw className={`w-4 h-4 ${categoriesLoading || suppliersLoading ? 'animate-spin' : ''}`} />
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Dasar</h3>
                <div className="space-y-4">
                  
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
                      {categoriesLoading && (
                        <span className="ml-2 text-xs text-gray-500">(memuat...)</span>
                      )}
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
                      disabled={isSubmitting || categoriesLoading}
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
                      {suppliersLoading && (
                        <span className="ml-2 text-xs text-gray-500">(memuat...)</span>
                      )}
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
                      disabled={isSubmitting || suppliersLoading}
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
                      min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Opsional - untuk bahan yang memiliki tanggal kadaluarsa
                    </p>
                  </div>
                </div>
              </div>

              {/* Stock Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informasi Stok</h3>
                <div className="grid grid-cols-2 gap-4">
                  
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
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Alert akan muncul ketika stok mencapai batas minimum
                </p>
              </div>
            </div>

            {/* Right Column - Purchase Details & Preview */}
            <div className="space-y-6">
              
              {/* Purchase Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Detail Pembelian</h3>
                <div className="space-y-4">
                  
                  {/* Package Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jumlah Beli Kemasan
                    </label>
                    <Input
                      type="number"
                      value={formData.jumlahBeliKemasan}
                      onChange={(e) => handleFieldChange('jumlahBeliKemasan', Number(e.target.value))}
                      placeholder="0"
                      min="0"
                      className="w-full"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Jumlah kemasan yang dibeli
                    </p>
                  </div>

                  {/* Package Unit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Satuan Kemasan
                    </label>
                    <Input
                      type="text"
                      value={formData.satuanKemasan}
                      onChange={(e) => handleFieldChange('satuanKemasan', e.target.value)}
                      placeholder="dus, karton, sak, dll"
                      className="w-full"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Jenis kemasan yang dibeli
                    </p>
                  </div>

                  {/* Total Purchase Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Harga Total Beli Kemasan
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        Rp
                      </span>
                      <Input
                        type="number"
                        value={formData.hargaTotalBeliKemasan}
                        onChange={(e) => handleFieldChange('hargaTotalBeliKemasan', Number(e.target.value))}
                        placeholder="0"
                        min="0"
                        className="w-full pl-12"
                        disabled={isSubmitting}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Total harga untuk semua kemasan yang dibeli
                    </p>
                  </div>

                  {/* Unit Price (Auto-calculated) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Harga per Satuan *
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
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
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCalculateTotal}
                        disabled={isSubmitting}
                        className="flex-shrink-0"
                        title="Hitung total dari harga per satuan"
                      >
                        <Calculator className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Harga akan otomatis terhitung dari total beli ÷ jumlah kemasan
                    </p>
                  </div>
                </div>
              </div>

              {/* Purchase Summary */}
              {formData.jumlahBeliKemasan > 0 && formData.hargaTotalBeliKemasan > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">Ringkasan Pembelian</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Jumlah Kemasan:</span>
                      <span className="font-medium text-blue-900">
                        {formData.jumlahBeliKemasan} {formData.satuanKemasan}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Harga:</span>
                      <span className="font-medium text-blue-900">
                        {warehouseUtils.formatCurrency(formData.hargaTotalBeliKemasan)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Harga per Satuan:</span>
                      <span className="font-medium text-blue-900">
                        {warehouseUtils.formatCurrency(formData.harga)} / {formData.satuan}
                      </span>
                    </div>
                    {formData.jumlahBeliKemasan > 0 && formData.harga > 0 && (
                      <div className="flex justify-between pt-2 border-t border-blue-200">
                        <span className="text-blue-700">Harga per Kemasan:</span>
                        <span className="font-medium text-blue-900">
                          {warehouseUtils.formatCurrency(Math.round(formData.hargaTotalBeliKemasan / formData.jumlahBeliKemasan))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Stock Level Indicator using updated utils */}
              {formData.stok > 0 && formData.minimum > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview Status Stok</h4>
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${
                      warehouseUtils.getStockLevelColorClass({ stok: formData.stok, minimum: formData.minimum } as any)
                    }`} />
                    <span className="text-sm text-gray-600">
                      {warehouseUtils.getStockLevel({ stok: formData.stok, minimum: formData.minimum } as any).label}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({formData.stok} / min: {formData.minimum})
                    </span>
                  </div>
                </div>
              )}

              {/* ✅ TAMBAH: Data status indicator */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Status Data</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Categories:</span>
                    <span className={`font-medium ${categoriesLoading ? 'text-orange-600' : 'text-green-600'}`}>
                      {categoriesLoading ? 'Loading...' : `${availableCategories.length} tersedia`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Suppliers:</span>
                    <span className={`font-medium ${suppliersLoading ? 'text-orange-600' : 'text-green-600'}`}>
                      {suppliersLoading ? 'Loading...' : `${availableSuppliers.length} tersedia`}
                    </span>
                  </div>
                  {isEditMode && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Item Data:</span>
                      <span className="font-medium text-green-600">
                        {fetchedItem ? 'Fresh from server' : 'From cache'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
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
            disabled={isSubmitting || categoriesLoading || suppliersLoading}
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