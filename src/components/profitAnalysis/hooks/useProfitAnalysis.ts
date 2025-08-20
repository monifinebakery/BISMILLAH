// useProfitAnalysis.ts - Fixed Dependencies & React Error #310 with WAC Integration
// ==============================================

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

import { 
  ProfitAnalysis, 
  RealTimeProfitCalculation, 
  DateRangeFilter,
  ProfitApiResponse,
  FNBCOGSBreakdown,
  FNBLabels
} from '../types/profitAnalysis.types';
import profitAnalysisApi, { calculateProfitAnalysisDaily } from '../services/profitAnalysisApi';

// ✅ IMPORT WAC HELPERS (termasuk calculatePemakaianValue)
import { fetchBahanMap, fetchPemakaianByPeriode, calculatePemakaianValue } from '../services/profitAnalysisApi';
import { calcHPP } from '../utils/profitCalculations';
// 🍽️ Import F&B constants
import { FNB_LABELS } from '../constants/profitConstants';

// Query Keys
export const PROFIT_QUERY_KEYS = {
  analysis: (period?: string) => ['profit-analysis', 'calculation', period],
  history: (dateRange?: DateRangeFilter) => ['profit-analysis', 'history', dateRange],
  current: () => ['profit-analysis', 'current'],
  realTime: (period: string) => ['profit-analysis', 'realtime', period],
  // ✅ ADD WAC QUERY KEYS
  bahanMap: () => ['profit-analysis', 'bahan-map'],
  pemakaian: (start: string, end: string) => ['profit-analysis', 'pemakaian', start, end],
} as const;

export interface UseProfitAnalysisOptions {
  autoCalculate?: boolean;
  defaultPeriod?: string;
  enableRealTime?: boolean;
  // ✅ ADD WAC OPTIONS
  enableWAC?: boolean;
  // 🆕 Mode harian/bulanan dan rentang tanggal
  mode?: 'daily' | 'monthly';
  dateRange?: { from: Date; to: Date };
}

export interface UseProfitAnalysisReturn {
  // State
  currentAnalysis: RealTimeProfitCalculation | null;
  profitHistory: RealTimeProfitCalculation[];
  loading: boolean;
  error: string | null;
  
  // Current period management
  currentPeriod: string;
  setCurrentPeriod: (period: string) => void;
  
  // Actions
  calculateProfit: (period?: string) => Promise<boolean>;
  loadProfitHistory: (dateRange?: DateRangeFilter) => Promise<void>;
  refreshAnalysis: () => Promise<void>;
  
  // ✅ ADD WAC ACTIONS
  refreshWACData: () => Promise<void>;
  
  // 🍽️ Enhanced computed values with F&B metrics
  profitMetrics: {
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
    revenue: number;
    cogs: number;           // Effective COGS (WAC or API fallback)
    opex: number;
    // WAC specific metrics
    totalHPP: number;
    hppBreakdown: FNBCOGSBreakdown[];
  };
  
  // Utilities
  getProfitByPeriod: (period: string) => RealTimeProfitCalculation | undefined;
  isDataStale: boolean;
  lastCalculated: Date | null;
  
  // 🍽️ F&B specific utilities
  bahanMap: Record<string, any>;
  pemakaian: any[];
  labels: FNBLabels;
}

export const useProfitAnalysis = (
  options: UseProfitAnalysisOptions = {}
): UseProfitAnalysisReturn => {
  const {
    autoCalculate = true,
    defaultPeriod = new Date().toISOString().slice(0, 7), // Safe default
    enableRealTime = true,
    // ✅ ADD WAC OPTION DEFAULT
    enableWAC = true,
    mode = 'monthly',
    dateRange
  } = options;

  const queryClient = useQueryClient();
  
  // Local state
  const [currentPeriod, setCurrentPeriodState] = useState(defaultPeriod);
  const [profitHistory, setProfitHistory] = useState<RealTimeProfitCalculation[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ MAIN QUERY: Current analysis (supports monthly or daily)
  const currentAnalysisQuery = useQuery({
    queryKey: mode === 'daily'
      ? ['profit-analysis','daily', dateRange?.from?.toISOString(), dateRange?.to?.toISOString()]
      : PROFIT_QUERY_KEYS.realTime(currentPeriod),
    queryFn: async () => {
      try {
        if (mode === 'daily') {
          const from = dateRange?.from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
          const to = dateRange?.to ?? new Date();
          logger.info('🔄 Fetching daily profit analysis:', { from, to });
          const daily = await calculateProfitAnalysisDaily(from, to);
          if (!daily.success) throw new Error(daily.error || 'Failed daily analysis');
          // For currentAnalysis, pick the last day; keep full list in history state below
          const last = (daily.data || []).slice(-1)[0] ?? null;
          setProfitHistory(daily.data || []);
          return last;
        }
        logger.info('🔄 Fetching profit analysis for period:', currentPeriod);
        const response = await profitAnalysisApi.calculateProfitAnalysis(currentPeriod);
        if (response.error) {
          throw new Error(response.error);
        }
        logger.success('✅ Profit analysis completed:', {
          period: currentPeriod,
          revenue: response.data?.revenue_data?.total || 0,
          calculatedAt: response.data?.calculated_at
        });
        return response.data;
      } catch (err) {
        logger.error('❌ Query error:', err);
        throw err;
      }
    },
    enabled: mode === 'daily' ? Boolean(autoCalculate) : Boolean(currentPeriod && autoCalculate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: enableRealTime,
    retry: 2,
  });

  // ✅ WAC QUERIES: Bahan map and pemakaian data
  const bahanMapQuery = useQuery({
    queryKey: PROFIT_QUERY_KEYS.bahanMap(),
    queryFn: fetchBahanMap,
    enabled: enableWAC,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const pemakaianQuery = useQuery({
    queryKey: PROFIT_QUERY_KEYS.pemakaian(currentPeriod, currentPeriod),
    queryFn: async () => {
      // Pastikan format periode valid (YYYY-MM), fallback ke bulan berjalan jika tidak
      let period = currentPeriod;
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
        const now = new Date();
        period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      }

      const start = `${period}-01`;
      const endDate = new Date(`${period}-01`);
      const end = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];
      return fetchPemakaianByPeriode(start, end);
    },
    enabled: enableWAC && Boolean(currentPeriod),
    staleTime: 60 * 1000, // 1 minute
  });

  // ✅ MUTATION: Manual calculation
  const calculateProfitMutation = useMutation({
    mutationFn: async (period: string) => {
      const response = await profitAnalysisApi.calculateProfitAnalysis(period);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data, period) => {
      logger.info('✅ Manual profit calculation successful:', { period });
      toast.success(`Analisis profit untuk ${period} berhasil dihitung`);
      
      // Update query cache
      queryClient.setQueryData(PROFIT_QUERY_KEYS.realTime(period), data);
      queryClient.invalidateQueries({ queryKey: PROFIT_QUERY_KEYS.current() });
    },
    onError: (error: Error) => {
      logger.error('❌ Manual profit calculation error:', error);
      setError(error.message);
      toast.error(`Gagal menghitung profit: ${error.message}`);
    },
  });

  // ✅ FIX #1: Extract primitive values first to avoid nested object references
  const currentData = currentAnalysisQuery.data;
  const revenue = currentData?.revenue_data?.total ?? 0;
  const cogs = currentData?.cogs_data?.total ?? 0;
  const opex = currentData?.opex_data?.total ?? 0;
  const calculatedAt = currentData?.calculated_at ?? null;

  // ✅ WAC CALCULATION
  const { totalHPP, hppBreakdown } = useMemo(() => {
    if (bahanMapQuery.data && pemakaianQuery.data) {
      try {
        const res = calcHPP(pemakaianQuery.data, bahanMapQuery.data);
        return {
          totalHPP: res.totalHPP,
          hppBreakdown: res.breakdown
        };
      } catch (err) {
        logger.error('Error calculating HPP:', err);
        return {
          totalHPP: 0,
          hppBreakdown: []
        };
      }
    }
    return {
      totalHPP: 0,
      hppBreakdown: []
    };
  }, [bahanMapQuery.data, pemakaianQuery.data]);

  // 🍽️ F&B LABELS - User-friendly terminology
  const labels: FNBLabels = useMemo(() => {
    const hasWAC = totalHPP > 0;
    
    return {
      // Revenue labels
      revenueLabel: FNB_LABELS.revenue.title,
      revenueHint: FNB_LABELS.revenue.hint,
      
      // COGS labels (Modal Bahan Baku)
      cogsLabel: hasWAC ? FNB_LABELS.wac.title : FNB_LABELS.cogs.title,
      cogsHint: hasWAC ? FNB_LABELS.wac.hint : FNB_LABELS.cogs.hint,
      
      // OPEX labels
      opexLabel: FNB_LABELS.opex.title,
      opexHint: FNB_LABELS.opex.hint,
      
      // Profit labels
      grossProfitLabel: FNB_LABELS.grossProfit.title,
      grossProfitHint: FNB_LABELS.grossProfit.hint,
      netProfitLabel: FNB_LABELS.netProfit.title,
      netProfitHint: FNB_LABELS.netProfit.hint,
      
      // WAC specific (backward compatibility)
      hppLabel: hasWAC ? FNB_LABELS.wac.short : FNB_LABELS.cogs.short,
      hppHint: hasWAC ? FNB_LABELS.wac.hint : FNB_LABELS.cogs.hint,
      wacActiveLabel: hasWAC ? 'WAC Aktif' : undefined
    };
  }, [totalHPP]);

  // ✅ FIX #2: Use extracted primitive values in useMemo dependencies
  const profitMetrics = useMemo(() => {
    if (!currentData) {
      return {
        grossProfit: 0,
        netProfit: 0,
        grossMargin: 0,
        netMargin: 0,
        revenue: 0,
        cogs: 0,
        opex: 0,
        // WAC metrics
        totalHPP: 0,
        hppBreakdown: [] as FNBCOGSBreakdown[]
      };
    }

    try {
      // ✅ Pakai totalHPP (WAC) jika tersedia; fallback ke cogs dari kalkulasi lama
      const effectiveCogs = totalHPP > 0 ? totalHPP : cogs;
      const grossProfit = revenue - effectiveCogs;
      const netProfit = grossProfit - opex;
      const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      return {
        grossProfit,
        netProfit,
        grossMargin,
        netMargin,
        revenue,
        cogs: effectiveCogs,
        opex,
        // WAC metrics with F&B breakdown
        totalHPP,
        hppBreakdown: hppBreakdown.map((item): FNBCOGSBreakdown => ({
          item_id: item.id,
          item_name: item.nama,
          category: 'Bahan Makanan Utama', // Default category, could be enhanced
          quantity_used: item.qty,
          unit: 'unit', // Default unit, could be enhanced
          unit_price: item.price,
          total_cost: item.hpp,
          percentage: totalHPP > 0 ? (item.hpp / totalHPP) * 100 : 0,
          wac_price: item.price,
          is_expensive: item.hpp > 100000 // > 100k considered expensive
        }))
      };
    } catch (err) {
      logger.error('Error calculating profit metrics:', err);
      return {
        grossProfit: 0,
        netProfit: 0,
        grossMargin: 0,
        netMargin: 0,
        revenue: 0,
        cogs: 0,
        opex: 0,
        // WAC metrics on error
        totalHPP: 0,
        hppBreakdown: [] as FNBCOGSBreakdown[]
      };
    }
  }, [revenue, cogs, opex, currentData, totalHPP, hppBreakdown]); // ✅ Sekarang menggunakan primitive value dan data WAC

  // ✅ ACTIONS
  const calculateProfit = useCallback(async (period?: string): Promise<boolean> => {
    const targetPeriod = period || currentPeriod;
    
    try {
      setError(null);
      if (mode === 'daily') {
        const from = dateRange?.from ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const to = dateRange?.to ?? new Date();
        const res = await calculateProfitAnalysisDaily(from, to);
        if (!res.success) throw new Error(res.error || 'Failed daily calculate');
        setProfitHistory(res.data || []);
        return true;
      }
      await calculateProfitMutation.mutateAsync(targetPeriod);
      return true;
    } catch (error) {
      logger.error('❌ Calculate profit failed:', error);
      return false;
    }
  }, [currentPeriod, calculateProfitMutation]);

  const loadProfitHistory = useCallback(async (dateRange?: DateRangeFilter) => {
    try {
      setError(null);
      logger.info('🔄 Loading profit history:', dateRange);
      
      const response = await profitAnalysisApi.getProfitHistory(
        dateRange || {
          from: new Date(new Date().getFullYear(), 0, 1),
          to: new Date(),
          period_type: 'monthly'
        }
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setProfitHistory(response.data || []);
      logger.success('✅ Profit history loaded:', (response.data || []).length, 'periods');
      
    } catch (error) {
      logger.error('❌ Load profit history failed:', error);
      setError(error instanceof Error ? error.message : 'Gagal memuat riwayat profit');
      toast.error('Gagal memuat riwayat profit');
    }
  }, []); // No dependencies needed

  const refreshAnalysis = useCallback(async () => {
    logger.info('🔄 Refreshing profit analysis');
    try {
      await currentAnalysisQuery.refetch();
    } catch (error) {
      logger.error('❌ Refresh failed:', error);
    }
  }, [currentAnalysisQuery]);

  // ✅ WAC ACTION: Refresh WAC data
  const refreshWACData = useCallback(async () => {
    logger.info('🔄 Refreshing WAC data');
    try {
      await Promise.all([
        bahanMapQuery.refetch(),
        pemakaianQuery.refetch()
      ]);
      toast.success('Data WAC berhasil diperbarui');
    } catch (error) {
      logger.error('❌ Refresh WAC failed:', error);
      toast.error('Gagal memperbarui data WAC');
    }
  }, [bahanMapQuery, pemakaianQuery]);

  // ✅ UTILITIES
  const getProfitByPeriod = useCallback((period: string) => {
    return profitHistory.find(p => p.period === period);
  }, [profitHistory]);

  const setCurrentPeriod = useCallback((period: string) => {
    logger.info('📅 Changing current period:', period);
    setCurrentPeriodState(period);
  }, []);

  // ✅ FIX #3: Use primitive calculatedAt value
  const isDataStale = useMemo(() => {
    if (!calculatedAt) return true;
    
    try {
      const calculatedAtDate = new Date(calculatedAt);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return calculatedAtDate < fiveMinutesAgo;
    } catch (err) {
      logger.error('Error checking data freshness:', err);
      return true;
    }
  }, [calculatedAt]); // ✅ Menggunakan nilai primitif string

  // ✅ FIX #4: Memoize the Date object creation to avoid re-creation on every render
  const lastCalculated = useMemo(() => {
    if (!calculatedAt) return null;
    
    try {
      return new Date(calculatedAt);
    } catch (err) {
      logger.error('Error parsing calculated_at:', err);
      return null;
    }
  }, [calculatedAt]); // ✅ Menggunakan nilai primitif string

  // ✅ AUTO-LOAD HISTORY on mount
  useEffect(() => {
    if (!autoCalculate) return;
    if (mode === 'daily') {
      // Profit history already set by daily fetch; no need to load trend
      return;
    }
    loadProfitHistory();
  }, [autoCalculate, loadProfitHistory, mode]);

  return {
    // State
    currentAnalysis: currentData || null,
    profitHistory,
    loading: currentAnalysisQuery.isLoading || calculateProfitMutation.isPending || 
             bahanMapQuery.isLoading || pemakaianQuery.isLoading,
    error: error || currentAnalysisQuery.error?.message || 
           bahanMapQuery.error?.message || pemakaianQuery.error?.message || null,
    
    // Period management
    currentPeriod,
    setCurrentPeriod,
    
    // Actions
    calculateProfit,
    loadProfitHistory,
    refreshAnalysis,
    // ✅ INCLUDE WAC ACTION
    refreshWACData,
    
    // Computed values
    profitMetrics,
    
    // Utilities
    getProfitByPeriod,
    isDataStale,
    lastCalculated,
    
    // ✅ INCLUDE WAC UTILITIES
    bahanMap: bahanMapQuery.data ?? {},
    pemakaian: pemakaianQuery.data ?? [],
    labels
  };
};