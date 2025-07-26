// 🎯 Main calculator component

import React, { useState, useEffect } from 'react';
import { useRecipe } from '@/contexts/RecipeContext';
import PromoTypeSelector from './PromoTypeSelector';
import PromoPreview from './PromoPreview';
import { usePromoCalculation } from '../hooks/usePromoCalculation';
import { toast } from 'sonner';

const PromoCalculator = () => {
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({});
  const [isCalculating, setIsCalculating] = useState(false);
  
  const { recipes, isLoading: recipesLoading } = useRecipe();
  const { calculatePromo, savePromo, isLoading: calculationLoading } = usePromoCalculation();

  // Reset form when type changes
  useEffect(() => {
    setFormData({});
  }, [selectedType]);

  const handleFormSubmit = async (data) => {
    setIsCalculating(true);
    try {
      const calculationResult = await calculatePromo(selectedType, data);
      setFormData({ ...data, calculationResult });
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
    } catch (error) {
      toast.error(`Gagal menyimpan promo: ${error.message}`);
    }
  };

  if (recipesLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Memuat data resep...</p>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-400 text-4xl mb-4">🍳</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Resep</h3>
        <p className="text-gray-600 mb-4">Tambahkan resep terlebih dahulu untuk menggunakan kalkulator promo</p>
        <button 
          onClick={() => window.location.href = '/resep'}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Buat Resep Pertama
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
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
          <PromoPreview 
            type={selectedType}
            data={formData}
            onSave={handleSavePromo}
            isLoading={calculationLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default PromoCalculator;