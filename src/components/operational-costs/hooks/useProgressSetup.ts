import { useMemo } from 'react';
import { OperationalCost, AppSettings } from '../types/operationalCost.types';

interface ProgressSetupData {
  isVisible: boolean;
  isStep1Complete: boolean;
  isStep2Complete: boolean;
  totalCosts: number;
  hppCosts: number;
  operationalCosts: number;
  isSetupComplete: boolean;
}

export const useProgressSetup = (
  costs: OperationalCost[],
  appSettings: AppSettings | null
): ProgressSetupData => {
  return useMemo(() => {
    const isVisible = costs.length > 0;
    const isStep1Complete = costs.length > 0;
    const isStep2Complete = Boolean(
      appSettings?.overhead_per_pcs && appSettings?.operasional_per_pcs
    );
    
    const hppCosts = costs.filter(c => c.group === 'HPP').length;
    const operationalCosts = costs.filter(c => c.group === 'OPERASIONAL').length;
    const totalCosts = costs.length;
    
    const isSetupComplete = isStep1Complete && isStep2Complete;

    return {
      isVisible,
      isStep1Complete,
      isStep2Complete,
      totalCosts,
      hppCosts,
      operationalCosts,
      isSetupComplete,
    };
  }, [costs, appSettings]);
};

export default useProgressSetup;