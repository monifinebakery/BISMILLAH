// src/pages/PromoCalculator.jsx
// ✅ Halaman utama untuk fitur promo: Dashboard dan Kalkulator
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  Calculator,
} from 'lucide-react';

// ✅ Import komponen dan layanan
// !!! PERHATIAN: Sesuaikan path ini dengan struktur folder proyek Anda !!!
import PromoTypeSelector from '@/components/promoCalculator/calculator/PromoTypeSelector'; // ✅ Sesuaikan path
import recipeApi from '@/components/recipe/services/recipeApi'; // ✅ Sesuaikan path
import { promoService } from '@/components/promoCalculator/services/promoService'; // ✅ Sesuaikan path

// ✅ Definisikan kunci query untuk konsistensi
const RECIPE_QUERY_KEYS = {
  all: ['recipes'],
  lists: () => [...RECIPE_QUERY_KEYS.all, 'list'],
  list: () => [...RECIPE_QUERY_KEYS.lists()], // ✅ Diperbaiki: tidak perlu parameter filters untuk getAllRecipes
};

const PROMO_QUERY_KEYS = {
  all: ['promos'],
  lists: () => [...PROMO_QUERY_KEYS.all, 'list'],
  list: (params) => [...PROMO_QUERY_KEYS.lists(), params],
};

const PromoCalculator = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ✅ State untuk mengelola mode tampilan
  const [isCreating, setIsCreating] = useState(false); // Mode dashboard vs mode kalkulator
  const [selectedType, setSelectedType] = useState(''); // Tipe promo yang dipilih di mode kalkulator

  // --- FETCH DATA RESEP untuk mode kalkulator ---
  // ✅ Perbaikan utama ada di sini: queryKey dan queryFn
  const {
    data: recipes = [],
    isLoading: isRecipesLoading,
    isError: isRecipesError,
    error: recipesError,
    refetch: refetchRecipes,
  } = useQuery({
    queryKey: RECIPE_QUERY_KEYS.list(), // ✅ Gunakan key yang diperbaiki
    queryFn: recipeApi.getAllRecipes,   // ✅ Gunakan fungsi secara langsung, bukan () => recipeApi.getAllRecipes()
    staleTime: 5 * 60 * 1000, // 5 menit
    cacheTime: 10 * 60 * 1000, // 10 menit
    retry: 1,
    enabled: isCreating, // Hanya fetch saat mode kalkulator aktif
    onError: (error) => {
      console.error("❌ [PromoCalculator] Gagal memuat resep:", error);
      // toast.error('Gagal memuat data resep yang diperlukan.');
    },
  });

  // --- FETCH PROMO TERBARU untuk mode dashboard ---
  const latestPromosQuery = useQuery({
    queryKey: PROMO_QUERY_KEYS.list({ limit: 3 }),
    queryFn: async () => {
      const allPromos = await promoService.getAll({});
      return (allPromos || []).slice(0, 3);
    },
    staleTime: 2 * 60 * 1000, // 2 menit
    retry: 2,
    enabled: !isCreating, // Hanya fetch saat di mode dashboard
    onError: (error) => {
      console.error("❌ [PromoCalculator] Gagal memuat promo terbaru:", error);
    },
  });

  // --- HANDLERS untuk mode dashboard ---
  const handleRefreshDashboard = () => {
    latestPromosQuery.refetch();
    toast.info('Merefresh data promo terbaru...');
  };

  const handleViewAll = () => {
    navigate('/promo/list');
  };

  // --- HANDLERS untuk mode kalkulator ---
  const handleStartCreate = () => {
    console.log("🎬 [PromoCalculator] Masuk mode buat promo baru.");
    setIsCreating(true);
    setSelectedType('');
    // Data resep akan di-fetch otomatis oleh useQuery karena `enabled: isCreating`
  };

  const handleCancelCreate = () => {
    console.log("↩️ [PromoCalculator] Keluar dari mode buat promo.");
    setIsCreating(false);
    setSelectedType('');
  };

  const handleTypeChange = (type) => {
    console.log("🔄 [PromoCalculator] Tipe promo dipilih:", type);
    setSelectedType(type);
  };

  // Placeholder handler untuk form submit dari PromoTypeSelector
  const handleFormSubmit = async (formData) => {
    console.log("📤 [PromoCalculator] Data form diterima dari selector:", formData);
    // Di sini Anda akan mengintegrasikan dengan usePromoCalculation dan savePromoMutation
    // Contoh sederhana:
    toast.info("Form diterima. Integrasi logika simpan/kalkulasi belum sepenuhnya selesai.");
    // await savePromoMutation.mutateAsync(formData);
  };

  // --- RENDERING ---

  // ✅ Mode Kalkulator Promo (saat membuat promo baru)
  if (isCreating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto p-4 sm:p-6">
          {/* Header dengan tombol kembali */}
          <div className="flex items-center justify-between mb-6">
            <Button onClick={handleCancelCreate} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Buat Promo Baru</h1>
            <div></div> {/* Spacer */}
          </div>

          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-orange-600" />
                <span>Pilih Jenis dan Konfigurasi Promo</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Loading State untuk Resep */}
              {isRecipesLoading && (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mb-2"></div>
                  <p className="text-gray-600">Memuat data resep untuk form promo...</p>
                </div>
              )}

              {/* Error State untuk Resep */}
              {isRecipesError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Gagal Memuat Resep</h3>
                      <p className="text-sm text-red-700 mt-1">
                        {/* Tampilkan pesan error yang lebih spesifik */}
                        {recipesError?.message || 'Terjadi kesalahan saat memuat data resep.'}
                      </p>
                      <Button
                        onClick={() => refetchRecipes()}
                        variant="outline"
                        size="sm"
                        className="mt-2 text-red-700 border-red-300 hover:bg-red-100"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Coba Lagi
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tampilkan PromoTypeSelector jika resep berhasil dimuat */}
              {!isRecipesLoading && !isRecipesError && (
                <PromoTypeSelector
                  selectedType={selectedType}
                  onTypeChange={handleTypeChange}
                  onFormSubmit={handleFormSubmit}
                  isCalculating={false} // Ganti dengan state kalkulasi yang sesungguhnya
                  recipes={recipes} // ✅ Kirim data resep
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- Mode Dashboard (Default) ---
  const promos = latestPromosQuery.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Dashboard */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kalkulator Promo</h1>
            <p className="text-gray-600 mt-1">
              Hitung dan kelola promo Anda
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefreshDashboard}
              disabled={latestPromosQuery.isFetching}
              className="border-gray-300"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${latestPromosQuery.isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleStartCreate}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Promo Baru
            </Button>
          </div>
        </div>

        {/* Main Content Card - Promo Terbaru */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Promo Terbaru</span>
              <Button variant="link" onClick={handleViewAll} className="text-orange-600 hover:text-orange-700 p-0 h-auto">
                Lihat Semua Promo
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestPromosQuery.isLoading && promos.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-orange-500 mr-2"></div>
                <span className="text-gray-600">Memuat promo...</span>
              </div>
            ) : latestPromosQuery.isError && promos.length === 0 ? (
              <div className="text-center py-8 text-red-500">
                <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                <p>Gagal memuat promo terbaru.</p>
                <Button onClick={handleRefreshDashboard} variant="outline" className="mt-2">
                  Coba Lagi
                </Button>
              </div>
            ) : promos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promos.map(promo => (
                  // Placeholder untuk PromoCard
                  // !!! GUNAKAN KOMPONEN ASLI PromoCard.jsx JIKA SUDAH ADA !!!
                  <div key={promo.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900 truncate">{promo.namaPromo}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        promo.status === 'aktif' ? 'bg-green-100 text-green-800' :
                        promo.status === 'nonaktif' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {promo.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{promo.tipePromo}</p>
                    {promo.calculationResult && (
                      <div className="mt-2 text-xs">
                        <p>Harga Jual: <span className="font-medium">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(promo.calculationResult.finalPrice)}</span></p>
                        <p>Margin: <span className={`font-medium ${
                          (promo.calculationResult.promoMargin || 0) < 5 ? 'text-red-600' :
                          (promo.calculationResult.promoMargin || 0) >= 10 ? 'text-yellow-600' : 'text-green-600'
                        }`}>{(promo.calculationResult.promoMargin || 0).toFixed(1)}%</span></p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-3">Dibuat: {new Date(promo.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Belum Ada Promo</h3>
                <p className="text-gray-500 mb-4">Buat promo pertama Anda untuk melihatnya di sini.</p>
                <Button onClick={handleStartCreate} className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Promo Pertama
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PromoCalculator;
