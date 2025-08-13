// src/components/profitAnalysis/context/ProfitAnalysisContext.tsx
// ✅ COMPLETE UPDATED CONTEXT - Material Usage Integration

import React, { createContext, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
} from '../types';

import { createDatePeriods } from '../services/profitAnalysisApi';

// ===========================================
// ✅ CONTEXT SETUP
// ===========================================

const ProfitAnalysisContext = createContext<ProfitAnalysisContextType | undefined>(undefined);

// ===========================================
// ✅ UPDATED PROVIDER COMPONENT
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
  // ✅ UPDATED REAL-TIME SUBSCRIPTION
  // ===========================================

  useEffect(() => {
    if (!user?.id) return;

    logger.context('ProfitAnalysisContext', 'Setting up real-time subscription with material usage for user:', user.id);

    // ✅ UPDATED: Listen for changes including material_usage_log and production_records
    const channels = [
      'financial_transactions',
      'operational_costs', 
      'bahan_baku',
      'material_usage_log', // ✅ NEW
      'production_records', // ✅ NEW
      'orders', // ✅ NEW - for order completion triggers
      'recipes' // ✅ NEW - for recipe changes
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

              // ✅ SPECIAL HANDLING for material_usage_log
              if (table === 'material_usage_log') {
                logger.info('Material usage updated - invalidating profit analysis cache');
                
                // Immediately invalidate profit analysis queries
                queryClient.invalidateQueries({
                  queryKey: profitMarginQueryKeys.all
                });

                // Auto-refresh if enabled and it's a new material usage
                if (config?.autoCalculate && payload.eventType === 'INSERT') {
                  setTimeout(() => {
                    refreshAnalysis();
                  }, 2000); // Slight delay to ensure data consistency
                }
              }
              
              // ✅ SPECIAL HANDLING for production_records
              else if (table === 'production_records') {
                logger.info('Production record updated - invalidating profit analysis cache');
                
                queryClient.invalidateQueries({
                  queryKey: profitMarginQueryKeys.all
                });

                if (config?.autoCalculate) {
                  setTimeout(() => {
                    refreshAnalysis();
                  }, 2000);
                }
              }
              
              // ✅ SPECIAL HANDLING for orders (status changes)
              else if (table === 'orders') {
                // Only refresh on status changes to completed/delivered
                if (payload.new?.status && ['completed', 'delivered'].includes(payload.new.status)) {
                  logger.info('Order completed - checking for material usage updates');
                  
                  queryClient.invalidateQueries({
                    queryKey: profitMarginQueryKeys.all
                  });

                  if (config?.autoCalculate) {
                    setTimeout(() => {
                      refreshAnalysis();
                    }, 3000); // Longer delay for order processing
                  }
                }
              }
              
              // Standard handling for other tables
              else {
                queryClient.invalidateQueries({
                  queryKey: profitMarginQueryKeys.all
                });

                if (config?.autoCalculate) {
                  setTimeout(() => {
                    refreshAnalysis();
                  }, 1000);
                }
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
      logger.context('ProfitAnalysisContext', 'Unsubscribing from real-time updates including material usage');
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [user?.id, queryClient, config?.autoCalculate, refreshAnalysis]);

  // ===========================================
  // ✅ UPDATED CONTEXT FUNCTIONS
  // ===========================================

  const calculateProfitMargin = useCallback(async (input: {
    period: DatePeriod;
    categoryMapping?: Partial<CategoryMapping>;
  }): Promise<ProfitAnalysisResult> => {
    try {
      const result = await calculateProfit(input.period, input.categoryMapping);
      
      logger.context('ProfitAnalysisContext', 'Profit margin calculated successfully with material usage:', {
        period: input.period.label,
        revenue: result.profitMarginData.revenue,
        cogs: result.profitMarginData.cogs,
        grossMargin: result.profitMarginData.grossMargin,
        netMargin: result.profitMarginData.netMargin,
        dataSource: result.cogsBreakdown.dataSource, // ✅ NEW
        materialUsageRecords: result.rawData.materialUsage?.length || 0, // ✅ NEW
        productionRecords: result.rawData.productionRecords?.length || 0 // ✅ NEW
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
      
      logger.context('ProfitAnalysisContext', `Export ${format} successful with material usage data`);
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
      overheadPercentage: (cogsBreakdown.manufacturingOverhead / profitMarginData.revenue) * 100,
      
      // ✅ NEW: Material usage insights
      hasActualMaterialData: cogsBreakdown.dataSource === 'actual',
      materialUsageRecords: cogsBreakdown.actualMaterialUsage?.length || 0,
      productionRecords: cogsBreakdown.productionData?.length || 0,
      dataQuality: cogsBreakdown.dataSource
    };
  }, [profitData]);

  // ✅ NEW: Get material usage summary
  const getMaterialUsageSummary = useCallback(() => {
    if (!profitData?.cogsBreakdown.actualMaterialUsage) return null;

    const materialUsage = profitData.cogsBreakdown.actualMaterialUsage;
    const totalMaterialCost = materialUsage.reduce((sum, usage) => sum + usage.total_cost, 0);
    const totalQuantity = materialUsage.reduce((sum, usage) => sum + usage.quantity_used, 0);

    // Group by usage type
    const usageByType = materialUsage.reduce((acc, usage) => {
      if (!acc[usage.usage_type]) {
        acc[usage.usage_type] = { count: 0, totalCost: 0 };
      }
      acc[usage.usage_type].count += 1;
      acc[usage.usage_type].totalCost += usage.total_cost;
      return acc;
    }, {} as Record<string, { count: number; totalCost: number }>);

    return {
      totalMaterialCost,
      totalQuantity,
      recordCount: materialUsage.length,
      usageByType,
      averageCostPerRecord: materialUsage.length > 0 ? totalMaterialCost / materialUsage.length : 0
    };
  }, [profitData]);

  // ✅ NEW: Get production summary
  const getProductionSummary = useCallback(() => {
    if (!profitData?.cogsBreakdown.productionData) return null;

    const productionRecords = profitData.cogsBreakdown.productionData;
    const totalQuantityProduced = productionRecords.reduce((sum, record) => sum + record.quantity_produced, 0);
    const totalProductionCost = productionRecords.reduce((sum, record) => 
      sum + record.total_material_cost + record.total_labor_cost + record.total_overhead_cost, 0);

    return {
      totalQuantityProduced,
      totalProductionCost,
      recordCount: productionRecords.length,
      averageCostPerUnit: totalQuantityProduced > 0 ? totalProductionCost / totalQuantityProduced : 0,
      products: Array.from(new Set(productionRecords.map(r => r.product_name))).length
    };
  }, [profitData]);

  // ===========================================
  // ✅ UPDATED CONTEXT VALUE
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
    error: error?.message,

    // ✅ NEW: Material usage utilities
    getMaterialUsageSummary,
    getProductionSummary
  };

  return (
    <ProfitAnalysisContext.Provider value={contextValue}>
      {children}
    </ProfitAnalysisContext.Provider>
  );
};

// ===========================================
// ✅ HOOK (unchanged)
// ===========================================

export const useProfitAnalysis = (): ProfitAnalysisContextType => {
  const context = useContext(ProfitAnalysisContext);
  if (context === undefined) {
    throw new Error('useProfitAnalysis must be used within a ProfitAnalysisProvider');
  }
  return context;
};

// ===========================================
// ✅ UPDATED SPECIALIZED CONTEXT HOOKS
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
      hasData: false,
      dataQuality: 'unknown' as const
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
    rawData: currentAnalysis.profitMarginData,
    dataQuality: currentAnalysis.cogsBreakdown.dataSource // ✅ NEW
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
    hasData: !!currentAnalysis,
    
    // ✅ NEW: Material usage data
    hasActualMaterialData: currentAnalysis?.cogsBreakdown.dataSource === 'actual',
    materialUsageRecords: currentAnalysis?.cogsBreakdown.actualMaterialUsage?.length || 0,
    productionRecords: currentAnalysis?.cogsBreakdown.productionData?.length || 0
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
    hasInsights: insights.length > 0,
    
    // ✅ NEW: Data quality insights
    dataQualityInsights: insights.filter(i => i.category === 'efficiency')
  };
};

/**
 * ✅ NEW: Hook for material usage analytics
 */
export const useMaterialUsageAnalytics = () => {
  const { currentAnalysis, getMaterialUsageSummary, getProductionSummary } = useProfitAnalysis();
  
  const materialSummary = getMaterialUsageSummary();
  const productionSummary = getProductionSummary();
  
  return {
    materialSummary,
    productionSummary,
    hasActualData: currentAnalysis?.cogsBreakdown.dataSource === 'actual',
    materialUsageRecords: currentAnalysis?.cogsBreakdown.actualMaterialUsage || [],
    productionRecords: currentAnalysis?.cogsBreakdown.productionData || [],
    
    // Data quality indicators
    dataQuality: currentAnalysis?.cogsBreakdown.dataSource || 'unknown',
    isDataComplete: materialSummary && productionSummary,
    
    // Recommendations
    needsSetup: !materialSummary || materialSummary.recordCount === 0
  };
};

// ===========================================
// ✅ UTILITY HOOKS (unchanged)
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