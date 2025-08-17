// src/components/purchase/components/SimplePurchaseItemForm.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  X,
  AlertTriangle,
  CheckCircle2,
  Package as PackageIcon,
  Receipt
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface BahanBaku {
  id: string;
  nama: string;
  satuan: string;
}

// ✅ Internal form state - all strings for input handling
interface FormData {
  bahanBakuId: string;
  nama: string;
  satuan: string;
  kuantitas: string;
  hargaSatuan: string;
  keterangan: string;
  jumlahKemasan?: string;
  isiPerKemasan?: string;
  satuanKemasan?: string;
  hargaTotalBeliKemasan?: string;
}

// ✅ CLEANER: Output payload with proper numeric types
export interface PurchaseItemPayload {
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
  onAdd: (formData: PurchaseItemPayload) => void; // ✅ Clean numeric payload
  initialMode?: 'quick' | 'packaging';
}

const toNumber = (v: string | number | '' | undefined) => {
  if (v === '' || v == null) return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;

  // buang spasi & karakter non angka/koma/titik
  let s = v.toString().trim().replace(/\s+/g, '');
  s = s.replace(/[^\d,.\-]/g, '');

  // kalau ada KOMA dan TITIK sekaligus: anggap TITIK = pemisah ribuan → hapus semua titik, koma jadi desimal
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(/,/g, '.');
  } else {
    // kalau cuma koma → pakai koma sebagai desimal
    s = s.replace(/,/g, '.');
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};

// ---- Guards: block invalid numeric input before it reaches state ----
const makeBeforeInputGuard = (getValue: () => string, allowDecimal = true) =>
  (e: React.FormEvent<HTMLInputElement> & { nativeEvent: InputEvent }) => {
    const ch = (e.nativeEvent as any).data ?? '';
    if (!ch) return; // control keys, deletes, dll.

    const el = e.currentTarget as HTMLInputElement;
    const cur = getValue() ?? '';
    const next =
      cur.slice(0, el.selectionStart ?? cur.length) + ch + cur.slice(el.selectionEnd ?? cur.length);

    if (!allowDecimal) {
      if (!/^\d*$/.test(next)) e.preventDefault();
      return;
    }

    // Decimal: digits + optional one [.,] + up to 6 fraction digits
    if (!/^\d*(?:[.,]\d{0,6})?$/.test(next)) e.preventDefault();
  };

const handlePasteGuard = (allowDecimal = true) =>
  (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim();
    const ok = allowDecimal ? /^\d*(?:[.,]\d{0,6})?$/.test(text) : /^\d*$/.test(text);
    if (!ok) e.preventDefault();
  };

// ✅ INLINE SafeNumericInput - no external file needed
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

const SimplePurchaseItemForm: React.FC<SimplePurchaseItemFormProps> = ({
  bahanBaku,
  onCancel,
  onAdd,
  initialMode = 'packaging',
}) => {
  // ✅ Hanya 2 mode: quick & packaging
  const [mode, setMode] = useState<'quick' | 'packaging'>(initialMode);

  // ✅ Track kalau user edit qty manual (agar tidak di-overwrite auto)
  const qtyTouchedRef = useRef(false);

  const [formData, setFormData] = useState<FormData>({
    bahanBakuId: '',
    nama: '',
    satuan: '',
    kuantitas: '',
    hargaSatuan: '',
    keterangan: '',
    jumlahKemasan: '',
    isiPerKemasan: '',
    satuanKemasan: '',
    hargaTotalBeliKemasan: '',
  });

  const calculateAccuratePrice = () => {
    const totalContent = toNumber(formData.jumlahKemasan) * toNumber(formData.isiPerKemasan);
    return totalContent > 0
      ? Math.round((toNumber(formData.hargaTotalBeliKemasan) / totalContent) * 100) / 100
      : 0;
  };

  const accuratePrice = calculateAccuratePrice();
  const accuracyLevel = mode === 'packaging' ? 100 : 70;

  // Reset auto-sync saat masuk packaging mode
  useEffect(() => {
    if (mode === 'packaging') {
      qtyTouchedRef.current = false;
    }
  }, [mode]);

  // Auto-sync kuantitas dari jumlahKemasan * isiPerKemasan (selama qty belum disentuh)
  useEffect(() => {
    if (mode !== 'packaging') return;
    const totalContent = toNumber(formData.jumlahKemasan) * toNumber(formData.isiPerKemasan);
    if (totalContent > 0 && !qtyTouchedRef.current) {
      setFormData((prev) =>
        prev.kuantitas === String(totalContent)
          ? prev
          : {
              ...prev,
              kuantitas: String(totalContent),
            }
      );
    }
  }, [mode, formData.jumlahKemasan, formData.isiPerKemasan]);

  // Update hargaSatuan otomatis di packaging mode
  useEffect(() => {
    if (mode === 'packaging' && accuratePrice > 0) {
      setFormData((prev) =>
        prev.hargaSatuan === String(accuratePrice)
          ? prev
          : { ...prev, hargaSatuan: String(accuratePrice) }
      );
    }
  }, [mode, accuratePrice]);

  // Diagnostics
  useEffect(() => {
    logger.debug('MOUNT <SimplePurchaseItemForm>');
    return () => logger.debug('UNMOUNT <SimplePurchaseItemForm>');
  }, []);

  const handleBahanBakuSelect = (id: string) => {
    const selected = bahanBaku.find((b) => b.id === id);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        bahanBakuId: id,
        nama: selected.nama,
        satuan: selected.satuan,
        satuanKemasan: '', // reset tipe kemasan saat ganti bahan
      }));
    }
  };

  // ✅ Direct field updater (tanpa validasi saat mengetik)
  const handleNumericChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => {
        if (prev[field] === value) return prev;
        return { ...prev, [field]: value };
      });
    },
    [setFormData]
  );

  const onQtyChange = (v: string) => {
    qtyTouchedRef.current = true;
    handleNumericChange('kuantitas', v);
  };

  const getValue = useCallback(
    (field: keyof FormData) => {
      const val = formData[field];
      if (val === null || val === undefined) return '';
      return String(val);
    },
    [formData]
  );

  // ✅ Payload final (number-typed) + guard wajib
  const handleSubmit = () => {
    const isPackaging = mode === 'packaging';

    const qty = isPackaging
      ? Math.max(
          toNumber(formData.kuantitas),
          toNumber(formData.jumlahKemasan) * toNumber(formData.isiPerKemasan)
        )
      : toNumber(formData.kuantitas);

    const price = isPackaging ? calculateAccuratePrice() : toNumber(formData.hargaSatuan);

    if (!formData.bahanBakuId) return toast.error('Pilih bahan baku');
    if (qty <= 0) return toast.error('Kuantitas harus > 0');
    if (price <= 0) return toast.error('Harga satuan harus > 0');

    onAdd({
      bahanBakuId: formData.bahanBakuId,
      nama: formData.nama,
      satuan: formData.satuan,
      kuantitas: qty,
      hargaSatuan: price,
      keterangan: formData.keterangan,
      jumlahKemasan:
        formData.jumlahKemasan === '' ? undefined : toNumber(formData.jumlahKemasan),
      isiPerKemasan: formData.isiPerKemasan === '' ? undefined : toNumber(formData.isiPerKemasan),
      hargaTotalBeliKemasan:
        formData.hargaTotalBeliKemasan === '' ? undefined : toNumber(formData.hargaTotalBeliKemasan),
      satuanKemasan: formData.satuanKemasan?.trim() || undefined,
    });
  };

  // ✅ Submit enable rules
  const canSubmit = Boolean(
    formData.bahanBakuId &&
      (mode === 'packaging'
        ? toNumber(formData.jumlahKemasan) > 0 &&
          toNumber(formData.isiPerKemasan) > 0 &&
          toNumber(formData.hargaTotalBeliKemasan) > 0
        : toNumber(formData.kuantitas) > 0 && toNumber(formData.hargaSatuan) > 0)
  );

  // Refs
  const qtyRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  // ---------- QUICK UI (input sederhana) ----------
  const quickUI = React.useMemo(
    () => (
      <div className="space-y-6">
        {/* Input Fields */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Bahan Baku */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Bahan Baku *</Label>
            <Select value={formData.bahanBakuId} onValueChange={handleBahanBakuSelect}>
              <SelectTrigger className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
                <SelectValue placeholder="Pilih bahan baku" className="text-gray-500" />
              </SelectTrigger>
              <SelectContent>
                {bahanBaku.map((bahan) => (
                  <SelectItem key={bahan.id} value={bahan.id} className="focus:bg-orange-50">
                    <span className="font-medium">{bahan.nama}</span>
                    <span className="text-gray-500 ml-2">({bahan.satuan})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Kuantitas & Harga */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Kuantitas *</Label>
              <div className="flex gap-2">
                <SafeNumericInput
                  ref={qtyRef}
                  value={String(formData.kuantitas ?? '')}
                  onBeforeInput={makeBeforeInputGuard(() => String(formData.kuantitas ?? ''), true)}
                  onPaste={handlePasteGuard(true)}
                  onChange={(e) => {
                    onQtyChange(e.target.value);
                    requestAnimationFrame(() => qtyRef.current?.focus());
                  }}
                  placeholder="0"
                  className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                />
                <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 min-w-[60px] justify-center">
                  {formData.satuan || 'unit'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Harga Satuan *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                <SafeNumericInput
                  ref={priceRef}
                  value={getValue('hargaSatuan')}
                  onBeforeInput={makeBeforeInputGuard(() => getValue('hargaSatuan'), true)}
                  onPaste={handlePasteGuard(true)}
                  onChange={(e) => {
                    handleNumericChange('hargaSatuan', e.target.value);
                    requestAnimationFrame(() => priceRef.current?.focus());
                  }}
                  className="h-11 pl-8 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info banner untuk quick mode */}
        <Alert className="border-amber-200 bg-amber-50/50 backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="font-medium text-amber-800">Input Sederhana</div>
                <p className="text-amber-700 text-sm mt-1">
                  Cocok untuk catat cepat. Untuk HPP paling akurat, pakai input dari nota.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                  Estimasi
                </Badge>
                <Button
                  size="sm"
                  onClick={() => setMode('packaging')}
                  className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-sm"
                >
                  Pakai Nota (100%)
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    ),
    [formData, bahanBaku, handleNumericChange, handleBahanBakuSelect]
  );

  // ---------- PACKAGING UI (pakai nota) ----------
  const packQtyRef = useRef<HTMLInputElement>(null);
  const perPackRef = useRef<HTMLInputElement>(null);
  const totalPayRef = useRef<HTMLInputElement>(null);

  const packagingEl = React.useMemo(
    () => (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Receipt className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Input dari Nota Pembelian</h4>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 mt-1">
                Akurasi 100%
              </Badge>
            </div>
          </div>
          <Button
            variant="link"
            size="sm"
            onClick={() => setMode('quick')}
            className="text-gray-600 underline-offset-4"
          >
            Pindah ke input sederhana
          </Button>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Bahan Baku *</Label>
            <Select value={formData.bahanBakuId} onValueChange={handleBahanBakuSelect}>
              <SelectTrigger className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
                <SelectValue placeholder="Pilih bahan baku" />
              </SelectTrigger>
              <SelectContent>
                {bahanBaku.map((bahan) => (
                  <SelectItem key={bahan.id} value={bahan.id} className="focus:bg-orange-50">
                    <span className="font-medium">{bahan.nama}</span>
                    <span className="text-gray-500 ml-2">({bahan.satuan})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Total yang Dibeli</Label>
            <div className="flex gap-2">
              <input
                className="h-11 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700"
                value={toNumber(formData.jumlahKemasan) * toNumber(formData.isiPerKemasan) || ''}
                disabled
                placeholder="Otomatis terisi"
              />
              <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 min-w-[60px] justify-center">
                {formData.satuan || 'unit'}
              </div>
            </div>
          </div>
        </div>

        {/* Packaging Details */}
        <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-4 sm:p-6">
          <div className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <PackageIcon className="h-4 w-4 text-orange-500" />
            Detail Kemasan dari Nota
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Jumlah bungkus/dus</Label>
              <SafeNumericInput
                ref={packQtyRef}
                value={getValue('jumlahKemasan')}
                inputMode="numeric"
                onBeforeInput={makeBeforeInputGuard(() => getValue('jumlahKemasan'), false)}
                onPaste={handlePasteGuard(false)}
                onChange={(e) => {
                  handleNumericChange('jumlahKemasan', e.target.value);
                  requestAnimationFrame(() => packQtyRef.current?.focus());
                }}
                placeholder="1"
                className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Jenis Kemasan</Label>
              <Select
                value={formData.satuanKemasan || ''}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, satuanKemasan: value }))}
              >
                <SelectTrigger className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20">
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
              <Label className="text-sm font-medium text-gray-700">Isi per bungkus/dus</Label>
              <div className="flex gap-2">
                <SafeNumericInput
                  ref={perPackRef}
                  value={getValue('isiPerKemasan')}
                  onBeforeInput={makeBeforeInputGuard(() => getValue('isiPerKemasan'), true)}
                  onPaste={handlePasteGuard(true)}
                  onChange={(e) => {
                    handleNumericChange('isiPerKemasan', e.target.value);
                    requestAnimationFrame(() => perPackRef.current?.focus());
                  }}
                  placeholder="500"
                  className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                />
                <div className="flex items-center px-2 bg-white border border-gray-200 rounded-md text-xs text-gray-600 min-w-[45px] justify-center">
                  {formData.satuan || 'unit'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Total bayar di nota</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                <SafeNumericInput
                  ref={totalPayRef}
                  value={getValue('hargaTotalBeliKemasan')}
                  onBeforeInput={makeBeforeInputGuard(() => getValue('hargaTotalBeliKemasan'), true)}
                  onPaste={handlePasteGuard(true)}
                  onChange={(e) => {
                    handleNumericChange('hargaTotalBeliKemasan', e.target.value);
                    requestAnimationFrame(() => totalPayRef.current?.focus());
                  }}
                  className="h-11 pl-8 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                  placeholder="25000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ringkasan otomatis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-sm text-gray-600">Total Item (otomatis)</div>
            <div className="text-lg font-semibold">
              {toNumber(formData.jumlahKemasan) * toNumber(formData.isiPerKemasan)}{' '}
              {formData.satuan || 'unit'}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-sm text-gray-600">
              Harga per {formData.satuan || 'unit'} (otomatis)
            </div>
            <div className="text-lg font-semibold text-orange-600">
              {formatCurrency(accuratePrice || 0)}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-sm text-gray-600">Subtotal (otomatis)</div>
            <div className="text-lg font-semibold">
              {formatCurrency(
                toNumber(formData.jumlahKemasan) *
                  toNumber(formData.isiPerKemasan) *
                  (accuratePrice || 0)
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    [formData, accuratePrice, handleNumericChange, handleBahanBakuSelect]
  );

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
                mode === 'packaging'
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200'
              }
            >
              Akurasi {accuracyLevel}%
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
        {mode === 'packaging' ? packagingEl : quickUI}

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

        {/* Subtotal Preview - tampil hanya di quick mode */}
        <div
          className={
            mode === 'quick' && toNumber(formData.kuantitas) > 0 && toNumber(formData.hargaSatuan) > 0
              ? 'bg-white/60 border border-gray-200 p-4 rounded-xl'
              : 'hidden'
          }
        >
          <div className="text-sm text-gray-700">
            <span className="font-medium">Subtotal: </span>
            <span className="font-semibold text-orange-600 text-lg">
              {formatCurrency(toNumber(formData.kuantitas) * toNumber(formData.hargaSatuan))}
            </span>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-sm disabled:bg-gray-300 disabled:text-gray-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah ke Daftar
        </Button>
      </CardContent>
    </Card>
  );
};

export default React.memo(SimplePurchaseItemForm);
