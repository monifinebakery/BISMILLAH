// src/components/profitAnalysis/tabs/PerbandinganTab/hooks/useBenchmarkData.ts

import { useMemo } from 'react';
import { ProfitAnalysisResult } from '../types';
import { getMarginStatus, getRatioStatus } from '../utils';
import { PROFIT_MARGIN_THRESHOLDS, INDUSTRY_TARGETS } from '../utils';

export const useBenchmarkData = (profitData: ProfitAnalysisResult) => {
  const grossMarginStatus = useMemo(() => 
    getMarginStatus(profitData.profitMarginData.grossMargin, 'gross'),
    [profitData.profitMarginData.grossMargin]
  );

  const netMarginStatus = useMemo(() => 
    getMarginStatus(profitData.profitMarginData.netMargin, 'net'),
    [profitData.profitMarginData.netMargin]
  );

  const ratioStatuses = useMemo(() => {
    const materialRatio = (profitData.cogsBreakdown.totalMaterialCost / profitData.profitMarginData.revenue) * 100;
    const laborRatio = (profitData.cogsBreakdown.totalDirectLaborCost / profitData.profitMarginData.revenue) * 100;
    const cogsRatio = (profitData.cogsBreakdown.totalCOGS / profitData.profitMarginData.revenue) * 100;
    const opexRatio = (profitData.opexBreakdown.totalOPEX / profitData.profitMarginData.revenue) * 100;

    return {
      material: getRatioStatus(materialRatio, INDUSTRY_TARGETS.materialCost),
      labor: getRatioStatus(laborRatio, INDUSTRY_TARGETS.laborCost),
      cogs: getRatioStatus(cogsRatio, INDUSTRY_TARGETS.totalCOGS),
      opex: getRatioStatus(opexRatio, INDUSTRY_TARGETS.opex)
    };
  }, [profitData]);

  const materialEfficiency = useMemo(() => {
    return profitData.cogsBreakdown.dataSource === 'actual' ? 90 : 
           profitData.cogsBreakdown.dataSource === 'mixed' ? 70 : 50;
  }, [profitData.cogsBreakdown.dataSource]);

  return {
    grossMarginStatus,
    netMarginStatus,
    ratioStatuses,
    materialEfficiency,
    industryBenchmarks: PROFIT_MARGIN_THRESHOLDS,
    industryTargets: INDUSTRY_TARGETS
  };
};