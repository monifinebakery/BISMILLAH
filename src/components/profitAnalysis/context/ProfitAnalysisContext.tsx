// src/contexts/ProfitAnalysisContext.tsx
// ✅ PROFIT ANALYSIS CONTEXT - Provider & Hook

import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

// Hook imports
import { useProfitMargin, profitMarginQueryKeys } from '../hooks/useProfitMargin';
import { useAuth } from '@/contexts/AuthContext';

// Type imports
import {
  ProfitAnalysisResult,
  ProfitAnalysisContextType,
  CategoryMapping,
  DEFAULT_CATEGORY_MAPPING,
  DatePeriod,
  ProfitInsight
} from '../types/profitAnalysis';

import { createDatePeriods } from '../services/profitAnalysisApi';

// ===========================================
// ✅ CONTEXT SETUP
// ===========================================

const ProfitAnalysisContext = createContext<ProfitAnalysisContextType | undefined>(undefined);

// ===========================================
// ✅ PROVIDER COMPONENT
// ===========================================

export const ProfitAnalysisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Default period - current month
  const defaultPeriod = createDatePeriods.thisMonth();

  // Use the main profit margin hook
  const {
    profitData,
    keyMetrics,
    categoryMapping,
    config,
    isLoading,
    isCalculating,
    error,
    calculateProfit,
    refreshAnalysis,
    updateCategoryMapping,
    exportAnalysis,
    useDashboardSummary
  } = useProfitMargin(defaultPeriod);

  // Dashboard summary for context
  const dashboardSummary = useDashboardSummary();

  // ===========================================
  // ✅ REAL-TIME UPDATES SUBSCRIPTION
  // ===========================================

  useEffect(() => {
    if (!user?.id) return;

    logger.context('ProfitAnalysisContext', 'Setting up real-time subscription for user:', user.id);

    // Listen for changes in financial transactions, operational costs, and warehouse data
    const channels = [
      'financial_transactions',
      'operational_costs', 
      'bahan_baku'
    ].map(table => {
      return supabase
        .channel(`realtime-${table}-profit-${user.id}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: table,
            filter: `user_id=eq.${user.id}` 
          },
          (payload) => {
            try {
              logger.context('ProfitAnalysisContext', `Real-time update received for ${table}:`, payload);

              // Invalidate profit analysis queries to trigger recalculation
              queryClient.invalidateQueries({
                queryKey: profitMarginQueryKeys.all
              });

              // Show notification if auto-calculate is enabled
              if (config?.autoCalculate) {
                setTimeout(() => {
                  refreshAnalysis();
                }, 1000); // Debounce rapid updates
              }

            } catch (error) {
              logger.error(`Real-time update error for ${table}:`, error);
            }
          }
        )
        .subscribe((status) => {
          logger.context('ProfitAnalysisContext', `Subscription status for ${table}:`, status);
        });
    });

    return () => {
      logger.context('ProfitAnalysisContext', 'Unsubscribing from real-time updates');
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user?.id, queryClient, config?.autoCalculate, refreshAnalysis]);

  // ===========================================
  // ✅ CONTEXT FUNCTIONS
  // ===========================================

  const calculateProfitMargin = useCallback(async (input: {
    period: DatePeriod;
    categoryMapping?: Partial<CategoryMapping>;
  }): Promise<ProfitAnalysisResult> => {
    try {
      const result = await calculateProfit(input.period, input.categoryMapping);
      
      logger.context('ProfitAnalysisContext', 'Profit margin calculated successfully:', {
        period: input.period.label,
        revenue: result.profitMarginData.revenue,
        grossMargin: result.profitMarginData.grossMargin,
        netMargin: result.profitMarginData.netMargin
      });

      return result;
    } catch (error) {
      logger.error('Context: Failed to calculate profit margin:', error);
      throw error;
    }
  }, [calculateProfit]);

  const getInsightsByCategory = useCallback((category: string): ProfitInsight[] => {
    if (!profitData?.insights) return [];
    
    return profitData.insights.filter(insight => insight.category === category);
  }, [profitData?.insights]);

  const exportProfitAnalysis = useCallback(async (
    format: 'pdf' | 'excel' | 'csv'
  ): Promise<boolean> => {
    try {
      if (!profitData) {
        throw new Error('Tidak ada data analisis untuk diekspor');
      }

      await exportAnalysis(format, profitData);
      
      logger.context('ProfitAnalysisContext', `Export ${format} successful`);
      return true;
    } catch (error) {
      logger.error('Context: Export failed:', error);
      return false;
    }
  }, [exportAnalysis, profitData]);

  // ===========================================
  // ✅ ENHANCED UTILITIES
  // ===========================================

  const getProfitTrend = useCallback((months: number = 6) => {
    // This could be enhanced to use the trend hook
    // For now, return basic trend data from dashboard
    return dashboardSummary.data?.trends || [];
  }, [dashboardSummary.data?.trends]);

  const getMarginStatus = useCallback((margin: number, type: 'gross' | 'net') => {
    const thresholds = {
      gross: { excellent: 40, good: 25, acceptable: 15, poor: 5 },
      net: { excellent: 15, good: 10, acceptable: 5, poor: 2 }
    };

    const threshold = thresholds[type];

    if (margin >= threshold.excellent) return { status: 'excellent', color: 'green' };
    if (margin >= threshold.good) return { status: 'good', color: 'blue' };
    if (margin >= threshold.acceptable) return { status: 'acceptable', color: 'yellow' };
    if (margin >= threshold.poor) return { status: 'poor', color: 'orange' };
    return { status: 'critical', color: 'red' };
  }, []);

  const getCostAnalysis = useCallback(() => {
    if (!profitData) return null;

    const { cogsBreakdown, opexBreakdown, profitMarginData } = profitData;
    const totalCosts = profitMarginData.cogs + profitMarginData.opex;

    return {
      totalCosts,
      cogsPercentage: (profitMarginData.cogs / profitMarginData.revenue) * 100,
      opexPercentage: (profitMarginData.opex / profitMarginData.revenue) * 100,
      materialCostPercentage: (cogsBreakdown.totalMaterialCost / profitMarginData.revenue) * 100,
      laborCostPercentage: (cogsBreakdown.totalDirectLaborCost / profitMarginData.revenue) * 100,
      overheadPercentage: (cogsBreakdown.manufacturingOverhead / profitMarginData.revenue) * 100
    };
  }, [profitData]);

  // ===========================================
  // ✅ CONTEXT VALUE
  // ===========================================

  const contextValue: ProfitAnalysisContextType = {
    // State
    currentAnalysis: profitData,
    isLoading,
    isCalculating,

    // Actions
    calculateProfitMargin,
    refreshAnalysis,

    // Configuration
    categoryMapping: categoryMapping || DEFAULT_CATEGORY_MAPPING,
    updateCategoryMapping,

    // Utilities
    exportAnalysis: exportProfitAnalysis,
    getInsightsByCategory,

    // Enhanced utilities
    getProfitTrend,
    getMarginStatus,
    getCostAnalysis,
    keyMetrics,
    dashboardSummary: dashboardSummary.data,
    error: error?.message
  };

  return (
    <ProfitAnalysisContext.Provider value={contextValue}>
      {children}
    </ProfitAnalysisContext.Provider>
  );
};

// ===========================================
// ✅ HOOK
// ===========================================

export const useProfitAnalysis = (): ProfitAnalysisContextType => {
  const context = useContext(ProfitAnalysisContext);
  if (context === undefined) {
    throw new Error('useProfitAnalysis must be used within a ProfitAnalysisProvider');
  }
  return context;
};

// ===========================================
// ✅ SPECIALIZED CONTEXT HOOKS
// ===========================================

/**
 * Hook for profit margin metrics only
 */
export const useProfitMetrics = () => {
  const { currentAnalysis, keyMetrics, getMarginStatus } = useProfitAnalysis();
  
  if (!currentAnalysis) {
    return {
      revenue: 0,
      grossMargin: 0,
      netMargin: 0,
      grossMarginStatus: getMarginStatus(0, 'gross'),
      netMarginStatus: getMarginStatus(0, 'net'),
      hasData: false
    };
  }

  const { revenue, grossMargin, netMargin } = currentAnalysis.profitMarginData;

  return {
    revenue,
    grossMargin,
    netMargin,
    grossMarginStatus: getMarginStatus(grossMargin, 'gross'),
    netMarginStatus: getMarginStatus(netMargin, 'net'),
    hasData: true,
    rawData: currentAnalysis.profitMarginData
  };
};

/**
 * Hook for cost breakdown analysis
 */
export const useCostBreakdown = () => {
  const { currentAnalysis, getCostAnalysis } = useProfitAnalysis();
  
  return {
    costAnalysis: getCostAnalysis(),
    cogsBreakdown: currentAnalysis?.cogsBreakdown,
    opexBreakdown: currentAnalysis?.opexBreakdown,
    hasData: !!currentAnalysis
  };
};

/**
 * Hook for profit insights and alerts
 */
export const useProfitInsights = () => {
  const { currentAnalysis, getInsightsByCategory, dashboardSummary } = useProfitAnalysis();
  
  const insights = currentAnalysis?.insights || [];
  const alerts = dashboardSummary?.alerts || [];

  return {
    insights,
    alerts,
    marginInsights: getInsightsByCategory('margin'),
    cogsInsights: getInsightsByCategory('cogs'),
    opexInsights: getInsightsByCategory('opex'),
    efficiencyInsights: getInsightsByCategory('efficiency'),
    criticalInsights: insights.filter(i => i.type === 'critical'),
    warningInsights: insights.filter(i => i.type === 'warning'),
    hasInsights: insights.length > 0
  };
};

// ===========================================
// ✅ UTILITY HOOKS
// ===========================================

/**
 * Hook for accessing React Query specific functions
 */
export const useProfitAnalysisQuery = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidateProfitAnalysis = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: profitMarginQueryKeys.all
    });
  }, [queryClient]);

  const prefetchProfitAnalysis = useCallback((period: DatePeriod) => {
    if (user?.id) {
      queryClient.prefetchQuery({
        queryKey: profitMarginQueryKeys.analysis(period),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [queryClient, user?.id]);

  const getProfitAnalysisFromCache = useCallback((period: DatePeriod) => {
    return queryClient.getQueryData(
      profitMarginQueryKeys.analysis(period)
    ) as ProfitAnalysisResult | undefined;
  }, [queryClient]);

  return {
    invalidateProfitAnalysis,
    prefetchProfitAnalysis,
    getProfitAnalysisFromCache,
  };
};

export default ProfitAnalysisContext;