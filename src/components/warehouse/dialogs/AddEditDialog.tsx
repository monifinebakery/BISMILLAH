import React, { useState, useEffect, ErrorBoundary } from 'react';
import { FormField, ActionButtons, LoadingStates } from '@/components/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Edit2, Save, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../services/warehouseApi';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { warehouseUtils } from '../services/warehouseUtils';
import { logger } from '@/utils/logger';
import { toNumber } from '../utils/typeUtils';
import type { BahanBakuFrontend } from '../types';
// Gunakan kategori HPP yang sama dengan analisis profit
import { FNB_COGS_CATEGORIES } from '@/components/profitAnalysis/constants/profitConstants';

// Error Boundary Component for Dialog
class DialogErrorBoundary extends React.Component<{ children: React.ReactNode; onError?: () => void }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    logger.error('Dialog Error Boundary caught error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    logger.error('Dialog error details:', { error, errorInfo });
    toast.error('Terjadi kesalahan pada dialog. Silakan coba lagi.');
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return (
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-red-600">⚠️ Terjadi Kesalahan</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p className="text-gray-600 mb-4">Dialog tidak dapat dimuat dengan benar. Silakan tutup dan coba lagi.</p>
              <Button 
                onClick={() => {
                  this.setState({ hasError: false });
                  this.props.onError?.();
                }}
                className="w-full"
              >
                Tutup Dialog
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      );
    }

    return this.props.children;
  }
}

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
  { value: 'kilogram', label: 'kilogram', category: 'Berat', baseUnit: 'gram', multiplier: 1000 },
  { value: 'kg', label: 'kg (kilogram)', category: 'Berat', baseUnit: 'gram', multiplier: 1000 },
  { value: 'ml', label: 'mililiter (ml)', category: 'Volume', baseUnit: 'ml', multiplier: 1 },
  { value: 'liter', label: 'liter', category: 'Volume', baseUnit: 'ml', multiplier: 1000 },
  { value: 'pcs', label: 'pieces (pcs)', category: 'Satuan', baseUnit: 'pcs', multiplier: 1 },
  { value: 'buah', label: 'buah', category: 'Satuan', baseUnit: 'buah', multiplier: 1 },
  { value: 'lembar', label: 'lembar', category: 'Satuan', baseUnit: 'lembar', multiplier: 1 },
  { value: 'meter', label: 'meter', category: 'Panjang', baseUnit: 'meter', multiplier: 1 },
];

// Helper function to fetch suppliers with ID and name for mapping
const fetchSuppliersWithMapping = async (userId?: string): Promise<{ id: string; nama: string }[]> => {
  try {
    if (!userId) {
      logger.warn('No user found for fetching suppliers');
      return [];
    }
    
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('id, nama')
      .eq('user_id', userId)
      .order('nama');
      
    if (error) {
      logger.error('Failed to fetch suppliers from table:', error);
      return [];
    }
    
    return suppliers || [];
  } catch (error) {
    logger.error('Failed to fetch suppliers with mapping:', error);
    return [];
  }
};

// Helper function to resolve supplier ID to name
const resolveSupplierIdToName = (supplierId: string, suppliersList: { id: string; nama: string }[]): string => {
  if (!supplierId) return '';
  
  // If it's already a name (not UUID format), return as is
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(supplierId)) {
    return supplierId;
  }
  
  // Find supplier by ID
  const supplier = suppliersList.find(s => s.id === supplierId);
  return supplier ? supplier.nama : supplierId; // Fallback to ID if not found
};

// Helper function to resolve supplier name to ID for saving
const resolveSupplierNameToId = (supplierName: string, suppliersList: { id: string; nama: string }[]): string => {
  if (!supplierName) return '';
  
  // Find supplier by name
  const supplier = suppliersList.find(s => s.nama === supplierName);
  return supplier ? supplier.id : supplierName; // Fallback to name if not found
};

const fetchDialogData = async (type: 'categories' | 'suppliers', userId?: string): Promise<string[]> => {
  try {
    if (type === 'categories') {
      return [...FNB_COGS_CATEGORIES];
    }
    
    // Fetch suppliers from suppliers table and return names only
    const suppliers = await fetchSuppliersWithMapping(userId);
    return suppliers.map(s => s.nama).filter(Boolean);
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
  });
  // Price suggestion removed

  const isEditMode = mode === 'edit' || !!item;

  // Query untuk daftar suppliers (nama saja untuk dropdown)
  const { user } = useAuth();
  const { data: queriedSuppliers = [], isLoading: suppliersLoading, refetch: refetchSuppliers } = useQuery({
    queryKey: ['dialog-suppliers', user?.id],
    queryFn: () => fetchDialogData('suppliers', user?.id),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });
  
  // Query untuk mapping supplier ID ke nama (untuk resolve existing data)
  const { data: suppliersMapping = [] } = useQuery({
    queryKey: ['dialog-suppliers-mapping', user?.id],
    queryFn: () => fetchSuppliersWithMapping(user?.id),
    enabled: isOpen && !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
  
  const availableCategories = [...FNB_COGS_CATEGORIES];
  const availableSuppliers = queriedSuppliers.length > 0 ? queriedSuppliers : propSuppliers;

  useEffect(() => {
    if (isEditMode && item) {
      // Resolve supplier ID to name for display
      const resolvedSupplierName = suppliersMapping.length > 0 
        ? resolveSupplierIdToName(item.supplier || '', suppliersMapping)
        : item.supplier || '';
        
      logger.debug('Resolving supplier for edit mode:', {
        originalSupplier: item.supplier,
        resolvedSupplierName,
        mappingCount: suppliersMapping.length
      });
      
      setFormData({
        nama: item.nama || '',
        kategori: item.kategori || '',
        supplier: resolvedSupplierName,
        stok: toNumber(item.stok),
        minimum: toNumber(item.minimum),
        satuan: item.satuan || '',
        harga: toNumber(item.harga),
        expiry: item.expiry ? item.expiry.split('T')[0] : '',
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors([]);
  }, [isEditMode, item, isOpen, suppliersMapping]);

  const handleFieldChange = (field: keyof FormData, value: string | number) => {
    try {
      logger.debug('Field change:', { field, value, type: typeof value });
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors.length > 0) setErrors([]);
    } catch (error) {
      logger.error('Error in handleFieldChange:', error);
      toast.error('Terjadi kesalahan saat mengubah field');
    }
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
      // Resolve supplier name back to ID for saving
      const resolvedSupplierId = suppliersMapping.length > 0 
        ? resolveSupplierNameToId(formData.supplier.trim(), suppliersMapping)
        : formData.supplier.trim();
        
      logger.debug('Resolving supplier for submission:', {
        supplierName: formData.supplier.trim(),
        resolvedSupplierId,
        mappingCount: suppliersMapping.length
      });
      
      const submitData = {
        nama: formData.nama.trim(),
        kategori: formData.kategori.trim(),
        supplier: resolvedSupplierId,
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
  const handleSelect = (field: 'supplier', value: string) => {
    handleFieldChange(field, value);
    setShowDropdown(prev => ({
      ...prev,
      suppliers: false,
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

  // Remove filteredUnits since we're now using Select component

  return (
    <DialogErrorBoundary onError={onClose}>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent centerMode="overlay" size="md+">
        <div className="dialog-panel dialog-panel-md-plus dialog-no-overflow">
          <DialogHeader className="dialog-header">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {isEditMode ? <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg sm:text-xl font-semibold text-overflow-safe">{isEditMode ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}</DialogTitle>
                <p className="text-xs sm:text-sm text-gray-600 text-overflow-safe">{isEditMode ? 'Ubah data master bahan baku' : 'Tambah data master bahan baku baru'}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isSubmitting} className="flex-shrink-0 input-mobile-safe">
                <RefreshCw className={`w-4 h-4 ${suppliersLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </DialogHeader>

          <div className="dialog-body">
            {errors.length > 0 && (
              <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg mb-6 dialog-no-overflow">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-medium text-red-800 mb-1 text-overflow-safe">Kesalahan pada form:</h3>
                    <ul className="text-xs sm:text-sm text-red-700 space-y-1">
                      {errors.map((error, index) => <li key={index} className="text-overflow-safe">• {error}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <form id="warehouse-form" onSubmit={handleSubmit} className="dialog-no-overflow">
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {/* Left Column - Basic Info */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-overflow-safe">Informasi Dasar</h3>
                    <div className="space-y-3 sm:space-y-4">
                      <FormField
                        type="text"
                        name="nama"
                        label="Nama Bahan Baku"
                        value={formData.nama}
                        onChange={(e) => handleFieldChange('nama', e.target.value)}
                        placeholder="Nama bahan baku"
                        disabled={isSubmitting}
                        required
                      />

                      <FormField
                        type="select"
                        name="kategori"
                        label="Kategori"
                        value={formData.kategori}
                        onChange={(value) => handleFieldChange('kategori', value)}
                        options={availableCategories.map(category => ({
                          value: category,
                          label: category
                        }))}
                        placeholder="Pilih kategori"
                        disabled={isSubmitting}
                        required
                      />

                      <div className="relative">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 text-overflow-safe">
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
                          className="text-sm input-mobile-safe"
                        />
                        {showDropdown.suppliers && availableSuppliers.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md z-[110] max-h-32 sm:max-h-40 overflow-y-auto dialog-no-overflow">
                            {availableSuppliers
                              .filter(sup => sup.toLowerCase().includes(formData.supplier.toLowerCase()))
                              .map((supplier) => (
                                <button
                                  key={supplier}
                                  type="button"
                                  onClick={() => handleSelect('supplier', supplier)}
                                  className="w-full text-left px-3 py-2 hover:bg-gray-50 text-xs sm:text-sm input-mobile-safe text-overflow-safe"
                                >
                                  {supplier}
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 text-overflow-safe">
                          Satuan Dasar * <span className="text-xs text-gray-500 ml-1">(satuan untuk stok dan harga)</span>
                        </label>
                        <Select
                          value={formData.satuan}
                          onValueChange={(value) => {
                            try {
                              logger.debug('🔄 Unit selection:', { value, timestamp: new Date().toISOString() });
                              handleFieldChange('satuan', value);
                              toast.success(`Satuan "${value}" dipilih`, { duration: 1000 });
                            } catch (error) {
                              logger.error('Error in unit selection:', error);
                              toast.error('Gagal memilih satuan');
                            }
                          }}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="text-sm input-mobile-safe">
                            <SelectValue placeholder="Pilih satuan dasar" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto">
                            {['Berat', 'Volume', 'Satuan', 'Panjang'].map(category => {
                              const categoryUnits = baseUnits.filter(unit => unit.category === category);
                              if (categoryUnits.length === 0) return null;
                              return (
                                <div key={category}>
                                  <div className="px-3 py-1 text-xs font-medium text-gray-500 bg-gray-100 border-b">
                                    {category}
                                  </div>
                                  {categoryUnits.map((unit) => (
                                    <SelectItem 
                                      key={unit.value} 
                                      value={unit.value}
                                      className="focus:bg-orange-50 cursor-pointer"
                                    >
                                      <div className="flex justify-between items-center w-full">
                                        <span className="truncate">{unit.label}</span>
                                        <span className="text-gray-400 text-xs ml-2 flex-shrink-0">{unit.value}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </div>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <FormField
                        type="date"
                        name="expiry"
                        label="Tanggal Kadaluarsa"
                        value={formData.expiry}
                        onChange={(e) => handleFieldChange('expiry', e.target.value)}
                        disabled={isSubmitting}
                        helpText="Tanggal kadaluarsa bahan baku (opsional)"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Stock & Price */}
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-overflow-safe">Informasi Stok</h3>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <FormField
                        type="number"
                        name="stok"
                        label={`Stok Saat Ini (${formData.satuan || 'satuan'})`}
                        value={formData.stok}
                        onChange={(e) => handleFieldChange('stok', toNumber(e.target.value))}
                        min={0}
                        disabled={isSubmitting}
                        required
                        mobileOptimized
                      />
                      <FormField
                        type="number"
                        name="minimum"
                        label={`Minimum Stok (${formData.satuan || 'satuan'})`}
                        value={formData.minimum}
                        onChange={(e) => handleFieldChange('minimum', toNumber(e.target.value))}
                        min={0}
                        disabled={isSubmitting}
                        required
                        mobileOptimized
                        helpText="Batas minimum stok untuk peringatan"
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-overflow-safe">Harga Referensi</h3>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 text-overflow-safe">
                        Harga per {formData.satuan || 'satuan'} *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                        <Input
                          type="number"
                          value={formData.harga}
                          onChange={(e) => handleFieldChange('harga', toNumber(e.target.value))}
                          min="0"
                          className="pl-10 sm:pl-12 text-sm input-mobile-safe"
                          disabled={isSubmitting}
                          required
                          placeholder="0"
                        />
                      </div>
                      {/* Price suggestion removed */}
                      {isEditMode && typeof item?.hargaRataRata === 'number' && (
                        <p className="text-xs text-gray-500 mt-1 text-overflow-safe">
                          Harga rata-rata (server): <strong>{warehouseUtils.formatCurrency(item.hargaRataRata)}</strong>
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1 text-overflow-safe">
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
            </form>
          </div>

          <div className="p-4 border-t bg-gray-50">
            <ActionButtons
              onCancel={onClose}
              submitText={isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Item')}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              <button 
                type="submit" 
                form="warehouse-form"
                disabled={isSubmitting}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Tambah Item')}
              </button>
            </ActionButtons>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </DialogErrorBoundary>
  );
};

export default AddEditDialog;
