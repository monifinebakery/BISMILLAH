// src/components/profitAnalysis/hooks/useProfitAnalysisHooks.ts
// ✅ ADDITIONAL HOOKS - Specialized hooks untuk profit analysis

import { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useProfitMargin } from './useProfitMargin';
import { DatePeriod } from '../types';

/**
 * Hook untuk dialog state management
 */
export const useProfitAnalysisDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<DatePeriod | null>(null);

  const openDialog = useCallback((period?: DatePeriod) => {
    if (period) setCurrentPeriod(period);
    setIsOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setCurrentPeriod(null);
  }, []);

  return {
    isOpen,
    currentPeriod,
    openDialog,
    closeDialog
  };
};

/**
 * Hook untuk export functionality
 */
export const useProfitExport = () => {
  const [isExporting, setIsExporting] = useState(false);

  const exportMutation = useMutation({
    mutationFn: async ({ 
      data, 
      format 
    }: { 
      data: any; 
      format: 'pdf' | 'excel' | 'csv' 
    }) => {
      // Implementation export logic
      // This would call the actual export service
      return { success: true, filename: `export.${format}` };
    },
    onMutate: () => setIsExporting(true),
    onSettled: () => setIsExporting(false)
  });

  return {
    isExporting,
    exportData: exportMutation.mutate,
    exportError: exportMutation.error
  };
};

/**
 * Hook untuk comparison data
 */
export const useProfitComparison = (
  currentPeriod: DatePeriod,
  previousPeriod?: DatePeriod
) => {
  const currentAnalysis = useProfitMargin(currentPeriod);
  const previousAnalysis = useProfitMargin(previousPeriod);

  const comparison = useQuery({
    queryKey: ['profit-comparison', currentPeriod, previousPeriod],
    queryFn: () => {
      if (!currentAnalysis.profitData || !previousAnalysis.profitData) {
        return null;
      }

      const current = currentAnalysis.profitData.profitMarginData;
      const previous = previousAnalysis.profitData.profitMarginData;

      return {
        revenueGrowth: ((current.revenue - previous.revenue) / previous.revenue) * 100,
        marginImprovement: current.netMargin - previous.netMargin,
        costReduction: ((previous.cogs + previous.opex) / previous.revenue - 
                       (current.cogs + current.opex) / current.revenue) * 100
      };
    },
    enabled: !!currentAnalysis.profitData && !!previousAnalysis.profitData
  });

  return {
    comparison: comparison.data,
    isLoading: comparison.isLoading || currentAnalysis.isLoading || previousAnalysis.isLoading,
    error: comparison.error || currentAnalysis.error || previousAnalysis.error
  };
};