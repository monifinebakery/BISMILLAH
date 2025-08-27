// src/hooks/useWebWorker.ts
import { useRef, useCallback, useEffect, useState } from 'react';
import { logger } from '@/utils/logger';

interface WebWorkerMessage {
  type: string;
  data?: any;
  result?: any;
  error?: string;
  progress?: {
    processed: number;
    total: number;
    percentage: number;
  };
}

interface UseWebWorkerOptions {
  onMessage?: (message: WebWorkerMessage) => void;
  onError?: (error: ErrorEvent) => void;
  onProgress?: (progress: { processed: number; total: number; percentage: number }) => void;
  autoTerminate?: boolean;
}

interface UseWebWorkerReturn {
  postMessage: (type: string, data?: any) => void;
  terminate: () => void;
  isWorkerReady: boolean;
  isProcessing: boolean;
  error: string | null;
  progress: { processed: number; total: number; percentage: number } | null;
}

export const useWebWorker = (
  workerPath: string,
  options: UseWebWorkerOptions = {}
): UseWebWorkerReturn => {
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ processed: number; total: number; percentage: number } | null>(null);

  const { onMessage, onError, onProgress, autoTerminate = true } = options;

  // Initialize worker
  useEffect(() => {
    try {
      const worker = new Worker(workerPath);
      workerRef.current = worker;
      setIsWorkerReady(true);
      setError(null);

      // Handle messages from worker
      worker.onmessage = (event: MessageEvent<WebWorkerMessage>) => {
        const message = event.data;
        
        logger.debug('WebWorker message received:', message);

        // Handle progress updates
        if (message.type.includes('PROGRESS') && message.progress) {
          setProgress(message.progress);
          onProgress?.(message.progress);
          return;
        }

        // Handle completion messages
        if (message.type.includes('CALCULATED') || 
            message.type.includes('IMPORTED') || 
            message.type.includes('EXPORTED') || 
            message.type.includes('UPDATED') || 
            message.type.includes('VALIDATED') || 
            message.type.includes('GENERATED')) {
          setIsProcessing(false);
          setProgress(null);
        }

        // Handle errors
        if (message.type === 'ERROR') {
          setError(message.error || 'Unknown worker error');
          setIsProcessing(false);
          setProgress(null);
        } else {
          setError(null);
        }

        // Call custom message handler
        onMessage?.(message);
      };

      // Handle worker errors
      worker.onerror = (errorEvent: ErrorEvent) => {
        logger.error('WebWorker error:', errorEvent);
        setError(errorEvent.message);
        setIsProcessing(false);
        setProgress(null);
        onError?.(errorEvent);
      };

      logger.debug('WebWorker initialized:', workerPath);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize worker';
      logger.error('Failed to initialize WebWorker:', err);
      setError(errorMessage);
      setIsWorkerReady(false);
    }

    // Cleanup on unmount
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
        setIsWorkerReady(false);
        logger.debug('WebWorker terminated on cleanup');
      }
    };
  }, [workerPath, onMessage, onError, onProgress]);

  // Post message to worker
  const postMessage = useCallback((type: string, data?: any) => {
    if (!workerRef.current || !isWorkerReady) {
      logger.warn('WebWorker not ready, cannot post message');
      setError('Worker not ready');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setProgress(null);
      
      workerRef.current.postMessage({ type, data });
      logger.debug('Message posted to WebWorker:', { type, data });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to post message';
      logger.error('Failed to post message to WebWorker:', err);
      setError(errorMessage);
      setIsProcessing(false);
    }
  }, [isWorkerReady]);

  // Terminate worker manually
  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      setIsWorkerReady(false);
      setIsProcessing(false);
      setError(null);
      setProgress(null);
      logger.debug('WebWorker terminated manually');
    }
  }, []);

  // Auto-terminate on unmount if enabled
  useEffect(() => {
    return () => {
      if (autoTerminate && workerRef.current) {
        workerRef.current.terminate();
        logger.debug('WebWorker auto-terminated');
      }
    };
  }, [autoTerminate]);

  return {
    postMessage,
    terminate,
    isWorkerReady,
    isProcessing,
    error,
    progress
  };
};

// Specialized hook for HPP calculations
export const useHPPWorker = (options: UseWebWorkerOptions = {}) => {
  return useWebWorker('/workers/hppCalculator.worker.js', options);
};

// Specialized hook for bulk operations
export const useBulkOperationsWorker = (options: UseWebWorkerOptions = {}) => {
  return useWebWorker('/workers/bulkOperations.worker.js', options);
};

// Hook for HPP calculations with built-in state management
export const useHPPCalculation = () => {
  const [hppResult, setHppResult] = useState<any>(null);
  const [bulkResults, setBulkResults] = useState<any>(null);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);

  const worker = useHPPWorker({
    onMessage: (message) => {
      switch (message.type) {
        case 'HPP_CALCULATED':
          setHppResult(message.result);
          break;
        case 'BULK_HPP_CALCULATED':
          setBulkResults(message.result);
          break;
        case 'RECIPE_COSTS_OPTIMIZED':
          setOptimizationResults(message.result);
          break;
      }
    }
  });

  const calculateHPP = useCallback((recipeData: any) => {
    worker.postMessage('CALCULATE_HPP', recipeData);
  }, [worker]);

  const calculateBulkHPP = useCallback((recipesData: any) => {
    worker.postMessage('BULK_HPP_CALCULATION', recipesData);
  }, [worker]);

  const optimizeRecipeCosts = useCallback((optimizationData: any) => {
    worker.postMessage('OPTIMIZE_RECIPE_COSTS', optimizationData);
  }, [worker]);

  const reset = useCallback(() => {
    setHppResult(null);
    setBulkResults(null);
    setOptimizationResults(null);
  }, []);

  return {
    ...worker,
    calculateHPP,
    calculateBulkHPP,
    optimizeRecipeCosts,
    hppResult,
    bulkResults,
    optimizationResults,
    reset
  };
};

// Hook for bulk operations with built-in state management
export const useBulkOperations = () => {
  const [importResult, setImportResult] = useState<any>(null);
  const [exportResult, setExportResult] = useState<any>(null);
  const [updateResult, setUpdateResult] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [reportResult, setReportResult] = useState<any>(null);

  const worker = useBulkOperationsWorker({
    onMessage: (message) => {
      switch (message.type) {
        case 'CSV_IMPORTED':
          setImportResult(message.result);
          break;
        case 'DATA_EXPORTED':
          setExportResult(message.result);
          break;
        case 'BATCH_UPDATED':
          setUpdateResult(message.result);
          break;
        case 'BULK_DATA_VALIDATED':
          setValidationResult(message.result);
          break;
        case 'REPORTS_GENERATED':
          setReportResult(message.result);
          break;
      }
    }
  });

  const importCSV = useCallback((csvData: any) => {
    worker.postMessage('IMPORT_CSV', csvData);
  }, [worker]);

  const exportData = useCallback((exportData: any) => {
    worker.postMessage('EXPORT_DATA', exportData);
  }, [worker]);

  const batchUpdate = useCallback((updateData: any) => {
    worker.postMessage('BATCH_UPDATE', updateData);
  }, [worker]);

  const validateBulkData = useCallback((validationData: any) => {
    worker.postMessage('VALIDATE_BULK_DATA', validationData);
  }, [worker]);

  const generateReports = useCallback((reportData: any) => {
    worker.postMessage('GENERATE_REPORTS', reportData);
  }, [worker]);

  const reset = useCallback(() => {
    setImportResult(null);
    setExportResult(null);
    setUpdateResult(null);
    setValidationResult(null);
    setReportResult(null);
  }, []);

  return {
    ...worker,
    importCSV,
    exportData,
    batchUpdate,
    validateBulkData,
    generateReports,
    importResult,
    exportResult,
    updateResult,
    validationResult,
    reportResult,
    reset
  };
};