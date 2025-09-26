// src/components/operational-costs/hooks/useAutoSyncRecipe.ts
// 🔗 Auto-Sync Recipe Hook (Simplified Single Mode)
// Otomatis sync biaya operasional ke recipe tanpa dual mode

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { EnhancedHPPCalculationResult } from '../utils/enhancedHppCalculations';
import { 
  calculateEnhancedHPP,
  getCurrentAppSettings,
} from '../utils/enhancedHppCalculations';
import { productionOutputApi } from '../services/productionOutputApi';
import { OPERATIONAL_COST_QUERY_KEYS } from './useOperationalCostQuery';
import { logger } from '@/utils/logger';

interface AutoSyncRecipeProps {
  bahanResep: Array<{
    nama: string;
    jumlah: number;
    satuan: string;
    hargaSatuan: number;
    totalHarga: number;
    warehouseId?: string;
  }>;
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
  
  // ✅ RENDER LOOP FIX: Use refs to store stable callback references
  const onResultChangeRef = useRef(onResultChange);
  const calculationInProgressRef = useRef(false);
  
  const queryClient = useQueryClient();
  
  // Update ref when callback changes but don't trigger re-renders
  useEffect(() => {
    onResultChangeRef.current = onResultChange;
  }, [onResultChange]);

  // ✅ Subscribe to app settings changes for auto-refresh
  // OPTIMIZED: Use consistent query key and remove aggressive refetch
  const appSettingsQuery = useQuery({
    queryKey: ['app-settings'], // Use consistent key across the app
    queryFn: async () => {
      logger.debug('🔄 Fetching app settings for auto-sync recipe');
      const settings = await getCurrentAppSettings();
      logger.debug('📊 App settings fetched:', {
        overhead_per_pcs: settings?.overhead_per_pcs,
        operasional_per_pcs: settings?.operasional_per_pcs,
        target_output_monthly: settings?.target_output_monthly
      });
      return settings;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - much less aggressive
    refetchOnWindowFocus: false, // Disable aggressive refetch
    refetchInterval: false, // Disable polling - use real-time subscriptions instead
  });
  
  // ✅ Subscribe to production target changes
  // OPTIMIZED: Use consistent query key and remove aggressive refetch
  const productionTargetQuery = useQuery({
    queryKey: OPERATIONAL_COST_QUERY_KEYS.productionTarget(), // Use consistent key
    queryFn: async () => {
      const response = await productionOutputApi.getCurrentProductionTarget();
      if (response.error) {
        logger.error('❌ Error fetching production target in auto-sync:', response.error);
        return null;
      }
      logger.debug('✅ Production target fetched in auto-sync:', response.data);
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - much less aggressive
    refetchOnWindowFocus: false, // Disable aggressive refetch
  });

  // ✅ Update operational costs status from query data
  useEffect(() => {
    if (appSettingsQuery.data) {
      const settings = appSettingsQuery.data;
      const hasSettings = Boolean(
        (settings?.overhead_per_pcs && settings.overhead_per_pcs > 0) || 
        (settings?.operasional_per_pcs && settings.operasional_per_pcs > 0)
      );
      
      setHasOperationalCosts(hasSettings);
      setIsLoadingSettings(false);
      
      if (hasSettings) {
        logger.info('✅ Operational costs detected from query, auto-sync enabled');
      } else {
        logger.info('ℹ️ No operational costs in query, auto-sync disabled');
      }
    }
  }, [appSettingsQuery.data]);
  
  useEffect(() => {
    setIsLoadingSettings(appSettingsQuery.isLoading);
  }, [appSettingsQuery.isLoading]);
  
  useEffect(() => {
    if (appSettingsQuery.error) {
      const errorMessage = 'Gagal memuat pengaturan biaya operasional';
      setError(errorMessage);
      setHasOperationalCosts(false);
      logger.error('Auto-sync app settings query error:', appSettingsQuery.error);
    }
  }, [appSettingsQuery.error]);

  // Check if operational costs are available (fallback method)
  const checkOperationalCosts = useCallback(async () => {
    if (!appSettingsQuery.data && !appSettingsQuery.isLoading) {
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
          logger.info('✅ Operational costs detected via fallback, auto-sync enabled');
        } else {
          logger.info('ℹ️ No operational costs via fallback, auto-sync disabled');
        }
        
      } catch (err) {
        const errorMessage = 'Gagal memuat pengaturan biaya operasional';
        setError(errorMessage);
        setHasOperationalCosts(false);
        logger.error('Error checking operational costs fallback:', err);
      } finally {
        setIsLoadingSettings(false);
      }
    }
  }, [appSettingsQuery.data, appSettingsQuery.isLoading]);

  // ✅ RENDER LOOP FIX: Auto-calculate when recipe data changes and operational costs are available
  const performCalculation = useCallback(async () => {
    // ✅ Prevent multiple simultaneous calculations
    if (calculationInProgressRef.current) {
      logger.debug('⏳ Calculation already in progress, skipping...');
      return;
    }
    
    if (!hasOperationalCosts || bahanResep.length === 0) {
      setResult(null);
      return;
    }

    calculationInProgressRef.current = true;
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
      calculationInProgressRef.current = false;
      setIsCalculating(false);
    }
  }, [hasOperationalCosts, bahanResep, jumlahPorsi, jumlahPcsPerPorsi, marginKeuntunganPersen]);

  // Initialize and check operational costs on mount (fallback)
  useEffect(() => {
    if (!appSettingsQuery.data && !appSettingsQuery.isLoading) {
      checkOperationalCosts();
    }
  }, [checkOperationalCosts, appSettingsQuery.data, appSettingsQuery.isLoading]);

  // ✅ RENDER LOOP FIX: Auto-calculate when data changes with debounce
  useEffect(() => {
    if (hasOperationalCosts && !isLoadingSettings) {
      const timer = setTimeout(() => {
        performCalculation();
      }, 500); // Debounce for better performance

      return () => clearTimeout(timer);
    }
  }, [performCalculation, hasOperationalCosts, isLoadingSettings]);
  
  // ✅ RENDER LOOP FIX: Auto-recalculate when production target or app settings change
  useEffect(() => {
    if (hasOperationalCosts && !isLoadingSettings && 
        (productionTargetQuery.data || appSettingsQuery.data)) {
      logger.info('🎯 Production target or app settings changed, recalculating auto-sync recipe');
      
      // Debounce to avoid rapid recalculations
      const timer = setTimeout(() => {
        performCalculation();
      }, 750); // Slightly longer debounce for auto-updates
      
      return () => clearTimeout(timer);
    }
  }, [productionTargetQuery.data, appSettingsQuery.data, hasOperationalCosts, isLoadingSettings, performCalculation]);

  // ✅ RENDER LOOP FIX: Notify parent of result changes without onResultChange in deps
  useEffect(() => {
    if (onResultChangeRef.current) {
      onResultChangeRef.current(result);
    }
  }, [result]); // ✅ FIXED: Removed onResultChange from dependency array

  const refreshCalculation = useCallback(() => {
    logger.info('🔄 Manual refresh triggered - invalidating queries and recalculating');
    
    // Force refresh queries using consistent keys
    queryClient.invalidateQueries({ queryKey: ['app-settings'] });
    queryClient.invalidateQueries({ queryKey: OPERATIONAL_COST_QUERY_KEYS.productionTarget() });
    
    if (hasOperationalCosts) {
      performCalculation();
    } else {
      checkOperationalCosts();
    }
  }, [hasOperationalCosts, performCalculation, checkOperationalCosts, queryClient]);

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