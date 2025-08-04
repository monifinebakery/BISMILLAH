// PromoCalculator.jsx - Updated sesuai struktur folder
import React, { useState, useEffect } from 'react';
import { Calculator, Save, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';
import { useRecipe } from '@/contexts/RecipeContext';
import { usePromo } from '@/components/promoCalculator/context/PromoContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

// Import components sesuai struktur folder
import PromoTypeSelector from './PromoTypeSelector';
import PromoPreview from './PromoPreview';
import { usePromoCalculation } from '../hooks/usePromoCalculation';

const PromoCalculator = ({ onBack }) => {
  const isMobile = useIsMobile(768);
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { recipes, isLoading: recipesLoading } = useRecipe();
  const { addPromo } = usePromo();
  const { 
    calculationResult, 
    isCalculating, 
    calculationError, 
    calculatePromo, 
    clearCalculation 
  } = usePromoCalculation();

  // CSS Classes untuk konsistensi
  const styles = {
    buttonPrimary: "bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed",
    buttonSecondary: "flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors",
    buttonSuccess: "bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2",
    loadingSpinner: "animate-spin rounded-full h-5 w-5 border-b-2 border-white",
    containerMobile: "min-h-screen bg-gray-50",
    containerDesktop: "py-6",
    card: "bg-white rounded-lg border border-gray-200 p-4",
    errorCard: "bg-red-50 border border-red-200 rounded-lg p-4",
    successCard: "bg-green-50 border border-green-200 rounded-lg p-4",
    warningCard: "bg-orange-50 border border-orange-200 rounded-lg p-4"
  };

  // Reset form when type changes
  useEffect(() => {
    setFormData({});
    setShowPreview(false);
    clearCalculation();
  }, [selectedType, clearCalculation]);

  const handleFormSubmit = async (data) => {
    try {
      console.log('Submitting form data:', data);
      const result = await calculatePromo(selectedType, data);
      setFormData({ ...data, calculationResult: result });
      
      // Auto show preview on mobile after calculation
      if (isMobile) {
        setShowPreview(true);
      }
      
      toast.success('Perhitungan promo berhasil!');
    } catch (error) {
      console.error('Form submission error:', error);
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

    setIsSaving(true);
    try {
      const promoData = {
        id: Date.now().toString(), // Generate simple ID
        namaPromo: formData.namaPromo,
        tipePromo: selectedType,
        status: formData.status || 'draft',
        dataPromo: formData,
        calculationResult: calculationResult,
        deskripsi: formData.deskripsi || '',
        tanggalMulai: formData.tanggalMulai,
        tanggalSelesai: formData.tanggalSelesai,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Saving promo data:', promoData);
      const success = await addPromo(promoData);
      
      if (success) {
        toast.success('Promo berhasil disimpan!');
        
        // Reset form after successful save
        setSelectedType('');
        setFormData({});
        setShowPreview(false);
        clearCalculation();
        
        // Navigate back if callback provided
        if (onBack) {
          setTimeout(() => {
            onBack();
          }, 1000); // Delay untuk show success message
        }
      }
    } catch (error) {
      console.error('Save promo error:', error);
      toast.error(`Gagal menyimpan promo: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToForm = () => {
    setShowPreview(false);
  };

  // Loading Component
  const LoadingSpinner = ({ message = "Memuat...", size = "medium" }) => {
    const sizeClasses = {
      small: "h-4 w-4",
      medium: "h-8 w-8",
      large: "h-12 w-12"
    };

    return (
      <div className="p-4 sm:p-6 text-center">
        <div className={`animate-spin rounded-full border-b-2 border-orange-500 ${sizeClasses[size]} mx-auto mb-4`}></div>
        <p className="text-gray-600 text-sm sm:text-base">{message}</p>
      </div>
    );
  };

  // Error Display Component
  const ErrorDisplay = ({ title, message, variant = "error" }) => {
    const variantStyles = {
      error: styles.errorCard,
      warning: styles.warningCard,
      success: styles.successCard
    };

    const iconColors = {
      error: "text-red-600",
      warning: "text-orange-600",
      success: "text-green-600"
    };

    return (
      <div className={variantStyles[variant]}>
        <div className="flex items-center space-x-2">
          <AlertCircle className={`h-4 w-4 ${iconColors[variant]}`} />
          <span className="text-sm font-medium">{title}</span>
        </div>
        {message && <p className="text-xs mt-1">{message}</p>}
      </div>
    );
  };

  // Mobile Header Component
  const MobileHeader = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Calculator className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Kalkulator Promo</h1>
          {selectedType && (
            <p className="text-xs text-gray-600 capitalize">{selectedType}</p>
          )}
        </div>
      </div>
      
      {calculationResult && !showPreview && (
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center space-x-1 text-orange-600 text-sm font-medium"
        >
          <span>Preview</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  // Mobile Form View Component
  const MobileFormView = () => (
    <div className="space-y-4">
      <PromoTypeSelector 
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        onFormSubmit={handleFormSubmit}
        isCalculating={isCalculating}
        recipes={recipes}
      />
      
      {/* Calculation Status */}
      {calculationResult && (
        <div className={styles.successCard}>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">
              Perhitungan selesai
            </span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Tap "Preview" untuk melihat hasil kalkulasi
          </p>
        </div>
      )}
      
      {/* Error Display */}
      {calculationError && (
        <ErrorDisplay 
          title="Error Perhitungan"
          message={calculationError}
          variant="error"
        />
      )}
    </div>
  );

  // Mobile Preview View Component
  const MobilePreviewView = () => (
    <div className="space-y-4">
      {/* Back Button */}
      <button
        onClick={handleBackToForm}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ChevronRight className="h-4 w-4 rotate-180" />
        <span className="text-sm">Kembali ke Form</span>
      </button>
      
      <PromoPreview 
        type={selectedType}
        data={{ calculationResult }}
        onSave={handleSavePromo}
        isLoading={isSaving}
      />
    </div>
  );

  // Mobile Bottom Actions Component
  const MobileBottomActions = () => (
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => setShowPreview(!showPreview)}
        className={styles.buttonSecondary}
      >
        <RefreshCw className="h-4 w-4" />
        <span className="text-sm">
          {showPreview ? 'Edit' : 'Preview'}
        </span>
      </button>
      
      <button
        onClick={handleSavePromo}
        disabled={isSaving}
        className={styles.buttonPrimary}
      >
        {isSaving ? (
          <>
            <div className={styles.loadingSpinner}></div>
            <span className="text-sm">Menyimpan...</span>
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            <span className="text-sm">Simpan</span>
          </>
        )}
      </button>
    </div>
  );

  // Desktop Header Component
  const DesktopHeader = () => (
    <div className="mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Calculator className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kalkulator Promo</h1>
          <p className="text-gray-600">Hitung profit margin dan dampak promo dengan akurat</p>
        </div>
      </div>
      
      {selectedType && (
        <div className={styles.warningCard}>
          <p className="text-sm text-orange-800">
            <span className="font-medium">Tipe promo dipilih:</span> 
            <span className="capitalize ml-1">{selectedType}</span>
          </p>
        </div>
      )}
      
      {/* Error Display for Desktop */}
      {calculationError && (
        <div className="mt-4">
          <ErrorDisplay 
            title="Error Perhitungan"
            message={calculationError}
            variant="error"
          />
        </div>
      )}
    </div>
  );

  // Loading State
  if (recipesLoading) {
    return <LoadingSpinner message="Memuat data resep..." size="large" />;
  }

  // Empty Recipe State
  if (!recipes || recipes.length === 0) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <div className="bg-gray-50 rounded-lg p-8 sm:p-12 max-w-md mx-auto">
          <div className="text-gray-400 text-4xl sm:text-6xl mb-4">🍳</div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
            Belum Ada Resep
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Tambahkan resep terlebih dahulu untuk menggunakan kalkulator promo
          </p>
          
          <div className={styles.warningCard + " mb-6"}>
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <h4 className="text-sm font-medium text-orange-800">Yang perlu Anda lakukan:</h4>
                <ul className="text-sm text-orange-700 mt-2 space-y-1">
                  <li>• Buat resep dengan HPP dan harga jual</li>
                  <li>• Tentukan margin keuntungan</li>
                  <li>• Mulai buat promo untuk resep tersebut</li>
                </ul>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => window.location.href = '/resep'}
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            Buat Resep Pertama
          </button>
        </div>
      </div>
    );
  }

  // Mobile Layout
  if (isMobile) {
    return (
      <div className={styles.containerMobile}>
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <MobileHeader />
        </div>

        {/* Mobile Content */}
        <div className="p-4">
          {!showPreview ? <MobileFormView /> : <MobilePreviewView />}
        </div>

        {/* Mobile Bottom Actions */}
        {calculationResult && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <MobileBottomActions />
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className={styles.containerDesktop}>
      <DesktopHeader />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="xl:col-span-2">
          <PromoTypeSelector 
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            onFormSubmit={handleFormSubmit}
            isCalculating={isCalculating}
            recipes={recipes}
          />
        </div>
        
        {/* Preview Section */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <PromoPreview 
              type={selectedType}
              data={{ calculationResult }}
              onSave={handleSavePromo}
              isLoading={isSaving}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoCalculator;