// src/components/profitAnalysis/utils/profitCalculations.ts
// ✅ REAL PROFIT MARGIN CALCULATIONS - Integration Logic

import { logger } from '@/utils/logger';
import { filterByDateRange } from '@/components/financial/utils/financialCalculations';
import { calculateTotalActiveCosts, calculateOverheadPerUnit } from '@/components/operational-costs/utils/costCalculations';

// Type imports
import { FinancialTransaction } from '@/components/financial/types/financial';
import { OperationalCost, AllocationSettings } from '@/components/operational-costs/types/operationalCost.types';
import { BahanBakuFrontend } from '@/components/warehouse/types';
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
  PROFIT_MARGIN_THRESHOLDS
} from '../types';

// ===========================================
// ✅ MAIN PROFIT CALCULATION FUNCTION
// ===========================================

export const calculateProfitMargins = (
  input: ProfitAnalysisInput,
  categoryMapping: CategoryMapping = DEFAULT_CATEGORY_MAPPING,
  allocationSettings?: AllocationSettings
): ProfitAnalysisResult => {
  try {
    // Kurangi logging untuk production
    if (process.env.NODE_ENV === 'development') {
      logger.info('Starting profit margin calculation', { 
        period: input.period?.label,
        transactionCount: input.transactions?.length,
        costCount: input.operationalCosts?.length,
        materialCount: input.materials?.length
      });
    }

    // Filter transactions by date period
    const periodTransactions = filterByDateRange(
      input.transactions,
      input.period,
      'date'
    );

    // Calculate revenue from financial transactions
    const revenue = calculateRevenue(periodTransactions);

    // Calculate COGS breakdown
    const cogsBreakdown = calculateCOGS(
      periodTransactions,
      input.operationalCosts,
      input.materials,
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
        materials: input.materials
      }
    };

    // Kurangi logging untuk production
    if (process.env.NODE_ENV === 'development') {
      logger.info('Profit margin calculation completed', {
        revenue,
        cogs: cogsBreakdown.totalCOGS,
        opex: opexBreakdown.totalOPEX,
        grossMargin: profitMarginData.grossMargin,
        netMargin: profitMarginData.netMargin
      });
    }

    return result;

  } catch (error) {
    logger.error('Error calculating profit margins:', error);
    throw new Error(`Profit calculation failed: ${error.message}`);
  }
};

// ===========================================
// ✅ REVENUE CALCULATION
// ===========================================

export const calculateRevenue = (transactions: FinancialTransaction[]): number => {
  return transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
};

// ===========================================
// ✅ COGS (HPP) CALCULATION
// ===========================================

export const calculateCOGS = (
  transactions: FinancialTransaction[],
  operationalCosts: OperationalCost[],
  materials: BahanBakuFrontend[],
  categoryMapping: CategoryMapping,
  allocationSettings?: AllocationSettings
): COGSBreakdown => {
  // 1. Material costs from financial transactions
  const materialCosts = calculateMaterialCosts(transactions, materials, categoryMapping);
  
  // 2. Direct labor costs from operational costs
  const directLaborCosts = calculateDirectLaborCosts(operationalCosts, categoryMapping);
  
  // 3. Manufacturing overhead allocation
  const manufacturingOverhead = calculateManufacturingOverhead(
    operationalCosts,
    allocationSettings,
    materialCosts.totalMaterialCost
  );

  const totalCOGS = materialCosts.totalMaterialCost + 
                   directLaborCosts.totalDirectLaborCost + 
                   manufacturingOverhead.amount;

  return {
    materialCosts: materialCosts.details,
    totalMaterialCost: materialCosts.totalMaterialCost,
    directLaborCosts: directLaborCosts.details,
    totalDirectLaborCost: directLaborCosts.totalDirectLaborCost,
    manufacturingOverhead: manufacturingOverhead.amount,
    overheadAllocationMethod: manufacturingOverhead.method,
    totalCOGS
  };
};

// ===========================================
// ✅ MATERIAL COST CALCULATION
// ===========================================

const calculateMaterialCosts = (
  transactions: FinancialTransaction[],
  materials: BahanBakuFrontend[],
  categoryMapping: CategoryMapping
) => {
  // Get material-related expenses from financial transactions
  const materialTransactions = transactions.filter(t => 
    t.type === 'expense' && 
    categoryMapping.cogsCategories.includes(t.category || '')
  );

  const details: MaterialCostDetail[] = [];
  let totalMaterialCost = 0;

  // Group by material/supplier for better tracking
  const materialMap = new Map<string, MaterialCostDetail>();

  materialTransactions.forEach(transaction => {
    // Try to match transaction with material in warehouse
    const material = materials.find(m => 
      transaction.description?.toLowerCase().includes(m.nama.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(m.supplier.toLowerCase())
    );

    const key = material ? material.id : transaction.description || 'Unknown';
    
    if (materialMap.has(key)) {
      const existing = materialMap.get(key)!;
      existing.totalCost += transaction.amount || 0;
    } else {
      const detail: MaterialCostDetail = {
        materialId: material?.id || `trans_${transaction.id}`,
        materialName: material?.nama || transaction.description || 'Material',
        quantityUsed: 0, // Will be calculated if material data is available
        unitCost: material?.harga || 0,
        totalCost: transaction.amount || 0,
        supplier: material?.supplier || 'Unknown',
        category: transaction.category || 'Material',
        ...(material?.isiPerKemasan && {
          packageInfo: {
            fromPackageQty: material.jumlahBeliKemasan || 0,
            packageSize: material.isiPerKemasan,
            packageUnit: material.satuanKemasan || material.satuan
          }
        })
      };

      // Calculate quantity if unit cost is available
      if (detail.unitCost > 0) {
        detail.quantityUsed = detail.totalCost / detail.unitCost;
      }

      materialMap.set(key, detail);
    }

    totalMaterialCost += transaction.amount || 0;
  });

  return {
    details: Array.from(materialMap.values()),
    totalMaterialCost
  };
};

// ===========================================
// ✅ DIRECT LABOR COST CALCULATION  
// ===========================================

const calculateDirectLaborCosts = (
  operationalCosts: OperationalCost[],
  categoryMapping: CategoryMapping
) => {
  const directLaborCosts = operationalCosts.filter(cost => 
    cost.status === 'aktif' &&
    categoryMapping.directLaborCategories.some(category =>
      cost.nama_biaya.toLowerCase().includes(category.toLowerCase())
    )
  );

  const details: LaborCostDetail[] = directLaborCosts.map(cost => ({
    costId: cost.id,
    costName: cost.nama_biaya,
    costType: cost.jenis,
    monthlyAmount: Number(cost.jumlah_per_bulan),
    allocatedAmount: Number(cost.jumlah_per_bulan), // Full allocation for direct labor
    allocationBasis: cost.jenis === 'tetap' ? 'fixed monthly' : 'variable per unit'
  }));

  const totalDirectLaborCost = details.reduce((sum, detail) => 
    sum + detail.allocatedAmount, 0
  );

  return {
    details,
    totalDirectLaborCost
  };
};

// ===========================================
// ✅ MANUFACTURING OVERHEAD CALCULATION
// ===========================================

const calculateManufacturingOverhead = (
  operationalCosts: OperationalCost[],
  allocationSettings?: AllocationSettings,
  materialCost: number = 0
) => {
  // Get manufacturing-related costs (excluding direct labor and admin)
  const overheadCosts = operationalCosts.filter(cost => 
    cost.status === 'aktif' &&
    !cost.nama_biaya.toLowerCase().includes('gaji') &&
    !cost.nama_biaya.toLowerCase().includes('administrasi') &&
    (
      cost.nama_biaya.toLowerCase().includes('listrik pabrik') ||
      cost.nama_biaya.toLowerCase().includes('pemeliharaan mesin') ||
      cost.nama_biaya.toLowerCase().includes('depresiasi') ||
      cost.nama_biaya.toLowerCase().includes('air') ||
      cost.nama_biaya.toLowerCase().includes('bahan bakar')
    )
  );

  const totalOverheadCosts = calculateTotalActiveCosts(overheadCosts);

  if (!allocationSettings) {
    // Default allocation: distribute overhead based on material cost ratio
    return {
      amount: totalOverheadCosts * 0.5, // 50% default allocation to production
      method: 'per_unit' as const
    };
  }

  const overheadPerUnit = calculateOverheadPerUnit(
    totalOverheadCosts,
    allocationSettings,
    materialCost
  );

  return {
    amount: overheadPerUnit,
    method: allocationSettings.metode
  };
};

// ===========================================
// ✅ OPEX CALCULATION
// ===========================================

export const calculateOPEX = (
  transactions: FinancialTransaction[],
  operationalCosts: OperationalCost[],
  categoryMapping: CategoryMapping
): OPEXBreakdown => {
  // Get OPEX from financial transactions
  const opexTransactions = transactions.filter(t => 
    t.type === 'expense' && 
    categoryMapping.opexCategories.includes(t.category || '')
  );

  // Get OPEX from operational costs (non-production costs)
  const opexCosts = operationalCosts.filter(cost => 
    cost.status === 'aktif' &&
    categoryMapping.operationalExpenseCategories.some(category =>
      cost.nama_biaya.toLowerCase().includes(category.toLowerCase())
    )
  );

  // Categorize expenses
  const administrativeExpenses: OperationalExpenseDetail[] = [];
  const sellingExpenses: OperationalExpenseDetail[] = [];
  const generalExpenses: OperationalExpenseDetail[] = [];

  // Process operational costs
  opexCosts.forEach(cost => {
    const expense: OperationalExpenseDetail = {
      costId: cost.id,
      costName: cost.nama_biaya,
      costType: cost.jenis,
      monthlyAmount: Number(cost.jumlah_per_bulan),
      category: categorizeCost(cost.nama_biaya),
      percentage: 0 // Will be calculated after totals
    };

    switch (expense.category) {
      case 'administrative':
        administrativeExpenses.push(expense);
        break;
      case 'selling':
        sellingExpenses.push(expense);
        break;
      default:
        generalExpenses.push(expense);
    }
  });

  // Add transaction-based expenses
  opexTransactions.forEach(transaction => {
    const expense: OperationalExpenseDetail = {
      costId: transaction.id,
      costName: transaction.description || transaction.category || 'Expense',
      costType: 'variabel', // Transactions are typically variable
      monthlyAmount: transaction.amount || 0,
      category: categorizeTransactionExpense(transaction.category || ''),
      percentage: 0
    };

    switch (expense.category) {
      case 'administrative':
        administrativeExpenses.push(expense);
        break;
      case 'selling':
        sellingExpenses.push(expense);
        break;
      default:
        generalExpenses.push(expense);
    }
  });

  const totalAdministrative = administrativeExpenses.reduce((sum, exp) => sum + exp.monthlyAmount, 0);
  const totalSelling = sellingExpenses.reduce((sum, exp) => sum + exp.monthlyAmount, 0);
  const totalGeneral = generalExpenses.reduce((sum, exp) => sum + exp.monthlyAmount, 0);
  const totalOPEX = totalAdministrative + totalSelling + totalGeneral;

  // Calculate percentages
  if (totalOPEX > 0) {
    administrativeExpenses.forEach(exp => exp.percentage = (exp.monthlyAmount / totalOPEX) * 100);
    sellingExpenses.forEach(exp => exp.percentage = (exp.monthlyAmount / totalOPEX) * 100);
    generalExpenses.forEach(exp => exp.percentage = (exp.monthlyAmount / totalOPEX) * 100);
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
};

// ===========================================
// ✅ INSIGHT GENERATION
// ===========================================

export const generateInsights = (
  profitData: ProfitMarginData,
  cogsBreakdown: COGSBreakdown,
  opexBreakdown: OPEXBreakdown
): ProfitInsight[] => {
  const insights: ProfitInsight[] = [];

  // Gross margin analysis
  if (profitData.grossMargin < PROFIT_MARGIN_THRESHOLDS.grossMargin.poor) {
    insights.push({
      type: 'critical',
      category: 'margin',
      title: 'Gross Margin Sangat Rendah',
      message: `Gross margin ${profitData.grossMargin.toFixed(1)}% berada di bawah standar industri`,
      recommendation: 'Evaluasi harga jual atau efisiensi produksi',
      impact: 'high'
    });
  } else if (profitData.grossMargin >= PROFIT_MARGIN_THRESHOLDS.grossMargin.excellent) {
    insights.push({
      type: 'success',
      category: 'margin',
      title: 'Gross Margin Excellent',
      message: `Gross margin ${profitData.grossMargin.toFixed(1)}% sangat baik`,
      impact: 'high'
    });
  }

  // Net margin analysis
  if (profitData.netMargin < PROFIT_MARGIN_THRESHOLDS.netMargin.poor) {
    insights.push({
      type: 'warning',
      category: 'margin',
      title: 'Net Margin Perlu Perhatian',
      message: `Net margin ${profitData.netMargin.toFixed(1)}% cukup rendah`,
      recommendation: 'Optimalkan biaya operasional',
      impact: 'medium'
    });
  }

  // COGS analysis
  const cogsPercentage = profitData.revenue > 0 ? (profitData.cogs / profitData.revenue) * 100 : 0;
  if (cogsPercentage > 70) {
    insights.push({
      type: 'warning',
      category: 'cogs',
      title: 'COGS Terlalu Tinggi',
      message: `COGS ${cogsPercentage.toFixed(1)}% dari revenue`,
      recommendation: 'Review efisiensi produksi dan harga supplier',
      impact: 'high'
    });
  }

  // OPEX analysis
  const opexPercentage = profitData.revenue > 0 ? (profitData.opex / profitData.revenue) * 100 : 0;
  if (opexPercentage > 30) {
    insights.push({
      type: 'info',
      category: 'opex',
      title: 'OPEX Relatif Tinggi',
      message: `Biaya operasional ${opexPercentage.toFixed(1)}% dari revenue`,
      recommendation: 'Evaluasi efisiensi operasional',
      impact: 'medium'
    });
  }

  return insights;
};

// ===========================================
// ✅ HELPER FUNCTIONS
// ===========================================

const categorizeCost = (costName: string): 'administrative' | 'selling' | 'general' => {
  const name = costName.toLowerCase();
  
  if (name.includes('administrasi') || name.includes('gaji admin') || name.includes('sewa kantor')) {
    return 'administrative';
  }
  
  if (name.includes('marketing') || name.includes('promosi') || name.includes('penjualan')) {
    return 'selling';
  }
  
  return 'general';
};

const categorizeTransactionExpense = (category: string): 'administrative' | 'selling' | 'general' => {
  const cat = category.toLowerCase();
  
  if (cat.includes('administrasi') || cat.includes('gaji admin')) {
    return 'administrative';
  }
  
  if (cat.includes('marketing') || cat.includes('transportasi') || cat.includes('promosi')) {
    return 'selling';
  }
  
  return 'general';
};

// ===========================================
// ✅ VALIDATION FUNCTIONS
// ===========================================

export const validateProfitAnalysisInput = (input: ProfitAnalysisInput) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Validate date period
  if (!input.period || !input.period.from || !input.period.to) {
    errors.push('Period tanggal harus diisi');
  } else if (input.period.from > input.period.to) {
    errors.push('Tanggal mulai tidak boleh lebih besar dari tanggal akhir');
  }

  // Validate transactions
  if (!input.transactions || input.transactions.length === 0) {
    warnings.push('Tidak ada transaksi dalam periode ini');
  } else {
    const hasIncome = input.transactions.some(t => t.type === 'income');
    const hasExpense = input.transactions.some(t => t.type === 'expense');
    
    if (!hasIncome) {
      warnings.push('Tidak ada transaksi pemasukan dalam periode ini');
    }
    if (!hasExpense) {
      warnings.push('Tidak ada transaksi pengeluaran dalam periode ini');
    }
  }

  // Validate operational costs
  if (!input.operationalCosts || input.operationalCosts.length === 0) {
    warnings.push('Tidak ada data biaya operasional');
    suggestions.push('Tambahkan biaya operasional untuk analisis yang lebih akurat');
  } else {
    const activeCosts = input.operationalCosts.filter(c => c.status === 'aktif');
    if (activeCosts.length === 0) {
      warnings.push('Tidak ada biaya operasional yang aktif');
    }
  }

  // Validate materials
  if (!input.materials || input.materials.length === 0) {
    warnings.push('Tidak ada data bahan baku');
    suggestions.push('Tambahkan data warehouse untuk tracking HPP yang akurat');
  }

  // Business logic validations
  const revenue = calculateRevenue(input.transactions);
  if (revenue === 0) {
    errors.push('Revenue tidak boleh nol untuk analisis profit margin');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
};

// ===========================================
// ✅ COMPARISON FUNCTIONS
// ===========================================

export const compareProfitMargins = (
  current: ProfitMarginData,
  previous?: ProfitMarginData,
  budget?: ProfitMarginData
) => {
  const comparison: any = {
    variance: {
      revenueGrowth: 0,
      marginImprovement: 0,
      costReduction: 0
    }
  };

  if (previous) {
    comparison.previousPeriod = previous;
    comparison.variance.revenueGrowth = previous.revenue > 0 
      ? ((current.revenue - previous.revenue) / previous.revenue) * 100 
      : 0;
    comparison.variance.marginImprovement = current.netMargin - previous.netMargin;
    comparison.variance.costReduction = previous.revenue > 0 && current.revenue > 0
      ? ((previous.cogs + previous.opex) / previous.revenue - (current.cogs + current.opex) / current.revenue) * 100
      : 0;
  }

  if (budget) {
    comparison.budgetPlan = budget;
  }

  return comparison;
};

// ===========================================
// ✅ EXPORT UTILITIES
// ===========================================

export const formatProfitMarginForDisplay = (data: ProfitMarginData) => {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);

  const formatPercentage = (value: number) => 
    `${value.toFixed(1)}%`;

  return {
    revenue: formatCurrency(data.revenue),
    cogs: formatCurrency(data.cogs),
    opex: formatCurrency(data.opex),
    grossProfit: formatCurrency(data.grossProfit),
    netProfit: formatCurrency(data.netProfit),
    grossMargin: formatPercentage(data.grossMargin),
    netMargin: formatPercentage(data.netMargin),
    period: data.period.label
  };
};

export const getProfitMarginColor = (margin: number, type: 'gross' | 'net') => {
  const thresholds = type === 'gross' 
    ? PROFIT_MARGIN_THRESHOLDS.grossMargin 
    : PROFIT_MARGIN_THRESHOLDS.netMargin;

  if (margin >= thresholds.excellent) return 'green';
  if (margin >= thresholds.good) return 'blue';
  if (margin >= thresholds.acceptable) return 'yellow';
  if (margin >= thresholds.poor) return 'orange';
  return 'red';
};

// ===========================================
// ✅ CHART DATA PREPARATION
// ===========================================

export const prepareProfitChartData = (results: ProfitAnalysisResult[]) => {
  return {
    marginTrend: results.map(result => ({
      date: result.profitMarginData.period.label,
      grossMargin: result.profitMarginData.grossMargin,
      netMargin: result.profitMarginData.netMargin
    })),
    
    costBreakdown: results.length > 0 ? [
      {
        category: 'Material Costs',
        amount: results[0].cogsBreakdown.totalMaterialCost,
        percentage: (results[0].cogsBreakdown.totalMaterialCost / results[0].profitMarginData.revenue) * 100,
        type: 'cogs' as const
      },
      {
        category: 'Direct Labor',
        amount: results[0].cogsBreakdown.totalDirectLaborCost,
        percentage: (results[0].cogsBreakdown.totalDirectLaborCost / results[0].profitMarginData.revenue) * 100,
        type: 'cogs' as const
      },
      {
        category: 'Manufacturing Overhead',
        amount: results[0].cogsBreakdown.manufacturingOverhead,
        percentage: (results[0].cogsBreakdown.manufacturingOverhead / results[0].profitMarginData.revenue) * 100,
        type: 'cogs' as const
      },
      {
        category: 'Operating Expenses',
        amount: results[0].opexBreakdown.totalOPEX,
        percentage: (results[0].opexBreakdown.totalOPEX / results[0].profitMarginData.revenue) * 100,
        type: 'opex' as const
      }
    ] : [],
    
    profitWaterfall: results.length > 0 ? [
      {
        category: 'Revenue',
        value: results[0].profitMarginData.revenue,
        cumulative: results[0].profitMarginData.revenue
      },
      {
        category: 'COGS',
        value: -results[0].profitMarginData.cogs,
        cumulative: results[0].profitMarginData.grossProfit
      },
      {
        category: 'OPEX',
        value: -results[0].profitMarginData.opex,
        cumulative: results[0].profitMarginData.netProfit
      }
    ] : []
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
  
  // Re-export calculation utilities
  calculateRevenue,
  calculateCOGS,
  calculateOPEX,
  calculateMargins,
  generateInsights
};