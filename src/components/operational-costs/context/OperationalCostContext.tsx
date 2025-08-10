// src/components/operational-costs/context/OperationalCostContext.tsx

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
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
  | { type: 'SET_COSTS'; payload: OperationalCost[] }
  | { type: 'ADD_COST'; payload: OperationalCost }
  | { type: 'UPDATE_COST'; payload: OperationalCost }
  | { type: 'DELETE_COST'; payload: string }
  | { type: 'SET_ALLOCATION_SETTINGS'; payload: AllocationSettings | null }
  | { type: 'SET_SUMMARY'; payload: CostSummary }
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

    case 'SET_COSTS':
      return {
        ...state,
        costs: action.payload,
        summary: transformCostsToSummary(action.payload),
        error: null,
      };

    case 'ADD_COST':
      const newCosts = [...state.costs, action.payload];
      return {
        ...state,
        costs: newCosts,
        summary: transformCostsToSummary(newCosts),
      };

    case 'UPDATE_COST':
      const updatedCosts = state.costs.map(cost =>
        cost.id === action.payload.id ? action.payload : cost
      );
      return {
        ...state,
        costs: updatedCosts,
        summary: transformCostsToSummary(updatedCosts),
      };

    case 'DELETE_COST':
      const filteredCosts = state.costs.filter(cost => cost.id !== action.payload);
      return {
        ...state,
        costs: filteredCosts,
        summary: transformCostsToSummary(filteredCosts),
      };

    case 'SET_ALLOCATION_SETTINGS':
      return {
        ...state,
        allocationSettings: action.payload,
        error: null,
      };

    case 'SET_SUMMARY':
      return {
        ...state,
        summary: action.payload,
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

  // Helper function to set loading state
  const setLoading = useCallback((key: keyof OperationalCostState['loading'], value: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, value } });
  }, []);

  // ✅ useQuery: Load Costs
  const costsQuery = useQuery({
    queryKey: OPERATIONAL_COST_QUERY_KEYS.costs(state.filters),
    queryFn: async () => {
      const response = await operationalCostApi.getCosts(state.filters);
      if (response.error) {
        throw new Error(response.error);
      }
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
      const response = await allocationApi.getSettings();
      if (response.error && !response.error.includes('tidak ditemukan')) {
        throw new Error(response.error);
      }
      return response.data;
    },
    enabled: state.isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // ✅ Mutations for CRUD operations
  const createCostMutation = useMutation({
    mutationFn: async (data: CostFormData) => {
      const response = await operationalCostApi.createCost(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (newCost) => {
      dispatch({ type: 'ADD_COST', payload: newCost });
      // Invalidate and refetch costs
      queryClient.invalidateQueries({ queryKey: OPERATIONAL_COST_QUERY_KEYS.costs() });
    },
    onError: (error: Error) => {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Gagal menambahkan biaya operasional' });
    },
  });

  const updateCostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CostFormData> }) => {
      const response = await operationalCostApi.updateCost(id, data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (updatedCost) => {
      dispatch({ type: 'UPDATE_COST', payload: updatedCost });
      // Invalidate and refetch costs
      queryClient.invalidateQueries({ queryKey: OPERATIONAL_COST_QUERY_KEYS.costs() });
    },
    onError: (error: Error) => {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Gagal memperbarui biaya operasional' });
    },
  });

  const deleteCostMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await operationalCostApi.deleteCost(id);
      if (response.error) {
        throw new Error(response.error);
      }
      return id;
    },
    onSuccess: (deletedId) => {
      dispatch({ type: 'DELETE_COST', payload: deletedId });
      // Invalidate and refetch costs
      queryClient.invalidateQueries({ queryKey: OPERATIONAL_COST_QUERY_KEYS.costs() });
    },
    onError: (error: Error) => {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Gagal menghapus biaya operasional' });
    },
  });

  const saveAllocationMutation = useMutation({
    mutationFn: async (data: AllocationFormData) => {
      const response = await allocationApi.upsertSettings(data);
      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (settings) => {
      dispatch({ type: 'SET_ALLOCATION_SETTINGS', payload: settings });
      // Invalidate and refetch allocation settings
      queryClient.invalidateQueries({ queryKey: OPERATIONAL_COST_QUERY_KEYS.allocationSettings() });
    },
    onError: (error: Error) => {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Gagal menyimpan pengaturan alokasi' });
    },
  });

  // ✅ Manual overhead calculation with useQuery pattern
  const calculateOverheadQuery = useCallback(async (materialCost: number = 0) => {
    if (!state.isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return;
    }

    try {
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

      dispatch({ type: 'SET_OVERHEAD_CALCULATION', payload: data });
    } catch (error) {
      logger.error('Error calculating overhead:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Gagal menghitung overhead' });
    } finally {
      setLoading('overhead', false);
    }
  }, [state.isAuthenticated, queryClient, setLoading]);

  // ✅ Update state when queries complete
  useEffect(() => {
    if (costsQuery.data) {
      dispatch({ type: 'SET_COSTS', payload: costsQuery.data });
    }
    if (costsQuery.error) {
      dispatch({ type: 'SET_ERROR', payload: costsQuery.error.message || 'Gagal memuat data biaya operasional' });
    }
    // Update loading state
    setLoading('costs', costsQuery.isLoading);
  }, [costsQuery.data, costsQuery.error, costsQuery.isLoading, setLoading]);

  useEffect(() => {
    if (allocationQuery.data) {
      dispatch({ type: 'SET_ALLOCATION_SETTINGS', payload: allocationQuery.data });
    }
    if (allocationQuery.error) {
      dispatch({ type: 'SET_ERROR', payload: allocationQuery.error.message || 'Gagal memuat pengaturan alokasi' });
    }
    // Update loading state
    setLoading('allocation', allocationQuery.isLoading);
  }, [allocationQuery.data, allocationQuery.error, allocationQuery.isLoading, setLoading]);

  // ✅ SIMPLIFIED: Auth state management
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
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
        dispatch({ type: 'SET_AUTH_STATE', payload: isAuthenticated });
        
        if (event === 'SIGNED_OUT') {
          dispatch({ type: 'RESET_STATE' });
          // Clear all queries when user signs out
          queryClient.clear();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // ✅ Legacy wrapper functions to maintain API compatibility
  const loadCosts = useCallback(async (filters?: CostFilters) => {
    if (filters) {
      dispatch({ type: 'SET_FILTERS', payload: filters });
    }
    // The query will automatically refetch when filters change
    await costsQuery.refetch();
  }, [costsQuery]);

  const loadAllocationSettings = useCallback(async () => {
    await allocationQuery.refetch();
  }, [allocationQuery]);

  const createCost = useCallback(async (data: CostFormData): Promise<boolean> => {
    if (!state.isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return false;
    }

    try {
      await createCostMutation.mutateAsync(data);
      return true;
    } catch (error) {
      return false;
    }
  }, [state.isAuthenticated, createCostMutation]);

  const updateCost = useCallback(async (id: string, data: Partial<CostFormData>): Promise<boolean> => {
    if (!state.isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return false;
    }

    try {
      await updateCostMutation.mutateAsync({ id, data });
      return true;
    } catch (error) {
      return false;
    }
  }, [state.isAuthenticated, updateCostMutation]);

  const deleteCost = useCallback(async (id: string): Promise<boolean> => {
    if (!state.isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return false;
    }

    try {
      await deleteCostMutation.mutateAsync(id);
      return true;
    } catch (error) {
      return false;
    }
  }, [state.isAuthenticated, deleteCostMutation]);

  const saveAllocationSettings = useCallback(async (data: AllocationFormData): Promise<boolean> => {
    if (!state.isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return false;
    }

    try {
      await saveAllocationMutation.mutateAsync(data);
      return true;
    } catch (error) {
      return false;
    }
  }, [state.isAuthenticated, saveAllocationMutation]);

  // Filter actions
  const setFilters = useCallback((filters: CostFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
    // Queries will automatically refetch when filters change
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'SET_FILTERS', payload: {} });
  }, []);

  // Utility actions
  const refreshData = useCallback(async () => {
    if (!state.isAuthenticated) {
      return;
    }

    await Promise.all([
      costsQuery.refetch(),
      allocationQuery.refetch(),
    ]);
  }, [state.isAuthenticated, costsQuery, allocationQuery]);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // Context value
  const contextValue: OperationalCostContextType = {
    state,
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
  };

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