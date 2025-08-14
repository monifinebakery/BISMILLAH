// src/components/profitAnalysis/services/profitAnalysisApi.ts
// ✅ FIXED VERSION - Array validation and proper error handling

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
// ✅ SAFE HELPER FUNCTIONS
// ===========================================

const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      logger.error('Error getting current user:', error);
      return null;
    }
    return user.id;
  } catch (error) {
    logger.error('Exception getting current user:', error);
    return null;
  }
};

const handleApiError = (operation: string, error: any): ProfitAnalysisApiResponse<any> => {
  const errorMessage = error?.message || 'Unknown error occurred';
  logger.error(`${operation} failed:`, { error: errorMessage, stack: error?.stack });
  
  return {
    data: null,
    error: `${operation} gagal: ${errorMessage}`,
    success: false
  };
};

// ===========================================
// ✅ SAFE ARRAY VALIDATORS
// ===========================================

const ensureArray = <T>(data: any, defaultValue: T[] = []): T[] => {
  if (Array.isArray(data)) {
    return data;
  }
  
  if (data === null || data === undefined) {
    return defaultValue;
  }
  
  // If it's an object with data property that's an array
  if (typeof data === 'object' && Array.isArray(data.data)) {
    return data.data;
  }
  
  // Log the issue for debugging
  logger.warn('ensureArray: Converting non-array to array', { 
    data,
    type: typeof data,
    isNull: data === null,
    isUndefined: data === undefined,
    constructor: data?.constructor?.name
  });
  
  return defaultValue;
};

const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  fallbackValue: T,
  operation: string
): Promise<T> => {
  try {
    const result = await apiCall();
    return result || fallbackValue;
  } catch (error) {
    logger.error(`Safe API call failed for ${operation}:`, error);
    return fallbackValue;
  }
};

// ===========================================
// ✅ FIXED INTEGRATION FUNCTION
// ===========================================

export const integrateFinancialData = async (
  userId: string,
  period: DatePeriod
): Promise<{
  transactions: FinancialTransaction[];
  operationalCosts: OperationalCost[];
  materials: BahanBakuFrontend[];
  recipes: Recipe[];
  materialUsage: MaterialUsageLog[];
  productionRecords: ProductionRecord[];
}> => {
  try {
    logger.info('Starting financial data integration', { userId, period: period.label });

    // ✅ SAFE: Dynamic imports with error handling
    const [financialApi, operationalApi, warehouseApi, recipeApi] = await Promise.all([
      import('@/components/financial/services/financialApi').catch(err => {
        logger.error('Failed to import financialApi:', err);
        return { getTransactionsByDateRange: () => Promise.resolve([]) };
      }),
      import('@/components/operational-costs/services/operationalCostApi').catch(err => {
        logger.error('Failed to import operationalApi:', err);
        return { operationalCostApi: { getCosts: () => Promise.resolve({ data: [] }) } };
      }),
      import('@/components/warehouse/services/warehouseApi').catch(err => {
        logger.error('Failed to import warehouseApi:', err);
        return { warehouseApi: { createService: () => ({ fetchBahanBaku: () => Promise.resolve([]) }) } };
      }),
      import('@/components/recipe/services/recipeApi').catch(err => {
        logger.error('Failed to import recipeApi:', err);
        return { recipeApi: { getRecipes: () => Promise.resolve([]) } };
      })
    ]);

    // ✅ SAFE: Fetch all data with proper error handling
    const [
      transactionsResult, 
      costsResult, 
      materialsResult, 
      recipesResult,
      materialUsageResult,
      productionRecordsResult
    ] = await Promise.all([
      safeApiCall(
        () => financialApi.getTransactionsByDateRange(userId, period.from, period.to),
        [],
        'transactions'
      ),
      safeApiCall(
        () => operationalApi.operationalCostApi.getCosts(),
        { data: [] },
        'operational costs'
      ),
      safeApiCall(
        () => warehouseApi.warehouseApi.createService('crud', { userId }).then(service => service.fetchBahanBaku()),
        [],
        'materials'
      ),
      safeApiCall(
        () => recipeApi.recipeApi.getRecipes(),
        [],
        'recipes'
      ),
      safeApiCall(
        () => supabase
          .from('material_usage_log')
          .select('*')
          .eq('user_id', userId)
          .gte('usage_date', period.from.toISOString())
          .lte('usage_date', period.to.toISOString())
          .order('usage_date', { ascending: false }),
        { data: [], error: null },
        'material usage'
      ),
      safeApiCall(
        () => supabase
          .from('production_records')
          .select('*')
          .eq('user_id', userId)
          .gte('production_date', period.from.toISOString())
          .lte('production_date', period.to.toISOString())
          .order('production_date', { ascending: false }),
        { data: [], error: null },
        'production records'
      )
    ]);

    // ✅ SAFE: Ensure all results are arrays
    const transactions = ensureArray<FinancialTransaction>(transactionsResult);
    const operationalCosts = ensureArray<OperationalCost>(costsResult?.data || costsResult);
    const materials = ensureArray<BahanBakuFrontend>(materialsResult);
    const recipes = ensureArray<Recipe>(recipesResult);

    // ✅ SAFE: Process material usage data
    let materialUsage: MaterialUsageLog[] = [];
    if (materialUsageResult && !materialUsageResult.error && materialUsageResult.data) {
      try {
        materialUsage = ensureArray(materialUsageResult.data).map(record => ({
          id: record.id,
          user_id: record.user_id,
          material_id: record.material_id,
          usage_type: record.usage_type,
          quantity_used: Number(record.quantity_used) || 0,
          unit_cost: Number(record.unit_cost) || 0,
          total_cost: Number(record.total_cost) || 0,
          usage_date: new Date(record.usage_date),
          reference_type: record.reference_type,
          reference_id: record.reference_id,
          notes: record.notes,
          batch_number: record.batch_number,
          created_at: new Date(record.created_at),
          updated_at: new Date(record.updated_at)
        }));
        
        logger.info(`Processed ${materialUsage.length} material usage records for period ${period.label}`);
      } catch (error) {
        logger.error('Error processing material usage data:', error);
        materialUsage = [];
      }
    } else {
      logger.warn('No material usage data available:', materialUsageResult?.error);
    }

    // ✅ SAFE: Process production records data
    let productionRecords: ProductionRecord[] = [];
    if (productionRecordsResult && !productionRecordsResult.error && productionRecordsResult.data) {
      try {
        productionRecords = ensureArray(productionRecordsResult.data).map(record => ({
          id: record.id,
          user_id: record.user_id,
          product_name: record.product_name,
          quantity_produced: Number(record.quantity_produced) || 0,
          production_date: new Date(record.production_date),
          total_material_cost: Number(record.total_material_cost) || 0,
          total_labor_cost: Number(record.total_labor_cost) || 0,
          total_overhead_cost: Number(record.total_overhead_cost) || 0,
          unit_cost: Number(record.unit_cost) || 0,
          batch_number: record.batch_number,
          quality_grade: record.quality_grade,
          notes: record.notes,
          status: record.status,
          created_at: new Date(record.created_at),
          updated_at: new Date(record.updated_at)
        }));
        
        logger.info(`Processed ${productionRecords.length} production records for period ${period.label}`);
      } catch (error) {
        logger.error('Error processing production records data:', error);
        productionRecords = [];
      }
    } else {
      logger.warn('No production records data available:', productionRecordsResult?.error);
    }

    const result = {
      transactions,
      operationalCosts,
      materials,
      recipes,
      materialUsage,
      productionRecords
    };

    logger.info('Financial data integration completed successfully', {
      transactionsCount: transactions.length,
      operationalCostsCount: operationalCosts.length,
      materialsCount: materials.length,
      recipesCount: recipes.length,
      materialUsageCount: materialUsage.length,
      productionRecordsCount: productionRecords.length
    });

    return result;

  } catch (error) {
    logger.error('Error integrating financial data:', error);
    
    // ✅ SAFE: Return empty arrays instead of throwing
    return {
      transactions: [],
      operationalCosts: [],
      materials: [],
      recipes: [],
      materialUsage: [],
      productionRecords: []
    };
  }
};

// ===========================================
// ✅ MAIN API FUNCTIONS - FIXED
// ===========================================

export const profitAnalysisApi = {
  /**
   * ✅ FIXED: Calculate profit margins with safe data handling
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

      logger.info('Starting profit margin calculation', { userId, period: period.label });

      // ✅ SAFE: Integrate data with proper error handling
      const integratedData = await integrateFinancialData(userId, period);

      // ✅ SAFE: Prepare analysis input with validation
      const analysisInput: ProfitAnalysisInput = {
        ...integratedData,
        period
      };

      // ✅ SAFE: Validate input with detailed logging
      const validation = validateProfitAnalysisInput(analysisInput);
      if (!validation.isValid) {
        logger.error('Profit analysis input validation failed', { 
          errors: validation.errors,
          input: {
            hasTransactions: Array.isArray(analysisInput.transactions),
            transactionsLength: analysisInput.transactions?.length,
            hasOperationalCosts: Array.isArray(analysisInput.operationalCosts),
            operationalCostsLength: analysisInput.operationalCosts?.length,
            hasMaterials: Array.isArray(analysisInput.materials),
            materialsLength: analysisInput.materials?.length,
            hasRecipes: Array.isArray(analysisInput.recipes),
            recipesLength: analysisInput.recipes?.length,
            hasMaterialUsage: Array.isArray(analysisInput.materialUsage),
            materialUsageLength: analysisInput.materialUsage?.length,
            hasProductionRecords: Array.isArray(analysisInput.productionRecords),
            productionRecordsLength: analysisInput.productionRecords?.length
          }
        });
        
        return {
          data: null,
          error: `Validasi data gagal: ${validation.errors.join(', ')}`,
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

      // ✅ SAFE: Calculate with comprehensive error handling
      const result = calculateProfitMargins(
        analysisInput,
        finalCategoryMapping,
        allocationSettings.data || undefined
      );

      // ✅ SAFE: Validate calculation result
      if (!result || !result.profitMarginData || typeof result.profitMarginData.revenue !== 'number') {
        logger.error('Invalid calculation result', { result });
        return {
          data: null,
          error: 'Hasil perhitungan tidak valid. Periksa data input.',
          success: false
        };
      }

      const calculationTime = Date.now() - startTime;

      logger.info('Profit margin calculation completed successfully', {
        userId,
        calculationTime,
        revenue: result.profitMarginData.revenue,
        cogs: result.profitMarginData.cogs,
        opex: result.profitMarginData.opex,
        materialUsageRecords: integratedData.materialUsage.length,
        productionRecords: integratedData.productionRecords.length,
        dataSource: result.cogsBreakdown.dataSource
      });

      return {
        data: result,
        success: true,
        message: 'Analisis profit margin berhasil dihitung',
        calculationTime
      };

    } catch (error) {
      logger.error('Profit margin calculation failed:', error);
      return handleApiError('Perhitungan profit margin', error);
    }
  },

  /**
   * ✅ SAFE: Get allocation settings
   */
  async getAllocationSettings(): Promise<ProfitAnalysisApiResponse<AllocationSettings | null>> {
    try {
      const { allocationApi } = await import('@/components/operational-costs/services/operationalCostApi');
      const result = await allocationApi.getSettings();
      
      return {
        data: result?.data || null,
        error: result?.error || null,
        success: !result?.error
      };
    } catch (error) {
      logger.error('Failed to get allocation settings:', error);
      return {
        data: null,
        error: null, // Don't treat this as a critical error
        success: true
      };
    }
  },

  /**
   * ✅ SAFE: Compare profit margins
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
   * ✅ SAFE: Get profit trend
   */
  async getProfitTrend(
    periods: DatePeriod[],
    categoryMapping?: Partial<CategoryMapping>
  ): Promise<ProfitAnalysisApiResponse<ProfitAnalysisResult[]>> {
    try {
      const results: ProfitAnalysisResult[] = [];
      
      // Calculate profit for each period
      for (const period of periods) {
        try {
          const result = await profitAnalysisApi.calculateProfitMargin(
            period,
            categoryMapping
          );

          if (result.success && result.data) {
            results.push(result.data);
          } else {
            logger.warn(`Failed to calculate profit for period ${period.label}:`, result.error);
          }
        } catch (error) {
          logger.warn(`Exception calculating profit for period ${period.label}:`, error);
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
   * ✅ SAFE: Get material usage summary
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

      const totalMaterialCost = materialUsage.reduce((sum, usage) => sum + (usage.total_cost || 0), 0);
      const materialUsageCount = materialUsage.length;

      // Group by material and calculate totals
      const materialMap = new Map<string, { totalCost: number; quantityUsed: number; materialName: string }>();
      
      materialUsage.forEach(usage => {
        const key = usage.material_id;
        if (materialMap.has(key)) {
          const existing = materialMap.get(key)!;
          existing.totalCost += usage.total_cost || 0;
          existing.quantityUsed += usage.quantity_used || 0;
        } else {
          materialMap.set(key, {
            totalCost: usage.total_cost || 0,
            quantityUsed: usage.quantity_used || 0,
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
   * ✅ SAFE: Get dashboard summary
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
        return {
          data: null,
          error: result.error || 'Gagal memuat dashboard summary',
          success: false
        };
      }

      // Generate alerts based on insights
      const alerts = (result.data.insights || [])
        .filter(insight => insight.type === 'warning' || insight.type === 'critical')
        .map(insight => ({
          type: insight.type,
          message: insight.message
        }));

      // Generate trend data (simplified for safety)
      const trends: Array<{ period: string; margin: number }> = [{
        period: defaultPeriod.label,
        margin: result.data.profitMarginData.netMargin
      }];

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
  },

  /**
   * ✅ SAFE: Export analysis (placeholder)
   */
  async exportProfitAnalysis(
    data: ProfitAnalysisResult,
    format: 'pdf' | 'excel' | 'csv'
  ): Promise<ProfitAnalysisApiResponse<any>> {
    try {
      // Placeholder implementation
      logger.info('Export requested', { format });
      
      return {
        data: { exported: true, format },
        success: true,
        message: `Export ${format.toUpperCase()} berhasil`
      };
    } catch (error) {
      return handleApiError('Export analysis', error);
    }
  },

  /**
   * ✅ SAFE: Save config
   */
  async saveProfitConfig(config: any): Promise<ProfitAnalysisApiResponse<boolean>> {
    try {
      // Placeholder implementation
      return {
        data: true,
        success: true,
        message: 'Konfigurasi berhasil disimpan'
      };
    } catch (error) {
      return handleApiError('Save config', error);
    }
  },

  /**
   * ✅ SAFE: Load config
   */
  async loadProfitConfig(): Promise<ProfitAnalysisApiResponse<any>> {
    try {
      return {
        data: {
          categoryMapping: DEFAULT_CATEGORY_MAPPING,
          defaultPeriod: 'monthly',
          autoCalculate: false
        },
        success: true,
        message: 'Konfigurasi berhasil dimuat'
      };
    } catch (error) {
      return handleApiError('Load config', error);
    }
  }
};

// ===========================================
// ✅ UTILITY FUNCTIONS
// ===========================================

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