// src/components/operational-costs/context/OperationalCostContext.tsx

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
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

  // Helper function to set loading state
  const setLoading = useCallback((key: keyof OperationalCostState['loading'], value: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { key, value } });
  }, []);

  // ✅ SIMPLIFIED: Load initial data when authenticated
  const loadInitialData = useCallback(async () => {
    
    try {
      await Promise.all([
        loadCosts(),
        loadAllocationSettings(),
      ]);
    } catch (error) {
      console.error('📊 Error loading initial data:', error);
    }
  }, []);

  // ✅ SIMPLIFIED: Auth state management
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔐 Auth error:', error);
          if (mounted) {
            dispatch({ type: 'SET_AUTH_STATE', payload: false });
            dispatch({ type: 'SET_ERROR', payload: 'Gagal memverifikasi autentikasi' });
          }
          return;
        }

        const isAuthenticated = !!session?.user;
        
        if (mounted) {
          dispatch({ type: 'SET_AUTH_STATE', payload: isAuthenticated });
          
          // Load data if authenticated
          if (isAuthenticated) {
            setTimeout(() => {
              if (mounted) {
                loadInitialData();
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error('🔐 Error initializing auth:', error);
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
        
        if (event === 'SIGNED_IN' && isAuthenticated) {
          setTimeout(() => {
            if (mounted) {
              loadInitialData();
            }
          }, 100);
        } else if (event === 'SIGNED_OUT') {
          dispatch({ type: 'RESET_STATE' });
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadInitialData]);

  // Cost actions
  const loadCosts = useCallback(async (filters?: CostFilters) => {
    
    try {
      setLoading('costs', true);
      const response = await operationalCostApi.getCosts(filters);
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
      } else {
        dispatch({ type: 'SET_COSTS', payload: response.data });
      }
    } catch (error) {
      console.error('💰 Error loading costs:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Gagal memuat data biaya operasional' });
    } finally {
      setLoading('costs', false);
    }
  }, [setLoading]);

  const createCost = useCallback(async (data: CostFormData): Promise<boolean> => {
    if (!state.isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return false;
    }

    try {
      const response = await operationalCostApi.createCost(data);
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return false;
      } else {
        dispatch({ type: 'ADD_COST', payload: response.data });
        return true;
      }
    } catch (error) {
      console.error('Error creating cost:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Gagal menambahkan biaya operasional' });
      return false;
    }
  }, [state.isAuthenticated]);

  const updateCost = useCallback(async (id: string, data: Partial<CostFormData>): Promise<boolean> => {
    if (!state.isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return false;
    }

    try {
      const response = await operationalCostApi.updateCost(id, data);
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return false;
      } else {
        dispatch({ type: 'UPDATE_COST', payload: response.data });
        return true;
      }
    } catch (error) {
      console.error('Error updating cost:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Gagal memperbarui biaya operasional' });
      return false;
    }
  }, [state.isAuthenticated]);

  const deleteCost = useCallback(async (id: string): Promise<boolean> => {
    if (!state.isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return false;
    }

    try {
      const response = await operationalCostApi.deleteCost(id);
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return false;
      } else {
        dispatch({ type: 'DELETE_COST', payload: id });
        return true;
      }
    } catch (error) {
      console.error('Error deleting cost:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Gagal menghapus biaya operasional' });
      return false;
    }
  }, [state.isAuthenticated]);

  // Allocation actions
  const loadAllocationSettings = useCallback(async () => {
    
    try {
      setLoading('allocation', true);
      const response = await allocationApi.getSettings();
      
      if (response.error && !response.error.includes('tidak ditemukan')) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
      } else {
        dispatch({ type: 'SET_ALLOCATION_SETTINGS', payload: response.data });
      }
    } catch (error) {
      console.error('⚙️ Error loading allocation settings:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Gagal memuat pengaturan alokasi' });
    } finally {
      setLoading('allocation', false);
    }
  }, [setLoading]);

  const saveAllocationSettings = useCallback(async (data: AllocationFormData): Promise<boolean> => {
    if (!state.isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return false;
    }

    try {
      const response = await allocationApi.upsertSettings(data);
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
        return false;
      } else {
        dispatch({ type: 'SET_ALLOCATION_SETTINGS', payload: response.data });
        return true;
      }
    } catch (error) {
      console.error('Error saving allocation settings:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Gagal menyimpan pengaturan alokasi' });
      return false;
    }
  }, [state.isAuthenticated]);

  // Calculation actions
  const calculateOverhead = useCallback(async (materialCost: number = 0) => {
    if (!state.isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return;
    }

    try {
      setLoading('overhead', true);
      const response = await calculationApi.calculateOverhead(materialCost);
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
      } else {
        dispatch({ type: 'SET_OVERHEAD_CALCULATION', payload: response.data });
      }
    } catch (error) {
      console.error('Error calculating overhead:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Gagal menghitung overhead' });
    } finally {
      setLoading('overhead', false);
    }
  }, [setLoading, state.isAuthenticated]);

  // Filter actions
  const setFilters = useCallback((filters: CostFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
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
      loadCosts(state.filters),
      loadAllocationSettings(),
    ]);
  }, [loadCosts, loadAllocationSettings, state.filters, state.isAuthenticated]);

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
      calculateOverhead,
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