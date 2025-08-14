// src/components/profitAnalysis/utils/profitCalculations.ts
// ✅ FIXED VERSION - Proper OPEX type handling

import { logger } from '@/utils/logger';
import { filterByDateRange } from '@/components/financial/utils/financialCalculations';
import { calculateTotalActiveCosts, calculateOverheadPerUnit } from '@/components/operational-costs/utils/costCalculations';

// Type imports
import { FinancialTransaction } from '@/components/financial/types/financial';
import { OperationalCost, AllocationSettings } from '@/components/operational-costs/types/operationalCost.types';
import { BahanBakuFrontend } from '@/components/warehouse/types';
import { Recipe } from '@/components/recipe/types';
import {
  ProfitMarginData,
  ProfitAnalysisInput,
  ProfitAnalysisResult,
  COGSBreakdown,
  OPEXBreakdown,
  MaterialCostDetail,
  LaborCostDetail,
  OperationalExpenseDetail,
  DatePeriod,
  CategoryMapping,
  DEFAULT_CATEGORY_MAPPING,
  ProfitInsight,
  PROFIT_MARGIN_THRESHOLDS,
  MaterialUsageLog,
  ProductionRecord
} from '../types';

// ===========================================
// ✅ SAFE VALIDATION FUNCTION
// ===========================================

export const validateProfitAnalysisInput = (input: ProfitAnalysisInput): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!input.period) {
    errors.push('Periode tidak ditentukan');
  }
  if (!Array.isArray(input.transactions)) {
    errors.push('Transaksi bukan array');
  }
  if (!Array.isArray(input.operationalCosts)) {
    errors.push('Operational costs bukan array');
  }
  if (!Array.isArray(input.materials)) {
    errors.push('Materials bukan array');
  }
  if (!Array.isArray(input.recipes)) {
    errors.push('Recipes bukan array');
  }
  
  // ✅ SAFE: Optional arrays
  if (input.materialUsage && !Array.isArray(input.materialUsage)) {
    errors.push('Material usage bukan array');
  }
  if (input.productionRecords && !Array.isArray(input.productionRecords)) {
    errors.push('Production records bukan array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ===========================================
// ✅ SAFE ARRAY HELPER
// ===========================================

const ensureArray = <T>(data: any, defaultValue: T[] = []): T[] => {
  if (Array.isArray(data)) {
    return data;
  }
  
  logger.warn('ensureArray: Converting non-array to array', { 
    data,
    type: typeof data,
    isNull: data === null,
    isUndefined: data === undefined
  });
  
  return defaultValue;
};

// ===========================================
// ✅ MAIN PROFIT CALCULATION FUNCTION - FIXED
// ===========================================

export const calculateProfitMargins = (
  input: ProfitAnalysisInput,
  categoryMapping: CategoryMapping = DEFAULT_CATEGORY_MAPPING,
  allocationSettings?: AllocationSettings
): ProfitAnalysisResult => {
  try {
    logger.info('Starting profit margin calculation', { 
      period: input.period?.label,
      transactionCount: input.transactions?.length,
      costCount: input.operationalCosts?.length,
      materialCount: input.materials?.length,
      recipeCount: input.recipes?.length,
      materialUsageCount: input.materialUsage?.length,
      productionRecordsCount: input.productionRecords?.length
    });

    // ✅ SAFE: Ensure all arrays are valid
    const transactions = ensureArray<FinancialTransaction>(input.transactions);
    const operationalCosts = ensureArray<OperationalCost>(input.operationalCosts);
    const materials = ensureArray<BahanBakuFrontend>(input.materials);
    const recipes = ensureArray<Recipe>(input.recipes);
    const materialUsage = ensureArray<MaterialUsageLog>(input.materialUsage);
    const productionRecords = ensureArray<ProductionRecord>(input.productionRecords);

    // Filter transactions by date period
    const periodTransactions = filterByDateRange(
      transactions,
      input.period,
      'date'
    );

    // Calculate revenue from financial transactions
    const revenue = calculateRevenue(periodTransactions);

    // Default profitMarginData untuk kasus kosong
    const defaultProfitMarginData: ProfitMarginData = {
      revenue: 0,
      cogs: 0,
      opex: 0,
      grossProfit: 0,
      netProfit: 0,
      grossMargin: 0,
      netMargin: 0,
      calculatedAt: new Date(),
      period: input.period
    };

    // Jika tidak ada pendapatan, kembalikan hasil default
    if (revenue === 0) {
      logger.warn('No revenue found for this period', { period: input.period });
      return {
        profitMarginData: defaultProfitMarginData,
        cogsBreakdown: {
          materialCosts: [],
          totalMaterialCost: 0,
          directLaborCosts: [],
          totalDirectLaborCost: 0,
          manufacturingOverhead: 0,
          overheadAllocationMethod: allocationSettings?.metode || 'activity_based',
          totalCOGS: 0,
          actualMaterialUsage: materialUsage,
          productionData: productionRecords,
          dataSource: materialUsage.length > 0 ? 'actual' : 'estimated'
        },
        opexBreakdown: {
          administrativeExpenses: [],
          totalAdministrative: 0,
          sellingExpenses: [],
          totalSelling: 0,
          generalExpenses: [],
          totalGeneral: 0,
          totalOPEX: 0
        },
        insights: [{
          type: 'warning',
          category: 'revenue',
          title: 'Tidak Ada Pendapatan',
          message: 'Tidak ada transaksi pemasukan untuk periode ini',
          impact: 'high'
        }],
        rawData: {
          transactions: periodTransactions,
          operationalCosts: operationalCosts,
          materials: materials,
          recipes: recipes,
          materialUsage: materialUsage,
          productionRecords: productionRecords
        }
      };
    }

    // Calculate COGS breakdown with material usage
    const cogsBreakdown = calculateCOGS(
      periodTransactions,
      operationalCosts,
      materials,
      recipes,
      materialUsage,
      productionRecords,
      categoryMapping,
      allocationSettings
    );

    // Calculate OPEX breakdown  
    const opexBreakdown = calculateOPEX(
      periodTransactions,
      operationalCosts,
      categoryMapping
    );

    // Calculate profit margins
    const profitMarginData = calculateMargins(
      revenue,
      cogsBreakdown.totalCOGS,
      opexBreakdown.totalOPEX,
      input.period
    );

    // Generate insights
    const insights = generateInsights(
      profitMarginData,
      cogsBreakdown,
      opexBreakdown
    );

    const result: ProfitAnalysisResult = {
      profitMarginData,
      cogsBreakdown,
      opexBreakdown,
      insights,
      rawData: {
        transactions: periodTransactions,
        operationalCosts: operationalCosts,
        materials: materials,
        recipes: recipes,
        materialUsage: materialUsage,
        productionRecords: productionRecords
      }
    };

    // ✅ SAFE: Validate final result
    if (!result.profitMarginData || typeof result.profitMarginData.revenue !== 'number' || isNaN(result.profitMarginData.revenue)) {
      logger.error('Invalid calculation result', { result });
      return {
        profitMarginData: defaultProfitMarginData,
        cogsBreakdown: cogsBreakdown,
        opexBreakdown: opexBreakdown,
        insights: [{
          type: 'error',
          category: 'calculation',
          title: 'Perhitungan Gagal',
          message: 'Hasil perhitungan profit margin tidak valid',
          impact: 'critical'
        }],
        rawData: {
          transactions: periodTransactions,
          operationalCosts: operationalCosts,
          materials: materials,
          recipes: recipes,
          materialUsage: materialUsage,
          productionRecords: productionRecords
        }
      };
    }

    logger.info('Profit margin calculation completed successfully', {
      revenue,
      cogs: cogsBreakdown.totalCOGS,
      opex: opexBreakdown.totalOPEX,
      grossMargin: profitMarginData.grossMargin,
      netMargin: profitMarginData.netMargin,
      dataSource: cogsBreakdown.dataSource
    });

    return result;

  } catch (error) {
    logger.error('Error calculating profit margins:', error);
    
    const defaultProfitMarginData: ProfitMarginData = {
      revenue: 0,
      cogs: 0,
      opex: 0,
      grossProfit: 0,
      netProfit: 0,
      grossMargin: 0,
      netMargin: 0,
      calculatedAt: new Date(),
      period: input.period
    };

    return {
      profitMarginData: defaultProfitMarginData,
      cogsBreakdown: {
        materialCosts: [],
        totalMaterialCost: 0,
        directLaborCosts: [],
        totalDirectLaborCost: 0,
        manufacturingOverhead: 0,
        overheadAllocationMethod: allocationSettings?.metode || 'activity_based',
        totalCOGS: 0,
        actualMaterialUsage: ensureArray(input.materialUsage),
        productionData: ensureArray(input.productionRecords),
        dataSource: (input.materialUsage?.length || 0) > 0 ? 'actual' : 'estimated'
      },
      opexBreakdown: {
        administrativeExpenses: [],
        totalAdministrative: 0,
        sellingExpenses: [],
        totalSelling: 0,
        generalExpenses: [],
        totalGeneral: 0,
        totalOPEX: 0
      },
      insights: [{
        type: 'error',
        category: 'calculation',
        title: 'Perhitungan Gagal',
        message: `Perhitungan profit gagal: ${error.message}`,
        impact: 'critical'
      }],
      rawData: {
        transactions: ensureArray(input.transactions),
        operationalCosts: ensureArray(input.operationalCosts),
        materials: ensureArray(input.materials),
        recipes: ensureArray(input.recipes),
        materialUsage: ensureArray(input.materialUsage),
        productionRecords: ensureArray(input.productionRecords)
      }
    };
  }
};

// ===========================================
// ✅ SAFE REVENUE CALCULATION
// ===========================================

export const calculateRevenue = (transactions: FinancialTransaction[]): number => {
  const safeTransactions = ensureArray<FinancialTransaction>(transactions);
  return safeTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
};

// ===========================================
// ✅ SAFE COGS CALCULATION
// ===========================================

export const calculateCOGS = (
  transactions: FinancialTransaction[],
  operationalCosts: OperationalCost[],
  materials: BahanBakuFrontend[],
  recipes: Recipe[],
  materialUsage: MaterialUsageLog[],
  productionRecords: ProductionRecord[],
  categoryMapping: CategoryMapping,
  allocationSettings?: AllocationSettings
): COGSBreakdown => {
  try {
    const safeOperationalCosts = ensureArray<OperationalCost>(operationalCosts);
    const safeMaterials = ensureArray<BahanBakuFrontend>(materials);
    const safeRecipes = ensureArray<Recipe>(recipes);
    const safeMaterialUsage = ensureArray<MaterialUsageLog>(materialUsage);
    const safeProductionRecords = ensureArray<ProductionRecord>(productionRecords);

    const materialCosts: MaterialCostDetail[] = [];
    let totalMaterialCost = 0;
    const directLaborCosts: LaborCostDetail[] = [];
    let totalDirectLaborCost = 0;
    let manufacturingOverhead = 0;

    // Calculate material costs from material usage logs
    if (safeMaterialUsage.length > 0) {
      safeMaterialUsage.forEach(usage => {
        const material = safeMaterials.find(m => m.id === usage.material_id);
        if (material) {
          materialCosts.push({
            materialId: usage.material_id,
            materialName: material.nama,
            quantityUsed: usage.quantity_used,
            unitCost: usage.unit_cost,
            totalCost: usage.total_cost,
            supplier: material.supplier || 'Unknown',
            category: material.kategori || 'Unknown'
          });
          totalMaterialCost += usage.total_cost;
        }
      });
    } else {
      // Estimate material costs from recipes and production records
      safeProductionRecords.forEach(record => {
        const recipe = safeRecipes.find(r => r.id === record.product_name); // Assuming product_name maps to recipe
        if (recipe && recipe.bahan_baku) {
          recipe.bahan_baku.forEach(bahan => {
            const material = safeMaterials.find(m => m.id === bahan.materialId);
            if (material) {
              const cost = material.harga * bahan.quantity * record.quantity_produced;
              materialCosts.push({
                materialId: material.id,
                materialName: material.nama,
                quantityUsed: bahan.quantity * record.quantity_produced,
                unitCost: material.harga,
                totalCost: cost,
                supplier: material.supplier || 'Unknown',
                category: material.kategori || 'Unknown'
              });
              totalMaterialCost += cost;
            }
          });
        }
      });
    }

    // Calculate direct labor costs
    const laborCosts = safeOperationalCosts
      .filter(cost => cost.category === 'direct_labor')
      .map(cost => ({
        costId: cost.id,
        costName: cost.description,
        costType: cost.type || 'tetap',
        monthlyAmount: cost.amount,
        allocatedAmount: cost.amount,
        allocationBasis: 'direct'
      }));

    totalDirectLaborCost = laborCosts.reduce((sum, cost) => sum + cost.monthlyAmount, 0);
    directLaborCosts.push(...laborCosts);

    // Calculate manufacturing overhead
    manufacturingOverhead = calculateOverheadPerUnit(
      safeOperationalCosts,
      safeProductionRecords.length || 1,
      allocationSettings
    );

    const totalCOGS = totalMaterialCost + totalDirectLaborCost + manufacturingOverhead;

    return {
      materialCosts,
      totalMaterialCost,
      directLaborCosts,
      totalDirectLaborCost,
      manufacturingOverhead,
      overheadAllocationMethod: allocationSettings?.metode || 'activity_based',
      totalCOGS,
      actualMaterialUsage: safeMaterialUsage,
      productionData: safeProductionRecords,
      dataSource: safeMaterialUsage.length > 0 ? 'actual' : 'estimated'
    };
  } catch (error) {
    logger.error('Error calculating COGS:', error);
    return {
      materialCosts: [],
      totalMaterialCost: 0,
      directLaborCosts: [],
      totalDirectLaborCost: 0,
      manufacturingOverhead: 0,
      overheadAllocationMethod: allocationSettings?.metode || 'activity_based',
      totalCOGS: 0,
      actualMaterialUsage: ensureArray(materialUsage),
      productionData: ensureArray(productionRecords),
      dataSource: 'estimated'
    };
  }
};

// ===========================================
// ✅ FIXED OPEX CALCULATION
// ===========================================

export const calculateOPEX = (
  transactions: FinancialTransaction[],
  operationalCosts: OperationalCost[],
  categoryMapping: CategoryMapping
): OPEXBreakdown => {
  try {
    const safeOperationalCosts = ensureArray<OperationalCost>(operationalCosts);

    const administrativeExpenses: OperationalExpenseDetail[] = [];
    const sellingExpenses: OperationalExpenseDetail[] = [];
    const generalExpenses: OperationalExpenseDetail[] = [];

    // ✅ FIXED: Map OperationalCost to OperationalExpenseDetail properly
    safeOperationalCosts.forEach(cost => {
      const mappedCategory = categoryMapping.opexCategories?.includes(cost.category) ? cost.category : 'general';
      
      const expense: OperationalExpenseDetail = {
        costId: cost.id,
        costName: cost.description,
        costType: (cost.type as 'tetap' | 'variabel') || 'tetap',
        monthlyAmount: cost.amount,
        category: mappedCategory.includes('admin') ? 'administrative' : 
                 mappedCategory.includes('selling') || mappedCategory.includes('marketing') ? 'selling' : 'general',
        percentage: 0 // Will be calculated later
      };

      if (expense.category === 'administrative') {
        administrativeExpenses.push(expense);
      } else if (expense.category === 'selling') {
        sellingExpenses.push(expense);
      } else {
        generalExpenses.push(expense);
      }
    });

    const totalAdministrative = administrativeExpenses.reduce((sum, exp) => sum + exp.monthlyAmount, 0);
    const totalSelling = sellingExpenses.reduce((sum, exp) => sum + exp.monthlyAmount, 0);
    const totalGeneral = generalExpenses.reduce((sum, exp) => sum + exp.monthlyAmount, 0);
    const totalOPEX = totalAdministrative + totalSelling + totalGeneral;

    // ✅ FIXED: Calculate percentages
    if (totalOPEX > 0) {
      administrativeExpenses.forEach(exp => {
        exp.percentage = (exp.monthlyAmount / totalOPEX) * 100;
      });
      sellingExpenses.forEach(exp => {
        exp.percentage = (exp.monthlyAmount / totalOPEX) * 100;
      });
      generalExpenses.forEach(exp => {
        exp.percentage = (exp.monthlyAmount / totalOPEX) * 100;
      });
    }

    return {
      administrativeExpenses,
      totalAdministrative,
      sellingExpenses,
      totalSelling,
      generalExpenses,
      totalGeneral,
      totalOPEX
    };
  } catch (error) {
    logger.error('Error calculating OPEX:', error);
    return {
      administrativeExpenses: [],
      totalAdministrative: 0,
      sellingExpenses: [],
      totalSelling: 0,
      generalExpenses: [],
      totalGeneral: 0,
      totalOPEX: 0
    };
  }
};

// ===========================================
// ✅ SAFE MARGIN CALCULATION
// ===========================================

export const calculateMargins = (
  revenue: number,
  cogs: number,
  opex: number,
  period: DatePeriod
): ProfitMarginData => {
  try {
    const safeRevenue = Number(revenue) || 0;
    const safeCogs = Number(cogs) || 0;
    const safeOpex = Number(opex) || 0;

    const grossProfit = safeRevenue - safeCogs;
    const netProfit = grossProfit - safeOpex;
    const grossMargin = safeRevenue > 0 ? (grossProfit / safeRevenue) * 100 : 0;
    const netMargin = safeRevenue > 0 ? (netProfit / safeRevenue) * 100 : 0;

    return {
      revenue: safeRevenue,
      cogs: safeCogs,
      opex: safeOpex,
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
      calculatedAt: new Date(),
      period
    };
  } catch (error) {
    logger.error('Error calculating margins:', error);
    return {
      revenue: 0,
      cogs: 0,
      opex: 0,
      grossProfit: 0,
      netProfit: 0,
      grossMargin: 0,
      netMargin: 0,
      calculatedAt: new Date(),
      period
    };
  }
};

// ===========================================
// ✅ SAFE INSIGHT GENERATION
// ===========================================

export const generateInsights = (
  profitMarginData: ProfitMarginData,
  cogsBreakdown: COGSBreakdown,
  opexBreakdown: OPEXBreakdown
): ProfitInsight[] => {
  const insights: ProfitInsight[] = [];

  try {
    // Revenue-based insights
    if (profitMarginData.revenue === 0) {
      insights.push({
        type: 'warning',
        category: 'revenue',
        title: 'Tidak Ada Pendapatan',
        message: 'Tidak ada transaksi pemasukan untuk periode ini',
        impact: 'high'
      });
      return insights;
    }

    // Gross Margin insights
    if (profitMarginData.grossMargin < PROFIT_MARGIN_THRESHOLDS.grossMargin.poor) {
      insights.push({
        type: 'critical',
        category: 'margin',
        title: 'Margin Kotor Rendah',
        message: `Margin kotor (${profitMarginData.grossMargin.toFixed(1)}%) di bawah ambang batas minimum (${PROFIT_MARGIN_THRESHOLDS.grossMargin.poor}%)`,
        impact: 'high'
      });
    } else if (profitMarginData.grossMargin < PROFIT_MARGIN_THRESHOLDS.grossMargin.acceptable) {
      insights.push({
        type: 'warning',
        category: 'margin',
        title: 'Margin Kotor Perlu Perhatian',
        message: `Margin kotor (${profitMarginData.grossMargin.toFixed(1)}%) di bawah tingkat yang diinginkan (${PROFIT_MARGIN_THRESHOLDS.grossMargin.acceptable}%)`,
        impact: 'medium'
      });
    }

    // Net Margin insights
    if (profitMarginData.netMargin < PROFIT_MARGIN_THRESHOLDS.netMargin.poor) {
      insights.push({
        type: 'critical',
        category: 'margin',
        title: 'Margin Bersih Rendah',
        message: `Margin bersih (${profitMarginData.netMargin.toFixed(1)}%) di bawah ambang batas minimum (${PROFIT_MARGIN_THRESHOLDS.netMargin.poor}%)`,
        impact: 'high'
      });
    } else if (profitMarginData.netMargin < PROFIT_MARGIN_THRESHOLDS.netMargin.acceptable) {
      insights.push({
        type: 'warning',
        category: 'margin',
        title: 'Margin Bersih Perlu Perhatian',
        message: `Margin bersih (${profitMarginData.netMargin.toFixed(1)}%) di bawah tingkat yang diinginkan (${PROFIT_MARGIN_THRESHOLDS.netMargin.acceptable}%)`,
        impact: 'medium'
      });
    }

    // COGS breakdown insights
    if (cogsBreakdown.totalMaterialCost > profitMarginData.revenue * 0.6) {
      insights.push({
        type: 'warning',
        category: 'cogs',
        title: 'Biaya Material Tinggi',
        message: 'Biaya material melebihi 60% dari pendapatan. Pertimbangkan optimalisasi penggunaan bahan baku.',
        impact: 'medium'
      });
    }

    // OPEX breakdown insights
    if (opexBreakdown.totalOPEX > profitMarginData.revenue * 0.3) {
      insights.push({
        type: 'warning',
        category: 'opex',
        title: 'Biaya Operasional Tinggi',
        message: 'Biaya operasional melebihi 30% dari pendapatan. Pertimbangkan efisiensi operasional.',
        impact: 'medium'
      });
    }

    // Data source insight
    if (cogsBreakdown.dataSource === 'estimated') {
      insights.push({
        type: 'info',
        category: 'efficiency',
        title: 'Data Estimasi',
        message: 'Perhitungan COGS menggunakan data estimasi. Aktifkan tracking material usage untuk akurasi yang lebih baik.',
        impact: 'low'
      });
    }

    // Positive insights
    if (profitMarginData.netMargin >= PROFIT_MARGIN_THRESHOLDS.netMargin.excellent) {
      insights.push({
        type: 'success',
        category: 'margin',
        title: 'Performa Excellent',
        message: `Margin bersih ${profitMarginData.netMargin.toFixed(1)}% menunjukkan performa yang sangat baik!`,
        impact: 'low'
      });
    }

  } catch (error) {
    logger.error('Error generating insights:', error);
    insights.push({
      type: 'info',
      category: 'trend',
      title: 'Analisis Tersedia',
      message: 'Data profit margin berhasil dihitung untuk periode ini.',
      impact: 'low'
    });
  }

  return insights;
};

// ===========================================
// ✅ FORMAT AND COLOR UTILITIES
// ===========================================

export const formatProfitMarginForDisplay = (margin: number): string => {
  const safeMargin = Number(margin) || 0;
  return `${safeMargin.toFixed(1)}%`;
};

export const getProfitMarginColor = (margin: number, type: 'gross' | 'net'): string => {
  const safeMargin = Number(margin) || 0;
  const thresholds = PROFIT_MARGIN_THRESHOLDS[type === 'gross' ? 'grossMargin' : 'netMargin'];
  
  if (safeMargin >= thresholds.excellent) return 'text-green-500';
  if (safeMargin >= thresholds.good) return 'text-blue-500';
  if (safeMargin >= thresholds.acceptable) return 'text-yellow-500';
  if (safeMargin >= thresholds.poor) return 'text-orange-500';
  return 'text-red-500';
};

// ===========================================
// ✅ SAFE CHART DATA PREPARATION
// ===========================================

export const prepareProfitChartData = (results: ProfitAnalysisResult[]): any => {
  const safeResults = ensureArray<ProfitAnalysisResult>(results);
  
  return safeResults.map(result => {
    if (!result?.profitMarginData) {
      logger.error('prepareProfitChartData: Invalid profit margin data', { result });
      return {
        period: 'Unknown',
        revenue: 0,
        cogs: 0,
        opex: 0,
        grossProfit: 0,
        netProfit: 0,
        grossMargin: 0,
        netMargin: 0,
        insights: [{
          type: 'error',
          category: 'calculation',
          title: 'Data Tidak Valid',
          message: 'Data profit margin tidak tersedia untuk periode ini',
          impact: 'critical'
        }]
      };
    }

    return {
      period: result.profitMarginData.period?.label || 'Unknown',
      revenue: result.profitMarginData.revenue || 0,
      cogs: result.profitMarginData.cogs || 0,
      opex: result.profitMarginData.opex || 0,
      grossProfit: result.profitMarginData.grossProfit || 0,
      netProfit: result.profitMarginData.netProfit || 0,
      grossMargin: result.profitMarginData.grossMargin || 0,
      netMargin: result.profitMarginData.netMargin || 0,
      insights: result.insights || []
    };
  });
};

// ===========================================
// ✅ SAFE COMPARE PROFIT MARGINS
// ===========================================

export const compareProfitMargins = (
  current: ProfitMarginData,
  previous?: ProfitMarginData
): { current: ProfitMarginData; previous?: ProfitMarginData; changes: any } => {
  const changes = {
    revenueChange: 0,
    grossMarginChange: 0,
    netMarginChange: 0,
    cogsChange: 0,
    opexChange: 0
  };

  if (previous && previous.revenue > 0) {
    changes.revenueChange = ((current.revenue - previous.revenue) / previous.revenue) * 100;
    changes.grossMarginChange = current.grossMargin - previous.grossMargin;
    changes.netMarginChange = current.netMargin - previous.netMargin;
    
    if (previous.cogs > 0) {
      changes.cogsChange = ((current.cogs - previous.cogs) / previous.cogs) * 100;
    }
    if (previous.opex > 0) {
      changes.opexChange = ((current.opex - previous.opex) / previous.opex) * 100;
    }
  }

  return {
    current,
    previous,
    changes
  };
};

// ===========================================
// ✅ DEFAULT EXPORTS
// ===========================================

export default {
  calculateProfitMargins,
  validateProfitAnalysisInput,
  compareProfitMargins,
  formatProfitMarginForDisplay,
  getProfitMarginColor,
  prepareProfitChartData,
  calculateRevenue,
  calculateCOGS,
  calculateOPEX,
  calculateMargins,
  generateInsights
};