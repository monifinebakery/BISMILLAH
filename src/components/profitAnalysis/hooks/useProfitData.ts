// useProfitData.ts - Enhanced with F&B UMKM friendly formatting and Centralized Utilities
// ==============================================

import { useMemo, useCallback } from 'react';
import { 
  ProfitChartData, 
  ProfitTrendData, 
  RealTimeProfitCalculation,
  FNBCOGSBreakdown 
} from '../types/profitAnalysis.types';

// 🍽️ Import F&B labels for export
import { FNB_LABELS } from '../constants/profitConstants';
// ✅ Import centralized utilities
import { getEffectiveCogs, calculateHistoricalCOGS } from '@/utils/cogsCalculation';
import { validateFinancialData, safeCalculateMargins } from '@/utils/profitValidation';
import { formatPeriodForDisplay, safeSortPeriods } from '@/utils/periodUtils';

export interface UseProfitDataOptions {
  history?: RealTimeProfitCalculation[];
  currentAnalysis?: RealTimeProfitCalculation;
  // 🍽️ F&B specific options
  effectiveCogs?: number;    // WAC calculated COGS
  hppBreakdown?: FNBCOGSBreakdown[];  // F&B breakdown
}

export interface UseProfitDataReturn {
  // Chart data
  chartData: ProfitChartData[];
  trendData: ProfitTrendData;
  
  // Summary data
  totalRevenue: number;
  totalProfit: number;
  averageMargin: number;
  bestPerformingPeriod: RealTimeProfitCalculation | null;
  worstPerformingPeriod: RealTimeProfitCalculation | null;
  
  // 🍽️ Enhanced breakdown data with F&B categories
  revenueBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  costBreakdown: Array<{ category: string; amount: number; percentage: number }>;
  fnbCostBreakdown: Array<{ category: string; amount: number; percentage: number; items: FNBCOGSBreakdown[] }>;
  
  // 📊 Enhanced utilities
  formatPeriodLabel: (period: string) => string;
  exportData: () => any[];          // General export
  exportFNBData: () => any[];       // F&B specific export with friendly terms
}

export const useProfitData = (
  options: UseProfitDataOptions = {}
): UseProfitDataReturn => {
  const { 
    history = [], 
    currentAnalysis,
    effectiveCogs,      // WAC calculated COGS
    hppBreakdown = []   // F&B breakdown
  } = options;

  // ✅ STANDARDIZED: Use centralized period formatting
  const formatPeriodLabel = useCallback((period: string): string => {
    return formatPeriodForDisplay(period);
  }, []);

  // ✅ STANDARDIZED: Chart data processing with centralized utilities
  const chartData = useMemo((): ProfitChartData[] => {
    if (!Array.isArray(history) || history.length === 0) return [];
    
    try {
      // Get historical COGS calculations
      const cogsCalculations = calculateHistoricalCOGS(history, effectiveCogs);
      
      // Sort periods chronologically
      const sortedHistory = [...history].sort((a, b) => {
        const periodsToSort = [a.period, b.period];
        const sorted = safeSortPeriods(periodsToSort);
        return periodsToSort.indexOf(a.period) - periodsToSort.indexOf(b.period);
      });
      
      return sortedHistory.map(analysis => {
        if (!analysis) return null;
        
        const revenue = analysis.revenue_data?.total || 0;
        const cogsResult = cogsCalculations.get(analysis.period);
        const cogs = cogsResult?.value || analysis.cogs_data?.total || 0;
        const opex = analysis.opex_data?.total || 0;
        
        // ✅ Use centralized margin calculation with validation
        const margins = safeCalculateMargins(revenue, cogs, opex);
        
        return {
          period: analysis.period || '',
          revenue,
          cogs,
          opex,
          gross_profit: margins.grossProfit,
          net_profit: margins.netProfit,
          gross_margin: margins.grossMargin,
          net_margin: margins.netMargin
        };
      }).filter(Boolean) as ProfitChartData[];
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [];
    }
  }, [history, effectiveCogs]);

  // ✅ TREND DATA - Fixed dependencies
  const trendData = useMemo((): ProfitTrendData => {
    if (!Array.isArray(chartData) || chartData.length === 0) {
      return { 
        labels: [], 
        datasets: { 
          revenue: [], 
          gross_profit: [], 
          net_profit: [] 
        } 
      };
    }
    
    try {
      const labels = chartData.map(d => formatPeriodLabel(d?.period || ''));
      const datasets = {
        revenue: chartData.map(d => d?.revenue || 0),
        gross_profit: chartData.map(d => d?.gross_profit || 0),
        net_profit: chartData.map(d => d?.net_profit || 0)
      };

      return { labels, datasets };
    } catch (error) {
      console.error('Error processing trend data:', error);
      return { 
        labels: [], 
        datasets: { 
          revenue: [], 
          gross_profit: [], 
          net_profit: [] 
        } 
      };
    }
  }, [chartData, formatPeriodLabel]); // Depend on chartData and formatPeriodLabel

  // ✅ STANDARDIZED: Summary calculations with validation
  const summaryMetrics = useMemo(() => {
    if (!Array.isArray(history) || history.length === 0) {
      return {
        totalRevenue: 0,
        totalProfit: 0,
        averageMargin: 0,
        bestPerformingPeriod: null,
        worstPerformingPeriod: null
      };
    }

    try {
      // Get historical COGS calculations for accuracy
      const cogsCalculations = calculateHistoricalCOGS(history, effectiveCogs);
      
      const totalRevenue = history.reduce((sum, h) => {
        return sum + (h?.revenue_data?.total || 0);
      }, 0);
      
      const totalProfit = history.reduce((sum, h) => {
        const revenue = h?.revenue_data?.total || 0;
        const cogsResult = cogsCalculations.get(h.period);
        const cogs = cogsResult?.value || h?.cogs_data?.total || 0;
        const opex = h?.opex_data?.total || 0;
        
        // ✅ Use validated calculation
        const margins = safeCalculateMargins(revenue, cogs, opex);
        return sum + margins.netProfit;
      }, 0);

      const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      // Find best and worst performing periods with validated calculations
      const periodsWithProfit = history
        .filter(h => h && h.revenue_data)
        .map(h => {
          const revenue = h.revenue_data?.total || 0;
          const cogsResult = cogsCalculations.get(h.period);
          const cogs = cogsResult?.value || h?.cogs_data?.total || 0;
          const opex = h?.opex_data?.total || 0;
          const margins = safeCalculateMargins(revenue, cogs, opex);
          
          return {
            ...h,
            profit: margins.netProfit
          };
        });

      let bestPerformingPeriod = null;
      let worstPerformingPeriod = null;

      if (periodsWithProfit.length > 0) {
        bestPerformingPeriod = periodsWithProfit.reduce((best, current) => 
          current.profit > best.profit ? current : best
        );

        worstPerformingPeriod = periodsWithProfit.reduce((worst, current) => 
          current.profit < worst.profit ? current : worst
        );
      }

      return {
        totalRevenue,
        totalProfit,
        averageMargin,
        bestPerformingPeriod,
        worstPerformingPeriod
      };
    } catch (error) {
      console.error('Error calculating summary metrics:', error);
      return {
        totalRevenue: 0,
        totalProfit: 0,
        averageMargin: 0,
        bestPerformingPeriod: null,
        worstPerformingPeriod: null
      };
    }
  }, [history, effectiveCogs]);

  // ✅ STANDARDIZED: Breakdown data with validation
  const revenueBreakdown = useMemo(() => {
    if (!currentAnalysis?.revenue_data?.transactions) return [];

    try {
      const total = currentAnalysis.revenue_data.total || 0;
      return (currentAnalysis.revenue_data.transactions || []).map(t => ({
        category: t?.category || 'Unknown',
        amount: t?.amount || 0,
        percentage: total > 0 ? ((t?.amount || 0) / total) * 100 : 0
      }));
    } catch (error) {
      console.error('Error processing revenue breakdown:', error);
      return [];
    }
  }, [currentAnalysis?.revenue_data?.transactions, currentAnalysis?.revenue_data?.total]);

  const costBreakdown = useMemo(() => {
    if (!currentAnalysis) return [];

    try {
      // ✅ Use centralized COGS calculation
      const cogsResult = getEffectiveCogs(
        currentAnalysis,
        effectiveCogs,
        currentAnalysis.revenue_data?.total
      );
      
      const cogsTotal = cogsResult.value;
      const opexTotal = currentAnalysis.opex_data?.total || 0;
      
      // ✅ Validate the financial data
      const validation = validateFinancialData(
        currentAnalysis.revenue_data?.total || 0,
        cogsTotal,
        opexTotal
      );
      
      const totalCosts = validation.corrections.cogs + validation.corrections.opex;
      
      const breakdown = [
        {
          category: '🥘 Modal Bahan Baku',  // F&B friendly term
          amount: validation.corrections.cogs,
          percentage: totalCosts > 0 ? (validation.corrections.cogs / totalCosts) * 100 : 0
        },
        {
          category: '🏪 Biaya Bulanan Tetap', // F&B friendly term
          amount: validation.corrections.opex,
          percentage: totalCosts > 0 ? (validation.corrections.opex / totalCosts) * 100 : 0
        }
      ];

      return breakdown;
    } catch (error) {
      console.error('Error processing cost breakdown:', error);
      return [];
    }
  }, [currentAnalysis, effectiveCogs]);

  // 🍽️ F&B specific cost breakdown by category
  const fnbCostBreakdown = useMemo(() => {
    if (!hppBreakdown || hppBreakdown.length === 0) return [];

    try {
      // Group by category
      const categoryGroups = hppBreakdown.reduce((groups, item) => {
        const category = item.category || 'Lainnya';
        if (!groups[category]) {
          groups[category] = {
            items: [],
            total: 0
          };
        }
        groups[category].items.push(item);
        groups[category].total += item.total_cost;
        return groups;
      }, {} as Record<string, { items: FNBCOGSBreakdown[]; total: number }>);

      const totalCogs = effectiveCogs || 0;
      
      return Object.entries(categoryGroups).map(([category, data]) => ({
        category,
        amount: data.total,
        percentage: totalCogs > 0 ? (data.total / totalCogs) * 100 : 0,
        items: data.items
      }));
    } catch (error) {
      console.error('Error processing F&B cost breakdown:', error);
      return [];
    }
  }, [hppBreakdown, effectiveCogs]);

  // 📊 General export (backward compatibility)
  const exportData = useCallback(() => {
    if (!Array.isArray(chartData) || chartData.length === 0) return [];
    
    try {
      return chartData.map(data => ({
        Period: formatPeriodLabel(data?.period || ''),
        Revenue: data?.revenue || 0,
        COGS: data?.cogs || 0,
        OpEx: data?.opex || 0,
        'Gross Profit': data?.gross_profit || 0,
        'Net Profit': data?.net_profit || 0,
        'Gross Margin %': (data?.gross_margin || 0).toFixed(2),
        'Net Margin %': (data?.net_margin || 0).toFixed(2)
      }));
    } catch (error) {
      console.error('Error exporting data:', error);
      return [];
    }
  }, [chartData, formatPeriodLabel]);
  
  // 🍽️ F&B friendly export with UMKM terminology
  const exportFNBData = useCallback(() => {
    if (!Array.isArray(chartData) || chartData.length === 0) return [];
    
    try {
      return chartData.map(data => ({
        'Periode': formatPeriodLabel(data?.period || ''),
        'Omset (Rp)': data?.revenue || 0,
        'Modal Bahan Baku (Rp)': data?.cogs || 0,
        'Biaya Bulanan Tetap (Rp)': data?.opex || 0,
        'Untung Kotor (Rp)': data?.gross_profit || 0,
        'Untung Bersih (Rp)': data?.net_profit || 0,
        'Margin Kotor (%)': (data?.gross_margin || 0).toFixed(1),
        'Margin Bersih (%)': (data?.net_margin || 0).toFixed(1)
      }));
    } catch (error) {
      console.error('Error exporting F&B data:', error);
      return [];
    }
  }, [chartData, formatPeriodLabel]);

  return {
    // Chart data
    chartData,
    trendData,
    
    // Summary data
    ...summaryMetrics,
    
    // 🍽️ Enhanced breakdown data
    revenueBreakdown,
    costBreakdown,
    fnbCostBreakdown,
    
    // 📊 Enhanced utilities
    formatPeriodLabel,
    exportData,
    exportFNBData
  };
};