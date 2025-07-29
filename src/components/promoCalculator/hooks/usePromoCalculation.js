import { useState, useCallback, useEffect } from 'react';
import { useRecipe } from '@/contexts/RecipeContext';
import { calculations, validation } from '../utils';
import { toast } from 'sonner';

export const usePromoCalculation = () => {
  const { recipes } = useRecipe();
  const [calculationResult, setCalculationResult] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState(null);

  // Calculate promo based on type
  const calculatePromo = useCallback(async (type, data) => {
    setIsCalculating(true);
    setCalculationError(null);

    try {
      let result;

      switch (type) {
        case 'bogo': {
          const mainRecipe = recipes.find(r => r.id === data.resepUtama);
          const freeRecipe = recipes.find(r => r.id === data.resepGratis);
          
          if (!mainRecipe || !freeRecipe) {
            throw new Error('Resep tidak ditemukan');
          }

          result = calculations.calculateBogo(mainRecipe, freeRecipe, data.minimalQty);
          break;
        }

        case 'discount': {
          const recipe = recipes.find(r => r.id === data.resep);
          
          if (!recipe) {
            throw new Error('Resep tidak ditemukan');
          }

          result = calculations.calculateDiscount(
            recipe,
            data.tipeDiskon,
            data.nilaiDiskon,
            data.maksimalDiskon
          );
          break;
        }

        case 'bundle': {
          result = calculations.calculateBundle(
            data.resepBundle,
            data.hargaBundle,
            recipes
          );
          break;
        }

        default:
          throw new Error('Tipe promo tidak valid');
      }

      // Add warnings
      result.warnings = calculations.calculateWarnings(result);
      
      // Add breakeven analysis
      result.breakeven = calculations.calculateBreakeven(result);

      setCalculationResult(result);
      return result;

    } catch (error) {
      setCalculationError(error.message);
      toast.error(`Error perhitungan: ${error.message}`);
      throw error;
    } finally {
      setIsCalculating(false);
    }
  }, [recipes]);

  // Clear calculation
  const clearCalculation = useCallback(() => {
    setCalculationResult(null);
    setCalculationError(null);
  }, []);

  return {
    calculationResult,
    isCalculating,
    calculationError,
    calculatePromo,
    clearCalculation
  };
};