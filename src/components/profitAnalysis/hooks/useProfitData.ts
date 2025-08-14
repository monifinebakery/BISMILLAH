// ==============================================
// PROFIT ANALYSIS HOOKS
// ==============================================
// Following patterns from existing financial, warehouse, and operational cost hooks

// ==============================================
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

// ==============================================
// 2. useProfitCalculation.ts - Calculation utilities
// ==============================================

import { useMemo, useCallback } from 'react';
import { 
  calculateMargins, 
  getMarginRating, 
  filterTransactionsByPeriod 
} from '../utils/profitCalculations';
import { FinancialTransaction } from '@/components/financial/types/financial';
import { BahanBakuFrontend } from '@/components/warehouse/types';
import { OperationalCost } from '@/components/operational-costs/types';

interface UseProfitCalculationOptions {
  period?: string;
  transactions?: FinancialTransaction[];
  materials?: BahanBakuFrontend[];
  operationalCosts?: OperationalCost[];
}

interface UseProfitCalculationReturn {
  // Calculations
  calculateLocalProfit: (
    transactions: FinancialTransaction[],
    materials: BahanBakuFrontend[],
    costs: OperationalCost[],
    period: string
  ) => {
    revenue: number;
    cogs: number;
    opex: number;
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
  };
  
  // Analysis
  analyzeMargins: (grossMargin: number, netMargin: number) => {
    grossRating: string;
    netRating: string;
    recommendations: string[];
  };
  
  // Comparisons
  comparePeriods: (
    current: RealTimeProfitCalculation,
    previous: RealTimeProfitCalculation
  ) => {
    revenueChange: number;
    profitChange: number;
    marginChange: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  
  // Forecasting
  generateForecast: (history: RealTimeProfitCalculation[], periods: number) => {
    projectedRevenue: number;
    projectedProfit: number;
    confidence: number;
  };
}

export const useProfitCalculation = (
  options: UseProfitCalculationOptions = {}
): UseProfitCalculationReturn => {
  
  // ✅ LOCAL PROFIT CALCULATION
  const calculateLocalProfit = useCallback((
    transactions: FinancialTransaction[],
    materials: BahanBakuFrontend[],
    costs: OperationalCost[],
    period: string
  ) => {
    // Filter transactions for the period
    const periodTransactions = filterTransactionsByPeriod(transactions, period);
    
    // Calculate revenue
    const revenueTransactions = periodTransactions.filter(t => t.type === 'income');
    const revenue = revenueTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Calculate COGS
    const cogsTransactions = periodTransactions.filter(t => 
      t.type === 'expense' && t.category === 'Pembelian Bahan Baku'
    );
    const cogs = cogsTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Calculate OpEx
    const activeCosts = costs.filter(c => c.status === 'aktif');
    const opex = activeCosts.reduce((sum, c) => sum + (c.jumlah_per_bulan || 0), 0);
    
    // Calculate profits and margins
    const { grossProfit, netProfit, grossMargin, netMargin } = calculateMargins(revenue, cogs, opex);
    
    return {
      revenue,
      cogs,
      opex,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin
    };
  }, []);

  // ✅ MARGIN ANALYSIS
  const analyzeMargins = useCallback((grossMargin: number, netMargin: number) => {
    const grossRating = getMarginRating(grossMargin / 100, 'gross');
    const netRating = getMarginRating(netMargin / 100, 'net');
    
    const recommendations: string[] = [];
    
    if (grossRating === 'poor') {
      recommendations.push('Pertimbangkan untuk mengurangi biaya bahan baku atau meningkatkan harga jual');
    }
    if (netRating === 'poor') {
      recommendations.push('Review dan optimalisasi biaya operasional yang tidak perlu');
    }
    if (grossRating === 'excellent' && netRating === 'poor') {
      recommendations.push('COGS sudah baik, fokus pada efisiensi operasional');
    }
    if (grossRating === 'good' && netRating === 'good') {
      recommendations.push('Performa baik, pertahankan dan cari peluang growth');
    }
    
    return {
      grossRating,
      netRating,
      recommendations
    };
  }, []);

  // ✅ PERIOD COMPARISON
  const comparePeriods = useCallback((
    current: RealTimeProfitCalculation,
    previous: RealTimeProfitCalculation
  ) => {
    const currentRevenue = current.revenue_data.total;
    const previousRevenue = previous.revenue_data.total;
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    const currentProfit = currentRevenue - current.cogs_data.total - current.opex_data.total;
    const previousProfit = previousRevenue - previous.cogs_data.total - previous.opex_data.total;
    const profitChange = previousProfit > 0 
      ? ((currentProfit - previousProfit) / previousProfit) * 100 
      : 0;

    const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0;
    const previousMargin = previousRevenue > 0 ? (previousProfit / previousRevenue) * 100 : 0;
    const marginChange = currentMargin - previousMargin;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (profitChange > 5) trend = 'improving';
    else if (profitChange < -5) trend = 'declining';

    return {
      revenueChange,
      profitChange,
      marginChange,
      trend
    };
  }, []);

  // ✅ SIMPLE FORECASTING
  const generateForecast = useCallback((
    history: RealTimeProfitCalculation[], 
    periods: number
  ) => {
    if (history.length < 3) {
      return {
        projectedRevenue: 0,
        projectedProfit: 0,
        confidence: 0
      };
    }

    // Simple linear trend calculation
    const revenueValues = history.map(h => h.revenue_data.total);
    const profitValues = history.map(h => 
      h.revenue_data.total - h.cogs_data.total - h.opex_data.total
    );

    const avgRevenueGrowth = revenueValues.reduce((acc, val, idx) => {
      if (idx === 0) return acc;
      const growth = (val - revenueValues[idx - 1]) / revenueValues[idx - 1];
      return acc + growth;
    }, 0) / (revenueValues.length - 1);

    const avgProfitGrowth = profitValues.reduce((acc, val, idx) => {
      if (idx === 0) return acc;
      const growth = (val - profitValues[idx - 1]) / profitValues[idx - 1];
      return acc + growth;
    }, 0) / (profitValues.length - 1);

    const lastRevenue = revenueValues[revenueValues.length - 1];
    const lastProfit = profitValues[profitValues.length - 1];

    const projectedRevenue = lastRevenue * Math.pow(1 + avgRevenueGrowth, periods);
    const projectedProfit = lastProfit * Math.pow(1 + avgProfitGrowth, periods);
    
    // Confidence based on data consistency (simplified)
    const confidence = Math.min(history.length * 20, 80); // Max 80% confidence

    return {
      projectedRevenue,
      projectedProfit,
      confidence
    };
  }, []);

  return {
    calculateLocalProfit,
    analyzeMargins,
    comparePeriods,
    generateForecast
  };
};

// ==============================================
// 3. useProfitData.ts - Data processing utilities
// ==============================================

import { useState, useEffect, useMemo } from 'react';
import { ProfitChartData, ProfitTrendData } from '../types/profitAnalysis.types';

interface UseProfitDataOptions {
  history?: RealTimeProfitCalculation[];
  currentAnalysis?: RealTimeProfitCalculation;
}

interface UseProfitDataReturn {
  // Chart data
  chartData: ProfitChartData[];
  trendData: ProfitTrendData;
  
  // Summary data
  totalRevenue: number;
  totalProfit: number;
  averageMargin: number;
  bestPerformingPeriod: RealTimeProfitCalculation | null;
  worstPerformingPeriod: RealTimeProfitCalculation | null;
  
  // Breakdown data
  revenueBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  costBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  
  // Utilities
  formatPeriodLabel: (period: string) => string;
  exportData: () => any[];
}

export const useProfitData = (
  options: UseProfitDataOptions = {}
): UseProfitDataReturn => {
  const { history = [], currentAnalysis } = options;

  // ✅ CHART DATA PROCESSING
  const chartData = useMemo((): ProfitChartData[] => {
    return history.map(analysis => {
      const revenue = analysis.revenue_data.total;
      const cogs = analysis.cogs_data.total;
      const opex = analysis.opex_data.total;
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - opex;
      const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
      const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      return {
        period: analysis.period,
        revenue,
        cogs,
        opex,
        gross_profit: grossProfit,
        net_profit: netProfit,
        gross_margin: grossMargin,
        net_margin: netMargin
      };
    });
  }, [history]);

  // ✅ TREND DATA
  const trendData = useMemo((): ProfitTrendData => {
    const labels = chartData.map(d => formatPeriodLabel(d.period));
    const datasets = {
      revenue: chartData.map(d => d.revenue),
      gross_profit: chartData.map(d => d.gross_profit),
      net_profit: chartData.map(d => d.net_profit)
    };

    return { labels, datasets };
  }, [chartData]);

  // ✅ SUMMARY CALCULATIONS
  const summaryMetrics = useMemo(() => {
    if (history.length === 0) {
      return {
        totalRevenue: 0,
        totalProfit: 0,
        averageMargin: 0,
        bestPerformingPeriod: null,
        worstPerformingPeriod: null
      };
    }

    const totalRevenue = history.reduce((sum, h) => sum + h.revenue_data.total, 0);
    const totalProfit = history.reduce((sum, h) => {
      const profit = h.revenue_data.total - h.cogs_data.total - h.opex_data.total;
      return sum + profit;
    }, 0);

    const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Find best and worst performing periods
    const periodsWithProfit = history.map(h => ({
      ...h,
      profit: h.revenue_data.total - h.cogs_data.total - h.opex_data.total
    }));

    const bestPerformingPeriod = periodsWithProfit.reduce((best, current) => 
      current.profit > best.profit ? current : best
    );

    const worstPerformingPeriod = periodsWithProfit.reduce((worst, current) => 
      current.profit < worst.profit ? current : worst
    );

    return {
      totalRevenue,
      totalProfit,
      averageMargin,
      bestPerformingPeriod,
      worstPerformingPeriod
    };
  }, [history]);

  // ✅ BREAKDOWN DATA
  const revenueBreakdown = useMemo(() => {
    if (!currentAnalysis) return [];

    const total = currentAnalysis.revenue_data.total;
    return currentAnalysis.revenue_data.transactions.map(t => ({
      category: t.category,
      amount: t.amount,
      percentage: total > 0 ? (t.amount / total) * 100 : 0
    }));
  }, [currentAnalysis]);

  const costBreakdown = useMemo(() => {
    if (!currentAnalysis) return [];

    const totalCosts = currentAnalysis.cogs_data.total + currentAnalysis.opex_data.total;
    const breakdown = [
      {
        category: 'COGS',
        amount: currentAnalysis.cogs_data.total,
        percentage: totalCosts > 0 ? (currentAnalysis.cogs_data.total / totalCosts) * 100 : 0
      },
      {
        category: 'OpEx',
        amount: currentAnalysis.opex_data.total,
        percentage: totalCosts > 0 ? (currentAnalysis.opex_data.total / totalCosts) * 100 : 0
      }
    ];

    return breakdown;
  }, [currentAnalysis]);

  // ✅ UTILITIES
  const formatPeriodLabel = useCallback((period: string): string => {
    // Convert "2024-01" to "Jan 2024"
    const [year, month] = period.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }, []);

  const exportData = useCallback(() => {
    return chartData.map(data => ({
      Period: formatPeriodLabel(data.period),
      Revenue: data.revenue,
      COGS: data.cogs,
      OpEx: data.opex,
      'Gross Profit': data.gross_profit,
      'Net Profit': data.net_profit,
      'Gross Margin %': data.gross_margin.toFixed(2),
      'Net Margin %': data.net_margin.toFixed(2)
    }));
  }, [chartData, formatPeriodLabel]);

  return {
    // Chart data
    chartData,
    trendData,
    
    // Summary data
    ...summaryMetrics,
    
    // Breakdown data
    revenueBreakdown,
    costBreakdown,
    
    // Utilities
    formatPeriodLabel,
    exportData
  };
};

// ==============================================
// EXPORTS
// ==============================================

export default {
  useProfitAnalysis,
  useProfitCalculation,
  useProfitData
};