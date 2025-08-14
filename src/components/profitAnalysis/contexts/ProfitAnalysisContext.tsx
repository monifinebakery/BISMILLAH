// contexts/ProfitAnalysisContext.tsx - Fixed Date Reference Issues
// ==============================================

import React, { createContext, useContext, useCallback, useReducer, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

import { 
  ProfitAnalysisContextType,
  ProfitAnalysis, 
  RealTimeProfitCalculation,
  DateRangeFilter
} from '../types/profitAnalysis.types';
import profitAnalysisApi from '../services/profitAnalysisApi';

// Query Keys untuk React Query
export const PROFIT_ANALYSIS_QUERY_KEYS = {
  analysis: (period?: string) => ['analisis-profit', 'kalkulasi', period],
  history: (dateRange?: DateRangeFilter) => ['analisis-profit', 'riwayat', dateRange],
  current: () => ['analisis-profit', 'sekarang'],
  realTime: (period: string) => ['analisis-profit', 'realtime', period],
} as const;

// State Management - ✅ Fixed to use RealTimeProfitCalculation
interface ProfitAnalysisState {
  profitData: RealTimeProfitCalculation[]; // ✅ Changed from ProfitAnalysis[]
  currentAnalysis: RealTimeProfitCalculation | null; // ✅ Changed from ProfitAnalysis
  error: string | null;
  lastUpdated: string | null;
}

type ProfitAnalysisAction =
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_ANALYSIS'; payload: RealTimeProfitCalculation | null } // ✅ Fixed type
  | { type: 'SET_PROFIT_DATA'; payload: RealTimeProfitCalculation[] } // ✅ Fixed type
  | { type: 'SET_LAST_UPDATED'; payload: string }
  | { type: 'RESET_STATE' };

const initialState: ProfitAnalysisState = {
  profitData: [],
  currentAnalysis: null,
  error: null,
  lastUpdated: null,
};

const profitAnalysisReducer = (
  state: ProfitAnalysisState,
  action: ProfitAnalysisAction
): ProfitAnalysisState => {
  switch (action.type) {
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CURRENT_ANALYSIS':
      return { 
        ...state, 
        currentAnalysis: action.payload,
        lastUpdated: action.payload ? new Date().toISOString() : state.lastUpdated
      };
    case 'SET_PROFIT_DATA':
      return { ...state, profitData: action.payload };
    case 'SET_LAST_UPDATED':
      return { ...state, lastUpdated: action.payload };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
};

// Context
const ProfitAnalysisContext = createContext<ProfitAnalysisContextType | undefined>(undefined);

// Provider
interface ProfitAnalysisProviderProps {
  children: React.ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const ProfitAnalysisProvider: React.FC<ProfitAnalysisProviderProps> = ({ 
  children,
  autoRefresh = true,
  refreshInterval = 5 * 60 * 1000 // 5 menit
}) => {
  const [state, dispatch] = useReducer(profitAnalysisReducer, initialState);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query untuk analisis bulan ini
  const currentAnalysisQuery = useQuery({
    queryKey: PROFIT_ANALYSIS_QUERY_KEYS.current(),
    queryFn: async () => {
      logger.info('🔄 Mengambil analisis profit bulan ini...');
      const response = await profitAnalysisApi.getCurrentMonthProfit();
      if (response.error) {
        throw new Error(response.error);
      }
      
      logger.success('✅ Analisis profit berhasil dimuat:', {
        revenue: response.data.revenue_data.total,
        calculatedAt: response.data.calculated_at
      });
      
      return response.data;
    },
    enabled: !!user,
    staleTime: refreshInterval,
    refetchInterval: autoRefresh ? refreshInterval : false,
    retry: 2,
    onSuccess: (data) => {
      dispatch({ type: 'SET_CURRENT_ANALYSIS', payload: data });
      dispatch({ type: 'SET_ERROR', payload: null });
    },
    onError: (error: Error) => {
      logger.error('❌ Gagal memuat analisis profit:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  });

  // Mutation untuk kalkulasi profit
  const calculateProfitMutation = useMutation({
    mutationFn: async ({ 
      period, 
      periodType 
    }: { 
      period: string; 
      periodType?: 'monthly' | 'quarterly' | 'yearly' 
    }) => {
      logger.info('🔄 Menghitung profit untuk periode:', period);
      const response = await profitAnalysisApi.calculateProfitAnalysis(period, periodType);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      logger.success('✅ Kalkulasi profit berhasil:', {
        period: variables.period,
        revenue: data.revenue_data.total
      });
      
      // Update state lokal
      dispatch({ type: 'SET_CURRENT_ANALYSIS', payload: data });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      // Invalidate cache terkait
      queryClient.invalidateQueries({ 
        queryKey: PROFIT_ANALYSIS_QUERY_KEYS.current() 
      });
      queryClient.invalidateQueries({ 
        queryKey: PROFIT_ANALYSIS_QUERY_KEYS.analysis() 
      });
    },
    onError: (error: Error) => {
      logger.error('❌ Gagal menghitung profit:', error);
      dispatch({ type: 'SET_ERROR', payload: `Gagal menghitung profit: ${error.message}` });
    },
  });

  // Actions
  const calculateProfit = useCallback(async (
    period: string, 
    periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      await calculateProfitMutation.mutateAsync({ period, periodType });
      return true;
    } catch (error) {
      logger.error('❌ Kalkulasi profit gagal:', error);
      return false;
    }
  }, [calculateProfitMutation]);

  const loadProfitHistory = useCallback(async (dateRange?: DateRangeFilter) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      logger.info('🔄 Memuat riwayat profit...');
      
      const response = await profitAnalysisApi.getProfitHistory(
        dateRange || {
          from: new Date(new Date().getFullYear(), 0, 1),
          to: new Date(),
          period_type: 'monthly'
        }
      );
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return;
      }
      
      dispatch({ type: 'SET_PROFIT_DATA', payload: response.data });
      logger.success('✅ Riwayat profit berhasil dimuat:', response.data.length, 'periode');
      
    } catch (error) {
      logger.error('❌ Gagal memuat riwayat profit:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Gagal memuat riwayat profit' });
    }
  }, []);

  const refreshAnalysis = useCallback(async () => {
    logger.info('🔄 Menyegarkan analisis profit...');
    dispatch({ type: 'SET_ERROR', payload: null });
    await currentAnalysisQuery.refetch();
  }, [currentAnalysisQuery]);

  const getProfitByPeriod = useCallback((period: string) => {
    const foundData = state.profitData.find(data => data.period === period);
    if (foundData) {
      logger.info('📊 Data profit ditemukan untuk periode:', period);
    }
    return foundData;
  }, [state.profitData]);

  const calculateRealTimeProfit = useCallback(async (period: string) => {
    logger.info('⚡ Menghitung profit real-time untuk periode:', period);
    const response = await profitAnalysisApi.calculateProfitAnalysis(period);
    if (response.error) {
      throw new Error(response.error);
    }
    logger.success('✅ Kalkulasi real-time selesai');
    return response.data;
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
    queryClient.clear();
    logger.info('🔄 State analisis profit direset');
  }, [queryClient]);

  // Auto-load history saat provider pertama kali dimount
  useEffect(() => {
    if (user && autoRefresh) {
      loadProfitHistory();
    }
  }, [user, autoRefresh, loadProfitHistory]);

  // ✅ FIX: Memoize lastUpdated Date conversion to prevent re-creation
  const lastUpdatedDate = useMemo(() => {
    return state.lastUpdated ? new Date(state.lastUpdated) : null;
  }, [state.lastUpdated]); // Only depends on the string value

  // Context value
  const contextValue: ProfitAnalysisContextType = useMemo(() => ({
    // State
    profitData: state.profitData,
    currentAnalysis: state.currentAnalysis,
    isLoading: currentAnalysisQuery.isLoading || calculateProfitMutation.isPending,
    error: state.error || currentAnalysisQuery.error?.message || null,
    lastUpdated: lastUpdatedDate, // ✅ Use memoized Date object
    
    // Actions
    calculateProfit,
    loadProfitHistory,
    refreshAnalysis,
    clearError,
    resetState,
    
    // Utilities
    getProfitByPeriod,
    calculateRealTimeProfit,
    
    // Query status
    isRefreshing: currentAnalysisQuery.isFetching,
    isCalculating: calculateProfitMutation.isPending,
  }), [
    state.profitData,
    state.currentAnalysis,
    state.error,
    lastUpdatedDate,
    currentAnalysisQuery.isLoading,
    currentAnalysisQuery.isFetching,
    currentAnalysisQuery.error?.message,
    calculateProfitMutation.isPending,
    calculateProfit,
    loadProfitHistory,
    refreshAnalysis,
    clearError,
    resetState,
    getProfitByPeriod,
    calculateRealTimeProfit
  ]); // ✅ Properly memoized with all dependencies

  return (
    <ProfitAnalysisContext.Provider value={contextValue}>
      {children}
    </ProfitAnalysisContext.Provider>
  );
};

// Hook untuk menggunakan context
export const useProfitAnalysisContext = () => {
  const context = useContext(ProfitAnalysisContext);
  if (context === undefined) {
    throw new Error('useProfitAnalysisContext harus digunakan dalam ProfitAnalysisProvider');
  }
  return context;
};

// Export default
export default ProfitAnalysisContext;