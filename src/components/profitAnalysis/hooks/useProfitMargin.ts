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
  ProfitChartData,
  MaterialUsageLog,
  ProductionRecord
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
// ✅ MAIN HOOK
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

  // Query untuk profit margin analysis
  const { data, isLoading, error: queryError } = useQuery({
    queryKey: profitMarginQueryKeys.analysis(period),
    queryFn: async () => {
      logger.debug('Fetching profit margin data', { period });
      const response = await profitAnalysisApi.calculateProfitMargin(period);
      
      if (!response.success || !response.data) {
        logger.error('Profit margin query failed', { error: response.error });
        throw new Error(response.error || 'Gagal menghitung profit margin');
      }

      // Validasi response data
      if (!response.data.profitMarginData || typeof response.data.profitMarginData.revenue !== 'number') {
        logger.error('Invalid profit margin data received', { data: response.data });
        throw new Error('Data profit margin tidak valid');
      }

      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 menit
    retry: 2,
    retryDelay: 1000
  });

  // Query untuk dashboard summary
  const { data: dashboardData } = useQuery({
    queryKey: profitMarginQueryKeys.dashboard(),
    queryFn: async () => {
      const response = await profitAnalysisApi.getDashboardSummary();
      if (!response.success || !response.data) {
        logger.warn('Dashboard summary query failed', { error: response.error });
        throw new Error(response.error || 'Gagal memuat dashboard summary');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 menit
    enabled: !!period
  });

  // Mutation untuk perhitungan ulang
  const calculateMutation = useMutation({
    mutationFn: async () => {
      const response = await profitAnalysisApi.calculateProfitMargin(period);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Gagal menghitung profit margin');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profitMarginQueryKeys.analysis(period), data);
      logger.info('Profit margin recalculated successfully', { period });
    },
    onError: (error: Error) => {
      logger.error('Recalculation failed', { error });
      setError(error);
    }
  });

  // Mutation untuk perbandingan periode
  const compareMutation = useMutation({
    mutationFn: async (previousPeriod: DatePeriod) => {
      const response = await profitAnalysisApi.compareProfitMargins(period, previousPeriod);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Gagal membandingkan profit margin');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profitMarginQueryKeys.comparison(period, period), data);
      logger.info('Profit margin comparison successful', { currentPeriod: period });
    },
    onError: (error: Error) => {
      logger.error('Comparison failed', { error });
      setError(error);
    }
  });

  // Mutation untuk trend analysis
  const trendMutation = useMutation({
    mutationFn: async (periods: DatePeriod[]) => {
      const response = await profitAnalysisApi.getProfitTrend(periods);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Gagal memuat trend profit');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profitMarginQueryKeys.trend([period]), data);
      logger.info('Profit trend fetched successfully', { periodsCount: data.length });
    },
    onError: (error: Error) => {
      logger.error('Trend analysis failed', { error });
      setError(error);
    }
  });

  // Mutation untuk export
  const exportMutation = useMutation({
    mutationFn: async ({ format, data }: { format: 'pdf' | 'excel' | 'csv'; data: ProfitAnalysisResult }) => {
      const response = await profitAnalysisApi.exportProfitAnalysis(data, format);
      if (!response.success || !response.data) {
        throw new Error(response.error || `Gagal mengekspor laporan sebagai ${format}`);
      }
      return response.data;
    },
    onSuccess: (_data, variables) => {
      logger.info('Export successful', { format: variables.format });
    },
    onError: (error: Error, variables) => {
      logger.error('Export failed', { format: variables.format, error });
      setError(error);
    }
  });

  // Prepare chart data
  const keyMetrics = data ? prepareProfitChartData([data]) : null;

  // Handle calculate profit
  const calculateProfit = useCallback(async () => {
    setError(null);
    await calculateMutation.mutateAsync();
  }, [calculateMutation]);

  // Handle compare periods
  const comparePeriods = useCallback(async (previousPeriod: DatePeriod) => {
    setError(null);
    return await compareMutation.mutateAsync(previousPeriod);
  }, [compareMutation]);

  // Handle get trend
  const getTrend = useCallback(async (periods: DatePeriod[]) => {
    setError(null);
    return await trendMutation.mutateAsync(periods);
  }, [trendMutation]);

  // Handle export
  const exportAnalysis = useCallback(async (format: 'pdf' | 'excel' | 'csv', data: ProfitAnalysisResult) => {
    setError(null);
    return await exportMutation.mutateAsync({ format, data });
  }, [exportMutation]);

  // Effect untuk log error
  useEffect(() => {
    if (queryError) {
      logger.error('Profit margin query error', { error: queryError });
      setError(queryError);
    }
  }, [queryError]);

  return {
    profitData: data || null,
    keyMetrics,
    isLoading: isLoading || calculateMutation.isLoading,
    error,
    calculateProfit,
    comparePeriods,
    getTrend,
    exportAnalysis
  };
};

// ===========================================
// ✅ CONFIG HOOK
// ===========================================

interface ProfitConfigHook {
  config: {
    categoryMapping: CategoryMapping;
    defaultPeriod: 'monthly' | 'quarterly' | 'yearly';
    autoCalculate: boolean;
  } | null;
  isLoading: boolean;
  error: Error | null;
  saveConfig: (config: {
    categoryMapping: CategoryMapping;
    defaultPeriod: 'monthly' | 'quarterly' | 'yearly';
    autoCalculate: boolean;
  }) => Promise<void>;
}

export const useProfitConfig = (): ProfitConfigHook => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: profitMarginQueryKeys.config(),
    queryFn: async () => {
      const response = await profitAnalysisApi.loadProfitConfig();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Gagal memuat konfigurasi profit');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 60, // 1 jam
  });

  const saveMutation = useMutation({
    mutationFn: async (config: {
      categoryMapping: CategoryMapping;
      defaultPeriod: 'monthly' | 'quarterly' | 'yearly';
      autoCalculate: boolean;
    }) => {
      const response = await profitAnalysisApi.saveProfitConfig(config);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Gagal menyimpan konfigurasi profit');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(profitMarginQueryKeys.config(), data);
      logger.info('Profit config saved successfully');
    },
    onError: (error: Error) => {
      logger.error('Failed to save profit config', { error });
      setError(error);
    }
  });

  const saveConfig = useCallback(async (config: {
    categoryMapping: CategoryMapping;
    defaultPeriod: 'monthly' | 'quarterly' | 'yearly';
    autoCalculate: boolean;
  }) => {
    setError(null);
    await saveMutation.mutateAsync(config);
  }, [saveMutation]);

  useEffect(() => {
    if (queryError) {
      logger.error('Profit config query error', { error: queryError });
      setError(queryError);
    }
  }, [queryError]);

  return {
    config: data || null,
    isLoading,
    error,
    saveConfig
  };
};

// ===========================================
// ✅ MATERIAL USAGE HOOK
// ===========================================

interface MaterialUsageHook {
  materialUsage: any | null;
  isLoading: boolean;
  error: Error | null;
  fetchMaterialUsage: (period: DatePeriod) => Promise<void>;
}

export const useMaterialUsage = (): MaterialUsageHook => {
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);
  const [period, setPeriod] = useState<DatePeriod | null>(null);

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['materialUsage', period],
    queryFn: async () => {
      if (!period) return null;
      const response = await profitAnalysisApi.getMaterialUsageSummary(period);
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Gagal memuat ringkasan material usage');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 menit
    enabled: !!period
  });

  const fetchMaterialUsage = useCallback(async (newPeriod: DatePeriod) => {
    setError(null);
    setPeriod(newPeriod);
    await queryClient.invalidateQueries(['materialUsage', newPeriod]);
  }, [queryClient]);

  useEffect(() => {
    if (queryError) {
      logger.error('Material usage query error', { error: queryError });
      setError(queryError);
    }
  }, [queryError]);

  return {
    materialUsage: data || null,
    isLoading,
    error,
    fetchMaterialUsage
  };
};

// ===========================================
// ✅ DEFAULT EXPORTS
// ===========================================

export default {
  useProfitMargin,
  useProfitConfig,
  useMaterialUsage
};