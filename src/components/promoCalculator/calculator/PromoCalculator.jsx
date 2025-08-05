// src/pages/PromoCalculator.jsx
// ✅ Updated to integrate PromoTypeSelector directly for creating new promos
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ For internal navigation
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  ArrowLeft,
  Calculator // Icon for header
} from 'lucide-react';

// ✅ Import components and hooks
import PromoTypeSelector from '@/components/promoCalculator/calculator/PromoTypeSelector'; // ✅ Path might need adjustment
import PromoPreview from '@/components/promoCalculator/components/PromoPreview'; // ✅ Path might need adjustment
import { usePromoCalculation } from '@/components/promoCalculator/hooks/usePromoCalculation'; // ✅ Path might need adjustment
import { recipeApi } from '@/components/recipe/services/recipeApi'; // ✅ Import recipeApi
import { promoService } from '@/components/promoCalculator/services/promoService'; // ✅ Import promoService

// ✅ Use the same query keys from recipe system for consistency
export const RECIPE_QUERY_KEYS = {
  all: ['recipes'],
  lists: () => [...RECIPE_QUERY_KEYS.all, 'list'],
  list: (filters) => [...RECIPE_QUERY_KEYS.lists(), filters],
};

// ✅ Promo Query Keys
const PROMO_QUERY_KEYS = {
  all: ['promos'],
  lists: () => [...PROMO_QUERY_KEYS.all, 'list'],
  list: (params) => [...PROMO_QUERY_KEYS.lists(), params],
};

const PromoCalculator = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // ✅ State for managing view modes
  const [isCreating, setIsCreating] = useState(false); // ✅ New state for creation mode
  const [selectedType, setSelectedType] = useState(''); // ✅ State for selected promo type

  // ✅ State for form data and preview (if needed for dashboard mode or preview step)
  const [formData, setFormData] = useState({});
  const [showPreview, setShowPreview] = useState(false); // For potential preview step within creation

  // ✅ Fetch recipes for PromoTypeSelector forms
  const { data: recipes = [], isLoading: isRecipesLoading, isError: isRecipesError, refetch: refetchRecipes } = useQuery({
    queryKey: RECIPE_QUERY_KEYS.list(),
    queryFn: recipeApi.getAllRecipes,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isCreating // ✅ Only fetch recipes when in creation mode
  });

  // ✅ Fetch latest promos for dashboard view
  const latestPromosQuery = useQuery({
    queryKey: PROMO_QUERY_KEYS.list({ limit: 3 }),
    queryFn: async () => {
      const allPromos = await promoService.getAll({});
      return (allPromos || []).slice(0, 3);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
    enabled: !isCreating // ✅ Only fetch when NOT in creation mode
  });

  // ✅ Hook for promo calculation logic
  const { calculationResult, isCalculating, calculationError, calculatePromo, clearCalculation } = usePromoCalculation();

  // ✅ Mutation for saving a new promo
  const savePromoMutation = useMutation({
    mutationFn: promoService.create,
    onSuccess: (data) => {
      toast.success('Promo berhasil disimpan!');
      // Invalidate and refetch promos list
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      // ✅ Reset creation state
      handleCancelCreate(); // Go back to dashboard view
    },
    onError: (error) => {
      console.error('Save promo error:', error);
      toast.error(`Gagal menyimpan promo: ${error.message}`);
    },
  });

  // --- Handlers for Dashboard View ---
  const handleRefreshDashboard = () => {
    latestPromosQuery.refetch();
    // Also refresh recipe cache if needed
    queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });
    toast.info('Merefresh data...');
  };

  const handleViewAll = () => {
    navigate('/promo/list'); // ✅ Navigate to full list
  };

  // --- Handlers for Creation Mode ---
  const handleStartCreate = () => {
    setIsCreating(true);
    setSelectedType(''); // Reset type
    setFormData({}); // Reset form data
    clearCalculation(); // Reset calculation result
    // Recipes will be fetched automatically due to `enabled: isCreating` in useQuery
  };

  const handleCancelCreate = () => {
    // Simple confirmation or just reset state
    // if (window.confirm("Perubahan yang belum disimpan akan hilang. Lanjutkan?")) {
      setIsCreating(false);
      setSelectedType('');
      setFormData({});
      clearCalculation();
    // }
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    clearCalculation(); // Reset calculation when type changes
  };

  const handleFormSubmit = async (data) => {
    try {
      console.log('Form submitted with data:', data);
      // Assume calculatePromo is called within the specific form components (BogoForm, etc.)
      // and sets the calculationResult in the usePromoCalculation hook.
      // If you want to trigger it here based on `data`, you can, but it's likely handled by the form.
      
      // For now, we assume the form handles calculation internally and we proceed to save.
      // You might want to check if calculationResult exists before saving.
      
      if (!data.namaPromo) {
         toast.error('Nama promo wajib diisi');
         return;
      }
      
      // Prepare promo data for saving
      const promoDataToSave = {
        namaPromo: data.namaPromo,
        tipePromo: selectedType,
        status: data.status || 'draft',
        dataPromo: data,
        calculationResult: calculationResult, // This should be set by the form's internal calculation
        deskripsi: data.deskripsi || '',
        tanggalMulai: data.tanggalMulai || null,
        tanggalSelesai: data.tanggalSelesai || null,
      };

      console.log('Saving promo data:', promoDataToSave);
      await savePromoMutation.mutateAsync(promoDataToSave);
    } catch (error) {
      console.error('Form submission or save error:', error);
      toast.error(`Error: ${error.message || 'Terjadi kesalahan saat menyimpan promo.'}`);
    }
  };

  // --- Render States ---

  // ✅ Loading State for Recipes (when creating)
  if (isRecipesLoading && isCreating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data resep untuk form promo...</p>
        </div>
      </div>
    );
  }

  // ✅ Error State for Recipes (when creating)
  if (isRecipesError && isCreating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Gagal Memuat Resep</h2>
            <p className="text-gray-600 mb-4">
              Tidak dapat memuat data resep yang diperlukan untuk membuat promo.
            </p>
            <Button onClick={() => refetchRecipes()} className="w-full bg-orange-500 hover:bg-orange-600">
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Loading State for Promos (dashboard)
  if (latestPromosQuery.isLoading && !isCreating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat promo terbaru...</p>
        </div>
      </div>
    );
  }

  // --- Main Render Logic ---

  // ✅ Creation Mode View
  if (isCreating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto p-4 sm:p-6">
          {/* Header with back button */}
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
              <PromoTypeSelector
                selectedType={selectedType}
                onTypeChange={handleTypeChange}
                onFormSubmit={handleFormSubmit}
                isCalculating={isCalculating || savePromoMutation.isPending}
                recipes={recipes}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // --- Dashboard View (Default) ---
  const promos = latestPromosQuery.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
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
              onClick={handleStartCreate} // ✅ Use the new handler
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Promo Baru
            </Button>
          </div>
        </div>

        {/* Main Content Card - Dashboard Promo Terbaru */}
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
            {promos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promos.map(promo => (
                  // Placeholder for PromoCard rendering logic
                  // You would typically import and use PromoCard here
                  // <PromoCard key={promo.id} promo={promo} ... />
                  <div key={promo.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <h3 className="font-semibold">{promo.namaPromo}</h3>
                    <p className="text-sm text-gray-600">{promo.tipePromo} - {promo.status}</p>
                    <p className="text-xs text-gray-500 mt-2">Dibuat: {new Date(promo.createdAt).toLocaleDateString('id-ID')}</p>
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