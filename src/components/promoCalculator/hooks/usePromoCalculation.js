/ 🎯 Hook untuk logic perhitungan promo

import { useCallback } from 'react';
import { useRecipe } from '@/contexts/RecipeContext';
import { calculationService } from '../services/calculationService';
import { promoService } from '../services/promoService';

export const usePromoCalculation = () => {
  const { recipes } = useRecipe();

  const calculatePromo = useCallback(async (type, data) => {
    try {
      switch (type) {
        case 'bogo':
          return calculationService.calculateBogo(data, recipes);
        case 'discount':
          return calculationService.calculateDiscount(data, recipes);
        case 'bundle':
          return calculationService.calculateBundle(data, recipes);
        default:
          throw new Error('Tipe promo tidak valid');
      }
    } catch (error) {
      throw new Error(`Gagal menghitung promo: ${error.message}`);
    }
  }, [recipes]);

  const savePromo = useCallback(async (promoData) => {
    try {
      return await promoService.createPromo(promoData);
    } catch (error) {
      throw new Error(`Gagal menyimpan promo: ${error.message}`);
    }
  }, []);

  return {
    calculatePromo,
    savePromo,
    isLoading: false // You can add loading state management here
  };
};