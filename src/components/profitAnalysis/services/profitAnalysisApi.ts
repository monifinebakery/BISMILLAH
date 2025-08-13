// src/components/profitAnalysis/services/profitAnalysisApi.ts
// ✅ COMPLETE UPDATED API - Material Usage Integration

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

// Import calculation utilities
import { 
  calculateProfitMargins,
  validateProfitAnalysisInput,
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
  ProfitMarginData,
  MaterialUsageLog,
  ProductionRecord
} from '../types';

import { AllocationSettings } from '@/components/operational-costs/types/operationalCost.types';
import { Recipe } from '@/components/recipe/types';
import { FinancialTransaction } from '@/components/financial/types/financial';
import { OperationalCost } from '@/components/operational-costs/types/operationalCost.types';
import { BahanBakuFrontend } from '@/components/warehouse/types';

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
// ✅ UPDATED INTEGRATION FUNCTION
// ===========================================

export const integrateFinancialData = async (
  userId: string,
  period: DatePeriod
): Promise<{
  transactions: FinancialTransaction[];
  operationalCosts: OperationalCost[];
  materials: BahanBakuFrontend[];
  recipes: Recipe[];
  materialUsage: MaterialUsageLog[]; // ✅ NEW
  productionRecords: ProductionRecord[]; // ✅ NEW
}> => {
  try {
    // Dynamic imports to avoid circular dependencies
    const [financialApi, operationalApi, warehouseApi, recipeApi] = await Promise.all([
      import('@/components/financial/services/financialApi'),
      import('@/components/operational-costs/services/operationalCostApi'),
      import('@/components/warehouse/services/warehouseApi'),
      import('@/components/recipe/services/recipeApi')
    ]);

    // ✅ FETCH ALL DATA INCLUDING MATERIAL USAGE
    const [
      transactionsResult, 
      costsResult, 
      materialsResult, 
      recipesResult,
      materialUsageResult,
      productionRecordsResult
    ] = await Promise.all([
      financialApi.getTransactionsByDateRange(userId, period.from, period.to),
      operationalApi.operationalCostApi.getCosts(),
      warehouseApi.warehouseApi.createService('crud', { userId }).then(service => service.fetchBahanBaku()),
      recipeApi.recipeApi.getRecipes(),
      
      // ✅ NEW: Fetch material usage from database
      supabase
        .from('material_usage_log')
        .select('*')
        .eq('user_id', userId)
        .gte('usage_date', period.from.toISOString())
        .lte('usage_date', period.to.toISOString())
        .order('usage_date', { ascending: false }),
        
      // ✅ NEW: Fetch production records from database  
      supabase
        .from('production_records')
        .select('*')
        .eq('user_id', userId)
        .gte('production_date', period.from.toISOString())
        .lte('production_date', period.to.toISOString())
        .order('production_date', { ascending: false })
    ]);

    // ✅ PROCESS MATERIAL USAGE DATA
    let materialUsage: MaterialUsageLog[] = [];
    if (materialUsageResult.data && !materialUsageResult.error) {
      materialUsage = materialUsageResult.data.map(record => ({
        id: record.id,
        user_id: record.user_id,
        material_id: record.material_id,
        usage_type: record.usage_type,
        quantity_used: Number(record.quantity_used),
        unit_cost: Number(record.unit_cost),
        total_cost: Number(record.total_cost),
        usage_date: new Date(record.usage_date),
        reference_type: record.reference_type,
        reference_id: record.reference_id,
        notes: record.notes,
        batch_number: record.batch_number,
        created_at: new Date(record.created_at),
        updated_at: new Date(record.updated_at)
      }));
      
      logger.info(`Fetched ${materialUsage.length} material usage records for period ${period.label}`);
    } else {
      logger.warn('Failed to fetch material usage:', materialUsageResult.error);
    }

    // ✅ PROCESS PRODUCTION RECORDS DATA
    let productionRecords: ProductionRecord[] = [];
    if (productionRecordsResult.data && !productionRecordsResult.error) {
      productionRecords = productionRecordsResult.data.map(record => ({
        id: record.id,
        user_id: record.user_id,
        product_name: record.product_name,
        quantity_produced: Number(record.quantity_produced),
        production_date: new Date(record.production_date),
        total_material_cost: Number(record.total_material_cost),
        total_labor_cost: Number(record.total_labor_cost),
        total_overhead_cost: Number(record.total_overhead_cost),
        unit_cost: Number(record.unit_cost || 0),
        batch_number: record.batch_number,
        quality_grade: record.quality_grade,
        notes: record.notes,
        status: record.status,
        created_at: new Date(record.created_at),
        updated_at: new Date(record.updated_at)
      }));
      
      logger.info(`Fetched ${productionRecords.length} production records for period ${period.label}`);
    } else {
      logger.warn('Failed to fetch production records:', productionRecordsResult.error);
    }

    return {
      transactions: transactionsResult || [],
      operationalCosts: costsResult.data || [],
      materials: materialsResult || [],
      recipes: recipesResult || [],
      materialUsage, // ✅ NEW
      productionRecords // ✅ NEW
    };
  } catch (error) {
    logger.error('Error integrating financial data:', error);
    throw new Error(`Data integration failed: ${error.message}`);
  }
};

// ===========================================
// ✅ MAIN API FUNCTIONS
// ===========================================

export const profitAnalysisApi = {
  /**
   * ✅ UPDATED: Calculate profit margins with material usage
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

      if (process.env.NODE_ENV === 'development') {
        logger.info('Starting profit margin calculation with material usage', { userId, period });
      }

      // ✅ INTEGRATE DATA INCLUDING MATERIAL USAGE
      const integratedData = await integrateFinancialData(userId, period);

      // ✅ PREPARE ANALYSIS INPUT WITH NEW FIELDS
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

      // Get allocation settings
      const allocationSettings = await profitAnalysisApi.getAllocationSettings();

      // Merge category mapping with defaults
      const finalCategoryMapping: CategoryMapping = {
        ...DEFAULT_CATEGORY_MAPPING,
        ...categoryMapping
      };

      // ✅ CALCULATE WITH UPDATED FUNCTION
      const result = calculateProfitMargins(
        analysisInput,
        finalCategoryMapping,
        allocationSettings.data || undefined
      );

      const calculationTime = Date.now() - startTime;

      if (process.env.NODE_ENV === 'development') {
        logger.info('Profit margin calculation completed with material usage', {
          userId,
          calculationTime,
          revenue: result.profitMarginData.revenue,
          cogs: result.profitMarginData.cogs,
          materialUsageRecords: integratedData.materialUsage.length,
          productionRecords: integratedData.productionRecords.length,
          dataSource: result.cogsBreakdown.dataSource
        });
      }

      return {
        data: result,
        success: true,
        message: 'Analisis profit margin berhasil dengan data material usage',
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
   * ✅ NEW: Get material usage summary for period
   */
  async getMaterialUsageSummary(
    period: DatePeriod
  ): Promise<ProfitAnalysisApiResponse<{
    totalMaterialCost: number;
    materialUsageCount: number;
    topMaterials: Array<{
      materialId: string;
      materialName: string;
      totalCost: number;
      quantityUsed: number;
    }>;
  }>> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        return {
          data: null,
          error: 'User tidak ditemukan',
          success: false
        };
      }

      const { materialUsage } = await integrateFinancialData(userId, period);

      const totalMaterialCost = materialUsage.reduce((sum, usage) => sum + usage.total_cost, 0);
      const materialUsageCount = materialUsage.length;

      // Group by material and calculate totals
      const materialMap = new Map<string, { totalCost: number; quantityUsed: number; materialName: string }>();
      
      materialUsage.forEach(usage => {
        const key = usage.material_id;
        if (materialMap.has(key)) {
          const existing = materialMap.get(key)!;
          existing.totalCost += usage.total_cost;
          existing.quantityUsed += usage.quantity_used;
        } else {
          materialMap.set(key, {
            totalCost: usage.total_cost,
            quantityUsed: usage.quantity_used,
            materialName: 'Material' // Would need to join with materials to get actual name
          });
        }
      });

      const topMaterials = Array.from(materialMap.entries())
        .map(([materialId, data]) => ({
          materialId,
          materialName: data.materialName,
          totalCost: data.totalCost,
          quantityUsed: data.quantityUsed
        }))
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, 10);

      return {
        data: {
          totalMaterialCost,
          materialUsageCount,
          topMaterials
        },
        success: true,
        message: 'Material usage summary berhasil dimuat'
      };

    } catch (error) {
      return handleApiError('Material usage summary', error);
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

      // Generate alerts based on insights
      const alerts = result.data.insights
        .filter(insight => insight.type === 'warning' || insight.type === 'critical')
        .map(insight => ({
          type: insight.type,
          message: insight.message
        }));

      // Generate trend data (last 3 months)
      const trends: Array<{ period: string; margin: number }> = [];
      const currentDate = new Date();
      
      for (let i = 2; i >= 0; i--) {
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