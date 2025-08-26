// src/components/profitAnalysis/utils/efficiencyMetrics.ts

import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { BusinessType } from './config/profitConfig';

// ==============================================
// TYPES
// ==============================================

export interface EfficiencyMetrics {
  // Produktivitas Operasional
  revenuePerDay: number;
  revenuePerWorkingDay: number;
  costPerRevenue: number;
  
  // Efisiensi Bahan Baku
  materialTurnover: number;
  wastePercentage: number;
  costPerPortion: number;
  
  // Efisiensi Operasional
  operationalEfficiency: number;
  laborProductivity: number;
  overheadRatio: number;
  
  // Metrik Khusus F&B
  averageOrderValue: number;
  customerAcquisitionCost: number;
  inventoryTurnover: number;
  
  // Status & Kategori
  efficiencyGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
}

export interface EfficiencyBenchmark {
  businessType: BusinessType;
  optimalCogsRatio: { min: number; max: number };
  optimalOpexRatio: { min: number; max: number };
  optimalNetMargin: { min: number; max: number };
  averageOrderValue: { min: number; max: number };
  inventoryTurnover: { min: number; max: number };
}

export interface OperationalData {
  workingDaysPerMonth: number;
  averagePortionsPerDay: number;
  totalCustomers: number;
  inventoryValue: number;
  laborCosts: number;
  marketingCosts: number;
}

// ==============================================
// BENCHMARK DATA F&B INDONESIA
// ==============================================

export const F_AND_B_BENCHMARKS: Record<BusinessType, EfficiencyBenchmark> = {
  [BusinessType.FNB_RESTAURANT]: {
    businessType: BusinessType.FNB_RESTAURANT,
    optimalCogsRatio: { min: 28, max: 35 },
    optimalOpexRatio: { min: 25, max: 35 },
    optimalNetMargin: { min: 15, max: 25 },
    averageOrderValue: { min: 50000, max: 150000 },
    inventoryTurnover: { min: 12, max: 24 }
  },
  [BusinessType.FNB_CAFE]: {
    businessType: BusinessType.FNB_CAFE,
    optimalCogsRatio: { min: 25, max: 32 },
    optimalOpexRatio: { min: 30, max: 40 },
    optimalNetMargin: { min: 12, max: 20 },
    averageOrderValue: { min: 25000, max: 75000 },
    inventoryTurnover: { min: 15, max: 30 }
  },
  [BusinessType.FNB_CATERING]: {
    businessType: BusinessType.FNB_CATERING,
    optimalCogsRatio: { min: 30, max: 40 },
    optimalOpexRatio: { min: 20, max: 30 },
    optimalNetMargin: { min: 18, max: 30 },
    averageOrderValue: { min: 200000, max: 1000000 },
    inventoryTurnover: { min: 8, max: 15 }
  },
  [BusinessType.FNB_BAKERY]: {
    businessType: BusinessType.FNB_BAKERY,
    optimalCogsRatio: { min: 35, max: 45 },
    optimalOpexRatio: { min: 25, max: 35 },
    optimalNetMargin: { min: 10, max: 18 },
    averageOrderValue: { min: 15000, max: 50000 },
    inventoryTurnover: { min: 20, max: 40 }
  },
  [BusinessType.FNB_FASTFOOD]: {
    businessType: BusinessType.FNB_FASTFOOD,
    optimalCogsRatio: { min: 25, max: 32 },
    optimalOpexRatio: { min: 35, max: 45 },
    optimalNetMargin: { min: 8, max: 15 },
    averageOrderValue: { min: 20000, max: 60000 },
    inventoryTurnover: { min: 25, max: 50 }
  },
  [BusinessType.FNB_STREETFOOD]: {
    businessType: BusinessType.FNB_STREETFOOD,
    optimalCogsRatio: { min: 30, max: 40 },
    optimalOpexRatio: { min: 15, max: 25 },
    optimalNetMargin: { min: 20, max: 35 },
    averageOrderValue: { min: 10000, max: 30000 },
    inventoryTurnover: { min: 30, max: 60 }
  },
  [BusinessType.DEFAULT]: {
    businessType: BusinessType.DEFAULT,
    optimalCogsRatio: { min: 28, max: 35 },
    optimalOpexRatio: { min: 25, max: 35 },
    optimalNetMargin: { min: 15, max: 25 },
    averageOrderValue: { min: 50000, max: 150000 },
    inventoryTurnover: { min: 12, max: 24 }
  }
};

// ==============================================
// CALCULATION FUNCTIONS
// ==============================================

export function calculateEfficiencyMetrics(
  profitData: RealTimeProfitCalculation,
  operationalData: OperationalData,
  businessType: BusinessType = BusinessType.FNB_RESTAURANT
): EfficiencyMetrics {
  const revenue = profitData.revenue_data?.total || 0;
  const cogs = profitData.cogs_data?.total || 0;
  const opex = profitData.opex_data?.total || 0;
  const netProfit = revenue - cogs - opex;
  
  const {
    workingDaysPerMonth,
    averagePortionsPerDay,
    totalCustomers,
    inventoryValue,
    laborCosts,
    marketingCosts
  } = operationalData;
  
  // Produktivitas Operasional
  const revenuePerDay = revenue / 30; // Asumsi 30 hari per bulan
  const revenuePerWorkingDay = workingDaysPerMonth > 0 ? revenue / workingDaysPerMonth : 0;
  const costPerRevenue = revenue > 0 ? ((cogs + opex) / revenue) * 100 : 0;
  
  // Efisiensi Bahan Baku
  const materialTurnover = inventoryValue > 0 ? cogs / inventoryValue : 0;
  const wastePercentage = 5; // Default 5%, bisa dihitung dari data aktual
  const totalPortions = averagePortionsPerDay * workingDaysPerMonth;
  const costPerPortion = totalPortions > 0 ? cogs / totalPortions : 0;
  
  // Efisiensi Operasional
  const operationalEfficiency = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const laborProductivity = laborCosts > 0 ? revenue / laborCosts : 0;
  const overheadRatio = revenue > 0 ? (opex / revenue) * 100 : 0;
  
  // Metrik Khusus F&B
  const averageOrderValue = totalCustomers > 0 ? revenue / totalCustomers : 0;
  const customerAcquisitionCost = totalCustomers > 0 ? marketingCosts / totalCustomers : 0;
  const inventoryTurnover = materialTurnover * 12; // Annualized
  
  // Grading & Recommendations
  const benchmark = F_AND_B_BENCHMARKS[businessType];
  const efficiencyGrade = calculateEfficiencyGrade(operationalEfficiency, benchmark);
  const recommendations = generateRecommendations({
    cogsRatio: revenue > 0 ? (cogs / revenue) * 100 : 0,
    opexRatio: overheadRatio,
    netMargin: operationalEfficiency,
    averageOrderValue,
    inventoryTurnover
  }, benchmark);
  
  return {
    revenuePerDay,
    revenuePerWorkingDay,
    costPerRevenue,
    materialTurnover,
    wastePercentage,
    costPerPortion,
    operationalEfficiency,
    laborProductivity,
    overheadRatio,
    averageOrderValue,
    customerAcquisitionCost,
    inventoryTurnover,
    efficiencyGrade,
    recommendations
  };
}

function calculateEfficiencyGrade(
  netMargin: number,
  benchmark: EfficiencyBenchmark
): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (netMargin >= benchmark.optimalNetMargin.max) return 'A';
  if (netMargin >= benchmark.optimalNetMargin.min) return 'B';
  if (netMargin >= benchmark.optimalNetMargin.min * 0.7) return 'C';
  if (netMargin >= 0) return 'D';
  return 'F';
}

function generateRecommendations(
  metrics: {
    cogsRatio: number;
    opexRatio: number;
    netMargin: number;
    averageOrderValue: number;
    inventoryTurnover: number;
  },
  benchmark: EfficiencyBenchmark
): string[] {
  const recommendations: string[] = [];
  
  // COGS Analysis
  if (metrics.cogsRatio > benchmark.optimalCogsRatio.max) {
    recommendations.push('Modal bahan baku terlalu tinggi. Cari supplier lebih murah atau negosiasi harga bulk.');
    recommendations.push('Pertimbangkan mengganti bahan dengan alternatif yang lebih ekonomis.');
  } else if (metrics.cogsRatio < benchmark.optimalCogsRatio.min) {
    recommendations.push('Modal bahan baku sangat efisien. Pertimbangkan meningkatkan kualitas bahan.');
  }
  
  // OpEx Analysis
  if (metrics.opexRatio > benchmark.optimalOpexRatio.max) {
    recommendations.push('Biaya operasional terlalu tinggi. Review biaya sewa, listrik, dan gaji.');
    recommendations.push('Otomatisasi proses untuk mengurangi biaya tenaga kerja.');
  }
  
  // Revenue Analysis
  if (metrics.averageOrderValue < benchmark.averageOrderValue.min) {
    recommendations.push('Rata-rata pembelian customer rendah. Buat paket bundling atau upselling.');
    recommendations.push('Tambahkan menu dengan margin tinggi untuk meningkatkan AOV.');
  }
  
  // Inventory Analysis
  if (metrics.inventoryTurnover < benchmark.inventoryTurnover.min) {
    recommendations.push('Perputaran stok lambat. Kurangi stok bahan yang jarang dipakai.');
    recommendations.push('Buat menu seasonal untuk menghabiskan stok lama.');
  } else if (metrics.inventoryTurnover > benchmark.inventoryTurnover.max) {
    recommendations.push('Perputaran stok terlalu cepat. Risiko kehabisan stok, tambah safety stock.');
  }
  
  // Net Margin Analysis
  if (metrics.netMargin < benchmark.optimalNetMargin.min) {
    recommendations.push('Margin keuntungan rendah. Naikkan harga jual atau kurangi biaya.');
    recommendations.push('Focus pada menu dengan margin tinggi dan promosikan lebih gencar.');
  }
  
  return recommendations;
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

export function getBenchmarkForBusinessType(businessType: BusinessType): EfficiencyBenchmark {
  return F_AND_B_BENCHMARKS[businessType];
}

export function compareWithBenchmark(
  metrics: EfficiencyMetrics,
  businessType: BusinessType
): {
  cogsStatus: 'optimal' | 'high' | 'low';
  opexStatus: 'optimal' | 'high' | 'low';
  marginStatus: 'optimal' | 'high' | 'low';
  overallScore: number; // 0-100
} {
  const benchmark = F_AND_B_BENCHMARKS[businessType];
  
  // Calculate COGS ratio from metrics
  const cogsRatio = metrics.costPerRevenue - metrics.overheadRatio;
  
  const cogsStatus = 
    cogsRatio >= benchmark.optimalCogsRatio.min && cogsRatio <= benchmark.optimalCogsRatio.max
      ? 'optimal'
      : cogsRatio > benchmark.optimalCogsRatio.max
      ? 'high'
      : 'low';
  
  const opexStatus = 
    metrics.overheadRatio >= benchmark.optimalOpexRatio.min && metrics.overheadRatio <= benchmark.optimalOpexRatio.max
      ? 'optimal'
      : metrics.overheadRatio > benchmark.optimalOpexRatio.max
      ? 'high'
      : 'low';
  
  const marginStatus = 
    metrics.operationalEfficiency >= benchmark.optimalNetMargin.min && metrics.operationalEfficiency <= benchmark.optimalNetMargin.max
      ? 'optimal'
      : metrics.operationalEfficiency > benchmark.optimalNetMargin.max
      ? 'high'
      : 'low';
  
  // Calculate overall score (0-100)
  let score = 0;
  if (cogsStatus === 'optimal') score += 30;
  else if (cogsStatus === 'low') score += 20;
  
  if (opexStatus === 'optimal') score += 30;
  else if (opexStatus === 'low') score += 20;
  
  if (marginStatus === 'optimal') score += 40;
  else if (marginStatus === 'high') score += 30;
  
  return {
    cogsStatus,
    opexStatus,
    marginStatus,
    overallScore: Math.min(100, score)
  };
}

export function formatEfficiencyMetric(value: number, type: 'currency' | 'percentage' | 'ratio' | 'days'): string {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    
    case 'percentage':
      return `${value.toFixed(1)}%`;
    
    case 'ratio':
      return `${value.toFixed(2)}x`;
    
    case 'days':
      return `${Math.round(value)} hari`;
    
    default:
      return value.toLocaleString('id-ID');
  }
}