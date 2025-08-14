// ==============================================
// FINAL PROFIT ANALYSIS API - Complete Updated Version
// Compatible with Actual Schema + Enhanced Features
// ==============================================

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  RealTimeProfitCalculation,
  ProfitApiResponse,
  DateRangeFilter,
  RevenueBreakdown,
  COGSBreakdown,
  OpExBreakdown
} from '../types/profitAnalysis.types';

// Import existing APIs with compatibility
import financialApi from '@/components/financial/services/financialApi';
import { warehouseApi } from '@/components/warehouse/services/warehouseApi';
import { operationalCostApi } from '@/components/operational-costs/services/operationalCostApi';

import { calculateRealTimeProfit, calculateMargins } from '../utils/profitCalculations';

/**
 * Get current user ID
 */
const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    logger.error('Error getting current user:', error);
    return null;
  }
  return user.id;
};

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
      
      // ✅ TRY METHOD 1: Use stored function (fastest, most accurate)
      try {
        const { data: profitData, error: profitError } = await supabase
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
              transactions: this.parseTransactions(result.revenue_transactions)
            },
            cogs_data: {
              total: Number(result.total_cogs) || 0,
              materials: this.parseCOGSTransactions(result.cogs_transactions)
            },
            opex_data: {
              total: Number(result.total_opex) || 0,
              costs: this.parseOpExCosts(result.opex_costs)
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

      // ✅ FALLBACK METHOD 2: Use API integration (compatibility)
      logger.info('🔄 Using API integration fallback');
      
      const [
        transactions,
        materials, 
        operationalCosts
      ] = await Promise.all([
        financialApi.getFinancialTransactions(userId),
        this.getWarehouseData(userId),
        operationalCostApi.getCosts()
      ]);

      // Handle potential errors from data sources
      if (!Array.isArray(transactions)) {
        throw new Error('Failed to fetch financial transactions');
      }

      const materialsData = Array.isArray(materials) ? materials : [];
      const costsData = operationalCosts.data || [];

      // Calculate profit analysis using utility function
      const calculation = calculateRealTimeProfit(
        period,
        transactions,
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
      const { data, error } = await supabase
        .rpc('get_revenue_breakdown', {
          p_user_id: userId,
          p_period: period
        });

      if (error) {
        // Fallback to manual calculation
        logger.warn('Revenue breakdown function failed, using fallback');
        return this.getRevenueBreakdownFallback(userId, period);
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
      return this.getRevenueBreakdownFallback(userId, period);
    }
  },

  /**
   * ✅ Fallback revenue breakdown using direct API calls
   */
  async getRevenueBreakdownFallback(
    userId: string,
    period: string
  ): Promise<ProfitApiResponse<RevenueBreakdown[]>> {
    try {
      const transactions = await financialApi.getFinancialTransactions(userId);
      const periodTransactions = transactions.filter(t => {
        if (!t.date || t.type !== 'income') return false;
        const transactionPeriod = new Date(t.date).toISOString().slice(0, 7);
        return transactionPeriod === period;
      });

      const totalRevenue = periodTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      
      // Group by category
      const categoryGroups = periodTransactions.reduce((groups, transaction) => {
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
  },

  /**
   * ✅ Get operational expenses breakdown using stored function
   */
  async getOpExBreakdown(
    userId: string
  ): Promise<ProfitApiResponse<OpExBreakdown[]>> {
    try {
      const { data, error } = await supabase
        .rpc('get_opex_breakdown', {
          p_user_id: userId
        });

      if (error) {
        // Fallback to direct API call
        logger.warn('OpEx breakdown function failed, using fallback');
        const opexResult = await operationalCostApi.getCosts();
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
   * ✅ Get warehouse data helper (compatibility with existing API)
   */
  async getWarehouseData(userId: string) {
    try {
      const service = await warehouseApi.createService('crud', { userId });
      return await service.fetchBahanBaku();
    } catch (error) {
      logger.warn('⚠️ Failed to fetch warehouse data:', error);
      return [];
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
      const periods = this.generatePeriods(dateRange.from, dateRange.to, dateRange.period_type);
      
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

        const { data: trendData, error: trendError } = await supabase
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

          logger.success('✅ Profit history loaded via stored function:', calculations.length, 'periods');

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
      const dataQuality = this.assessDataQuality(basicCalc.data);

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
        const grossProfit = revenue - cogs;
        const netProfit = grossProfit - opex;
        const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
        const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        return [
          calc.period,
          revenue.toFixed(2),
          cogs.toFixed(2),
          opex.toFixed(2),
          grossProfit.toFixed(2),
          netProfit.toFixed(2),
          grossMargin.toFixed(2),
          netMargin.toFixed(2)
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
   * ✅ Generate period strings based on date range
   */
  generatePeriods(from: Date, to: Date, periodType: 'monthly' | 'quarterly' | 'yearly'): string[] {
    const periods: string[] = [];
    const current = new Date(from);
    const end = new Date(to);

    while (current <= end) {
      if (periodType === 'monthly') {
        periods.push(current.toISOString().slice(0, 7)); // YYYY-MM
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
  },

  /**
   * ✅ Get current month profit analysis
   */
  async getCurrentMonthProfit(): Promise<ProfitApiResponse<RealTimeProfitCalculation>> {
    const currentPeriod = new Date().toISOString().slice(0, 7);
    return this.calculateProfitAnalysis(currentPeriod, 'monthly');
  },

  // ===== HELPER FUNCTIONS =====

  /**
   * Parse revenue transactions from JSONB
   */
  parseTransactions(transactionsJson: any): any[] {
    try {
      if (!transactionsJson) return [];
      const transactions = Array.isArray(transactionsJson) ? transactionsJson : JSON.parse(transactionsJson);
      return transactions.map((t: any) => ({
        category: t.category || 'Uncategorized',
        amount: Number(t.amount) || 0,
        description: t.description || '',
        date: t.date
      }));
    } catch (error) {
      logger.warn('Error parsing transactions JSON:', error);
      return [];
    }
  },

  /**
   * Parse COGS transactions from JSONB
   */
  parseCOGSTransactions(transactionsJson: any): any[] {
    try {
      if (!transactionsJson) return [];
      const transactions = Array.isArray(transactionsJson) ? transactionsJson : JSON.parse(transactionsJson);
      return transactions.map((t: any) => ({
        name: t.description || t.category || 'Material Cost',
        cost: Number(t.amount) || 0,
        category: t.category || 'Direct Material'
      }));
    } catch (error) {
      logger.warn('Error parsing COGS transactions JSON:', error);
      return [];
    }
  },

  /**
   * Parse operational costs from JSONB
   */
  parseOpExCosts(costsJson: any): any[] {
    try {
      if (!costsJson) return [];
      const costs = Array.isArray(costsJson) ? costsJson : JSON.parse(costsJson);
      return costs.map((c: any) => ({
        nama_biaya: c.name || c.nama_biaya,
        jumlah_per_bulan: Number(c.amount) || 0,
        jenis: c.type || 'tetap',
        cost_category: c.category || 'general'
      }));
    } catch (error) {
      logger.warn('Error parsing OpEx costs JSON:', error);
      return [];
    }
  },

  /**
   * Assess data quality
   */
  assessDataQuality(calculation: RealTimeProfitCalculation): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    let score = 100;
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check revenue data
    if (calculation.revenue_data.total <= 0) {
      score -= 30;
      issues.push('Tidak ada data revenue');
      recommendations.push('Tambahkan transaksi pemasukan');
    }
    
    // Check COGS data
    if (calculation.cogs_data.total <= 0) {
      score -= 20;
      issues.push('Tidak ada data COGS');
      recommendations.push('Tambahkan transaksi pembelian bahan baku');
    }
    
    // Check OpEx data
    if (calculation.opex_data.total <= 0) {
      score -= 20;
      issues.push('Tidak ada data biaya operasional');
      recommendations.push('Konfigurasi biaya operasional');
    }
    
    // Business logic validation
    const revenue = calculation.revenue_data.total;
    const cogs = calculation.cogs_data.total;
    const opex = calculation.opex_data.total;
    
    if (cogs > revenue) {
      score -= 15;
      issues.push('COGS lebih besar dari revenue');
      recommendations.push('Review kategorisasi transaksi');
    }
    
    if (opex > revenue * 0.8) {
      score -= 10;
      issues.push('Biaya operasional terlalu tinggi');
      recommendations.push('Review efisiensi operasional');
    }
    
    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }
};

export default profitAnalysisApi;