import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Package,
  Receipt,
  Target,
  X,
  Plus
} from 'lucide-react';
import type { PurchaseItem } from '../types/purchase.types';
import { toast } from 'sonner';

// ==== Props untuk integrasi dengan dialog yang ada ====
export interface SmartPurchaseItemFormProps {
  bahanBaku: Array<{ id: string; nama: string; satuan: string }>;
  onCancel?: () => void;
  onAdd: (item: Omit<PurchaseItem, 'subtotal'>) => void; // kamu sudah punya addItem(model lama)
  // optional preset (misal saat user pilih bahan duluan)
  preset?: {
    bahanBakuId?: string;
    nama?: string;
    satuan?: string;
  };
}

type Mode = 'quick' | 'accurate' | 'packaging';

const currency = (n: number) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`;

const SmartPurchaseItemForm: React.FC<SmartPurchaseItemFormProps> = ({
  bahanBaku,
  onCancel,
  onAdd,
  preset
}) => {
  const [mode, setMode] = useState<Mode>('quick');

  // state item (kompatibel dengan PurchaseItem + field kemasan opsional)
  const [formData, setFormData] = useState<{
    bahanBakuId: string;
    nama: string;
    satuan: string;
    kuantitas: number;
    hargaSatuan: number;
    keterangan?: string;
    // packaging (opsional)
    jumlahKemasan?: number;
    isiPerKemasan?: number;
    satuanKemasan?: string;
    hargaTotalBeli?: number;
  }>({
    bahanBakuId: preset?.bahanBakuId || '',
    nama: preset?.nama || '',
    satuan: preset?.satuan || '',
    kuantitas: 0,
    hargaSatuan: 0,
    keterangan: '',
    jumlahKemasan: undefined,
    isiPerKemasan: undefined,
    satuanKemasan: undefined,
    hargaTotalBeli: undefined,
  });

  // kalau preset berubah (misal user pilih bahan duluan)
  useEffect(() => {
    if (!preset) return;
    setFormData(prev => ({
      ...prev,
      bahanBakuId: preset.bahanBakuId || prev.bahanBakuId,
      nama: preset.nama || prev.nama,
      satuan: preset.satuan || prev.satuan,
    }));
  }, [preset]);

  // helper bahan baku -> set nama+satuan otomatis
  const handleSelectBahan = (id: string) => {
    const bb = bahanBaku.find(b => b.id === id);
    setFormData(prev => ({
      ...prev,
      bahanBakuId: id,
      nama: bb?.nama || '',
      satuan: bb?.satuan || 'unit',
    }));
  };

  // harga akurat dari kemasan
  const accuratePrice = useMemo(() => {
    const totalIsi =
      (Number(formData.jumlahKemasan) || 0) * (Number(formData.isiPerKemasan) || 0);
    const ttl = Number(formData.hargaTotalBeli) || 0;
    if (totalIsi > 0 && ttl > 0) {
      return Math.round((ttl / totalIsi) * 100) / 100; // 2 desimal
    }
    return 0;
  }, [formData.jumlahKemasan, formData.isiPerKemasan, formData.hargaTotalBeli]);

  // auto-update harga satuan kalau mode packaging
  useEffect(() => {
    if (mode !== 'packaging') return;
    if (accuratePrice > 0) {
      // override cuma kalau user belum isi manual / selisih sangat kecil
      if (!formData.hargaSatuan || Math.abs(formData.hargaSatuan - accuratePrice) < 0.0001) {
        setFormData(prev => ({ ...prev, hargaSatuan: accuratePrice }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, accuratePrice]);

  const accuracyLevel = mode === 'packaging' ? 100 : mode === 'accurate' ? 85 : 70;
  const priceDifference = Math.abs((formData.hargaSatuan || 0) - (accuratePrice || 0));
  const impactOnMargin =
    priceDifference > 0 && formData.hargaSatuan > 0
      ? ((priceDifference / formData.hargaSatuan) * 100).toFixed(1)
      : 0;

  // submit → kirim ke onAdd (kompatibel sama hook/transformer)
  const handleAdd = () => {
    // validasi minimal
    if (!formData.bahanBakuId) return toast.error('Pilih bahan baku dulu');
    if (!formData.kuantitas || formData.kuantitas <= 0) return toast.error('Kuantitas harus > 0');
    if (!formData.hargaSatuan || formData.hargaSatuan <= 0) return toast.error('Harga satuan harus > 0');

    onAdd({
      bahanBakuId: formData.bahanBakuId,
      nama: formData.nama,
      kuantitas: formData.kuantitas,
      satuan: formData.satuan || 'unit',
      hargaSatuan: formData.hargaSatuan,
      keterangan: formData.keterangan || '',
      // ⚠️ Note: field kemasan TIDAK ada di tipe PurchaseItem.
      // Tapi transformer kita menerima key opsional ini di "items" (akan di-copy & dinormalisasi).
      // Jadi kita ikutkan di object (TypeScript akan warning), kita biarkan onAdd men-drop via pick.
      // Solusi: cast saat panggil (di bawah).
    } as any);

    toast.success('Item ditambahkan');
    onCancel?.();
  };

  // ==== UI sections ====
  const QuickMode = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Bahan Baku *</Label>
          <Select
            value={formData.bahanBakuId}
            onValueChange={handleSelectBahan}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih bahan baku" />
            </SelectTrigger>
            <SelectContent>
              {bahanBaku.map(bb => (
                <SelectItem key={bb.id} value={bb.id}>
                  {bb.nama} ({bb.satuan})
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
              value={formData.kuantitas || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, kuantitas: Number(e.target.value) }))}
              className="flex-1"
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
              value={formData.hargaSatuan || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, hargaSatuan: Number(e.target.value) }))}
              className="pl-8"
            />
          </div>
        </div>
      </div>

      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-yellow-800">Mode Perkiraan – Akurasi {accuracyLevel}%</div>
              <p className="text-yellow-700 text-sm mt-1">
                Untuk profit tracking yang presisi, gunakan data dari nota pembelian
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                Estimasi
              </Badge>
              <Button size="sm" onClick={() => setMode('accurate')} className="bg-green-600 hover:bg-green-700">
                <Target className="h-4 w-4 mr-1" />
                Mode Akurat
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>Subtotal: </strong>
          {currency((formData.kuantitas || 0) * (formData.hargaSatuan || 0))}
        </div>
      </div>
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

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="text-sm text-gray-600 mb-2">📝 Yang perlu disiapkan:</div>
          <div className="text-sm text-gray-700">
            ✓ Nota/struk pembelian<br/>
            ✓ Info kemasan (berapa pak dibeli, isi per pak)<br/>
            ✓ Total pembayaran
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => setMode('quick')}>
            <X className="h-4 w-4 mr-2" />
            Nanti Saja
          </Button>
          <Button onClick={() => setMode('packaging')} className="bg-green-600 hover:bg-green-700">
            <Package className="h-4 w-4 mr-2" />
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
          <Select
            value={formData.bahanBakuId}
            onValueChange={handleSelectBahan}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih bahan baku" />
            </SelectTrigger>
            <SelectContent>
              {bahanBaku.map(bb => (
                <SelectItem key={bb.id} value={bb.id}>
                  {bb.nama} ({bb.satuan})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Total yang Dibeli</Label>
          <div className="p-3 bg-gray-50 rounded border text-sm">
            {(formData.kuantitas || 0)} {formData.satuan || 'unit'}
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
              onChange={(e) => setFormData(prev => ({ ...prev, jumlahKemasan: Number(e.target.value) || undefined }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Jenis Kemasan</Label>
            <Select
              value={formData.satuanKemasan || ''}
              onValueChange={(value) => setFormData(prev => ({ ...prev, satuanKemasan: value || undefined }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="(opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pak">pak</SelectItem>
                <SelectItem value="dus">dus</SelectItem>
                <SelectItem value="karung">karung</SelectItem>
                <SelectItem value="botol">botol</SelectItem>
                <SelectItem value="kaleng">kaleng</SelectItem>
                <SelectItem value="box">box</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Isi Per Kemasan</Label>
            <div className="flex gap-1">
              <Input
                type="number"
                value={formData.isiPerKemasan || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, isiPerKemasan: Number(e.target.value) || undefined }))}
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
                value={formData.hargaTotalBeli || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, hargaTotalBeli: Number(e.target.value) || undefined }))}
                className="pl-8"
              />
            </div>
          </div>
        </div>
      </div>

      <Alert className="border-green-200 bg-green-50">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-medium text-green-800">✨ HPP Akurat Berhasil Dihitung!</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-green-700">Total Isi:</div>
                <div className="font-medium">
                  {(formData.jumlahKemasan || 0)} × {(formData.isiPerKemasan || 0)} = {(formData.jumlahKemasan || 0) * (formData.isiPerKemasan || 0)} {formData.satuan || 'unit'}
                </div>
              </div>
              <div>
                <div className="text-green-700">HPP Per {formData.satuan || 'unit'}:</div>
                <div className="font-bold text-lg text-green-800">
                  {currency(accuratePrice)}
                </div>
              </div>
              <div>
                <div className="text-green-700">Subtotal (perkiraan saat ini):</div>
                <div className="font-medium">
                  {currency((formData.kuantitas || 0) * (accuratePrice || 0))}
                </div>
              </div>
            </div>

            {priceDifference > 1 && formData.hargaSatuan > 0 && (
              <div className="mt-3 p-2 bg-yellow-100 rounded text-yellow-800 text-sm">
                💡 Selisih dari perkiraan awal: {currency(priceDifference)} ({impactOnMargin}% impact pada margin)
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Tambah Item Baru
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                accuracyLevel >= 100
                  ? 'bg-green-100 text-green-700'
                  : accuracyLevel >= 85
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-yellow-100 text-yellow-700'
              }
            >
              Akurasi {accuracyLevel}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mode === 'quick' && <QuickMode />}
        {mode === 'accurate' && <AccurateModePrompt />}
        {mode === 'packaging' && <PackagingMode />}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleAdd}
            disabled={!formData.bahanBakuId || !formData.kuantitas || !formData.hargaSatuan}
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah ke Daftar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartPurchaseItemForm;
