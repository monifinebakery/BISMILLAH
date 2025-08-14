// 5. CONTEXT - src/components/profitAnalysis/contexts/ProfitAnalysisContext.tsx
// ==============================================

import React, { createContext, useContext, useCallback, useReducer, useEffect } from 'react';
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

// Query Keys
export const PROFIT_ANALYSIS_QUERY_KEYS = {
  analysis: (period?: string) => ['profit-analysis', 'calculation', period],
  history: (dateRange?: DateRangeFilter) => ['profit-analysis', 'history', dateRange],
  current: () => ['profit-analysis', 'current'],
} as const;

// State Management
interface ProfitAnalysisState {
  profitData: ProfitAnalysis[];
  currentAnalysis: ProfitAnalysis | null;
  error: string | null;
}

type ProfitAnalysisAction =
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CURRENT_ANALYSIS'; payload: ProfitAnalysis | null }
  | { type: 'RESET_STATE' };

const initialState: ProfitAnalysisState = {
  profitData: [],
  currentAnalysis: null,
  error: null,
};

const profitAnalysisReducer = (
  state: ProfitAnalysisState,
  action: ProfitAnalysisAction
): ProfitAnalysisState => {
  switch (action.type) {
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CURRENT_ANALYSIS':
      return { ...state, currentAnalysis: action.payload };
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
}

export const ProfitAnalysisProvider: React.FC<ProfitAnalysisProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(profitAnalysisReducer, initialState);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Current month analysis query
  const currentAnalysisQuery = useQuery({
    queryKey: PROFIT_ANALYSIS_QUERY_KEYS.current(),
    queryFn: async () => {
      const response = await profitAnalysisApi.getCurrentMonthProfit();
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes - profit data changes frequently
    retry: 2,
  });

  // Calculate profit mutation
  const calculateProfitMutation = useMutation({
    mutationFn: async ({ period, periodType }: { period: string; periodType?: 'monthly' | 'quarterly' | 'yearly' }) => {
      const response = await profitAnalysisApi.calculateProfitAnalysis(period, periodType);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data) => {
      logger.info('✅ Profit calculation successful:', data);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: PROFIT_ANALYSIS_QUERY_KEYS.current() });
    },
    onError: (error: Error) => {
      logger.error('❌ Profit calculation error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    },
  });

  // Actions
  const calculateProfit = useCallback(async (
    period: string, 
    periodType: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ): Promise<boolean> => {
    try {
      await calculateProfitMutation.mutateAsync({ period, periodType });
      return true;
    } catch (error) {
      logger.error('❌ Calculate profit failed:', error);
      return false;
    }
  }, [calculateProfitMutation]);

  const loadProfitHistory = useCallback(async (dateRange?: DateRangeFilter) => {
    try {
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await profitAnalysisApi.getProfitHistory(
        dateRange || {
          from: new Date(new Date().getFullYear(), 0, 1), // Start of year
          to: new Date(),
          period_type: 'monthly'
        }
      );
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
      }
      
    } catch (error) {
      logger.error('❌ Load profit history failed:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Gagal memuat riwayat profit' });
    }
  }, []);

  const refreshAnalysis = useCallback(async () => {
    await currentAnalysisQuery.refetch();
  }, [currentAnalysisQuery]);

  const getProfitByPeriod = useCallback((period: string) => {
    // This would need to be implemented with stored data
    // For now, return null since we're using real-time calculation
    return undefined;
  }, []);

  const calculateRealTimeProfit = useCallback(async (period: string) => {
    const response = await profitAnalysisApi.calculateProfitAnalysis(period);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data;
  }, []);

  // Context value
  const contextValue: ProfitAnalysisContextType = {
    // State
    profitData: state.profitData,
    currentAnalysis: state.currentAnalysis,
    isLoading: currentAnalysisQuery.isLoading || calculateProfitMutation.isPending,
    error: state.error || currentAnalysisQuery.error?.message || null,
    
    // Actions
    calculateProfit,
    loadProfitHistory,
    refreshAnalysis,
    
    // Utilities
    getProfitByPeriod,
    calculateRealTimeProfit,
  };

  return (
    <ProfitAnalysisContext.Provider value={contextValue}>
      {children}
    </ProfitAnalysisContext.Provider>
  );
};

// Hook
export const useProfitAnalysis = () => {
  const context = useContext(ProfitAnalysisContext);
  if (context === undefined) {
    throw new Error('useProfitAnalysis must be used within a ProfitAnalysisProvider');
  }
  return context;
};

export default ProfitAnalysisContext;