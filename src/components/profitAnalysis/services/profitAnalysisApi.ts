// ==============================================
// REFACTORED PROFIT ANALYSIS API - Modular & Clean
// Main API methods only, using modular services
// ==============================================

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { getCurrentUserId } from '@/utils/authHelpers';
import {
  ProfitApiResponse,
  DateRangeFilter,
  RevenueBreakdown,
  COGSBreakdown,
  OpExBreakdown,
  FNBCOGSBreakdown,
  FNBAnalysisResult,
  FNBInsight,
  RealTimeProfitCalculation
} from '../types/profitAnalysis.types';

// Import existing APIs with compatibility
import financialApi from '@/components/financial/services/financialApi';
import { warehouseApi, getWarehouseDataByDateRange } from '@/components/warehouse/services/warehouseApi';
import { operationalCostApi } from '@/components/operational-costs/services/operationalCostApi';

import { calculateRealTimeProfit, generateExecutiveInsights, getCOGSEfficiencyRating } from '../utils/profitCalculations';
import { safeCalculateMargins } from '@/utils/profitValidation';
import { transformToFNBCOGSBreakdown, getCurrentPeriod } from '../utils/profitTransformers';
import { FNB_THRESHOLDS, FNB_LABELS } from '../constants/profitConstants';
import { UnifiedDateHandler, ProfitAnalysisDateUtils, normalizeDateForDatabase } from '@/utils/unifiedDateHandler';
import { generateDayList, calculateDailyOpEx } from '@/utils/dateNormalization';

// Import from modular services
import { parseTransactions, parseCOGSTransactions, parseOpExCosts, calculatePemakaianValue } from './dataParsers';
import { assessDataQuality, generatePeriods, getDateRangeFromPeriod, getRevenueBreakdownFallback, getWarehouseData } from './utilityFunctions';
import { calculateFNBProfitAnalysis, getFNBCOGSBreakdown, categorizeFNBItem } from './fnbAnalysis';
import { fetchBahanMap, fetchPemakaianByPeriode, fetchPemakaianDailyAggregates, getEffectiveUnitPrice } from './warehouseHelpers';

// ===== EXPORTED HELPERS FOR BACKWARD COMPATIBILITY =====
export {
  fetchBahanMap,
  fetchPemakaianByPeriode,
  fetchPemakaianDailyAggregates,
  getEffectiveUnitPrice
} from './warehouseHelpers';

export {
  calculatePemakaianValue,
  parseTransactions,
  parseCOGSTransactions,
  parseOpExCosts
} from './dataParsers';

/**
 * Calculate daily profit analysis for a date range (inclusive)
 */
export async function calculateProfitAnalysisDaily(
  from: Date,
  to: Date
): Promise<ProfitApiResponse<RealTimeProfitCalculation[]>> {
  try {
    const authUserId = await getCurrentUserId();
    if (!authUserId) return { data: [], success: false, error: 'Not authenticated' };

    const { startDate, endDate, startYMD, endYMD } = ProfitAnalysisDateUtils.normalizeDateRange(from, to);

    logger.info('📅 Daily profit analysis:', { startYMD, endYMD });

    // Fetch financial transactions
    const { data: trx, error: trxErr } = await supabase
      .from('financial_transactions')
      .select('id, user_id, type, category, amount, description, date')
      .eq('user_id', authUserId)
      .gte('date', startYMD)
      .lte('date', endYMD)
      .order('date', { ascending: true });
    
    if (trxErr) throw trxErr;

    // Group income by day
    const incomeByDay = new Map<string, number>();
    const incomeTransactions = (trx || []).filter((t: any) => t.type === 'income');
    
    incomeTransactions.forEach((t: any) => {
      if (!t.date) return;
      const dayKey = normalizeDateForDatabase(new Date(t.date));
      const amount = Number(t.amount) || 0;
      incomeByDay.set(dayKey, (incomeByDay.get(dayKey) || 0) + amount);
    });

    // WAC-based COGS
    const cogsByDay = await fetchPemakaianDailyAggregates(startYMD, endYMD);

    // OpEx daily pro-rata
    const opCostsResult = await operationalCostApi.getCostsByDateRange(startDate, endDate, authUserId);
    const activeCosts = (opCostsResult.data || []).filter((c: any) => c.status === 'aktif');
    const activeMonthly = activeCosts.reduce((s: number, c: any) => s + Number(c.jumlah_per_bulan || 0), 0);

    // Build day list
    const days = generateDayList(startDate, endDate);
    
    const results: RealTimeProfitCalculation[] = days.map((dayKey) => {
      const revenue = incomeByDay.get(dayKey) || 0;
      const cogs = cogsByDay.get(dayKey) || 0;
      const dateObj = new Date(dayKey + 'T00:00:00');
      const dailyOpex = calculateDailyOpEx(activeMonthly, dateObj);
      
      return {
        period: dayKey,
        revenue_data: { 
          total: revenue, 
          transactions: []
        },
        cogs_data: { 
          total: Math.round(cogs), 
          materials: []
        },
        opex_data: { 
          total: Math.round(dailyOpex), 
          costs: []
        },
        calculated_at: new Date().toISOString(),
      };
    });
    
    const totalRevenue = results.reduce((sum, r) => sum + r.revenue_data.total, 0);
    const totalCOGS = results.reduce((sum, r) => sum + r.cogs_data.total, 0);
    const totalOpEx = results.reduce((sum, r) => sum + r.opex_data.total, 0);
    
    logger.success('✅ Daily profit analysis completed:', {
      days: results.length,
      totalRevenue,
      totalCOGS,
      totalOpEx
    });

    return { data: results, success: true };

  } catch (error) {
    logger.error('❌ Error in daily profit analysis:', error);
    return {
      data: [],
      error: error instanceof Error ? error.message : 'Gagal menghitung analisis harian',
      success: false
    };
  }
}

// ===== MAIN API OBJECT =====

/**
 * Enhanced Profit Analysis API - Clean & Modular
 */
export const profitAnalysisApi = {
  
  /**
   * ✅ PRIMARY METHOD: Calculate real-time profit using stored function (faster)
   * Falls back to API integration if stored function fails
   */
  async calculateProfitAnalysis(
    period: string, 
    periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ): Promise<ProfitApiResponse<RealTimeProfitCalculation>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { 
          data: {} as RealTimeProfitCalculation, 
          error: 'User tidak ditemukan. Silakan login kembali.',
          success: false 
        };
      }

      logger.info('🔄 Calculating profit analysis for period:', period);
      
      // ✅ TRY METHOD 1: Use stored function (fastest, most accurate)
      try {
        const { data: profitData, error: profitError } = await (supabase as any)
          .rpc('calculate_realtime_profit', {
            p_user_id: userId,
            p_period: period
          });

        if (!profitError && profitData && profitData.length > 0) {
          const result = profitData[0];
          
          const calculation: RealTimeProfitCalculation = {
            period,
            revenue_data: {
              total: Number(result.total_revenue) || 0,
              transactions: parseTransactions(result.revenue_transactions)
            },
            cogs_data: {
              total: Number(result.total_cogs) || 0,
              materials: parseCOGSTransactions(result.cogs_transactions)
            },
            opex_data: {
              total: Number(result.total_opex) || 0,
              costs: parseOpExCosts(result.opex_costs)
            },
            calculated_at: new Date().toISOString()
          };

          logger.success('✅ Stored function calculation completed:', {
            period,
            revenue: calculation.revenue_data.total,
            cogs: calculation.cogs_data.total,
            opex: calculation.opex_data.total
          });

          return {
            data: calculation,
            success: true,
            message: 'Analisis profit berhasil dihitung (stored function)'
          };
        }
      } catch (storedFunctionError) {
        logger.warn('⚠️ Stored function failed, falling back to API integration:', storedFunctionError);
      }

      // ✅ FALLBACK METHOD 2: Use API integration
      logger.info('🔄 Using API integration fallback');
      
      const { from, to } = getDateRangeFromPeriod(period);

      const [
        transactions,
        materials,
        operationalCosts
      ] = await Promise.all([
        financialApi.getTransactionsByDateRange(userId, from, to),
        getWarehouseDataByDateRange(userId, from, to),
        operationalCostApi.getCostsByDateRange(from, to, userId)
      ]);

      // Handle potential errors from data sources
      if (!Array.isArray(transactions)) {
        throw new Error('Failed to fetch financial transactions');
      }

      const materialsData = Array.isArray(materials) ? materials.map(m => ({
        id: m.id,
        nama: m.nama,
        stok: m.stok,
        unit_price: m.harga,
        status: 'aktif' as const,
        user_id: userId
      })) : [];
      const costsData = operationalCosts.data || [];
      
      // Convert transactions to expected format
      const transactionsActual = transactions.map(t => ({
        id: t.id,
        type: t.type,
        category: t.category || undefined,
        amount: t.amount,
        date: typeof t.date === 'string' ? t.date : (t.date?.toISOString() || new Date().toISOString()),
        description: t.description || undefined,
        user_id: userId
      }));
      
      // Calculate profit analysis using utility function
      const calculation = calculateRealTimeProfit(
        period,
        transactionsActual,
        materialsData,
        costsData
      );

      logger.success('✅ API integration calculation completed:', {
        period,
        revenue: calculation.revenue_data.total,
        cogs: calculation.cogs_data.total,
        opex: calculation.opex_data.total
      });

      return {
        data: calculation,
        success: true,
        message: 'Analisis profit berhasil dihitung (API integration)'
      };

    } catch (error) {
      logger.error('❌ Error calculating profit analysis:', error);
      return {
        data: {} as RealTimeProfitCalculation,
        error: error instanceof Error ? error.message : 'Gagal menghitung analisis profit',
        success: false
      };
    }
  },

  /**
   * ✅ Get profit history for multiple periods
   */
  async getProfitHistory(
    dateRange: DateRangeFilter,
    periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ): Promise<ProfitApiResponse<RealTimeProfitCalculation[]>> {
    try {
      const periods = generatePeriods(dateRange.from, dateRange.to, periodType);
      
      const calculations: RealTimeProfitCalculation[] = [];
      
      for (const period of periods) {
        const result = await this.calculateProfitAnalysis(period, periodType);
        if (result.success && result.data) {
          calculations.push(result.data);
        }
      }

      return {
        data: calculations,
        success: true,
        message: `Retrieved profit history for ${calculations.length} periods`
      };

    } catch (error) {
      logger.error('❌ Error getting profit history:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Gagal mengambil riwayat profit',
        success: false
      };
    }
  },

  /**
   * ✅ Get revenue breakdown
   */
  async getRevenueBreakdown(
    userId: string,
    period: string
  ): Promise<ProfitApiResponse<RevenueBreakdown[]>> {
    try {
      // Try stored function first
      const { data: breakdownData, error: breakdownError } = await (supabase as any)
        .rpc('get_revenue_breakdown', {
          p_user_id: userId,
          p_period: period
        });

      if (!breakdownError && Array.isArray(breakdownData)) {
        const breakdown: RevenueBreakdown[] = breakdownData.map(item => ({
          category: item.category || 'Uncategorized',
          amount: Number(item.amount) || 0,
          percentage: Number(item.percentage) || 0,
          transaction_count: Number(item.transaction_count) || 0
        }));

        return { data: breakdown, success: true };
      }

      // Fallback to API integration
      return await getRevenueBreakdownFallback(userId, period);

    } catch (error) {
      logger.error('❌ Error getting revenue breakdown:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Gagal mengambil breakdown revenue',
        success: false
      };
    }
  },

  /**
   * ✅ Get OpEx breakdown
   */
  async getOpExBreakdown(userId: string): Promise<ProfitApiResponse<OpExBreakdown[]>> {
    try {
      const costsResult = await operationalCostApi.getCosts({}, userId);
      const costs = costsResult.data || [];
      
      const activeCosts = costs.filter(c => c.status === 'aktif');
      const totalOpEx = activeCosts.reduce((sum, cost) => sum + (cost.jumlah_per_bulan || 0), 0);

  const breakdown: OpExBreakdown[] = activeCosts.map(cost => ({
    cost_name: cost.nama_biaya,
    amount: cost.jumlah_per_bulan || 0,
    percentage: totalOpEx > 0 ? ((cost.jumlah_per_bulan || 0) / totalOpEx) * 100 : 0,
        type: cost.jenis || 'tetap',
        category: cost.cost_category || 'other'
      }));

      return { data: breakdown, success: true };

    } catch (error) {
      logger.error('❌ Error getting OpEx breakdown:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Gagal mengambil breakdown OpEx',
        success: false
      };
    }
  },

  /**
   * ✅ Get detailed profit analysis with breakdowns
   */
  async getDetailedProfitAnalysis(
    period: string
  ): Promise<ProfitApiResponse<any>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return {
          data: {},
          error: 'User tidak ditemukan. Silakan login kembali.',
          success: false
        };
      }

      // Run all calculations in parallel
      const [
        basicCalc,
        revenueBreakdown,
        opexBreakdown
      ] = await Promise.all([
        this.calculateProfitAnalysis(period),
        this.getRevenueBreakdown(userId, period),
        this.getOpExBreakdown(userId)
      ]);

      if (!basicCalc.success) {
        return basicCalc as any;
      }

      // Calculate data quality
      const dataQuality = assessDataQuality(basicCalc.data);

      const detailedAnalysis = {
        ...basicCalc.data,
        revenueBreakdown: revenueBreakdown.data || [],
        opexBreakdown: opexBreakdown.data || [],
        dataQuality
      };

      return {
        data: detailedAnalysis,
        success: true,
        message: 'Detailed profit analysis completed'
      };

    } catch (error) {
      logger.error('❌ Error in detailed profit analysis:', error);
      return {
        data: {} as any,
        error: error instanceof Error ? error.message : 'Gagal menghitung analisis detail',
        success: false
      };
    }
  },

  /**
   * ✅ Export profit data to CSV
   */
  async exportProfitData(
    dateRange: DateRangeFilter,
    includeBreakdowns: boolean = true
  ): Promise<ProfitApiResponse<{
    csvData: string;
    filename: string;
    recordCount: number;
  }>> {
    try {
      const historyResult = await this.getProfitHistory(dateRange);
      if (!historyResult.success) {
        return historyResult as any;
      }

      const calculations = historyResult.data;
      if (calculations.length === 0) {
        return {
          data: {
            csvData: 'No data available for the selected period',
            filename: 'profit-analysis-no-data.csv',
            recordCount: 0
          },
          success: true,
          message: 'No data to export'
        };
      }

      // Generate CSV headers
      const headers = [
        'Period',
        'Revenue',
        'COGS',
        'OpEx',
        'Gross Profit',
        'Net Profit',
        'Gross Margin %',
        'Net Margin %'
      ];

      // Generate CSV rows
      const rows = calculations.map(calc => {
        const revenue = calc.revenue_data.total;
        const cogs = calc.cogs_data.total;
        const opex = calc.opex_data.total;
        
        const margins = safeCalculateMargins(revenue, cogs, opex);

        return [
          calc.period,
          revenue.toFixed(2),
          cogs.toFixed(2),
          opex.toFixed(2),
          margins.grossProfit.toFixed(2),
          margins.netProfit.toFixed(2),
          margins.grossMargin.toFixed(2),
          margins.netMargin.toFixed(2)
        ];
      });

      // Generate CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\\n');

      // Generate filename
      const startPeriod = calculations[0]?.period || 'unknown';
      const endPeriod = calculations[calculations.length - 1]?.period || 'unknown';
      const filename = `profit-analysis-${startPeriod}-to-${endPeriod}.csv`;

      return {
        data: {
          csvData: csvContent,
          filename,
          recordCount: calculations.length
        },
        success: true,
        message: `Export completed with ${calculations.length} records`
      };

    } catch (error) {
      logger.error('❌ Error exporting profit data:', error);
      return {
        data: {
          csvData: '',
          filename: 'error.csv',
          recordCount: 0
        },
        error: error instanceof Error ? error.message : 'Gagal export data',
        success: false
      };
    }
  },

  // Method untuk menghitung analisis profit F&B
  calculateFNBProfitAnalysis,

  /**
   * 🍽️ Get F&B COGS breakdown with categories
   */
  getFNBCOGSBreakdown,

  /**
   * 🍽️ Helper: Categorize F&B items
   */
  categorizeFNBItem
};

export default profitAnalysisApi;
