// src/components/warehouse/components/WarehouseAddEditPage.tsx
// Full page warehouse add/edit form with breadcrumbs and responsive design

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package,
  Save,
  ArrowLeft,
  Home,
  AlertCircle,
  RefreshCw,
  Calculator,
  Truck,
  Calendar,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

// Import Breadcrumb components
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Types and utilities
import type { BahanBakuFrontend, BahanBakuFormData } from '../types';
import { useWarehouseContext } from '../context/WarehouseContext';
import { useAuth } from '@/contexts/AuthContext';
import { warehouseUtils } from '../services/warehouseUtils';
import { logger } from '@/utils/logger';
import { toNumber } from '../utils/typeUtils';

// Constants
import { FNB_COGS_CATEGORIES } from '@/components/profitAnalysis/constants/profitConstants';

interface WarehouseAddEditPageProps {}

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

const initialFormData: BahanBakuFormData = {
  nama: '',
  kategori: '',
  supplier: '',
  stok: 0,
  minimum: 0,
  satuan: '',
  harga: 0,
  expiry: '',
};

// Helper function to fetch suppliers
const fetchSuppliers = async (userId?: string): Promise<{ id: string; nama: string }[]> => {
  try {
    if (!userId) return [];
    
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('id, nama')
      .eq('user_id', userId)
      .order('nama');
      
    if (error) {
      logger.error('Failed to fetch suppliers:', error);
      return [];
    }
    
    return suppliers || [];
  } catch (error) {
    logger.error('Error fetching suppliers:', error);
    return [];
  }
};

const WarehouseAddEditPage: React.FC<WarehouseAddEditPageProps> = () => {
  const navigate = useNavigate();
  const { id: itemId } = useParams<{ id: string }>();
  const isEditMode = !!itemId;

  // Contexts
  const { user } = useAuth();
  const { 
    bahanBaku, 
    addBahanBaku, 
    updateBahanBaku, 
    loading: warehouseLoading 
  } = useWarehouseContext();

  // State
  const [formData, setFormData] = useState<BahanBakuFormData>(initialFormData);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(isEditMode);

  // Find existing item if in edit mode
  const existingItem = isEditMode ? bahanBaku.find(item => item.id === itemId) : null;

  // Query for suppliers
  const { data: suppliers = [], isLoading: suppliersLoading, refetch: refetchSuppliers } = useQuery({
    queryKey: ['suppliers', user?.id],
    queryFn: () => fetchSuppliers(user?.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const availableSuppliers = suppliers.map(s => s.nama).filter(Boolean);

  // Initialize form data
  useEffect(() => {
    if (isEditMode) {
      if (!existingItem && !warehouseLoading) {
        toast.error('Item tidak ditemukan');
        navigate('/gudang');
        return;
      }
      
      if (existingItem) {
        setFormData({
          nama: existingItem.nama || '',
          kategori: existingItem.kategori || '',
          supplier: existingItem.supplier || '',
          stok: toNumber(existingItem.stok),
          minimum: toNumber(existingItem.minimum),
          satuan: existingItem.satuan || '',
          harga: toNumber(existingItem.harga),
          expiry: existingItem.expiry ? new Date(existingItem.expiry).toISOString().split('T')[0] : '',
        });
        setPageLoading(false);
      }
    } else {
      setPageLoading(false);
    }
  }, [isEditMode, existingItem, warehouseLoading, navigate]);

  // Handle field changes
  const handleFieldChange = useCallback((field: keyof BahanBakuFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) setErrors([]);
  }, [errors.length]);

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.nama.trim()) newErrors.push('Nama bahan baku harus diisi');
    if (!formData.kategori.trim()) newErrors.push('Kategori harus diisi');
    if (!formData.supplier.trim()) newErrors.push('Supplier harus diisi');
    if (!formData.satuan.trim()) newErrors.push('Satuan harus diisi');
    if (formData.stok < 0) newErrors.push('Stok tidak boleh negatif');
    if (formData.minimum < 0) newErrors.push('Minimum stok tidak boleh negatif');
    if (formData.harga <= 0) newErrors.push('Harga per satuan harus lebih dari 0');
    
    setErrors(newErrors);
    return newErrors.length === 0;
  }, [formData]);

  // Submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Authentication is already handled by AuthGuard at router level
    
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
        expiry: formData.expiry || undefined,
      };

      let success = false;
      
      if (isEditMode && itemId) {
        success = await updateBahanBaku(itemId, submitData);
      } else {
        success = await addBahanBaku(submitData);
      }

      if (success) {
        toast.success(isEditMode ? 'Item berhasil diperbarui' : 'Item berhasil ditambahkan');
        navigate('/gudang');
      } else {
        toast.error('Gagal menyimpan data. Silakan coba lagi.');
      }
    } catch (error: any) {
      logger.error('Error in handleSubmit:', error);
      toast.error(error.message || 'Gagal menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, isEditMode, itemId, updateBahanBaku, addBahanBaku, navigate, user]);

  // Cancel handler
  const handleCancel = useCallback(() => {
    navigate('/gudang');
  }, [navigate]);

  // Refresh suppliers
  const handleRefreshSuppliers = useCallback(async () => {
    try {
      await refetchSuppliers();
      toast.success('Data supplier berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal memperbarui data supplier');
    }
  }, [refetchSuppliers]);

  // Get stock level info for preview
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

  // Loading state
  if (pageLoading || warehouseLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="text-sm text-gray-600">
              {isEditMode ? 'Memuat data item...' : 'Memuat halaman...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-20 sm:pb-8">
      {/* Header with Breadcrumb */}
        {/* Header with Breadcrumb */}
        <div className="mb-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/gudang')}>
                    <Package className="h-4 w-4" />
                    Gudang
                  </Button>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isEditMode ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Page Title */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline" 
                size="sm"
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-orange-600" />
                  </div>
                  {isEditMode ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
                  {existingItem && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      ID: {existingItem.id.slice(-8)}
                    </Badge>
                  )}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isEditMode
                    ? 'Edit informasi bahan baku dan stok'
                    : 'Tambah bahan baku baru ke gudang'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Error Summary */}
          {errors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription>
                <div className="text-red-800">
                  <p className="font-medium mb-2">Terdapat kesalahan pada form:</p>
                  <ul className="space-y-1">
                    {errors.map((error, index) => (
                      <li key={index} className="text-sm">• {error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Main Form - Left Column */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Basic Information */}
              <Card className="border-gray-200 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    Informasi Dasar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Nama */}
                    <div className="space-y-2">
                      <Label htmlFor="nama" className="text-sm font-medium text-gray-700">
                        Nama Bahan Baku *
                      </Label>
                      <Input
                        id="nama"
                        value={formData.nama}
                        onChange={(e) => handleFieldChange('nama', e.target.value)}
                        placeholder="Nama bahan baku"
                        disabled={isSubmitting}
                        required
                        className="text-sm"
                      />
                    </div>

                    {/* Kategori */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Kategori *
                      </Label>
                      <Select
                        value={formData.kategori}
                        onValueChange={(value) => handleFieldChange('kategori', value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {FNB_COGS_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Supplier */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Supplier *
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRefreshSuppliers}
                          disabled={isSubmitting}
                          className="h-6 w-6 p-0"
                        >
                          <RefreshCw className={`h-3 w-3 ${suppliersLoading ? 'animate-spin' : ''}`} />
                        </Button>
                      </div>
                      <Select
                        value={formData.supplier}
                        onValueChange={(value) => handleFieldChange('supplier', value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Pilih supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSuppliers.map((supplier) => (
                            <SelectItem key={supplier} value={supplier}>
                              {supplier}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Satuan */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Satuan Dasar *
                      </Label>
                      <Select
                        value={formData.satuan}
                        onValueChange={(value) => handleFieldChange('satuan', value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger className="text-sm">
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

                  </div>

                  {/* Tanggal Kadaluwarsa */}
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="text-sm font-medium text-gray-700">
                      Tanggal Kadaluarsa (Opsional)
                    </Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={formData.expiry}
                      onChange={(e) => handleFieldChange('expiry', e.target.value)}
                      disabled={isSubmitting}
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Kosongkan jika tidak memiliki tanggal kadaluwarsa
                    </p>
                  </div>
                  
                </CardContent>
              </Card>

              {/* Stock and Price Information */}
              <Card className="border-gray-200 bg-white">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    Informasi Stok & Harga
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Stok */}
                    <div className="space-y-2">
                      <Label htmlFor="stok" className="text-sm font-medium text-gray-700">
                        Stok Saat Ini ({formData.satuan || 'satuan'}) *
                      </Label>
                      <Input
                        id="stok"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.stok}
                        onChange={(e) => handleFieldChange('stok', toNumber(e.target.value))}
                        disabled={isSubmitting}
                        required
                        className="text-sm"
                      />
                    </div>

                    {/* Minimum Stok */}
                    <div className="space-y-2">
                      <Label htmlFor="minimum" className="text-sm font-medium text-gray-700">
                        Minimum Stok ({formData.satuan || 'satuan'}) *
                      </Label>
                      <Input
                        id="minimum"
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.minimum}
                        onChange={(e) => handleFieldChange('minimum', toNumber(e.target.value))}
                        disabled={isSubmitting}
                        required
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        Batas minimum untuk peringatan stok rendah
                      </p>
                    </div>

                  </div>

                  {/* Harga */}
                  <div className="space-y-2">
                    <Label htmlFor="harga" className="text-sm font-medium text-gray-700">
                      Harga per {formData.satuan || 'satuan'} *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                      <Input
                        id="harga"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.harga}
                        onChange={(e) => handleFieldChange('harga', toNumber(e.target.value))}
                        className="pl-12 text-sm"
                        disabled={isSubmitting}
                        required
                        placeholder="0"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      💡 Harga referensi master. WAC dihitung dari transaksi pembelian aktual.
                    </p>
                  </div>

                </CardContent>
              </Card>

            </div>

            {/* Preview Panel - Right Column */}
            <div className="xl:col-span-1">
              <div className="sticky top-6 space-y-6">
                
                {/* Preview Card */}
                <Card className="border-2 border-dashed border-gray-200 bg-gray-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nama:</span>
                        <span className="font-medium truncate max-w-32" title={formData.nama}>
                          {formData.nama || 'Belum diisi'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kategori:</span>
                        <span className="font-medium">
                          {formData.kategori || 'Belum dipilih'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Supplier:</span>
                        <span className="font-medium truncate max-w-32" title={formData.supplier}>
                          {formData.supplier || 'Belum dipilih'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Satuan:</span>
                        <span className="font-medium">
                          {formData.satuan || 'Belum dipilih'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stok:</span>
                        <span className="font-medium">
                          {formData.stok} {formData.satuan || 'unit'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Minimum:</span>
                        <span className="font-medium">
                          {formData.minimum} {formData.satuan || 'unit'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Harga:</span>
                        <span className="font-medium text-green-600">
                          {warehouseUtils.formatCurrency(formData.harga)}/{formData.satuan || 'unit'}
                        </span>
                      </div>
                      
                      {formData.expiry && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Kadaluwarsa:</span>
                          <span className="font-medium">
                            {new Date(formData.expiry).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Stock Level Preview */}
                    {formData.stok > 0 && formData.minimum > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Status Stok</h4>
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${getStockLevelInfo(formData.stok, formData.minimum).colorClass}`} />
                          <span className="text-sm text-gray-600">
                            {getStockLevelInfo(formData.stok, formData.minimum).label}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round(getStockLevelInfo(formData.stok, formData.minimum).percentage)}% dari minimum
                        </div>
                        {formData.stok <= formData.minimum && (
                          <div className="mt-2 text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                            ⚠️ Stok di bawah minimum
                          </div>
                        )}
                      </div>
                    )}

                    {/* Value Preview */}
                    {formData.stok > 0 && formData.harga > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Nilai Total Stok:</span>
                          <span className="font-bold text-lg text-green-600">
                            {warehouseUtils.formatCurrency(formData.stok * formData.harga)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                  </CardContent>
                </Card>

                {/* Action Buttons - Sticky */}
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-orange-500 hover:bg-orange-600 min-h-[44px]"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {isEditMode ? 'Simpan Perubahan' : 'Tambah Item'}
                          </>
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                        className="w-full min-h-[44px]"
                      >
                        Batal
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>

          </div>

        </form>

      </div>
    </div>
  );
};

export default WarehouseAddEditPage;