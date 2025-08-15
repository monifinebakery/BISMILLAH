// src/components/purchase/components/SimplePurchaseItemForm.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  X, 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Package as PackageIcon,
  Receipt,
  Target
} from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface BahanBaku {
  id: string;
  nama: string;
  satuan: string;
}

export interface FormData {
  bahanBakuId: string;
  nama: string;
  satuan: string;
  kuantitas: number | '';
  hargaSatuan: number | '';
  keterangan: string;
  jumlahKemasan?: number | '';
  isiPerKemasan?: number | '';
  satuanKemasan?: string;
  hargaTotalBeliKemasan?: number | '';
}

interface SimplePurchaseItemFormProps {
  bahanBaku: BahanBaku[];
  onCancel: () => void;
  onAdd: (formData: FormData) => void;
  initialMode?: 'quick' | 'packaging'; // NEW: Allow initial mode
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
// Allow digits and optionally a single decimal separator ('.' or ',')
const makeBeforeInputGuard = (getValue: () => string, allowDecimal = true) =>
  (e: React.FormEvent<HTMLInputElement> & { nativeEvent: InputEvent }) => {
    const ch = (e.nativeEvent as any).data ?? '';
    if (!ch) return; // control keys, deletes, etc.

    const el = e.currentTarget as HTMLInputElement;
    const cur = getValue() ?? '';
    const next = cur.slice(0, el.selectionStart ?? cur.length) + ch + cur.slice(el.selectionEnd ?? cur.length);

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

const SimplePurchaseItemForm: React.FC<SimplePurchaseItemFormProps> = ({
  bahanBaku,
  onCancel,
  onAdd,
  initialMode = 'quick', // NEW: Default to quick mode
}) => {
  const [mode, setMode] = useState<'quick' | 'accurate' | 'packaging'>(
    initialMode === 'packaging' ? 'packaging' : 'quick'
  );
  
  // ✅ FIXED: Always use strings for numeric inputs to prevent value switching
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
    return totalContent > 0 ? Math.round((toNumber(formData.hargaTotalBeliKemasan) / totalContent) * 100) / 100 : 0;
  };

  const accuratePrice = calculateAccuratePrice();
  const accuracyLevel = mode === 'packaging' ? 100 : mode === 'accurate' ? 85 : 70;

  // Update accurate price when in packaging mode - prevent unnecessary updates
  useEffect(() => {
    if (mode === 'packaging' && accuratePrice > 0) {
      setFormData(prev => (
        prev.hargaSatuan === String(accuratePrice)
          ? prev
          : { ...prev, hargaSatuan: String(accuratePrice) }
      ));
    }
  }, [mode, accuratePrice]);

  // Diagnostics - check for unnecessary remounts
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
      }));
    }
  };

  // ✅ SUPER LIGHTWEIGHT: Direct field updater - NO VALIDATION
  const handleNumericChange = useCallback((field: keyof FormData, value: string) => {
    // PURE state update - no side effects, no validation, no re-render triggers
    setFormData(prev => {
      if (prev[field] === value) return prev; // Skip if same value
      return { ...prev, [field]: value };
    });
  }, [setFormData]);

  // ✅ STABLE: Simple value getter without dependencies
  const getValue = useCallback((field: keyof FormData) => {
    const val = formData[field];
    if (val === null || val === undefined) return '';
    return String(val);
  }, [formData]);

  // ✅ ULTRA OPTIMIZED: Use form's addItem directly for zero overhead
  const handleSubmit = () => {
    const qty = toNumber(formData.kuantitas);
    const price = toNumber(formData.hargaSatuan);

    // Basic validation only
    if (!formData.bahanBakuId) return toast.error('Pilih bahan baku');
    if (qty <= 0) return toast.error('Kuantitas harus > 0');
    if (price <= 0) return toast.error('Harga satuan harus > 0');

    // Direct call to form's addItem - no intermediate handlers
    onAdd({
      ...formData,
      kuantitas: qty,
      hargaSatuan: price,
      jumlahKemasan: formData.jumlahKemasan === '' ? undefined : toNumber(formData.jumlahKemasan),
      isiPerKemasan: formData.isiPerKemasan === '' ? undefined : toNumber(formData.isiPerKemasan),
      hargaTotalBeliKemasan: formData.hargaTotalBeliKemasan === '' ? undefined : toNumber(formData.hargaTotalBeliKemasan),
      satuanKemasan: formData.satuanKemasan?.trim() || undefined,
    } as FormData);
  };

  // Refs for focus stability
  const qtyRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);

  const QuickMode = React.memo(function QuickMode() {
    useEffect(() => {
      logger.debug('MOUNT <QuickMode>');
      return () => logger.debug('UNMOUNT <QuickMode>');
    }, []);
    
    return (
    <div className="space-y-6">
      {/* Input Fields - Responsive Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Bahan Baku - Full Width on Mobile */}
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

        {/* Kuantitas & Harga - Side by Side on Desktop */}
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
                  handleNumericChange('kuantitas', e.target.value);
                  // Focus safety net
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
                  // Focus safety net
                  requestAnimationFrame(() => priceRef.current?.focus());
                }}
                className="h-11 pl-8 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Accuracy Alert - Always in DOM, hidden when not needed */}
      <Alert className="border-amber-200 bg-amber-50/50 backdrop-blur-sm">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-medium text-amber-800">Mode Perkiraan</div>
              <p className="text-amber-700 text-sm mt-1">
                Akurasi {accuracyLevel}% • Gunakan nota pembelian untuk profit tracking presisi
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                Estimasi
              </Badge>
              <Button
                size="sm"
                onClick={() => setMode('accurate')}
                className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-sm"
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
  });

  const AccurateModePrompt = React.memo(function AccurateModePrompt() {
    useEffect(() => {
      logger.debug('MOUNT <AccurateModePrompt>');
      return () => logger.debug('UNMOUNT <AccurateModePrompt>');
    }, []);
    
    return (
    <div className="space-y-6">
      <div className="text-center py-8">
        {/* Icon */}
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <TrendingUp className="h-8 w-8 text-orange-600" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Mode Akurat</h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Dapatkan HPP yang akurat untuk analisis margin profit yang real
        </p>
        
        {/* Benefits Grid - Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
            <div className="font-medium text-gray-900 text-sm">Profit Real-time</div>
            <div className="text-xs text-gray-600 mt-1">Margin presisi tinggi</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
            <Calculator className="h-5 w-5 text-blue-600 mx-auto mb-2" />
            <div className="font-medium text-gray-900 text-sm">HPP Akurat</div>
            <div className="text-xs text-gray-600 mt-1">Harga pokok tepat</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
            <Receipt className="h-5 w-5 text-purple-600 mx-auto mb-2" />
            <div className="font-medium text-gray-900 text-sm">Laporan Presisi</div>
            <div className="text-xs text-gray-600 mt-1">Data dapat diandalkan</div>
          </div>
        </div>

        {/* Action Buttons - Responsive Stack */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={() => setMode('quick')}
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <X className="h-4 w-4 mr-2" />
            Nanti Saja
          </Button>
          <Button 
            onClick={() => setMode('packaging')} 
            className="bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-sm"
          >
            <PackageIcon className="h-4 w-4 mr-2" />
            Lanjutkan
          </Button>
        </div>
      </div>
    </div>
    );
  });

  const PackagingMode = React.memo(function PackagingMode() {
    useEffect(() => {
      logger.debug('MOUNT <PackagingMode>');
      return () => logger.debug('UNMOUNT <PackagingMode>');
    }, []);

    // 🔧 NEW: refs untuk jaga fokus di packaging inputs
    const packQtyRef = useRef<HTMLInputElement>(null);
    const perPackRef = useRef<HTMLInputElement>(null);
    const totalPayRef = useRef<HTMLInputElement>(null);
    
    return (
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
        <Button variant="ghost" size="sm" onClick={() => setMode('quick')} className="self-start sm:self-center">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Basic Info - Responsive Grid */}
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
            <SafeNumericInput
              ref={packQtyRef}
              value={getValue('kuantitas')}
              onBeforeInput={makeBeforeInputGuard(() => getValue('kuantitas'), true)}
              onPaste={handlePasteGuard(true)}
              onChange={(e) => {
                handleNumericChange('kuantitas', e.target.value);
                requestAnimationFrame(() => packQtyRef.current?.focus());
              }}
              placeholder="0"
              className="h-11 border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
            />
            <div className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 min-w-[60px] justify-center">
              {formData.satuan || 'unit'}
            </div>
          </div>
        </div>
      </div>

      {/* Packaging Details - Clean Card */}
      <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-4 sm:p-6">
        <div className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <PackageIcon className="h-4 w-4 text-orange-500" />
          Detail Kemasan dari Nota
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Jumlah Kemasan</Label>
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
            <Label className="text-sm font-medium text-gray-700">Isi Per Kemasan</Label>
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
            <Label className="text-sm font-medium text-gray-700">Total Bayar</Label>
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

      {/* Calculation Result - Always in DOM, hidden when not needed */}
      <Alert className={accuratePrice > 0 ? "border-emerald-200 bg-emerald-50/50 backdrop-blur-sm" : "hidden"}>
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        <AlertDescription>
          <div className="space-y-3">
            <div className="font-medium text-emerald-800">✨ HPP Akurat Berhasil Dihitung!</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="text-center sm:text-left">
                <div className="text-emerald-700 font-medium">Total Isi</div>
                <div className="text-gray-700">
                  {toNumber(formData.jumlahKemasan)} × {toNumber(formData.isiPerKemasan)} = {toNumber(formData.jumlahKemasan) * toNumber(formData.isiPerKemasan)} {formData.satuan}
                </div>
              </div>
              <div className="text-center">
                <div className="text-emerald-700 font-medium">HPP Per {formData.satuan}</div>
                <div className="font-bold text-lg text-orange-600">
                  {formatCurrency(accuratePrice)}
                </div>
              </div>
              <div className="text-center sm:text-right">
                <div className="text-emerald-700 font-medium">Subtotal</div>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(toNumber(formData.kuantitas) * accuratePrice)}
                </div>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
    );
  });

  return (
    <Card className="border-dashed border-orange-200 bg-orange-50/30 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Plus className="h-4 w-4 text-orange-600" />
            </div>
            <span className="text-lg">Tambah Item Baru</span>
            <Badge variant="outline" className={
              accuracyLevel >= 100 ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
              accuracyLevel >= 85 ? "bg-blue-100 text-blue-700 border-blue-200" :
              "bg-amber-100 text-amber-700 border-amber-200"
            }>
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
        {mode === 'quick' && <QuickMode />}
        {mode === 'accurate' && <AccurateModePrompt />}
        {mode === 'packaging' && <PackagingMode />}
        
        {/* Notes - Always in DOM, hidden when not needed */}
        <div className={mode !== 'accurate' ? "space-y-2" : "hidden"}>
          <Label className="text-sm font-medium text-gray-700">Keterangan</Label>
          <Textarea
            value={formData.keterangan}
            onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
            placeholder="Keterangan tambahan (opsional)"
            rows={2}
            className="border-gray-200 focus:border-orange-500 focus:ring-orange-500/20"
          />
        </div>

        {/* Subtotal Preview - Always in DOM, hidden when not needed */}
        <div className={(mode !== 'accurate' && toNumber(formData.kuantitas) > 0 && toNumber(formData.hargaSatuan) > 0) ? "bg-white/60 border border-gray-200 p-4 rounded-xl" : "hidden"}>
          <div className="text-sm text-gray-700">
            <span className="font-medium">Subtotal: </span>
            <span className="font-semibold text-orange-600 text-lg">
              {formatCurrency(toNumber(formData.kuantitas) * toNumber(formData.hargaSatuan))}
            </span>
          </div>
        </div>

        {/* Submit Button - Always in DOM, hidden when not needed */}
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!formData.bahanBakuId || toNumber(formData.kuantitas) <= 0 || toNumber(formData.hargaSatuan) <= 0}
          className={mode !== 'accurate' ? "w-full h-11 bg-orange-500 hover:bg-orange-600 text-white border-0 shadow-sm disabled:bg-gray-300 disabled:text-gray-500" : "hidden"}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah ke Daftar
        </Button>
      </CardContent>
    </Card>
  );
};

export default React.memo(SimplePurchaseItemForm);
