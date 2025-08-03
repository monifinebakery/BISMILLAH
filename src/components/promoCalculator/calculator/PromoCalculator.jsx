// 🎯 Main calculator component - Mobile Responsive

import React, { useState, useEffect } from 'react';
import { Calculator, Save, RefreshCw, AlertCircle, ChevronRight } from 'lucide-react';
import { useRecipe } from '@/contexts/RecipeContext';
import PromoTypeSelector from './PromoTypeSelector';
import PromoPreview from './PromoPreview';
import { usePromoCalculation } from '../hooks/usePromoCalculation';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const PromoCalculator = () => {
  const isMobile = useIsMobile(768);
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  
  const { recipes, isLoading: recipesLoading } = useRecipe();
  const { 
    calculationResult, 
    isCalculating, 
    calculationError, 
    calculatePromo, 
    clearCalculation 
  } = usePromoCalculation();

  // Reset form when type changes
  useEffect(() => {
    setFormData({});
    setShowPreview(false);
    clearCalculation();
  }, [selectedType, clearCalculation]);

  const handleFormSubmit = async (data) => {
    try {
      const result = await calculatePromo(selectedType, data);
      setFormData({ ...data, calculationResult: result });
      
      // Auto show preview on mobile after calculation
      if (isMobile) {
        setShowPreview(true);
      }
      
      toast.success('Perhitungan promo berhasil!');
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleSavePromo = async () => {
    if (!calculationResult) {
      toast.error('Lakukan perhitungan terlebih dahulu');
      return;
    }

    try {
      // TODO: Implement save functionality
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock save
      
      toast.success('Promo berhasil disimpan!');
      
      // Reset form
      setSelectedType('');
      setFormData({});
      setShowPreview(false);
      clearCalculation();
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
                isCalculating={isCalculating}
                recipes={recipes}
              />
              
              {/* Calculation Status */}
              {calculationResult && (
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
              
              {/* Error Display */}
              {calculationError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      Error Perhitungan
                    </span>
                  </div>
                  <p className="text-xs text-red-700 mt-1">{calculationError}</p>
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
                data={{ calculationResult }}
                onSave={handleSavePromo}
                isLoading={false}
              />
            </div>
          )}
        </div>

        {/* Mobile Bottom Actions */}
        {calculationResult && (
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
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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

  // Desktop Layout
  return (
    <div className="py-8">
      {/* Desktop Header */}
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
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              <span className="font-medium">Tipe promo dipilih:</span> 
              <span className="capitalize ml-1">{selectedType}</span>
            </p>
          </div>
        )}
        
        {/* Error Display for Desktop */}
        {calculationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">Error Perhitungan</span>
            </div>
            <p className="text-sm text-red-700 mt-1">{calculationError}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form Section - Takes more space */}
        <div className="lg:col-span-3 space-y-6">
          <PromoTypeSelector 
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            onFormSubmit={handleFormSubmit}
            isCalculating={isCalculating}
            recipes={recipes}
          />
        </div>
        
        {/* Preview Section - Narrower sidebar */}
        <div className="lg:col-span-2">
          <div className="sticky top-8">
            <PromoPreview 
              type={selectedType}
              data={{ calculationResult }}
              onSave={handleSavePromo}
              isLoading={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoCalculator;