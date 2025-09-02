// ==============================================
// PROFIT ANALYSIS API - Modular Version
// Main API interface using extracted helper modules
// ==============================================

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  RealTimeProfitCalculation,
  ProfitApiResponse,
  DateRangeFilter,
  RevenueBreakdown,
  COGSBreakdown,
  OpExBreakdown,
  FNBCOGSBreakdown,
  FNBAnalysisResult,
  FNBInsight
} from '../types/profitAnalysis.types';

// Import existing APIs with compatibility
import financialApi from '@/components/financial/services/financialApi';
import { getWarehouseDataByDateRange } from '@/components/warehouse/services/warehouseApi';
import { operationalCostApi } from '@/components/operational-costs/services/operationalCostApi';

// Import profit calculation utilities
import { calculateRealTimeProfit } from '../utils/profitCalculations';
import { safeCalculateMargins } from '@/utils/profitValidation';
import { getCurrentPeriod } from '../utils/profitTransformers';

// Import modular helpers
import { 
  getCurrentUserId, 
  getWarehouseData, 
  fetchBahanMap, 
  fetchPemakaianByPeriode, 
  getEffectiveUnitPrice 
} from './warehouseHelpers';
import { calculateProfitAnalysisDaily, calculatePemakaianValue } from './calculationUtils';
import { 
  generatePeriods, 
  getDateRangeFromPeriod, 
  assessDataQuality 
} from './dataProcessingHelpers';
import { 
  categorizeFNBItem,
  getFNBCOGSBreakdown,
  generateFNBInsights
} from './fnbHelpers';
import {
  getRevenueBreakdownFallback,
  getOpExBreakdownFallback
} from './fallbackHelpers';

// Import F&B constants
import { FNB_THRESHOLDS } from '../constants/profitConstants';

// Note: Helper functions have been moved to separate modules for better code organization
// Daily calculation is now imported from calculationUtils.ts
export { calculateProfitAnalysisDaily };

// Note: Parsing functions have been moved to dataProcessingHelpers.ts
// Fallback functions have been moved to fallbackHelpers.ts

// ===== MAIN API OBJECT =====

/**
 * Enhanced Profit Analysis API - Hybrid Approach (Stored Functions + API Integration)
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
      
      // 🚨 TEMPORARY FIX: Skip stored function dan langsung use API integration
      // untuk menghindari inconsistency dengan financial reports
      logger.info('🔄 Using direct API integration (temporary fix for data consistency)');
      
      // ✅ METHOD 1 (DISABLED): Stored function - DISABLED for debugging
      // Stored function might have different filtering logic than financial reports
      // try {
      //   const { data: profitData, error: profitError } = await (supabase as any)
      //     .rpc('calculate_realtime_profit', {
      //       p_user_id: userId,
      //       p_period: period
      //     });
      // }

      // ✅ FALLBACK METHOD 2: Use API integration (compatibility)
      logger.info('🔄 Using API integration fallback');
      
        const { from, to } = getDateRangeFromPeriod(period);

        const [
          transactions,
          materials,
          operationalCosts
        ] = await Promise.all([
          financialApi.getTransactionsByDateRange(userId, from, to),
          getWarehouseDataByDateRange(userId, from, to), // 🎯 FIX: Use date-filtered warehouse data
          operationalCostApi.getCostsByDateRange(from, to, userId) // 🎯 FIX: Use date-filtered operational costs
        ]);

      // Handle potential errors from data sources
      if (!Array.isArray(transactions)) {
        throw new Error('Failed to fetch financial transactions');
      }

      const materialsData = Array.isArray(materials) ? materials.map(m => ({
        id: m.id,
        nama: m.nama,
        stok: m.stok,
        harga_satuan: m.harga, // Use `harga` from BahanBakuFrontend
        status: 'aktif' as const, // Default to active
        user_id: userId
      })) : [];
      const costsData = operationalCosts.data || [];
      
      // 🔍 DEBUG: Enhanced warehouse materials filtering
      console.log('🔍 Warehouse Materials Analysis Debug:', {
        period,
        dateRange: { from: from.toISOString(), to: to.toISOString() },
        totalWarehouseMaterials: materialsData.length,
        activeMaterials: materialsData.filter(m => m.status === 'aktif').length,
        materialsBreakdown: materialsData.slice(0, 5).map(m => ({
          nama: m.nama,
          stok: m.stok,
          harga_satuan: m.harga_satuan,
          id: m.id
        })),
        totalStockValue: materialsData.reduce((sum, m) => sum + (m.stok * m.harga_satuan), 0)
      });
      
      // 🔍 DEBUG: Enhanced operational costs filtering
      console.log('🔍 Operational Costs Analysis Debug:', {
        period,
        dateRange: { from: from.toISOString(), to: to.toISOString() },
        totalOperationalCosts: costsData.length,
        activeCosts: costsData.filter((c: any) => c.status === 'aktif').length,
        costsBreakdown: costsData.map((c: any) => ({
          nama: c.nama_biaya,
          jumlah_per_bulan: c.jumlah_per_bulan,
          jenis: c.jenis,
          status: c.status,
          created_at: c.created_at,
          cost_category: c.cost_category
        })),
        totalMonthlyOpEx: costsData
          .filter((c: any) => c.status === 'aktif')
          .reduce((sum: number, c: any) => sum + (c.jumlah_per_bulan || 0), 0)
      });
      
      // Convert transactions to expected format
      const transactionsActual = transactions.map(t => ({
        id: t.id,
        type: t.type,
        category: t.category || undefined,
        amount: t.amount,
        date: typeof t.date === 'string' ? t.date : (t.date?.toISOString() || new Date().toISOString()),
        description: t.description || undefined,
        user_id: userId // Add missing user_id field
      }));
      
      // 🔍 DEBUG: Enhanced logging for profit analysis transaction processing
      const cogsTransactions = transactionsActual.filter(t => 
        t.type === 'expense' && t.category === 'Pembelian Bahan Baku'
      );
      
      console.log('🔍 Profit Analysis Transaction Debug:', {
        period,
        totalTransactions: transactionsActual.length,
        cogsTransactionCount: cogsTransactions.length,
        cogsTransactions: cogsTransactions.map(t => ({
          id: t.id,
          category: t.category,
          amount: t.amount,
          description: t.description,
          date: t.date
        })),
        allTransactionCategories: [...new Set(transactionsActual.map(t => t.category))],
        dateRange: { from: from.toISOString(), to: to.toISOString() }
      });

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
   * ✅ Get detailed revenue breakdown using stored function
   */
  async getRevenueBreakdown(
    userId: string, 
    period: string
  ): Promise<ProfitApiResponse<RevenueBreakdown[]>> {
    try {
      // Use type assertion to bypass TypeScript RPC validation
      const { data, error } = await (supabase as any)
        .rpc('get_revenue_breakdown', {
          p_user_id: userId,
          p_period: period
        });

      if (error) {
        // Fallback to manual calculation
        logger.warn('Revenue breakdown function failed, using fallback');
        return getRevenueBreakdownFallback(userId, period);
      }

      const breakdown: RevenueBreakdown[] = (data || []).map((item: any) => ({
        category: item.category || 'Uncategorized',
        amount: Number(item.amount) || 0,
        percentage: Number(item.percentage) || 0,
        transaction_count: Number(item.transaction_count) || 0
      }));

      return {
        data: breakdown,
        success: true
      };

    } catch (error) {
      logger.error('❌ Error getting revenue breakdown:', error);
      return getRevenueBreakdownFallback(userId, period);
    }
  },

  /**
   * ✅ Get operational expenses breakdown using stored function
   */
  async getOpExBreakdown(
    userId: string
  ): Promise<ProfitApiResponse<OpExBreakdown[]>> {
    try {
      // Use type assertion to bypass TypeScript RPC validation
      const { data, error } = await (supabase as any)
        .rpc('get_opex_breakdown', {
          p_user_id: userId
        });

      if (error) {
        // Fallback to direct API call
        logger.warn('OpEx breakdown function failed, using fallback');
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
      }

      const breakdown: OpExBreakdown[] = (data || []).map((item: any) => ({
        cost_name: item.nama_biaya,
        amount: Number(item.jumlah_per_bulan) || 0,
        type: item.jenis as 'tetap' | 'variabel',
        percentage: Number(item.percentage) || 0
      }));

      return {
        data: breakdown,
        success: true
      };

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
   * ✅ Enhanced profit history with hybrid approach
   */
  async getProfitHistory(
    dateRange: DateRangeFilter
  ): Promise<ProfitApiResponse<RealTimeProfitCalculation[]>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { 
          data: [], 
          error: 'User tidak ditemukan. Silakan login kembali.',
          success: false 
        };
      }

      // Generate periods based on date range
      const periods = generatePeriods(dateRange.from, dateRange.to, dateRange.period_type);
      
      if (periods.length === 0) {
        return {
          data: [],
          success: true,
          message: 'No periods in date range'
        };
      }

      // ✅ TRY METHOD 1: Use stored function for batch (efficient)
      try {
        const startPeriod = periods[0];
        const endPeriod = periods[periods.length - 1];

        // Use type assertion to bypass TypeScript RPC validation
        const { data: trendData, error: trendError } = await (supabase as any)
          .rpc('get_profit_trend', {
            p_user_id: userId,
            p_start_period: startPeriod,
            p_end_period: endPeriod
          });

        if (!trendError && trendData && trendData.length > 0) {
          const calculations: RealTimeProfitCalculation[] = trendData.map((item: any) => ({
            period: item.period,
            revenue_data: {
              total: Number(item.total_revenue) || 0,
              transactions: [] // Simplified for trend data
            },
            cogs_data: {
              total: Number(item.total_cogs) || 0,
              materials: []
            },
            opex_data: {
              total: Number(item.total_opex) || 0,
              costs: []
            },
            calculated_at: new Date().toISOString()
          }));

          logger.success('✅ Profit history loaded via stored function:', { 
            periodCount: calculations.length, 
            label: 'periods' 
          });

          return {
            data: calculations,
            success: true,
            message: `${calculations.length} periode berhasil dihitung (stored function)`
          };
        }
      } catch (storedFunctionError) {
        logger.warn('⚠️ Stored function batch failed, using individual calculations');
      }

      // ✅ FALLBACK METHOD 2: Individual calculations
      logger.info('🔄 Using individual calculation fallback');
      
      const calculations: RealTimeProfitCalculation[] = [];
      const errors: string[] = [];
      
      // Process in smaller chunks to avoid overwhelming the system
      const chunkSize = 3;
      for (let i = 0; i < periods.length; i += chunkSize) {
        const chunk = periods.slice(i, i + chunkSize);
        
        const chunkPromises = chunk.map(async (period) => {
          try {
            const result = await this.calculateProfitAnalysis(period, dateRange.period_type);
            if (result.success && result.data) {
              return result.data;
            } else {
              errors.push(`${period}: ${result.error || 'Unknown error'}`);
              return null;
            }
          } catch (error) {
            errors.push(`${period}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
          }
        });

        const chunkResults = await Promise.all(chunkPromises);
        chunkResults.forEach(result => {
          if (result) calculations.push(result);
        });

        // Small delay between chunks
        if (i + chunkSize < periods.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      logger.success('✅ Profit history completed:', {
        requested: periods.length,
        successful: calculations.length,
        errors: errors.length
      });

      return {
        data: calculations,
        success: true,
        message: `${calculations.length}/${periods.length} periode berhasil dihitung`,
        ...(errors.length > 0 && { 
          error: `Some calculations failed: ${errors.slice(0, 2).join('; ')}${errors.length > 2 ? '...' : ''}` 
        })
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
   * ✅ Calculate detailed profit analysis with all breakdowns
   */
  async calculateDetailedProfitAnalysis(
    period: string
  ): Promise<ProfitApiResponse<RealTimeProfitCalculation & {
    revenueBreakdown: RevenueBreakdown[];
    opexBreakdown: OpExBreakdown[];
    dataQuality: {
      score: number;
      issues: string[];
      recommendations: string[];
    };
  }>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { 
          data: {} as any, 
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
        
        // ✅ IMPROVED: Use centralized calculation for consistency
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
      ].join('\n');

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

  /**
   * ✅ Get current month profit analysis
   */
  async getCurrentMonthProfit(): Promise<ProfitApiResponse<RealTimeProfitCalculation>> {
    const currentPeriod = getCurrentPeriod();
    return this.calculateProfitAnalysis(currentPeriod, 'monthly');
  },

  /**
   * 🍽️ NEW: Generate F&B specific insights and recommendations
   */
  async generateFNBInsights(
    period: string,
    effectiveCogs?: number,
    hppBreakdown?: FNBCOGSBreakdown[]
  ): Promise<ProfitApiResponse<FNBAnalysisResult>> {
    try {
      const profitResult = await this.calculateProfitAnalysis(period);
      if (!profitResult.success) {
        return {
          data: {} as FNBAnalysisResult,
          error: profitResult.error || 'Failed to get profit data',
          success: false
        };
      }

      // Use the modular generateFNBInsights function
      const result = await generateFNBInsights(
        period,
        profitResult.data,
        effectiveCogs,
        hppBreakdown
      );

      return {
        data: result,
        success: true,
        message: `Generated ${result.summary.total_insights} F&B insights`
      };

    } catch (error) {
      logger.error('❌ Error generating F&B insights:', error);
      return {
        data: {} as FNBAnalysisResult,
        error: error instanceof Error ? error.message : 'Failed to generate insights',
        success: false
      };
    }
  },

  /**
   * 🍽️ NEW: Get F&B COGS breakdown with categories
   */
  getFNBCOGSBreakdown,

  /**
   * 🍽️ Helper: Categorize F&B items
   */
  categorizeFNBItem
};

export default profitAnalysisApi;
