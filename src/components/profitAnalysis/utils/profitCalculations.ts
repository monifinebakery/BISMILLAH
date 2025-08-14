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
// ✅ VALIDATION FUNCTION
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
  if (!Array.isArray(input.materialUsage)) {
    errors.push('Material usage bukan array');
  }
  if (!Array.isArray(input.productionRecords)) {
    errors.push('Production records bukan array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// ===========================================
// ✅ MAIN PROFIT CALCULATION FUNCTION
// ===========================================

export const calculateProfitMargins = (
  input: ProfitAnalysisInput,
  categoryMapping: CategoryMapping = DEFAULT_CATEGORY_MAPPING,
  allocationSettings?: AllocationSettings
): ProfitAnalysisResult => {
  try {
    if (process.env.NODE_ENV === 'development') {
      logger.info('Starting profit margin calculation with material usage', { 
        period: input.period?.label,
        transactionCount: input.transactions?.length,
        costCount: input.operationalCosts?.length,
        materialCount: input.materials?.length,
        recipeCount: input.recipes?.length,
        materialUsageCount: input.materialUsage?.length,
        productionRecordsCount: input.productionRecords?.length
      });
    }

    // Validasi input operationalCosts
    if (!Array.isArray(input.operationalCosts)) {
      logger.error('calculateProfitMargins: operationalCosts bukan array', { 
        operationalCosts: input.operationalCosts,
        type: typeof input.operationalCosts,
        isNull: input.operationalCosts === null,
        isUndefined: input.operationalCosts === undefined
      });
      input.operationalCosts = [];
    }

    // Filter transactions by date period
    const periodTransactions = filterByDateRange(
      input.transactions,
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
      logger.warn('calculateProfitMargins: Tidak ada pendapatan untuk periode ini', { period: input.period });
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
          actualMaterialUsage: input.materialUsage || [],
          productionData: input.productionRecords || [],
          dataSource: input.materialUsage?.length ? 'actual' : 'estimated'
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
          operationalCosts: input.operationalCosts,
          materials: input.materials,
          recipes: input.recipes,
          materialUsage: input.materialUsage,
          productionRecords: input.productionRecords
        }
      };
    }

    // Calculate COGS breakdown with material usage
    const cogsBreakdown = calculateCOGS(
      periodTransactions,
      input.operationalCosts,
      input.materials,
      input.recipes,
      input.materialUsage,
      input.productionRecords,
      categoryMapping,
      allocationSettings
    );

    // Calculate OPEX breakdown  
    const opexBreakdown = calculateOPEX(
      periodTransactions,
      input.operationalCosts,
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
        operationalCosts: input.operationalCosts,
        materials: input.materials,
        recipes: input.recipes,
        materialUsage: input.materialUsage,
        productionRecords: input.productionRecords
      }
    };

    // Validasi hasil akhir
    if (!result.profitMarginData || typeof result.profitMarginData.revenue !== 'number' || isNaN(result.profitMarginData.revenue)) {
      logger.error('calculateProfitMargins: profitMarginData tidak valid', { 
        result,
        hasProfitMarginData: !!result.profitMarginData,
        revenueType: result.profitMarginData ? typeof result.profitMarginData.revenue : 'undefined',
        isRevenueNaN: result.profitMarginData ? isNaN(result.profitMarginData.revenue) : true
      });
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
          actualMaterialUsage: input.materialUsage || [],
          productionData: input.productionRecords || [],
          dataSource: input.materialUsage?.length ? 'actual' : 'estimated'
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
          message: 'Hasil perhitungan profit margin tidak valid',
          impact: 'critical'
        }],
        rawData: {
          transactions: periodTransactions,
          operationalCosts: input.operationalCosts,
          materials: input.materials,
          recipes: input.recipes,
          materialUsage: input.materialUsage,
          productionRecords: input.productionRecords
        }
      };
    }

    if (process.env.NODE_ENV === 'development') {
      logger.info('Profit margin calculation completed with material usage', {
        revenue,
        cogs: cogsBreakdown.totalCOGS,
        opex: opexBreakdown.totalOPEX,
        grossMargin: profitMarginData.grossMargin,
        netMargin: profitMarginData.netMargin,
        dataSource: cogsBreakdown.dataSource
      });
    }

    return result;

  } catch (error) {
    logger.error('Error calculating profit margins:', error);
    // Kembalikan hasil default jika terjadi error
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
        actualMaterialUsage: input.materialUsage || [],
        productionData: input.productionRecords || [],
        dataSource: input.materialUsage?.length ? 'actual' : 'estimated'
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
        transactions: input.transactions || [],
        operationalCosts: input.operationalCosts || [],
        materials: input.materials || [],
        recipes: input.recipes || [],
        materialUsage: input.materialUsage || [],
        productionRecords: input.productionRecords || []
      }
    };
  }
};

// ===========================================
// ✅ REVENUE CALCULATION
// ===========================================

export const calculateRevenue = (transactions: FinancialTransaction[]): number => {
  if (!Array.isArray(transactions)) {
    logger.warn('calculateRevenue: transactions bukan array', { 
      transactions,
      type: typeof transactions,
      isNull: transactions === null,
      isUndefined: transactions === undefined
    });
    return 0;
  }
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
};

// ===========================================
// ✅ COGS CALCULATION
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
    const materialCosts: MaterialCostDetail[] = [];
    let totalMaterialCost = 0;
    const directLaborCosts: LaborCostDetail[] = [];
    let totalDirectLaborCost = 0;
    let manufacturingOverhead = 0;

    // Validasi input
    if (!Array.isArray(operationalCosts)) {
      logger.error('calculateCOGS: operationalCosts bukan array', { 
        operationalCosts,
        type: typeof operationalCosts,
        isNull: operationalCosts === null,
        isUndefined: operationalCosts === undefined
      });
      operationalCosts = [];
    }

    // Calculate material costs from material usage logs
    if (materialUsage.length > 0) {
      materialUsage.forEach(usage => {
        const material = materials.find(m => m.id === usage.material_id);
        if (material) {
          materialCosts.push({
            materialId: usage.material_id,
            materialName: material.nama,
            quantityUsed: usage.quantity_used,
            unitCost: usage.unit_cost,
            totalCost: usage.total_cost
          });
          totalMaterialCost += usage.total_cost;
        }
      });
    } else {
      // Estimate material costs from recipes and production records
      productionRecords.forEach(record => {
        const recipe = recipes.find(r => r.id === record.recipe_id);
        if (recipe && recipe.bahan_baku) {
          recipe.bahan_baku.forEach(bahan => {
            const material = materials.find(m => m.id === bahan.materialId);
            if (material) {
              const cost = material.harga * bahan.quantity * record.quantity_produced;
              materialCosts.push({
                materialId: material.id,
                materialName: material.nama,
                quantityUsed: bahan.quantity * record.quantity_produced,
                unitCost: material.harga,
                totalCost: cost
              });
              totalMaterialCost += cost;
            }
          });
        }
      });
    }

    // Calculate direct labor costs
    const laborCosts = operationalCosts
      .filter(cost => cost.category === 'direct_labor')
      .map(cost => ({
        costId: cost.id,
        description: cost.description,
        amount: cost.amount,
        date: cost.date
      }));

    totalDirectLaborCost = laborCosts.reduce((sum, cost) => sum + cost.amount, 0);
    directLaborCosts.push(...laborCosts);

    // Calculate manufacturing overhead
    manufacturingOverhead = calculateOverheadPerUnit(
      operationalCosts,
      productionRecords.length,
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
      actualMaterialUsage: materialUsage,
      productionData: productionRecords,
      dataSource: materialUsage.length > 0 ? 'actual' : 'estimated'
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
      actualMaterialUsage: materialUsage || [],
      productionData: productionRecords || [],
      dataSource: 'estimated'
    };
  }
};

// ===========================================
// ✅ OPEX CALCULATION
// ===========================================

export const calculateOPEX = (
  transactions: FinancialTransaction[],
  operationalCosts: OperationalCost[],
  categoryMapping: CategoryMapping
): OPEXBreakdown => {
  try {
    if (!Array.isArray(operationalCosts)) {
      logger.error('calculateOPEX: operationalCosts bukan array', { 
        operationalCosts,
        type: typeof operationalCosts,
        isNull: operationalCosts === null,
        isUndefined: operationalCosts === undefined
      });
      operationalCosts = [];
    }

    const administrativeExpenses: OperationalExpenseDetail[] = [];
    const sellingExpenses: OperationalExpenseDetail[] = [];
    const generalExpenses: OperationalExpenseDetail[] = [];

    operationalCosts.forEach(cost => {
      const mappedCategory = categoryMapping[cost.category] || cost.category;
      const expense: OperationalExpenseDetail = {
        costId: cost.id,
        description: cost.description,
        amount: cost.amount,
        date: cost.date,
        category: mappedCategory
      };

      if (mappedCategory.includes('admin')) {
        administrativeExpenses.push(expense);
      } else if (mappedCategory.includes('selling')) {
        sellingExpenses.push(expense);
      } else {
        generalExpenses.push(expense);
      }
    });

    const totalAdministrative = calculateTotalActiveCosts(administrativeExpenses);
    const totalSelling = calculateTotalActiveCosts(sellingExpenses);
    const totalGeneral = calculateTotalActiveCosts(generalExpenses);
    const totalOPEX = totalAdministrative + totalSelling + totalGeneral;

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
// ✅ MARGIN CALCULATION
// ===========================================

export const calculateMargins = (
  revenue: number,
  cogs: number,
  opex: number,
  period: DatePeriod
): ProfitMarginData => {
  try {
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    return {
      revenue,
      cogs,
      opex,
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
// ✅ INSIGHT GENERATION
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
    }

    // Gross Margin insights
    if (profitMarginData.grossMargin < PROFIT_MARGIN_THRESHOLDS.gross.poor) {
      insights.push({
        type: 'critical',
        category: 'gross_margin',
        title: 'Margin Kotor Rendah',
        message: `Margin kotor (${profitMarginData.grossMargin.toFixed(1)}%) di bawah ambang batas minimum (${PROFIT_MARGIN_THRESHOLDS.gross.poor}%)`,
        impact: 'high'
      });
    } else if (profitMarginData.grossMargin < PROFIT_MARGIN_THRESHOLDS.gross.acceptable) {
      insights.push({
        type: 'warning',
        category: 'gross_margin',
        title: 'Margin Kotor Perlu Perhatian',
        message: `Margin kotor (${profitMarginData.grossMargin.toFixed(1)}%) di bawah tingkat yang diinginkan (${PROFIT_MARGIN_THRESHOLDS.gross.acceptable}%)`,
        impact: 'medium'
      });
    }

    // Net Margin insights
    if (profitMarginData.netMargin < PROFIT_MARGIN_THRESHOLDS.net.poor) {
      insights.push({
        type: 'critical',
        category: 'net_margin',
        title: 'Margin Bersih Rendah',
        message: `Margin bersih (${profitMarginData.netMargin.toFixed(1)}%) di bawah ambang batas minimum (${PROFIT_MARGIN_THRESHOLDS.net.poor}%)`,
        impact: 'high'
      });
    } else if (profitMarginData.netMargin < PROFIT_MARGIN_THRESHOLDS.net.acceptable) {
      insights.push({
        type: 'warning',
        category: 'net_margin',
        title: 'Margin Bersih Perlu Perhatian',
        message: `Margin bersih (${profitMarginData.netMargin.toFixed(1)}%) di bawah tingkat yang diinginkan (${PROFIT_MARGIN_THRESHOLDS.net.acceptable}%)`,
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
        category: 'data_source',
        title: 'Data Estimasi',
        message: 'Perhitungan COGS menggunakan data estimasi karena kurangnya log penggunaan material.',
        impact: 'low'
      });
    }

  } catch (error) {
    logger.error('Error generating insights:', error);
    insights.push({
      type: 'error',
      category: 'insights',
      title: 'Gagal Membuat Insights',
      message: 'Tidak dapat menghasilkan insights karena kesalahan data',
      impact: 'high'
    });
  }

  return insights;
};

// ===========================================
// ✅ FORMAT AND COLOR UTILITIES
// ===========================================

export const formatProfitMarginForDisplay = (margin: number): string => {
  return `${margin.toFixed(1)}%`;
};

export const getProfitMarginColor = (margin: number, type: 'gross' | 'net'): string => {
  const thresholds = PROFIT_MARGIN_THRESHOLDS[type];
  if (margin >= thresholds.excellent) return 'text-green-500';
  if (margin >= thresholds.good) return 'text-blue-500';
  if (margin >= thresholds.acceptable) return 'text-yellow-500';
  if (margin >= thresholds.poor) return 'text-orange-500';
  return 'text-red-500';
};

// ===========================================
// ✅ CHART DATA PREPARATION
// ===========================================

export const prepareProfitChartData = (results: ProfitAnalysisResult[]): ProfitChartData[] => {
  return results.map(result => {
    if (!result?.profitMarginData) {
      logger.error('prepareProfitChartData: profitMarginData tidak valid', { result });
      return {
        period: result?.profitMarginData?.period?.label || 'Unknown',
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
      period: result.profitMarginData.period.label,
      revenue: result.profitMarginData.revenue,
      cogs: result.profitMarginData.cogs,
      opex: result.profitMarginData.opex,
      grossProfit: result.profitMarginData.grossProfit,
      netProfit: result.profitMarginData.netProfit,
      grossMargin: result.profitMarginData.grossMargin,
      netMargin: result.profitMarginData.netMargin,
      insights: result.insights
    };
  });
};

// ===========================================
// ✅ COMPARE PROFIT MARGINS
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

  if (previous) {
    changes.revenueChange = ((current.revenue - previous.revenue) / previous.revenue) * 100;
    changes.grossMarginChange = current.grossMargin - previous.grossMargin;
    changes.netMarginChange = current.netMargin - previous.netMargin;
    changes.cogsChange = ((current.cogs - previous.cogs) / previous.cogs) * 100;
    changes.opexChange = ((current.opex - previous.opex) / previous.opex) * 100;
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