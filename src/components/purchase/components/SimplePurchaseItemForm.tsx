// src/components/purchase/components/SimplePurchaseItemForm.tsx
import React, { useState, useEffect } from 'react';
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

interface BahanBaku {
  id: string;
  nama: string;
  satuan: string;
}

export interface FormData {
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

export default SimplePurchaseItemForm;