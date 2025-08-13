// src/components/profitAnalysis/tabs/PerbandinganTab/hooks/useImprovementPotential.ts

import { useMemo } from 'react';
import { ProfitAnalysisResult, ImprovementPotential } from '../types';
import { calculateImprovementPotential } from '../utils';

export const useImprovementPotential = (profitData: ProfitAnalysisResult) => {
  const improvementPotential = useMemo<ImprovementPotential>(() => 
    calculateImprovementPotential(profitData),
    [profitData]
  );

  const totalImprovementPotential = useMemo(() => 
    improvementPotential.materialOptimization +
    improvementPotential.laborEfficiency +
    improvementPotential.opexReduction10 +
    improvementPotential.dataAccuracyGain,
    [improvementPotential]
  );

  const revenueImprovementPercentage = useMemo(() => 
    (totalImprovementPotential / profitData.profitMarginData.revenue) * 100,
    [totalImprovementPotential, profitData.profitMarginData.revenue]
  );

  const criticalInsights = useMemo(() => 
    profitData.insights.filter(insight => 
      insight.impact === 'high' || insight.impact === 'medium'
    ),
    [profitData.insights]
  );

  return {
    improvementPotential,
    totalImprovementPotential,
    revenueImprovementPercentage,
    criticalInsights
  };
};