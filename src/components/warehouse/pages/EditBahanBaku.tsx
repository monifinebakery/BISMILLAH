// src/components/warehouse/pages/EditBahanBaku.tsx - Full Page Edit Bahan Baku
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, X, Package, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { Textarea } from '@/components/ui/textarea';

import { warehouseApi } from '../services/warehouseApi';
import { FNB_COGS_CATEGORIES } from '@/components/profitAnalysis/constants/profitConstants';
import { toNumber } from '../utils/typeUtils';

interface FormData {
  nama: string;
  kategori: string;
  supplier: string;
  stok: number;
  minimum: number;
  satuan: string;
  harga: number;
  expiry: string;
  keterangan?: string;
}

const SATUAN_OPTIONS = [
  { value: 'gram', label: 'gram' },
  { value: 'kilogram', label: 'kilogram (kg)' },
  { value: 'ml', label: 'mililiter (ml)' },
  { value: 'liter', label: 'liter' },
  { value: 'pcs', label: 'pieces (pcs)' },
  { value: 'buah', label: 'buah' },
  { value: 'lembar', label: 'lembar' },
  { value: 'meter', label: 'meter' },
];

export const EditBahanBaku: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    nama: '',
    kategori: '',
    supplier: '',
    stok: 0,
    minimum: 0,
    satuan: '',
    harga: 0,
    expiry: '',
    keterangan: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!id && id !== 'new';

  // Fetch existing data for edit mode
  const { data: existingItem, isLoading: isLoadingItem } = useQuery({
    queryKey: ['warehouse-item', id, user?.id],
    queryFn: async () => {
      if (!isEditMode || !user?.id) return null;
      const service = await warehouseApi.createService('crud', { userId: user.id });
      return await service.getBahanBakuById(id);
    },
    enabled: isEditMode && !!user?.id,
  });

  // Fetch suppliers
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // Fetch from suppliers table
      const service = await warehouseApi.createService('crud', { userId: user.id });
      // You might need to add this method to the service
      return []; // TODO: implement fetchSuppliers method
    },
    enabled: !!user?.id,
  });

  // Update form when existing item loads
  useEffect(() => {
    if (existingItem) {
      setFormData({
        nama: existingItem.nama || '',
        kategori: existingItem.kategori || '',
        supplier: existingItem.supplier || '',
        stok: toNumber(existingItem.stok),
        minimum: toNumber(existingItem.minimum),
        satuan: existingItem.satuan || '',
        harga: toNumber(existingItem.harga),
        expiry: existingItem.expiry ? existingItem.expiry.split('T')[0] : '',
        keterangan: existingItem.keterangan || ''
      });
    }
  }, [existingItem]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const service = await warehouseApi.createService('crud', { userId: user.id });
      
      if (isEditMode) {
        const success = await service.updateBahanBaku(id, data);
        if (!success) throw new Error('Failed to update item');
        return { ...data, id };
      } else {
        const success = await service.addBahanBaku(data);
        if (!success) throw new Error('Failed to create item');
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      toast.success(`Bahan baku berhasil ${isEditMode ? 'diperbarui' : 'ditambahkan'}!`);
      navigate('/warehouse');
    },
    onError: (error: Error) => {
      logger.error('Save error:', error);
      toast.error(`Gagal ${isEditMode ? 'memperbarui' : 'menambahkan'} bahan baku: ${error.message}`);
    }
  });

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nama.trim()) newErrors.nama = 'Nama bahan baku harus diisi';
    if (!formData.kategori) newErrors.kategori = 'Kategori harus dipilih';
    if (!formData.supplier.trim()) newErrors.supplier = 'Supplier harus diisi';
    if (!formData.satuan) newErrors.satuan = 'Satuan harus dipilih';
    if (formData.stok < 0) newErrors.stok = 'Stok tidak boleh negatif';
    if (formData.minimum < 0) newErrors.minimum = 'Minimum stok tidak boleh negatif';
    if (formData.harga <= 0) newErrors.harga = 'Harga harus lebih dari 0';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Perbaiki kesalahan pada form');
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleCancel = () => {
    navigate('/warehouse');
  };

  if (isLoadingItem) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
              <span className="text-lg text-gray-600">Memuat data...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Gudang', href: '/warehouse' },
    { label: isEditMode ? 'Edit Bahan Baku' : 'Tambah Bahan Baku' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header with Breadcrumb */}
        <div className="space-y-4">
          <Breadcrumb items={breadcrumbItems} />
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Package className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {isEditMode ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isEditMode 
                    ? 'Perbarui informasi bahan baku'
                    : 'Tambahkan bahan baku baru ke inventaris'
                  }
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nama */}
                <div className="space-y-2">
                  <Label htmlFor="nama" className="required">Nama Bahan Baku</Label>
                  <Input
                    id="nama"
                    type="text"
                    value={formData.nama}
                    onChange={(e) => handleInputChange('nama', e.target.value)}
                    placeholder="Masukkan nama bahan baku"
                    className={errors.nama ? 'border-red-500' : ''}
                  />
                  {errors.nama && <p className="text-sm text-red-600">{errors.nama}</p>}
                </div>

                {/* Kategori */}
                <div className="space-y-2">
                  <Label className="required">Kategori</Label>
                  <Select
                    value={formData.kategori}
                    onValueChange={(value) => handleInputChange('kategori', value)}
                  >
                    <SelectTrigger className={errors.kategori ? 'border-red-500' : ''}>
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
                  {errors.kategori && <p className="text-sm text-red-600">{errors.kategori}</p>}
                </div>

                {/* Supplier */}
                <div className="space-y-2">
                  <Label htmlFor="supplier" className="required">Supplier</Label>
                  <Input
                    id="supplier"
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange('supplier', e.target.value)}
                    placeholder="Masukkan nama supplier"
                    className={errors.supplier ? 'border-red-500' : ''}
                  />
                  {errors.supplier && <p className="text-sm text-red-600">{errors.supplier}</p>}
                </div>

                {/* Satuan */}
                <div className="space-y-2">
                  <Label className="required">Satuan</Label>
                  <Select
                    value={formData.satuan}
                    onValueChange={(value) => handleInputChange('satuan', value)}
                  >
                    <SelectTrigger className={errors.satuan ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih satuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {SATUAN_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.satuan && <p className="text-sm text-red-600">{errors.satuan}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Stok & Harga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stok */}
                <div className="space-y-2">
                  <Label htmlFor="stok" className="required">Stok Saat Ini</Label>
                  <Input
                    id="stok"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.stok}
                    onChange={(e) => handleInputChange('stok', parseFloat(e.target.value) || 0)}
                    className={errors.stok ? 'border-red-500' : ''}
                  />
                  {errors.stok && <p className="text-sm text-red-600">{errors.stok}</p>}
                </div>

                {/* Minimum */}
                <div className="space-y-2">
                  <Label htmlFor="minimum" className="required">Stok Minimum</Label>
                  <Input
                    id="minimum"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minimum}
                    onChange={(e) => handleInputChange('minimum', parseFloat(e.target.value) || 0)}
                    className={errors.minimum ? 'border-red-500' : ''}
                  />
                  {errors.minimum && <p className="text-sm text-red-600">{errors.minimum}</p>}
                </div>

                {/* Harga */}
                <div className="space-y-2">
                  <Label htmlFor="harga" className="required">Harga per Satuan</Label>
                  <Input
                    id="harga"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.harga}
                    onChange={(e) => handleInputChange('harga', parseFloat(e.target.value) || 0)}
                    className={errors.harga ? 'border-red-500' : ''}
                  />
                  {errors.harga && <p className="text-sm text-red-600">{errors.harga}</p>}
                </div>

                {/* Expiry */}
                <div className="space-y-2">
                  <Label htmlFor="expiry">Tanggal Kadaluarsa</Label>
                  <Input
                    id="expiry"
                    type="date"
                    value={formData.expiry}
                    onChange={(e) => handleInputChange('expiry', e.target.value)}
                  />
                </div>
              </div>
              
              {/* Keterangan */}
              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                <Textarea
                  id="keterangan"
                  value={formData.keterangan}
                  onChange={(e) => handleInputChange('keterangan', e.target.value)}
                  placeholder="Tambahkan keterangan tambahan jika diperlukan..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={saveMutation.isPending}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saveMutation.isPending}
              className="w-full sm:w-auto"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditMode ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};