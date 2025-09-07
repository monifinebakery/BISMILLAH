// src/components/profitAnalysis/services/utilityFunctions.ts
// Utility functions untuk profit analysis

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import financialApi from '@/components/financial/services/financialApi';
import { ProfitApiResponse, RevenueBreakdown, RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { FNB_THRESHOLDS } from '../constants/profitConstants';

/**
 * Assess data quality and generate insights
 */
export const assessDataQuality = (calculation: RealTimeProfitCalculation): {
  score: number;
  issues: string[];
  recommendations: string[];
} => {
  let score = 100; // Start with perfect score
  const issues: string[] = [];
  const recommendations: string[] = [];

  const { revenue_data, cogs_data, opex_data } = calculation;
  const revenue = revenue_data?.total || 0;
  const cogs = cogs_data?.total || 0;
  const opex = opex_data?.total || 0;

  // Check for missing data
  if (revenue <= 0) {
    score -= 30;
    issues.push('❌ Tidak ada data penjualan/omset untuk periode ini');
    recommendations.push('📊 Pastikan transaksi income sudah diinput');
  }

  if (cogs <= 0 && revenue > 0) {
    score -= 20;
    issues.push('⚠️ Tidak ada data biaya bahan baku (COGS)');
    recommendations.push('🥘 Input pemakaian bahan atau pembelian bahan baku');
  }

  if (opex <= 0 && revenue > 0) {
    score -= 10;
    issues.push('⚠️ Tidak ada data biaya operasional bulanan');
    recommendations.push('🏪 Setup biaya tetap seperti sewa, listrik, gaji');
  }

  // F&B specific quality checks
  const cogsRatio = revenue > 0 ? cogs / revenue : 0;
  
  if (cogsRatio > FNB_THRESHOLDS.ALERTS.high_ingredient_cost) {
    score -= 10;
    issues.push(`🥘 Modal bahan baku terlalu tinggi (${(cogsRatio * 100).toFixed(1)}% dari omset)`);
    recommendations.push('📊 Review supplier dan porsi menu');
  }
  
  if (opex > revenue * 0.3) { // F&B specific: OpEx shouldn't exceed 30% of revenue
    score -= 10;
    issues.push('🏪 Biaya bulanan tetap terlalu tinggi untuk warung F&B');
    recommendations.push('💰 Cari cara hemat listrik, sewa, atau gaji');
  }
  
  // Low revenue warning for F&B
  if (revenue > 0 && revenue < FNB_THRESHOLDS.ALERTS.low_revenue) {
    score -= 5;
    issues.push('📋 Omset masih di bawah rata-rata warung yang sehat');
    recommendations.push('🚀 Fokus promosi dan tambah jam buka');
  }
  
  return {
    score: Math.max(0, score),
    issues,
    recommendations
  };
};

/**
 * Generate period strings based on date range
 */
export const generatePeriods = (from: Date, to: Date, periodType: 'monthly' | 'quarterly' | 'yearly'): string[] => {
  const periods: string[] = [];
  const current = new Date(from);
  const end = new Date(to);

  while (current <= end) {
    if (periodType === 'monthly') {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      periods.push(`${year}-${month}`); // YYYY-MM
      current.setMonth(current.getMonth() + 1);
    } else if (periodType === 'quarterly') {
      const quarter = Math.floor(current.getMonth() / 3) + 1;
      periods.push(`${current.getFullYear()}-Q${quarter}`);
      current.setMonth(current.getMonth() + 3);
    } else if (periodType === 'yearly') {
      periods.push(current.getFullYear().toString());
      current.setFullYear(current.getFullYear() + 1);
    }
  }

  return periods;
};

/**
 * Convert a period string (e.g., 2024-05, 2024-Q1, 2024) into a date range
 */
export const getDateRangeFromPeriod = (period: string): { from: Date; to: Date } => {
  if (period.includes('-Q')) {
    const [yearStr, quarterStr] = period.split('-Q');
    const year = Number(yearStr);
    const quarter = Number(quarterStr);
    const startMonth = (quarter - 1) * 3;
    const from = new Date(year, startMonth, 1);
    const to = new Date(year, startMonth + 3, 0);
    return { from, to };
  }

  if (period.length === 7) {
    const [yearStr, monthStr] = period.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr) - 1;
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0);
    return { from, to };
  }

  const year = Number(period);
  const from = new Date(year, 0, 1);
  const to = new Date(year, 11, 31);
  return { from, to };
};

/**
 * Fallback revenue breakdown using direct API calls
 */
export const getRevenueBreakdownFallback = async (
  userId: string,
  period: string
): Promise<ProfitApiResponse<RevenueBreakdown[]>> => {
  try {
    const { from, to } = getDateRangeFromPeriod(period);
    const transactions = await financialApi.getTransactionsByDateRange(userId, from, to);
    const incomeTransactions = transactions.filter(t => t.type === 'income');

    const totalRevenue = incomeTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Group by category
    const categoryGroups = incomeTransactions.reduce((groups, transaction) => {
      const category = transaction.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = { total: 0, count: 0 };
      }
      groups[category].total += transaction.amount || 0;
      groups[category].count += 1;
      return groups;
    }, {} as Record<string, { total: number; count: number }>);

    const breakdown: RevenueBreakdown[] = Object.entries(categoryGroups).map(([category, data]) => ({
      category,
      amount: data.total,
      percentage: totalRevenue > 0 ? (data.total / totalRevenue) * 100 : 0,
      transaction_count: data.count
    }));

    return {
      data: breakdown,
      success: true
    };

  } catch (error) {
    logger.error('❌ Error in revenue breakdown fallback:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Gagal mengambil breakdown revenue',
      success: false
    };
  }
};

/**
 * Get warehouse data helper (compatibility with existing API)
 */
export const getWarehouseData = async (userId: string) => {
  try {
    // Use direct Supabase query instead of warehouse API
    const { data, error } = await supabase
      .from('bahan_baku')
      .select('*')
      .eq('user_id', userId);
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.warn('⚠️ Failed to fetch warehouse data:', error);
    return [];
  }
};
