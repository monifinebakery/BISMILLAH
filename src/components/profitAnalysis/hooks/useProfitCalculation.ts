// useProfitCalculation.ts - Enhanced with F&B specific calculations
// ==============================================

import { useCallback } from 'react';
import { RealTimeProfitCalculation, FNBCOGSBreakdown, FNBInsight } from '../types/profitAnalysis.types';

// ✅ Import calculation utilities
import { 
  calculateMargins, 
  getMarginRating, 
  filterTransactionsByPeriod,
  filterTransactionsByDateRange
} from '../utils/profitCalculations';

// 🍽️ Import F&B constants and thresholds
import { FNB_THRESHOLDS, FNB_LABELS } from '../constants/profitConstants';

// Types for external dependencies
interface FinancialTransaction {
  id?: string;
  type: 'income' | 'expense';
  category?: string;
  amount?: number;
  date?: string | Date; // ✅ PERBAIKAN 2: Tambah field date untuk kompatibilitas filter
  user_id?: string;
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
  dateRange?: { from: Date; to: Date }; // Add custom date range support
}

export interface UseProfitCalculationReturn {
  // Calculations
  calculateLocalProfit: (
    transactions: FinancialTransaction[],
    materials: BahanBakuFrontend[],
    costs: OperationalCost[],
    period: string,
    dateRange?: { from: Date; to: Date }
  ) => {
    revenue: number;
    cogs: number;
    opex: number;
    grossProfit: number;
    netProfit: number;
    grossMargin: number;
    netMargin: number;
  };
  
  // 🍽️ F&B specific margin analysis
  analyzeMargins: (grossMargin: number, netMargin: number) => {
    grossRating: string;
    netRating: string;
    recommendations: string[];
    fnbSpecific: {
      cogsRatio: number;
      cogsRating: string;
      fnbRecommendations: string[];
    };
  };
  
  // 📊 Enhanced F&B analytics
  analyzeFNBMetrics: (revenue: number, cogs: number, hppBreakdown: FNBCOGSBreakdown[]) => {
    insights: FNBInsight[];
    expensiveItems: FNBCOGSBreakdown[];
    cogsEfficiency: 'excellent' | 'good' | 'fair' | 'poor';
    suggestedActions: string[];
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
  
  // ✅ LOCAL PROFIT CALCULATION - Now supports both period and date range filtering
  const calculateLocalProfit = useCallback((
    transactions: FinancialTransaction[],
    materials: BahanBakuFrontend[],
    costs: OperationalCost[],
    period: string,
    dateRange?: { from: Date; to: Date }
  ) => {
    try {
      // Filter transactions - use date range if provided, otherwise use period
      const periodTransactions = dateRange 
        ? filterTransactionsByDateRange(transactions as any || [], dateRange.from, dateRange.to)
        : filterTransactionsByPeriod(transactions as any || [], period);
      
      // Calculate revenue
      const revenueTransactions = periodTransactions.filter(t => t?.type === 'income');
      const revenue = revenueTransactions.reduce((sum, t) => sum + (t?.amount || 0), 0);
      
      // Calculate COGS
      const cogsTransactions = periodTransactions.filter(t => 
        t?.type === 'expense' && t?.category === 'Pembelian Bahan Baku'
      );
      
      // 🔍 DEBUG: Enhanced logging for COGS calculation
      console.log('🔍 COGS Calculation Debug:', {
        period,
        totalTransactions: transactions?.length || 0,
        periodTransactions: periodTransactions.length,
        cogsTransactions: cogsTransactions.length,
        cogsTransactionDetails: cogsTransactions.map(t => ({
          id: t.id,
          type: t.type,
          category: t.category,
          amount: t.amount,
          description: t.description,
          date: t.date
        })),
        hasDateRange: !!dateRange,
        dateRange: dateRange ? {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        } : null
      });
      
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

  // 🍽️ Enhanced F&B MARGIN ANALYSIS
  const analyzeMargins = useCallback((grossMargin: number, netMargin: number) => {
    try {
      const grossRating = getMarginRating(grossMargin || 0, 'gross');
      const netRating = getMarginRating(netMargin || 0, 'net');
      
      const recommendations: string[] = [];
      
      // 🍽️ F&B specific recommendations
      if (grossRating === 'poor') {
        recommendations.push('🥘 Coba negosiasi harga bahan baku dengan supplier atau cari supplier alternatif');
        recommendations.push('💰 Pertimbangkan naikkan harga menu yang margin-nya tipis');
      }
      if (netRating === 'poor') {
        recommendations.push('🏪 Cek biaya bulanan: listrik, sewa, gaji - mana yang bisa dihemat');
        recommendations.push('📦 Pertimbangkan delivery sendiri daripada pakai ojol terus');
      }
      if (grossRating === 'excellent' && netRating === 'poor') {
        recommendations.push('👍 Modal bahan sudah oke, fokus kurangi biaya tetap bulanan');
      }
      if (grossRating === 'good' && netRating === 'good') {
        recommendations.push('🎉 Warung Anda sudah sehat! Saatnya expand atau tambah menu baru');
      }
      
      // Calculate COGS ratio for F&B specific analysis
      const cogsRatio = grossMargin > 0 ? (100 - grossMargin) / 100 : 0;
      let cogsRating = 'poor';
      
      if (cogsRatio <= FNB_THRESHOLDS.COGS_RATIOS.EXCELLENT) cogsRating = 'excellent';
      else if (cogsRatio <= FNB_THRESHOLDS.COGS_RATIOS.GOOD) cogsRating = 'good';
      else if (cogsRatio <= FNB_THRESHOLDS.COGS_RATIOS.FAIR) cogsRating = 'fair';
      
      const fnbRecommendations: string[] = [];
      if (cogsRating === 'poor') {
        fnbRecommendations.push('⚠️ Modal bahan terlalu tinggi untuk bisnis F&B (ideal < 45%)');
        fnbRecommendations.push('🔍 Analisis menu mana yang paling boros bahan');
      }
      
      return {
        grossRating: grossRating || 'poor',
        netRating: netRating || 'poor',
        recommendations,
        fnbSpecific: {
          cogsRatio: cogsRatio * 100,
          cogsRating,
          fnbRecommendations
        }
      };
    } catch (error) {
      console.error('Error analyzing margins:', error);
      return {
        grossRating: 'poor',
        netRating: 'poor',
        recommendations: ['❌ Terjadi kesalahan dalam analisis margin'],
        fnbSpecific: {
          cogsRatio: 0,
          cogsRating: 'poor',
          fnbRecommendations: []
        }
      };
    }
  }, []);

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

  // 🍽️ NEW: F&B specific metrics analysis
  const analyzeFNBMetrics = useCallback((
    revenue: number, 
    cogs: number, 
    hppBreakdown: FNBCOGSBreakdown[]
  ) => {
    try {
      const insights: FNBInsight[] = [];
      const suggestedActions: string[] = [];
      
      // Find expensive items (> 500k or > 15% of total COGS)
      const expensiveItems = hppBreakdown.filter(item => 
        item.total_cost > FNB_THRESHOLDS.ALERTS.expensive_item_threshold ||
        item.percentage > 15
      );
      
      // Analyze COGS efficiency
      const cogsRatio = revenue > 0 ? cogs / revenue : 0;
      let cogsEfficiency: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
      
      if (cogsRatio <= FNB_THRESHOLDS.COGS_RATIOS.EXCELLENT) {
        cogsEfficiency = 'excellent';
      } else if (cogsRatio <= FNB_THRESHOLDS.COGS_RATIOS.GOOD) {
        cogsEfficiency = 'good';
      } else if (cogsRatio <= FNB_THRESHOLDS.COGS_RATIOS.FAIR) {
        cogsEfficiency = 'fair';
      }
      
      // Generate insights based on analysis
      if (expensiveItems.length > 0) {
        insights.push({
          id: 'expensive-ingredients',
          type: 'alert',
          title: `🚨 ${expensiveItems.length} bahan baku termahal`,
          description: `Bahan: ${expensiveItems.map(i => i.item_name).join(', ')}`,
          impact: 'high',
          category: 'cost_control',
          actionable: true,
          action: {
            label: 'Lihat detail',
            type: 'internal',
            data: expensiveItems
          },
          icon: '🥘'
        });
        
        suggestedActions.push('🔍 Negosiasi harga dengan supplier untuk bahan termahal');
        suggestedActions.push('🔄 Cari supplier alternatif dengan harga lebih kompetitif');
      }
      
      if (cogsEfficiency === 'poor') {
        insights.push({
          id: 'high-cogs-ratio',
          type: 'alert',
          title: '⚠️ Modal bahan terlalu tinggi',
          description: `${Math.round(cogsRatio * 100)}% dari omset (ideal <45%)`,
          impact: 'high',
          category: 'cost_control',
          actionable: true,
          icon: '📉'
        });
        
        suggestedActions.push('📊 Review porsi dan resep untuk efisiensi bahan');
        suggestedActions.push('💰 Pertimbangkan penyesuaian harga menu');
      }
      
      if (cogsEfficiency === 'excellent') {
        insights.push({
          id: 'excellent-cogs',
          type: 'opportunity',
          title: '🎆 Kontrol modal bahan sangat baik!',
          description: 'Efisiensi bahan baku Anda sudah optimal',
          impact: 'medium',
          category: 'efficiency',
          actionable: false,
          icon: '✅'
        });
      }
      
      return {
        insights,
        expensiveItems,
        cogsEfficiency,
        suggestedActions
      };
    } catch (error) {
      console.error('Error analyzing F&B metrics:', error);
      return {
        insights: [],
        expensiveItems: [],
        cogsEfficiency: 'poor' as const,
        suggestedActions: ['❌ Terjadi kesalahan dalam analisis F&B']
      };
    }
  }, []);

  return {
    calculateLocalProfit,
    analyzeMargins,
    comparePeriods,
    generateForecast,
    // 🍽️ F&B specific functions
    analyzeFNBMetrics
  };
};