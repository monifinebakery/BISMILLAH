// src/components/recipe/hooks/useHppCalculation.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { NewRecipe } from '../types';
import { useRecipe } from '@/contexts/RecipeContext';
import type { EnhancedHPPCalculationResult } from '@/components/operational-costs/utils/enhancedHppCalculations';

interface CalculationResults {
  totalHPP: number;
  hppPerPorsi: number;
  hargaJualPorsi: number;
  hppPerPcs: number;
  hargaJualPerPcs: number;
  totalBahanBaku: number;
  biayaTenagaKerja: number;
  biayaOverhead: number;
}

interface UseHppCalculationProps {
  formData: NewRecipe;
  setFormData: React.Dispatch<React.SetStateAction<NewRecipe>>;
}

export const useHppCalculation = ({
  formData,
  setFormData,
}: UseHppCalculationProps) => {
  const { calculateHPP } = useRecipe();
  const [calculationResults, setCalculationResults] = useState<CalculationResults | null>(null);
  const [enhancedHppResult, setEnhancedHppResult] = useState<EnhancedHPPCalculationResult | null>(null);

  // Memoize recipe data for enhanced HPP integration to prevent infinite re-renders
  const recipeDataForHpp = useMemo(() => ({
    bahanResep: formData.bahanResep,
    jumlahPorsi: typeof formData.jumlahPorsi === 'string' ? parseInt(formData.jumlahPorsi) || 1 : formData.jumlahPorsi,
    jumlahPcsPerPorsi: typeof formData.jumlahPcsPerPorsi === 'string' ? parseInt(formData.jumlahPcsPerPorsi) || 1 : (formData.jumlahPcsPerPorsi || 1),
    biayaTenagaKerja: formData.biayaTenagaKerja || 0,
    biayaOverhead: formData.biayaOverhead || 0,
    marginKeuntunganPersen: formData.marginKeuntunganPersen || 0,
  }), [
    formData.bahanResep, 
    formData.jumlahPorsi, 
    formData.jumlahPcsPerPorsi, 
    formData.biayaTenagaKerja, 
    formData.biayaOverhead, 
    formData.marginKeuntunganPersen
  ]);

  // Auto-calculate HPP when form data changes (legacy calculation as fallback)
  useEffect(() => {
    // Skip if enhanced HPP result is available (auto-sync takes precedence)
    if (enhancedHppResult) {
      return;
    }
    
    if (formData.bahanResep.length > 0 || formData.biayaTenagaKerja > 0 || formData.biayaOverhead > 0) {
      try {
        const bahanForCalculation = formData.bahanResep.map(bahan => ({
          nama: bahan.nama,
          jumlah: bahan.jumlah,
          satuan: bahan.satuan,
          hargaSatuan: bahan.hargaSatuan,
          totalHarga: bahan.totalHarga,
        }));

        const calculation = calculateHPP(
          bahanForCalculation,
          typeof formData.jumlahPorsi === 'number' ? formData.jumlahPorsi : parseInt(formData.jumlahPorsi) || 1,
          formData.biayaTenagaKerja,
          formData.biayaOverhead,
          formData.marginKeuntunganPersen,
          typeof formData.jumlahPcsPerPorsi === 'number' ? formData.jumlahPcsPerPorsi : parseInt(formData.jumlahPcsPerPorsi as string) || 1
        );

        setCalculationResults(calculation);
        
        // Update form data with calculated HPP values only
        // Selling prices are controlled by the user in the cost calculation step
        setFormData(prev => ({
          ...prev,
          totalHpp: calculation.totalHPP,
          hppPerPorsi: calculation.hppPerPorsi,
          hppPerPcs: calculation.hppPerPcs,
          // Don't override user's selling prices
          hargaJualPorsi: prev.hargaJualPorsi || 0,
          hargaJualPerPcs: prev.hargaJualPerPcs || 0,
        }));

      } catch (error) {
        console.warn('[useHppCalculation] Calculation error:', error);
        setCalculationResults(null);
      }
    }
  }, [
    formData.bahanResep,
    formData.jumlahPorsi,
    formData.biayaTenagaKerja,
    formData.biayaOverhead,
    formData.marginKeuntunganPersen,
    formData.jumlahPcsPerPorsi,
    calculateHPP,
    enhancedHppResult,
    setFormData
  ]);

  // Handle enhanced HPP result updates
  const handleEnhancedHppChange = useCallback((result: EnhancedHPPCalculationResult | null) => {
    setEnhancedHppResult(result);
    
    if (result) {
      // Update form data with enhanced results
      setFormData(prev => ({
        ...prev,
        totalHpp: result.totalHPP,
        hppPerPorsi: result.hppPerPorsi,
        hargaJualPorsi: result.hargaJualPerPorsi,
        hppPerPcs: result.hppPerPcs,
        hargaJualPerPcs: result.hargaJualPerPcs,
        biayaOverhead: result.overheadPerPcs * 
          (typeof formData.jumlahPorsi === 'number' ? formData.jumlahPorsi : parseInt(formData.jumlahPorsi) || 1) *
          (typeof formData.jumlahPcsPerPorsi === 'number' ? formData.jumlahPcsPerPorsi : parseInt(formData.jumlahPcsPerPorsi as string) || 1)
      }));
      
      // Update calculation results for display
      setCalculationResults({
        totalHPP: result.totalHPP,
        hppPerPorsi: result.hppPerPorsi,
        hargaJualPorsi: result.hargaJualPerPorsi,
        hppPerPcs: result.hppPerPcs,
        hargaJualPerPcs: result.hargaJualPerPcs,
        totalBahanBaku: result.bahanPerPcs * 
          (typeof formData.jumlahPorsi === 'number' ? formData.jumlahPorsi : parseInt(formData.jumlahPorsi) || 1) *
          (typeof formData.jumlahPcsPerPorsi === 'number' ? formData.jumlahPcsPerPorsi : parseInt(formData.jumlahPcsPerPorsi as string) || 1),
        biayaTenagaKerja: 0, // TKL now included in overhead
        biayaOverhead: result.overheadPerPcs * 
          (typeof formData.jumlahPorsi === 'number' ? formData.jumlahPorsi : parseInt(formData.jumlahPorsi) || 1) *
          (typeof formData.jumlahPcsPerPorsi === 'number' ? formData.jumlahPcsPerPorsi : parseInt(formData.jumlahPcsPerPorsi as string) || 1)
      });
    }
  }, [formData.jumlahPorsi, formData.jumlahPcsPerPorsi, setFormData]);

  // Calculate derived values
  const totalPcsProduced = useMemo(() => (
    (typeof formData.jumlahPorsi === 'number' ? formData.jumlahPorsi : parseInt(formData.jumlahPorsi) || 1) *
    (typeof formData.jumlahPcsPerPorsi === 'number' ? formData.jumlahPcsPerPorsi : parseInt(formData.jumlahPcsPerPorsi as string) || 1)
  ), [formData.jumlahPorsi, formData.jumlahPcsPerPorsi]);

  const totalIngredientCost = useMemo(() => 
    formData.bahanResep.reduce((sum, item) => sum + item.totalHarga, 0),
    [formData.bahanResep]
  );

  return {
    calculationResults,
    enhancedHppResult,
    recipeDataForHpp,
    totalPcsProduced,
    totalIngredientCost,
    handleEnhancedHppChange,
  };
};