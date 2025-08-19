// src/components/profitAnalysis/utils/analysis/complexAnalysis.ts
// Complex profit analysis utilities

import { FinancialTransactionActual, BahanBakuActual, OperationalCostActual } from '../../types/profitAnalysis.types';
import { PROFIT_CONSTANTS, FNB_THRESHOLDS, FNB_LABELS } from '../../constants/profitConstants';
import { calculateMargins, getEffectiveUnitPrice } from '../calculations/basicCalculations';
import { filterTransactionsByPeriod } from '../filters/dataFilters';
import { getMarginRating, getCOGSEfficiencyRating } from '../ratings/profitRatings';

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

  const currentMargins = calculateMargins(current.revenue, current.cogs, current.opex);
  const previousMargins = calculateMargins(previous.revenue, previous.cogs, previous.opex);

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
  const margins = calculateMargins(revenue, cogs, opex);
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