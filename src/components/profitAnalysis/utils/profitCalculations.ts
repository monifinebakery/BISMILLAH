// 3. UTILS - src/components/profitAnalysis/utils/profitCalculations.ts
// ==============================================

import { ProfitAnalysis, RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { FinancialTransaction } from '@/components/financial/types/financial';
import { BahanBakuFrontend } from '@/components/warehouse/types';
import { OperationalCost } from '@/components/operational-costs/types';

/**
 * Calculate real-time profit analysis from raw data
 */
export const calculateRealTimeProfit = (
  period: string,
  transactions: FinancialTransaction[],
  materials: BahanBakuFrontend[],
  operationalCosts: OperationalCost[]
): RealTimeProfitCalculation => {
  
  // Filter transactions by period
  const periodTransactions = filterTransactionsByPeriod(transactions, period);
  
  // Calculate Revenue
  const revenueTransactions = periodTransactions.filter(t => t.type === 'income');
  const totalRevenue = revenueTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  
  // Calculate COGS (Cost of Goods Sold)
  // This would need additional logic to track material usage
  // For now, we'll use expense transactions with 'Pembelian Bahan Baku' category
  const cogsTransactions = periodTransactions.filter(t => 
    t.type === 'expense' && t.category === 'Pembelian Bahan Baku'
  );
  const totalCOGS = cogsTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  
  // Calculate OpEx (Operational Expenses)
  const activeCosts = operationalCosts.filter(c => c.status === 'aktif');
  const totalOpEx = activeCosts.reduce((sum, c) => sum + (c.jumlah_per_bulan || 0), 0);
  
  return {
    period,
    revenue_data: {
      total: totalRevenue,
      transactions: revenueTransactions
    },
    cogs_data: {
      total: totalCOGS,
      materials: [] // Would need material usage tracking
    },
    opex_data: {
      total: totalOpEx,
      costs: activeCosts
    },
    calculated_at: new Date().toISOString()
  };
};

/**
 * Calculate profit margins
 */
export const calculateMargins = (revenue: number, cogs: number, opex: number) => {
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - opex;
  
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  
  return {
    grossProfit,
    netProfit,
    grossMargin,
    netMargin
  };
};

/**
 * Filter transactions by period (YYYY-MM format)
 */
export const filterTransactionsByPeriod = (
  transactions: FinancialTransaction[], 
  period: string
): FinancialTransaction[] => {
  return transactions.filter(t => {
    if (!t.date) return false;
    const transactionPeriod = new Date(t.date).toISOString().slice(0, 7);
    return transactionPeriod === period;
  });
};

/**
 * Get margin rating based on thresholds
 */
export const getMarginRating = (margin: number, type: 'gross' | 'net') => {
  const thresholds = PROFIT_CONSTANTS.MARGIN_THRESHOLDS;
  
  if (margin >= thresholds.EXCELLENT[type]) return 'excellent';
  if (margin >= thresholds.GOOD[type]) return 'good';  
  if (margin >= thresholds.FAIR[type]) return 'fair';
  return 'poor';
};