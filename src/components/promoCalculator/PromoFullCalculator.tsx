// src/pages/PromoFullCalculator.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Save, 
  ArrowLeft, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { promoService } from '@/components/promoCalculator/services/promoService';

const PROMO_QUERY_KEYS = {
  all: ['promos'],
  detail: (id) => [...PROMO_QUERY_KEYS.all, 'detail', id],
};

interface PromoCalculationResult {
  finalPrice: number;
  promoMargin: number;
  savings: number;
  profit: number;
}

const calculatePromo = (data: any): PromoCalculationResult | null => {
  try {
    switch (data.tipePromo) {
      case 'discount': {
        const base = parseFloat(data.hargaProduk ?? data.hargaAsli ?? '');
        const cost = parseFloat(data.hpp ?? '0');
        const disc = parseFloat(data.nilaiDiskon ?? '');
        if (!Number.isFinite(base) || base <= 0) {
          throw new Error('Harga produk tidak valid');
        }
        if (!Number.isFinite(disc)) {
          throw new Error('Nilai diskon tidak valid');
        }
        const finalPrice = base * (1 - disc / 100);
        const profit = finalPrice - (Number.isFinite(cost) ? cost : 0);
        const promoMargin = finalPrice !== 0 ? (profit / finalPrice) * 100 : 0;
        const savings = base - finalPrice;
        if ([finalPrice, promoMargin, savings, profit].some(n => !Number.isFinite(n))) {
          throw new Error('Perhitungan tidak valid');
        }
        return { finalPrice, promoMargin, savings, profit };
      }
      case 'bogo': {
        const price = parseFloat(data.hargaProduk ?? '');
        const cost = parseFloat(data.hpp ?? '0');
        const buy = parseFloat(data.beli ?? '1');
        const get = parseFloat(data.gratis ?? '1');
        if (!Number.isFinite(price) || price <= 0) {
          throw new Error('Harga produk tidak valid');
        }
        const finalPrice = price * buy / (buy + get);
        const profit = finalPrice - (Number.isFinite(cost) ? cost : 0);
        const promoMargin = finalPrice !== 0 ? (profit / finalPrice) * 100 : 0;
        const savings = price - finalPrice;
        if ([finalPrice, promoMargin, savings, profit].some(n => !Number.isFinite(n))) {
          throw new Error('Perhitungan tidak valid');
        }
        return { finalPrice, promoMargin, savings, profit };
      }
      case 'bundle': {
        const normal = parseFloat(data.hargaNormal ?? '');
        const bundle = parseFloat(data.hargaBundle ?? '');
        const cost = parseFloat(data.hpp ?? '0');
        if (!Number.isFinite(normal) || normal <= 0) {
          throw new Error('Harga normal tidak valid');
        }
        if (!Number.isFinite(bundle) || bundle <= 0) {
          throw new Error('Harga bundle tidak valid');
        }
        const profit = bundle - (Number.isFinite(cost) ? cost : 0);
        const promoMargin = bundle !== 0 ? (profit / bundle) * 100 : 0;
        const savings = normal - bundle;
        if ([bundle, promoMargin, savings, profit].some(n => !Number.isFinite(n))) {
          throw new Error('Perhitungan tidak valid');
        }
        return { finalPrice: bundle, promoMargin, savings, profit };
      }
      default:
        throw new Error('Tipe promo tidak valid');
    }
  } catch (error) {
    console.error('calculatePromo error:', error);
    return null;
  }
};

const PromoFullCalculator = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Untuk mode edit
  const [searchParams] = useSearchParams(); // Untuk mode create dari query params jika diperlukan
  const queryClient = useQueryClient();
  
  const isEditMode = !!id;

  // State untuk form
  const [formData, setFormData] = useState({
    namaPromo: '',
    tipePromo: 'discount', // Default
    status: 'draft',
    deskripsi: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    // Tambahkan field lain yang diperlukan untuk kalkulasi
    nilaiDiskon: '', // Contoh untuk tipe 'discount'
    resepUtama: '',  // Contoh untuk tipe 'bogo'
    resepGratis: '', // Contoh untuk tipe 'bogo'
    // ... field lainnya
  });

  // State untuk hasil kalkulasi
  const [calculationResult, setCalculationResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // ✅ Fetch promo detail jika dalam mode edit
  const promoQuery = useQuery({
    queryKey: PROMO_QUERY_KEYS.detail(id),
    queryFn: async () => {
      if (!id) return null;
      const promo = await promoService.getById(id);
      return promo;
    },
    enabled: isEditMode,
    onSuccess: (data) => {
      if (data) {
        // Transform data dari DB ke format form
        setFormData({
          namaPromo: data.namaPromo || '',
          tipePromo: data.tipePromo || 'discount',
          status: data.status || 'draft',
          deskripsi: data.deskripsi || '',
          tanggalMulai: data.tanggalMulai || '',
          tanggalSelesai: data.tanggalSelesai || '',
          // Map field lainnya dari dataPromo jika ada
          ...(data.dataPromo || {})
        });
        // Jika ada hasil kalkulasi sebelumnya
        if (data.calculationResult) {
          setCalculationResult(data.calculationResult);
        }
      }
    },
    onError: (error) => {
      console.error("Failed to fetch promo detail:", error);
      toast.error("Gagal memuat data promo untuk diedit.");
    }
  });

  // ✅ Mutation untuk menyimpan (create/update) promo
  const savePromoMutation = useMutation({
    mutationFn: async (promoData) => {
      // Gabungkan formData dengan calculationResult
      const fullPromoData = {
        ...promoData,
        calculationResult // Tambahkan hasil kalkulasi
      };

      if (isEditMode) {
        return await promoService.update(id, fullPromoData);
      } else {
        return await promoService.create(fullPromoData);
      }
    },
    onSuccess: (data) => {
      toast.success(isEditMode ? 'Promo berhasil diperbarui!' : 'Promo baru berhasil dibuat!');
      queryClient.invalidateQueries({ queryKey: ['promos'] });
      // Redirect ke halaman daftar atau detail setelah simpan
      navigate('/promo/list'); 
    },
    onError: (error) => {
      console.error("Save promo error:", error);
      toast.error(`Gagal menyimpan promo: ${error.message}`);
    },
  });

  // ✅ Isi form jika sedang edit dan data sudah dimuat
  useEffect(() => {
    if (isEditMode && promoQuery.data) {
      // Data sudah diisi di onSuccess query
    }
  }, [isEditMode, promoQuery.data]);

  // ✅ Handler perubahan input
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Handler untuk tombol kembali
  const handleGoBack = () => {
    if (window.confirm("Perubahan yang belum disimpan akan hilang. Lanjutkan?")) {
      navigate(-1); // Kembali ke halaman sebelumnya
      // Atau bisa juga: navigate('/promo/list');
    }
  };

  // ✅ Handler untuk tombol simpan
  const handleSave = async () => {
    // Validasi dasar
    if (!formData.namaPromo.trim()) {
      toast.error("Nama promo wajib diisi.");
      return;
    }
    if (!formData.tipePromo) {
      toast.error("Tipe promo wajib dipilih.");
      return;
    }

    let result = calculationResult;
    if (!result) {
      result = calculatePromo(formData);
      if (!result) {
        toast.error("Perhitungan promo gagal. Silakan periksa input.");
        return;
      }
      setCalculationResult(result);
    }

    await savePromoMutation.mutateAsync(formData);
  };

  // ✅ Handler untuk tombol kalkulasi
  const handleCalculate = () => {
    setIsCalculating(true);
    const result = calculatePromo(formData);
    if (!result) {
      setIsCalculating(false);
      toast.error("Perhitungan promo gagal. Silakan periksa input.");
      return;
    }
    setCalculationResult(result);
    setIsCalculating(false);
    toast.success("Perhitungan promo selesai!");
  };

  const isLoading = promoQuery.isLoading || savePromoMutation.isPending;

  // ✅ Tampilkan loading state jika perlu
  if (isEditMode && promoQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t border-b border-orange-500"></div>
      </div>
    );
  }

  // ✅ Tampilkan error state jika perlu
  if (isEditMode && promoQuery.isError) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Gagal Memuat Data Promo
            </h2>
            <p className="text-gray-600 mb-4">
              {promoQuery.error?.message || 'Terjadi kesalahan saat memuat data promo untuk diedit.'}
            </p>
            <Button onClick={() => navigate('/promo/list')} variant="outline">
              Kembali ke Daftar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <Button onClick={handleGoBack} variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Promo' : 'Buat Promo Baru'}
          </h1>
          <div></div> {/* Spacer untuk flex */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detail Promo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="namaPromo">Nama Promo</Label>
                  <Input
                    id="namaPromo"
                    value={formData.namaPromo}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama promo"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipePromo">Tipe Promo</Label>
                    <Select
                      value={formData.tipePromo}
                      onValueChange={(value) => handleSelectChange('tipePromo', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih tipe promo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="discount">Diskon</SelectItem>
                        <SelectItem value="bogo">Buy One Get One</SelectItem>
                        <SelectItem value="bundle">Paket Bundle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="aktif">Aktif</SelectItem>
                        <SelectItem value="nonaktif">Nonaktif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea
                    id="deskripsi"
                    value={formData.deskripsi}
                    onChange={handleInputChange}
                    placeholder="Deskripsi promo (opsional)"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tanggalMulai">Tanggal Mulai</Label>
                    <Input
                      id="tanggalMulai"
                      type="date"
                      value={formData.tanggalMulai}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="tanggalSelesai">Tanggal Selesai</Label>
                    <Input
                      id="tanggalSelesai"
                      type="date"
                      value={formData.tanggalSelesai}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Field spesifik berdasarkan tipe promo - contoh untuk 'discount' */}
                {formData.tipePromo === 'discount' && (
                  <div>
                    <Label htmlFor="nilaiDiskon">Nilai Diskon (%)</Label>
                    <Input
                      id="nilaiDiskon"
                      type="number"
                      value={formData.nilaiDiskon}
                      onChange={handleInputChange}
                      placeholder="Masukkan persentase diskon"
                    />
                  </div>
                )}

                {/* Field spesifik berdasarkan tipe promo - contoh untuk 'bogo' */}
                {formData.tipePromo === 'bogo' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="resepUtama">Resep Utama</Label>
                      <Input
                        id="resepUtama"
                        value={formData.resepUtama}
                        onChange={handleInputChange}
                        placeholder="ID atau nama resep utama"
                      />
                    </div>
                    <div>
                      <Label htmlFor="resepGratis">Resep Gratis</Label>
                      <Input
                        id="resepGratis"
                        value={formData.resepGratis}
                        onChange={handleInputChange}
                        placeholder="ID atau nama resep gratis"
                      />
                    </div>
                  </div>
                )}

                {/* Tambahkan field lainnya sesuai kebutuhan untuk tipe 'bundle' dll. */}
              </CardContent>
            </Card>

            {/* Hasil Kalkulasi */}
            {calculationResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Hasil Kalkulasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Harga Jual Akhir:</p>
                      <p className="font-semibold text-gray-900">
                        {/* Format currency jika ada utilitas */}
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(calculationResult.finalPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Margin Promo:</p>
                      <p className={`font-semibold ${
                        calculationResult.promoMargin < 5 ? 'text-red-600' :
                        calculationResult.promoMargin >= 10 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {calculationResult.promoMargin.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Hemat Customer:</p>
                      <p className="font-semibold text-green-600">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(calculationResult.savings)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Profit:</p>
                      <p className={`font-semibold ${
                        calculationResult.profit > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(calculationResult.profit)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Aksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full"
                  onClick={handleCalculate}
                  disabled={isCalculating}
                >
                  {isCalculating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Menghitung...
                    </>
                  ) : (
                    'Hitung Promo'
                  )}
                </Button>
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Promo
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoFullCalculator;