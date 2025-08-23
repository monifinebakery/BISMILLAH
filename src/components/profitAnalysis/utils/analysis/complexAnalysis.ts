// src/components/profitAnalysis/utils/analysis/complexAnalysis.ts
// Complex profit analysis utilities with improved accuracy

import { FinancialTransactionActual, BahanBakuActual, OperationalCostActual, RealTimeProfitCalculation } from '../../types/profitAnalysis.types';
import { PROFIT_CONSTANTS, FNB_THRESHOLDS, FNB_LABELS } from '../../constants/profitConstants';
import { getEffectiveUnitPrice, calcHPP } from '../calculations/basicCalculations'; // Removed unused calculateMargins for consistency
import { safeCalculateMargins } from '@/utils/profitValidation';
import { filterTransactionsByPeriod, filterTransactionsByDateRange } from '../filters/dataFilters';
import { getMarginRating, getCOGSEfficiencyRating } from '../ratings/profitRatings';
import { logger } from '@/utils/logger';

/**
 * Calculate real-time profit analysis with actual schema
 * Supports both predefined periods and custom date ranges with improved accuracy
 */
export const calculateRealTimeProfit = (
  period: string,
  transactions: FinancialTransactionActual[],
  materials: BahanBakuActual[],
  operationalCosts: OperationalCostActual[],
  dateRange?: { from: Date; to: Date }
): RealTimeProfitCalculation => {
  logger.info('🔄 Calculating real-time profit (IMPROVED):', { 
    period, 
    hasDateRange: !!dateRange,
    transactionCount: transactions?.length || 0,
    materialCount: materials?.length || 0,
    costCount: operationalCosts?.length || 0
  });
  
  // Use improved date range filter if provided, otherwise use period filter
  const periodTransactions = dateRange 
    ? filterTransactionsByDateRange(transactions, dateRange.from, dateRange.to)
    : filterTransactionsByPeriod(transactions, period);
    
  logger.debug('📊 Filtered transactions:', {
    originalCount: transactions?.length || 0,
    filteredCount: periodTransactions.length,
    filterType: dateRange ? 'dateRange' : 'period'
  });

  const revenueTransactions = periodTransactions.filter(t => t.type === 'income');
  const totalRevenue = revenueTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  
  // Calculate COGS using effective price (WAC)
  const {
    totalHPP: totalCOGS,
    breakdown: materialBreakdown
  } = calcHPP(
    materials.map(m => ({ 
      bahan_baku_id: m.id, 
      qty_base: (Number(m.stok) || 0) * 0.1 // Estimasi pemakaian 10%
    })),
    Object.fromEntries(materials.map(m => [m.id, m]))
  );

  const activeCosts = operationalCosts.filter(c => c.status === 'aktif');
  const totalOpEx = activeCosts.reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0);

  const enhancedRevenueTransactions = revenueTransactions.map(t => ({
    category: t.category || 'Uncategorized',
    amount: Number(t.amount) || 0,
    description: t.description || '',
    date: t.date,
    id: t.id
  }));

  const enhancedCOGSTransactions = materialBreakdown.map(item => ({
    name: item.nama,
    cost: item.hpp,
    unit_price: item.price,
    quantity: item.qty,
    category: 'Direct Material'
  }));

  const enhancedOpExCosts = activeCosts.map(c => ({
    nama_biaya: c.nama_biaya,
    jumlah_per_bulan: Number(c.jumlah_per_bulan),
    jenis: c.jenis,
    cost_category: c.cost_category || 'general',
    id: c.id
  }));
  
  return {
    period,
    revenue_data: {
      total: totalRevenue,
      transactions: enhancedRevenueTransactions
    },
    cogs_data: {
      total: totalCOGS,
      materials: enhancedCOGSTransactions
    },
    opex_data: {
      total: totalOpEx,
      costs: enhancedOpExCosts
    },
    calculated_at: new Date().toISOString()
  };
};

/**
 * Analyze cost structure
 */
export const analyzeCostStructure = (
  revenue: number,
  materials: BahanBakuActual[],
  operationalCosts: OperationalCostActual[]
) => {
  // Calculate material costs
  const materialCosts = materials.reduce((sum, m) => {
    const qty = Number(m.stok) || 0;
    const price = getEffectiveUnitPrice(m);
    return sum + (qty * price * 0.1); // Estimate 10% usage
  }, 0);

  // Calculate operational costs
  const opexCosts = operationalCosts
    .filter(c => c.status === 'aktif')
    .reduce((sum, c) => sum + Number(c.jumlah_per_bulan), 0);

  // Calculate ratios
  const materialRatio = revenue > 0 ? (materialCosts / revenue) * 100 : 0;
  const opexRatio = revenue > 0 ? (opexCosts / revenue) * 100 : 0;
  const totalCostRatio = materialRatio + opexRatio;

  return {
    materialCosts,
    opexCosts,
    materialRatio,
    opexRatio,
    totalCostRatio,
    efficiencyRating: getCOGSEfficiencyRating(totalCostRatio),
    insights: {
      isMaterialHeavy: materialRatio > opexRatio,
      costOptimizationNeeded: totalCostRatio > FNB_THRESHOLDS.COGS_RATIOS.FAIR
    }
  };
};

/**
 * Calculate break-even analysis
 */
export const calculateBreakEvenAnalysis = (
  fixedCosts: number,
  variableCostRate: number, // Percentage of revenue
  targetProfit: number = 0
) => {
  // Contribution margin ratio (1 - variable cost rate)
  const contributionMarginRatio = 1 - (variableCostRate / 100);
  
  if (contributionMarginRatio <= 0) {
    return {
      breakEvenPoint: Infinity,
      targetRevenue: Infinity,
      contributionMarginRatio: 0,
      isValid: false
    };
  }

  const breakEvenPoint = fixedCosts / contributionMarginRatio;
  const targetRevenue = (fixedCosts + targetProfit) / contributionMarginRatio;

  return {
    breakEvenPoint,
    targetRevenue,
    contributionMarginRatio,
    isValid: true
  };
};

/**
 * Compare periods for trend analysis
 */
export const comparePeriods = (
  current: { revenue: number; cogs: number; opex: number },
  previous: { revenue: number; cogs: number; opex: number }
) => {
  const revenueChange = previous.revenue > 0 ? 
    ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0;
    
  const cogsChange = previous.cogs > 0 ? 
    ((current.cogs - previous.cogs) / previous.cogs) * 100 : 0;
    
  const opexChange = previous.opex > 0 ? 
    ((current.opex - previous.opex) / previous.opex) * 100 : 0;

  // ✅ IMPROVED: Use centralized calculation for consistency
  const currentMargins = safeCalculateMargins(current.revenue, current.cogs, current.opex);
  const previousMargins = safeCalculateMargins(previous.revenue, previous.cogs, previous.opex);

  const grossMarginChange = currentMargins.grossMargin - previousMargins.grossMargin;
  const netMarginChange = currentMargins.netMargin - previousMargins.netMargin;

  return {
    revenue: {
      value: current.revenue,
      change: revenueChange,
      trend: revenueChange > 1 ? 'up' : revenueChange < -1 ? 'down' : 'flat'
    },
    cogs: {
      value: current.cogs,
      change: cogsChange,
      trend: cogsChange > 1 ? 'up' : cogsChange < -1 ? 'down' : 'flat'
    },
    opex: {
      value: current.opex,
      change: opexChange,
      trend: opexChange > 1 ? 'up' : opexChange < -1 ? 'down' : 'flat'
    },
    grossMargin: {
      value: currentMargins.grossMargin,
      change: grossMarginChange,
      trend: grossMarginChange > 1 ? 'up' : grossMarginChange < -1 ? 'down' : 'flat'
    },
    netMargin: {
      value: currentMargins.netMargin,
      change: netMarginChange,
      trend: netMarginChange > 1 ? 'up' : netMarginChange < -1 ? 'down' : 'flat'
    }
  };
};

/**
 * Generate executive insights
 */
export const generateExecutiveInsights = (
  revenue: number,
  cogs: number,
  opex: number,
  materials: BahanBakuActual[],
  transactions: FinancialTransactionActual[]
) => {
  // ✅ IMPROVED: Use centralized calculation for consistency
  const margins = safeCalculateMargins(revenue, cogs, opex);
  const cogsRatio = revenue > 0 ? (cogs / revenue) * 100 : 0;
  
  const insights: string[] = [];
  const recommendations: string[] = [];

  // Revenue insights
  if (revenue < FNB_THRESHOLDS.ALERTS.low_revenue) {
    insights.push('Pendapatan rendah dibawah benchmark industri');
    recommendations.push('Pertimbangkan strategi pemasaran untuk meningkatkan volume penjualan');
  }

  // COGS insights
  const cogsPercentage = revenue > 0 ? (cogs / revenue) * 100 : 0;
  if (cogsPercentage > FNB_THRESHOLDS.ALERTS.high_ingredient_cost * 100) {
    insights.push('Biaya bahan baku tinggi, melebihi batas optimal');
    recommendations.push('Evaluasi supplier dan negosiasikan harga yang lebih baik');
  }

  // Margin insights
  const netMarginRating = getMarginRating(margins.netMargin, 'net');
  if (netMarginRating === 'poor') {
    insights.push('Margin keuntungan bersih rendah');
    recommendations.push('Optimalkan struktur biaya dan pertimbangkan peningkatan harga');
  }

  // Transaction insights
  const transactionCount = transactions.length;
  if (transactionCount < 10) {
    insights.push('Volume transaksi rendah');
    recommendations.push('Tingkatkan frekuensi penjualan melalui promosi dan retensi pelanggan');
  }

  return {
    insights,
    recommendations,
    riskLevel: cogsPercentage > 40 ? 'high' : cogsPercentage > 30 ? 'medium' : 'low',
    urgency: netMarginRating === 'poor' ? 'high' : 'normal'
  };
};