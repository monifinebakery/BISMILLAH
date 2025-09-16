// src/components/operational-costs/hooks/useEnhancedHppCalculation.ts
// 🔗 Enhanced HPP Calculation Hook (Revision 4 & 10)
// Integrates dual-mode costs with recipe BOM calculations

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { productionOutputApi } from '../services/productionOutputApi';
import type { AppSettings } from '../types/operationalCost.types';
import { logger } from '@/utils/logger';

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
  
  const queryClient = useQueryClient();

  // ✅ Subscribe to app settings changes (including production target)
  const appSettingsQuery = useQuery({
    queryKey: ['enhanced-hpp', 'app-settings'],
    queryFn: async () => {
      logger.debug('🔄 Fetching app settings for enhanced HPP');
      const settings = await getCurrentAppSettings();
      return settings;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
  
  // ✅ Subscribe to production target changes
  const productionTargetQuery = useQuery({
    queryKey: ['enhanced-hpp', 'production-target'],
    queryFn: async () => {
      const response = await productionOutputApi.getCurrentProductionTarget();
      if (response.error) {
        logger.error('❌ Error fetching production target in enhanced HPP:', response.error);
        return null;
      }
      logger.debug('✅ Production target fetched in enhanced HPP:', response.data);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });

  // ✅ Update local state when queries complete
  useEffect(() => {
    if (appSettingsQuery.data) {
      setAppSettings(appSettingsQuery.data);
      setIsLoadingSettings(false);
      logger.debug('✅ App settings updated in enhanced HPP:', appSettingsQuery.data);
    }
  }, [appSettingsQuery.data]);
  
  useEffect(() => {
    setIsLoadingSettings(appSettingsQuery.isLoading);
  }, [appSettingsQuery.isLoading]);
  
  useEffect(() => {
    if (appSettingsQuery.error) {
      setError(appSettingsQuery.error.message || 'Gagal memuat pengaturan overhead');
      logger.error('❌ App settings query error in enhanced HPP:', appSettingsQuery.error);
    }
  }, [appSettingsQuery.error]);

  // Load app settings on mount (fallback)
  useEffect(() => {
    if (!appSettingsQuery.data && !appSettingsQuery.isLoading) {
      refreshAppSettings();
    }
  }, [appSettingsQuery.data, appSettingsQuery.isLoading]);

  /**
   * Refresh app settings from database
   */
  const refreshAppSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    setError(null);
    
    try {
      const settings = await getCurrentAppSettings();
      setAppSettings(settings);
      
      // App settings loaded successfully
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
        // params.tklDetails // TKL now included in overhead
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
      params.jumlahPcsPerPorsi
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
    
    // Calculation
    calculateHPP,
    refreshAppSettings,
    
    // Utilities
    validateInputs,
    formatSummary,
    
    // Comparison
    compareWithLegacy,
    
    // State management
    clearResult,
    clearError,
    
    // ✅ Expose queries for external monitoring
    appSettingsQuery,
    productionTargetQuery,
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
  marginKeuntunganPersen: number;
}) => {
  const hppHook = useEnhancedHppCalculation({ autoCalculate: true });
  
  // Default to enhanced mode (true) for simplified experience
  const [isEnhancedMode, setIsEnhancedMode] = useState(true);
  
  // Auto-calculate when recipe data changes and enhanced mode is active
  useEffect(() => {
    if (isEnhancedMode && recipeData.bahanResep.length > 0) {
      // Input recipe data for calculation
      
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
        pricingMode: {
          mode: 'markup',
          percentage: recipeData.marginKeuntunganPersen
        },
        useAppSettingsOverhead: true
      };
      
      // Prepared params for calculation
      
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
    recipeData.marginKeuntunganPersen,
    hppHook.calculateHPP
  ]); // Fixed dependency to prevent infinite re-renders
  
  // ✅ Auto-recalculate when production target or app settings change
  useEffect(() => {
    if (isEnhancedMode && recipeData.bahanResep.length > 0 && 
        (hppHook.productionTargetQuery?.data || hppHook.appSettingsQuery?.data)) {
      logger.info('🎯 Production target or app settings changed, recalculating HPP in integration');
      
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
        pricingMode: {
          mode: 'markup',
          percentage: recipeData.marginKeuntunganPersen
        },
        useAppSettingsOverhead: true
      };
      
      // Debounce to avoid rapid recalculations
      const timer = setTimeout(() => {
        hppHook.calculateHPP(params);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [hppHook.productionTargetQuery?.data, hppHook.appSettingsQuery?.data]);
  
  return {
    ...hppHook,
    isEnhancedMode,
    setIsEnhancedMode,
    // Consider either overhead or operasional configured as "ready"
    hasOverheadSettings: Boolean((hppHook.appSettings?.overhead_per_pcs || 0) + (hppHook.appSettings?.operasional_per_pcs || 0))
  };
};
