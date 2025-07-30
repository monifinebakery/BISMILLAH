// src/components/operational-costs/context/OperationalCostContext.tsx

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
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
    auth: boolean; // ✅ Add auth loading state
  };
  error: string | null;
  isAuthenticated: boolean; // ✅ Add auth state
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
  | { type: 'SET_AUTH_STATE'; payload: boolean } // ✅ Add auth action
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
    auth: true, // ✅ Start with auth loading
  },
  error: null,
  isAuthenticated: false, // ✅ Start as not authenticated
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

    case 'SET_AUTH_STATE': // ✅ Handle auth state change
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
    // Cost actions
    loadCosts: (filters?: CostFilters) => Promise<void>;
    createCost: (data: CostFormData) => Promise<boolean>;
    updateCost: (id: string, data: Partial<CostFormData>) => Promise<boolean>;
    deleteCost: (id: string) => Promise<boolean>;
    
    // Allocation actions
    loadAllocationSettings: () => Promise<void>;
    saveAllocationSettings: (data: AllocationFormData) => Promise<boolean>;
    
    // Calculation actions
    calculateOverhead: (materialCost?: number) => Promise<void>;
    
    // Filter actions
    setFilters: (filters: CostFilters) => void;
    clearFilters: () => void;
    
    // Utility actions
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

  // ✅ Auth state management
  useEffect(() => {
    let mounted = true;
    let initialLoadDone = false; // ✅ ADD FLAG to prevent duplicate loads

    const checkAuthState = async () => {
      console.log('🔐 Checking auth state...'); // ✅ ADD DEBUG
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('🔐 Session:', session); // ✅ ADD DEBUG
        console.log('🔐 Error:', error); // ✅ ADD DEBUG
        
        if (mounted) {
          if (error) {
            console.error('Auth error:', error);
            dispatch({ type: 'SET_AUTH_STATE', payload: false });
            dispatch({ type: 'SET_ERROR', payload: 'Gagal memverifikasi autentikasi' });
          } else {
            const isAuthenticated = !!session?.user;
            console.log('🔐 Is authenticated:', isAuthenticated); // ✅ ADD DEBUG
            
            dispatch({ type: 'SET_AUTH_STATE', payload: isAuthenticated });
            
            // Only load data if authenticated and not already loaded
            if (isAuthenticated && !initialLoadDone) {
              console.log('🔐 Loading initial data (first time)...'); // ✅ ADD DEBUG
              initialLoadDone = true; // ✅ MARK as loaded
              
              // Small delay to ensure auth state is fully set
              setTimeout(() => {
                if (mounted) {
                  loadInitialData();
                }
              }, 100);
            }
          }
        }
      } catch (error) {
        console.error('🔐 Error checking auth state:', error); // ✅ ENHANCED DEBUG
        if (mounted) {
          dispatch({ type: 'SET_AUTH_STATE', payload: false });
          dispatch({ type: 'SET_ERROR', payload: 'Gagal memverifikasi autentikasi' });
        }
      }
    };

    checkAuthState();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state changed:', event, !!session?.user); // ✅ ADD DEBUG
        
        if (mounted) {
          const isAuthenticated = !!session?.user;
          
          // ✅ SKIP INITIAL_SESSION to prevent race condition
          if (event === 'INITIAL_SESSION') {
            console.log('🔐 Skipping INITIAL_SESSION event to prevent race condition'); // ✅ ADD DEBUG
            return;
          }
          
          dispatch({ type: 'SET_AUTH_STATE', payload: isAuthenticated });
          
          if (event === 'SIGNED_IN' && isAuthenticated) {
            console.log('🔐 User signed in, loading data...'); // ✅ ADD DEBUG
            initialLoadDone = true; // ✅ MARK as loaded
            
            // Load data when user signs in
            setTimeout(() => {
              if (mounted) {
                loadInitialData();
              }
            }, 100);
          } else if (event === 'SIGNED_OUT') {
            console.log('🔐 User signed out, clearing data...'); // ✅ ADD DEBUG
            initialLoadDone = false; // ✅ RESET flag
            // Clear data when user signs out
            dispatch({ type: 'RESET_STATE' });
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ✅ Load initial data only when authenticated
  const loadInitialData = useCallback(async () => {
    console.log('📊 loadInitialData called, authenticated:', state.isAuthenticated); // ✅ ADD DEBUG
    
    if (!state.isAuthenticated) {
      console.log('📊 Not authenticated, skipping data load'); // ✅ ADD DEBUG
      return;
    }

    try {
      console.log('📊 Loading costs and allocation settings...'); // ✅ ADD DEBUG
      await Promise.all([
        loadCosts(state.filters),
        loadAllocationSettings(),
      ]);
      console.log('📊 Data loaded successfully'); // ✅ ADD DEBUG
    } catch (error) {
      console.error('📊 Error loading initial data:', error); // ✅ ADD DEBUG
      dispatch({ type: 'SET_ERROR', payload: 'Gagal memuat data awal' });
    }
  }, [state.isAuthenticated, state.filters]);

  // Cost actions
  const loadCosts = useCallback(async (filters?: CostFilters) => {
    console.log('💰 loadCosts called, authenticated:', state.isAuthenticated); // ✅ ADD DEBUG
    
    if (!state.isAuthenticated) {
      console.log('💰 Not authenticated, cannot load costs'); // ✅ ADD DEBUG
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return;
    }

    try {
      console.log('💰 Setting loading to true'); // ✅ ADD DEBUG
      setLoading('costs', true);
      
      console.log('💰 Calling API with filters:', filters); // ✅ ADD DEBUG
      const response = await operationalCostApi.getCosts(filters);
      
      console.log('💰 API response:', response); // ✅ ADD DEBUG
      
      if (response.error) {
        console.log('💰 API returned error:', response.error); // ✅ ADD DEBUG
        dispatch({ type: 'SET_ERROR', payload: response.error });
      } else {
        console.log('💰 Setting costs data:', response.data.length, 'items'); // ✅ ADD DEBUG
        dispatch({ type: 'SET_COSTS', payload: response.data });
      }
    } catch (error) {
      console.error('💰 Error loading costs:', error); // ✅ ENHANCED DEBUG
      dispatch({ type: 'SET_ERROR', payload: 'Gagal memuat data biaya operasional' });
    } finally {
      console.log('💰 Setting loading to false'); // ✅ ADD DEBUG
      setLoading('costs', false);
    }
  }, [setLoading, state.isAuthenticated]);

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
    console.log('⚙️ loadAllocationSettings called, authenticated:', state.isAuthenticated); // ✅ ADD DEBUG
    
    if (!state.isAuthenticated) {
      console.log('⚙️ Not authenticated, cannot load allocation settings'); // ✅ ADD DEBUG
      dispatch({ type: 'SET_ERROR', payload: 'Silakan login terlebih dahulu' });
      return;
    }

    try {
      console.log('⚙️ Setting loading to true'); // ✅ ADD DEBUG
      setLoading('allocation', true);
      
      console.log('⚙️ Calling allocation API'); // ✅ ADD DEBUG
      const response = await allocationApi.getSettings();
      
      console.log('⚙️ Allocation API response:', response); // ✅ ADD DEBUG
      
      if (response.error) {
        console.log('⚙️ Allocation API error:', response.error); // ✅ ADD DEBUG
        // Don't show error for "no settings found" case
        if (!response.error.includes('tidak ditemukan')) {
          dispatch({ type: 'SET_ERROR', payload: response.error });
        }
      } else {
        console.log('⚙️ Setting allocation settings:', response.data); // ✅ ADD DEBUG
        dispatch({ type: 'SET_ALLOCATION_SETTINGS', payload: response.data });
      }
    } catch (error) {
      console.error('⚙️ Error loading allocation settings:', error); // ✅ ENHANCED DEBUG
      dispatch({ type: 'SET_ERROR', payload: 'Gagal memuat pengaturan alokasi' });
    } finally {
      console.log('⚙️ Setting loading to false'); // ✅ ADD DEBUG
      setLoading('allocation', false);
    }
  }, [setLoading, state.isAuthenticated]);

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
    console.log('🔄 refreshData called, authenticated:', state.isAuthenticated); // ✅ ADD DEBUG
    
    if (!state.isAuthenticated) {
      console.log('🔄 Not authenticated, skipping refresh'); // ✅ ADD DEBUG
      return;
    }

    console.log('🔄 Refreshing all data...'); // ✅ ADD DEBUG
    
    try {
      await Promise.all([
        loadCosts(state.filters),
        loadAllocationSettings(),
      ]);
      console.log('🔄 Data refresh completed successfully'); // ✅ ADD DEBUG
    } catch (error) {
      console.error('🔄 Error during data refresh:', error); // ✅ ADD DEBUG
    }
  }, [loadCosts, loadAllocationSettings, state.filters, state.isAuthenticated]);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // Context value
  const contextValue: OperationalCostContextType = {
    state,
    actions: {
      // Cost actions
      loadCosts,
      createCost,
      updateCost,
      deleteCost,
      
      // Allocation actions
      loadAllocationSettings,
      saveAllocationSettings,
      
      // Calculation actions
      calculateOverhead,
      
      // Filter actions
      setFilters,
      clearFilters,
      
      // Utility actions
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