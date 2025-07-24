// PromoCalculatorPage.tsx - Main Page Component

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calculator, History, BarChart3, Settings, Menu, X, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

// Import components
import {
  ProductSelection,
  PromoConfiguration,
  CalculationResults,
  PromoHistoryTable,
  PaginationControls,
  LoadingSpinner,
  ErrorState,
  EmptyState
} from '@/components/promo';

// Import hooks and utilities
import {
  usePromoState,
  usePagination,
  useSelection,
  useLocalStorage,
  useToggle,
  useDebounce
} from '@/hooks';

import {
  calculatePromoResult,
  formatCurrency,
  formatDate,
  PROMO_TYPES
} from '@/utils';

// Import types
import {
  Recipe,
  PromoEstimation,
  CalculationResult,
  PromoType,
  LoadingState
} from '@/types';

// 🎯 Main Page Component
const PromoCalculatorPage: React.FC = () => {
  // 📊 State management
  const [activeTab, setActiveTab] = useLocalStorage<'calculator' | 'history' | 'analytics'>('promo_active_tab', 'calculator');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useToggle(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [estimations, setEstimations] = useState<PromoEstimation[]>([]);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  
  // 🔄 Loading states
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    isCalculating: false,
    isSaving: false,
    isDeleting: false,
    error: null
  });

  // 📝 Form state using custom hook
  const {
    formState,
    updateFormState,
    resetForm,
    errors,
    isValid,
    saveToLocalStorage,
    loadFromLocalStorage
  } = usePromoState();

  // 📄 Pagination for history
  const {
    paginatedData,
    goToPage,
    setItemsPerPage
  } = usePagination(estimations, {
    initialItemsPerPage: 5,
    enableUrlSync: true,
    storageKey: 'promo_history_pagination'
  });

  // ✅ Selection for bulk operations
  const {
    selection,
    toggleItem,
    toggleAll,
    clearSelection
  } = useSelection<string>({
    enableSelectAll: true,
    storageKey: 'promo_history_selection'
  });

  // 🔍 Debounced calculation
  const debouncedFormState = useDebounce(formState, 300);

  // 🎯 Mock data - replace with API calls
  const mockRecipes: Recipe[] = useMemo(() => [
    {
      id: '1',
      namaResep: 'Nasi Gudeg Komplit',
      hppPerPorsi: 8000,
      hargaJualPorsi: 15000,
      kategori: 'Makanan Utama',
      isActive: true,
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      namaResep: 'Ayam Bakar Bumbu Rujak', 
      hppPerPorsi: 12000,
      hargaJualPorsi: 25000,
      kategori: 'Makanan Utama',
      isActive: true,
      createdAt: '2024-01-16T10:00:00Z'
    },
    {
      id: '3',
      namaResep: 'Es Teh Manis',
      hppPerPorsi: 2000,
      hargaJualPorsi: 5000,
      kategori: 'Minuman',
      isActive: true,
      createdAt: '2024-01-17T10:00:00Z'
    },
    {
      id: '4',
      namaResep: 'Soto Ayam Lamongan',
      hppPerPorsi: 9000,
      hargaJualPorsi: 18000,
      kategori: 'Makanan Utama',
      isActive: true,
      createdAt: '2024-01-18T10:00:00Z'
    },
    {
      id: '5',
      namaResep: 'Kopi Tubruk',
      hppPerPorsi: 3000,
      hargaJualPorsi: 8000,
      kategori: 'Minuman',
      isActive: true,
      createdAt: '2024-01-19T10:00:00Z'
    }
  ], []);

  // 🚀 Initialize data
  useEffect(() => {
    const initializeData = async () => {
      setLoadingState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setRecipes(mockRecipes);
        
        // Load saved form state
        loadFromLocalStorage();
        
        // Load saved estimations
        const savedEstimations = localStorage.getItem('promo_estimations');
        if (savedEstimations) {
          setEstimations(JSON.parse(savedEstimations));
        }
        
        setLoadingState(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        setLoadingState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: 'Gagal memuat data. Silakan refresh halaman.' 
        }));
      }
    };

    initializeData();
  }, [mockRecipes, loadFromLocalStorage]);

  // 🧮 Auto-calculate when form changes
  useEffect(() => {
    if (debouncedFormState.selectedRecipeId && isValid) {
      const selectedRecipe = recipes.find(r => r.id === debouncedFormState.selectedRecipeId);
      
      if (selectedRecipe) {
        setLoadingState(prev => ({ ...prev, isCalculating: true }));
        
        // Simulate calculation delay
        setTimeout(() => {
          const result = calculatePromoResult({
            originalPrice: selectedRecipe.hargaJualPorsi,
            originalHpp: selectedRecipe.hppPerPorsi,
            promoType: debouncedFormState.promoType,
            discountValue: debouncedFormState.discountValue,
            bogoBuy: debouncedFormState.bogoBuy,
            bogoGet: debouncedFormState.bogoGet
          });
          
          setCalculationResult(result);
          setLoadingState(prev => ({ ...prev, isCalculating: false }));
        }, 500);
      }
    } else {
      setCalculationResult(null);
    }
  }, [debouncedFormState, recipes, isValid]);

  // 💾 Save promo estimation
  const handleSavePromo = useCallback(async () => {
    if (!calculationResult || !formState.promoName.trim()) {
      toast.error('Lengkapi nama promo sebelum menyimpan');
      return;
    }

    const selectedRecipe = recipes.find(r => r.id === formState.selectedRecipeId);
    if (!selectedRecipe) {
      toast.error('Produk tidak ditemukan');
      return;
    }

    setLoadingState(prev => ({ ...prev, isSaving: true }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newEstimation: PromoEstimation = {
        id: `est_${Date.now()}`,
        promo_name: formState.promoName.trim(),
        promo_type: formState.promoType,
        base_recipe_id: selectedRecipe.id,
        base_recipe_name: selectedRecipe.namaResep,
        promo_details: {
          type: formState.promoType,
          ...(formState.promoType === 'discount_percent' ? { value: formState.discountValue } :
             formState.promoType === 'discount_rp' ? { value: formState.discountValue } :
             { buy: formState.bogoBuy, get: formState.bogoGet })
        } as any,
        original_price: selectedRecipe.hargaJualPorsi,
        original_hpp: selectedRecipe.hppPerPorsi,
        promo_price_effective: calculationResult.price,
        estimated_margin_percent: calculationResult.marginPercent,
        estimated_margin_rp: calculationResult.marginRp,
        created_at: new Date().toISOString(),
        version: 1
      };

      const updatedEstimations = [newEstimation, ...estimations];
      setEstimations(updatedEstimations);
      
      // Save to localStorage
      localStorage.setItem('promo_estimations', JSON.stringify(updatedEstimations));
      
      toast.success('Promo berhasil disimpan!');
      
      // Reset form
      resetForm();
      setCalculationResult(null);
      
      // Switch to history tab
      setActiveTab('history');
      
      setLoadingState(prev => ({ ...prev, isSaving: false }));
    } catch (error) {
      setLoadingState(prev => ({ ...prev, isSaving: false }));
      toast.error('Gagal menyimpan promo. Silakan coba lagi.');
    }
  }, [calculationResult, formState, recipes, estimations, resetForm, setActiveTab]);

  // 🗑️ Delete estimations
  const handleDeleteEstimations = useCallback(async (ids: string[]) => {
    setLoadingState(prev => ({ ...prev, isDeleting: true }));

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      const updatedEstimations = estimations.filter(est => !ids.includes(est.id));
      setEstimations(updatedEstimations);
      
      // Save to localStorage
      localStorage.setItem('promo_estimations', JSON.stringify(updatedEstimations));
      
      clearSelection();
      toast.success(`${ids.length} promo berhasil dihapus`);
      
      setLoadingState(prev => ({ ...prev, isDeleting: false }));
    } catch (error) {
      setLoadingState(prev => ({ ...prev, isDeleting: false }));
      toast.error('Gagal menghapus promo. Silakan coba lagi.');
    }
  }, [estimations, clearSelection]);

  // 🔄 Refresh data
  const handleRefresh = useCallback(async () => {
    setLoadingState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reload estimations from localStorage
      const savedEstimations = localStorage.getItem('promo_estimations');
      if (savedEstimations) {
        setEstimations(JSON.parse(savedEstimations));
      }
      
      setLoadingState(prev => ({ ...prev, isLoading: false }));
      toast.success('Data berhasil diperbarui');
    } catch (error) {
      setLoadingState(prev => ({ ...prev, isLoading: false }));
      toast.error('Gagal memperbarui data');
    }
  }, []);

  // 🎯 Navigation tabs
  const navigationTabs = [
    {
      id: 'calculator' as const,
      label: 'Kalkulator',
      icon: Calculator,
      description: 'Hitung promo dan margin'
    },
    {
      id: 'history' as const,
      label: 'Riwayat',
      icon: History,
      description: 'Lihat riwayat promo'
    },
    {
      id: 'analytics' as const,
      label: 'Analisis',
      icon: BarChart3,
      description: 'Analisis performa promo'
    }
  ];

  // 🎨 Render loading state
  if (loadingState.isLoading && recipes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <LoadingSpinner size="xl" text="Memuat aplikasi..." />
      </div>
    );
  }

  // 🚨 Render error state
  if (loadingState.error && recipes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <ErrorState
          type="server"
          title="Gagal Memuat Aplikasi"
          message={loadingState.error}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Promo Calculator
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  Hitung margin dan kelola promo dengan mudah
                </p>
              </div>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'bg-orange-100 text-orange-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={loadingState.isLoading}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 ${loadingState.isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Mobile menu button */}
              <button
                onClick={setIsMobileMenuOpen.toggle}
                className="md:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen.value ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen.value && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-1">
              {navigationTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen.setFalse();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                  `}
                >
                  <tab.icon className="h-4 w-4" />
                  <div className="text-left">
                    <div>{tab.label}</div>
                    <div className="text-xs text-gray-500">{tab.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'calculator' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Panel - Configuration */}
            <div className="space-y-6">
              {/* Product Selection */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <ProductSelection
                  recipes={recipes}
                  selectedRecipeId={formState.selectedRecipeId}
                  onRecipeSelect={(recipeId) => updateFormState({ selectedRecipeId: recipeId })}
                  loading={loadingState.isLoading}
                />
              </div>

              {/* Promo Configuration */}
              {formState.selectedRecipeId && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <PromoConfiguration
                    promoType={formState.promoType}
                    discountValue={formState.discountValue}
                    bogoBuy={formState.bogoBuy}
                    bogoGet={formState.bogoGet}
                    onPromoTypeChange={(type) => updateFormState({ promoType: type })}
                    onDiscountValueChange={(value) => updateFormState({ discountValue: value })}
                    onBOGOChange={(buy, get) => updateFormState({ bogoBuy: buy, bogoGet: get })}
                    disabled={loadingState.isCalculating}
                  />
                </div>
              )}
            </div>

            {/* Right Panel - Results */}
            <div className="space-y-6">
              {calculationResult ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <CalculationResults
                    result={calculationResult}
                    recipe={recipes.find(r => r.id === formState.selectedRecipeId) || null}
                    promoName={formState.promoName}
                    onPromoNameChange={(name) => updateFormState({ promoName: name })}
                    onSave={handleSavePromo}
                    isSaving={loadingState.isSaving}
                    showBreakdown={true}
                    showWarnings={true}
                  />
                </div>
              ) : formState.selectedRecipeId ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  {loadingState.isCalculating ? (
                    <LoadingSpinner size="lg" text="Menghitung promo..." />
                  ) : (
                    <EmptyState
                      icon={<Calculator className="h-12 w-12 text-gray-300" />}
                      title="Siap untuk dihitung"
                      description="Lengkapi konfigurasi promo untuk melihat hasil kalkulasi"
                    />
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <EmptyState
                    icon={<Calculator className="h-12 w-12 text-gray-300" />}
                    title="Pilih produk terlebih dahulu"
                    description="Pilih produk dari panel kiri untuk memulai kalkulasi promo"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <PromoHistoryTable
                estimations={paginatedData.items}
                selectedItems={selection}
                onSelectionChange={(newSelection) => {
                  newSelection.selectedItems.forEach(id => toggleItem(id));
                }}
                onDelete={handleDeleteEstimations}
                loading={loadingState.isDeleting}
              />
              
              {estimations.length > 0 && (
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <PaginationControls
                    pagination={paginatedData.pagination}
                    onPageChange={goToPage}
                    disabled={loadingState.isDeleting}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <EmptyState
              icon={<BarChart3 className="h-12 w-12 text-gray-300" />}
              title="Analisis Promo"
              description="Fitur analisis akan segera hadir untuk membantu Anda mengoptimalkan strategi promo"
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default PromoCalculatorPage;