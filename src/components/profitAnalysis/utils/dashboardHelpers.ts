// src/components/profitAnalysis/utils/dashboardHelpers.ts

import { calculateMargins } from './profitCalculations';

// ==============================================
// DATA VALIDATION HELPERS
// ==============================================

/**
 * Validate data before forecast generation
 */
export const validateForecastData = (currentAnalysis: any) => {
  const revenue = currentAnalysis?.revenue_data?.total || 0;
  const cogs = currentAnalysis?.cogs_data?.total || 0;
  const opex = currentAnalysis?.opex_data?.total || 0;
  
  const issues = [];
  
  // Basic validation
  if (revenue <= 0) issues.push("Revenue harus lebih besar dari 0");
  if (cogs < 0) issues.push("COGS tidak boleh negatif");
  if (opex < 0) issues.push("OPEX tidak boleh negatif");
  
  // More flexible ratio validation for small F&B businesses and startups
  if (cogs > revenue * 2.0) issues.push("COGS terlalu tinggi dibanding revenue");
  if (opex > revenue * 3.0) issues.push("OPEX terlalu tinggi dibanding revenue");
  
  // Calculate margin for validation
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - opex;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  
  // More realistic margin warnings for F&B businesses
  if (netMargin < -200) issues.push("Margin negatif ekstrem terdeteksi");
  if (netMargin > 95) issues.push("Margin terlalu tinggi, periksa data");
  
  return {
    isValid: issues.length === 0,
    issues,
    sanitizedData: {
      revenue: Math.max(0, revenue),
      cogs: Math.max(0, Math.min(cogs, revenue * 1.8)), // COGS max 180% dari revenue (untuk startup)
      opex: Math.max(0, Math.min(opex, revenue * 2.5))  // OPEX max 250% dari revenue (untuk startup)
    },
    metrics: {
      grossProfit,
      netProfit,
      netMargin,
      grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0
    }
  };
};

// ==============================================
// FORECAST HELPERS
// ==============================================

/**
 * Generate forecast based on historical data
 */
export const generateForecastHelper = (profitHistory: any[], currentAnalysis: any) => {
  if (!currentAnalysis?.revenue_data?.total || !profitHistory?.length || profitHistory.length < 3) {
    return null;
  }
  
  try {
    // Validate data first
    const validation = validateForecastData(currentAnalysis);
    if (!validation.isValid) {
      console.warn('Data validation issues:', validation.issues);
      // Use sanitized data
      currentAnalysis = {
        ...currentAnalysis,
        revenue_data: { total: validation.sanitizedData.revenue },
        cogs_data: { total: validation.sanitizedData.cogs },
        opex_data: { total: validation.sanitizedData.opex }
      };
    }
    
    const revenue = currentAnalysis.revenue_data.total || 0;
    const cogs = currentAnalysis.cogs_data?.total || 0;
    const opex = currentAnalysis.opex_data?.total || 0;
    
    // Calculate actual profit and margins
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - opex;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    
    // Analyze trends from history (take last 3-6 periods)
    const recentHistory = profitHistory.slice(-6);
    let averageGrowthRate = 0;
    const cogsPercentages: number[] = [];
    const opexPercentages: number[] = [];
    
    if (recentHistory.length >= 2) {
      const growthRates = [];
      
      for (let i = 1; i < recentHistory.length; i++) {
        const prevRevenue = recentHistory[i-1].revenue_data?.total || 0;
        const currRevenue = recentHistory[i].revenue_data?.total || 0;
        
        if (prevRevenue > 0 && currRevenue > 0) {
          const growthRate = ((currRevenue - prevRevenue) / prevRevenue) * 100;
          growthRates.push(growthRate);
          
          // Calculate margin for this period
          const periodCogs = recentHistory[i].cogs_data?.total || 0;
          const periodOpex = recentHistory[i].opex_data?.total || 0;
          cogsPercentages.push(currRevenue > 0 ? periodCogs / currRevenue : 0);
          opexPercentages.push(currRevenue > 0 ? periodOpex / currRevenue : 0);
        }
      }

      // Average growth and margin
      if (growthRates.length > 0) {
        averageGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
      }
    }
    
    // Limit growth to be realistic (-20% to +50% per month)
    const monthlyGrowthRate = Math.max(-20, Math.min(50, averageGrowthRate)) / 100;
    
    // Predict revenue based on trends
    const nextMonthRevenue = revenue * (1 + monthlyGrowthRate);
    const nextQuarterRevenue = revenue * Math.pow(1 + monthlyGrowthRate, 3);
    const nextYearRevenue = revenue * Math.pow(1 + monthlyGrowthRate, 12);
    
    // Assume COGS and OPEX as percentage of revenue (based on historical averages)
    let cogsPercentage = revenue > 0 ? (cogs / revenue) : 0.6; // default 60%
    let opexPercentage = revenue > 0 ? (opex / revenue) : 0.25; // default 25%

    if (cogsPercentages.length > 0) {
      cogsPercentage = cogsPercentages.reduce((sum, val) => sum + val, 0) / cogsPercentages.length;
    }

    if (opexPercentages.length > 0) {
      opexPercentage = opexPercentages.reduce((sum, val) => sum + val, 0) / opexPercentages.length;
    }
    
    // Calculate predicted profit
    const calculatePredictedProfit = (predictedRevenue: number) => {
      const predictedCogs = predictedRevenue * cogsPercentage;
      const predictedOpex = predictedRevenue * opexPercentage;
      const predictedNetProfit = predictedRevenue - predictedCogs - predictedOpex;
      const predictedMargin = predictedRevenue > 0 ? (predictedNetProfit / predictedRevenue) * 100 : 0;
      
      return {
        profit: predictedNetProfit,
        margin: predictedMargin
      };
    };
    
    const nextMonth = calculatePredictedProfit(nextMonthRevenue);
    const nextQuarter = calculatePredictedProfit(nextQuarterRevenue);
    const nextYear = calculatePredictedProfit(nextYearRevenue);
    
    // Calculate confidence based on historical data consistency
    const calculateConfidence = (periodsAhead: number) => {
      const baseConfidence = 90;
      const historyPenalty = Math.max(0, (6 - recentHistory.length) * 10);
      const timeDecay = periodsAhead * 5; // confidence decreases over time
      const volatilityPenalty = Math.abs(averageGrowthRate) > 10 ? 15 : 0;
      
      return Math.max(30, baseConfidence - historyPenalty - timeDecay - volatilityPenalty);
    };
    
    return {
      nextMonth: {
        profit: nextMonth.profit,
        margin: nextMonth.margin,
        confidence: calculateConfidence(1),
      },
      nextQuarter: {
        profit: nextQuarter.profit,
        margin: nextQuarter.margin,
        confidence: calculateConfidence(3),
      },
      nextYear: {
        profit: nextYear.profit,
        margin: nextYear.margin,
        confidence: calculateConfidence(12),
      },
      // Additional info for debugging
      metadata: {
        currentRevenue: revenue,
        currentNetProfit: netProfit,
        currentMargin: netMargin,
        averageGrowthRate: averageGrowthRate,
        cogsPercentage: cogsPercentage * 100,
        opexPercentage: opexPercentage * 100,
        historyLength: recentHistory.length,
        validationIssues: validation.issues
      }
    };
  } catch (error) {
    console.error('Error in generateForecastHelper:', error);
    return null;
  }
};

// ==============================================
// ADVANCED METRICS HELPERS
// ==============================================

/**
 * Calculate rolling averages for profit analysis
 */
export const calculateRollingAverages = (profitHistory: any[], periods: number) => {
  if (!profitHistory || profitHistory.length < periods) {
    return { revenueAverage: 0, profitAverage: 0, marginAverage: 0, volatility: 0 };
  }

  const recentPeriods = profitHistory.slice(-periods);
  const revenues = recentPeriods.map(p => p.revenue_data?.total || 0);
  const profits = recentPeriods.map(p => {
    const revenue = p.revenue_data?.total || 0;
    const cogs = p.cogs_data?.total || 0;
    const opex = p.opex_data?.total || 0;
    return revenue - cogs - opex;
  });
  const margins = profits.map((profit, i) => revenues[i] > 0 ? (profit / revenues[i]) * 100 : 0);

  const revenueAverage = revenues.reduce((sum, val) => sum + val, 0) / revenues.length;
  const profitAverage = profits.reduce((sum, val) => sum + val, 0) / profits.length;
  const marginAverage = margins.reduce((sum, val) => sum + val, 0) / margins.length;

  // Calculate volatility (standard deviation of margins)
  const marginVariance = margins.reduce((sum, margin) => sum + Math.pow(margin - marginAverage, 2), 0) / margins.length;
  const volatility = Math.sqrt(marginVariance);

  return { revenueAverage, profitAverage, marginAverage, volatility };
};

/**
 * Validate data quality and return confidence score
 */
export const validateDataQuality = (currentAnalysis: any) => {
  if (!currentAnalysis) return { score: 0, issues: ['No data available'] };

  const issues = [];
  let score = 100;

  // Check for missing data
  if (!currentAnalysis.revenue_data?.total) {
    issues.push('Missing revenue data');
    score -= 30;
  }
  if (!currentAnalysis.cogs_data?.total) {
    issues.push('Missing COGS data');
    score -= 20;
  }
  if (!currentAnalysis.opex_data?.total) {
    issues.push('Missing OPEX data');
    score -= 20;
  }

  // Check for data consistency
  const revenue = currentAnalysis.revenue_data?.total || 0;
  const cogs = currentAnalysis.cogs_data?.total || 0;
  const opex = currentAnalysis.opex_data?.total || 0;

  if (cogs > revenue) {
    issues.push('COGS exceeds revenue');
    score -= 25;
  }
  if (opex > revenue) {
    issues.push('OPEX exceeds revenue');
    score -= 15;
  }
  if (revenue < 0 || cogs < 0 || opex < 0) {
    issues.push('Negative values detected');
    score -= 20;
  }

  return { score: Math.max(0, score), issues };
};

/**
 * Calculate advanced profit metrics
 */
export const calculateAdvancedMetricsHelper = (profitHistory: any[], currentAnalysis: any) => {
  if (!currentAnalysis?.revenue_data?.total) return null;
  
  try {
    const revenue = currentAnalysis.revenue_data.total || 0;
    const cogs = currentAnalysis.cogs_data?.total || 0;
    const opex = currentAnalysis.opex_data?.total || 0;
    
    const margins = calculateMargins(revenue, cogs, opex);
    const rollingAverages = profitHistory?.length > 0 ? 
      calculateRollingAverages(profitHistory, 3) : 
      { revenueAverage: 0, profitAverage: 0, marginAverage: 0, volatility: 0 };
    
    return {
      grossProfitMargin: margins.grossMargin || 0,
      netProfitMargin: margins.netMargin || 0,
      monthlyGrowthRate: rollingAverages.marginAverage || 0,
      marginOfSafety: 0,
      cogsPercentage: margins.cogsPercentage || 0,
      opexPercentage: margins.opexPercentage || 0,
      confidenceScore: validateDataQuality(currentAnalysis)?.score || 0,
      operatingLeverage: revenue > 0 ? (margins.grossProfit / revenue) * 100 : 0,
    };
  } catch (error) {
    console.error('Error in calculateAdvancedMetricsHelper:', error);
    return null;
  }
};

// ==============================================
// BENCHMARKING HELPERS
// ==============================================

/**
 * Perform competitive benchmark analysis
 */
export const performBenchmarkHelper = (advancedMetrics: any) => {
  if (!advancedMetrics?.netProfitMargin) return null;
  
  try {
    const industryAverages = {
      averageNetMargin: 15,
      topQuartileMargin: 25,
    };
    
    const currentNetMargin = advancedMetrics.netProfitMargin;
    let percentile = 50;
    
    if (currentNetMargin >= industryAverages.topQuartileMargin) percentile = 90;
    else if (currentNetMargin >= industryAverages.averageNetMargin) percentile = 75;
    else if (currentNetMargin >= industryAverages.averageNetMargin * 0.7) percentile = 50;
    else percentile = 25;
    
    let position = 'kurang';
    if (percentile >= 90) position = 'sangat baik';
    else if (percentile >= 75) position = 'baik';
    else if (percentile >= 50) position = 'rata-rata';
    
    return {
      industry: industryAverages,
      competitive: {
        percentile,
        position,
        gapToLeader: Math.max(0, industryAverages.topQuartileMargin - currentNetMargin),
      },
    };
  } catch (error) {
    console.error('Error in performBenchmarkHelper:', error);
    return null;
  }
};

// ==============================================
// EXECUTIVE SUMMARY HELPERS
// ==============================================

/**
 * Generate executive insights based on profit analysis
 */
export const generateExecutiveInsights = (currentAnalysis: any) => {
  if (!currentAnalysis) return null;

  const revenue = currentAnalysis.revenue_data?.total || 0;
  const cogs = currentAnalysis.cogs_data?.total || 0;
  const opex = currentAnalysis.opex_data?.total || 0;
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - opex;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const cogsPercentage = revenue > 0 ? (cogs / revenue) * 100 : 0;

  const keyHighlights = [];
  const criticalIssues = [];
  const opportunities = [];

  // Key highlights
  if (netProfit > 0) {
    keyHighlights.push(`Bisnis menguntungkan dengan margin ${netMargin.toFixed(1)}%`);
  }
  if (cogsPercentage < 30) {
    keyHighlights.push('Efisiensi biaya bahan baku sangat baik');
  }
  if (netMargin > 20) {
    keyHighlights.push('Margin profit di atas rata-rata industri');
  }

  // Critical issues
  if (netProfit < 0) {
    criticalIssues.push('Bisnis mengalami kerugian - perlu tindakan segera');
  }
  if (cogsPercentage > 60) {
    criticalIssues.push('Biaya bahan baku terlalu tinggi - margin tertekan');
  }
  if (netMargin < 5 && netProfit > 0) {
    criticalIssues.push('Margin sangat tipis - rentan terhadap fluktuasi biaya');
  }

  // Opportunities
  if (cogsPercentage > 40 && cogsPercentage < 60) {
    opportunities.push('Optimasi supplier dan negosiasi harga bahan baku');
  }
  if (netMargin > 10 && netMargin < 20) {
    opportunities.push('Potensi ekspansi dengan margin yang sehat');
  }
  if (revenue > 0) {
    opportunities.push('Analisis produk terlaris untuk fokus pemasaran');
  }

  return {
    keyHighlights,
    criticalIssues,
    opportunities
  };
};

/**
 * Generate executive summary helper
 */
export const generateExecutiveSummaryHelper = (currentAnalysis: any, advancedMetrics: any) => {
  if (!currentAnalysis || !advancedMetrics) return null;
  
  try {
    const executiveInsights = generateExecutiveInsights(currentAnalysis);
    return {
      insights: executiveInsights?.keyHighlights || [],
      alerts: executiveInsights?.criticalIssues || [],
      opportunities: executiveInsights?.opportunities || [],
    };
  } catch (error) {
    console.error('Error in generateExecutiveSummaryHelper:', error);
    return {
      insights: [],
      alerts: [],
      opportunities: [],
    };
  }
};

// ==============================================
// UTILITY HELPERS
// ==============================================

/**
 * Find previous analysis for comparison
 */
export const findPreviousAnalysis = (currentPeriod: string, profitHistory: any[]) => {
  if (!currentPeriod || !profitHistory?.length) return null;
  
  try {
    const [year, month] = currentPeriod.split('-');
    const currentDate = new Date(parseInt(year), parseInt(month) - 1);
    const previousDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    const previousPeriod = `${previousDate.getFullYear()}-${(previousDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;
    return profitHistory.find((h) => h.period === previousPeriod) || null;
  } catch (error) {
    console.error('Error finding previous analysis:', error);
    return null;
  }
};
