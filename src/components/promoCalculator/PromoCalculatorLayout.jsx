// 🎯 Main calculator component - Mobile Responsive

import React, { useState, useEffect } from 'react';
import { Calculator, Save, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';
import { useRecipe } from '@/contexts/RecipeContext';
import PromoTypeSelector from './calculator/PromoTypeSelector';
import PromoPreview from './calculator/PromoPreview';
import { usePromoCalculation } from './hooks/usePromoCalculation';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const PromoCalculator = () => {
  const isMobile = useIsMobile(768);
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const { recipes, isLoading: recipesLoading } = useRecipe();
  const { calculatePromo, savePromo, isLoading: calculationLoading } = usePromoCalculation();

  // Reset form when type changes
  useEffect(() => {
    setFormData({});
    setShowPreview(false);
  }, [selectedType]);

  const handleFormSubmit = async (data) => {
    setIsCalculating(true);
    try {
      const calculationResult = await calculatePromo(selectedType, data);
      setFormData({ ...data, calculationResult });
      
      // Auto show preview on mobile after calculation
      if (isMobile) {
        setShowPreview(true);
      }
      
      toast.success('Perhitungan promo berhasil!');
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSavePromo = async () => {
    if (!formData.calculationResult) {
      toast.error('Lakukan perhitungan terlebih dahulu');
      return;
    }

    try {
      await savePromo({
        type: selectedType,
        data: formData,
        calculation: formData.calculationResult
      });
      toast.success('Promo berhasil disimpan!');
      
      // Reset form
      setSelectedType('');
      setFormData({});
      setShowPreview(false);
    } catch (error) {
      toast.error(`Gagal menyimpan promo: ${error.message}`);
    }
  };

  const handleBackToForm = () => {
    setShowPreview(false);
  };

  if (recipesLoading) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm sm:text-base">Memuat data resep...</p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="p-4 sm:p-6 text-center">
        <div className="bg-gray-50 rounded-lg p-8 sm:p-12 max-w-md mx-auto">
          <div className="text-gray-400 text-4xl sm:text-6xl mb-4">🍳</div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Belum Ada Resep</h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Tambahkan resep terlebih dahulu untuk menggunakan kalkulator promo
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
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

  // Mobile Layout with Navigation
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
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
            
            {formData.calculationResult && !showPreview && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center space-x-1 text-orange-600 text-sm font-medium"
              >
                <span>Preview</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Content */}
        <div className="p-4">
          {!showPreview ? (
            // Form View
            <div className="space-y-4">
              <PromoTypeSelector 
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                onFormSubmit={handleFormSubmit}
                isCalculating={isCalculating || calculationLoading}
                recipes={recipes}
                isMobile={true}
              />
              
              {/* Calculation Status */}
              {formData.calculationResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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
            </div>
          ) : (
            // Preview View
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
                data={formData}
                onSave={handleSavePromo}
                isLoading={calculationLoading}
                isMobile={true}
              />
            </div>
          )}
        </div>

        {/* Mobile Bottom Actions */}
        {formData.calculationResult && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span className="text-sm">
                  {showPreview ? 'Edit' : 'Preview'}
                </span>
              </button>
              
              <button
                onClick={handleSavePromo}
                disabled={calculationLoading}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span className="text-sm">Simpan Promo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout (Original)
  return (
    <div className="p-6">
      {/* Desktop Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Calculator className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kalkulator Promo</h1>
            <p className="text-gray-600">Hitung profit margin dan dampak promo dengan akurat</p>
          </div>
        </div>
        
        {selectedType && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              <span className="font-medium">Tipe promo dipilih:</span> 
              <span className="capitalize ml-1">{selectedType}</span>
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <PromoTypeSelector 
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            onFormSubmit={handleFormSubmit}
            isCalculating={isCalculating || calculationLoading}
            recipes={recipes}
          />
        </div>
        
        {/* Preview Section */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <PromoPreview 
              type={selectedType}
              data={formData}
              onSave={handleSavePromo}
              isLoading={calculationLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoCalculator;