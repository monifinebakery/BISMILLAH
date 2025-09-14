// ==============================================
// FALLBACK HELPERS
// Fallback functions when stored procedures fail
// ==============================================

import { logger } from '@/utils/logger';
import { 
  ProfitApiResponse,
  RevenueBreakdown,
  OpExBreakdown
} from '../types/profitAnalysis.types';
import financialApi from '@/components/financial/services/financialApi';
import { operationalCostApi } from '@/components/operational-costs/services/operationalCostApi';
import { getDateRangeFromPeriod } from './dataProcessingHelpers';

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
 * Fallback OpEx breakdown using direct API calls
 */
export const getOpExBreakdownFallback = async (
  userId: string
): Promise<ProfitApiResponse<OpExBreakdown[]>> => {
  try {
    const opexResult = await operationalCostApi.getCosts(undefined, userId);
    const activeCosts = (opexResult.data || []).filter(c => c.status === 'aktif');
    const totalOpEx = activeCosts.reduce((sum, c) => sum + (c.jumlah_per_bulan || 0), 0);

  const breakdown: OpExBreakdown[] = activeCosts.map(cost => ({
    cost_name: cost.nama_biaya,
    amount: Number(cost.jumlah_per_bulan) || 0,
    type: cost.jenis as 'tetap' | 'variabel',
    percentage: totalOpEx > 0 ? ((cost.jumlah_per_bulan || 0) / totalOpEx) * 100 : 0
  }));

    return {
      data: breakdown,
      success: true
    };
  } catch (error) {
    logger.error('❌ Error in OpEx breakdown fallback:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Gagal mengambil breakdown OpEx',
      success: false
    };
  }
};
