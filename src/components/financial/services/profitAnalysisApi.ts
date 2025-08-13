// src/components/financial/services/profitAnalysisApi.ts
// ✅ PROFIT ANALYSIS API - Integration Layer

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Import calculation utilities
import { 
  calculateProfitMargins,
  validateProfitAnalysisInput,
  integrateFinancialData,
  compareProfitMargins
} from '../utils/profitCalculations';

// Type imports
import {
  ProfitAnalysisInput,
  ProfitAnalysisResult,
  ProfitAnalysisApiResponse,
  CategoryMapping,
  DEFAULT_CATEGORY_MAPPING,
  DatePeriod,
  ProfitMarginData
} from '@/types/profitAnalysis';

import { AllocationSettings } from '@/components/operational-costs/types/operationalCost.types';

// ===========================================
// ✅ HELPER FUNCTIONS
// ===========================================

const getCurrentUserId = async (): Promise<string | null> => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    logger.error('Error getting current user:', error);
    return null;
  }
  return user.id;
};

const handleApiError = (operation: string, error: any): ProfitAnalysisApiResponse<any> => {
  const errorMessage = error?.message || 'Unknown error occurred';
  logger.error(`${operation} failed:`, error);
  
  return {
    data: null,
    error: `${operation} gagal: ${errorMessage}`,
    success: false
  };
};

// ===========================================
// ✅ MAIN API FUNCTIONS
// ===========================================

export const profitAnalysisApi = {
  /**
   * Calculate profit margins for a given period
   */
  async calculateProfitMargin(
    period: DatePeriod,
    categoryMapping?: Partial<CategoryMapping>
  ): Promise<ProfitAnalysisApiResponse<ProfitAnalysisResult>> {
    const startTime = Date.now();
    
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return {
          data: null,
          error: 'User tidak ditemukan. Silakan login kembali.',
          success: false
        };
      }

      logger.info('Starting profit margin calculation', { userId, period });

      // Integrate data from all modules
      const integratedData = await integrateFinancialData(userId, period);

      // Prepare analysis input
      const analysisInput: ProfitAnalysisInput = {
        ...integratedData,
        period
      };

      // Validate input
      const validation = validateProfitAnalysisInput(analysisInput);
      if (!validation.isValid) {
        return {
          data: null,
          error: `Validasi gagal: ${validation.errors.join(', ')}`,
          success: false
        };
      }

      // Get allocation settings for overhead calculation
      const allocationSettings = await profitAnalysisApi.getAllocationSettings();

      // Merge category mapping with defaults
      const finalCategoryMapping: CategoryMapping = {
        ...DEFAULT_CATEGORY_MAPPING,
        ...categoryMapping
      };

      // Calculate profit margins
      const result = calculateProfitMargins(
        analysisInput,
        finalCategoryMapping,
        allocationSettings.data || undefined
      );

      const calculationTime = Date.now() - startTime;

      logger.info('Profit margin calculation completed', {
        userId,
        calculationTime,
        revenue: result.profitMarginData.revenue,
        grossMargin: result.profitMarginData.grossMargin,
        netMargin: result.profitMarginData.netMargin
      });

      return {
        data: result,
        success: true,
        message: 'Analisis profit margin berhasil',
        calculationTime
      };

    } catch (error) {
      return handleApiError('Perhitungan profit margin', error);
    }
  },

  /**
   * Get allocation settings for overhead calculation
   */
  async getAllocationSettings(): Promise<ProfitAnalysisApiResponse<AllocationSettings | null>> {
    try {
      const { allocationApi } = await import('@/components/operational-costs/services/operationalCostApi');
      const result = await allocationApi.getSettings();
      
      return {
        data: result.data,
        error: result.error,
        success: !result.error
      };
    } catch (error) {
      return handleApiError('Pengambilan pengaturan alokasi', error);
    }
  },

  /**
   * Compare profit margins between periods
   */
  async compareProfitMargins(
    currentPeriod: DatePeriod,
    previousPeriod?: DatePeriod,
    categoryMapping?: Partial<CategoryMapping>
  ): Promise<ProfitAnalysisApiResponse<{
    current: ProfitAnalysisResult;
    previous?: ProfitAnalysisResult;
    comparison: any;
  }>> {
    try {
      // Calculate current period
      const currentResult = await profitAnalysisApi.calculateProfitMargin(
        currentPeriod,
        categoryMapping
      );

      if (!currentResult.success || !currentResult.data) {
        return currentResult as any;
      }

      let previousResult: ProfitAnalysisResult | undefined;
      let comparison: any = {};

      // Calculate previous period if provided
      if (previousPeriod) {
        const prevResult = await profitAnalysisApi.calculateProfitMargin(
          previousPeriod,
          categoryMapping
        );

        if (prevResult.success && prevResult.data) {
          previousResult = prevResult.data;
          comparison = compareProfitMargins(
            currentResult.data.profitMarginData,
            previousResult.profitMarginData
          );
        }
      }

      return {
        data: {
          current: currentResult.data,
          previous: previousResult,
          comparison
        },
        success: true,
        message: 'Perbandingan profit margin berhasil'
      };

    } catch (error) {
      return handleApiError('Perbandingan profit margin', error);
    }
  },

  /**
   * Get profit trend for multiple periods
   */
  async getProfitTrend(
    periods: DatePeriod[],
    categoryMapping?: Partial<CategoryMapping>
  ): Promise<ProfitAnalysisApiResponse<ProfitAnalysisResult[]>> {
    try {
      const results: ProfitAnalysisResult[] = [];
      
      // Calculate profit for each period
      for (const period of periods) {
        const result = await profitAnalysisApi.calculateProfitMargin(
          period,
          categoryMapping
        );

        if (result.success && result.data) {
          results.push(result.data);
        } else {
          logger.warn(`Failed to calculate profit for period ${period.label}:`, result.error);
        }
      }

      return {
        data: results,
        success: true,
        message: `Berhasil menghitung profit untuk ${results.length} dari ${periods.length} periode`
      };

    } catch (error) {
      return handleApiError('Trend profit margin', error);
    }
  },

  /**
   * Save profit analysis configuration
   */
  async saveProfitConfig(
    config: {
      categoryMapping: CategoryMapping;
      defaultPeriod: 'monthly' | 'quarterly' | 'yearly';
      autoCalculate: boolean;
    }
  ): Promise<ProfitAnalysisApiResponse<boolean>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return {
          data: false,
          error: 'User tidak ditemukan. Silakan login kembali.',
          success: false
        };
      }

      const { data, error } = await supabase
        .from('profit_analysis_config')
        .upsert({
          user_id: userId,
          category_mapping: config.categoryMapping,
          default_period: config.defaultPeriod,
          auto_calculate: config.autoCalculate,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      return {
        data: true,
        success: true,
        message: 'Konfigurasi profit analysis berhasil disimpan'
      };

    } catch (error) {
      return handleApiError('Penyimpanan konfigurasi', error);
    }
  },

  /**
   * Load profit analysis configuration
   */
  async loadProfitConfig(): Promise<ProfitAnalysisApiResponse<{
    categoryMapping: CategoryMapping;
    defaultPeriod: 'monthly' | 'quarterly' | 'yearly';
    autoCalculate: boolean;
  }>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return {
          data: {
            categoryMapping: DEFAULT_CATEGORY_MAPPING,
            defaultPeriod: 'monthly',
            autoCalculate: false
          },
          success: true,
          message: 'Menggunakan konfigurasi default'
        };
      }

      const { data, error } = await supabase
        .from('profit_analysis_config')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return {
          data: {
            categoryMapping: DEFAULT_CATEGORY_MAPPING,
            defaultPeriod: 'monthly',
            autoCalculate: false
          },
          success: true,
          message: 'Konfigurasi tidak ditemukan, menggunakan default'
        };
      }

      return {
        data: {
          categoryMapping: data.category_mapping || DEFAULT_CATEGORY_MAPPING,
          defaultPeriod: data.default_period || 'monthly',
          autoCalculate: data.auto_calculate || false
        },
        success: true,
        message: 'Konfigurasi berhasil dimuat'
      };

    } catch (error) {
      return handleApiError('Pemuatan konfigurasi', error);
    }
  },

  /**
   * Export profit analysis to different formats
   */
  async exportProfitAnalysis(
    result: ProfitAnalysisResult,
    format: 'pdf' | 'excel' | 'csv'
  ): Promise<ProfitAnalysisApiResponse<string>> {
    try {
      // This would integrate with export utilities
      // For now, return a placeholder
      logger.info('Export profit analysis', { format });

      // In a real implementation, you would:
      // 1. Format the data for export
      // 2. Generate the file (PDF, Excel, CSV)
      // 3. Upload to storage or return download URL

      return {
        data: `export-${format}-${Date.now()}`,
        success: true,
        message: `Export ${format.toUpperCase()} berhasil`
      };

    } catch (error) {
      return handleApiError('Export profit analysis', error);
    }
  },

  /**
   * Get profit analysis summary for dashboard
   */
  async getDashboardSummary(
    period?: DatePeriod
  ): Promise<ProfitAnalysisApiResponse<{
    currentMargin: ProfitMarginData;
    trends: Array<{ period: string; margin: number }>;
    alerts: Array<{ type: string; message: string }>;
  }>> {
    try {
      // Default to current month if no period specified
      const defaultPeriod: DatePeriod = period || {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(),
        label: 'Bulan Ini'
      };

      const result = await profitAnalysisApi.calculateProfitMargin(defaultPeriod);

      if (!result.success || !result.data) {
        return result as any;
      }

      // Generate trend data (last 6 months)
      const trends: Array<{ period: string; margin: number }> = [];
      const currentDate = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
        
        const periodLabel = periodStart.toLocaleDateString('id-ID', { 
          year: 'numeric', 
          month: 'short' 
        });

        try {
          const periodResult = await profitAnalysisApi.calculateProfitMargin({
            from: periodStart,
            to: periodEnd,
            label: periodLabel
          });

          if (periodResult.success && periodResult.data) {
            trends.push({
              period: periodLabel,
              margin: periodResult.data.profitMarginData.netMargin
            });
          }
        } catch (error) {
          logger.warn(`Failed to get trend for ${periodLabel}:`, error);
        }
      }

      // Generate alerts based on insights
      const alerts = result.data.insights
        .filter(insight => insight.type === 'warning' || insight.type === 'critical')
        .map(insight => ({
          type: insight.type,
          message: insight.message
        }));

      return {
        data: {
          currentMargin: result.data.profitMarginData,
          trends,
          alerts
        },
        success: true,
        message: 'Dashboard summary berhasil dimuat'
      };

    } catch (error) {
      return handleApiError('Dashboard summary', error);
    }
  }
};

// ===========================================
// ✅ UTILITY FUNCTIONS
// ===========================================

/**
 * Create standard date periods
 */
export const createDatePeriods = {
  thisMonth: (): DatePeriod => ({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
    label: 'Bulan Ini'
  }),

  lastMonth: (): DatePeriod => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return {
      from: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
      to: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0),
      label: 'Bulan Lalu'
    };
  },

  thisQuarter: (): DatePeriod => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    return {
      from: new Date(now.getFullYear(), quarter * 3, 1),
      to: now,
      label: `Q${quarter + 1} ${now.getFullYear()}`
    };
  },

  thisYear: (): DatePeriod => ({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
    label: `Tahun ${new Date().getFullYear()}`
  }),

  custom: (from: Date, to: Date, label?: string): DatePeriod => ({
    from,
    to,
    label: label || `${from.toLocaleDateString('id-ID')} - ${to.toLocaleDateString('id-ID')}`
  })
};

export default profitAnalysisApi;