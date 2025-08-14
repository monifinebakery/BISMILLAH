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
