// src/hooks/useProfitMargin.ts
// ✅ FIXED VERSION - Proper null checks and error handling

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

// API imports
import profitAnalysisApi, { createDatePeriods } from '../services/profitAnalysisApi';

// Type imports
import {
  ProfitAnalysisResult,
  ProfitAnalysisApiResponse,
  ProfitMarginData,
  DatePeriod,
  CategoryMapping,
  DEFAULT_CATEGORY_MAPPING,
  ProfitChartData
} from '../types';

import { prepareProfitChartData } from '../utils/profitCalculations';

// ===========================================
// ✅ QUERY KEYS
// ===========================================

export const profitMarginQueryKeys = {
  all: ['profitMargin'] as const,
  analysis: (period: DatePeriod) => [...profitMarginQueryKeys.all, 'analysis', period] as const,
  comparison: (current: DatePeriod, previous?: DatePeriod) => 
    [...profitMarginQueryKeys.all, 'comparison', current, previous] as const,
  trend: (periods: DatePeriod[]) => [...profitMarginQueryKeys.all, 'trend', periods] as const,
  dashboard: () => [...profitMarginQueryKeys.all, 'dashboard'] as const,
  config: () => [...profitMarginQueryKeys.all, 'config'] as const
};

// ===========================================
// ✅ SAFE DATA VALIDATORS
// ===========================================

const isValidProfitData = (data: any): data is ProfitAnalysisResult => {
  return (
    data &&
    typeof data === 'object' &&
    data.profitMarginData &&
    typeof data.profitMarginData.revenue === 'number' &&
    !isNaN(data.profitMarginData.revenue)
  );
};

const isValidDashboardData = (data: any): boolean => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.revenue === 'number' &&
    !isNaN(data.revenue)
  );
};

// ===========================================
// ✅ MAIN HOOK - FIXED
// ===========================================

interface ProfitMarginHook {
  profitData: ProfitAnalysisResult | null;
  keyMetrics: ProfitChartData | null;
  isLoading: boolean;
  error: Error | null;
  calculateProfit: () => Promise<void>;
  comparePeriods: (previousPeriod: DatePeriod) => Promise<ProfitAnalysisApiResponse<any>>;
  getTrend: (periods: DatePeriod[]) => Promise<ProfitAnalysisApiResponse<ProfitAnalysisResult[]>>;
  exportAnalysis: (format: 'pdf' | 'excel' | 'csv', data: ProfitAnalysisResult) => Promise<ProfitAnalysisApiResponse<any>>;
}

export const useProfitMargin = (period: DatePeriod): ProfitMarginHook => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  // ✅ SAFE Query untuk profit margin analysis
  const { data, isLoading, error: queryError } = useQuery({
    queryKey: profitMarginQueryKeys.analysis(period),
    queryFn: async () => {
      try {
        logger.debug('Fetching profit margin data', { period });
        const response = await profitAnalysisApi.calculateProfitMargin(period);
        
        // ✅ SAFE: Check response structure
        if (!response || typeof response !== 'object') {
          throw new Error('Invalid response format');
        }
        
        if (!response.success) {
          throw new Error(response.error || 'API call failed');
        }

        // ✅ SAFE: Validate response data
        if (!isValidProfitData(response.data)) {
          logger.error('Invalid profit margin data received', { 
            responseData: response.data,
            hasData: !!response.data,
            hasProfitMarginData: response.data?.profitMarginData,
            revenueType: response.data?.profitMarginData ? typeof response.data.profitMarginData.revenue : 'undefined'
          });
          throw new Error('Data profit margin tidak valid atau tidak lengkap');
        }

        logger.info('Profit margin data fetched successfully', {
          revenue: response.data.profitMarginData.revenue,
          cogs: response.data.profitMarginData.cogs,
          dataSource: response.data.cogsBreakdown?.dataSource
        });

        return response.data;
      } catch (error: any) {
        logger.error('Profit margin query failed', { error: error.message, period });
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 menit
    retry: (failureCount, error) => {
      // Don't retry on validation errors
      if (error.message.includes('tidak valid')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000,
    enabled: !!period?.from && !!period?.to
  });

  // ✅ SAFE Mutation untuk perhitungan ulang
  const calculateMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await profitAnalysisApi.calculateProfitMargin(period);
        
        if (!response?.success || !isValidProfitData(response.data)) {
          throw new Error(response?.error || 'Gagal menghitung profit margin');
        }
        
        return response.data;
      } catch (error: any) {
        logger.error('Calculate mutation failed', { error: error.message });
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profitMarginQueryKeys.analysis(period), data);
      logger.info('Profit margin recalculated successfully', { period });
    },
    onError: (error: Error) => {
      logger.error('Recalculation failed', { error: error.message });
      setError(error);
    }
  });

  // ✅ SAFE Mutation untuk perbandingan periode
  const compareMutation = useMutation({
    mutationFn: async (previousPeriod: DatePeriod) => {
      try {
        const response = await profitAnalysisApi.compareProfitMargins(period, previousPeriod);
        
        if (!response?.success || !response.data) {
          throw new Error(response?.error || 'Gagal membandingkan profit margin');
        }
        
        return response.data;
      } catch (error: any) {
        logger.error('Compare mutation failed', { error: error.message });
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profitMarginQueryKeys.comparison(period, period), data);
      logger.info('Profit margin comparison successful', { currentPeriod: period });
    },
    onError: (error: Error) => {
      logger.error('Comparison failed', { error: error.message });
      setError(error);
    }
  });

  // ✅ SAFE Mutation untuk trend analysis
  const trendMutation = useMutation({
    mutationFn: async (periods: DatePeriod[]) => {
      try {
        const response = await profitAnalysisApi.getProfitTrend(periods);
        
        if (!response?.success || !Array.isArray(response.data)) {
          throw new Error(response?.error || 'Gagal memuat trend profit');
        }
        
        return response.data;
      } catch (error: any) {
        logger.error('Trend mutation failed', { error: error.message });
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profitMarginQueryKeys.trend([period]), data);
      logger.info('Profit trend fetched successfully', { periodsCount: data.length });
    },
    onError: (error: Error) => {
      logger.error('Trend analysis failed', { error: error.message });
      setError(error);
    }
  });

  // ✅ SAFE Mutation untuk export
  const exportMutation = useMutation({
    mutationFn: async ({ format, data }: { format: 'pdf' | 'excel' | 'csv'; data: ProfitAnalysisResult }) => {
      try {
        if (!isValidProfitData(data)) {
          throw new Error('Data tidak valid untuk ekspor');
        }
        
        const response = await profitAnalysisApi.exportProfitAnalysis(data, format);
        
        if (!response?.success) {
          throw new Error(response?.error || `Gagal mengekspor laporan sebagai ${format}`);
        }
        
        return response.data;
      } catch (error: any) {
        logger.error('Export mutation failed', { error: error.message, format });
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      logger.info('Export successful', { format: variables.format });
    },
    onError: (error: Error, variables) => {
      logger.error('Export failed', { format: variables.format, error: error.message });
      setError(error);
    }
  });

  // ✅ SAFE Prepare chart data
  const keyMetrics = data && isValidProfitData(data) ? prepareProfitChartData([data]) : null;

  // ✅ SAFE Handle calculate profit
  const calculateProfit = useCallback(async () => {
    setError(null);
    await calculateMutation.mutateAsync();
  }, [calculateMutation]);

  // ✅ SAFE Handle compare periods
  const comparePeriods = useCallback(async (previousPeriod: DatePeriod) => {
    setError(null);
    return await compareMutation.mutateAsync(previousPeriod);
  }, [compareMutation]);

  // ✅ SAFE Handle get trend
  const getTrend = useCallback(async (periods: DatePeriod[]) => {
    setError(null);
    return await trendMutation.mutateAsync(periods);
  }, [trendMutation]);

  // ✅ SAFE Handle export
  const exportAnalysis = useCallback(async (format: 'pdf' | 'excel' | 'csv', data: ProfitAnalysisResult) => {
    setError(null);
    return await exportMutation.mutateAsync({ format, data });
  }, [exportMutation]);

  // ✅ SAFE Effect untuk log error
  useEffect(() => {
    if (queryError) {
      logger.error('Profit margin query error', { error: queryError.message });
      setError(queryError as Error);
    }
  }, [queryError]);

  return {
    profitData: data || null,
    keyMetrics,
    isLoading: isLoading || calculateMutation.isPending,
    error,
    calculateProfit,
    comparePeriods,
    getTrend,
    exportAnalysis
  };
};

// ===========================================
// ✅ DASHBOARD HOOK - FIXED
// ===========================================

interface ProfitDashboardHook {
  summary: {
    currentMargin: ProfitMarginData;
    alerts: any[];
  } | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export const useProfitDashboard = (): ProfitDashboardHook => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  // ✅ SAFE Query untuk dashboard summary
  const { data, isLoading, error: queryError, refetch: queryRefetch } = useQuery({
    queryKey: profitMarginQueryKeys.dashboard(),
    queryFn: async () => {
      try {
        logger.debug('Fetching dashboard summary');
        const response = await profitAnalysisApi.getDashboardSummary();
        
        // ✅ SAFE: Check response structure
        if (!response || typeof response !== 'object') {
          throw new Error('Invalid response format');
        }
        
        if (!response.success) {
          throw new Error(response.error || 'Failed to fetch dashboard summary');
        }

        // ✅ SAFE: Validate response data structure
        if (!response.data || typeof response.data !== 'object') {
          logger.warn('No dashboard data available, returning null');
          return null;
        }

        // ✅ SAFE: Check if currentMargin exists and is valid
        const currentMargin = response.data.currentMargin;
        if (!currentMargin || !isValidDashboardData(currentMargin)) {
          logger.warn('Invalid currentMargin data, creating default structure');
          
          // Return safe default structure
          return {
            currentMargin: {
              revenue: 0,
              cogs: 0,
              opex: 0,
              grossProfit: 0,
              netProfit: 0,
              grossMargin: 0,
              netMargin: 0,
              calculatedAt: new Date(),
              period: createDatePeriods.thisMonth()
            },
            alerts: []
          };
        }

        // ✅ SAFE: Extract data with fallbacks
        return {
          currentMargin: {
            revenue: Number(currentMargin.revenue) || 0,
            cogs: Number(currentMargin.cogs) || 0,
            opex: Number(currentMargin.opex) || 0,
            grossProfit: Number(currentMargin.grossProfit) || 0,
            netProfit: Number(currentMargin.netProfit) || 0,
            grossMargin: Number(currentMargin.grossMargin) || 0,
            netMargin: Number(currentMargin.netMargin) || 0,
            calculatedAt: currentMargin.calculatedAt ? new Date(currentMargin.calculatedAt) : new Date(),
            period: currentMargin.period || createDatePeriods.thisMonth()
          },
          alerts: Array.isArray(response.data.alerts) ? response.data.alerts : []
        };

      } catch (error: any) {
        logger.error('Dashboard summary query failed', { error: error.message });
        throw error;
      }
    },
    staleTime: 1000 * 60 * 10, // 10 menit
    retry: 2,
    retryDelay: 1000
  });

  // ✅ SAFE Handle refetch
  const refetch = useCallback(async () => {
    setError(null);
    await queryClient.invalidateQueries({ queryKey: profitMarginQueryKeys.dashboard() });
    await queryRefetch();
  }, [queryClient, queryRefetch]);

  // ✅ SAFE Effect untuk log error
  useEffect(() => {
    if (queryError) {
      logger.error('Dashboard summary query error', { error: queryError.message });
      setError(queryError as Error);
    }
  }, [queryError]);

  return {
    summary: data || null,
    isLoading,
    error,
    refetch
  };
};

// ===========================================
// ✅ DEFAULT EXPORTS
// ===========================================

export default {
  useProfitMargin,
  useProfitDashboard
};