// useProfitCalculation.ts - Fixed Dynamic Import Issues
// ==============================================

import { useCallback } from 'react';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';

// ✅ FIX: Use static imports instead of dynamic require
import { 
  calculateMargins, 
  getMarginRating, 
  filterTransactionsByPeriod 
} from '../utils/profitCalculations';

// Types for external dependencies
interface FinancialTransaction {
  type: 'income' | 'expense';
  category?: string;
  amount?: number;
  date?: string; // ✅ PERBAIKAN 2: Tambah field date untuk kompatibilitas filter
}

interface BahanBakuFrontend {
  id: string;
  name?: string;
}

interface OperationalCost {
  status: string;
  jumlah_per_bulan?: number;
  nama_biaya?: string;
  jenis?: string;
}

export interface UseProfitCalculationOptions {
  period?: string;
  transactions?: FinancialTransaction[];
  materials?: BahanBakuFrontend[];
  operationalCosts?: OperationalCost[];
}

export interface UseProfitCalculationReturn {
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
  
  // ✅ LOCAL PROFIT CALCULATION - No dependencies needed
  const calculateLocalProfit = useCallback((
    transactions: FinancialTransaction[],
    materials: BahanBakuFrontend[],
    costs: OperationalCost[],
    period: string
  ) => {
    try {
      // Filter transactions for the period
      const periodTransactions = filterTransactionsByPeriod(transactions || [], period);
      
      // Calculate revenue
      const revenueTransactions = periodTransactions.filter(t => t?.type === 'income');
      const revenue = revenueTransactions.reduce((sum, t) => sum + (t?.amount || 0), 0);
      
      // Calculate COGS
      const cogsTransactions = periodTransactions.filter(t => 
        t?.type === 'expense' && t?.category === 'Pembelian Bahan Baku'
      );
      const cogs = cogsTransactions.reduce((sum, t) => sum + (t?.amount || 0), 0);
      
      // Calculate OpEx
      const activeCosts = (costs || []).filter(c => c?.status === 'aktif');
      const opex = activeCosts.reduce((sum, c) => sum + (c?.jumlah_per_bulan || 0), 0);
      
      // Calculate profits and margins
      const margins = calculateMargins(revenue, cogs, opex);
      
      return {
        revenue,
        cogs,
        opex,
        grossProfit: margins.grossProfit || 0,
        netProfit: margins.netProfit || 0,
        grossMargin: margins.grossMargin || 0,
        netMargin: margins.netMargin || 0
      };
    } catch (error) {
      console.error('Error calculating local profit:', error);
      return {
        revenue: 0,
        cogs: 0,
        opex: 0,
        grossProfit: 0,
        netProfit: 0,
        grossMargin: 0,
        netMargin: 0
      };
    }
  }, []); // No dependencies needed for this calculation

  // ✅ MARGIN ANALYSIS - No dependencies needed
  const analyzeMargins = useCallback((grossMargin: number, netMargin: number) => {
    try {
      // ✅ PERBAIKAN 1: Kirim nilai dalam persen, bukan desimal
      const grossRating = getMarginRating(grossMargin || 0, 'gross');
      const netRating = getMarginRating(netMargin || 0, 'net');
      
      const recommendations: string[] = [];
      
      if (grossRating === 'poor') {
        recommendations.push('Pertimbangkan untuk mengurangi biaya bahan baku atau meningkatkan harga jual');
      }
      if (netRating === 'poor') {
        recommendations.push('Review dan optimalisasi biaya operasional yang tidak perlu');
      }
      if (grossRating === 'excellent' && netRating === 'poor') {
        recommendations.push('HPP sudah baik, fokus pada efisiensi operasional');
      }
      if (grossRating === 'good' && netRating === 'good') {
        recommendations.push('Performa baik, pertahankan dan cari peluang pertumbuhan');
      }
      
      return {
        grossRating: grossRating || 'poor',
        netRating: netRating || 'poor',
        recommendations
      };
    } catch (error) {
      console.error('Error analyzing margins:', error);
      return {
        grossRating: 'poor',
        netRating: 'poor',
        recommendations: ['Terjadi kesalahan dalam analisis margin']
      };
    }
  }, []); // No dependencies needed

  // ✅ PERIOD COMPARISON - No dependencies needed
  const comparePeriods = useCallback((
    current: RealTimeProfitCalculation,
    previous: RealTimeProfitCalculation
  ) => {
    try {
      if (!current || !previous) {
        return {
          revenueChange: 0,
          profitChange: 0,
          marginChange: 0,
          trend: 'stable' as const
        };
      }

      const currentRevenue = current.revenue_data?.total || 0;
      const previousRevenue = previous.revenue_data?.total || 0;
      const revenueChange = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;

      const currentProfit = currentRevenue - (current.cogs_data?.total || 0) - (current.opex_data?.total || 0);
      const previousProfit = previousRevenue - (previous.cogs_data?.total || 0) - (previous.opex_data?.total || 0);
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
    } catch (error) {
      console.error('Error comparing periods:', error);
      return {
        revenueChange: 0,
        profitChange: 0,
        marginChange: 0,
        trend: 'stable' as const
      };
    }
  }, []); // No dependencies needed

  // ✅ SIMPLE FORECASTING - No dependencies needed
  const generateForecast = useCallback((
    history: RealTimeProfitCalculation[], 
    periods: number
  ) => {
    try {
      if (!Array.isArray(history) || history.length < 3) {
        return {
          projectedRevenue: 0,
          projectedProfit: 0,
          confidence: 0
        };
      }

      // Simple linear trend calculation
      const revenueValues = history.map(h => h?.revenue_data?.total || 0);
      const profitValues = history.map(h => {
        const revenue = h?.revenue_data?.total || 0;
        const cogs = h?.cogs_data?.total || 0;
        const opex = h?.opex_data?.total || 0;
        return revenue - cogs - opex;
      });

      const avgRevenueGrowth = revenueValues.reduce((acc, val, idx) => {
        if (idx === 0) return acc;
        const prevVal = revenueValues[idx - 1];
        if (prevVal <= 0) return acc;
        const growth = (val - prevVal) / prevVal;
        return acc + growth;
      }, 0) / Math.max(revenueValues.length - 1, 1);

      const avgProfitGrowth = profitValues.reduce((acc, val, idx) => {
        if (idx === 0) return acc;
        const prevVal = profitValues[idx - 1];
        if (prevVal <= 0) return acc;
        const growth = (val - prevVal) / prevVal;
        return acc + growth;
      }, 0) / Math.max(profitValues.length - 1, 1);

      const lastRevenue = revenueValues[revenueValues.length - 1] || 0;
      const lastProfit = profitValues[profitValues.length - 1] || 0;

      const projectedRevenue = lastRevenue * Math.pow(1 + avgRevenueGrowth, periods);
      const projectedProfit = lastProfit * Math.pow(1 + avgProfitGrowth, periods);
      
      // Confidence based on data consistency (simplified)
      const confidence = Math.min(history.length * 20, 80); // Max 80% confidence

      return {
        projectedRevenue: Math.max(0, projectedRevenue),
        projectedProfit: Math.max(0, projectedProfit),
        confidence
      };
    } catch (error) {
      console.error('Error generating forecast:', error);
      return {
        projectedRevenue: 0,
        projectedProfit: 0,
        confidence: 0
      };
    }
  }, []); // No dependencies needed

  return {
    calculateLocalProfit,
    analyzeMargins,
    comparePeriods,
    generateForecast
  };
};