import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Edit2, Save, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../services/warehouseApi';
import { supabase } from '@/integrations/supabase/client';
import { warehouseUtils } from '../services/warehouseUtils';
import { logger } from '@/utils/logger';
import type { BahanBakuFrontend } from '../types';
// Gunakan kategori HPP yang sama dengan analisis profit
import { FNB_COGS_CATEGORIES } from '@/components/profitAnalysis/constants/profitConstants';

interface AddEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  item?: BahanBakuFrontend;
  onSave: (any) => Promise<void>;
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

const baseUnits = [
  { value: 'gram', label: 'gram', category: 'Berat', baseUnit: 'gram', multiplier: 1 },
  { value: 'kg', label: 'kilogram (kg)', category: 'Berat', baseUnit: 'gram', multiplier: 1000 },
  { value: 'ml', label: 'mililiter (ml)', category: 'Volume', baseUnit: 'ml', multiplier: 1 },
  { value: 'liter', label: 'liter', category: 'Volume', baseUnit: 'ml', multiplier: 1000 },
  { value: 'pcs', label: 'pieces (pcs)', category: 'Satuan', baseUnit: 'pcs', multiplier: 1 },
  { value: 'buah', label: 'buah', category: 'Satuan', baseUnit: 'buah', multiplier: 1 },
  { value: 'lembar', label: 'lembar', category: 'Satuan', baseUnit: 'lembar', multiplier: 1 },
  { value: 'meter', label: 'meter', category: 'Panjang', baseUnit: 'meter', multiplier: 1 },
];

const fetchDialogData = async (type: 'categories' | 'suppliers'): Promise<string[]> => {
  try {
    if (type === 'categories') {
      return [...FNB_COGS_CATEGORIES];
    }
    const { data: { user } } = await supabase.auth.getUser();
    const service = await warehouseApi.createService('crud', { userId: user?.id });
    const items = await service.fetchBahanBaku();
    const field = 'supplier';
    const values = [...new Set(items.map(item => item[field]).filter(Boolean))];
    return values.sort();
  } catch (error) {
    logger.error(`Failed to fetch ${type}:`, error);
    return type === 'categories' ? [...FNB_COGS_CATEGORIES] : [];
  }
};

const AddEditDialog: React.FC<AddEditDialogProps> = ({
  isOpen,
  onClose,
  mode,
  item,
  onSave,
  availableCategories: _propCategories,
  availableSuppliers: propSuppliers,
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState({
    suppliers: false,
    units: false,
  });

  const isEditMode = mode === 'edit' || !!item;

  const { data: queriedSuppliers = [], isLoading: suppliersLoading, refetch: refetchSuppliers } = useQuery({
    queryKey: ['dialog-suppliers'],
    queryFn: () => fetchDialogData('suppliers'),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });
  const availableCategories = [...FNB_COGS_CATEGORIES];
  const availableSuppliers = queriedSuppliers.length > 0 ? queriedSuppliers : propSuppliers;

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
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors([]);
  }, [isEditMode, item, isOpen]);

  const handleFieldChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) setErrors([]);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!formData.nama.trim()) errors.push('Nama bahan baku harus diisi');
    if (!formData.kategori.trim()) errors.push('Kategori harus diisi');
    if (!formData.supplier.trim()) errors.push('Supplier harus diisi');
    if (!formData.satuan.trim()) errors.push('Satuan harus diisi');
    if (formData.stok < 0) errors.push('Stok tidak boleh negatif');
    if (formData.minimum < 0) errors.push('Minimum stok tidak boleh negatif');
    if (formData.harga <= 0) errors.push('Harga per satuan harus lebih dari 0');
    
    setErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Perbaiki kesalahan pada form');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        nama: formData.nama.trim(),
        kategori: formData.kategori.trim(),
        supplier: formData.supplier.trim(),
        stok: formData.stok,
        minimum: formData.minimum,
        satuan: formData.satuan.trim(),
        harga: formData.harga,
        expiry: formData.expiry || null,
      };
      
      await onSave(submitData);
      onClose();
    } catch (error: any) {
      logger.error('Error in handleSubmit:', error);
      toast.error(error.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refetchSuppliers();
      toast.success('Data berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui data');
    }
  };
  const handleSelect = (field: 'supplier' | 'satuan', value: string) => {
    handleFieldChange(field, value);
    setShowDropdown(prev => ({
      ...prev,
      suppliers: field === 'supplier' ? false : prev.suppliers,
      units: field === 'satuan' ? false : prev.units,
    }));
  };

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
    
    return { level: stockData.level, label, colorClass, percentage: stockData.percentage };
  };

  const filteredUnits = baseUnits.filter(unit => 
    unit.label.toLowerCase().includes(formData.satuan.toLowerCase()) ||
    unit.value.toLowerCase().includes(formData.satuan.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div 
        className="bg-white rounded-lg w-full max-w-4xl flex flex-col border"
        style={{ height: 'calc(100vh - 160px)', maxHeight: '90vh', minHeight: '500px' }}
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              {isEditMode ? <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold">{isEditMode ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}</h2>
              <p className="text-xs sm:text-sm text-gray-600">{isEditMode ? 'Ubah data master bahan baku' : 'Tambah data master bahan baku baru'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isSubmitting}>
              <RefreshCw className={`w-4 h-4 ${suppliersLoading ? 'animate-spin' : ''}`} />
            </Button>
            <button onClick={onClose} disabled={isSubmitting} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="p-3 sm:p-4 bg-red-50 border-b border-red-200 flex-shrink-0">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="text-xs sm:text-sm font-medium text-red-800 mb-1">Kesalahan pada form:</h3>
                <ul className="text-xs sm:text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => <li key={index}>• {error}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <div className="flex-1 p-3 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Left Column - Basic Info */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Informasi Dasar</h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Nama Bahan Baku *</label>
                        <Input
                          value={formData.nama}
                          onChange={(e) => handleFieldChange('nama', e.target.value)}
                          placeholder="Nama bahan baku"
                          disabled={isSubmitting}
                          required
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Kategori *
                        </label>
                        <Select
                          value={formData.kategori}
                          onValueChange={(value) => handleFieldChange('kategori', value)}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCategories.map((category) => (
                              <SelectItem key={category} value={category} className="focus:bg-orange-50">
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="relative">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
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
                          className="text-sm"
                        />
                        {showDropdown.suppliers && availableSuppliers.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md z-10 max-h-32 sm:max-h-40 overflow-y-auto">
                            {availableSuppliers
                              .filter(sup => sup.toLowerCase().includes(formData.supplier.toLowerCase()))
                              .map((supplier) => (
                                <button
                                  key={supplier}
                                  type="button"
                                  onClick={() => handleSelect('supplier', supplier)}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs sm:text-sm"
                                >
                                  {supplier}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Satuan Dasar * <span className="text-xs text-gray-500 ml-1">(satuan untuk stok dan harga)</span>
                        </label>
                        <div className="relative">
                          <Input
                            value={formData.satuan}
                            onChange={(e) => {
                              handleFieldChange('satuan', e.target.value);
                              setShowDropdown(prev => ({ ...prev, units: true }));
                            }}
                            onFocus={() => setShowDropdown(prev => ({ ...prev, units: true }))}
                            onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, units: false })), 200)}
                            placeholder="Pilih satuan dasar"
                            disabled={isSubmitting}
                            required
                            className="text-sm"
                          />
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        </div>
                        {showDropdown.units && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md z-10 max-h-48 sm:max-h-60 overflow-y-auto">
                            {filteredUnits.length > 0 ? (
                              ['Berat', 'Volume', 'Satuan', 'Panjang'].map(category => {
                                const categoryUnits = filteredUnits.filter(unit => unit.category === category);
                                if (categoryUnits.length === 0) return null;
                                return (
                                  <div key={category}>
                                    <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 border-b">
                                      {category}
                                    </div>
                                    {categoryUnits.map((unit) => (
                                      <button
                                        key={unit.value}
                                        type="button"
                                        onClick={() => handleSelect('satuan', unit.value)}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs sm:text-sm flex justify-between"
                                      >
                                        <span>{unit.label}</span>
                                        <span className="text-gray-400 text-xs">{unit.value}</span>
                                      </button>
                                    ))}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="px-3 py-2 text-xs sm:text-sm text-gray-500">
                                Tidak ada satuan yang cocok
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Tanggal Kadaluarsa</label>
                        <Input
                          type="date"
                          value={formData.expiry}
                          onChange={(e) => handleFieldChange('expiry', e.target.value)}
                          disabled={isSubmitting}
                          min={new Date().toISOString().split('T')[0]}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Stock & Price */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Informasi Stok</h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Stok Saat Ini * <span className="text-xs text-gray-500">({formData.satuan || 'satuan'})</span>
                        </label>
                        <Input
                          type="number"
                          value={formData.stok}
                          onChange={(e) => handleFieldChange('stok', Number(e.target.value))}
                          min="0"
                          disabled={isSubmitting}
                          required
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Minimum Stok * <span className="text-xs text-gray-500">({formData.satuan || 'satuan'})</span>
                        </label>
                        <Input
                          type="number"
                          value={formData.minimum}
                          onChange={(e) => handleFieldChange('minimum', Number(e.target.value))}
                          min="0"
                          disabled={isSubmitting}
                          required
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Harga Referensi</h3>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                        Harga per {formData.satuan || 'satuan'} *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                        <Input
                          type="number"
                          value={formData.harga}
                          onChange={(e) => handleFieldChange('harga', Number(e.target.value))}
                          min="0"
                          className="pl-10 sm:pl-12 text-sm"
                          disabled={isSubmitting}
                          required
                          placeholder="0"
                        />
                      </div>
                      {isEditMode && typeof item?.hargaRataRata === 'number' && (
                        <p className="text-xs text-gray-500 mt-1">
                          Harga rata-rata (server): <strong>{warehouseUtils.formatCurrency(item.hargaRataRata)}</strong>
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Catatan: Harga ini hanya referensi master. WAC (Weighted Average Cost) dihitung dari transaksi pembelian aktual.
                      </p>
                    </div>
                  </div>

                  {formData.stok > 0 && formData.minimum > 0 && (
                    <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Preview Status Stok</h4>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${getStockLevelInfo(formData.stok, formData.minimum).colorClass}`} />
                        <span className="text-xs sm:text-sm text-gray-600">
                          {getStockLevelInfo(formData.stok, formData.minimum).label}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({formData.stok} / min: {formData.minimum} {formData.satuan}) - {Math.round(getStockLevelInfo(formData.stok, formData.minimum).percentage)}%
                        </span>
                      </div>
                      {formData.stok <= formData.minimum && (
                        <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                          ⚠️ Stok di bawah minimum, pertimbangkan untuk melakukan pemesanan ulang
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div 
              className="flex items-center justify-end gap-2 sm:gap-3 p-3 sm:p-6 border-t bg-gray-50 flex-shrink-0" 
              style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={isSubmitting}
                size="sm"
                className="text-xs sm:text-sm"
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                size="sm"
                className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent rounded-full" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-3 h-3 sm:w-4 sm:h-4" />
                    {isEditMode ? 'Simpan Perubahan' : 'Tambah Item'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditDialog;