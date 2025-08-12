// src/components/warehouse/dialogs/AddEditDialog.tsx
// 🎯 FIXED: Proper Unit Price Calculation with Package Content
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Plus, Edit2, Save, AlertCircle, Calculator, RefreshCw, ChevronDown, Info } from 'lucide-react';
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
  harga: number; // harga_satuan in DB
  expiry: string;
  jumlahBeliKemasan: number;
  isiPerKemasan: number; // ✅ NEW: content per package
  satuanKemasan: string;
  hargaTotalBeliKemasan: number;
}

const initialFormData: FormData = {
  nama: '', kategori: '', supplier: '', stok: 0, minimum: 0,
  satuan: '', harga: 0, expiry: '', jumlahBeliKemasan: 0,
  isiPerKemasan: 1, satuanKemasan: '', hargaTotalBeliKemasan: 0,
};

// ✅ ENHANCED: Base units only (no packages in units)
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

// ✅ ENHANCED: Pure package types (no content info)
const packageTypes = [
  'pak', 'box', 'dus', 'karton', 'sak', 'botol', 'kaleng', 'jerigen',
  'roll', 'bundle', 'krat', 'bal', 'pallet', 'container', 'drum',
  'sachet', 'pouch', 'kantong', 'plastik', 'kemasan'
];

// ✅ ADDED: Unit conversion helper
const convertToBaseUnit = (value: number, fromUnit: string): number => {
  const unit = baseUnits.find(u => u.value === fromUnit);
  return unit ? value * unit.multiplier : value;
};

const convertFromBaseUnit = (value: number, toUnit: string): number => {
  const unit = baseUnits.find(u => u.value === toUnit);
  return unit ? value / unit.multiplier : value;
};

// ✅ ADDED: Domain validation
const getUnitDomain = (unit: string): 'mass' | 'volume' | 'count' | 'length' | 'unknown' => {
  const unitData = baseUnits.find(u => u.value === unit);
  if (!unitData) return 'unknown';
  
  if (unitData.baseUnit === 'gram') return 'mass';
  if (unitData.baseUnit === 'ml') return 'volume';
  if (['pcs', 'buah', 'lembar'].includes(unitData.baseUnit)) return 'count';
  if (unitData.baseUnit === 'meter') return 'length';
  return 'unknown';
};

// ✅ FIXED: Package info parser for edit mode
const parsePackageInfo = (satuanKemasan: string | null): { isiPerKemasan: number; satuanKemasan: string } => {
  if (!satuanKemasan) return { isiPerKemasan: 1, satuanKemasan: '' };
  
  // Parse format: "500 gram per pak" or "1000 ml per botol"
  const match = satuanKemasan.match(/^(\d+(?:\.\d+)?)\s+\w+\s+per\s+(.+)$/);
  if (match) {
    return {
      isiPerKemasan: parseFloat(match[1]),
      satuanKemasan: match[2].trim()
    };
  }
  
  // Fallback: treat as package type only
  return { isiPerKemasan: 1, satuanKemasan: satuanKemasan };
};

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
    packageTypes: boolean;
  }>({
    categories: false, 
    suppliers: false,
    units: false,
    packageTypes: false
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

  // ✅ FIXED: Initialize form data with proper package parsing
  useEffect(() => {
    if (isEditMode && item) {
      // Parse package info from existing data
      const { isiPerKemasan, satuanKemasan } = parsePackageInfo(item.satuanKemasan);
      
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
        isiPerKemasan: isiPerKemasan, // ✅ FIXED: Parse from existing data
        satuanKemasan: satuanKemasan, // ✅ FIXED: Extract package type only
        hargaTotalBeliKemasan: Number(item.hargaTotalBeliKemasan) || 0,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors([]);
  }, [isEditMode, item, isOpen]);

  // ✅ FIXED: Proper price calculation with package content
  const handleFieldChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // ✅ CALCULATE: Unit price when any relevant field changes
      if (['jumlahBeliKemasan', 'isiPerKemasan', 'hargaTotalBeliKemasan'].includes(field)) {
        const jumlah = field === 'jumlahBeliKemasan' ? Number(value) : updated.jumlahBeliKemasan;
        const isiPerKemasan = field === 'isiPerKemasan' ? Number(value) : updated.isiPerKemasan;
        const total = field === 'hargaTotalBeliKemasan' ? Number(value) : updated.hargaTotalBeliKemasan;
        
        if (jumlah > 0 && isiPerKemasan > 0 && total > 0) {
          // ✅ CORRECT CALCULATION: total ÷ (packages × content per package)
          const totalContent = jumlah * isiPerKemasan;
          const unitPrice = Math.round(total / totalContent);
          updated.harga = unitPrice;
          
          // Show calculation feedback
          if (field === 'hargaTotalBeliKemasan' || field === 'isiPerKemasan') {
            toast.success(`Harga per ${updated.satuan}: ${warehouseUtils.formatCurrency(unitPrice)}`);
          }
        }
      }
      
      return updated;
    });
    
    if (errors.length > 0) setErrors([]);
  };

  // ✅ ENHANCED: Validation with domain checking
  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    // Basic validation
    if (!formData.nama.trim()) errors.push('Nama bahan baku harus diisi');
    if (!formData.kategori.trim()) errors.push('Kategori harus diisi');
    if (!formData.supplier.trim()) errors.push('Supplier harus diisi');
    if (!formData.satuan.trim()) errors.push('Satuan harus diisi');
    
    if (formData.stok < 0) errors.push('Stok tidak boleh negatif');
    if (formData.minimum < 0) errors.push('Minimum stok tidak boleh negatif');
    if (formData.harga <= 0) errors.push('Harga per satuan harus lebih dari 0');
    
    // Package validation
    if (formData.jumlahBeliKemasan > 0) {
      if (!formData.satuanKemasan.trim()) {
        errors.push('Satuan kemasan harus diisi jika ada jumlah kemasan');
      }
      if (formData.isiPerKemasan <= 0) {
        errors.push('Isi per kemasan harus lebih dari 0');
      }
      if (formData.hargaTotalBeliKemasan <= 0) {
        errors.push('Harga total beli kemasan harus lebih dari 0');
      }
    }
    
    // ✅ ADDED: Price consistency validation
    if (formData.jumlahBeliKemasan > 0 && formData.isiPerKemasan > 0 && 
        formData.hargaTotalBeliKemasan > 0 && formData.harga > 0) {
      const totalContent = formData.jumlahBeliKemasan * formData.isiPerKemasan;
      const calculatedTotal = formData.harga * totalContent;
      const tolerance = Math.max(calculatedTotal * 0.05, 100); // 5% tolerance
      
      if (Math.abs(calculatedTotal - formData.hargaTotalBeliKemasan) > tolerance) {
        errors.push(`Harga tidak konsisten: ${formData.harga} × ${totalContent} = ${calculatedTotal}, tapi total: ${formData.hargaTotalBeliKemasan}`);
      }
    }
    
    setErrors(errors);
    return errors.length === 0;
  };

  // ✅ FIXED: Submit handler with proper database mapping
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Perbaiki kesalahan pada form');
      return;
    }

    setIsSubmitting(true);
    try {
      // ✅ FIXED: Map to database schema with separate isi_per_kemasan
      const submitData = {
        nama: formData.nama.trim(),
        kategori: formData.kategori.trim(),
        supplier: formData.supplier.trim(),
        stok: formData.stok,
        minimum: formData.minimum,
        satuan: formData.satuan.trim(),
        harga_satuan: formData.harga, // ✅ Map to DB field
        tanggal_kadaluwarsa: formData.expiry || null,
        jumlah_beli_kemasan: formData.jumlahBeliKemasan || null,
        isi_per_kemasan: formData.isiPerKemasan || null, // ✅ FIXED: Store separately
        satuan_kemasan: formData.satuanKemasan ? 
          `${formData.isiPerKemasan} ${formData.satuan} per ${formData.satuanKemasan}` : null, // ✅ Store complete info
        harga_total_beli_kemasan: formData.hargaTotalBeliKemasan || null,
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
      packageTypes: field === 'satuanKemasan' ? false : prev.packageTypes,
    }));
  };

  // ✅ ADDED: Smart calculation helpers
  const calculateTotalContent = () => formData.jumlahBeliKemasan * formData.isiPerKemasan;
  const calculateUnitPrice = () => {
    const totalContent = calculateTotalContent();
    return totalContent > 0 ? Math.round(formData.hargaTotalBeliKemasan / totalContent) : 0;
  };

  // Stock level helper
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

  // Filter helpers
  const filteredUnits = baseUnits.filter(unit => 
    unit.label.toLowerCase().includes(formData.satuan.toLowerCase()) ||
    unit.value.toLowerCase().includes(formData.satuan.toLowerCase())
  );

  const filteredPackageTypes = packageTypes.filter(type => 
    type.toLowerCase().includes(formData.satuanKemasan.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        
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

        {/* ✅ ADDED: Calculation info banner */}
        {formData.jumlahBeliKemasan > 0 && formData.isiPerKemasan > 0 && formData.hargaTotalBeliKemasan > 0 && (
          <div className="p-3 bg-green-50 border-b border-green-200">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Calculator className="w-4 h-4" />
              <span>
                💡 Harga per {formData.satuan}: <strong>{warehouseUtils.formatCurrency(formData.harga)}</strong> 
                (dari {formData.jumlahBeliKemasan} × {formData.isiPerKemasan} = {calculateTotalContent()} {formData.satuan})
              </span>
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

                  {/* ✅ ENHANCED: Base unit only */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Satuan Dasar * 
                      <span className="text-xs text-gray-500 ml-1">(satuan untuk stok dan harga)</span>
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
                      />
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {showDropdown.units && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                        {filteredUnits.length > 0 ? (
                          <>
                            {['Berat', 'Volume', 'Satuan', 'Panjang'].map(category => {
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stok Saat Ini * 
                      <span className="text-xs text-gray-500">({formData.satuan || 'satuan'})</span>
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Stok * 
                      <span className="text-xs text-gray-500">({formData.satuan || 'satuan'})</span>
                    </label>
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
              
              {/* ✅ ENHANCED: Purchase Details with Package Content */}
              <div>
                <h3 className="text-lg font-medium mb-4">Detail Pembelian</h3>
                <div className="space-y-4">
                  
                  {/* ✅ NEW: Package breakdown */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jumlah Kemasan</label>
                      <Input
                        type="number"
                        value={formData.jumlahBeliKemasan}
                        onChange={(e) => handleFieldChange('jumlahBeliKemasan', Number(e.target.value))}
                        min="0"
                        disabled={isSubmitting}
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Isi per Kemasan *
                        <span className="text-xs text-gray-500 block">({formData.satuan || 'satuan'})</span>
                      </label>
                      <Input
                        type="number"
                        value={formData.isiPerKemasan}
                        onChange={(e) => handleFieldChange('isiPerKemasan', Number(e.target.value))}
                        min="0.01"
                        step="0.01"
                        disabled={isSubmitting}
                        placeholder="500"
                      />
                    </div>
                    
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Kemasan</label>
                      <div className="relative">
                        <Input
                          value={formData.satuanKemasan}
                          onChange={(e) => {
                            handleFieldChange('satuanKemasan', e.target.value);
                            setShowDropdown(prev => ({ ...prev, packageTypes: true }));
                          }}
                          onFocus={() => setShowDropdown(prev => ({ ...prev, packageTypes: true }))}
                          onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, packageTypes: false })), 200)}
                          placeholder="pak, botol, dus"
                          disabled={isSubmitting}
                        />
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      {showDropdown.packageTypes && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                          {filteredPackageTypes.length > 0 ? (
                            filteredPackageTypes.map((type) => (
                              <button
                                key={type}
                                type="button"
                                onClick={() => handleSelect('satuanKemasan', type)}
                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                              >
                                {type}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">
                              Tidak ada jenis kemasan yang cocok
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ✅ ADDED: Example helper */}
                  {formData.jumlahBeliKemasan > 0 && formData.isiPerKemasan > 0 && formData.satuanKemasan && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <Info className="w-4 h-4" />
                        <span>
                          Contoh: {formData.jumlahBeliKemasan} {formData.satuanKemasan} × {formData.isiPerKemasan} {formData.satuan} = 
                          <strong> {calculateTotalContent()} {formData.satuan}</strong> total
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Harga Total Beli Kemasan 
                      <span className="text-xs text-gray-500 ml-1">(akan menghitung harga per {formData.satuan} otomatis)</span>
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
                      Harga per {formData.satuan || 'Satuan'} * 
                      <span className="text-xs text-green-600 ml-1">
                        {formData.jumlahBeliKemasan > 0 && formData.isiPerKemasan > 0 && formData.hargaTotalBeliKemasan > 0 && '(dihitung otomatis)'}
                      </span>
                    </label>
                    <div className="relative">
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
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Tip: Isi detail kemasan di atas, maka harga per {formData.satuan} akan dihitung otomatis
                    </p>
                  </div>
                </div>
              </div>

              {/* ✅ ENHANCED: Purchase Summary */}
              {formData.jumlahBeliKemasan > 0 && formData.isiPerKemasan > 0 && formData.hargaTotalBeliKemasan > 0 && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="text-sm font-medium text-green-900 mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Ringkasan Pembelian & Perhitungan
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">Jumlah kemasan:</span>
                      <span className="font-medium">{formData.jumlahBeliKemasan} {formData.satuanKemasan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Isi per kemasan:</span>
                      <span className="font-medium">{formData.isiPerKemasan} {formData.satuan}</span>
                    </div>
                    <div className="flex justify-between border-t border-green-200 pt-2">
                      <span className="text-green-700">Total isi:</span>
                      <span className="font-bold">{calculateTotalContent()} {formData.satuan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Harga total:</span>
                      <span className="font-medium">{warehouseUtils.formatCurrency(formData.hargaTotalBeliKemasan)}</span>
                    </div>
                    <div className="flex justify-between border-t border-green-200 pt-2">
                      <span className="text-green-700">Harga per {formData.satuan}:</span>
                      <span className="font-bold text-green-900">{warehouseUtils.formatCurrency(formData.harga)}</span>
                    </div>
                    
                    <div className="text-xs text-green-600 mt-3 p-2 bg-green-100 rounded">
                      ✅ Perhitungan: {warehouseUtils.formatCurrency(formData.hargaTotalBeliKemasan)} ÷ ({formData.jumlahBeliKemasan} × {formData.isiPerKemasan}) = {warehouseUtils.formatCurrency(formData.harga)} per {formData.satuan}
                    </div>
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

              {/* ✅ ENHANCED: Calculation helper */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Cara Menghitung Harga per Satuan
                </h4>
                <div className="text-xs text-blue-600 space-y-2">
                  <div className="p-2 bg-blue-100 rounded">
                    <strong>Contoh:</strong> Beli 2 pak biji chia, isi 500 gram per pak, total bayar Rp 180.000
                  </div>
                  <div>1. <strong>Total isi:</strong> 2 pak × 500 gram = 1.000 gram</div>
                  <div>2. <strong>Harga per gram:</strong> Rp 180.000 ÷ 1.000 gram = Rp 180/gram</div>
                  <div>3. <strong>Bukan:</strong> Rp 180.000 ÷ 2 pak = Rp 90.000/pak ❌</div>
                  <div className="text-blue-700 font-medium mt-2">
                    💡 <strong>Kunci:</strong> Selalu bagi dengan total isi, bukan jumlah kemasan!
                  </div>
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