/ src/components/profitAnalysis/tabs/PerbandinganTab/utils/calculations.ts

import { 
  CashVsRealComparison, 
  ComparisonMetrics, 
  ImprovementPotential,
  CompetitiveAnalysis,
  ProfitAnalysisResult 
} from '../types';
import { IMPROVEMENT_RATES } from './constants';

export const calculateCashVsReal = (profitData: ProfitAnalysisResult): CashVsRealComparison => {
  const { profitMarginData, cogsBreakdown } = profitData;
  
  const cashFlow = profitMarginData.revenue - (profitMarginData.cogs + profitMarginData.opex);
  const realProfit = profitMarginData.netProfit;
  const difference = Math.abs(realProfit - cashFlow);
  const isRealProfitHigher = realProfit > cashFlow;
  
  const accuracyScore = cogsBreakdown.dataSource === 'actual' ? 95 : 
                       cogsBreakdown.dataSource === 'mixed' ? 75 : 50;
  
  return {
    cashFlow,
    realProfit,
    difference,
    isRealProfitHigher,
    accuracyScore,
    dataSource: cogsBreakdown.dataSource
  };
};

export const calculateCompetitiveAnalysis = (profitData: ProfitAnalysisResult): CompetitiveAnalysis => {
  const yourCompany: ComparisonMetrics = {
    grossMargin: profitData.profitMarginData.grossMargin,
    netMargin: profitData.profitMarginData.netMargin,
    cogsRatio: (profitData.cogsBreakdown.totalCOGS / profitData.profitMarginData.revenue) * 100,
    opexRatio: (profitData.opexBreakdown.totalOPEX / profitData.profitMarginData.revenue) * 100,
    materialRatio: (profitData.cogsBreakdown.totalMaterialCost / profitData.profitMarginData.revenue) * 100,
    laborRatio: (profitData.cogsBreakdown.totalDirectLaborCost / profitData.profitMarginData.revenue) * 100,
    materialEfficiency: profitData.cogsBreakdown.dataSource === 'actual' ? 90 : 
                       profitData.cogsBreakdown.dataSource === 'mixed' ? 70 : 50
  };

  const industryAverage: ComparisonMetrics = {
    grossMargin: 28,
    netMargin: 12,
    cogsRatio: 65,
    opexRatio: 18,
    materialRatio: 40,
    laborRatio: 15,
    materialEfficiency: 60
  };

  const topPerformers: ComparisonMetrics = {
    grossMargin: 45,
    netMargin: 20,
    cogsRatio: 55,
    opexRatio: 15,
    materialRatio: 30,
    laborRatio: 12,
    materialEfficiency: 95
  };

  return { yourCompany, industryAverage, topPerformers };
};

export const calculateImprovementPotential = (profitData: ProfitAnalysisResult): ImprovementPotential => {
  const { profitMarginData, cogsBreakdown, opexBreakdown } = profitData;
  
  return {
    cogsReduction10: cogsBreakdown.totalCOGS * IMPROVEMENT_RATES.cogsReduction,
    opexReduction10: opexBreakdown.totalOPEX * IMPROVEMENT_RATES.opexReduction,
    materialOptimization: cogsBreakdown.totalMaterialCost * IMPROVEMENT_RATES.materialOptimization,
    laborEfficiency: cogsBreakdown.totalDirectLaborCost * IMPROVEMENT_RATES.laborEfficiency,
    dataAccuracyGain: profitData.cogsBreakdown.dataSource !== 'actual' ? 
      profitMarginData.revenue * IMPROVEMENT_RATES.dataAccuracyGain : 0
  };
};