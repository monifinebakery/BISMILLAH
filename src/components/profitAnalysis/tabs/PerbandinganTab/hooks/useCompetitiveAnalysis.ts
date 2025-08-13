// src/components/profitAnalysis/tabs/PerbandinganTab/hooks/useCompetitiveAnalysis.ts

import { useMemo } from 'react';
import { ProfitAnalysisResult, CompetitiveAnalysis, CompetitiveRow } from '../types';
import { calculateCompetitiveAnalysis } from '../utils';

export const useCompetitiveAnalysis = (profitData: ProfitAnalysisResult) => {
  const competitiveAnalysis = useMemo<CompetitiveAnalysis>(() => 
    calculateCompetitiveAnalysis(profitData),
    [profitData]
  );

  const competitiveRows = useMemo<CompetitiveRow[]>(() => [
    { 
      key: 'Gross Margin', 
      yours: competitiveAnalysis.yourCompany.grossMargin, 
      industry: competitiveAnalysis.industryAverage.grossMargin, 
      top: competitiveAnalysis.topPerformers.grossMargin, 
      unit: '%' 
    },
    { 
      key: 'Net Margin', 
      yours: competitiveAnalysis.yourCompany.netMargin, 
      industry: competitiveAnalysis.industryAverage.netMargin, 
      top: competitiveAnalysis.topPerformers.netMargin, 
      unit: '%' 
    },
    { 
      key: 'Material Ratio', 
      yours: competitiveAnalysis.yourCompany.materialRatio, 
      industry: competitiveAnalysis.industryAverage.materialRatio, 
      top: competitiveAnalysis.topPerformers.materialRatio, 
      unit: '%' 
    },
    { 
      key: 'Labor Ratio', 
      yours: competitiveAnalysis.yourCompany.laborRatio, 
      industry: competitiveAnalysis.industryAverage.laborRatio, 
      top: competitiveAnalysis.topPerformers.laborRatio, 
      unit: '%' 
    },
    { 
      key: 'Material Efficiency', 
      yours: competitiveAnalysis.yourCompany.materialEfficiency, 
      industry: competitiveAnalysis.industryAverage.materialEfficiency, 
      top: competitiveAnalysis.topPerformers.materialEfficiency, 
      unit: '%' 
    }
  ], [competitiveAnalysis]);

  const strengths = useMemo(() => {
    const items = [];
    if (competitiveAnalysis.yourCompany.grossMargin >= competitiveAnalysis.industryAverage.grossMargin) {
      items.push('Gross margin di atas rata-rata industri');
    }
    if (competitiveAnalysis.yourCompany.materialEfficiency >= competitiveAnalysis.industryAverage.materialEfficiency) {
      items.push('Material efficiency baik');
    }
    if (profitData.cogsBreakdown.dataSource === 'actual') {
      items.push('Data tracking material aktual');
    }
    if (competitiveAnalysis.yourCompany.cogsRatio <= competitiveAnalysis.industryAverage.cogsRatio) {
      items.push('COGS ratio terkontrol');
    }
    return items;
  }, [competitiveAnalysis, profitData]);

  const improvements = useMemo(() => {
    const items = [];
    if (competitiveAnalysis.yourCompany.netMargin < competitiveAnalysis.industryAverage.netMargin) {
      items.push('Net margin masih di bawah industri');
    }
    if (competitiveAnalysis.yourCompany.materialRatio > competitiveAnalysis.industryAverage.materialRatio) {
      items.push('Material cost ratio tinggi');
    }
    if (profitData.cogsBreakdown.dataSource !== 'actual') {
      items.push('Perlu material usage tracking');
    }
    if (competitiveAnalysis.yourCompany.opexRatio > competitiveAnalysis.industryAverage.opexRatio) {
      items.push('OPEX perlu optimisasi');
    }
    return items;
  }, [competitiveAnalysis, profitData]);

  const shortTermTargets = useMemo(() => [
    `Capai net margin ${competitiveAnalysis.industryAverage.netMargin}%`,
    `Reduksi material cost ke ${competitiveAnalysis.topPerformers.materialRatio}%`,
    'Tingkatkan material efficiency ke 90%+',
    `Optimisasi OPEX ke ${competitiveAnalysis.topPerformers.opexRatio}%`
  ], [competitiveAnalysis]);

  return {
    competitiveAnalysis,
    competitiveRows,
    strengths,
    improvements,
    shortTermTargets
  };
};