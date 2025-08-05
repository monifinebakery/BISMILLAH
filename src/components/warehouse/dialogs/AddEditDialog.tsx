// ===== 3. UPDATE AddEditDialog.tsx (SIMPLIFIED VERSION) =====
// src/components/warehouse/dialogs/AddEditDialog.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Edit2, Save, AlertCircle, Calculator, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
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
  nama: '', kategori: '', supplier: '', stok: 0, minimum: 0,
  satuan: '', harga: 0, expiry: '', jumlahBeliKemasan: 0,
  satuanKemasan: '', hargaTotalBeliKemasan: 0,
};

// ✅ SIMPLIFIED: API functions
const fetchDialogData = async (type: 'categories' | 'suppliers'): Promise<string[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const service = await warehouseApi.createService('crud', { userId: user?.id });
    const items = await service.fetchBahanBaku();
    
    const field = type === 'categories' ? 'kategori' : 'supplier';
    return [...new Set(items.map(item => item[field]).filter(Boolean))].sort();
  } catch (error) {
    logger.error(`Failed to fetch ${type}:`, error);
    return [];
  }
};

const AddEditDialog: React.FC<AddEditDialogProps> = ({
  isOpen, onClose, mode, item, onSave, 
  availableCategories: propCategories, availableSuppliers: propSuppliers,
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState<{ categories: boolean; suppliers: boolean }>({
    categories: false, suppliers: false
  });

  const isEditMode = mode === 'edit' || !!item;

  // ✅ SIMPLIFIED: useQuery hooks
  const { data: queriedCategories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useQuery({
    queryKey: ['dialog-categories'],
    queryFn: () => fetchDialogData('categories'),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const { data: queriedSuppliers = [], isLoading: suppliersLoading, refetch: refetchSuppliers } = useQuery({
    queryKey: ['dialog-suppliers'],
    queryFn: () => fetchDialogData('suppliers'),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  // Use queried data with fallback
  const availableCategories = queriedCategories.length > 0 ? queriedCategories : propCategories;
  const availableSuppliers = queriedSuppliers.length > 0 ? queriedSuppliers : propSuppliers;

  // Initialize form data
  useEffect(() => {
    if (isEditMode && item) {
      setFormData({
        nama: item.nama || '',
        kategori: item.kategori || '',
        supplier: item.supplier || '',
        stok: Number(item.stok) || 0,
        minimum: Number(item.minimum) || 0,
        satuan: item.satuan || '',
        harga: Number(item.harga) || 0,
        expiry: item.expiry ? item.expiry.split('T')[0] : '',
        jumlahBeliKemasan: Number(item.jumlahBeliKemasan) || 0,
        satuanKemasan: item.satuanKemasan || '',
        hargaTotalBeliKemasan: Number(item.hargaTotalBeliKemasan) || 0,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors([]);
  }, [isEditMode, item, isOpen]);

  // Handle field changes
  const handleFieldChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate unit price
      if (field === 'jumlahBeliKemasan' || field === 'hargaTotalBeliKemasan') {
        const jumlah = field === 'jumlahBeliKemasan' ? Number(value) : updated.jumlahBeliKemasan;
        const total = field === 'hargaTotalBeliKemasan' ? Number(value) : updated.hargaTotalBeliKemasan;
        if (jumlah > 0 && total > 0) {
          updated.harga = Math.round(total / jumlah);
        }
      }
      return updated;
    });
    if (errors.length > 0) setErrors([]);
  };

  // Calculate total from unit price
  const handleCalculateTotal = () => {
    if (formData.jumlahBeliKemasan > 0 && formData.harga > 0) {
      const total = formData.jumlahBeliKemasan * formData.harga;
      handleFieldChange('hargaTotalBeliKemasan', total);
      toast.success(`Total: ${warehouseUtils.formatCurrency(total)}`);
    } else {
      toast.error('Masukkan jumlah kemasan dan harga per satuan');
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const validation = warehouseUtils.validateBahanBaku(formData);
    const additionalErrors: string[] = [];
    
    if (formData.jumlahBeliKemasan > 0 && !formData.satuanKemasan.trim()) {
      additionalErrors.push('Satuan kemasan harus diisi');
    }
    if (formData.jumlahBeliKemasan > 0 && formData.hargaTotalBeliKemasan <= 0) {
      additionalErrors.push('Harga total beli kemasan harus lebih dari 0');
    }
    
    const allErrors = [...validation.errors, ...additionalErrors];
    setErrors(allErrors);
    return allErrors.length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Perbaiki kesalahan pada form');
      return;
    }

    setIsSubmitting(true);
    try {
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
      toast.error(error.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Refresh dialog data
  const handleRefresh = async () => {
    try {
      await Promise.all([refetchCategories(), refetchSuppliers()]);
      toast.success('Data berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui data');
    }
  };

  // Auto-complete handlers
  const handleSelect = (field: 'kategori' | 'supplier', value: string) => {
    handleFieldChange(field, value);
    setShowDropdown(prev => ({ ...prev, [field === 'kategori' ? 'categories' : 'suppliers']: false }));
  };

  // ✅ FIXED: Stock level helper using your warehouseUtils
  const getStockLevelInfo = (stok: number, minimum: number) => {
    const stockData = warehouseUtils.formatStockLevel(stok, minimum);
    let colorClass = 'bg-gray-400';
    let label = 'Normal';
    
    switch (stockData.level) {
      case 'out': 
        colorClass = 'bg-red-500'; 
        label = 'Stok Habis';
        break;
      case 'low': 
        colorClass = 'bg-yellow-500'; 
        label = 'Stok Rendah';
        break;
      case 'medium': 
        colorClass = 'bg-blue-500'; 
        label = 'Stok Sedang';
        break;
      case 'high': 
        colorClass = 'bg-green-500'; 
        label = 'Stok Baik';
        break;
    }
    
    return { 
      level: stockData.level, 
      label, 
      colorClass, 
      percentage: stockData.percentage 
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              {isEditMode ? <Edit2 className="w-5 h-5 text-orange-600" /> : <Plus className="w-5 h-5 text-orange-600" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{isEditMode ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}</h2>
              <p className="text-sm text-gray-600">{isEditMode ? 'Ubah data bahan baku' : 'Tambah bahan baku baru'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isSubmitting}>
              <RefreshCw className={`w-4 h-4 ${categoriesLoading || suppliersLoading ? 'animate-spin' : ''}`} />
            </Button>
            <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">Kesalahan pada form:</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => <li key={index}>• {error}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Informasi Dasar</h3>
                <div className="space-y-4">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nama Bahan Baku *</label>
                    <Input
                      value={formData.nama}
                      onChange={(e) => handleFieldChange('nama', e.target.value)}
                      placeholder="Nama bahan baku"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  {/* Category with dropdown */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori * {categoriesLoading && <span className="text-xs text-gray-500">(loading...)</span>}
                    </label>
                    <Input
                      value={formData.kategori}
                      onChange={(e) => {
                        handleFieldChange('kategori', e.target.value);
                        setShowDropdown(prev => ({ ...prev, categories: true }));
                      }}
                      onFocus={() => setShowDropdown(prev => ({ ...prev, categories: true }))}
                      onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, categories: false })), 200)}
                      placeholder="Pilih atau ketik kategori"
                      disabled={isSubmitting}
                      required
                    />
                    {showDropdown.categories && availableCategories.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                        {availableCategories
                          .filter(cat => cat.toLowerCase().includes(formData.kategori.toLowerCase()))
                          .map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => handleSelect('kategori', category)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Supplier with dropdown */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier * {suppliersLoading && <span className="text-xs text-gray-500">(loading...)</span>}
                    </label>
                    <Input
                      value={formData.supplier}
                      onChange={(e) => {
                        handleFieldChange('supplier', e.target.value);
                        setShowDropdown(prev => ({ ...prev, suppliers: true }));
                      }}
                      onFocus={() => setShowDropdown(prev => ({ ...prev, suppliers: true }))}
                      onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, suppliers: false })), 200)}
                      placeholder="Pilih atau ketik supplier"
                      disabled={isSubmitting}
                      required
                    />
                    {showDropdown.suppliers && availableSuppliers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                        {availableSuppliers
                          .filter(sup => sup.toLowerCase().includes(formData.supplier.toLowerCase()))
                          .map((supplier) => (
                          <button
                            key={supplier}
                            type="button"
                            onClick={() => handleSelect('supplier', supplier)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                          >
                            {supplier}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Satuan *</label>
                    <Input
                      value={formData.satuan}
                      onChange={(e) => handleFieldChange('satuan', e.target.value)}
                      placeholder="kg, pcs, liter, dll"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Kadaluarsa</label>
                    <Input
                      type="date"
                      value={formData.expiry}
                      onChange={(e) => handleFieldChange('expiry', e.target.value)}
                      disabled={isSubmitting}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>

              {/* Stock Info */}
              <div>
                <h3 className="text-lg font-medium mb-4">Informasi Stok</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Stok Saat Ini *</label>
                    <Input
                      type="number"
                      value={formData.stok}
                      onChange={(e) => handleFieldChange('stok', Number(e.target.value))}
                      min="0"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stok *</label>
                    <Input
                      type="number"
                      value={formData.minimum}
                      onChange={(e) => handleFieldChange('minimum', Number(e.target.value))}
                      min="0"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              
              {/* Purchase Details */}
              <div>
                <h3 className="text-lg font-medium mb-4">Detail Pembelian</h3>
                <div className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Beli Kemasan</label>
                      <Input
                        type="number"
                        value={formData.jumlahBeliKemasan}
                        onChange={(e) => handleFieldChange('jumlahBeliKemasan', Number(e.target.value))}
                        min="0"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Satuan Kemasan</label>
                      <Input
                        value={formData.satuanKemasan}
                        onChange={(e) => handleFieldChange('satuanKemasan', e.target.value)}
                        placeholder="dus, karton, sak"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Harga Total Beli Kemasan</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                      <Input
                        type="number"
                        value={formData.hargaTotalBeliKemasan}
                        onChange={(e) => handleFieldChange('hargaTotalBeliKemasan', Number(e.target.value))}
                        min="0"
                        className="pl-12"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Harga per Satuan *</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                        <Input
                          type="number"
                          value={formData.harga}
                          onChange={(e) => handleFieldChange('harga', Number(e.target.value))}
                          min="0"
                          className="pl-12"
                          disabled={isSubmitting}
                          required
                        />
                      </div>
                      <Button type="button" variant="outline" onClick={handleCalculateTotal} disabled={isSubmitting}>
                        <Calculator className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Summary */}
              {formData.jumlahBeliKemasan > 0 && formData.hargaTotalBeliKemasan > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-3">Ringkasan Pembelian</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Jumlah:</span>
                      <span className="font-medium">{formData.jumlahBeliKemasan} {formData.satuanKemasan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total:</span>
                      <span className="font-medium">{warehouseUtils.formatCurrency(formData.hargaTotalBeliKemasan)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Per Satuan:</span>
                      <span className="font-medium">{warehouseUtils.formatCurrency(formData.harga)} / {formData.satuan}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Stock Preview */}
              {formData.stok > 0 && formData.minimum > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview Status Stok</h4>
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${getStockLevelInfo(formData.stok, formData.minimum).colorClass}`} />
                    <span className="text-sm text-gray-600">
                      {getStockLevelInfo(formData.stok, formData.minimum).label}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({formData.stok} / min: {formData.minimum}) - {Math.round(getStockLevelInfo(formData.stok, formData.minimum).percentage)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditMode ? 'Simpan Perubahan' : 'Tambah Item'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddEditDialog;