// src/components/purchase/components/dialogs/NewItemForm.tsx
// Form for adding new items to purchase

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calculator, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatUtils';
import { generateUUID } from '@/utils/uuid';
import { SafeNumericInput } from './SafeNumericInput';
// Avoid importing warehouseUtils to reduce bundle graph and prevent potential cycles
import type { BahanBakuFrontend } from '@/components/warehouse/types';
import type { PurchaseItem } from '../../types/purchase.types';
import MaterialComboBox from '../MaterialComboBox';

interface FormData {
  nama: string;
  satuan: string;
  kuantitas: string;
  totalBayar: string;
  keterangan: string;
}

interface NewItemFormProps {
  onAddItem: (item: PurchaseItem) => void;
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
  onAddItem
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
  
  // Computed values - calculate unit price from total payment
  const computedUnitPrice = useMemo(() => {
    const qty = toNumber(formData.kuantitas);
    const pay = toNumber(formData.totalBayar);
    if (qty > 0 && pay > 0) {
      return Math.round((pay / qty) * 100) / 100;
    }
    return 0;
  }, [formData.kuantitas, formData.totalBayar]);

  // Check if using automatic calculation
  const isUsingAutomaticCalculation = useMemo(() => {
    return toNumber(formData.kuantitas) > 0 && 
           toNumber(formData.totalBayar) > 0;
  }, [formData.kuantitas, formData.totalBayar]);

  const effectiveQty = useMemo(() => toNumber(formData.kuantitas), [formData.kuantitas]);

  // Show notification when automatic calculation is active
  React.useEffect(() => {
    if (isUsingAutomaticCalculation && computedUnitPrice > 0) {
      const qty = toNumber(formData.kuantitas);
      const total = toNumber(formData.totalBayar);
      toast.success(
        `📊 Harga satuan otomatis: ${formatCurrency(computedUnitPrice)}`,
        {
          description: `Dihitung dari Rp ${total.toLocaleString('id-ID')} ÷ ${qty} = ${formatCurrency(computedUnitPrice)}`
        }
      );
    }
  }, [isUsingAutomaticCalculation, computedUnitPrice, formData.kuantitas, formData.totalBayar]);

  const canSubmit = formData.nama.trim() !== '' && formData.satuan.trim() !== '' && effectiveQty > 0 && computedUnitPrice > 0;

  // Handle form submission
  const handleSubmit = useCallback(() => {
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

    // Reset form
    setFormData({
      nama: '',
      satuan: '',
      kuantitas: '',
      totalBayar: '',
      keterangan: '',
    });
  }, [formData, effectiveQty, computedUnitPrice, onAddItem]);

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="h-5 w-5 text-orange-600" />
          Tambah Item Pembelian
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new item form */}
        <div className="space-y-4">
          {/* Helpful instruction for automatic calculation */}
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Calculator className="h-4 w-4 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  💡 Fitur Cerdas
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  • Pilih dari <strong>riwayat bahan baku</strong> yang pernah dibeli sebelumnya<br/>
                  • <strong>Satuan otomatis</strong> akan dipilih berdasarkan riwayat<br/>
                  • <strong>Harga satuan</strong> dihitung otomatis: Total Bayar ÷ Kuantitas
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Nama Bahan Baku *</Label>
              <MaterialComboBox
                value={formData.nama}
                onValueChange={(materialName, suggestedSatuan) => {
                  setFormData(prev => ({ ...prev, nama: materialName }));
                  // Auto-fill satuan if suggested and current satuan is empty
                  if (suggestedSatuan && !prev.satuan) {
                    setFormData(prevState => ({ ...prevState, satuan: suggestedSatuan }));
                  }
                }}
                onSatuanSuggestion={(satuan) => {
                  // Only auto-fill if current satuan is empty to avoid overriding user choice
                  if (!formData.satuan) {
                    setFormData(prev => ({ ...prev, satuan: satuan }));
                  }
                }}
                placeholder="Pilih dari riwayat atau ketik nama bahan baru"
                className="w-full"
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
        </div>

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
            {isUsingAutomaticCalculation && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-800">
                      Harga Satuan Otomatis: {formatCurrency(computedUnitPrice)}
                    </p>
                    <p className="text-xs text-blue-600">
                      Dihitung dari: Rp {toNumber(formData.totalBayar).toLocaleString('id-ID')} ÷ {toNumber(formData.kuantitas)} {formData.satuan || 'unit'}
                    </p>
                  </div>
                </div>
              </div>
            )}
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
        </div>
        <p className="mt-2 text-xs text-gray-500">HPP dihitung otomatis saat disimpan.</p>
      </CardContent>
    </Card>
  );
};
