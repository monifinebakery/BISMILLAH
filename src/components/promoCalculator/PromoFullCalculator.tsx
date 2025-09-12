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

interface PromoFormData {
  namaPromo: string;
  tipePromo: string;
  status: string;
  deskripsi: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  hargaProduk: string;
  hpp: string;
  nilaiDiskon: string;
  resepUtama: string;
  resepGratis: string;
  beli: string;
  gratis: string;
  hargaNormal: string;
  hargaBundle: string;
}

const calculatePromo = (data: PromoFormData): PromoCalculationResult | null => {
  try {
    const { tipePromo, hargaProduk, hpp } = data;
    
    // Validasi input dasar
    if (!hargaProduk || !hpp) {
      throw new Error('Harga produk dan HPP harus diisi');
    }

    const harga = parseFloat(hargaProduk);
    const hppValue = parseFloat(hpp);
    
    if (isNaN(harga) || isNaN(hppValue) || harga <= 0 || hppValue <= 0) {
      throw new Error('Harga produk dan HPP harus berupa angka positif');
    }

    let finalPrice = harga;
    let savings = 0;
    let promoMargin = 0;
    let profit = 0;

    switch (tipePromo) {
      case 'discount':
        const { nilaiDiskon } = data;
        if (!nilaiDiskon) {
          throw new Error('Nilai diskon harus diisi untuk tipe discount');
        }
        const diskon = parseFloat(nilaiDiskon);
        if (isNaN(diskon) || diskon < 0 || diskon > 100) {
          throw new Error('Nilai diskon harus antara 0-100%');
        }
        
        finalPrice = harga * (1 - diskon / 100);
        savings = harga - finalPrice;
        promoMargin = (savings / harga) * 100;
        profit = finalPrice - hppValue;
        break;

      case 'bogo':
        const { beli, gratis } = data;
        if (!beli || !gratis) {
          throw new Error('Jumlah beli dan gratis harus diisi untuk tipe BOGO');
        }
        
        const jumlahBeli = parseInt(beli);
        const jumlahGratis = parseInt(gratis);
        
        if (isNaN(jumlahBeli) || isNaN(jumlahGratis) || jumlahBeli <= 0 || jumlahGratis <= 0) {
          throw new Error('Jumlah beli dan gratis harus berupa angka positif');
        }
        
        // Hitung harga per unit dengan BOGO
        const totalUnit = jumlahBeli + jumlahGratis;
        finalPrice = (harga * jumlahBeli) / totalUnit;
        savings = harga - finalPrice;
        promoMargin = (savings / harga) * 100;
        profit = finalPrice - hppValue;
        break;

      case 'bundle':
        const { hargaNormal, hargaBundle } = data;
        if (!hargaNormal || !hargaBundle) {
          throw new Error('Harga normal dan harga bundle harus diisi untuk tipe bundle');
        }
        
        const normalPrice = parseFloat(hargaNormal);
        const bundlePrice = parseFloat(hargaBundle);
        
        if (isNaN(normalPrice) || isNaN(bundlePrice) || normalPrice <= 0 || bundlePrice <= 0) {
          throw new Error('Harga normal dan bundle harus berupa angka positif');
        }
        
        if (bundlePrice >= normalPrice) {
          throw new Error('Harga bundle harus lebih kecil dari harga normal');
        }
        
        finalPrice = bundlePrice;
        savings = normalPrice - bundlePrice;
        promoMargin = (savings / normalPrice) * 100;
        profit = bundlePrice - hppValue;
        break;

      default:
        throw new Error('Tipe promo tidak valid');
    }

    // Validasi profit tidak boleh negatif (opsional warning)
    if (profit < 0) {
      console.warn('Peringatan: Profit negatif, promo mungkin merugikan');
    }

    return {
      finalPrice: Math.round(finalPrice * 100) / 100,
      promoMargin: Math.round(promoMargin * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      profit: Math.round(profit * 100) / 100
    };

  } catch (error) {
    console.error('Error calculating promo:', error);
    throw error; // Re-throw untuk ditangani di UI
  }
};

const PromoFullCalculator = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // Untuk mode edit
  const [searchParams] = useSearchParams(); // Untuk mode create dari query params jika diperlukan
  const queryClient = useQueryClient();
  
  const isEditMode = !!id;

  // State untuk form
  const [formData, setFormData] = useState<PromoFormData>({
    namaPromo: '',
    tipePromo: 'discount', // Default
    status: 'draft',
    deskripsi: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    // Field untuk kalkulasi
    hargaProduk: '', // Harga asli produk
    hpp: '', // Harga Pokok Penjualan
    nilaiDiskon: '', // Untuk tipe 'discount'
    resepUtama: '',  // Untuk tipe 'bogo'
    resepGratis: '', // Untuk tipe 'bogo'
    beli: '1', // Untuk tipe 'bogo' - jumlah beli
    gratis: '1', // Untuk tipe 'bogo' - jumlah gratis
    hargaNormal: '', // Untuk tipe 'bundle'
    hargaBundle: '', // Untuk tipe 'bundle'
  });

  // State untuk hasil kalkulasi
  const [calculationResult, setCalculationResult] = useState<PromoCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // ✅ Fetch promo detail jika dalam mode edit
  const promoQuery = useQuery({
    queryKey: PROMO_QUERY_KEYS.detail(id),
    queryFn: async () => {
      if (!id) return null;
      const promo = await promoService.getById(id);
      return promo;
    },
    enabled: !!id
  });

  // ✅ Effect untuk mengisi form ketika data promo berhasil di-fetch
  useEffect(() => {
    if (promoQuery.data) {
      const data = promoQuery.data;
      setFormData({
        namaPromo: data.nama_promo || '',
        tipePromo: data.tipe_promo || 'discount',
        status: data.status || 'draft',
        deskripsi: data.deskripsi || '',
        tanggalMulai: data.tanggal_mulai || '',
        tanggalSelesai: data.tanggal_selesai || '',
        hargaProduk: data.harga_produk?.toString() || '',
        hpp: data.hpp?.toString() || '',
        nilaiDiskon: data.nilai_diskon?.toString() || '',
        resepUtama: data.resep_utama || '',
        resepGratis: data.resep_gratis || '',
        beli: data.beli?.toString() || '1',
        gratis: data.gratis?.toString() || '1',
        hargaNormal: data.harga_normal?.toString() || '',
        hargaBundle: data.harga_bundle?.toString() || ''
      });
      // Jika ada hasil kalkulasi sebelumnya
      if (data.calculationResult) {
        setCalculationResult(data.calculationResult);
      }
    }
  }, [promoQuery.data]);

  // ✅ Mutation untuk menyimpan (create/update) promo
  const savePromoMutation = useMutation({
    mutationFn: async (promoData: PromoFormData) => {
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
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
    
    try {
      const result = calculatePromo(formData);
      setCalculationResult(result);
      toast.success("Promo berhasil dihitung!");
    } catch (error: any) {
      console.error("Error calculating promo:", error);
      toast.error(error.message || "Terjadi kesalahan saat menghitung promo.");
      setCalculationResult(null);
    } finally {
      setIsCalculating(false);
    }
  };

  const isLoading = promoQuery.isLoading || savePromoMutation.isPending;

  // ✅ Tampilkan loading state jika perlu
  if (isEditMode && promoQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
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

                {/* Field untuk kalkulasi harga */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hargaProduk">Harga Produk (Rp)</Label>
                    <Input
                      id="hargaProduk"
                      type="number"
                      value={formData.hargaProduk}
                      onChange={handleInputChange}
                      placeholder="Masukkan harga produk"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hpp">HPP - Harga Pokok Penjualan (Rp)</Label>
                    <Input
                      id="hpp"
                      type="number"
                      value={formData.hpp}
                      onChange={handleInputChange}
                      placeholder="Masukkan HPP"
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

                {/* Field spesifik berdasarkan tipe promo - untuk 'bogo' */}
                {formData.tipePromo === 'bogo' && (
                  <div className="space-y-4">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="beli">Jumlah Beli</Label>
                        <Input
                          id="beli"
                          type="number"
                          value={formData.beli}
                          onChange={handleInputChange}
                          placeholder="Jumlah yang harus dibeli"
                          min="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="gratis">Jumlah Gratis</Label>
                        <Input
                          id="gratis"
                          type="number"
                          value={formData.gratis}
                          onChange={handleInputChange}
                          placeholder="Jumlah yang didapat gratis"
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Field spesifik berdasarkan tipe promo - untuk 'bundle' */}
                {formData.tipePromo === 'bundle' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hargaNormal">Harga Normal (Rp)</Label>
                      <Input
                        id="hargaNormal"
                        type="number"
                        value={formData.hargaNormal}
                        onChange={handleInputChange}
                        placeholder="Harga normal tanpa bundle"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hargaBundle">Harga Bundle (Rp)</Label>
                      <Input
                        id="hargaBundle"
                        type="number"
                        value={formData.hargaBundle}
                        onChange={handleInputChange}
                        placeholder="Harga setelah bundle"
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