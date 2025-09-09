// src/components/operational-costs/hooks/useEnhancedHppCalculation.ts
// 🔗 Enhanced HPP Calculation Hook (Revision 4 & 10)
// Integrates dual-mode costs with recipe BOM calculations

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { 
  EnhancedHPPCalculationResult,
  BahanResepWithWAC,
  PricingMode 
} from '../utils/enhancedHppCalculations';
import { 
  calculateEnhancedHPP,
  getCurrentAppSettings,
  compareCalculationMethods,
  formatCalculationSummary,
  validateEnhancedCalculationInputs
} from '../utils/enhancedHppCalculations';
import type { AppSettings } from '../types/operationalCost.types';

interface UseEnhancedHppCalculationProps {
  autoCalculate?: boolean;
  enableComparison?: boolean;
}

interface UseEnhancedHppCalculationReturn {
  // State
  result: EnhancedHPPCalculationResult | null;
  appSettings: AppSettings | null;
  isCalculating: boolean;
  isLoadingSettings: boolean;
  error: string | null;
  
  // Calculation methods
  calculateHPP: (params: CalculateHPPParams) => Promise<EnhancedHPPCalculationResult | null>;
  refreshAppSettings: () => Promise<void>;
  
  // Utilities
  validateInputs: (params: CalculateHPPParams) => { isValid: boolean; errors: string[] };
  formatSummary: (result?: EnhancedHPPCalculationResult) => string;
  
  // Comparison with legacy method
  compareWithLegacy: (legacyResult: any) => any;
  
  // State management
  clearResult: () => void;
  clearError: () => void;
}

interface CalculateHPPParams {
  bahanResep: BahanResepWithWAC[];
  jumlahPorsi: number;
  jumlahPcsPerPorsi: number;
  tklDetails: {
    jamKerjaPerBatch?: number;
    tarifPerJam?: number;
    totalTklAmount?: number;
  };
  pricingMode: PricingMode;
  useAppSettingsOverhead?: boolean;
}

export const useEnhancedHppCalculation = ({
  autoCalculate = false,
  enableComparison = true
}: UseEnhancedHppCalculationProps = {}): UseEnhancedHppCalculationReturn => {
  
  // State
  const [result, setResult] = useState<EnhancedHPPCalculationResult | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load app settings on mount
  useEffect(() => {
    refreshAppSettings();
  }, []);

  /**
   * Refresh app settings from database
   */
  const refreshAppSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    setError(null);
    
    try {
      const settings = await getCurrentAppSettings();
      setAppSettings(settings);
      
      if (settings?.overhead_per_pcs) {
        console.log('💡 Enhanced HPP: Using overhead from app settings:', settings.overhead_per_pcs);
      } else if (settings) {
        console.log('⚠️ Enhanced HPP: App settings found but no overhead calculated yet');
      } else {
        console.log('⚠️ Enhanced HPP: No app settings found, default settings will be created');
      }
    } catch (err) {
      const errorMessage = 'Gagal memuat pengaturan overhead. Sistem akan menggunakan nilai default.';
      setError(errorMessage);
      console.error('Error refreshing app settings:', err);
      
      // Still try to use the system without settings
      setAppSettings(null);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  /**
   * Main calculation function
   */
  const calculateHPP = useCallback(async (params: CalculateHPPParams): Promise<EnhancedHPPCalculationResult | null> => {
    setIsCalculating(true);
    setError(null);
    
    try {
      // Validate inputs
      const validation = validateEnhancedCalculationInputs(
        params.bahanResep,
        params.jumlahPorsi,
        params.jumlahPcsPerPorsi,
        params.tklDetails
      );
      
      if (!validation.isValid) {
        const errorMessage = `Input tidak valid: ${validation.errors.join(', ')}`;
        setError(errorMessage);
        toast.error('Validasi gagal', { description: errorMessage });
        return null;
      }

      // Perform calculation
      const calculationResult = await calculateEnhancedHPP(
        params.bahanResep,
        params.jumlahPorsi,
        params.jumlahPcsPerPorsi,
        params.tklDetails,
        params.pricingMode,
        params.useAppSettingsOverhead ?? true
      );
      
      setResult(calculationResult);
      
      // Success notification
      const overheadSource = calculationResult.breakdown.overheadSource === 'app_settings' 
        ? 'overhead otomatis' 
        : 'overhead manual';
        
      toast.success('Kalkulasi HPP berhasil!', {
        description: `Menggunakan ${overheadSource} - HPP: Rp ${calculationResult.hppPerPcs.toLocaleString()}/pcs`
      });
      
      return calculationResult;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menghitung HPP';
      setError(errorMessage);
      toast.error('Kalkulasi gagal', { description: errorMessage });
      console.error('Enhanced HPP calculation error:', err);
      return null;
    } finally {
      setIsCalculating(false);
    }
  }, []);

  /**
   * Validate calculation inputs
   */
  const validateInputs = useCallback((params: CalculateHPPParams) => {
    return validateEnhancedCalculationInputs(
      params.bahanResep,
      params.jumlahPorsi,
      params.jumlahPcsPerPorsi,
      params.tklDetails
    );
  }, []);

  /**
   * Format calculation summary
   */
  const formatSummary = useCallback((targetResult?: EnhancedHPPCalculationResult): string => {
    const resultToFormat = targetResult || result;
    if (!resultToFormat) return 'Belum ada hasil kalkulasi';
    return formatCalculationSummary(resultToFormat);
  }, [result]);

  /**
   * Compare with legacy calculation method
   */
  const compareWithLegacy = useCallback((legacyResult: any) => {
    if (!result || !enableComparison) return null;
    
    try {
      const comparison = compareCalculationMethods(legacyResult, result);
      
      // Show comparison toast if significant difference
      if (Math.abs(comparison.hppDifference) > 500) {
        toast.info('Perbedaan HPP terdeteksi', {
          description: `${comparison.recommendation} (selisih: Rp ${Math.abs(comparison.hppDifference).toLocaleString()})`
        });
      }
      
      return comparison;
    } catch (err) {
      console.error('Error comparing calculation methods:', err);
      return null;
    }
  }, [result, enableComparison]);

  /**
   * Clear calculation result
   */
  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    result,
    appSettings,
    isCalculating,
    isLoadingSettings,
    error,
    
    // Calculation methods
    calculateHPP,
    refreshAppSettings,
    
    // Utilities
    validateInputs,
    formatSummary,
    
    // Comparison
    compareWithLegacy,
    
    // State management
    clearResult,
    clearError
  };
};

// ====================================
// UTILITY HOOK FOR RECIPE INTEGRATION
// ====================================

/**
 * Hook specifically for integrating with existing recipe forms
 * Default to enhanced mode for simplified user experience
 */
export const useRecipeHppIntegration = (recipeData: {
  bahanResep: any[];
  jumlahPorsi: number;
  jumlahPcsPerPorsi: number;
  biayaTenagaKerja: number;
  marginKeuntunganPersen: number;
}) => {
  const hppHook = useEnhancedHppCalculation({ autoCalculate: true });
  
  // Default to enhanced mode (true) for simplified experience
  const [isEnhancedMode, setIsEnhancedMode] = useState(true);
  
  // Auto-calculate when recipe data changes and enhanced mode is active
  useEffect(() => {
    if (isEnhancedMode && recipeData.bahanResep.length > 0) {
      console.log('🔥 [useRecipeHppIntegration] Input recipe data:', {
        biayaTenagaKerja: recipeData.biayaTenagaKerja,
        biayaTenagaKerjaType: typeof recipeData.biayaTenagaKerja,
        jumlahPorsi: recipeData.jumlahPorsi,
        jumlahPcsPerPorsi: recipeData.jumlahPcsPerPorsi,
        bahanCount: recipeData.bahanResep.length
      });
      
      const params: CalculateHPPParams = {
        bahanResep: recipeData.bahanResep.map(bahan => ({
          nama: bahan.nama,
          jumlah: bahan.jumlah,
          satuan: bahan.satuan,
          hargaSatuan: bahan.hargaSatuan,
          totalHarga: bahan.totalHarga,
          warehouseId: bahan.warehouseId
        })),
        jumlahPorsi: recipeData.jumlahPorsi,
        jumlahPcsPerPorsi: recipeData.jumlahPcsPerPorsi,
        tklDetails: {
          totalTklAmount: recipeData.biayaTenagaKerja
        },
        pricingMode: {
          mode: 'markup',
          percentage: recipeData.marginKeuntunganPersen
        },
        useAppSettingsOverhead: true
      };
      
      console.log('🔥 [useRecipeHppIntegration] Prepared params for calculation:', {
        tklDetails: params.tklDetails,
        pricingMode: params.pricingMode
      });
      
      // Debounce calculation for better performance
      const timer = setTimeout(() => {
        hppHook.calculateHPP(params);
      }, 300); // Reduced debounce time for better responsiveness
      
      return () => clearTimeout(timer);
    }
  }, [
    isEnhancedMode,
    recipeData.bahanResep,
    recipeData.jumlahPorsi,
    recipeData.jumlahPcsPerPorsi,
    recipeData.biayaTenagaKerja,
    recipeData.marginKeuntunganPersen,
    hppHook
  ]);
  
  return {
    ...hppHook,
    isEnhancedMode,
    setIsEnhancedMode,
    hasOverheadSettings: Boolean(hppHook.appSettings?.overhead_per_pcs)
  };
};