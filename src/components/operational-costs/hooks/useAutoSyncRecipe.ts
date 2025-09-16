// src/components/operational-costs/hooks/useAutoSyncRecipe.ts
// 🔗 Auto-Sync Recipe Hook (Simplified Single Mode)
// Otomatis sync biaya operasional ke recipe tanpa dual mode

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { EnhancedHPPCalculationResult } from '../utils/enhancedHppCalculations';
import { 
  calculateEnhancedHPP,
  getCurrentAppSettings,
} from '../utils/enhancedHppCalculations';
import { logger } from '@/utils/logger';

interface AutoSyncRecipeProps {
  bahanResep: any[];
  jumlahPorsi: number;
  jumlahPcsPerPorsi: number;
  marginKeuntunganPersen: number;
  onResultChange?: (result: EnhancedHPPCalculationResult | null) => void;
}

interface AutoSyncRecipeReturn {
  result: EnhancedHPPCalculationResult | null;
  isCalculating: boolean;
  isLoadingSettings: boolean;
  error: string | null;
  hasOperationalCosts: boolean;
  isAutoSyncEnabled: boolean;
  refreshCalculation: () => void;
  clearError: () => void;
}

/**
 * Hook untuk auto-sync recipe dengan biaya operasional
 * Tidak ada dual mode, langsung otomatis sync jika ada biaya operasional
 */
export const useAutoSyncRecipe = ({
  bahanResep,
  jumlahPorsi,
  jumlahPcsPerPorsi,
  marginKeuntunganPersen,
  onResultChange
}: AutoSyncRecipeProps): AutoSyncRecipeReturn => {
  
  const [result, setResult] = useState<EnhancedHPPCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasOperationalCosts, setHasOperationalCosts] = useState(false);

  // Check if operational costs are available
  const checkOperationalCosts = useCallback(async () => {
    setIsLoadingSettings(true);
    setError(null);
    
    try {
      const settings = await getCurrentAppSettings();
      const hasSettings = Boolean(
        (settings?.overhead_per_pcs && settings.overhead_per_pcs > 0) || 
        (settings?.operasional_per_pcs && settings.operasional_per_pcs > 0)
      );
      
      setHasOperationalCosts(hasSettings);
      
      if (hasSettings) {
        logger.info('✅ Operational costs detected, auto-sync enabled');
      } else {
        logger.info('ℹ️ No operational costs configured, auto-sync disabled');
      }
      
    } catch (err) {
      const errorMessage = 'Gagal memuat pengaturan biaya operasional';
      setError(errorMessage);
      setHasOperationalCosts(false);
      logger.error('Error checking operational costs:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  }, []);

  // Auto-calculate when recipe data changes and operational costs are available
  const performCalculation = useCallback(async () => {
    if (!hasOperationalCosts || bahanResep.length === 0) {
      setResult(null);
      return;
    }

    setIsCalculating(true);
    setError(null);
    
    try {
      logger.info('🔄 Auto-calculating recipe HPP with operational costs');
      
      const enhancedResult = await calculateEnhancedHPP(
        bahanResep.map(bahan => ({
          nama: bahan.nama,
          jumlah: bahan.jumlah,
          satuan: bahan.satuan,
          hargaSatuan: bahan.hargaSatuan,
          totalHarga: bahan.totalHarga,
          warehouseId: bahan.warehouseId
        })),
        jumlahPorsi,
        jumlahPcsPerPorsi,
        {
          mode: 'markup',
          percentage: marginKeuntunganPersen
        },
        true // Always use app settings overhead
      );
      
      setResult(enhancedResult);
      
      // Success notification (optional, can be disabled for less noise)
      logger.success('✅ Recipe HPP auto-calculated with operational costs');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal menghitung HPP';
      setError(errorMessage);
      logger.error('Auto-calculation error:', err);
      
      // Don't show toast for automatic calculations to avoid spam
      console.error('Auto-sync calculation failed:', errorMessage);
    } finally {
      setIsCalculating(false);
    }
  }, [hasOperationalCosts, bahanResep, jumlahPorsi, jumlahPcsPerPorsi, marginKeuntunganPersen]);

  // Initialize and check operational costs on mount
  useEffect(() => {
    checkOperationalCosts();
  }, [checkOperationalCosts]);

  // Auto-calculate when data changes with debounce
  useEffect(() => {
    if (hasOperationalCosts && !isLoadingSettings) {
      const timer = setTimeout(() => {
        performCalculation();
      }, 500); // Debounce for better performance

      return () => clearTimeout(timer);
    }
  }, [performCalculation, hasOperationalCosts, isLoadingSettings]);

  // Notify parent of result changes
  useEffect(() => {
    if (onResultChange) {
      onResultChange(result);
    }
  }, [result, onResultChange]);

  const refreshCalculation = useCallback(() => {
    if (hasOperationalCosts) {
      performCalculation();
    } else {
      checkOperationalCosts();
    }
  }, [hasOperationalCosts, performCalculation, checkOperationalCosts]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    result,
    isCalculating,
    isLoadingSettings,
    error,
    hasOperationalCosts,
    isAutoSyncEnabled: hasOperationalCosts,
    refreshCalculation,
    clearError
  };
};