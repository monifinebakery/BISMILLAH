// 4. API SERVICE - src/components/profitAnalysis/services/profitAnalysisApi.ts
// ==============================================

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { 
  ProfitAnalysis, 
  RealTimeProfitCalculation,
  ProfitApiResponse,
  DateRangeFilter
} from '../types/profitAnalysis.types';

// Import existing APIs
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
 * Profit Analysis API - Calculate On-Demand (Option A)
 */
export const profitAnalysisApi = {
  
  /**
   * Calculate real-time profit for a specific period
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
      
      // Get data from all sources
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

      // Calculate profit analysis
      const calculation = calculateRealTimeProfit(
        period,
        transactions,
        materialsData,
        costsData
      );

      logger.success('✅ Profit calculation completed:', {
        period,
        revenue: calculation.revenue_data.total,
        cogs: calculation.cogs_data.total,
        opex: calculation.opex_data.total
      });

      return {
        data: calculation,
        success: true,
        message: 'Analisis profit berhasil dihitung'
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
   * Get warehouse data helper
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
   * Get profit analysis for multiple periods
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
      
      // Calculate profit for each period
      const calculations: RealTimeProfitCalculation[] = [];
      
      for (const period of periods) {
        const result = await this.calculateProfitAnalysis(period, dateRange.period_type);
        if (result.success && result.data) {
          calculations.push(result.data);
        }
      }

      return {
        data: calculations,
        success: true,
        message: `${calculations.length} periode berhasil dihitung`
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
   * Generate period strings based on date range
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
   * Get current month profit analysis
   */
  async getCurrentMonthProfit(): Promise<ProfitApiResponse<RealTimeProfitCalculation>> {
    const currentPeriod = new Date().toISOString().slice(0, 7);
    return this.calculateProfitAnalysis(currentPeriod, 'monthly');
  }
};

export default profitAnalysisApi;