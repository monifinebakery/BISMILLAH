// src/pages/PromoCalculator.jsx - Fixed and Aligned with existing structure

import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Save
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { logger } from '@/utils/logger';

// ✅ Import existing components
import PromoTypeSelector from '@/components/promoCalculator/calculator/PromoTypeSelector';
import PromoPreview from '@/components/promoCalculator/calculator/PromoPreview';
import { usePromoCalculation } from '@/components/promoCalculator/hooks/usePromoCalculation';

// ✅ Import services (aligned with existing)
import { recipeApi } from '@/components/recipe/services/recipeApi';
import { promoService } from '@/components/promoCalculator/services/promoService';

// ✅ Query Keys (aligned with existing)
const RECIPE_QUERY_KEYS = {
  all: ['recipes'],
  lists: () => [...RECIPE_QUERY_KEYS.all, 'list'],
  list: (filters) => [...RECIPE_QUERY_KEYS.lists(), filters],
};

const PROMO_QUERY_KEYS = {
  all: ['promos'],
  lists: () => [...PROMO_QUERY_KEYS.all, 'list'],
  list: (params) => [...PROMO_QUERY_KEYS.lists(), params],
  detail: (id) => [...PROMO_QUERY_KEYS.all, 'detail', id],
};

const PromoCalculator = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile(768);
  
  // ✅ Check for edit mode from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const editPromoId = urlParams.get('edit');
  const isEditMode = !!editPromoId;
  
  // ✅ State management
  const [view, setView] = useState(isEditMode ? 'create' : 'dashboard'); // 'dashboard' | 'create'
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);

  // ✅ Fetch recipes for forms
  const recipesQuery = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      logger.debug('Fetching recipes for promo calculator...');
      const recipes = await recipeApi.getRecipes();
      logger.success('Recipes loaded for promo calculator:', recipes?.length || 0);
      return recipes || [];
    },
    staleTime: 10 * 60 * 1000,
    retry: 3,
    enabled: view === 'create', // Only fetch when in create mode
  });

  // ✅ Fetch latest promos for dashboard
  const latestPromosQuery = useQuery({
    queryKey: PROMO_QUERY_KEYS.list({ limit: 3 }),
    queryFn: async () => {
      const promos = await promoService.getAll({});
      const latestPromos = (promos || []).slice(0, 3);
      logger.success('Latest promos loaded:', { count: latestPromos.length });
      return latestPromos;
    },
    staleTime: 2 * 60 * 1000,
    retry: 2,
    enabled: view === 'dashboard',
  });

  // ✅ Fetch promo for editing
  const editPromoQuery = useQuery({
    queryKey: PROMO_QUERY_KEYS.detail(editPromoId),
    queryFn: async () => {
      if (!editPromoId) return null;
      logger.component('PromoCalculator', 'Fetching promo for editing:', editPromoId);
      const promo = await promoService.getById(editPromoId);
      logger.success('Promo loaded for editing:', { id: promo?.id, name: promo?.namaPromo });
      return promo;
    },
    enabled: !!editPromoId,
    onSuccess: (promo) => {
      if (promo) {
        setEditingPromo(promo);
        setSelectedType(promo.tipePromo);
        setFormData(promo.dataPromo || {});
        setView('create');
      }
    },
  });

  // ✅ Calculation hook
  const { 
    calculationResult, 
    isCalculating, 
    calculationError, 
    calculatePromo, 
    clearCalculation 
  } = usePromoCalculation();

  // ✅ Save promo mutation
  const savePromoMutation = useMutation({
    mutationFn: async (promoData) => {
      if (isEditMode && editPromoId) {
        logger.component('PromoCalculator', 'Updating existing promo:', editPromoId);
        return await promoService.update(editPromoId, promoData);
      } else {
        logger.component('PromoCalculator', 'Creating new promo');
        return await promoService.create(promoData);
      }
    },
    onSuccess: (savedPromo) => {
      const action = isEditMode ? 'diperbarui' : 'disimpan';
      toast.success(`Promo berhasil ${action}!`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
      
      // Navigate back to dashboard or promo list
      if (isEditMode) {
        // Go back to promo list after edit
        navigate('/promo/list');
      } else {
        // Stay on dashboard after create
        handleBackToDashboard();
      }
    },
    onError: (error) => {
      logger.error('Save promo error:', error);
      const action = isEditMode ? 'memperbarui' : 'menyimpan';
      toast.error(`Gagal ${action} promo: ${error.message}`);
    },
  });

  // ✅ Handlers
  const handleStartCreate = () => {
    navigate('/promo/create');
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setSelectedType('');
    setFormData({});
    setEditingPromo(null);
    setShowPreview(false);
    clearCalculation();
    // Clear URL params
    window.history.replaceState({}, '', '/promo');
  };

  const handleTypeChange = (type) => {
    setSelectedType(type);
    setFormData({});
    clearCalculation();
  };

  const handleFormSubmit = async (data) => {
    try {
      logger.component('PromoCalculator', 'Form submitted with data:', data);
      
      // Calculate promo if not already calculated
      if (!calculationResult) {
        const result = await calculatePromo(selectedType, data);
        setFormData({ ...data, calculationResult: result });
      } else {
        setFormData({ ...data, calculationResult });
      }
      
      // Auto show preview on mobile after calculation
      if (isMobile) {
        setShowPreview(true);
      }
      
      toast.success('Perhitungan promo berhasil!');
    } catch (error) {
      logger.error('Form submission error:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleSavePromo = async () => {
    if (!calculationResult) {
      toast.error('Lakukan perhitungan terlebih dahulu');
      return;
    }

    if (!formData.namaPromo) {
      toast.error('Nama promo wajib diisi');
      return;
    }

    const promoDataToSave = {
      namaPromo: formData.namaPromo,
      tipePromo: selectedType,
      status: formData.status || 'draft',
      dataPromo: formData,
      calculationResult: calculationResult,
      deskripsi: formData.deskripsi || '',
      tanggalMulai: formData.tanggalMulai || null,
      tanggalSelesai: formData.tanggalSelesai || null,
    };

    logger.context('PromoCalculator', 'Saving promo data:', promoDataToSave);
    await savePromoMutation.mutateAsync(promoDataToSave);
  };

  const handleViewAllPromos = () => {
    navigate('/promo/list');
  };

  const handleRefreshDashboard = () => {
    logger.context('PromoCalculator', 'Refreshing dashboard...');
    queryClient.invalidateQueries({ queryKey: PROMO_QUERY_KEYS.all });
    queryClient.invalidateQueries({ queryKey: ['recipes'] });
    toast.info('Merefresh data...');
  };

  // ✅ Loading states
  const isLoading = recipesQuery.isLoading || latestPromosQuery.isLoading || editPromoQuery.isLoading;
  const isProcessing = savePromoMutation.isPending || isCalculating;

  // ✅ Error states
  if (recipesQuery.isError && view === 'create') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border border-gray-200">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Gagal Memuat Resep</h2>
            <p className="text-gray-600 mb-4">
              Tidak dapat memuat data resep yang diperlukan untuk membuat promo.
            </p>
            <div className="space-y-3">
              <Button onClick={() => recipesQuery.refetch()} className="w-full bg-orange-500 hover:bg-orange-600">
                <RefreshCw className="h-4 w-4 mr-2" />
                Coba Lagi
              </Button>
              <Button onClick={handleBackToDashboard} variant="outline" className="w-full">
                Kembali ke Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {view === 'create' ? 'Memuat data resep...' : 'Memuat dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  // ✅ Create/Edit Mode
  if (view === 'create') {
    const recipes = recipesQuery.data || [];

    // Mobile Layout for Create Mode
    if (isMobile) {
      return (
        <div className="min-h-screen bg-gray-50">
          {/* Mobile Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <Button onClick={handleBackToDashboard} variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">
                {isEditMode ? 'Edit Promo' : 'Buat Promo'}
              </h1>
              {calculationResult && !showPreview && (
                <Button onClick={() => setShowPreview(true)} variant="ghost" size="sm">
                  Preview
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Content */}
          <div className="p-4">
            {!showPreview ? (
              <PromoTypeSelector
                selectedType={selectedType}
                onTypeChange={handleTypeChange}
                onFormSubmit={handleFormSubmit}
                isCalculating={isProcessing}
                recipes={recipes}
                initialData={editingPromo?.dataPromo}
              />
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="ghost"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali ke Form
                </Button>
                <PromoPreview 
                  type={selectedType}
                  data={{ calculationResult }}
                  onSave={handleSavePromo}
                  isLoading={isProcessing}
                />
              </div>
            )}
          </div>

          {/* Mobile Bottom Actions */}
          {calculationResult && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setShowPreview(!showPreview)}
                  variant="outline"
                  disabled={isProcessing}
                >
                  {showPreview ? 'Edit' : 'Preview'}
                </Button>
                <Button
                  onClick={handleSavePromo}
                  disabled={isProcessing}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Simpan
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Desktop Layout for Create Mode
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button onClick={handleBackToDashboard} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Promo' : 'Buat Promo Baru'}
            </h1>
            <div></div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="xl:col-span-2">
              <Card className="border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-orange-600" />
                    Konfigurasi Promo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PromoTypeSelector
                    selectedType={selectedType}
                    onTypeChange={handleTypeChange}
                    onFormSubmit={handleFormSubmit}
                    isCalculating={isProcessing}
                    recipes={recipes}
                    initialData={editingPromo?.dataPromo}
                  />
                </CardContent>
              </Card>
            </div>
            
            {/* Preview Section */}
            <div className="xl:col-span-1">
              <div className="sticky top-6">
                <PromoPreview 
                  type={selectedType}
                  data={{ calculationResult }}
                  onSave={handleSavePromo}
                  isLoading={isProcessing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Dashboard Mode
  const promos = latestPromosQuery.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kalkulator Promo</h1>
            <p className="text-gray-600 mt-1">
              Hitung profit margin dan dampak promo dengan akurat
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
              Buat Promo
            </Button>
          </div>
        </div>

        {/* Main Dashboard Card */}
        <Card className="border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Promo Terbaru</span>
              <Button variant="link" onClick={handleViewAllPromos} className="text-orange-600 hover:text-orange-700 p-0 h-auto">
                Lihat Semua
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {promos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {promos.map(promo => (
                  <div key={promo.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{promo.namaPromo}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        promo.status === 'aktif' ? 'bg-green-100 text-green-800' :
                        promo.status === 'nonaktif' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {promo.status}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tipe:</span>
                        <span className="font-medium capitalize">{promo.tipePromo}</span>
                      </div>
                      {promo.calculationResult && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Margin:</span>
                          <span className={`font-medium ${
                            (promo.calculationResult.promoMargin || 0) > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {(promo.calculationResult.promoMargin || 0).toFixed(1)}%
                          </span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500 pt-2 border-t">
                        Dibuat: {new Date(promo.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Promo</h3>
                <p className="text-gray-500 mb-6">Buat promo pertama Anda untuk melihatnya di sini.</p>
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