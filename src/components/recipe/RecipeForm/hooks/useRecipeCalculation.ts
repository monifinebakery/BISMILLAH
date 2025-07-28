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

export const useRecipeCalculation = ({
  bahanResep,
  jumlahPorsi,
  jumlahPcsPerPorsi,
  biayaTenagaKerja,
  biayaOverhead,
  marginKeuntunganPersen
}: UseRecipeCalculationProps) => {
  
  const calculation = useMemo(() => {
    // Validate inputs first
    const validation = validateCalculationInputs(bahanResep, jumlahPorsi);
    if (!validation.isValid) {
      return {
        isValid: false,
        errors: validation.errors,
        totalHpp: 0,
        hppPerPorsi: 0,
        hppPerPcs: 0,
        profitPerPorsi: 0,
        profitPerPcs: 0,
        marginPercentage: 0,
        recommendedPricePerPorsi: 0,
        recommendedPricePerPcs: 0,
        ingredients: []
      };
    }

    try {
      const result = calculateRecipe(
        bahanResep,
        jumlahPorsi,
        jumlahPcsPerPorsi
      );

      // Calculate recommended prices based on margin
      const marginMultiplier = 1 + (marginKeuntunganPersen / 100);
      const recommendedPricePerPorsi = result.hppPerPorsi * marginMultiplier;
      const recommendedPricePerPcs = result.hppPerPcs ? result.hppPerPcs * marginMultiplier : 0;

      return {
        isValid: true,
        errors: [],
        ...result,
        recommendedPricePerPorsi,
        recommendedPricePerPcs
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Calculation error'],
        totalHpp: 0,
        hppPerPorsi: 0,
        hppPerPcs: 0,
        profitPerPorsi: 0,
        profitPerPcs: 0,
        marginPercentage: 0,
        recommendedPricePerPorsi: 0,
        recommendedPricePerPcs: 0,
        ingredients: []
      };
    }
  }, [bahanResep, jumlahPorsi, jumlahPcsPerPorsi, biayaTenagaKerja, biayaOverhead, marginKeuntunganPersen]);

  return calculation;
};