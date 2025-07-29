import { useMemo } from 'react';
import { calculateRecipe, validateCalculationInputs } from '../../shared/utils/recipeCalculations';

interface BahanResep {
  nama: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
}

interface UseRecipeCalculationProps {
  bahanResep: BahanResep[];
  jumlahPorsi: number;
  jumlahPcsPerPorsi: number;
  biayaTenagaKerja: number;
  biayaOverhead: number;
  marginKeuntunganPersen: number;
}

// Fixed: Separate interface without isValid to avoid rendering object issues
interface CalculationResult {
  totalHpp: number;
  hppPerPorsi: number;
  hppPerPcs: number;
  profitPerPorsi: number;
  profitPerPcs: number;
  marginPercentage: number;
  recommendedPricePerPorsi: number;
  recommendedPricePerPcs: number;
  ingredients: any[];
}

interface CalculationStatus {
  isValid: boolean;
  errors: string[];
}

export const useRecipeCalculation = ({
  bahanResep,
  jumlahPorsi,
  jumlahPcsPerPorsi,
  biayaTenagaKerja,
  biayaOverhead,
  marginKeuntunganPersen
}: UseRecipeCalculationProps) => {
  
  // Fixed: Split calculation result and status
  const { result, status } = useMemo(() => {
    // Validate inputs first
    const validation = validateCalculationInputs(bahanResep, jumlahPorsi);
    
    if (!validation.isValid) {
      return {
        status: {
          isValid: false,
          errors: validation.errors || ['Validation failed']
        },
        result: {
          totalHpp: 0,
          hppPerPorsi: 0,
          hppPerPcs: 0,
          profitPerPorsi: 0,
          profitPerPcs: 0,
          marginPercentage: 0,
          recommendedPricePerPorsi: 0,
          recommendedPricePerPcs: 0,
          ingredients: []
        }
      };
    }

    try {
      const calculationResult = calculateRecipe(
        bahanResep,
        jumlahPorsi,
        jumlahPcsPerPorsi
      );

      // Calculate recommended prices based on margin
      const marginMultiplier = 1 + (marginKeuntunganPersen / 100);
      const recommendedPricePerPorsi = calculationResult.hppPerPorsi * marginMultiplier;
      const recommendedPricePerPcs = calculationResult.hppPerPcs ? calculationResult.hppPerPcs * marginMultiplier : 0;

      return {
        status: {
          isValid: true,
          errors: []
        },
        result: {
          ...calculationResult,
          recommendedPricePerPorsi,
          recommendedPricePerPcs
        }
      };
    } catch (error) {
      return {
        status: {
          isValid: false,
          errors: [error instanceof Error ? error.message : 'Calculation error']
        },
        result: {
          totalHpp: 0,
          hppPerPorsi: 0,
          hppPerPcs: 0,
          profitPerPorsi: 0,
          profitPerPcs: 0,
          marginPercentage: 0,
          recommendedPricePerPorsi: 0,
          recommendedPricePerPcs: 0,
          ingredients: []
        }
      };
    }
  }, [bahanResep, jumlahPorsi, jumlahPcsPerPorsi, biayaTenagaKerja, biayaOverhead, marginKeuntunganPersen]);

  // Fixed: Return separate values instead of object with isValid
  return {
    // Calculation data (safe to render)
    ...result,
    
    // Status flags (booleans, safe to render)
    isCalculationValid: status.isValid,
    hasCalculationErrors: !status.isValid,
    
    // Error messages (strings, safe to render)
    calculationErrors: status.errors,
    calculationErrorMessage: status.errors.join(', ')
  };
};