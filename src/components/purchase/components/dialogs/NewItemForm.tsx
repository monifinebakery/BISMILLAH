// src/components/purchase/components/dialogs/NewItemForm.tsx
// Form for adding new items to purchase

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Package, Calculator, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatUtils';
import { generateUUID } from '@/utils/uuid';
import { SafeNumericInput } from './SafeNumericInput';
import type { BahanBakuFrontend } from '@/components/warehouse/types';
import type { PurchaseItem } from '../../types/purchase.types';

interface FormData {
  nama: string;
  satuan: string;
  kuantitas: string;
  totalBayar: string;
  keterangan: string;
}

interface NewItemFormProps {
  warehouseItems: BahanBakuFrontend[];
  isSelectingExistingItem: boolean;
  selectedWarehouseItem: string;
  onAddItem: (item: PurchaseItem) => void;
  onUpdateItem: (index: number, item: PurchaseItem) => void;
  onToggleSelectionMode: () => void;
  onSelectWarehouseItem: (id: string) => void;
  existingItems: PurchaseItem[];

}

// Helper function to convert string to number
const toNumber = (v: string | number | '' | undefined | null): number => {
  if (v === '' || v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  
  let s = v.toString().trim().replace(/\s+/g, '');
  s = s.replace(/[^\d,.-]/g, '');
  
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else {
    s = s.replace(/,/g, '.');
  }
  
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

export const NewItemForm: React.FC<NewItemFormProps> = ({
  warehouseItems,
  isSelectingExistingItem,
  selectedWarehouseItem,
  onAddItem,
  onUpdateItem,
  onToggleSelectionMode,
  onSelectWarehouseItem,
  existingItems

}) => {
  const [formData, setFormData] = useState<FormData>({
    nama: '',
    satuan: '',
    kuantitas: '',
    totalBayar: '',
    keterangan: '',
  });

  const qtyRef = useRef<HTMLInputElement>(null);
  const payRef = useRef<HTMLInputElement>(null);

  // Handle numeric input changes
  const handleNumericChange = useCallback((field: keyof FormData, value: string) => {
    const cleanValue = value.replace(/[^\d.,]/g, '');
    setFormData(prev => ({ ...prev, [field]: cleanValue }));
  }, []);

  // Computed values
  const computedUnitPrice = useMemo(() => {
    const qty = toNumber(formData.kuantitas);
    const pay = toNumber(formData.totalBayar);
    if (qty > 0 && pay > 0) {
      return Math.round((pay / qty) * 100) / 100;
    }
    return 0;
  }, [formData.kuantitas, formData.totalBayar]);

  const effectiveQty = useMemo(() => toNumber(formData.kuantitas), [formData.kuantitas]);
  const effectivePay = useMemo(() => toNumber(formData.totalBayar), [formData.totalBayar]);

  const canSubmit = isSelectingExistingItem
    ? selectedWarehouseItem !== '' && effectiveQty > 0 && computedUnitPrice > 0
    : formData.nama.trim() !== '' && formData.satuan.trim() !== '' && effectiveQty > 0 && computedUnitPrice > 0;

  const existingIndex = useMemo(
    () => existingItems.findIndex((it) => it.bahanBakuId === selectedWarehouseItem),
    [existingItems, selectedWarehouseItem]
  );

  // Handle form submission
  const handleSubmit = useCallback(() => {
    if (isSelectingExistingItem) {
      if (!selectedWarehouseItem) {
        toast.error('Pilih bahan baku dari daftar');
        return;
      }

      const warehouseItem = warehouseItems.find(item => item.id === selectedWarehouseItem);
      if (!warehouseItem) {
        toast.error('Bahan baku tidak ditemukan');
        return;
      }

      const purchaseItem: PurchaseItem = {
        bahanBakuId: warehouseItem.id,
        nama: warehouseItem.nama,
        satuan: warehouseItem.satuan,
        kuantitas: effectiveQty,
        hargaSatuan: computedUnitPrice,
        subtotal: effectiveQty * computedUnitPrice,
        keterangan: formData.keterangan,
      };

      onAddItem(purchaseItem);
      onSelectWarehouseItem('');
    } else {
      if (!formData.nama.trim()) {
        toast.error('Nama bahan baku harus diisi');
        return;
      }

      const purchaseItem: PurchaseItem = {
        bahanBakuId: generateUUID(),
        nama: formData.nama,
        satuan: formData.satuan,
        kuantitas: effectiveQty,
        hargaSatuan: computedUnitPrice,
        subtotal: effectiveQty * computedUnitPrice,
        keterangan: formData.keterangan,
      };

      onAddItem(purchaseItem);
    }

    // Reset form
    setFormData({
      nama: '',
      satuan: '',
      kuantitas: '',
      totalBayar: '',
      keterangan: '',
    });
  }, [
    isSelectingExistingItem,
    selectedWarehouseItem,
    warehouseItems,
    formData,
    effectiveQty,
    computedUnitPrice,
    onAddItem,
    onSelectWarehouseItem
  ]);

  const handleUpdate = useCallback(() => {
    if (existingIndex < 0) return;
    const warehouseItem = warehouseItems.find(item => item.id === selectedWarehouseItem);
    if (!warehouseItem) {
      toast.error('Bahan baku tidak ditemukan');
      return;
    }

    const purchaseItem: PurchaseItem = {
      bahanBakuId: warehouseItem.id,
      nama: warehouseItem.nama,
      satuan: warehouseItem.satuan,
      kuantitas: effectiveQty,
      hargaSatuan: computedUnitPrice,
      subtotal: effectiveQty * computedUnitPrice,
      keterangan: formData.keterangan,
    };

    onUpdateItem(existingIndex, purchaseItem);
    onSelectWarehouseItem('');
    setFormData({
      nama: '',
      satuan: '',
      kuantitas: '',
      totalBayar: '',
      keterangan: '',
    });
  }, [existingIndex, warehouseItems, selectedWarehouseItem, effectiveQty, computedUnitPrice, formData.keterangan, onUpdateItem, onSelectWarehouseItem]);

  // Reset form
  const handleReset = useCallback(() => {
    setFormData({
      nama: '',
      satuan: '',
      kuantitas: '',
      totalBayar: '',
      keterangan: '',
    });
  }, []);

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="h-5 w-5 text-orange-600" />
          Tambah Item Pembelian
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Toggle between new item and existing item */}
        <div className="flex gap-2">
          <Button
            variant={!isSelectingExistingItem ? "default" : "outline"}
            onClick={onToggleSelectionMode}
            className="flex-1"
          >
            Tambah Item Baru
          </Button>
          <Button
            variant={isSelectingExistingItem ? "default" : "outline"}
            onClick={onToggleSelectionMode}
            className="flex-1"
          >
            Pilih Item Gudang
          </Button>
        </div>

        {isSelectingExistingItem ? (
          // Select existing warehouse item
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Pilih Bahan Baku *</Label>
              <Select
                value={selectedWarehouseItem}
                onValueChange={onSelectWarehouseItem}
              >
                <SelectTrigger className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
                  <SelectValue placeholder="Pilih bahan baku dari gudang" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseItems.map((item) => (
                    <SelectItem key={item.id} value={item.id} className="focus:bg-orange-50">
                      {item.nama} ({item.stok} {item.satuan})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          // Add new item form
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Nama Bahan Baku *</Label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                placeholder="Contoh: Tepung Terigu"
                className="h-11 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Satuan *</Label>
              <Select
                value={formData.satuan}
                onValueChange={(value) => setFormData(prev => ({ ...prev, satuan: value }))}
              >
                <SelectTrigger className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
                  <SelectValue placeholder="Pilih satuan" />
                </SelectTrigger>
                <SelectContent>
                  {['gram', 'kilogram', 'miligram', 'liter', 'milliliter', 'pcs', 'buah', 'biji', 'butir', 'lembar'].map((u) => (
                    <SelectItem key={u} value={u} className="focus:bg-orange-50">
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Input utama: Total yang dibeli + Total bayar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Total yang Dibeli *</Label>
            <div className="flex gap-2">
              <SafeNumericInput
                ref={qtyRef}
                value={formData.kuantitas}
                onChange={(e) => handleNumericChange('kuantitas', e.target.value)}
                placeholder="0"
                className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
              />
              <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 min-w-[70px] justify-center">
                {formData.satuan || 'unit'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Total Bayar *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
              <SafeNumericInput
                ref={payRef}
                value={formData.totalBayar}
                onChange={(e) => handleNumericChange('totalBayar', e.target.value)}
                className="h-11 pl-8 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Ringkasan hijau */}
        {(effectiveQty > 0 || computedUnitPrice > 0) && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Harga Per Satuan</p>
                  <p className="text-lg font-bold text-green-900">
                    {formatCurrency(computedUnitPrice)}
                  </p>
                </div>
              </div>
              
              {effectiveQty > 0 && (
                <div className="text-right">
                  <p className="text-sm text-green-700">Subtotal</p>
                  <p className="text-lg font-bold text-green-900">
                    {formatCurrency(effectiveQty * computedUnitPrice)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Keterangan */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Keterangan</Label>
          <Textarea
            value={formData.keterangan}
            onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
            placeholder="Keterangan tambahan (opsional)"
            rows={2}
            className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
          />
        </div>

        {/* Submit */}
        <div className="space-y-2">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white border-0 disabled:bg-gray-300 disabled:text-gray-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah ke Daftar
          </Button>
          {isSelectingExistingItem && existingIndex >= 0 && (
            <Button
              type="button"
              onClick={handleUpdate}
              disabled={!canSubmit}
              variant="outline"
              className="w-full h-11 border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Update Bahan Baku
            </Button>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">HPP dihitung otomatis saat disimpan.</p>
      </CardContent>
    </Card>
  );
};