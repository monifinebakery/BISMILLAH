// src/components/purchase/components/SimplePurchaseItemForm.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus,
  X,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';



// ---- Internal state (semua string biar aman untuk input) ----
interface FormData {
  nama: string;
  satuan: string;

  // input utama
  kuantitas: string;            // Total yang dibeli (unit dasar bahan baku)
  totalBayar: string;           // Total bayar (untuk hitung harga satuan otomatis)

  keterangan: string;
}

// ---- Payload keluar (angka bersih) ----
export interface PurchaseItemPayload {
  nama: string;
  satuan: string;
  kuantitas: number;
  hargaSatuan: number;
  keterangan: string;
}

interface SimplePurchaseItemFormProps {
  onCancel: () => void;
  onAdd: (formData: PurchaseItemPayload) => void;
}

const toNumber = (v: string | number | '' | undefined) => {
  if (v === '' || v == null) return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  let s = v.toString().trim().replace(/\s+/g, '');
  s = s.replace(/[^0-9.,\-]/g, '');
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else {
    s = s.replace(/,/g, '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

// ---- Guards: cegah input aneh sebelum ke state ----
const makeBeforeInputGuard = (getValue: () => string, allowDecimal = true) =>
  (e: React.FormEvent<HTMLInputElement> & { nativeEvent: InputEvent }) => {
    const ch = (e.nativeEvent as any).data ?? '';
    if (!ch) return;
    const el = e.currentTarget as HTMLInputElement;
    const cur = getValue() ?? '';
    const next =
      cur.slice(0, el.selectionStart ?? cur.length) + ch + cur.slice(el.selectionEnd ?? cur.length);
    if (!allowDecimal) {
      if (!/^\d*$/.test(next)) e.preventDefault();
      return;
    }
    if (!/^\d*(?:[.,]\d{0,6})?$/.test(next)) e.preventDefault();
  };

const handlePasteGuard = (allowDecimal = true) => (e: React.ClipboardEvent<HTMLInputElement>) => {
  const text = e.clipboardData.getData('text').trim();
  const ok = allowDecimal ? /^\d*(?:[.,]\d{0,6})?$/.test(text) : /^\d*$/.test(text);
  if (!ok) e.preventDefault();
};

const SafeNumericInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { value: string | number }
>(({ className = '', value, onChange, ...props }, ref) => {
  const baseClasses =
    'flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50';
  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      value={String(value ?? '')}
      onChange={onChange}
      className={`${baseClasses} ${className}`}
      autoComplete="off"
      autoCorrect="off"
      spellCheck="false"
      {...props}
    />
  );
});

const BASE_UNITS = ['gram', 'kilogram', 'miligram', 'liter', 'milliliter', 'pcs', 'buah', 'biji', 'butir', 'lembar'];

const SimplePurchaseItemForm: React.FC<SimplePurchaseItemFormProps> = ({ onCancel, onAdd }) => {
  const [formData, setFormData] = useState<FormData>({
    nama: '',
    satuan: '',
    kuantitas: '',
    totalBayar: '',
    keterangan: '',
  });

  // Harga per unit – calculated from kuantitas and totalBayar
  const computedUnitPrice = useMemo(() => {
    const qty = toNumber(formData.kuantitas);
    const pay = toNumber(formData.totalBayar);
    if (qty > 0 && pay > 0) {
      return Math.round((pay / qty) * 100) / 100;
    }
    return 0;
  }, [formData.kuantitas, formData.totalBayar]);

  // Total qty yang dipakai untuk ringkasan
  const effectiveQty = useMemo(() => {
    return toNumber(formData.kuantitas);
  }, [formData.kuantitas]);

  // Total bayar yang dipakai untuk ringkasan
  const effectivePay = useMemo(() => {
    return toNumber(formData.totalBayar);
  }, [formData.totalBayar]);

  const subtotal = useMemo(() => effectiveQty * computedUnitPrice, [effectiveQty, computedUnitPrice]);

  

  const handleNumericChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => (prev[field] === value ? prev : { ...prev, [field]: value }));
  }, []);

  // Debug mount/unmount
  useEffect(() => {
    logger.debug('MOUNT <SimplePurchaseItemForm>');
    return () => logger.debug('UNMOUNT <SimplePurchaseItemForm>');
  }, []);

  // Submit
  const handleSubmit = () => {
    if (!formData.nama.trim()) return toast.error('Nama bahan baku harus diisi');
    if (!formData.satuan) return toast.error('Satuan harus dipilih');
    if (effectiveQty <= 0) return toast.error('Total yang dibeli harus > 0');
    if (computedUnitPrice <= 0) return toast.error('Tidak bisa menghitung harga per unit');

    onAdd({
      nama: formData.nama,
      satuan: formData.satuan,
      kuantitas: effectiveQty,
      hargaSatuan: computedUnitPrice,
      keterangan: formData.keterangan,
    });
  };

  const canSubmit =
    formData.nama.trim() !== '' &&
    formData.satuan.trim() !== '' &&
    effectiveQty > 0 &&
    computedUnitPrice > 0;

  // refs
  const qtyRef = useRef<HTMLInputElement>(null);
  const payRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="border-dashed border-orange-200 bg-orange-50/30 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Plus className="h-4 w-4 text-orange-600" />
            </div>
            <span className="text-lg">Tambah Item Baru</span>
            <Badge
              variant="outline"
              className={
                effectiveQty > 0 && computedUnitPrice > 0
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-blue-100 text-blue-700 border-blue-200'
              }
            >
              {effectiveQty > 0 && computedUnitPrice > 0 ? 'Akurat 100%' : 'Otomatis dihitung'}
            </Badge>
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="self-start sm:self-center hover:bg-white/60"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Informasi Bahan Baku */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Nama Bahan Baku *</Label>
            <input
              type="text"
              value={formData.nama}
              onChange={(e) => setFormData((prev) => ({ ...prev, nama: e.target.value }))}
              placeholder="Contoh: Tepung Terigu"
              className="h-11 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500/20"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Satuan *</Label>
            <Select
              value={formData.satuan}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, satuan: value }))}
            >
              <SelectTrigger className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
                <SelectValue placeholder="Pilih satuan" />
              </SelectTrigger>
              <SelectContent>
                {BASE_UNITS.map((u) => (
                  <SelectItem key={u} value={u} className="focus:bg-orange-50">
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                onBeforeInput={makeBeforeInputGuard(() => formData.kuantitas, true)}
                onPaste={handlePasteGuard(true)}
                onChange={(e) => {
                  handleNumericChange('kuantitas', e.target.value);
                  requestAnimationFrame(() => {
                    if (qtyRef.current) {
                      qtyRef.current.focus();
                    }
                  });
                }}
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
                onBeforeInput={makeBeforeInputGuard(() => formData.totalBayar, true)}
                onPaste={handlePasteGuard(true)}
                onChange={(e) => {
                  handleNumericChange('totalBayar', e.target.value);
                  requestAnimationFrame(() => {
                    if (payRef.current) {
                      payRef.current.focus();
                    }
                  });
                }}
                className="h-11 pl-8 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Ringkasan hijau */}
        {(effectiveQty > 0 || computedUnitPrice > 0) && (
          <Alert className="border-emerald-200 bg-emerald-50/60">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-emerald-700 font-medium">Harga per {formData.satuan || 'unit'}</div>
                  <div className="text-lg font-bold text-orange-600">
                    {formatCurrency(computedUnitPrice || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-emerald-700 font-medium">Total Qty</div>
                  <div className="text-gray-800">{effectiveQty} {formData.satuan || 'unit'}</div>
                </div>
                <div className="text-right sm:text-left">
                  <div className="text-emerald-700 font-medium">Subtotal</div>
                  <div className="font-semibold text-gray-900">{formatCurrency(subtotal || 0)}</div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        

        {/* Keterangan */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Keterangan</Label>
          <Textarea
            value={formData.keterangan}
            onChange={(e) => setFormData((prev) => ({ ...prev, keterangan: e.target.value }))}
            placeholder="Keterangan tambahan (opsional)"
            rows={2}
            className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
          />
        </div>

        {/* Submit */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white border-0 disabled:bg-gray-300 disabled:text-gray-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah ke Daftar
        </Button>
        <p className="mt-2 text-xs text-gray-500">HPP dihitung otomatis saat disimpan.</p>
      </CardContent>
    </Card>
  );
};

export default React.memo(SimplePurchaseItemForm);