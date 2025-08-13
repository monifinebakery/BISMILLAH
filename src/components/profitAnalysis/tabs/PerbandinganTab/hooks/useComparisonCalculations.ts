// src/components/profitAnalysis/tabs/PerbandinganTab/hooks/useComparisonCalculations.ts

import { useMemo } from 'react';
import { ProfitAnalysisResult, CashVsRealComparison } from '../types';
import { calculateCashVsReal } from '../utils';

export const useComparisonCalculations = (profitData: ProfitAnalysisResult) => {
  const cashVsReal = useMemo<CashVsRealComparison>(() => 
    calculateCashVsReal(profitData), 
    [profitData]
  );

  return {
    cashVsReal
  };
};