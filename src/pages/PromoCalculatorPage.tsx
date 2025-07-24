// pages/PromoCalculator.tsx
import React, { Suspense, lazy } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useRecipe } from '@/contexts/RecipeContext';
import { usePromo } from '@/contexts/PromoContext';
import { usePromoCalculator } from '@/hooks/usePromoCalculator';
import PromoHeader from '@/components/promo/PromoHeader';

// 🚀 Lazy load heavy components
const ProductSelectionCard = lazy(() => import('@/components/promo/ProductSelectionCard'));
const PromoConfigurationCard = lazy(() => import('@/components/promo/PromoConfigurationCard'));
const ResultsCard = lazy(() => import('@/components/promo/ResultsCard'));
const PromoHistoryTable = lazy(() => import('@/components/promo/PromoHistoryTable'));

// 📦 Loading Component
const SectionLoader: React.FC<{ height?: string; message?: string }> = ({ 
  height = "h-64", 
  message = "Memuat..." 
}) => (
  <div className={`${height} bg-white/90 rounded-lg shadow-md animate-pulse flex items-center justify-center`}>
    <div className="flex items-center space-x-3">
      <Loader2 className="animate-spin h-5 w-5 text-orange-500" />
      <span className="text-gray-600">{message}</span>
    </div>
  </div>
);

const PromoCalculatorPage: React.FC = () => {
  // 🔗 Context validation
  const recipeContext = useRecipe();
  const promoContext = usePromo();

  // 🎛️ Main hook for calculator logic
  const calculatorProps = usePromoCalculator(recipeContext, promoContext);

  // ⚠️ Error boundary for missing contexts
  if (!recipeContext || !promoContext) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Context Error</h2>
          <p className="text-gray-600">
            Recipe atau Promo Context tidak tersedia. Pastikan komponen ini dibungkus dengan provider yang sesuai.
          </p>
        </div>
      </div>
    );
  }

  // 🔄 Loading state
  if (calculatorProps.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Memuat data promo calculator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 p-4 sm:p-6">
      {/* 🏠 Header - Always loaded */}
      <PromoHeader />

      {/* 📊 Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* 📦 Product Selection - High priority */}
          <Suspense fallback={<SectionLoader message="Memuat pilihan produk..." />}>
            <ProductSelectionCard
              recipes={calculatorProps.recipes}
              selectedRecipeId={calculatorProps.selectedRecipeId}
              onRecipeSelect={calculatorProps.setSelectedRecipeId}
              selectedRecipe={calculatorProps.selectedRecipe}
              originalValues={calculatorProps.originalValues}
            />
          </Suspense>

          {/* ⚙️ Promo Configuration - Medium priority */}
          <Suspense fallback={<SectionLoader message="Memuat konfigurasi promo..." />}>
            <PromoConfigurationCard
              promoType={calculatorProps.promoType}
              setPromoType={calculatorProps.setPromoType}
              discountValue={calculatorProps.discountValue}
              setDiscountValue={calculatorProps.setDiscountValue}
              bogoBuy={calculatorProps.bogoBuy}
              setBogoBuy={calculatorProps.setBogoBuy}
              bogoGet={calculatorProps.bogoGet}
              setBogoGet={calculatorProps.setBogoGet}
              selectedRecipe={calculatorProps.selectedRecipe}
            />
          </Suspense>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* 📈 Results - High priority */}
          <Suspense fallback={<SectionLoader message="Memuat hasil kalkulasi..." />}>
            <ResultsCard
              promoResult={calculatorProps.promoResult}
              promoName={calculatorProps.promoName}
              setPromoName={calculatorProps.setPromoName}
              onSave={calculatorProps.handleSave}
              isSaving={calculatorProps.isSaving}
              selectedRecipe={calculatorProps.selectedRecipe}
            />
          </Suspense>
        </div>
      </div>

      {/* 📋 History Table - Lower priority */}
      <Suspense fallback={<SectionLoader height="h-96" message="Memuat riwayat promo..." />}>
        <PromoHistoryTable
          promoHistory={calculatorProps.promoHistory}
          selectedPromos={calculatorProps.selectedPromos}
          setSelectedPromos={calculatorProps.setSelectedPromos}
          currentPage={calculatorProps.currentPage}
          onPageChange={calculatorProps.handlePageChange}
          onBulkDelete={calculatorProps.handleBulkDelete}
          paginationData={calculatorProps.paginationData}
        />
      </Suspense>
    </div>
  );
};

export default PromoCalculatorPage;