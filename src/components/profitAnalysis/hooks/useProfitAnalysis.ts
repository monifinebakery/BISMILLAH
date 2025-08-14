// useProfitAnalysis.ts - Fixed Dependencies
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

// Query Keys
export const PROFIT_QUERY_KEYS = {
  analysis: (period?: string) => ['profit-analysis', 'calculation', period],
  history: (dateRange?: DateRangeFilter) => ['profit-analysis', 'history', dateRange],
  current: () => ['profit-analysis', 'current'],
  realTime: (period: string) => ['profit-analysis', 'realtime', period],
} as const;

export interface UseProfitAnalysisOptions {
  autoCalculate?: boolean;
  defaultPeriod?: string;
  enableRealTime?: boolean;
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
    defaultPeriod = new Date().toISOString().slice(0, 7), // Safe default
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
      try {
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
    enabled: Boolean(currentPeriod && autoCalculate),
    staleTime: 5 * 60 * 1000, // 5 minutes
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

  // ✅ COMPUTED VALUES: Profit metrics - Fixed dependencies
  const profitMetrics = useMemo(() => {
    const data = currentAnalysisQuery.data;
    
    if (!data) {
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

    try {
      const revenue = data.revenue_data?.total || 0;
      const cogs = data.cogs_data?.total || 0;
      const opex = data.opex_data?.total || 0;
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
    } catch (err) {
      logger.error('Error calculating profit metrics:', err);
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
  }, [
    currentAnalysisQuery.data?.revenue_data?.total,
    currentAnalysisQuery.data?.cogs_data?.total,
    currentAnalysisQuery.data?.opex_data?.total
  ]); // Only depend on specific primitive values

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

  // ✅ UTILITIES
  const getProfitByPeriod = useCallback((period: string) => {
    return profitHistory.find(p => p.period === period);
  }, [profitHistory]);

  const setCurrentPeriod = useCallback((period: string) => {
    logger.info('📅 Changing current period:', period);
    setCurrentPeriodState(period);
  }, []);

  // ✅ DATA FRESHNESS - Fixed dependencies
  const isDataStale = useMemo(() => {
    const data = currentAnalysisQuery.data;
    if (!data?.calculated_at) return true;
    
    try {
      const calculatedAt = new Date(data.calculated_at);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return calculatedAt < fiveMinutesAgo;
    } catch (err) {
      logger.error('Error checking data freshness:', err);
      return true;
    }
  }, [currentAnalysisQuery.data?.calculated_at]); // Only depend on calculated_at string

  const lastCalculated = useMemo(() => {
    const data = currentAnalysisQuery.data;
    if (!data?.calculated_at) return null;
    
    try {
      return new Date(data.calculated_at);
    } catch (err) {
      logger.error('Error parsing calculated_at:', err);
      return null;
    }
  }, [currentAnalysisQuery.data?.calculated_at]); // Only depend on calculated_at string

  // ✅ AUTO-LOAD HISTORY on mount - Fixed dependencies
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