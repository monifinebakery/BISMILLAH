// src/components/profitAnalysis/utils/cashFlowAnalysis.ts

import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { BusinessType } from './config/profitConfig';

// ==============================================
// TYPES
// ==============================================

export interface CashFlowMetrics {
  operatingCashFlow: number;
  freeCashFlow: number;
  cashConversionCycle: number;
  workingCapitalRequirement: number;
  cashBurnRate: number;
  cashRunway: number; // dalam hari
  receivablesTurnover: number;
  payablesTurnover: number;
  inventoryTurnover: number;
}

export interface CashFlowForecast {
  period: string;
  projectedRevenue: number;
  projectedCogs: number;
  projectedOpex: number;
  projectedCashFlow: number;
  cumulativeCashFlow: number;
  workingCapitalNeed: number;
}

export interface WorkingCapitalAnalysis {
  currentWorkingCapital: number;
  optimalWorkingCapital: number;
  workingCapitalGap: number;
  recommendations: WorkingCapitalRecommendation[];
  riskLevel: 'low' | 'medium' | 'high';
  daysOfOperatingExpenses: number;
}

export interface WorkingCapitalRecommendation {
  type: 'inventory' | 'receivables' | 'payables' | 'cash_management';
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedImpact: number;
  timeframe: 'immediate' | 'short_term' | 'medium_term';
  actionSteps: string[];
}

export interface CashFlowAnalysisResult {
  metrics: CashFlowMetrics;
  forecast: CashFlowForecast[];
  workingCapitalAnalysis: WorkingCapitalAnalysis;
  insights: string[];
  alerts: CashFlowAlert[];
}

export interface CashFlowAlert {
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  actionRequired: boolean;
  priority: number;
}

// ==============================================
// CONSTANTS
// ==============================================

const INDUSTRY_BENCHMARKS = {
  [BusinessType.FNB_RESTAURANT]: {
    cashConversionCycle: 15, // hari
    workingCapitalRatio: 0.15, // 15% dari revenue
    inventoryTurnover: 24, // kali per tahun
    receivablesTurnover: 52, // kali per tahun (weekly collection)
    payablesTurnover: 12, // kali per tahun
    minCashRunway: 30, // hari minimum
    optimalCashRunway: 60, // hari optimal
  },
  [BusinessType.FNB_CAFE]: {
    cashConversionCycle: 10,
    workingCapitalRatio: 0.12,
    inventoryTurnover: 30,
    receivablesTurnover: 365, // mostly cash sales
    payablesTurnover: 15,
    minCashRunway: 25,
    optimalCashRunway: 45,
  },
  [BusinessType.FNB_CATERING]: {
    cashConversionCycle: 25,
    workingCapitalRatio: 0.20,
    inventoryTurnover: 18,
    receivablesTurnover: 12, // monthly collection
    payablesTurnover: 10,
    minCashRunway: 45,
    optimalCashRunway: 90,
  },
  [BusinessType.FNB_BAKERY]: {
    cashConversionCycle: 8,
    workingCapitalRatio: 0.10,
    inventoryTurnover: 36,
    receivablesTurnover: 365,
    payablesTurnover: 18,
    minCashRunway: 20,
    optimalCashRunway: 40,
  },
  [BusinessType.FNB_FASTFOOD]: {
    cashConversionCycle: 5,
    workingCapitalRatio: 0.08,
    inventoryTurnover: 48,
    receivablesTurnover: 365,
    payablesTurnover: 20,
    minCashRunway: 15,
    optimalCashRunway: 30,
  },
  [BusinessType.FNB_STREETFOOD]: {
    cashConversionCycle: 3,
    workingCapitalRatio: 0.05,
    inventoryTurnover: 60,
    receivablesTurnover: 365,
    payablesTurnover: 24,
    minCashRunway: 10,
    optimalCashRunway: 20,
  },
  [BusinessType.DEFAULT]: {
    cashConversionCycle: 15,
    workingCapitalRatio: 0.15,
    inventoryTurnover: 24,
    receivablesTurnover: 52,
    payablesTurnover: 12,
    minCashRunway: 30,
    optimalCashRunway: 60,
  },
};

// ==============================================
// CASH FLOW CALCULATION FUNCTIONS
// ==============================================

export function calculateCashFlowMetrics(
  analysis: RealTimeProfitCalculation,
  businessType: BusinessType = BusinessType.FNB_RESTAURANT,
  additionalData?: {
    currentCash?: number;
    accountsReceivable?: number;
    inventory?: number;
    accountsPayable?: number;
  }
): CashFlowMetrics {
  const revenue = analysis.revenue_data?.total || 0;
  const cogs = analysis.cogs_data?.total || 0;
  const opex = analysis.opex_data?.total || 0;
  const netProfit = revenue - cogs - opex;
  
  const benchmark = INDUSTRY_BENCHMARKS[businessType as keyof typeof INDUSTRY_BENCHMARKS];
  
  // Estimasi berdasarkan data yang tersedia
  const estimatedReceivables = additionalData?.accountsReceivable || (revenue / benchmark.receivablesTurnover);
  const estimatedInventory = additionalData?.inventory || (cogs / benchmark.inventoryTurnover);
  const estimatedPayables = additionalData?.accountsPayable || (cogs / benchmark.payablesTurnover);
  const currentCash = additionalData?.currentCash || (revenue * 0.1); // estimasi 10% dari revenue
  
  // Operating Cash Flow = Net Profit + Non-cash expenses (estimasi)
  const operatingCashFlow = netProfit + (opex * 0.2); // asumsi 20% opex adalah non-cash
  
  // Free Cash Flow = Operating Cash Flow - Capital Expenditures (estimasi)
  const freeCashFlow = operatingCashFlow - (revenue * 0.05); // asumsi 5% revenue untuk capex
  
  // Cash Conversion Cycle
  const daysInPeriod = 30; // asumsi periode bulanan
  const daysSalesOutstanding = (estimatedReceivables / revenue) * daysInPeriod;
  const daysInventoryOutstanding = (estimatedInventory / cogs) * daysInPeriod;
  const daysPayableOutstanding = (estimatedPayables / cogs) * daysInPeriod;
  const cashConversionCycle = daysSalesOutstanding + daysInventoryOutstanding - daysPayableOutstanding;
  
  // Working Capital Requirement
  const workingCapitalRequirement = estimatedReceivables + estimatedInventory - estimatedPayables;
  
  // Cash Burn Rate (monthly)
  const cashBurnRate = Math.max(0, -freeCashFlow);
  
  // Cash Runway
  const cashRunway = cashBurnRate > 0 ? currentCash / (cashBurnRate / 30) : 999; // dalam hari
  
  return {
    operatingCashFlow,
    freeCashFlow,
    cashConversionCycle,
    workingCapitalRequirement,
    cashBurnRate,
    cashRunway,
    receivablesTurnover: revenue / estimatedReceivables,
    payablesTurnover: cogs / estimatedPayables,
    inventoryTurnover: cogs / estimatedInventory,
  };
}

export function generateCashFlowForecast(
  analysis: RealTimeProfitCalculation,
  businessType: BusinessType = BusinessType.FNB_RESTAURANT,
  periods: number = 6
): CashFlowForecast[] {
  const revenue = analysis.revenue_data?.total || 0;
  const cogs = analysis.cogs_data?.total || 0;
  const opex = analysis.opex_data?.total || 0;
  
  const forecast: CashFlowForecast[] = [];
  let cumulativeCashFlow = 0;
  
  // Asumsi pertumbuhan dan seasonality
  const growthRate = 0.05; // 5% growth per month
  const seasonalityFactors = [1.0, 1.1, 1.2, 1.15, 1.05, 0.95]; // seasonal variation
  
  for (let i = 0; i < periods; i++) {
    const monthlyGrowth = Math.pow(1 + growthRate, i);
    const seasonalFactor = seasonalityFactors[i % seasonalityFactors.length];
    
    const projectedRevenue = revenue * monthlyGrowth * seasonalFactor;
    const projectedCogs = cogs * monthlyGrowth * seasonalFactor;
    const projectedOpex = opex * (1 + (growthRate * 0.5)); // opex grows slower
    
    const projectedCashFlow = projectedRevenue - projectedCogs - projectedOpex;
    cumulativeCashFlow += projectedCashFlow;
    
    const workingCapitalNeed = projectedRevenue * INDUSTRY_BENCHMARKS[businessType as keyof typeof INDUSTRY_BENCHMARKS].workingCapitalRatio;
    
    forecast.push({
      period: `Bulan ${i + 1}`,
      projectedRevenue,
      projectedCogs,
      projectedOpex,
      projectedCashFlow,
      cumulativeCashFlow,
      workingCapitalNeed,
    });
  }
  
  return forecast;
}

export function analyzeWorkingCapital(
  analysis: RealTimeProfitCalculation,
  businessType: BusinessType = BusinessType.FNB_RESTAURANT,
  currentCash: number = 0
): WorkingCapitalAnalysis {
  const revenue = analysis.revenue_data?.total || 0;
  const opex = analysis.opex_data?.total || 0;
  
  const benchmark = INDUSTRY_BENCHMARKS[businessType];
  const optimalWorkingCapital = revenue * benchmark.workingCapitalRatio;
  const currentWorkingCapital = currentCash; // simplified
  const workingCapitalGap = optimalWorkingCapital - currentWorkingCapital;
  
  const daysOfOperatingExpenses = currentCash / (opex / 30);
  
  // Determine risk level
  let riskLevel: WorkingCapitalAnalysis['riskLevel'];
  if (daysOfOperatingExpenses >= benchmark.optimalCashRunway) {
    riskLevel = 'low';
  } else if (daysOfOperatingExpenses >= benchmark.minCashRunway) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }
  
  // Generate recommendations
  const recommendations: WorkingCapitalRecommendation[] = [];
  
  if (workingCapitalGap > 0) {
    recommendations.push({
      type: 'cash_management',
      priority: 'high',
      description: `Tingkatkan modal kerja sebesar ${(workingCapitalGap / 1000000).toFixed(1)} juta rupiah`,
      estimatedImpact: workingCapitalGap,
      timeframe: 'immediate',
      actionSteps: [
        'Evaluasi kebutuhan kas harian',
        'Pertimbangkan fasilitas kredit dari bank',
        'Optimasi collection dari piutang',
        'Negosiasi payment terms dengan supplier'
      ]
    });
  }
  
  if (daysOfOperatingExpenses < benchmark.minCashRunway) {
    recommendations.push({
      type: 'cash_management',
      priority: 'critical',
      description: 'Cash runway di bawah minimum, perlu tindakan segera',
      estimatedImpact: opex * (benchmark.minCashRunway - daysOfOperatingExpenses) / 30,
      timeframe: 'immediate',
      actionSteps: [
        'Percepat collection piutang',
        'Tunda pembayaran non-essential',
        'Pertimbangkan emergency funding',
        'Review dan potong biaya operasional'
      ]
    });
  }
  
  return {
    currentWorkingCapital,
    optimalWorkingCapital,
    workingCapitalGap,
    recommendations,
    riskLevel,
    daysOfOperatingExpenses,
  };
}

export function generateCashFlowInsights(
  metrics: CashFlowMetrics,
  forecast: CashFlowForecast[],
  workingCapital: WorkingCapitalAnalysis,
  businessType: BusinessType
): string[] {
  const insights: string[] = [];
  const benchmark = INDUSTRY_BENCHMARKS[businessType];
  
  // Cash conversion cycle insights
  if (metrics.cashConversionCycle > benchmark.cashConversionCycle) {
    insights.push(
      `Siklus konversi kas (${metrics.cashConversionCycle.toFixed(0)} hari) lebih lambat dari standar industri (${benchmark.cashConversionCycle} hari). Fokus pada percepatan collection dan optimasi inventory.`
    );
  } else {
    insights.push(
      `Siklus konversi kas Anda (${metrics.cashConversionCycle.toFixed(0)} hari) sudah efisien dibanding standar industri.`
    );
  }
  
  // Cash runway insights
  if (metrics.cashRunway < benchmark.minCashRunway) {
    insights.push(
      `Cash runway (${metrics.cashRunway.toFixed(0)} hari) di bawah minimum yang disarankan. Perlu tindakan segera untuk meningkatkan likuiditas.`
    );
  } else if (metrics.cashRunway < benchmark.optimalCashRunway) {
    insights.push(
      `Cash runway masih dalam batas aman namun perlu ditingkatkan untuk mencapai level optimal (${benchmark.optimalCashRunway} hari).`
    );
  }
  
  // Free cash flow insights
  if (metrics.freeCashFlow < 0) {
    insights.push(
      'Free cash flow negatif menunjukkan bisnis membutuhkan tambahan modal untuk operasional dan investasi.'
    );
  } else {
    insights.push(
      `Free cash flow positif (${(metrics.freeCashFlow / 1000000).toFixed(1)} juta) menunjukkan kemampuan bisnis menghasilkan kas untuk pertumbuhan.`
    );
  }
  
  // Forecast insights
  const totalProjectedCashFlow = forecast.reduce((sum, period) => sum + period.projectedCashFlow, 0);
  if (totalProjectedCashFlow > 0) {
    insights.push(
      `Proyeksi cash flow 6 bulan ke depan positif (${(totalProjectedCashFlow / 1000000).toFixed(1)} juta), menunjukkan tren bisnis yang sehat.`
    );
  } else {
    insights.push(
      'Proyeksi cash flow menunjukkan potensi masalah likuiditas. Perlu strategi perbaikan segera.'
    );
  }
  
  return insights;
}

export function generateCashFlowAlerts(
  metrics: CashFlowMetrics,
  workingCapital: WorkingCapitalAnalysis,
  businessType: BusinessType
): CashFlowAlert[] {
  const alerts: CashFlowAlert[] = [];
  const benchmark = INDUSTRY_BENCHMARKS[businessType];
  
  // Critical cash runway alert
  if (metrics.cashRunway < 15) {
    alerts.push({
      type: 'critical',
      title: 'Cash Runway Kritis',
      message: `Kas operasional hanya cukup untuk ${metrics.cashRunway.toFixed(0)} hari. Perlu tindakan darurat.`,
      actionRequired: true,
      priority: 1,
    });
  } else if (metrics.cashRunway < benchmark.minCashRunway) {
    alerts.push({
      type: 'warning',
      title: 'Cash Runway Rendah',
      message: `Cash runway (${metrics.cashRunway.toFixed(0)} hari) di bawah minimum yang disarankan.`,
      actionRequired: true,
      priority: 2,
    });
  }
  
  // Working capital alert
  if (workingCapital.workingCapitalGap > workingCapital.currentWorkingCapital * 0.5) {
    alerts.push({
      type: 'critical',
      title: 'Modal Kerja Kritis',
      message: 'Modal kerja tidak mencukupi untuk operasional normal.',
      actionRequired: true,
      priority: 1,
    });
  } else if (workingCapital.workingCapitalGap > 0) {
    alerts.push({
      type: 'warning',
      title: 'Kekurangan Modal Kerja',
      message: `Dibutuhkan tambahan modal kerja sebesar ${(workingCapital.workingCapitalGap / 1000000).toFixed(1)} juta rupiah.`,
      actionRequired: false,
      priority: 3,
    });
  }
  
  // Cash conversion cycle alert
  if (metrics.cashConversionCycle > benchmark.cashConversionCycle * 1.5) {
    alerts.push({
      type: 'warning',
      title: 'Siklus Kas Lambat',
      message: 'Siklus konversi kas terlalu lambat, mempengaruhi likuiditas.',
      actionRequired: false,
      priority: 4,
    });
  }
  
  // Positive insights
  if (metrics.freeCashFlow > 0 && metrics.cashRunway > benchmark.optimalCashRunway) {
    alerts.push({
      type: 'info',
      title: 'Kondisi Kas Sehat',
      message: 'Cash flow dan runway dalam kondisi optimal.',
      actionRequired: false,
      priority: 5,
    });
  }
  
  return alerts.sort((a, b) => a.priority - b.priority);
}

// ==============================================
// MAIN ANALYSIS FUNCTION
// ==============================================

export function performCashFlowAnalysis(
  analysis: RealTimeProfitCalculation,
  businessType: BusinessType = BusinessType.FNB_RESTAURANT,
  additionalData?: {
    currentCash?: number;
    accountsReceivable?: number;
    inventory?: number;
    accountsPayable?: number;
  }
): CashFlowAnalysisResult {
  const metrics = calculateCashFlowMetrics(analysis, businessType, additionalData);
  const forecast = generateCashFlowForecast(analysis, businessType);
  const workingCapitalAnalysis = analyzeWorkingCapital(
    analysis, 
    businessType, 
    additionalData?.currentCash || 0
  );
  
  const insights = generateCashFlowInsights(metrics, forecast, workingCapitalAnalysis, businessType);
  const alerts = generateCashFlowAlerts(metrics, workingCapitalAnalysis, businessType);
  
  return {
    metrics,
    forecast,
    workingCapitalAnalysis,
    insights,
    alerts,
  };
}

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

export function formatCashFlowMetric(value: number, type: 'currency' | 'days' | 'ratio' | 'percentage'): string {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    case 'days':
      return `${Math.round(value)} hari`;
    case 'ratio':
      return `${value.toFixed(1)}x`;
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`;
    default:
      return value.toString();
  }
}

export function getCashFlowHealthScore(
  metrics: CashFlowMetrics,
  businessType: BusinessType
): { score: number; grade: 'A' | 'B' | 'C' | 'D' | 'F'; description: string } {
  const benchmark = INDUSTRY_BENCHMARKS[businessType];
  let score = 0;
  
  // Cash runway score (40%)
  if (metrics.cashRunway >= benchmark.optimalCashRunway) {
    score += 40;
  } else if (metrics.cashRunway >= benchmark.minCashRunway) {
    score += 30;
  } else if (metrics.cashRunway >= 15) {
    score += 20;
  } else {
    score += 10;
  }
  
  // Free cash flow score (30%)
  if (metrics.freeCashFlow > 0) {
    score += 30;
  } else if (metrics.freeCashFlow > -1000000) {
    score += 15;
  }
  
  // Cash conversion cycle score (20%)
  if (metrics.cashConversionCycle <= benchmark.cashConversionCycle) {
    score += 20;
  } else if (metrics.cashConversionCycle <= benchmark.cashConversionCycle * 1.2) {
    score += 15;
  } else {
    score += 10;
  }
  
  // Operating cash flow score (10%)
  if (metrics.operatingCashFlow > 0) {
    score += 10;
  } else if (metrics.operatingCashFlow > -500000) {
    score += 5;
  }
  
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  let description: string;
  
  if (score >= 90) {
    grade = 'A';
    description = 'Kondisi cash flow sangat sehat';
  } else if (score >= 80) {
    grade = 'B';
    description = 'Kondisi cash flow baik';
  } else if (score >= 70) {
    grade = 'C';
    description = 'Kondisi cash flow cukup';
  } else if (score >= 60) {
    grade = 'D';
    description = 'Kondisi cash flow perlu perhatian';
  } else {
    grade = 'F';
    description = 'Kondisi cash flow kritis';
  }
  
  return { score, grade, description };
}