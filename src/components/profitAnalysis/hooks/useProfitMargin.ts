// src/components/profitAnalysis/hooks/useProfitMargin.ts
// ✅ UPDATED PROFIT MARGIN REACT HOOK - Material Usage Integration

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

// API imports
import profitAnalysisApi, { createDatePeriods } from '../services/profitAnalysisApi';

// ✅ UPDATED: Import from consolidated types
import {
  ProfitAnalysisResult,
  ProfitMarginData,
  DatePeriod,
  CategoryMapping,
  DEFAULT_CATEGORY_MAPPING,
  ProfitChartData,
  MaterialUsageLog,
  ProductionRecord
} from '../types'; // ✅ Changed from '../types/profitAnalysis' to '../types'

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
  config: () => [...profitMarginQueryKeys.all, 'config'] as const,
  
  // ✅ NEW: Material usage specific queries
  materialUsage: (period: DatePeriod) => [...profitMarginQueryKeys.all, 'materialUsage', period] as const,
  materialSummary: (period: DatePeriod) => [...profitMarginQueryKeys.all, 'materialSummary', period] as const,
  dataQuality: () => [...profitMarginQueryKeys.all, 'dataQuality'] as const,
};

// ===========================================
// ✅ MAIN PROFIT MARGIN HOOK (UPDATED)
// ===========================================

export const useProfitMargin = (period?: DatePeriod) => {
  const queryClient = useQueryClient();
  const [categoryMapping, setCategoryMapping] = useState<CategoryMapping>(DEFAULT_CATEGORY_MAPPING);
  const [isCalculating, setIsCalculating] = useState(false);

  // Default period to current month
  const defaultPeriod = period || createDatePeriods.thisMonth();

  // ===========================================
  // ✅ MAIN PROFIT ANALYSIS QUERY (UPDATED)
  // ===========================================

  const profitAnalysisQuery = useQuery({
    queryKey: profitMarginQueryKeys.analysis(defaultPeriod),
    queryFn: async () => {
      const result = await profitAnalysisApi.calculateProfitMargin(
        defaultPeriod,
        categoryMapping
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to calculate profit margin');
      }
      
      // ✅ NEW: Log material usage data quality
      if (result.data?.cogsBreakdown) {
        logger.info('Profit analysis completed with data source:', {
          dataSource: result.data.cogsBreakdown.dataSource,
          materialUsageRecords: result.data.cogsBreakdown.actualMaterialUsage?.length || 0,
          productionRecords: result.data.cogsBreakdown.productionData?.length || 0
        });
      }
      
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    enabled: !!defaultPeriod
  });

  // ===========================================
  // ✅ NEW: MATERIAL USAGE SUMMARY HOOK
  // ===========================================

  const useMaterialUsageSummary = (targetPeriod?: DatePeriod) => {
    const summaryPeriod = targetPeriod || defaultPeriod;
    
    return useQuery({
      queryKey: profitMarginQueryKeys.materialSummary(summaryPeriod),
      queryFn: async () => {
        const result = await profitAnalysisApi.getMaterialUsageSummary(summaryPeriod);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to get material usage summary');
        }
        
        return result.data;
      },
      enabled: !!summaryPeriod,
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // ===========================================
  // ✅ UPDATED: DATA QUALITY HOOK
  // ===========================================

  const useDataQuality = () => {
    return useQuery({
      queryKey: profitMarginQueryKeys.dataQuality(),
      queryFn: async () => {
        // Check data quality across multiple sources
        const analysisResult = profitAnalysisQuery.data;
        if (!analysisResult) return null;

        const materialUsageCount = analysisResult.cogsBreakdown.actualMaterialUsage?.length || 0;
        const productionRecordsCount = analysisResult.cogsBreakdown.productionData?.length || 0;
        const dataSource = analysisResult.cogsBreakdown.dataSource;

        return {
          hasActualData: dataSource === 'actual',
          dataSource,
          materialUsageRecords: materialUsageCount,
          productionRecords: productionRecordsCount,
          dataCompleteness: materialUsageCount > 0 && productionRecordsCount > 0 ? 'complete' : 
                           materialUsageCount > 0 ? 'partial' : 'minimal',
          recommendations: generateDataQualityRecommendations(dataSource, materialUsageCount, productionRecordsCount)
        };
      },
      enabled: !!profitAnalysisQuery.data,
      staleTime: 15 * 60 * 1000, // 15 minutes
    });
  };

  // ===========================================
  // ✅ PROFIT COMPARISON HOOK (unchanged)
  // ===========================================

  const useProfitComparison = (currentPeriod: DatePeriod, previousPeriod?: DatePeriod) => {
    return useQuery({
      queryKey: profitMarginQueryKeys.comparison(currentPeriod, previousPeriod),
      queryFn: async () => {
        const result = await profitAnalysisApi.compareProfitMargins(
          currentPeriod,
          previousPeriod,
          categoryMapping
        );
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to compare profit margins');
        }
        
        return result.data;
      },
      enabled: !!currentPeriod,
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  };

  // ===========================================
  // ✅ PROFIT TREND HOOK (unchanged)
  // ===========================================

  const useProfitTrend = (periods: DatePeriod[]) => {
    return useQuery({
      queryKey: profitMarginQueryKeys.trend(periods),
      queryFn: async () => {
        const result = await profitAnalysisApi.getProfitTrend(periods, categoryMapping);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to get profit trend');
        }
        
        return result.data;
      },
      enabled: periods.length > 0,
      staleTime: 15 * 60 * 1000, // 15 minutes
    });
  };

  // ===========================================
  // ✅ DASHBOARD SUMMARY HOOK (unchanged)
  // ===========================================

  const useDashboardSummary = () => {
    return useQuery({
      queryKey: profitMarginQueryKeys.dashboard(),
      queryFn: async () => {
        const result = await profitAnalysisApi.getDashboardSummary();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to get dashboard summary');
        }
        
        return result.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 10 * 60 * 1000, // Auto-refresh every 10 minutes
    });
  };

  // ===========================================
  // ✅ CONFIGURATION HOOK (unchanged)
  // ===========================================

  const configQuery = useQuery({
    queryKey: profitMarginQueryKeys.config(),
    queryFn: async () => {
      const result = await profitAnalysisApi.loadProfitConfig();
      
      if (result.success && result.data) {
        setCategoryMapping(result.data.categoryMapping);
        return result.data;
      }
      
      return {
        categoryMapping: DEFAULT_CATEGORY_MAPPING,
        defaultPeriod: 'monthly' as const,
        autoCalculate: false
      };
    },
    staleTime: Infinity, // Config rarely changes
  });

  // ===========================================
  // ✅ MUTATIONS (unchanged but enhanced logging)
  // ===========================================

  const calculateProfitMutation = useMutation({
    mutationFn: async ({ 
      period, 
      mapping 
    }: { 
      period: DatePeriod; 
      mapping?: Partial<CategoryMapping> 
    }) => {
      setIsCalculating(true);
      
      const result = await profitAnalysisApi.calculateProfitMargin(period, mapping);
      
      if (!result.success) {
        throw new Error(result.error || 'Calculation failed');
      }
      
      // ✅ ENHANCED: Log calculation results with material usage info
      logger.info('Profit calculation completed:', {
        period: period.label,
        revenue: result.data?.profitMarginData.revenue,
        cogs: result.data?.profitMarginData.cogs,
        dataSource: result.data?.cogsBreakdown.dataSource,
        calculationTime: result.calculationTime
      });
      
      return result.data;
    },
    onSuccess: (data, variables) => {
      // Update cache
      queryClient.setQueryData(
        profitMarginQueryKeys.analysis(variables.period),
        data
      );
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: profitMarginQueryKeys.dashboard()
      });
      
      // ✅ NEW: Invalidate material usage queries
      queryClient.invalidateQueries({
        queryKey: profitMarginQueryKeys.materialSummary(variables.period)
      });
    },
    onError: (error) => {
      logger.error('Profit calculation failed:', error);
    },
    onSettled: () => {
      setIsCalculating(false);
    }
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (config: {
      categoryMapping: CategoryMapping;
      defaultPeriod: 'monthly' | 'quarterly' | 'yearly';
      autoCalculate: boolean;
    }) => {
      const result = await profitAnalysisApi.saveProfitConfig(config);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save configuration');
      }
      
      return result.data;
    },
    onSuccess: (_, variables) => {
      setCategoryMapping(variables.categoryMapping);
      
      // Update config cache
      queryClient.setQueryData(profitMarginQueryKeys.config(), variables);
      
      // Invalidate all profit queries to recalculate with new mapping
      queryClient.invalidateQueries({
        queryKey: profitMarginQueryKeys.all
      });
    }
  });

  // ===========================================
  // ✅ UPDATED CALLBACK FUNCTIONS
  // ===========================================

  const calculateProfit = useCallback(async (
    customPeriod?: DatePeriod,
    customMapping?: Partial<CategoryMapping>
  ) => {
    const targetPeriod = customPeriod || defaultPeriod;
    return calculateProfitMutation.mutateAsync({
      period: targetPeriod,
      mapping: customMapping
    });
  }, [calculateProfitMutation, defaultPeriod]);

  const refreshAnalysis = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: profitMarginQueryKeys.analysis(defaultPeriod)
    });
    
    // ✅ NEW: Also refresh material usage data
    await queryClient.invalidateQueries({
      queryKey: profitMarginQueryKeys.materialSummary(defaultPeriod)
    });
  }, [queryClient, defaultPeriod]);

  const updateCategoryMapping = useCallback((mapping: Partial<CategoryMapping>) => {
    const newMapping = { ...categoryMapping, ...mapping };
    setCategoryMapping(newMapping);
    
    // Auto-save configuration
    if (configQuery.data) {
      saveConfigMutation.mutate({
        ...configQuery.data,
        categoryMapping: newMapping
      });
    }
  }, [categoryMapping, configQuery.data, saveConfigMutation]);

  const exportAnalysis = useCallback(async (
    format: 'pdf' | 'excel' | 'csv',
    analysisData?: ProfitAnalysisResult
  ) => {
    if (!analysisData && !profitAnalysisQuery.data) {
      throw new Error('No analysis data to export');
    }
    
    const dataToExport = analysisData || profitAnalysisQuery.data!;
    const result = await profitAnalysisApi.exportProfitAnalysis(dataToExport, format);
    
    if (!result.success) {
      throw new Error(result.error || 'Export failed');
    }
    
    return result.data;
  }, [profitAnalysisQuery.data]);

  // ===========================================
  // ✅ UPDATED DERIVED DATA
  // ===========================================

  const profitData = profitAnalysisQuery.data;
  const isLoading = profitAnalysisQuery.isLoading || isCalculating;
  const error = profitAnalysisQuery.error;

  // Chart data preparation
  const chartData: ProfitChartData | null = profitData 
    ? prepareProfitChartData([profitData])
    : null;

  // ✅ ENHANCED: Key metrics with material usage info
  const keyMetrics = profitData ? {
    revenue: profitData.profitMarginData.revenue,
    grossMargin: profitData.profitMarginData.grossMargin,
    netMargin: profitData.profitMarginData.netMargin,
    cogs: profitData.profitMarginData.cogs,
    opex: profitData.profitMarginData.opex,
    insights: profitData.insights,
    
    // ✅ NEW: Material usage metrics
    dataSource: profitData.cogsBreakdown.dataSource,
    hasActualMaterialData: profitData.cogsBreakdown.dataSource === 'actual',
    materialUsageRecords: profitData.cogsBreakdown.actualMaterialUsage?.length || 0,
    productionRecords: profitData.cogsBreakdown.productionData?.length || 0,
    materialCostBreakdown: {
      totalMaterialCost: profitData.cogsBreakdown.totalMaterialCost,
      totalDirectLabor: profitData.cogsBreakdown.totalDirectLaborCost,
      manufacturingOverhead: profitData.cogsBreakdown.manufacturingOverhead
    }
  } : null;

  // ===========================================
  // ✅ UPDATED RETURN OBJECT
  // ===========================================

  return {
    // Data
    profitData,
    keyMetrics,
    chartData,
    categoryMapping,
    config: configQuery.data,
    
    // State
    isLoading,
    isCalculating,
    error,
    
    // Actions
    calculateProfit,
    refreshAnalysis,
    updateCategoryMapping,
    exportAnalysis,
    
    // ✅ UPDATED: Nested hooks with material usage
    useProfitComparison,
    useProfitTrend,
    useDashboardSummary,
    useMaterialUsageSummary, // ✅ NEW
    useDataQuality, // ✅ NEW
    
    // Query objects for advanced usage
    profitAnalysisQuery,
    configQuery,
    calculateProfitMutation,
    saveConfigMutation
  };
};

// ===========================================
// ✅ SPECIALIZED HOOKS (UPDATED)
// ===========================================

/**
 * Hook for dashboard widget - simplified data
 */
export const useProfitDashboard = () => {
  const { useDashboardSummary } = useProfitMargin();
  const dashboardQuery = useDashboardSummary();
  
  return {
    summary: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    error: dashboardQuery.error,
    refetch: dashboardQuery.refetch
  };
};

/**
 * Hook for profit comparison between periods
 */
export const useProfitComparison = (
  currentPeriod: DatePeriod,
  previousPeriod?: DatePeriod
) => {
  const { useProfitComparison: useComparison } = useProfitMargin();
  const comparisonQuery = useComparison(currentPeriod, previousPeriod);
  
  return {
    comparison: comparisonQuery.data,
    isLoading: comparisonQuery.isLoading,
    error: comparisonQuery.error,
    refetch: comparisonQuery.refetch
  };
};

/**
 * Hook for profit trend analysis
 */
export const useProfitTrend = (periods: DatePeriod[]) => {
  const { useProfitTrend: useTrend } = useProfitMargin();
  const trendQuery = useTrend(periods);
  
  // Generate chart-ready data
  const trendData = trendQuery.data ? prepareProfitChartData(trendQuery.data) : null;
  
  return {
    trend: trendQuery.data,
    trendData,
    isLoading: trendQuery.isLoading,
    error: trendQuery.error,
    refetch: trendQuery.refetch
  };
};

/**
 * ✅ NEW: Hook for material usage analytics
 */
export const useMaterialUsageAnalytics = (period?: DatePeriod) => {
  const { useMaterialUsageSummary, useDataQuality } = useProfitMargin(period);
  const materialSummary = useMaterialUsageSummary();
  const dataQuality = useDataQuality();
  
  return {
    summary: materialSummary.data,
    dataQuality: dataQuality.data,
    isLoading: materialSummary.isLoading || dataQuality.isLoading,
    error: materialSummary.error || dataQuality.error,
    refetch: () => {
      materialSummary.refetch();
      dataQuality.refetch();
    }
  };
};

/**
 * Hook for monthly profit analysis (common use case)
 */
export const useMonthlyProfit = (year?: number, month?: number) => {
  const targetYear = year || new Date().getFullYear();
  const targetMonth = month || new Date().getMonth();
  
  const period: DatePeriod = {
    from: new Date(targetYear, targetMonth, 1),
    to: new Date(targetYear, targetMonth + 1, 0),
    label: new Date(targetYear, targetMonth).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long'
    })
  };
  
  return useProfitMargin(period);
};

/**
 * Hook for quarterly profit analysis
 */
export const useQuarterlyProfit = (year?: number, quarter?: number) => {
  const targetYear = year || new Date().getFullYear();
  const targetQuarter = quarter || Math.floor(new Date().getMonth() / 3) + 1;
  
  const startMonth = (targetQuarter - 1) * 3;
  const period: DatePeriod = {
    from: new Date(targetYear, startMonth, 1),
    to: new Date(targetYear, startMonth + 3, 0),
    label: `Q${targetQuarter} ${targetYear}`
  };
  
  return useProfitMargin(period);
};

// ===========================================
// ✅ UTILITY FUNCTIONS (unchanged)
// ===========================================

/**
 * Create standard periods for trend analysis
 */
export const createTrendPeriods = {
  last6Months: (): DatePeriod[] => {
    const periods: DatePeriod[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      periods.push({
        from: periodStart,
        to: periodEnd,
        label: periodStart.toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short'
        })
      });
    }
    
    return periods;
  },
  
  last4Quarters: (): DatePeriod[] => {
    const periods: DatePeriod[] = [];
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    
    for (let i = 3; i >= 0; i--) {
      const quarterIndex = currentQuarter - i;
      let year = now.getFullYear();
      let quarter = quarterIndex + 1;
      
      if (quarterIndex < 0) {
        year--;
        quarter = quarterIndex + 5; // 4 quarters + 1
      }
      
      const startMonth = (quarter - 1) * 3;
      
      periods.push({
        from: new Date(year, startMonth, 1),
        to: new Date(year, startMonth + 3, 0),
        label: `Q${quarter} ${year}`
      });
    }
    
    return periods;
  }
};

// ===========================================
// ✅ NEW UTILITY FUNCTIONS
// ===========================================

/**
 * Generate data quality recommendations
 */
const generateDataQualityRecommendations = (
  dataSource: 'actual' | 'estimated' | 'mixed',
  materialUsageCount: number,
  productionRecordsCount: number
): string[] => {
  const recommendations: string[] = [];
  
  if (dataSource === 'estimated') {
    recommendations.push('Setup material usage tracking untuk COGS calculation yang lebih akurat');
  }
  
  if (materialUsageCount === 0) {
    recommendations.push('Mulai track penggunaan material untuk setiap produksi');
  }
  
  if (productionRecordsCount === 0) {
    recommendations.push('Catat production records untuk better cost allocation');
  }
  
  if (dataSource === 'mixed') {
    recommendations.push('Standardisasi tracking untuk consistency data quality');
  }
  
  return recommendations;
};

/**
 * Invalidate all profit-related cache
 */
export const invalidateProfitCache = (queryClient: any) => {
  return queryClient.invalidateQueries({
    queryKey: profitMarginQueryKeys.all
  });
};

export default useProfitMargin;