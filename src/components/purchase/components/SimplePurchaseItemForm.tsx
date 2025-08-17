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

// Internal form state (string-friendly for inputs)
interface FormData {
  bahanBakuId: string;
  nama: string;
  satuan: string;

  // Minimal fields (selalu ada)
  kuantitas: string;                 // "Total yang Dibeli"
  hargaTotalBeliKemasan: string;     // "Total Bayar" (nota)

  // Opsional detail kemasan
  jumlahKemasan?: string;
  isiPerKemasan?: string;
  satuanKemasan?: string;

  // Catatan
  keterangan: string;
}

// Output payload (tetap kompatibel)
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

// ---- Utilities ----
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

// Guards: cegah input tak valid
const makeBeforeInputGuard = (getValue: () => string, allowDecimal = true) =>
  (e: React.FormEvent<HTMLInputElement> & { nativeEvent: InputEvent }) => {
    const ch = (e.nativeEvent as any).data ?? '';
    if (!ch) return;
    const el = e.currentTarget as HTMLInputElement;
    const cur = getValue() ?? '';
    const next = cur.slice(0, el.selectionStart ?? cur.length) + ch + cur.slice(el.selectionEnd ?? cur.length);
    if (!allowDecimal) {
      if (!/^\d*$/.test(next)) e.preventDefault();
      return;
    }
    if (!/^\d*(?:[.,]\d{0,6})?$/.test(next)) e.preventDefault();
  };

const handlePasteGuard = (allowDecimal = true) =>
  (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').trim();
    const ok = allowDecimal ? /^\d*(?:[.,]\d{0,6})?$/.test(text) : /^\d*$/.test(text);
    if (!ok) e.preventDefault();
  };

// Input angka aman
const SafeNumericInput = React.forwardRef<
  HTMLInputElement, 
  React.InputHTMLAttributes<HTMLInputElement> & { value: string | number }
>(({ className = '', value, onChange, ...props }, ref) => {
  const baseClasses = "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50";
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

interface SimplePurchaseItemFormProps {
  bahanBaku: BahanBaku[];
  onCancel: () => void;
  onAdd: (formData: PurchaseItemPayload) => void;
  // start in simple (nota) mode by default
  initialMode?: 'quick' | 'packaging'; // ignored, kept for compatibility
}

const SimplePurchaseItemForm: React.FC<SimplePurchaseItemFormProps> = ({
  bahanBaku,
  onCancel,
  onAdd,
}) => {
  // Track apakah user pernah ubah qty manual (agar tidak di-overwrite oleh detail kemasan)
  const qtyTouchedRef = useRef(false);
  const [showPackaging, setShowPackaging] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    bahanBakuId: '',
    nama: '',
    satuan: '',
    kuantitas: '',                 // Total yang Dibeli
    hargaTotalBeliKemasan: '',     // Total Bayar
    jumlahKemasan: '',
    isiPerKemasan: '',
    satuanKemasan: '',
    keterangan: '',
  });

  // Harga per unit dihitung otomatis dari total bayar / total qty
  const totalQty = toNumber(formData.kuantitas);
  const totalPay = toNumber(formData.hargaTotalBeliKemasan);
  const unitPrice = totalQty > 0 ? Math.round((totalPay / totalQty) * 100) / 100 : 0;

  // Auto-sync qty dari detail kemasan (opsional) selama user belum mengubah qty manual
  useEffect(() => {
    const packTotal = toNumber(formData.jumlahKemasan) * toNumber(formData.isiPerKemasan);
    if (showPackaging && packTotal > 0 && !qtyTouchedRef.current) {
      setFormData(prev => prev.kuantitas === String(packTotal) ? prev : { ...prev, kuantitas: String(packTotal) });
    }
  }, [showPackaging, formData.jumlahKemasan, formData.isiPerKemasan]);

  // Debug mount/unmount
  useEffect(() => {
    logger.debug('MOUNT <SimplePurchaseItemForm>');
    return () => logger.debug('UNMOUNT <SimplePurchaseItemForm>');
  }, []);

  const handleBahanBakuSelect = (id: string) => {
    const selected = bahanBaku.find(b => b.id === id);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        bahanBakuId: id,
        nama: selected.nama,
        satuan: selected.satuan,
        // jangan reset qty/pay yg sudah diisi
      }));
    }
  };

  const setField = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => (prev[field] === value ? prev : { ...prev, [field]: value }));
  }, []);

  const onQtyChange = (v: string) => {
    qtyTouchedRef.current = true;
    setField('kuantitas', v);
  };

  const getValue = useCallback((field: keyof FormData) => String(formData[field] ?? ''), [formData]);

  const handleSubmit = () => {
    if (!formData.bahanBakuId) return toast.error('Pilih bahan baku');
    if (totalQty <= 0)          return toast.error('Total yang dibeli harus > 0');
    if (totalPay <= 0)          return toast.error('Total bayar harus > 0');

    onAdd({
      bahanBakuId: formData.bahanBakuId,
      nama: formData.nama,
      satuan: formData.satuan,
      kuantitas: totalQty,
      hargaSatuan: unitPrice,
      keterangan: formData.keterangan,
      // kirim detail kemasan jika ada
      jumlahKemasan: formData.jumlahKemasan ? toNumber(formData.jumlahKemasan) : undefined,
      isiPerKemasan: formData.isiPerKemasan ? toNumber(formData.isiPerKemasan) : undefined,
      hargaTotalBeliKemasan: totalPay,
      satuanKemasan: formData.satuanKemasan?.trim() || undefined,
    });
  };

  const canSubmit = Boolean(
    formData.bahanBakuId &&
    toNumber(formData.kuantitas) > 0 &&
    toNumber(formData.hargaTotalBeliKemasan) > 0
  );

  // Refs (focus)
  const qtyRef = useRef<HTMLInputElement>(null);
  const totalRef = useRef<HTMLInputElement>(null);
  const packQtyRef = useRef<HTMLInputElement>(null);
  const perPackRef = useRef<HTMLInputElement>(null);
  const totalPayRef = useRef<HTMLInputElement>(null);

  // --- UI ---
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
              className={totalQty > 0 && totalPay > 0 ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"}
            >
              {totalQty > 0 && totalPay > 0 ? 'Akurasi 100%' : 'Akurasi 70%'}
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
        {/* ====== Bagian Utama (sesuai nota, paling sederhana) ====== */}
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

          {/* Total yang Dibeli & Total Bayar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total Qty */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Total yang Dibeli *</Label>
              <div className="flex gap-2">
                <SafeNumericInput
                  ref={qtyRef}
                  value={getValue('kuantitas')}
                  onBeforeInput={makeBeforeInputGuard(() => getValue('kuantitas'), true)}
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

            {/* Total Pay */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Total Bayar *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">Rp</span>
                <SafeNumericInput
                  ref={totalRef}
                  value={getValue('hargaTotalBeliKemasan')}
                  onBeforeInput={makeBeforeInputGuard(() => getValue('hargaTotalBeliKemasan'), true)}
                  onPaste={handlePasteGuard(true)}
                  onChange={(e) => {
                    setField('hargaTotalBeliKemasan', e.target.value);
                    requestAnimationFrame(() => totalRef.current?.focus());
                  }}
                  className="h-11 pl-8 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Info akurasi bila data utama belum lengkap */}
        {!(totalQty > 0 && totalPay > 0) && (
          <Alert className="border-amber-200 bg-amber-50/50 backdrop-blur-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-amber-800">Mode Perkiraan</div>
                  <p className="text-amber-700 text-sm mt-1">
                    Masukkan <b>Total yang Dibeli</b> dan <b>Total Bayar</b> dari nota agar harga per unit dihitung otomatis.
                  </p>
                </div>
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                  Estimasi
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Harga per unit & Subtotal (otomatis) */}
        {totalQty > 0 && totalPay > 0 && (
          <Alert className="border-emerald-200 bg-emerald-50/50 backdrop-blur-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="text-center sm:text-left">
                  <div className="text-emerald-700 font-medium">Harga per {formData.satuan || 'unit'}</div>
                  <div className="font-bold text-lg text-orange-600">{formatCurrency(unitPrice)}</div>
                </div>
                <div className="text-center">
                  <div className="text-emerald-700 font-medium">Total Qty</div>
                  <div className="text-gray-800">{totalQty} {formData.satuan || 'unit'}</div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-emerald-700 font-medium">Subtotal</div>
                  <div className="font-semibold text-gray-900">{formatCurrency(totalPay)}</div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* ====== Detail Kemasan (Opsional) ====== */}
        <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium text-gray-900 flex items-center gap-2">
              <PackageIcon className="h-4 w-4 text-orange-500" />
              Detail Kemasan (opsional)
            </div>
            <Button variant="link" size="sm" onClick={() => setShowPackaging(v => !v)} className="text-gray-600 underline-offset-4">
              {showPackaging ? 'Sembunyikan' : 'Isi detail kemasan'}
            </Button>
          </div>

          {showPackaging && (
            <>
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
                      setField('jumlahKemasan', e.target.value);
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
                    onValueChange={(value) => setFormData(prev => ({ ...prev, satuanKemasan: value }))}
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
                        setField('isiPerKemasan', e.target.value);
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
                      ref={totalPayRef}
                      value={getValue('hargaTotalBeliKemasan')}
                      onBeforeInput={makeBeforeInputGuard(() => getValue('hargaTotalBeliKemasan'), true)}
                      onPaste={handlePasteGuard(true)}
                      onChange={(e) => {
                        setField('hargaTotalBeliKemasan', e.target.value);
                        requestAnimationFrame(() => totalPayRef.current?.focus());
                      }}
                      className="h-11 pl-8 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                      placeholder="25000"
                    />
                  </div>
                </div>
              </div>

              {/* Ringkasan dari detail kemasan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-sm text-gray-600">Total Item (otomatis)</div>
                  <div className="text-lg font-semibold">
                    {toNumber(formData.jumlahKemasan) * toNumber(formData.isiPerKemasan)} {formData.satuan || 'unit'}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-sm text-gray-600">Harga per {formData.satuan || 'unit'} (otomatis)</div>
                  <div className="text-lg font-semibold text-orange-600">
                    {formatCurrency(unitPrice || 0)}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-sm text-gray-600">Subtotal (otomatis)</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(totalPay || 0)}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Catatan */}
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

        {/* Tombol submit */}
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
