// src/components/operational-costs/context/OperationalCostContext.tsx

import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  OperationalCost, 
  AllocationSettings, 
  CostSummary, 
  CostFilters,
  CostFormData,
  AllocationFormData,
  OverheadCalculation 
} from '../types';
import { operationalCostApi, allocationApi, calculationApi } from '../services';
import { transformCostsToSummary } from '../utils/costTransformers';
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

// Query Keys
export const OPERATIONAL_COST_QUERY_KEYS = {
  costs: (filters?: CostFilters) => ['operational-costs', 'costs', filters],
  allocationSettings: () => ['operational-costs', 'allocation-settings'],
  overheadCalculation: (materialCost?: number) => ['operational-costs', 'overhead-calculation', materialCost],
} as const;

// State interface
interface OperationalCostState {
  costs: OperationalCost[];
  allocationSettings: AllocationSettings | null;
  summary: CostSummary;
  overheadCalculation: OverheadCalculation | null;
  filters: CostFilters;
  loading: {
    costs: boolean;
    allocation: boolean;
    summary: boolean;
    overhead: boolean;
    auth: boolean;
  };
  error: string | null;
  isAuthenticated: boolean;
}

// Action types
type OperationalCostAction =
  | { type: 'SET_LOADING'; payload: { key: keyof OperationalCostState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_OVERHEAD_CALCULATION'; payload: OverheadCalculation }
  | { type: 'SET_FILTERS'; payload: CostFilters }
  | { type: 'SET_AUTH_STATE'; payload: boolean }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: OperationalCostState = {
  costs: [],
  allocationSettings: null,
  summary: {
    total_biaya_aktif: 0,
    total_biaya_tetap: 0,
    total_biaya_variabel: 0,
    jumlah_biaya_aktif: 0,
    jumlah_biaya_nonaktif: 0,
    total_hpp_group: 0,
    total_operasional_group: 0,
    jumlah_hpp_aktif: 0,
    jumlah_operasional_aktif: 0,
  },
  overheadCalculation: null,
  filters: {},
  loading: {
    costs: false,
    allocation: false,
    summary: false,
    overhead: false,
    auth: true,
  },
  error: null,
  isAuthenticated: false,
};

// Reducer
const operationalCostReducer = (
  state: OperationalCostState,
  action: OperationalCostAction
): OperationalCostState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'SET_OVERHEAD_CALCULATION':
      return {
        ...state,
        overheadCalculation: action.payload,
      };

    case 'SET_FILTERS':
      return {
        ...state,
        filters: action.payload,
      };

    case 'SET_AUTH_STATE':
      return {
        ...state,
        isAuthenticated: action.payload,
        loading: {
          ...state.loading,
          auth: false,
        },
      };

    case 'RESET_STATE':
      return {
        ...initialState,
        loading: {
          ...initialState.loading,
          auth: false,
        },
      };

    default:
      return state;
  }
};

// Context interface
interface OperationalCostContextType {
  state: OperationalCostState;
  actions: {
    loadCosts: (filters?: CostFilters) => Promise<void>;
    createCost: (data: CostFormData) => Promise<boolean>;
    updateCost: (id: string, data: Partial<CostFormData>) => Promise<boolean>;
    deleteCost: (id: string) => Promise<boolean>;
    loadAllocationSettings: () => Promise<void>;
    saveAllocationSettings: (data: AllocationFormData) => Promise<boolean>;
    calculateOverhead: (materialCost?: number) => Promise<void>;
    setFilters: (filters: CostFilters) => void;
    clearFilters: () => void;
    refreshData: () => Promise<void>;
    setError: (error: string | null) => void;
  };
}

// Create context
const OperationalCostContext = createContext<OperationalCostContextType | undefined>(undefined);

// Provider component
interface OperationalCostProviderProps {
  children: React.ReactNode;
}

export const OperationalCostProvider: React.FC<OperationalCostProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(operationalCostReducer, initialState);
  const queryClient = useQueryClient();

  // Debug logging
  logger.debug('🔍 OperationalCostProvider rendered', {
    filters: state.filters,
    isAuthenticated: state.isAuthenticated,
    costsCount: state.costs.length
  });

  // ✅ Stabilize filters to prevent unnecessary re-renders
  const stabilizedFilters = useMemo(() => {
    logger.debug('📊 Filters stabilized:', state.filters);
    return state.filters;
  }, [state.filters]);

  // Memoized string representation for comparison
  const filtersString = useMemo(() => JSON.stringify(state.filters), [state.filters]);

  // Helper function to set loading state
  const setLoading = useCallback((key: keyof OperationalCostState['loading'], value: boolean) => {
    logger.debug(`⏳ Setting loading.${key} = ${value}`);
    dispatch({ type: 'SET_LOADING', payload: { key, value } });
  }, []);

  // ✅ useQuery: Load Costs
  const costsQuery = useQuery({
    queryKey: OPERATIONAL_COST_QUERY_KEYS.costs(stabilizedFilters),
    queryFn: async () => {
      logger.info('🔄 Fetching costs with filters:', stabilizedFilters);
      const response = await operationalCostApi.getCosts(stabilizedFilters);
      if (response.error) {
        logger.error('❌ Error fetching costs:', response.error);
        throw new Error(response.error);
      }
      logger.debug('✅ Costs fetched successfully:', response.data?.length || 0);
      return response.data;
    },
    enabled: state.isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // ✅ useQuery: Load Allocation Settings
  const allocationQuery = useQuery({
    queryKey: OPERATIONAL_COST_QUERY_KEYS.allocationSettings(),
    queryFn: async () => {
      logger.info('🔄 Fetching allocation settings');
      const response = await allocationApi.getSettings();
      if (response.error && !response.error.includes('tidak ditemukan')) {
        logger.error('❌ Error fetching allocation settings:', response.error);
        throw new Error(response.error);
      }
      logger.success('✅ Allocation settings fetched:', !!response.data);
      return response.data;
    },
    enabled: state.isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // ✅ Mutations for CRUD operations
  const createCostMutation = useMutation({
    mutationFn: async (data: CostFormData) => {
      logger.info('🔄 Creating new cost:', data.nama_biaya);
      const response = await operationalCostApi.createCost(data);
      if (response.error) {
        logger.error('❌ Error creating cost:', response.error);
        throw new Error(response.error);
      }
      logger.success('✅ Cost created successfully:', response.data?.id);
      return response.data;
    },
    onSuccess: (newCost) => {
      logger.info('🎉 Cost mutation success, invalidating queries');
      // Invalidate and refetch costs
      queryClient.invalidateQueries({ queryKey: OPERATIONAL_COST_QUERY_KEYS.costs() });
    },
    onError: (error: Error) => {
      logger.error('❌ Create cost mutation error:', error instanceof Error ? error.message : String(error));
      dispatch({ type: 'SET_ERROR', payload: (error instanceof Error ? error.message : String(error)) || 'Gagal menambahkan biaya operasional' });
    },
  });

  const updateCostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CostFormData> }) => {
      logger.info('🔄 Updating cost:', id);
      const response = await operationalCostApi.updateCost(id, data);
      if (response.error) {
        logger.error('❌ Error updating cost:', response.error);
        throw new Error(response.error);
      }
      logger.success('✅ Cost updated successfully:', id);
      return response.data;
    },
    onSuccess: (updatedCost) => {
      logger.info('🎉 Update cost mutation success, invalidating queries');
      // Invalidate and refetch costs
      queryClient.invalidateQueries({ queryKey: OPERATIONAL_COST_QUERY_KEYS.costs() });
    },
    onError: (error: Error) => {
      logger.error('❌ Update cost mutation error:', error instanceof Error ? error.message : String(error));
      dispatch({ type: 'SET_ERROR', payload: (error instanceof Error ? error.message : String(error)) || 'Gagal memperbarui biaya operasional' });
    },
  });

  const deleteCostMutation = useMutation({
    mutationFn: async (id: string) => {
      logger.info('🔄 Deleting cost:', id);
      const response = await operationalCostApi.deleteCost(id);
      if (response.error) {
        logger.error('❌ Error deleting cost:', response.error);
        throw new Error(response.error);
      }
      logger.success('✅ Cost deleted successfully:', id);
      return id;
    },
    onSuccess: (deletedId) => {
      logger.info('🎉 Delete cost mutation success, invalidating queries');
      // Invalidate and refetch costs
      queryClient.invalidateQueries({ queryKey: OPERATIONAL_COST_QUERY_KEYS.costs() });
    },
    onError: (error: Error) => {
      logger.error('❌ Delete cost mutation error:', error instanceof Error ? error.message : String(error));
      dispatch({ type: 'SET_ERROR', payload: (error instanceof Error ? error.message : String(error)) || 'Gagal menghapus biaya operasional' });
    },
  });

  const saveAllocationMutation = useMutation({
    mutationFn: async (data: AllocationFormData) => {
      logger.info('🔄 Saving allocation settings:', data);
      const response = await allocationApi.upsertSettings(data);
      if (response.error) {
        logger.error('❌ Error saving allocation settings:', response.error);
        throw new Error(response.error);
      }
      logger.success('✅ Allocation settings saved successfully');
      return response.data;
    },
    onSuccess: (settings) => {
      logger.info('🎉 Save allocation mutation success, invalidating queries');
      // Invalidate and refetch allocation settings
      queryClient.invalidateQueries({ queryKey: OPERATIONAL_COST_QUERY_KEYS.allocationSettings() });
    },
    onError: (error: Error) => {
      logger.error('❌ Save allocation mutation error:', error instanceof Error ? error.message : String(error));
      dispatch({ type: 'SET_ERROR', payload: (error instanceof Error ? error.message : String(error)) || 'Gagal menyimpan pengaturan alokasi' });
    },
  });

  // ✅ Manual overhead calculation with useQuery pattern
  const calculateOverheadQuery = useCallback(async (materialCost: number = 0) => {
    if (!state.isAuthenticated) {
      logger.warn('🔐 Overhead calculation attempted without authentication');
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return;
    }

    try {
      logger.info('🔄 Calculating overhead with material cost:', materialCost);
      setLoading('overhead', true);
      
      // Use queryClient.fetchQuery for manual triggering
      const data = await queryClient.fetchQuery({
        queryKey: OPERATIONAL_COST_QUERY_KEYS.overheadCalculation(materialCost),
        queryFn: async () => {
          const response = await calculationApi.calculateOverhead(materialCost);
          if (response.error) {
            throw new Error(response.error);
          }
          return response.data;
        },
        staleTime: 1 * 60 * 1000, // 1 minute - overhead calculation can change frequently
        retry: 2,
      });

      logger.success('✅ Overhead calculated successfully:', data?.overhead_per_unit);
      dispatch({ type: 'SET_OVERHEAD_CALCULATION', payload: data });
    } catch (error) {
      logger.error('❌ Error calculating overhead:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Gagal menghitung overhead' });
    } finally {
      setLoading('overhead', false);
    }
  }, [state.isAuthenticated, queryClient, setLoading]);

  // ✅ SIMPLIFIED: Auth state management
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        logger.info('🔐 Initializing authentication');
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('🔐 Auth error:', error);
          if (mounted) {
            dispatch({ type: 'SET_AUTH_STATE', payload: false });
            dispatch({ type: 'SET_ERROR', payload: 'Gagal memverifikasi autentikasi' });
          }
          return;
        }

        const isAuthenticated = !!session?.user;
        logger.info('🔐 Auth state initialized:', { isAuthenticated, userId: session?.user?.id });
        
        if (mounted) {
          dispatch({ type: 'SET_AUTH_STATE', payload: isAuthenticated });
        }
      } catch (error) {
        logger.error('🔐 Error initializing auth:', error);
        if (mounted) {
          dispatch({ type: 'SET_AUTH_STATE', payload: false });
        }
      }
    };

    initializeAuth();

    // ✅ SIMPLIFIED: Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        const isAuthenticated = !!session?.user;
        logger.info('🔐 Auth state changed:', { event, isAuthenticated, userId: session?.user?.id });
        
        dispatch({ type: 'SET_AUTH_STATE', payload: isAuthenticated });
        
        if (event === 'SIGNED_OUT') {
          logger.info('🔐 User signed out, resetting state and clearing queries');
          dispatch({ type: 'RESET_STATE' });
          // Clear all queries when user signs out
          queryClient.clear();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      logger.debug('🔐 Auth listener cleaned up');
    };
  }, [queryClient]);

  // ✅ Calculate summary from costs query data
  const summary = useMemo(() => {
    const costs = costsQuery.data || [];
    const calculatedSummary = transformCostsToSummary(costs);
    logger.debug('📊 Summary calculated:', calculatedSummary);
    return calculatedSummary;
  }, [costsQuery.data]);

  // ✅ Legacy wrapper functions to maintain API compatibility
  const loadCosts = useCallback(async (filters?: CostFilters) => {
    logger.info('🔄 loadCosts called with filters:', filters);
    if (filters) {
      dispatch({ type: 'SET_FILTERS', payload: filters });
    }
    // The query will automatically refetch when filters change
    await costsQuery.refetch();
  }, [costsQuery]);

  const loadAllocationSettings = useCallback(async () => {
    logger.info('🔄 loadAllocationSettings called');
    await allocationQuery.refetch();
  }, [allocationQuery]);

  const createCost = useCallback(async (data: CostFormData): Promise<boolean> => {
    if (!state.isAuthenticated) {
      logger.warn('🔐 Create cost attempted without authentication');
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return false;
    }

    try {
      await createCostMutation.mutateAsync(data);
      return true;
    } catch (error) {
      logger.error('❌ Create cost failed:', error);
      return false;
    }
  }, [state.isAuthenticated, createCostMutation]);

  const updateCost = useCallback(async (id: string, data: Partial<CostFormData>): Promise<boolean> => {
    if (!state.isAuthenticated) {
      logger.warn('🔐 Update cost attempted without authentication');
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return false;
    }

    try {
      await updateCostMutation.mutateAsync({ id, data });
      return true;
    } catch (error) {
      logger.error('❌ Update cost failed:', error);
      return false;
    }
  }, [state.isAuthenticated, updateCostMutation]);

  const deleteCost = useCallback(async (id: string): Promise<boolean> => {
    if (!state.isAuthenticated) {
      logger.warn('🔐 Delete cost attempted without authentication');
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return false;
    }

    try {
      await deleteCostMutation.mutateAsync(id);
      return true;
    } catch (error) {
      logger.error('❌ Delete cost failed:', error);
      return false;
    }
  }, [state.isAuthenticated, deleteCostMutation]);

  const saveAllocationSettings = useCallback(async (data: AllocationFormData): Promise<boolean> => {
    if (!state.isAuthenticated) {
      logger.warn('🔐 Save allocation settings attempted without authentication');
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return false;
    }

    try {
      await saveAllocationMutation.mutateAsync(data);
      return true;
    } catch (error) {
      logger.error('❌ Save allocation settings failed:', error);
      return false;
    }
  }, [state.isAuthenticated, saveAllocationMutation]);

  // Filter actions
  const setFilters = useCallback((filters: CostFilters) => {
    // ✅ Prevent unnecessary updates if filters are the same
    if (JSON.stringify(filters) !== filtersString) {
      logger.info('📊 Setting new filters:', filters);
      dispatch({ type: 'SET_FILTERS', payload: filters });
      // Queries will automatically refetch when filters change
    } else {
      logger.debug('📊 Filters unchanged, skipping update');
    }
  }, [filtersString]);

  const clearFilters = useCallback(() => {
    logger.info('📊 Clearing all filters');
    dispatch({ type: 'SET_FILTERS', payload: {} });
  }, []);

  // Utility actions
  const refreshData = useCallback(async () => {
    if (!state.isAuthenticated) {
      logger.warn('🔐 Refresh data attempted without authentication');
      return;
    }

    logger.info('🔄 Refreshing all data');
    await Promise.all([
      costsQuery.refetch(),
      allocationQuery.refetch(),
    ]);
  }, [state.isAuthenticated, costsQuery, allocationQuery]);

  const setError = useCallback((error: string | null) => {
    if (error) {
      logger.error('❌ Error set:', error);
    } else {
      logger.debug('✅ Error cleared');
    }
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // ✅ Enhanced state with query data
  const enhancedState: OperationalCostState = {
    ...state,
    costs: costsQuery.data || [],
    allocationSettings: allocationQuery.data || null,
    summary,
    loading: {
      ...state.loading,
      costs: costsQuery.isLoading,
      allocation: allocationQuery.isLoading,
    },
    error: state.error || costsQuery.error?.message || allocationQuery.error?.message || null,
  };

  // Context value
  const contextValue: OperationalCostContextType = useMemo(() => ({
    state: enhancedState,
    actions: {
      loadCosts,
      createCost,
      updateCost,
      deleteCost,
      loadAllocationSettings,
      saveAllocationSettings,
      calculateOverhead: calculateOverheadQuery,
      setFilters,
      clearFilters,
      refreshData,
      setError,
    },
  }), [
    enhancedState,
    loadCosts,
    createCost,
    updateCost,
    deleteCost,
    loadAllocationSettings,
    saveAllocationSettings,
    calculateOverheadQuery,
    setFilters,
    clearFilters,
    refreshData,
    setError,
  ]);

  logger.debug('🎯 Context value prepared:', {
    costsCount: enhancedState.costs.length,
    hasAllocationSettings: !!enhancedState.allocationSettings,
    loadingStates: enhancedState.loading,
    hasError: !!enhancedState.error
  });

  return (
    <OperationalCostContext.Provider value={contextValue}>
      {children}
    </OperationalCostContext.Provider>
  );
};

// Hook to use the context
export const useOperationalCost = () => {
  const context = useContext(OperationalCostContext);
  if (context === undefined) {
    throw new Error('useOperationalCost must be used within an OperationalCostProvider');
  }
  return context;
};

// Export context for testing
export { OperationalCostContext };