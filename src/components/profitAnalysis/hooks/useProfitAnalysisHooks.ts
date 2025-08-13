// src/components/profitAnalysis/hooks/useProfitAnalysisHooks.ts
// ✅ UPDATED SPECIALIZED HOOKS - Material Usage Integration & Alignment with useProfitMargin

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';

// ✅ Use the main hook from the updated file
import { useProfitMargin, profitMarginQueryKeys } from '@/hooks/useProfitMargin'; // ✅ Corrected import path

// ✅ Import types from the centralized location
import { 
  DatePeriod, 
  ProfitAnalysisResult,
  MaterialUsageLog, // ✅ Ensure these types are exported from the central types file
  ProductionRecord  // ✅ Ensure these types are exported from the central types file
} from '@/components/profitAnalysis/types'; // ✅ Adjusted path


/**
 * ✅ UPDATED: Hook untuk dialog state management
 * Aligns with the enhanced capabilities of useProfitMargin
 */
export const useProfitAnalysisDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState<DatePeriod | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'materialUsage'>('overview');

  const openDialog = useCallback((period?: DatePeriod, mode: 'overview' | 'detailed' | 'materialUsage' = 'overview') => {
    if (period) setCurrentPeriod(period);
    setViewMode(mode);
    setIsOpen(true);
    logger.debug('Profit Analysis Dialog opened', { period: period?.label, mode });
  }, []);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
    setCurrentPeriod(null);
    setViewMode('overview');
    logger.debug('Profit Analysis Dialog closed');
  }, []);

  const switchMode = useCallback((mode: 'overview' | 'detailed' | 'materialUsage') => {
    setViewMode(mode);
    logger.debug('Profit Analysis Dialog mode switched', { mode });
  }, []);

  return {
    isOpen,
    currentPeriod,
    viewMode,
    openDialog,
    closeDialog,
    switchMode
  };
};

/**
 * ✅ UPDATED: Hook untuk export functionality
 * Integrates with the enhanced export capabilities and uses data from useProfitMargin
 */
export const useProfitExport = () => {
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeMaterialUsage: true,
    includeProductionRecords: true,
    includeDataQuality: true,
    format: 'excel' as 'pdf' | 'excel' | 'csv'
  });

  // Use the main profit margin hook to get current data context if needed
  // const { profitData } = useProfitMargin(); // Optional, if context is needed

  const exportMutation = useMutation({
    mutationFn: async ({ 
      data, 
      format,
      options = exportOptions // Use passed options or default
    }: { 
      data: ProfitAnalysisResult; 
      format: 'pdf' | 'excel' | 'csv';
      options?: typeof exportOptions; // Accept options locally or use state
    }) => {
      setIsExporting(true);
      logger.info('Starting export process', { format, options });

      try {
        // Enhance data with export metadata, including material usage info if opted in
        const exportData = {
          ...data,
          exportMetadata: {
            exportedAt: new Date().toISOString(),
            dataSource: data.cogsBreakdown.dataSource,
            materialUsageRecords: options?.includeMaterialUsage ? data.cogsBreakdown.actualMaterialUsage?.length || 0 : 0,
            productionRecords: options?.includeProductionRecords ? data.cogsBreakdown.productionData?.length || 0 : 0,
            options: options
          }
        };

        // ✅ Call the actual API export function from profitAnalysisApi
        // Assuming profitAnalysisApi.exportProfitAnalysis exists and is correctly typed
        const result = await import('../../services/profitAnalysisApi').then(module => 
          module.profitAnalysisApi.exportProfitAnalysis(exportData, format)
        );

        if (!result.success) {
          throw new Error(result.error || 'Export failed');
        }

        logger.info('Export completed successfully', { filename: result.data });
        return { 
          success: true, 
          filename: result.data, // Assuming the API returns a filename or URL
          dataQuality: data.cogsBreakdown.dataSource
        };
      } catch (error: any) {
        logger.error('Export process failed', { error: error.message });
        throw error; // Re-throw to be caught by onError
      }
    },
    onSuccess: (data) => {
      // You might trigger a download here or show a success toast
      logger.info('Export success notification handled', data);
    },
    onError: (error: Error) => {
      logger.error('Export failed notification', error);
      // Handle error, e.g., show toast
    },
    onSettled: () => {
      setIsExporting(false);
    }
  });

  const exportData = useCallback((
    data: ProfitAnalysisResult, 
    format: 'pdf' | 'excel' | 'csv' = exportOptions.format,
    optionsOverride?: Partial<typeof exportOptions> // Allow overriding options per call
  ) => {
    const finalOptions = optionsOverride ? { ...exportOptions, ...optionsOverride } : exportOptions;
    return exportMutation.mutateAsync({ data, format, options: finalOptions });
  }, [exportMutation, exportOptions]);

  const updateExportOptions = useCallback((newOptions: Partial<typeof exportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...newOptions }));
    logger.debug('Export options updated', newOptions);
  }, []);

  return {
    isExporting,
    exportOptions,
    exportData,
    updateExportOptions,
    exportError: exportMutation.error,
    isExportSuccess: exportMutation.isSuccess
  };
};

/**
 * ✅ ENHANCED: Hook untuk comparison data
 * Now leverages the useProfitComparison hook from useProfitMargin for consistency
 */
export const useProfitComparison = (
  currentPeriod: DatePeriod,
  previousPeriod?: DatePeriod
) => {
  // ✅ Use the dedicated comparison hook from the main hook file
  const { comparison, isLoading, error, refetch } = useProfitMargin().useProfitComparison(currentPeriod, previousPeriod);

  // The comparison logic is now encapsulated within useProfitMargin's useProfitComparison
  // We can add post-processing or enrichment here if needed

  const enrichedComparison = useQuery({
    queryKey: ['profit-comparison-enriched', currentPeriod, previousPeriod],
    queryFn: async () => {
      if (!comparison) return null;

      // Example: Add material usage insights to the comparison
      // This assumes `comparison` object has `current` and `previous` ProfitAnalysisResult
      const currentHasActualData = comparison.current?.cogsBreakdown.dataSource === 'actual';
      const previousHasActualData = comparison.previous?.cogsBreakdown.dataSource === 'actual';

      return {
        ...comparison,
        materialInsights: {
          currentUsesActualData: currentHasActualData,
          previousUsesActualData: previousHasActualData,
          dataQualityImprovement: !previousHasActualData && currentHasActualData
        }
      };
    },
    enabled: !!comparison, // Only run if base comparison is available
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    comparison: enrichedComparison.data,
    isLoading: isLoading || enrichedComparison.isLoading,
    error: error || enrichedComparison.error,
    refetch: () => {
      refetch(); // Refetch base data
      enrichedComparison.refetch(); // Refetch enriched data
    }
  };
};

/**
 * ✅ NEW: Hook for Material Usage Analytics
 * Directly uses the new hooks exposed by the updated useProfitMargin
 */
export const useMaterialUsageAnalytics = (period?: DatePeriod) => {
   // ✅ Delegate to the specialized hook within useProfitMargin
   const { summary, dataQuality, isLoading, error, refetch } = useProfitMargin(period).useMaterialUsageSummary();

   return {
     summary,
     dataQuality, // This includes completeness and recommendations
     isLoading,
     error,
     refetch
   };
};

/**
 * ✅ NEW: Hook for Overall Data Quality Assessment
 * Uses the data quality assessment logic from the updated useProfitMargin
 */
export const useProfitDataQuality = (period?: DatePeriod) => {
  // ✅ Use the data quality hook
  const { dataQuality, isLoading, error, refetch } = useProfitMargin(period).useDataQuality();

  // Can add further processing or aggregation here if needed
  return {
    dataQuality, // Includes completeness, source, and recommendations
    isLoading,
    error,
    refetch,
    // Example derived metric
    isDataReliable: dataQuality?.dataCompleteness === 'complete' || dataQuality?.dataCompleteness === 'partial'
  };
};
