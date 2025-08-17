// src/components/purchase/components/SimplePurchaseItemForm.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  CheckCircle2,
  Package as PackageIcon,
  Receipt,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface BahanBaku {
  id: string;
  nama: string;
  satuan: string; // contoh: pcs, buah, gram, ml
}

// ---- Internal state (semua string biar aman untuk input) ----
interface FormData {
  bahanBakuId: string;
  nama: string;
  satuan: string;

  // input utama
  kuantitas: string;            // Total yang dibeli (unit dasar bahan baku)
  totalBayar: string;           // Total bayar (untuk hitung harga satuan otomatis)

  // optional: detail kemasan (nota)
  jumlahKemasan?: string;
  isiPerKemasan?: string;
  satuanKemasan?: string;
  hargaTotalBeliKemasan?: string; // total bayar dari nota (kalau diisi, override totalBayar)

  keterangan: string;
}

// ---- Payload keluar (angka bersih) ----
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
  onAdd: (formData: PurchaseItemPayload) => void;
}

const toNumber = (v: string | number | '' | undefined) => {
  if (v === '' || v == null) return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  let s = v.toString().trim().replace(/\s+/g, '');
  s = s.replace(/[^\d,.\-]/g, '');
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

const PACK_UNITS = ['pak', 'dus', 'karung', 'botol'];
const PCS_UNITS = ['pcs', 'buah', 'biji', 'butir', 'lembar'];

const SimplePurchaseItemForm: React.FC<SimplePurchaseItemFormProps> = ({
  bahanBaku,
  onCancel,
  onAdd,
}) => {
  const [formData, setFormData] = useState<FormData>({
    bahanBakuId: '',
    nama: '',
    satuan: '',
    kuantitas: '',
    totalBayar: '',
    jumlahKemasan: '',
    isiPerKemasan: '',
    satuanKemasan: '',
    hargaTotalBeliKemasan: '',
    keterangan: '',
  });

  // Toggle detail kemasan
  const [showPackaging, setShowPackaging] = useState(false);

  // Auto hide packaging for pcs/buah, etc
  const hidePackagingByUnit = useMemo(
    () => (formData.satuan ? PCS_UNITS.includes(formData.satuan.toLowerCase()) : false),
    [formData.satuan]
  );

  // Derived from packaging (kalau lengkap)
  const qtyFromPackaging = useMemo(() => {
    const q = toNumber(formData.jumlahKemasan) * toNumber(formData.isiPerKemasan);
    return q > 0 ? q : 0;
  }, [formData.jumlahKemasan, formData.isiPerKemasan]);

  const totalPayFromPackaging = useMemo(() => {
    const v = toNumber(formData.hargaTotalBeliKemasan);
    return v > 0 ? v : 0;
  }, [formData.hargaTotalBeliKemasan]);

  // Harga per unit – urutan prioritas:
  // 1) Kalau packaging valid → harga dari nota / total isi
  // 2) Kalau user isi Total yang Dibeli + Total Bayar → totalBayar / kuantitas
  const computedUnitPrice = useMemo(() => {
    if (qtyFromPackaging > 0 && totalPayFromPackaging > 0) {
      return Math.round((totalPayFromPackaging / qtyFromPackaging) * 100) / 100;
    }
    const qty = toNumber(formData.kuantitas);
    const pay = toNumber(formData.totalBayar);
    if (qty > 0 && pay > 0) {
      return Math.round((pay / qty) * 100) / 100;
    }
    return 0;
  }, [qtyFromPackaging, totalPayFromPackaging, formData.kuantitas, formData.totalBayar]);

  // Total qty yang dipakai untuk ringkasan
  const effectiveQty = useMemo(() => {
    if (qtyFromPackaging > 0) return qtyFromPackaging;
    return toNumber(formData.kuantitas);
  }, [qtyFromPackaging, formData.kuantitas]);

  // Total bayar yang dipakai untuk ringkasan
  const effectivePay = useMemo(() => {
    if (totalPayFromPackaging > 0) return totalPayFromPackaging;
    return toNumber(formData.totalBayar);
  }, [totalPayFromPackaging, formData.totalBayar]);

  const subtotal = useMemo(() => effectiveQty * computedUnitPrice, [effectiveQty, computedUnitPrice]);

  // Select bahan baku → set nama, satuan, reset packaging toggle
  const handleBahanBakuSelect = (id: string) => {
    const selected = bahanBaku.find((b) => b.id === id);
    if (!selected) return;
    setFormData((prev) => ({
      ...prev,
      bahanBakuId: id,
      nama: selected.nama,
      satuan: selected.satuan,
    }));
    // kalau pcs/buah → auto-hide packaging
    if (PCS_UNITS.includes(selected.satuan.toLowerCase())) {
      setShowPackaging(false);
    }
  };

  const handleNumericChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => (prev[field] === value ? prev : { ...prev, [field]: value }));
  }, []);

  // Kalau packaging valid, sync nilai utama secara halus (tanpa bikin user bingung)
  useEffect(() => {
    if (qtyFromPackaging > 0) {
      setFormData((prev) =>
        prev.kuantitas === String(qtyFromPackaging) ? prev : { ...prev, kuantitas: String(qtyFromPackaging) }
      );
    }
    if (totalPayFromPackaging > 0) {
      setFormData((prev) =>
        prev.totalBayar === String(totalPayFromPackaging) ? prev : { ...prev, totalBayar: String(totalPayFromPackaging) }
      );
    }
  }, [qtyFromPackaging, totalPayFromPackaging]);

  // Debug mount/unmount
  useEffect(() => {
    logger.debug('MOUNT <SimplePurchaseItemForm>');
    return () => logger.debug('UNMOUNT <SimplePurchaseItemForm>');
  }, []);

  // Submit
  const handleSubmit = () => {
    if (!formData.bahanBakuId) return toast.error('Pilih bahan baku');
    if (effectiveQty <= 0) return toast.error('Total yang dibeli harus > 0');
    if (computedUnitPrice <= 0) return toast.error('Tidak bisa menghitung harga per unit');

    onAdd({
      bahanBakuId: formData.bahanBakuId,
      nama: formData.nama,
      satuan: formData.satuan,
      kuantitas: effectiveQty,
      hargaSatuan: computedUnitPrice,
      keterangan: formData.keterangan,
      jumlahKemasan:
        formData.jumlahKemasan === '' ? undefined : toNumber(formData.jumlahKemasan),
      isiPerKemasan:
        formData.isiPerKemasan === '' ? undefined : toNumber(formData.isiPerKemasan),
      hargaTotalBeliKemasan:
        formData.hargaTotalBeliKemasan === '' ? undefined : toNumber(formData.hargaTotalBeliKemasan),
      satuanKemasan: formData.satuanKemasan?.trim() || undefined,
    });
  };

  const canSubmit =
    !!formData.bahanBakuId &&
    effectiveQty > 0 &&
    computedUnitPrice > 0;

  // refs
  const qtyRef = useRef<HTMLInputElement>(null);
  const payRef = useRef<HTMLInputElement>(null);
  const packQtyRef = useRef<HTMLInputElement>(null);
  const perPackRef = useRef<HTMLInputElement>(null);
  const totalNotaRef = useRef<HTMLInputElement>(null);

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
                qtyFromPackaging > 0 && totalPayFromPackaging > 0
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-blue-100 text-blue-700 border-blue-200'
              }
            >
              {qtyFromPackaging > 0 && totalPayFromPackaging > 0 ? 'Akurat 100%' : 'Otomatis dihitung'}
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
        {/* Pilih Bahan Baku */}
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
                  requestAnimationFrame(() => qtyRef.current?.focus());
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
                  requestAnimationFrame(() => payRef.current?.focus());
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

        {/* Detail Kemasan (opsional) */}
        {!hidePackagingByUnit && (
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-100 rounded-md flex items-center justify-center">
                  <PackageIcon className="h-3.5 w-3.5 text-orange-600" />
                </div>
                <div className="font-medium text-gray-900">Detail Kemasan (opsional)</div>
                {qtyFromPackaging > 0 && totalPayFromPackaging > 0 && (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Akurat 100%</Badge>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPackaging((v) => !v)}
                className="text-gray-600 hover:bg-gray-50"
              >
                {showPackaging ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Sembunyikan
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Tampilkan
                  </>
                )}
              </Button>
            </div>

            {showPackaging && (
              <div className="px-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Jumlah bungkus/dus</Label>
                    <SafeNumericInput
                      ref={packQtyRef}
                      value={formData.jumlahKemasan ?? ''}
                      inputMode="numeric"
                      onBeforeInput={makeBeforeInputGuard(() => formData.jumlahKemasan ?? '', false)}
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
                        {PACK_UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Isi per bungkus/dus</Label>
                    <div className="flex gap-2">
                      <SafeNumericInput
                        ref={perPackRef}
                        value={formData.isiPerKemasan ?? ''}
                        onBeforeInput={makeBeforeInputGuard(() => formData.isiPerKemasan ?? '', true)}
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
                    <Label className="text-sm font-medium text-gray-700">Total bayar (dari nota)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                      <SafeNumericInput
                        ref={totalNotaRef}
                        value={formData.hargaTotalBeliKemasan ?? ''}
                        onBeforeInput={makeBeforeInputGuard(() => formData.hargaTotalBeliKemasan ?? '', true)}
                        onPaste={handlePasteGuard(true)}
                        onChange={(e) => {
                          handleNumericChange('hargaTotalBeliKemasan', e.target.value);
                          requestAnimationFrame(() => totalNotaRef.current?.focus());
                        }}
                        className="h-11 pl-8 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                        placeholder="25000"
                      />
                    </div>
                  </div>
                </div>

                {/* preview otomatis di dalam kartu */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="text-sm text-gray-600">Total Item (otomatis)</div>
                    <div className="text-lg font-semibold">
                      {qtyFromPackaging} {formData.satuan || 'unit'}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="text-sm text-gray-600">
                      Harga per {formData.satuan || 'unit'} (otomatis)
                    </div>
                    <div className="text-lg font-semibold text-orange-600">
                      {formatCurrency(
                        qtyFromPackaging > 0 && totalPayFromPackaging > 0
                          ? totalPayFromPackaging / qtyFromPackaging
                          : 0
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="text-sm text-gray-600">Subtotal (otomatis)</div>
                    <div className="text-lg font-semibold">
                      {formatCurrency(
                        qtyFromPackaging > 0 && totalPayFromPackaging > 0
                          ? (totalPayFromPackaging / qtyFromPackaging) * qtyFromPackaging
                          : 0
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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
