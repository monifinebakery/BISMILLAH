// src/components/purchase/components/PurchaseDialog.tsx - Enhanced for Edit Mode

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CalendarIcon, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Package,
  Calculator,
  ShoppingCart,
  X,
  Edit3,
  Save,
  RotateCcw
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { PurchaseDialogProps, PurchaseItem } from '../types/purchase.types';
import { usePurchaseForm } from '../hooks/usePurchaseForm';
import { usePurchaseItemManager } from '../hooks/usePurchaseItemManager';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';

// ✅ Temporary inline component until SimplePurchaseItemForm is created as separate file
import { useState, useEffect } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Package as PackageIcon,
  Receipt,
  Target
} from 'lucide-react';

// ✅ INLINE SimplePurchaseItemForm Component
interface BahanBaku {
  id: string;
  nama: string;
  satuan: string;
}

interface FormData {
  bahanBakuId: string;
  nama: string;
  satuan: string;
  kuantitas: number;
  hargaSatuan: number;
  keterangan: string;
  jumlahKemasan?: number;
  isiPerKemasan?: number;
  satuanKemasan?: string;
  hargaTotalBeliKemasan?: number;
}

interface SimplePurchaseItemFormProps {
  bahanBaku: BahanBaku[];
  onCancel: () => void;
  onAdd: (formData: FormData) => void;
}

const SimplePurchaseItemForm: React.FC<SimplePurchaseItemFormProps> = ({
  bahanBaku,
  onCancel,
  onAdd,
}) => {
  const [mode, setMode] = useState<'quick' | 'accurate' | 'packaging'>('quick');
  const [formData, setFormData] = useState<FormData>({
    bahanBakuId: '',
    nama: '',
    satuan: '',
    kuantitas: 0,
    hargaSatuan: 0,
    keterangan: '',
    jumlahKemasan: 0,
    isiPerKemasan: 1,
    satuanKemasan: '',
    hargaTotalBeliKemasan: 0,
  });

  const calculateAccuratePrice = () => {
    const { jumlahKemasan, isiPerKemasan, hargaTotalBeliKemasan } = formData;
    const totalContent = (jumlahKemasan || 0) * (isiPerKemasan || 0);
    return totalContent > 0 ? Math.round(((hargaTotalBeliKemasan || 0) / totalContent) * 100) / 100 : 0;
  };

  const accuratePrice = calculateAccuratePrice();
  const accuracyLevel = mode === 'packaging' ? 100 : mode === 'accurate' ? 85 : 70;

  useEffect(() => {
    if (mode === 'packaging' && accuratePrice > 0) {
      setFormData(prev => ({ ...prev, hargaSatuan: accuratePrice }));
    }
  }, [mode, accuratePrice]);

  const handleBahanBakuSelect = (id: string) => {
    const selected = bahanBaku.find(b => b.id === id);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        bahanBakuId: id,
        nama: selected.nama,
        satuan: selected.satuan,
      }));
    }
  };

  const handleSubmit = () => {
    if (!formData.bahanBakuId) return toast.error('Pilih bahan baku');
    if (formData.kuantitas <= 0) return toast.error('Kuantitas harus > 0');
    if (formData.hargaSatuan <= 0) return toast.error('Harga satuan harus > 0');

    const cleanData = {
      ...formData,
      jumlahKemasan: (formData.jumlahKemasan || 0) > 0 ? formData.jumlahKemasan : undefined,
      isiPerKemasan: (formData.isiPerKemasan || 0) > 0 ? formData.isiPerKemasan : undefined,
      satuanKemasan: formData.satuanKemasan?.trim() || undefined,
      hargaTotalBeliKemasan: (formData.hargaTotalBeliKemasan || 0) > 0 ? formData.hargaTotalBeliKemasan : undefined,
    };

    onAdd(cleanData as FormData);
  };

  const QuickMode = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Bahan Baku *</Label>
          <Select value={formData.bahanBakuId} onValueChange={handleBahanBakuSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih bahan baku" />
            </SelectTrigger>
            <SelectContent>
              {bahanBaku.map((bahan) => (
                <SelectItem key={bahan.id} value={bahan.id}>
                  {bahan.nama} ({bahan.satuan})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Kuantitas *</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0.001"
              step="0.001"
              value={formData.kuantitas || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, kuantitas: Number(e.target.value) || 0 }))}
              placeholder="0"
            />
            <div className="flex items-center px-3 bg-gray-100 rounded text-sm min-w-[60px] justify-center">
              {formData.satuan || 'unit'}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Harga Satuan *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={formData.hargaSatuan || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, hargaSatuan: Number(e.target.value) || 0 }))}
              className="pl-8"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-yellow-800">Mode Perkiraan - Akurasi {accuracyLevel}%</div>
              <p className="text-yellow-700 text-sm mt-1">
                Untuk profit tracking yang presisi, gunakan data dari nota pembelian asli
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                Estimasi
              </Badge>
              <Button
                size="sm"
                onClick={() => setMode('accurate')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Target className="h-4 w-4 mr-1" />
                Mode Akurat
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );

  const AccurateModePrompt = () => (
    <div className="space-y-4">
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Mode Akurat: Profit Tracking Presisi</h3>
        <p className="text-gray-600 mb-6">Dapatkan HPP yang akurat untuk analisis margin profit yang real</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="font-medium text-green-800">Profit Margin Real-time</div>
            <div className="text-sm text-green-600">Hitung margin dengan presisi tinggi</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Calculator className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="font-medium text-blue-800">HPP Akurat</div>
            <div className="text-sm text-blue-600">Harga Pokok Penjualan yang tepat</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Receipt className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="font-medium text-purple-800">Laporan Presisi</div>
            <div className="text-sm text-purple-600">Data keuangan yang dapat diandalkan</div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => setMode('quick')}>
            <X className="h-4 w-4 mr-2" />
            Nanti Saja
          </Button>
          <Button onClick={() => setMode('packaging')} className="bg-green-600 hover:bg-green-700">
            <PackageIcon className="h-4 w-4 mr-2" />
            Lanjutkan
          </Button>
        </div>
      </div>
    </div>
  );

  const PackagingMode = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-green-600" />
          <h4 className="font-medium text-green-900">Input dari Nota Pembelian</h4>
          <Badge className="bg-green-100 text-green-700">Akurasi 100%</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setMode('quick')}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Bahan Baku *</Label>
          <Select value={formData.bahanBakuId} onValueChange={handleBahanBakuSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih bahan baku" />
            </SelectTrigger>
            <SelectContent>
              {bahanBaku.map((bahan) => (
                <SelectItem key={bahan.id} value={bahan.id}>
                  {bahan.nama} ({bahan.satuan})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Total yang Dibeli</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0.001"
              step="0.001"
              value={formData.kuantitas || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, kuantitas: Number(e.target.value) || 0 }))}
              placeholder="0"
            />
            <div className="flex items-center px-3 bg-gray-100 rounded text-sm min-w-[60px] justify-center">
              {formData.satuan || 'unit'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="font-medium text-blue-900 mb-3">📦 Detail Kemasan dari Nota:</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label>Beli Berapa Kemasan?</Label>
            <Input
              type="number"
              min="1"
              value={formData.jumlahKemasan || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, jumlahKemasan: Number(e.target.value) || 0 }))}
              placeholder="1"
            />
          </div>
          <div className="space-y-2">
            <Label>Jenis Kemasan</Label>
            <Select 
              value={formData.satuanKemasan || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, satuanKemasan: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pak">pak</SelectItem>
                <SelectItem value="dus">dus</SelectItem>
                <SelectItem value="karung">karung</SelectItem>
                <SelectItem value="botol">botol</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Isi Per Kemasan</Label>
            <div className="flex gap-1">
              <Input
                type="number"
                min="0.001"
                step="0.001"
                value={formData.isiPerKemasan || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, isiPerKemasan: Number(e.target.value) || 0 }))}
                placeholder="500"
                className="flex-1"
              />
              <div className="flex items-center px-2 bg-gray-100 rounded text-xs">
                {formData.satuan || 'unit'}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Total Bayar</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={formData.hargaTotalBeliKemasan || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, hargaTotalBeliKemasan: Number(e.target.value) || 0 }))}
                className="pl-8"
                placeholder="25000"
              />
            </div>
          </div>
        </div>
      </div>

      {accuratePrice > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium text-green-800">✨ HPP Akurat Berhasil Dihitung!</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-green-700">Total Isi:</div>
                  <div className="font-medium">
                    {formData.jumlahKemasan} × {formData.isiPerKemasan} = {(formData.jumlahKemasan || 0) * (formData.isiPerKemasan || 0)} {formData.satuan}
                  </div>
                </div>
                <div>
                  <div className="text-green-700">HPP Per {formData.satuan}:</div>
                  <div className="font-bold text-lg text-green-800">
                    {formatCurrency(accuratePrice)}
                  </div>
                </div>
                <div>
                  <div className="text-green-700">Subtotal:</div>
                  <div className="font-medium">
                    {formatCurrency(formData.kuantitas * accuratePrice)}
                  </div>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <Card className="border-dashed border-blue-300 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Plus className="h-5 w-5" />
            Tambah Item Baru
            <Badge variant="outline" className={
              accuracyLevel >= 100 ? "bg-green-100 text-green-700" :
              accuracyLevel >= 85 ? "bg-blue-100 text-blue-700" :
              "bg-yellow-100 text-yellow-700"
            }>
              Akurasi {accuracyLevel}%
            </Badge>
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === 'quick' && <QuickMode />}
        {mode === 'accurate' && <AccurateModePrompt />}
        {mode === 'packaging' && <PackagingMode />}
        
        {mode !== 'accurate' && (
          <div className="space-y-2">
            <Label>Keterangan</Label>
            <Textarea
              value={formData.keterangan}
              onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
              placeholder="Keterangan tambahan (opsional)"
              rows={2}
            />
          </div>
        )}

        {mode !== 'accurate' && formData.kuantitas > 0 && formData.hargaSatuan > 0 && (
          <div className="bg-blue-100 p-3 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Subtotal: </strong>
              {formatCurrency(formData.kuantitas * formData.hargaSatuan)}
            </div>
          </div>
        )}

        {mode !== 'accurate' && (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!formData.bahanBakuId || formData.kuantitas <= 0 || formData.hargaSatuan <= 0}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah ke Daftar
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const PurchaseDialog: React.FC<PurchaseDialogProps> = ({
  isOpen,
  mode,
  purchase,
  suppliers,
  bahanBaku,
  onClose,
}) => {
  // Form management
  const {
    formData,
    setFormData,
    isSubmitting,
    isDirty,
    validation,
    addItem,
    updateItem,
    removeItem,
    handleSubmit,
    handleReset,
    totalValue,
  } = usePurchaseForm({
    mode,
    initialData: purchase,
    onSuccess: () => {
      toast.success(
        mode === 'create' 
          ? 'Pembelian berhasil dibuat!' 
          : 'Pembelian berhasil diperbarui!'
      );
      onClose();
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Item management
  const {
    showAddItem,
    setShowAddItem,
    editingItemIndex,
    handleEditItem,
    handleSaveEditedItem,
    handleCancelEditItem,
  } = usePurchaseItemManager({
    bahanBaku,
    items: formData.items,
    addItem,
    updateItem,
  });

  // ✅ Reset form states when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setShowAddItem(false);
      handleCancelEditItem();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ✅ Handle form submission
  const onSubmit = async () => {
    if (formData.items.length === 0) {
      toast.error('Minimal harus ada 1 item dalam pembelian');
      return;
    }

    await handleSubmit();
  };

  // ✅ Handle cancel with unsaved changes warning
  const handleCancel = () => {
    if (isDirty) {
      if (confirm('Ada perubahan yang belum disimpan. Yakin ingin keluar?')) {
        handleReset();
        onClose();
      }
    } else {
      onClose();
    }
  };

  // ✅ Reset form to initial state
  const handleResetForm = () => {
    if (confirm('Reset semua perubahan ke kondisi awal?')) {
      handleReset();
      setShowAddItem(false);
      if (handleCancelEditItem) handleCancelEditItem();
      toast.info('Form direset ke kondisi awal');
    }
  };

  // ✅ Check if purchase can be edited (not completed)
  const canEdit = !purchase || purchase.status !== 'completed';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'create' ? (
              <>
                <ShoppingCart className="h-5 w-5" />
                Tambah Pembelian Baru
              </>
            ) : (
              <>
                <Edit3 className="h-5 w-5" />
                Edit Pembelian
                {purchase && (
                  <Badge 
                    variant="outline" 
                    className={`ml-2 ${
                      purchase.status === 'completed' ? 'bg-green-100 text-green-800' :
                      purchase.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}
                  >
                    {purchase.status}
                  </Badge>
                )}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Buat pembelian bahan baku baru dari supplier' 
              : canEdit 
                ? 'Perbarui informasi pembelian yang sudah ada'
                : 'Pembelian yang sudah selesai tidak dapat diedit'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* ✅ Edit Warning for Completed Purchase */}
          {mode === 'edit' && !canEdit && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="font-medium text-red-800">Pembelian Sudah Selesai</div>
                <p className="text-red-700 text-sm mt-1">
                  Pembelian dengan status "Selesai" tidak dapat diedit untuk menjaga integritas data.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Errors */}
          {validation.errors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="font-medium text-red-800 mb-2">Perbaiki kesalahan berikut:</div>
                <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                  {validation.errors.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {validation.errors.length > 5 && (
                    <li>... dan {validation.errors.length - 5} kesalahan lainnya</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Validation Warnings */}
          {validation.warnings.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                <div className="font-medium text-yellow-800 mb-2">Perhatian:</div>
                <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
                  {validation.warnings.slice(0, 3).map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Informasi Dasar</CardTitle>
                {mode === 'edit' && isDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetForm}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset Form
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Supplier Selection */}
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Select
                    value={formData.supplier}
                    onValueChange={(value) => 
                      setFormData({ ...formData, supplier: value })
                    }
                    disabled={!canEdit}
                  >
                    <SelectTrigger className={!canEdit ? 'opacity-50' : ''}>
                      <SelectValue placeholder="Pilih supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Selection */}
                <div className="space-y-2">
                  <Label>Tanggal Pembelian *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${!canEdit ? 'opacity-50' : ''}`}
                        disabled={!canEdit}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.tanggal ? (
                          format(formData.tanggal, 'PPP', { locale: id })
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.tanggal}
                        onSelect={(date) => 
                          date && setFormData({ ...formData, tanggal: date })
                        }
                        initialFocus
                        disabled={!canEdit}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Calculation Method */}
              <div className="space-y-2">
                <Label htmlFor="metodePerhitungan">Metode Perhitungan Stok</Label>
                <Select
                  value={formData.metodePerhitungan}
                  onValueChange={(value: 'FIFO' | 'LIFO' | 'AVERAGE') =>
                    setFormData({ ...formData, metodePerhitungan: value })
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger className={!canEdit ? 'opacity-50' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIFO">FIFO (First In, First Out)</SelectItem>
                    <SelectItem value="LIFO">LIFO (Last In, First Out)</SelectItem>
                    <SelectItem value="AVERAGE">Average (Rata-rata)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Items Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Item Pembelian ({formData.items.length})
                  {mode === 'edit' && isDirty && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Modified
                    </Badge>
                  )}
                </CardTitle>
                {canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddItem(!showAddItem)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Item
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ✅ NEW: Smart Add New Item Form */}
              {canEdit && showAddItem && (
                <SimplePurchaseItemForm
                  bahanBaku={bahanBaku}
                  onCancel={() => setShowAddItem(false)}
                  onAdd={(cleanData) => {
                    // Ensure subtotal is calculated for UI consistency
                    const subtotal = Number(cleanData.kuantitas) * Number(cleanData.hargaSatuan);
                    handleAddItem({ ...cleanData, subtotal });
                    setShowAddItem(false);
                    toast.success(`${cleanData.nama} berhasil ditambahkan`);
                  }}
                />
              )}="              {/* Items List */}
              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada item ditambahkan</p>
                  <p className="text-sm">
                    {canEdit 
                      ? 'Klik "Tambah Item" untuk mulai menambahkan bahan baku'
                      : 'Tidak ada item dalam pembelian ini'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="pt-4">
                        {editingItemIndex === index && canEdit ? (
                          // ✅ EDIT MODE for existing item
                          <EditItemForm
                            item={item}
                            onSave={(updatedItem) => handleSaveEditedItem(index, updatedItem)}
                            onCancel={handleCancelEditItem}
                          />
                        ) : (
                          // ✅ DISPLAY MODE for existing item
                          <div className="flex items-start justify-between">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div>
                                <div className="font-medium">{item.nama}</div>
                                <div className="text-sm text-gray-600">ID: {item.bahanBakuId}</div>
                                {/* ✅ IMPROVED: Tampilkan ringkas info kemasan dengan fallback satuan */}
                                {(item as any).jumlahKemasan > 0 && (item as any).isiPerKemasan > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Kemasan: {(item as any).jumlahKemasan} × {(item as any).isiPerKemasan} {item.satuan || 'unit'}
                                    {(item as any).satuanKemasan ? ` (${(item as any).satuanKemasan})` : ''}
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{item.kuantitas} {item.satuan}</div>
                                <div className="text-sm text-gray-600">Kuantitas</div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{formatCurrency(item.hargaSatuan)}</div>
                                <div className="text-sm text-gray-600">Harga Satuan</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-600">{formatCurrency(item.subtotal)}</div>
                                <div className="text-sm text-gray-600">Subtotal</div>
                              </div>
                            </div>
                            
                            {canEdit && (
                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditItem(index)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {item.keterangan && editingItemIndex !== index && (
                          <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            <strong>Keterangan:</strong> {item.keterangan}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total Summary */}
          {formData.items.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Total Pembelian</span>
                    {mode === 'edit' && isDirty && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                        Updated
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalValue)}
                  </div>
                </div>
                <div className="mt-2 text-sm text-green-700">
                  {formData.items.length} item • Total kuantitas: {' '}
                  {formData.items.reduce((sum, item) => sum + item.kuantitas, 0)} unit
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          
          {canEdit && (
            <Button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting || !validation.isValid || formData.items.length === 0}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {mode === 'create' ? 'Membuat...' : 'Menyimpan...'}
                </>
              ) : (
                <>
                  {mode === 'create' ? (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Buat Pembelian
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ✅ NEW: Edit Item Form Component
const EditItemForm: React.FC<{
  item: PurchaseItem;
  onSave: (item: Partial<PurchaseItem>) => void;
  onCancel: () => void;
}> = ({ item, onSave, onCancel }) => {
  const [editedItem, setEditedItem] = useState({
    kuantitas: item.kuantitas,
    hargaSatuan: item.hargaSatuan,
    keterangan: item.keterangan || '',
  });

  const handleSave = () => {
    onSave(editedItem);
  };

  const subtotal = editedItem.kuantitas * editedItem.hargaSatuan;

  return (
    <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-blue-900">Edit Item: {item.nama}</h4>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!editedItem.kuantitas || !editedItem.hargaSatuan}
          >
            <Save className="h-4 w-4 mr-2" />
            Simpan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quantity */}
        <div className="space-y-2">
          <Label>Kuantitas *</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              min="0.001"
              step="0.001"
              value={editedItem.kuantitas}
              onChange={(e) =>
                setEditedItem(prev => ({
                  ...prev,
                  kuantitas: parseFloat(e.target.value) || 0
                }))
              }
              placeholder="0"
            />
            <div className="flex items-center px-3 bg-gray-100 rounded text-sm text-gray-600 min-w-[60px]">
              {item.satuan}
            </div>
          </div>
        </div>

        {/* Unit Price */}
        <div className="space-y-2">
          <Label>Harga Satuan *</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={editedItem.hargaSatuan}
            onChange={(e) =>
              setEditedItem(prev => ({
                ...prev,
                hargaSatuan: parseFloat(e.target.value) || 0
              }))
            }
            placeholder="0"
          />
        </div>

        {/* Subtotal Preview */}
        <div className="space-y-2">
          <Label>Subtotal</Label>
          <div className="flex items-center h-10 px-3 bg-green-100 border border-green-300 rounded text-green-800 font-medium">
            {formatCurrency(subtotal)}
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Keterangan</Label>
        <Textarea
          value={editedItem.keterangan}
          onChange={(e) =>
            setEditedItem(prev => ({ ...prev, keterangan: e.target.value }))
          }
          placeholder="Keterangan tambahan (opsional)"
          rows={2}
        />
      </div>

      {/* Changes Summary */}
      <div className="bg-blue-100 p-3 rounded-lg">
        <div className="text-sm text-blue-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Sebelum:</strong>
              <div>Qty: {item.kuantitas} {item.satuan}</div>
              <div>Harga: {formatCurrency(item.hargaSatuan)}</div>
              <div>Subtotal: {formatCurrency(item.subtotal)}</div>
            </div>
            <div>
              <strong>Sesudah:</strong>
              <div>Qty: {editedItem.kuantitas} {item.satuan}</div>
              <div>Harga: {formatCurrency(editedItem.hargaSatuan)}</div>
              <div>Subtotal: {formatCurrency(subtotal)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseDialog;