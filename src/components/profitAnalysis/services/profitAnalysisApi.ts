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
// ✅ INTEGRATION FUNCTION
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
    const [financialApi, operationalApi, warehouseApi, recipeApi] = await Promise.all([
      import('@/components/financial/services/financialApi'),
      import('@/components/operational-costs/services/operationalCostApi'),
      import('@/components/warehouse/services/warehouseApi'),
      import('@/components/recipe/services/recipeApi')
    ]);

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
      supabase
        .from('material_usage_log')
        .select('*')
        .eq('user_id', userId)
        .gte('usage_date', period.from.toISOString())
        .lte('usage_date', period.to.toISOString())
        .order('usage_date', { ascending: false }),
      supabase
        .from('production_records')
        .select('*')
        .eq('user_id', userId)
        .gte('production_date', period.from.toISOString())
        .lte('production_date', period.to.toISOString())
        .order('production_date', { ascending: false })
    ]);

    // Validasi hasil query
    if (materialUsageResult.error) {
      logger.warn('Failed to fetch material usage:', materialUsageResult.error);
    }
    if (productionRecordsResult.error) {
      logger.warn('Failed to fetch production records:', productionRecordsResult.error);
    }

    return {
      transactions: transactionsResult || [],
      operationalCosts: costsResult || [],
      materials: materialsResult || [],
      recipes: recipesResult || [],
      materialUsage: materialUsageResult.data || [],
      productionRecords: productionRecordsResult.data || []
    };
  } catch (error) {
    throw new Error(`Data integration failed: ${error.message}`);
  }
};

// ===========================================
// ✅ MAIN API FUNCTIONS
// ===========================================

export const calculateProfitMargin = async (
  period: DatePeriod,
  categoryMapping: CategoryMapping = DEFAULT_CATEGORY_MAPPING,
  allocationSettings?: AllocationSettings
): Promise<ProfitAnalysisApiResponse<ProfitAnalysisResult>> => {
  try {
    const startTime = Date.now();
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return handleApiError('Calculate profit margin', new Error('User not authenticated'));
    }

    const financialData = await integrateFinancialData(userId, period);

    const input: ProfitAnalysisInput = {
      period,
      transactions: financialData.transactions,
      operationalCosts: financialData.operationalCosts,
      materials: financialData.materials,
      recipes: financialData.recipes,
      materialUsage: financialData.materialUsage,
      productionRecords: financialData.productionRecords
    };

    // Validasi input
    const validation = validateProfitAnalysisInput(input);
    if (!validation.isValid) {
      return {
        data: null,
        error: `Input tidak valid: ${validation.errors.join(', ')}`,
        success: false
      };
    }

    // Hitung profit margin
    const result = await calculateProfitMargins(input, categoryMapping, allocationSettings);

    // Validasi hasil untuk memastikan profitMarginData valid
    if (!result.profitMarginData || typeof result.profitMarginData.revenue !== 'number' || isNaN(result.profitMarginData.revenue)) {
      logger.error('calculateProfitMargin: Hasil profitMarginData tidak valid', { result });
      return {
        data: null,
        error: 'Hasil perhitungan profit margin tidak valid',
        success: false
      };
    }

    return {
      data: result,
      success: true,
      calculationTime: Date.now() - startTime
    };
  } catch (error) {
    return handleApiError('Calculate profit margin', error);
  }
};

export const compareProfitMargins = async (
  currentPeriod: DatePeriod,
  previousPeriod?: DatePeriod,
  categoryMapping: CategoryMapping = DEFAULT_CATEGORY_MAPPING
): Promise<ProfitAnalysisApiResponse<any>> => {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return handleApiError('Compare profit margins', new Error('User not authenticated'));
    }

    const [currentData, previousData] = await Promise.all([
      integrateFinancialData(userId, currentPeriod),
      previousPeriod ? integrateFinancialData(userId, previousPeriod) : Promise.resolve(null)
    ]);

    const currentInput: ProfitAnalysisInput = {
      period: currentPeriod,
      transactions: currentData.transactions,
      operationalCosts: currentData.operationalCosts,
      materials: currentData.materials,
      recipes: currentData.recipes,
      materialUsage: currentData.materialUsage,
      productionRecords: currentData.productionRecords
    };

    const currentResult = await calculateProfitMargins(currentInput, categoryMapping);

    let previousResult: ProfitMarginData | undefined;
    if (previousPeriod && previousData) {
      const previousInput: ProfitAnalysisInput = {
        period: previousPeriod,
        transactions: previousData.transactions,
        operationalCosts: previousData.operationalCosts,
        materials: previousData.materials,
        recipes: previousData.recipes,
        materialUsage: previousData.materialUsage,
        productionRecords: previousData.productionRecords
      };
      previousResult = (await calculateProfitMargins(previousInput, categoryMapping)).profitMarginData;
    }

    // Validasi hasil
    if (!currentResult.profitMarginData || typeof currentResult.profitMarginData.revenue !== 'number') {
      return {
        data: null,
        error: 'Hasil perhitungan periode saat ini tidak valid',
        success: false
      };
    }

    const comparison = compareProfitMargins(currentResult.profitMarginData, previousResult);

    return {
      data: comparison,
      success: true
    };
  } catch (error) {
    return handleApiError('Compare profit margins', error);
  }
};

export const getProfitTrend = async (
  periods: DatePeriod[],
  categoryMapping: CategoryMapping = DEFAULT_CATEGORY_MAPPING
): Promise<ProfitAnalysisApiResponse<ProfitAnalysisResult[]>> => {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return handleApiError('Get profit trend', new Error('User not authenticated'));
    }

    const results = await Promise.all(
      periods.map(async (period) => {
        const financialData = await integrateFinancialData(userId, period);
        
        const input: ProfitAnalysisInput = {
          period,
          transactions: financialData.transactions,
          operationalCosts: financialData.operationalCosts,
          materials: financialData.materials,
          recipes: financialData.recipes,
          materialUsage: financialData.materialUsage,
          productionRecords: financialData.productionRecords
        };

        return calculateProfitMargins(input, categoryMapping);
      })
    );

    // Validasi setiap hasil
    const validResults = results.filter(result => 
      result.profitMarginData && typeof result.profitMarginData.revenue === 'number' && !isNaN(result.profitMarginData.revenue)
    );

    if (validResults.length === 0) {
      return {
        data: [],
        error: 'Tidak ada data profit margin yang valid untuk periode yang diminta',
        success: false
      };
    }

    return {
      data: validResults,
      success: true
    };
  } catch (error) {
    return handleApiError('Get profit trend', error);
  }
};

export const getDashboardSummary = async (): Promise<ProfitAnalysisApiResponse<any>> => {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return handleApiError('Get dashboard summary', new Error('User not authenticated'));
    }

    const currentMonth: DatePeriod = {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      label: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
    };

    const financialData = await integrateFinancialData(userId, currentMonth);
    
    const input: ProfitAnalysisInput = {
      period: currentMonth,
      transactions: financialData.transactions,
      operationalCosts: financialData.operationalCosts,
      materials: financialData.materials,
      recipes: financialData.recipes,
      materialUsage: financialData.materialUsage,
      productionRecords: financialData.productionRecords
    };

    const result = await calculateProfitMargins(input);

    // Validasi hasil
    if (!result.profitMarginData || typeof result.profitMarginData.revenue !== 'number') {
      return {
        data: null,
        error: 'Hasil perhitungan dashboard summary tidak valid',
        success: false
      };
    }

    return {
      data: {
        revenue: result.profitMarginData.revenue,
        grossProfit: result.profitMarginData.grossProfit,
        netProfit: result.profitMarginData.netProfit,
        grossMargin: result.profitMarginData.grossMargin,
        netMargin: result.profitMarginData.netMargin,
        cogsBreakdown: result.cogsBreakdown,
        opexBreakdown: result.opexBreakdown,
        insights: result.insights
      },
      success: true
    };
  } catch (error) {
    return handleApiError('Get dashboard summary', error);
  }
};

export const loadProfitConfig = async (): Promise<ProfitAnalysisApiResponse<any>> => {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return handleApiError('Load profit config', new Error('User not authenticated'));
    }

    const { data, error } = await supabase
      .from('profit_config')
      .select('category_mapping, default_period, auto_calculate')
      .eq('user_id', userId)
      .single();

    if (error) {
      logger.warn('No profit config found, returning default config', { error });
      return {
        data: {
          categoryMapping: DEFAULT_CATEGORY_MAPPING,
          defaultPeriod: 'monthly',
          autoCalculate: false
        },
        success: true
      };
    }

    return {
      data: {
        categoryMapping: data.category_mapping || DEFAULT_CATEGORY_MAPPING,
        defaultPeriod: data.default_period || 'monthly',
        autoCalculate: data.auto_calculate || false
      },
      success: true
    };
  } catch (error) {
    return handleApiError('Load profit config', error);
  }
};

export const saveProfitConfig = async (config: {
  categoryMapping: CategoryMapping;
  defaultPeriod: 'monthly' | 'quarterly' | 'yearly';
  autoCalculate: boolean;
}): Promise<ProfitAnalysisApiResponse<any>> => {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return handleApiError('Save profit config', new Error('User not authenticated'));
    }

    const { data, error } = await supabase
      .from('profit_config')
      .upsert({
        user_id: userId,
        category_mapping: config.categoryMapping,
        default_period: config.defaultPeriod,
        auto_calculate: config.autoCalculate
      })
      .select()
      .single();

    if (error) {
      return handleApiError('Save profit config', error);
    }

    return {
      data,
      success: true
    };
  } catch (error) {
    return handleApiError('Save profit config', error);
  }
};

export const exportProfitAnalysis = async (
  analysis: ProfitAnalysisResult,
  format: 'pdf' | 'excel' | 'csv'
): Promise<ProfitAnalysisApiResponse<any>> => {
  try {
    // Validasi analysis
    if (!analysis || !analysis.profitMarginData || typeof analysis.profitMarginData.revenue !== 'number') {
      return {
        data: null,
        error: 'Data analisis tidak valid untuk ekspor',
        success: false
      };
    }

    const userId = await getCurrentUserId();
    
    if (!userId) {
      return handleApiError('Export profit analysis', new Error('User not authenticated'));
    }

    // Implementasi ekspor berdasarkan format
    // Ini contoh sederhana, implementasi sebenarnya bergantung pada library ekspor
    const exportData = {
      period: analysis.profitMarginData.period.label,
      revenue: analysis.profitMarginData.revenue,
      cogs: analysis.profitMarginData.cogs,
      opex: analysis.profitMarginData.opex,
      grossProfit: analysis.profitMarginData.grossProfit,
      netProfit: analysis.profitMarginData.netProfit,
      grossMargin: analysis.profitMarginData.grossMargin,
      netMargin: analysis.profitMarginData.netMargin,
      cogsBreakdown: analysis.cogsBreakdown,
      opexBreakdown: analysis.opexBreakdown,
      insights: analysis.insights
    };

    // Simulasi ekspor (ganti dengan implementasi nyata)
    logger.info(`Exporting profit analysis in ${format} format`, { period: analysis.profitMarginData.period.label });

    return {
      data: exportData,
      success: true
    };
  } catch (error) {
    return handleApiError('Export profit analysis', error);
  }
};

export const getMaterialUsageSummary = async (
  period: DatePeriod
): Promise<ProfitAnalysisApiResponse<any>> => {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return handleApiError('Get material usage summary', new Error('User not authenticated'));
    }

    const { data, error } = await supabase
      .from('material_usage_log')
      .select(`
        *,
        bahan_baku:nama_material (nama, supplier)
      `)
      .eq('user_id', userId)
      .gte('usage_date', period.from.toISOString())
      .lte('usage_date', period.to.toISOString())
      .order('usage_date', { ascending: false });

    if (error) {
      return handleApiError('Get material usage summary', error);
    }

    const summary = {
      totalUsageRecords: data.length,
      totalCost: data.reduce((sum: number, record: any) => sum + (record.total_cost || 0), 0),
      byMaterial: data.reduce((acc: Record<string, any>, record: any) => {
        const materialId = record.material_id;
        if (!acc[materialId]) {
          acc[materialId] = {
            materialName: record.bahan_baku?.nama || 'Unknown',
            supplier: record.bahan_baku?.supplier || 'Unknown',
            totalQuantity: 0,
            totalCost: 0,
            usageCount: 0
          };
        }
        acc[materialId].totalQuantity += record.quantity_used || 0;
        acc[materialId].totalCost += record.total_cost || 0;
        acc[materialId].usageCount += 1;
        return acc;
      }, {})
    };

    return {
      data: summary,
      success: true
    };
  } catch (error) {
    return handleApiError('Get material usage summary', error);
  }
};

// ===========================================
// ✅ DATE PERIOD UTILITIES
// ===========================================

export const createDatePeriods = {
  thisMonth: (): DatePeriod => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      label: now.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
    };
  },

  lastMonth: (): DatePeriod => {
    const now = new Date();
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0),
      label: new Date(now.getFullYear(), now.getMonth() - 1).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
    };
  },

  thisQuarter: (): DatePeriod => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const startMonth = quarter * 3;
    return {
      from: new Date(now.getFullYear(), startMonth, 1),
      to: new Date(now.getFullYear(), startMonth + 3, 0),
      label: `Q${quarter + 1} ${now.getFullYear()}`
    };
  },

  lastQuarter: (): DatePeriod => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const year = quarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const startMonth = quarter === 0 ? 9 : (quarter - 1) * 3;
    return {
      from: new Date(year, startMonth, 1),
      to: new Date(year, startMonth + 3, 0),
      label: `Q${quarter === 0 ? 4 : quarter} ${year}`
    };
  }
};

export default {
  calculateProfitMargin,
  compareProfitMargins,
  getProfitTrend,
  getDashboardSummary,
  loadProfitConfig,
  saveProfitConfig,
  exportProfitAnalysis,
  getMaterialUsageSummary,
  createDatePeriods
};