// useProfitData.ts - Fixed Dependencies
// ==============================================

import { useMemo, useCallback } from 'react';
import { ProfitChartData, ProfitTrendData, RealTimeProfitCalculation } from '../types/profitAnalysis.types';

export interface UseProfitDataOptions {
  history?: RealTimeProfitCalculation[];
  currentAnalysis?: RealTimeProfitCalculation;
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

  // ✅ UTILITIES - No dependencies needed for static function
  const formatPeriodLabel = useCallback((period: string): string => {
    try {
      if (!period || typeof period !== 'string') return period || '';
      
      const [year, month] = period.split('-');
      if (!year || !month) return period;
      
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];
      
      const monthIndex = parseInt(month) - 1;
      if (monthIndex < 0 || monthIndex >= monthNames.length) return period;
      
      return `${monthNames[monthIndex]} ${year}`;
    } catch (error) {
      console.error('Error formatting period label:', error);
      return period || '';
    }
  }, []);

  // ✅ CHART DATA PROCESSING - Fixed error handling
  const chartData = useMemo((): ProfitChartData[] => {
    if (!Array.isArray(history) || history.length === 0) return [];
    
    try {
      return history.map(analysis => {
        if (!analysis) return null;
        
        const revenue = analysis.revenue_data?.total || 0;
        const cogs = analysis.cogs_data?.total || 0;
        const opex = analysis.opex_data?.total || 0;
        const grossProfit = revenue - cogs;
        const netProfit = grossProfit - opex;
        const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        return {
          period: analysis.period || '',
          revenue,
          cogs,
          opex,
          gross_profit: grossProfit,
          net_profit: netProfit,
          gross_margin: grossMargin,
          net_margin: netMargin
        };
      }).filter(Boolean) as ProfitChartData[];
    } catch (error) {
      console.error('Error processing chart data:', error);
      return [];
    }
  }, [history]); // Only depend on history array

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

  // ✅ SUMMARY CALCULATIONS - Fixed error handling
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
      const totalRevenue = history.reduce((sum, h) => {
        return sum + (h?.revenue_data?.total || 0);
      }, 0);
      
      const totalProfit = history.reduce((sum, h) => {
        const revenue = h?.revenue_data?.total || 0;
        const cogs = h?.cogs_data?.total || 0;
        const opex = h?.opex_data?.total || 0;
        const profit = revenue - cogs - opex;
        return sum + profit;
      }, 0);

      const averageMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

      // Find best and worst performing periods
      const periodsWithProfit = history
        .filter(h => h && h.revenue_data && h.cogs_data && h.opex_data)
        .map(h => ({
          ...h,
          profit: (h.revenue_data?.total || 0) - (h.cogs_data?.total || 0) - (h.opex_data?.total || 0)
        }));

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
  }, [history]); // Only depend on history

  // ✅ BREAKDOWN DATA - Fixed error handling
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
      const cogsTotal = currentAnalysis.cogs_data?.total || 0;
      const opexTotal = currentAnalysis.opex_data?.total || 0;
      const totalCosts = cogsTotal + opexTotal;
      
      const breakdown = [
        {
          category: 'HPP',
          amount: cogsTotal,
          percentage: totalCosts > 0 ? (cogsTotal / totalCosts) * 100 : 0
        },
        {
          category: 'Biaya Ops',
          amount: opexTotal,
          percentage: totalCosts > 0 ? (opexTotal / totalCosts) * 100 : 0
        }
      ];

      return breakdown;
    } catch (error) {
      console.error('Error processing cost breakdown:', error);
      return [];
    }
  }, [currentAnalysis?.cogs_data?.total, currentAnalysis?.opex_data?.total]);

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