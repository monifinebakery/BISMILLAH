// 3. useProfitData.ts - Data processing utilities
// ==============================================

import { useState, useEffect, useMemo, useCallback } from 'react';
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

  // ✅ UTILITIES (moved up to fix dependency)
  const formatPeriodLabel = useCallback((period: string): string => {
    // Convert "2024-01" to "Jan 2024"
    const [year, month] = period.split('-');
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }, []);

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
  }, [chartData, formatPeriodLabel]);

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