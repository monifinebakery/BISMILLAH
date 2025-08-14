// ==============================================
// ENHANCED PROFIT CALCULATIONS
// ==============================================
// Advanced profit analysis calculations and business intelligence

import { 
  RealTimeProfitCalculation, 
  ProfitAnalysis,
  RevenueBreakdown,
  COGSBreakdown,
  OpExBreakdown 
} from '../types/profitAnalysis.types';
import { FinancialTransaction } from '@/components/financial/types/financial';
import { BahanBakuFrontend } from '@/components/warehouse/types';
import { OperationalCost } from '@/components/operational-costs/types';
import { PROFIT_CONSTANTS } from '../constants/profitConstants';

// ==============================================
// ENHANCED CALCULATION INTERFACES
// ==============================================

export interface AdvancedProfitMetrics {
  // Basic Metrics
  grossProfitMargin: number;
  netProfitMargin: number;
  operatingMargin: number;
  ebitdaMargin: number;
  
  // Efficiency Ratios
  revenuePerEmployee: number;
  profitPerEmployee: number;
  assetTurnover: number;
  
  // Cost Analysis
  cogsPercentage: number;
  opexPercentage: number;
  variableCostRatio: number;
  fixedCostRatio: number;
  
  // Trend Analysis
  monthlyGrowthRate: number;
  quarterlyGrowthRate: number;
  seasonalityIndex: number;
  
  // Performance Indicators
  breakEvenPoint: number;
  marginOfSafety: number;
  operatingLeverage: number;
  
  // Quality Metrics
  dataCompleteness: number;
  calculationAccuracy: number;
  confidenceScore: number;
}

export interface ProfitForecast {
  nextMonth: {
    revenue: number;
    profit: number;
    margin: number;
    confidence: number;
  };
  nextQuarter: {
    revenue: number;
    profit: number;
    margin: number;
    confidence: number;
  };
  nextYear: {
    revenue: number;
    profit: number;
    margin: number;
    confidence: number;
  };
  assumptions: string[];
  risks: string[];
  opportunities: string[];
}

export interface ProfitBenchmark {
  industry: {
    averageGrossMargin: number;
    averageNetMargin: number;
    topQuartileMargin: number;
  };
  company: {
    historicalAverage: number;
    bestPeriod: number;
    worstPeriod: number;
  };
  competitive: {
    position: 'excellent' | 'above-average' | 'average' | 'below-average' | 'poor';
    percentile: number;
    gapToLeader: number;
  };
}

export interface CostOptimizationRecommendations {
  immediate: Array<{
    action: string;
    impact: number;
    effort: 'low' | 'medium' | 'high';
    timeframe: string;
    category: 'cogs' | 'opex' | 'revenue';
  }>;
  mediumTerm: Array<{
    action: string;
    impact: number;
    effort: 'low' | 'medium' | 'high';
    timeframe: string;
    category: 'cogs' | 'opex' | 'revenue';
  }>;
  longTerm: Array<{
    action: string;
    impact: number;
    effort: 'low' | 'medium' | 'high';
    timeframe: string;
    category: 'cogs' | 'opex' | 'revenue';
  }>;
}

// ==============================================
// ENHANCED CALCULATION FUNCTIONS
// ==============================================

/**
 * Calculate advanced profit metrics with business intelligence
 */
export const calculateAdvancedProfitMetrics = (
  history: RealTimeProfitCalculation[],
  currentAnalysis: RealTimeProfitCalculation,
  employeeCount: number = 0,
  totalAssets: number = 0
): AdvancedProfitMetrics => {
  
  const revenue = currentAnalysis.revenue_data.total;
  const cogs = currentAnalysis.cogs_data.total;
  const opex = currentAnalysis.opex_data.total;
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - opex;
  
  // Basic Margins
  const grossProfitMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const operatingMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0; // Simplified
  const ebitdaMargin = operatingMargin; // Simplified (no depreciation data)
  
  // Efficiency Ratios
  const revenuePerEmployee = employeeCount > 0 ? revenue / employeeCount : 0;
  const profitPerEmployee = employeeCount > 0 ? netProfit / employeeCount : 0;
  const assetTurnover = totalAssets > 0 ? revenue / totalAssets : 0;
  
  // Cost Analysis
  const cogsPercentage = revenue > 0 ? (cogs / revenue) * 100 : 0;
  const opexPercentage = revenue > 0 ? (opex / revenue) * 100 : 0;
  
  // Separate fixed and variable costs (simplified)
  const operationalCosts = currentAnalysis.opex_data.costs || [];
  const fixedCosts = operationalCosts.filter(c => c.jenis === 'tetap').reduce((sum, c) => sum + (c.jumlah_per_bulan || 0), 0);
  const variableCosts = cogs + operationalCosts.filter(c => c.jenis === 'variabel').reduce((sum, c) => sum + (c.jumlah_per_bulan || 0), 0);
  
  const variableCostRatio = revenue > 0 ? (variableCosts / revenue) * 100 : 0;
  const fixedCostRatio = revenue > 0 ? (fixedCosts / revenue) * 100 : 0;
  
  // Growth Analysis
  const monthlyGrowthRate = calculateGrowthRate(history, 'monthly');
  const quarterlyGrowthRate = calculateGrowthRate(history, 'quarterly');
  const seasonalityIndex = calculateSeasonality(history);
  
  // Business Metrics
  const contributionMargin = revenue - variableCosts;
  const breakEvenPoint = contributionMargin > 0 ? fixedCosts / (contributionMargin / revenue) : 0;
  const marginOfSafety = revenue > breakEvenPoint ? ((revenue - breakEvenPoint) / revenue) * 100 : 0;
  const operatingLeverage = calculateOperatingLeverage(history);
  
  // Quality Assessment
  const dataCompleteness = assessDataCompleteness(currentAnalysis);
  const calculationAccuracy = assessCalculationAccuracy(currentAnalysis);
  const confidenceScore = (dataCompleteness + calculationAccuracy) / 2;
  
  return {
    grossProfitMargin,
    netProfitMargin,
    operatingMargin,
    ebitdaMargin,
    revenuePerEmployee,
    profitPerEmployee,
    assetTurnover,
    cogsPercentage,
    opexPercentage,
    variableCostRatio,
    fixedCostRatio,
    monthlyGrowthRate,
    quarterlyGrowthRate,
    seasonalityIndex,
    breakEvenPoint,
    marginOfSafety,
    operatingLeverage,
    dataCompleteness,
    calculationAccuracy,
    confidenceScore
  };
};

/**
 * Generate profit forecast using multiple methods
 */
export const generateProfitForecast = (
  history: RealTimeProfitCalculation[],
  currentAnalysis: RealTimeProfitCalculation,
  externalFactors?: {
    marketGrowth?: number;
    seasonality?: number;
    competitiveFactors?: number;
  }
): ProfitForecast => {
  
  if (history.length < 3) {
    return {
      nextMonth: { revenue: 0, profit: 0, margin: 0, confidence: 0 },
      nextQuarter: { revenue: 0, profit: 0, margin: 0, confidence: 0 },
      nextYear: { revenue: 0, profit: 0, margin: 0, confidence: 0 },
      assumptions: ['Insufficient historical data for reliable forecast'],
      risks: ['High uncertainty due to limited data'],
      opportunities: ['Establish baseline for future forecasting']
    };
  }
  
  // Multiple forecasting methods
  const trendForecast = calculateTrendForecast(history);
  const seasonalForecast = calculateSeasonalForecast(history);
  const regressionForecast = calculateRegressionForecast(history);
  
  // Weighted average with external factors
  const marketGrowth = externalFactors?.marketGrowth || 0;
  const seasonality = externalFactors?.seasonality || 1;
  const competitive = externalFactors?.competitiveFactors || 1;
  
  // Next Month Forecast
  const nextMonthRevenue = (
    trendForecast.nextMonth * 0.4 +
    seasonalForecast.nextMonth * 0.3 +
    regressionForecast.nextMonth * 0.3
  ) * seasonality * competitive;
  
  const nextMonthProfit = nextMonthRevenue * (currentAnalysis.revenue_data.total > 0 
    ? ((currentAnalysis.revenue_data.total - currentAnalysis.cogs_data.total - currentAnalysis.opex_data.total) / currentAnalysis.revenue_data.total)
    : 0);
  
  const nextMonthMargin = nextMonthRevenue > 0 ? (nextMonthProfit / nextMonthRevenue) * 100 : 0;
  
  // Confidence calculation
  const dataQuality = Math.min(history.length / 12, 1); // More data = higher confidence
  const trendConsistency = calculateTrendConsistency(history);
  const nextMonthConfidence = (dataQuality * 0.5 + trendConsistency * 0.5) * 100;
  
  // Similar calculations for quarter and year (simplified)
  const nextQuarterRevenue = nextMonthRevenue * 3 * (1 + marketGrowth / 100);
  const nextQuarterProfit = nextQuarterRevenue * (nextMonthMargin / 100);
  
  const nextYearRevenue = nextMonthRevenue * 12 * (1 + marketGrowth / 100);
  const nextYearProfit = nextYearRevenue * (nextMonthMargin / 100);
  
  return {
    nextMonth: {
      revenue: nextMonthRevenue,
      profit: nextMonthProfit,
      margin: nextMonthMargin,
      confidence: nextMonthConfidence
    },
    nextQuarter: {
      revenue: nextQuarterRevenue,
      profit: nextQuarterProfit,
      margin: nextMonthMargin,
      confidence: Math.max(nextMonthConfidence - 20, 0)
    },
    nextYear: {
      revenue: nextYearRevenue,
      profit: nextYearProfit,
      margin: nextMonthMargin,
      confidence: Math.max(nextMonthConfidence - 40, 0)
    },
    assumptions: [
      'Historical trends continue',
      'No major market disruptions',
      'Current cost structure maintained',
      `Market growth: ${marketGrowth}%`,
      'Seasonal patterns repeat'
    ],
    risks: [
      'Economic downturn impact',
      'Increased competition',
      'Supply chain disruptions',
      'Cost inflation',
      'Customer behavior changes'
    ],
    opportunities: [
      'Market expansion potential',
      'Operational efficiency gains',
      'New product/service launch',
      'Strategic partnerships',
      'Technology improvements'
    ]
  };
};

/**
 * Generate cost optimization recommendations
 */
export const generateCostOptimizationRecommendations = (
  currentAnalysis: RealTimeProfitCalculation,
  metrics: AdvancedProfitMetrics,
  history: RealTimeProfitCalculation[]
): CostOptimizationRecommendations => {
  
  const recommendations: CostOptimizationRecommendations = {
    immediate: [],
    mediumTerm: [],
    longTerm: []
  };
  
  const revenue = currentAnalysis.revenue_data.total;
  const grossMargin = metrics.grossProfitMargin;
  const netMargin = metrics.netProfitMargin;
  const cogsRatio = metrics.cogsPercentage;
  const opexRatio = metrics.opexPercentage;
  
  // Immediate Actions (1-3 months)
  if (grossMargin < 30) {
    recommendations.immediate.push({
      action: 'Review supplier contracts and negotiate better terms',
      impact: revenue * 0.05, // 5% of revenue potential saving
      effort: 'medium',
      timeframe: '1-2 months',
      category: 'cogs'
    });
  }
  
  if (opexRatio > 40) {
    recommendations.immediate.push({
      action: 'Audit and eliminate unnecessary operational expenses',
      impact: revenue * 0.03,
      effort: 'low',
      timeframe: '2-4 weeks',
      category: 'opex'
    });
  }
  
  if (netMargin < 10) {
    recommendations.immediate.push({
      action: 'Implement pricing strategy review and optimization',
      impact: revenue * 0.07,
      effort: 'medium',
      timeframe: '1-3 months',
      category: 'revenue'
    });
  }
  
  // Medium Term Actions (3-12 months)
  if (cogsRatio > 60) {
    recommendations.mediumTerm.push({
      action: 'Invest in process automation to reduce direct costs',
      impact: revenue * 0.10,
      effort: 'high',
      timeframe: '6-12 months',
      category: 'cogs'
    });
  }
  
  recommendations.mediumTerm.push({
    action: 'Implement activity-based costing for better cost allocation',
    impact: revenue * 0.04,
    effort: 'medium',
    timeframe: '3-6 months',
    category: 'opex'
  });
  
  if (metrics.revenuePerEmployee < revenue / 10) { // Assuming 10 employees baseline
    recommendations.mediumTerm.push({
      action: 'Optimize workforce productivity through training and tools',
      impact: revenue * 0.08,
      effort: 'medium',
      timeframe: '4-8 months',
      category: 'revenue'
    });
  }
  
  // Long Term Actions (1+ years)
  recommendations.longTerm.push({
    action: 'Develop strategic supplier partnerships for cost reduction',
    impact: revenue * 0.15,
    effort: 'high',
    timeframe: '12-24 months',
    category: 'cogs'
  });
  
  recommendations.longTerm.push({
    action: 'Implement comprehensive ERP system for operational efficiency',
    impact: revenue * 0.12,
    effort: 'high',
    timeframe: '18-36 months',
    category: 'opex'
  });
  
  recommendations.longTerm.push({
    action: 'Diversify revenue streams to improve overall margins',
    impact: revenue * 0.20,
    effort: 'high',
    timeframe: '12-36 months',
    category: 'revenue'
  });
  
  return recommendations;
};

/**
 * Perform competitive benchmarking
 */
export const performCompetitiveBenchmarking = (
  currentMetrics: AdvancedProfitMetrics,
  history: RealTimeProfitCalculation[],
  industryData?: {
    averageGrossMargin?: number;
    averageNetMargin?: number;
    topQuartile?: number;
  }
): ProfitBenchmark => {
  
  // Industry benchmarks (default values - in real app, fetch from database)
  const industry = {
    averageGrossMargin: industryData?.averageGrossMargin || 45,
    averageNetMargin: industryData?.averageNetMargin || 15,
    topQuartileMargin: industryData?.topQuartile || 25
  };
  
  // Company historical performance
  const historicalMargins = history.map(h => {
    const revenue = h.revenue_data.total;
    const profit = revenue - h.cogs_data.total - h.opex_data.total;
    return revenue > 0 ? (profit / revenue) * 100 : 0;
  });
  
  const company = {
    historicalAverage: historicalMargins.length > 0 
      ? historicalMargins.reduce((sum, m) => sum + m, 0) / historicalMargins.length 
      : 0,
    bestPeriod: historicalMargins.length > 0 ? Math.max(...historicalMargins) : 0,
    worstPeriod: historicalMargins.length > 0 ? Math.min(...historicalMargins) : 0
  };
  
  // Competitive position
  const currentNetMargin = currentMetrics.netProfitMargin;
  let position: 'excellent' | 'above-average' | 'average' | 'below-average' | 'poor';
  let percentile: number;
  
  if (currentNetMargin >= industry.topQuartileMargin) {
    position = 'excellent';
    percentile = 90;
  } else if (currentNetMargin >= industry.averageNetMargin * 1.2) {
    position = 'above-average';
    percentile = 75;
  } else if (currentNetMargin >= industry.averageNetMargin * 0.8) {
    position = 'average';
    percentile = 50;
  } else if (currentNetMargin >= industry.averageNetMargin * 0.5) {
    position = 'below-average';
    percentile = 25;
  } else {
    position = 'poor';
    percentile = 10;
  }
  
  const gapToLeader = Math.max(0, industry.topQuartileMargin - currentNetMargin);
  
  return {
    industry,
    company,
    competitive: {
      position,
      percentile,
      gapToLeader
    }
  };
};

// ==============================================
// HELPER FUNCTIONS
// ==============================================

const calculateGrowthRate = (history: RealTimeProfitCalculation[], period: 'monthly' | 'quarterly'): number => {
  if (history.length < 2) return 0;
  
  const periods = period === 'monthly' ? 1 : 3;
  const recentPeriods = history.slice(-periods - 1);
  
  if (recentPeriods.length < 2) return 0;
  
  const latest = recentPeriods[recentPeriods.length - 1].revenue_data.total;
  const previous = recentPeriods[0].revenue_data.total;
  
  return previous > 0 ? ((latest - previous) / previous) * 100 : 0;
};

const calculateSeasonality = (history: RealTimeProfitCalculation[]): number => {
  if (history.length < 12) return 1; // No seasonality data
  
  // Simple seasonality calculation based on monthly variance
  const monthlyRevenues = history.map(h => h.revenue_data.total);
  const average = monthlyRevenues.reduce((sum, r) => sum + r, 0) / monthlyRevenues.length;
  const variance = monthlyRevenues.reduce((sum, r) => sum + Math.pow(r - average, 2), 0) / monthlyRevenues.length;
  const standardDeviation = Math.sqrt(variance);
  
  return average > 0 ? standardDeviation / average : 0;
};

const calculateOperatingLeverage = (history: RealTimeProfitCalculation[]): number => {
  if (history.length < 2) return 1;
  
  const latest = history[history.length - 1];
  const previous = history[history.length - 2];
  
  const revenueChange = ((latest.revenue_data.total - previous.revenue_data.total) / previous.revenue_data.total) * 100;
  const profitChange = (((latest.revenue_data.total - latest.cogs_data.total - latest.opex_data.total) - 
                        (previous.revenue_data.total - previous.cogs_data.total - previous.opex_data.total)) / 
                       (previous.revenue_data.total - previous.cogs_data.total - previous.opex_data.total)) * 100;
  
  return revenueChange !== 0 ? profitChange / revenueChange : 1;
};

const assessDataCompleteness = (analysis: RealTimeProfitCalculation): number => {
  let score = 0;
  let maxScore = 0;
  
  // Revenue data
  maxScore += 25;
  if (analysis.revenue_data.total > 0) score += 25;
  
  // COGS data
  maxScore += 25;
  if (analysis.cogs_data.total >= 0) score += 25;
  
  // OpEx data
  maxScore += 25;
  if (analysis.opex_data.total > 0) score += 25;
  
  // Detailed breakdown
  maxScore += 25;
  if (analysis.revenue_data.transactions && analysis.revenue_data.transactions.length > 0) score += 15;
  if (analysis.opex_data.costs && analysis.opex_data.costs.length > 0) score += 10;
  
  return maxScore > 0 ? (score / maxScore) * 100 : 0;
};

const assessCalculationAccuracy = (analysis: RealTimeProfitCalculation): number => {
  let score = 100; // Start with perfect score
  
  // Check for logical inconsistencies
  if (analysis.revenue_data.total < 0) score -= 20;
  if (analysis.cogs_data.total < 0) score -= 15;
  if (analysis.opex_data.total < 0) score -= 15;
  
  // Check proportional reasonableness
  const revenue = analysis.revenue_data.total;
  const cogs = analysis.cogs_data.total;
  const opex = analysis.opex_data.total;
  
  if (revenue > 0) {
    // COGS should typically be less than revenue
    if (cogs > revenue) score -= 25;
    
    // OpEx should be reasonable relative to revenue
    if (opex > revenue * 0.8) score -= 15; // OpEx > 80% of revenue is suspicious
    
    // Total costs shouldn't exceed revenue by too much (some loss is acceptable)
    if ((cogs + opex) > revenue * 1.5) score -= 20;
  }
  
  return Math.max(0, score);
};

const calculateTrendForecast = (history: RealTimeProfitCalculation[]): { nextMonth: number } => {
  if (history.length < 2) return { nextMonth: 0 };
  
  const revenues = history.map(h => h.revenue_data.total);
  const n = revenues.length;
  
  // Simple linear trend
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += revenues[i];
    sumXY += i * revenues[i];
    sumX2 += i * i;
  }
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { nextMonth: slope * n + intercept };
};

const calculateSeasonalForecast = (history: RealTimeProfitCalculation[]): { nextMonth: number } => {
  if (history.length < 12) return { nextMonth: history[history.length - 1]?.revenue_data.total || 0 };
  
  // Use same month from previous year as baseline
  const currentMonth = new Date().getMonth();
  const lastYearSameMonth = history.find(h => {
    const period = new Date(h.period + '-01');
    return period.getMonth() === currentMonth;
  });
  
  if (!lastYearSameMonth) return { nextMonth: history[history.length - 1].revenue_data.total };
  
  // Apply growth trend
  const recentGrowth = calculateGrowthRate(history, 'monthly');
  return { nextMonth: lastYearSameMonth.revenue_data.total * (1 + recentGrowth / 100) };
};

const calculateRegressionForecast = (history: RealTimeProfitCalculation[]): { nextMonth: number } => {
  if (history.length < 3) return { nextMonth: 0 };
  
  // Simple moving average with trend adjustment
  const recent3 = history.slice(-3);
  const average = recent3.reduce((sum, h) => sum + h.revenue_data.total, 0) / 3;
  
  // Calculate trend from last 3 periods
  const trend = (recent3[2].revenue_data.total - recent3[0].revenue_data.total) / 2;
  
  return { nextMonth: average + trend };
};

const calculateTrendConsistency = (history: RealTimeProfitCalculation[]): number => {
  if (history.length < 3) return 0;
  
  const revenues = history.map(h => h.revenue_data.total);
  const changes = [];
  
  for (let i = 1; i < revenues.length; i++) {
    if (revenues[i - 1] !== 0) {
      changes.push((revenues[i] - revenues[i - 1]) / revenues[i - 1]);
    }
  }
  
  if (changes.length === 0) return 0;
  
  // Calculate variance of changes (lower variance = higher consistency)
  const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
  const variance = changes.reduce((sum, c) => sum + Math.pow(c - avgChange, 2), 0) / changes.length;
  
  // Convert to consistency score (0-1, where 1 is most consistent)
  return Math.max(0, 1 - Math.sqrt(variance));
};

/**
 * Calculate profit volatility and risk metrics
 */
export const calculateProfitRiskMetrics = (history: RealTimeProfitCalculation[]) => {
  if (history.length < 3) {
    return {
      volatility: 0,
      valueAtRisk: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      consistencyScore: 0
    };
  }
  
  const profits = history.map(h => {
    const revenue = h.revenue_data.total;
    const costs = h.cogs_data.total + h.opex_data.total;
    return revenue - costs;
  });
  
  // Calculate volatility (standard deviation of profits)
  const avgProfit = profits.reduce((sum, p) => sum + p, 0) / profits.length;
  const variance = profits.reduce((sum, p) => sum + Math.pow(p - avgProfit, 2), 0) / profits.length;
  const volatility = Math.sqrt(variance);
  
  // Value at Risk (5th percentile)
  const sortedProfits = [...profits].sort((a, b) => a - b);
  const varIndex = Math.floor(sortedProfits.length * 0.05);
  const valueAtRisk = sortedProfits[varIndex] || 0;
  
  // Maximum Drawdown
  let peak = profits[0];
  let maxDrawdown = 0;
  
  for (const profit of profits) {
    if (profit > peak) {
      peak = profit;
    } else {
      const drawdown = (peak - profit) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  // Sharpe Ratio (simplified - assuming risk-free rate of 5%)
  const riskFreeRate = avgProfit * 0.05; // 5% annually
  const sharpeRatio = volatility > 0 ? (avgProfit - riskFreeRate) / volatility : 0;
  
  // Consistency Score (percentage of profitable periods)
  const profitablePeriods = profits.filter(p => p > 0).length;
  const consistencyScore = (profitablePeriods / profits.length) * 100;
  
  return {
    volatility,
    valueAtRisk,
    maxDrawdown: maxDrawdown * 100, // Convert to percentage
    sharpeRatio,
    consistencyScore
  };
};

/**
 * Generate executive summary insights
 */
export const generateExecutiveSummary = (
  currentAnalysis: RealTimeProfitCalculation,
  metrics: AdvancedProfitMetrics,
  forecast: ProfitForecast,
  benchmark: ProfitBenchmark
) => {
  const insights = [];
  const alerts = [];
  const opportunities = [];
  
  const revenue = currentAnalysis.revenue_data.total;
  const netMargin = metrics.netProfitMargin;
  const grossMargin = metrics.grossProfitMargin;
  
  // Performance Insights
  if (netMargin >= 20) {
    insights.push(`Excellent profitability with ${netMargin.toFixed(1)}% net margin`);
  } else if (netMargin >= 10) {
    insights.push(`Healthy profitability at ${netMargin.toFixed(1)}% net margin`);
  } else if (netMargin >= 5) {
    insights.push(`Moderate profitability at ${netMargin.toFixed(1)}% net margin`);
  } else {
    alerts.push(`Low profitability: ${netMargin.toFixed(1)}% net margin needs improvement`);
  }
  
  // Competitive Position
  if (benchmark.competitive.position === 'excellent') {
    insights.push(`Top-tier performance - ${benchmark.competitive.percentile}th percentile in industry`);
  } else if (benchmark.competitive.position === 'poor') {
    alerts.push(`Below industry standards - ${benchmark.competitive.gapToLeader.toFixed(1)}% gap to leaders`);
  }
  
  // Growth Trajectory
  if (metrics.monthlyGrowthRate > 10) {
    insights.push(`Strong growth momentum at ${metrics.monthlyGrowthRate.toFixed(1)}% monthly`);
  } else if (metrics.monthlyGrowthRate < -5) {
    alerts.push(`Revenue declining at ${Math.abs(metrics.monthlyGrowthRate).toFixed(1)}% monthly`);
  }
  
  // Cost Structure
  if (metrics.cogsPercentage > 70) {
    alerts.push(`High COGS at ${metrics.cogsPercentage.toFixed(1)}% - review supplier costs`);
  }
  
  if (metrics.opexPercentage > 40) {
    alerts.push(`High operational costs at ${metrics.opexPercentage.toFixed(1)}% - optimize operations`);
  }
  
  // Opportunities
  if (grossMargin > 40 && netMargin < 15) {
    opportunities.push('Strong gross margins suggest potential for operational efficiency gains');
  }
  
  if (metrics.breakEvenPoint > 0 && revenue > metrics.breakEvenPoint * 1.5) {
    opportunities.push('Strong margin of safety allows for strategic investments');
  }
  
  if (forecast.nextMonth.confidence > 70) {
    opportunities.push('Predictable revenue patterns support strategic planning');
  }
  
  return {
    insights,
    alerts,
    opportunities,
    keyMetrics: {
      currentRevenue: revenue,
      netMargin,
      grossMargin,
      monthlyGrowth: metrics.monthlyGrowthRate,
      competitivePosition: benchmark.competitive.position,
      forecastConfidence: forecast.nextMonth.confidence
    }
  };
};

// ==============================================
// EXPORTS
// ==============================================

export {
  calculateAdvancedProfitMetrics,
  generateProfitForecast,
  generateCostOptimizationRecommendations,
  performCompetitiveBenchmarking,
  calculateProfitRiskMetrics,
  generateExecutiveSummary
};

export default {
  calculateAdvancedProfitMetrics,
  generateProfitForecast,
  generateCostOptimizationRecommendations,
  performCompetitiveBenchmarking,
  calculateProfitRiskMetrics,
  generateExecutiveSummary
};