// src/components/warehouse/dialogs/AddEditDialog.tsx
// 🎯 Improved AddEditDialog - Auto Calculate Price & Dropdown Units
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Edit2, Save, AlertCircle, Calculator, RefreshCw, ChevronDown } from 'lucide-react';
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

// ✅ ADDED: Common units dropdown options
const commonUnits = [
  { value: 'gram', label: 'gram', category: 'Berat' },
  { value: 'kg', label: 'kilogram (kg)', category: 'Berat' },
  { value: 'ml', label: 'mililiter (ml)', category: 'Volume' },
  { value: 'liter', label: 'liter', category: 'Volume' },
  { value: 'pcs', label: 'pieces (pcs)', category: 'Satuan' },
  { value: 'buah', label: 'buah', category: 'Satuan' },
  { value: 'lembar', label: 'lembar', category: 'Satuan' },
  { value: 'pack', label: 'pack', category: 'Kemasan' },
  { value: 'box', label: 'box', category: 'Kemasan' },
  { value: 'dus', label: 'dus', category: 'Kemasan' },
  { value: 'karton', label: 'karton', category: 'Kemasan' },
  { value: 'sak', label: 'sak', category: 'Kemasan' },
  { value: 'botol', label: 'botol', category: 'Kemasan' },
  { value: 'kaleng', label: 'kaleng', category: 'Kemasan' },
  { value: 'sachet', label: 'sachet', category: 'Kemasan' },
];

// ✅ ADDED: Common package units
const commonPackageUnits = [
  'dus', 'karton', 'sak', 'box', 'pack', 'roll', 'bundle',
  'krat', 'bal', 'pallet', 'container', 'jerigen', 'drum',
  'botol besar', 'kaleng besar', 'kemasan bulk'
];

// API functions
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
  const [showDropdown, setShowDropdown] = useState<{ 
    categories: boolean; 
    suppliers: boolean; 
    units: boolean;
    packageUnits: boolean;
  }>({
    categories: false, 
    suppliers: false,
    units: false,
    packageUnits: false
  });

  const isEditMode = mode === 'edit' || !!item;

  // useQuery hooks
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

  // ✅ ENHANCED: Handle field changes with auto-calculation
  const handleFieldChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // ✅ AUTO-CALCULATE: Unit price when package info changes
      if (field === 'jumlahBeliKemasan' || field === 'hargaTotalBeliKemasan') {
        const jumlah = field === 'jumlahBeliKemasan' ? Number(value) : updated.jumlahBeliKemasan;
        const total = field === 'hargaTotalBeliKemasan' ? Number(value) : updated.hargaTotalBeliKemasan;
        
        if (jumlah > 0 && total > 0) {
          // Calculate price per unit automatically
          const unitPrice = Math.round(total / jumlah);
          updated.harga = unitPrice;
          
          // Show calculation feedback
          if (field === 'hargaTotalBeliKemasan') {
            toast.success(`Harga per satuan otomatis: ${warehouseUtils.formatCurrency(unitPrice)}`);
          }
        }
      }
      
      // ✅ AUTO-CALCULATE: Total when unit price changes (optional reverse calculation)
      if (field === 'harga' && updated.jumlahBeliKemasan > 0) {
        const newTotal = Number(value) * updated.jumlahBeliKemasan;
        // Only auto-update total if current total is 0 or we're in add mode
        if (updated.hargaTotalBeliKemasan === 0 || !isEditMode) {
          updated.hargaTotalBeliKemasan = newTotal;
        }
      }
      
      return updated;
    });
    
    if (errors.length > 0) setErrors([]);
  };

  // Calculate total from unit price manually
  const handleCalculateTotal = () => {
    if (formData.jumlahBeliKemasan > 0 && formData.harga > 0) {
      const total = formData.jumlahBeliKemasan * formData.harga;
      handleFieldChange('hargaTotalBeliKemasan', total);
      toast.success(`Total dihitung: ${warehouseUtils.formatCurrency(total)}`);
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
  const handleSelect = (field: 'kategori' | 'supplier' | 'satuan' | 'satuanKemasan', value: string) => {
    handleFieldChange(field, value);
    setShowDropdown(prev => ({ 
      ...prev, 
      categories: field === 'kategori' ? false : prev.categories,
      suppliers: field === 'supplier' ? false : prev.suppliers,
      units: field === 'satuan' ? false : prev.units,
      packageUnits: field === 'satuanKemasan' ? false : prev.packageUnits,
    }));
  };

  // Stock level helper using warehouseUtils
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

  // ✅ ADDED: Filter units by search
  const filteredUnits = commonUnits.filter(unit => 
    unit.label.toLowerCase().includes(formData.satuan.toLowerCase()) ||
    unit.value.toLowerCase().includes(formData.satuan.toLowerCase())
  );

  // ✅ ADDED: Filter package units by search
  const filteredPackageUnits = commonPackageUnits.filter(unit => 
    unit.toLowerCase().includes(formData.satuanKemasan.toLowerCase())
  );

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

        {/* Auto-calculation info */}
        {formData.jumlahBeliKemasan > 0 && formData.hargaTotalBeliKemasan > 0 && (
          <div className="p-3 bg-green-50 border-b border-green-200">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Calculator className="w-4 h-4" />
              <span>💡 Harga per satuan dihitung otomatis: <strong>{warehouseUtils.formatCurrency(formData.harga)}</strong> per {formData.satuan}</span>
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

                  {/* ✅ ENHANCED: Unit with dropdown */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Satuan *</label>
                    <div className="relative">
                      <Input
                        value={formData.satuan}
                        onChange={(e) => {
                          handleFieldChange('satuan', e.target.value);
                          setShowDropdown(prev => ({ ...prev, units: true }));
                        }}
                        onFocus={() => setShowDropdown(prev => ({ ...prev, units: true }))}
                        onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, units: false })), 200)}
                        placeholder="Pilih atau ketik satuan"
                        disabled={isSubmitting}
                        required
                      />
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {showDropdown.units && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                        {filteredUnits.length > 0 ? (
                          <>
                            {['Berat', 'Volume', 'Satuan', 'Kemasan'].map(category => {
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
                                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex justify-between"
                                    >
                                      <span>{unit.label}</span>
                                      <span className="text-gray-400 text-xs">{unit.value}</span>
                                    </button>
                                  ))}
                                </div>
                              );
                            })}
                          </>
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Tidak ada satuan yang cocok
                          </div>
                        )}
                      </div>
                    )}
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
                        placeholder="0"
                      />
                    </div>
                    
                    {/* ✅ ENHANCED: Package unit with dropdown */}
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Satuan Kemasan</label>
                      <div className="relative">
                        <Input
                          value={formData.satuanKemasan}
                          onChange={(e) => {
                            handleFieldChange('satuanKemasan', e.target.value);
                            setShowDropdown(prev => ({ ...prev, packageUnits: true }));
                          }}
                          onFocus={() => setShowDropdown(prev => ({ ...prev, packageUnits: true }))}
                          onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, packageUnits: false })), 200)}
                          placeholder="Pilih atau ketik kemasan"
                          disabled={isSubmitting}
                        />
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      {showDropdown.packageUnits && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                          {filteredPackageUnits.length > 0 ? (
                            filteredPackageUnits.map((unit) => (
                              <button
                                key={unit}
                                type="button"
                                onClick={() => handleSelect('satuanKemasan', unit)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                              >
                                {unit}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              Tidak ada kemasan yang cocok
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Harga Total Beli Kemasan 
                      <span className="text-xs text-gray-500 ml-1">(akan menghitung harga per satuan otomatis)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                      <Input
                        type="number"
                        value={formData.hargaTotalBeliKemasan}
                        onChange={(e) => handleFieldChange('hargaTotalBeliKemasan', Number(e.target.value))}
                        min="0"
                        className="pl-12"
                        disabled={isSubmitting}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Harga per Satuan * 
                      <span className="text-xs text-green-600 ml-1">
                        {formData.jumlahBeliKemasan > 0 && formData.hargaTotalBeliKemasan > 0 && '(dihitung otomatis)'}
                      </span>
                    </label>
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
                          placeholder="0"
                        />
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCalculateTotal} 
                        disabled={isSubmitting || !formData.jumlahBeliKemasan || !formData.harga}
                        title="Hitung total dari harga per satuan"
                      >
                        <Calculator className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Tip: Isi "Harga Total" di atas, maka harga per satuan akan dihitung otomatis
                    </p>
                  </div>
                </div>
              </div>

              {/* Purchase Summary */}
              {formData.jumlahBeliKemasan > 0 && formData.hargaTotalBeliKemasan > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Ringkasan Pembelian
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Jumlah:</span>
                      <span className="font-medium">{formData.jumlahBeliKemasan} {formData.satuanKemasan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total:</span>
                      <span className="font-medium">{warehouseUtils.formatCurrency(formData.hargaTotalBeliKemasan)}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-200 pt-2">
                      <span className="text-blue-700">Per Satuan:</span>
                      <span className="font-bold text-blue-900">{warehouseUtils.formatCurrency(formData.harga)} / {formData.satuan}</span>
                    </div>
                    {formData.jumlahBeliKemasan > 0 && formData.harga > 0 && (
                      <div className="text-xs text-blue-600 mt-2 p-2 bg-blue-100 rounded">
                        ✅ Perhitungan: {warehouseUtils.formatCurrency(formData.hargaTotalBeliKemasan)} ÷ {formData.jumlahBeliKemasan} = {warehouseUtils.formatCurrency(formData.harga)} per {formData.satuan}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stock Preview */}
              {formData.stok > 0 && formData.minimum > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                  {formData.stok <= formData.minimum && (
                    <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                      ⚠️ Stok di bawah minimum, pertimbangkan untuk melakukan pemesanan ulang
                    </div>
                  )}
                </div>
              )}

              {/* ✅ ADDED: Calculation helper */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Bantuan Perhitungan
                </h4>
                <div className="text-xs text-green-600 space-y-1">
                  <div>• <strong>Auto-calculate:</strong> Isi "Harga Total" → harga per satuan dihitung otomatis</div>
                  <div>• <strong>Manual calculate:</strong> Isi "Harga per Satuan" → klik tombol kalkulator untuk hitung total</div>
                  <div>• <strong>Satuan:</strong> Pilih dari dropdown atau ketik sendiri</div>
                  <div>• <strong>Kemasan:</strong> Pilih jenis kemasan yang umum digunakan</div>
                </div>
              </div>
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