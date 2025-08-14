// 1. useProfitAnalysis.ts - Main hook
// ==============================================

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

import { 
  ProfitAnalysis, 
  RealTimeProfitCalculation, 
  DateRangeFilter,
  ProfitApiResponse 
} from '../types/profitAnalysis.types';
import profitAnalysisApi from '../services/profitAnalysisApi';
import { PROFIT_CONSTANTS } from '../constants/profitConstants';

// Query Keys
export const PROFIT_QUERY_KEYS = {
  analysis: (period?: string) => ['profit-analysis', 'calculation', period],
  history: (dateRange?: DateRangeFilter) => ['profit-analysis', 'history', dateRange],
  current: () => ['profit-analysis', 'current'],
  realTime: (period: string) => ['profit-analysis', 'realtime', period],
} as const;

interface UseProfitAnalysisOptions {
  autoCalculate?: boolean;
  defaultPeriod?: string;
  enableRealTime?: boolean;
}

interface UseProfitAnalysisReturn {
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
  
  // Computed values
  profitMetrics: {
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
    revenue: number;
    cogs: number;
    opex: number;
  };
  
  // Utilities
  getProfitByPeriod: (period: string) => RealTimeProfitCalculation | undefined;
  isDataStale: boolean;
  lastCalculated: Date | null;
}

export const useProfitAnalysis = (
  options: UseProfitAnalysisOptions = {}
): UseProfitAnalysisReturn => {
  const {
    autoCalculate = true,
    defaultPeriod = PROFIT_CONSTANTS.DEFAULT_PERIODS.CURRENT_MONTH,
    enableRealTime = true
  } = options;

  const queryClient = useQueryClient();
  
  // Local state
  const [currentPeriod, setCurrentPeriodState] = useState(defaultPeriod);
  const [profitHistory, setProfitHistory] = useState<RealTimeProfitCalculation[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ✅ MAIN QUERY: Current period analysis
  const currentAnalysisQuery = useQuery({
    queryKey: PROFIT_QUERY_KEYS.realTime(currentPeriod),
    queryFn: async () => {
      logger.info('🔄 Fetching profit analysis for period:', currentPeriod);
      const response = await profitAnalysisApi.calculateProfitAnalysis(currentPeriod);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      logger.success('✅ Profit analysis completed:', {
        period: currentPeriod,
        revenue: response.data.revenue_data.total,
        calculatedAt: response.data.calculated_at
      });
      
      return response.data;
    },
    enabled: !!currentPeriod && autoCalculate,
    staleTime: 5 * 60 * 1000, // 5 minutes - profit data changes frequently
    refetchOnWindowFocus: enableRealTime,
    retry: 2,
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
      logger.info('✅ Manual profit calculation successful:', { period, data });
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

  // ✅ COMPUTED VALUES: Profit metrics
  const profitMetrics = useMemo(() => {
    if (!currentAnalysisQuery.data) {
      return {
        grossProfit: 0,
        netProfit: 0,
        grossMargin: 0,
        netMargin: 0,
        revenue: 0,
        cogs: 0,
        opex: 0
      };
    }

    const { revenue_data, cogs_data, opex_data } = currentAnalysisQuery.data;
    const revenue = revenue_data.total;
    const cogs = cogs_data.total;
    const opex = opex_data.total;
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
      revenue,
      cogs,
      opex
    };
  }, [currentAnalysisQuery.data]);

  // ✅ ACTIONS
  const calculateProfit = useCallback(async (period?: string): Promise<boolean> => {
    const targetPeriod = period || currentPeriod;
    
    try {
      setError(null);
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
          from: new Date(new Date().getFullYear(), 0, 1), // Start of year
          to: new Date(),
          period_type: 'monthly'
        }
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setProfitHistory(response.data);
      logger.success('✅ Profit history loaded:', response.data.length, 'periods');
      
    } catch (error) {
      logger.error('❌ Load profit history failed:', error);
      setError(error instanceof Error ? error.message : 'Gagal memuat riwayat profit');
      toast.error('Gagal memuat riwayat profit');
    }
  }, []);

  const refreshAnalysis = useCallback(async () => {
    logger.info('🔄 Refreshing profit analysis');
    await currentAnalysisQuery.refetch();
  }, [currentAnalysisQuery]);

  // ✅ UTILITIES
  const getProfitByPeriod = useCallback((period: string) => {
    return profitHistory.find(p => p.period === period);
  }, [profitHistory]);

  const setCurrentPeriod = useCallback((period: string) => {
    logger.info('📅 Changing current period:', currentPeriod, '->', period);
    setCurrentPeriodState(period);
  }, [currentPeriod]);

  // ✅ DATA FRESHNESS
  const isDataStale = useMemo(() => {
    if (!currentAnalysisQuery.data?.calculated_at) return true;
    
    const calculatedAt = new Date(currentAnalysisQuery.data.calculated_at);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return calculatedAt < fiveMinutesAgo;
  }, [currentAnalysisQuery.data?.calculated_at]);

  const lastCalculated = useMemo(() => {
    return currentAnalysisQuery.data?.calculated_at 
      ? new Date(currentAnalysisQuery.data.calculated_at)
      : null;
  }, [currentAnalysisQuery.data?.calculated_at]);

  // ✅ AUTO-LOAD HISTORY on mount
  useEffect(() => {
    if (autoCalculate) {
      loadProfitHistory();
    }
  }, [autoCalculate, loadProfitHistory]);

  return {
    // State
    currentAnalysis: currentAnalysisQuery.data || null,
    profitHistory,
    loading: currentAnalysisQuery.isLoading || calculateProfitMutation.isPending,
    error: error || currentAnalysisQuery.error?.message || null,
    
    // Period management
    currentPeriod,
    setCurrentPeriod,
    
    // Actions
    calculateProfit,
    loadProfitHistory,
    refreshAnalysis,
    
    // Computed values
    profitMetrics,
    
    // Utilities
    getProfitByPeriod,
    isDataStale,
    lastCalculated,
  };
};