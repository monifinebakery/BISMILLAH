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
  };
  error: string | null;
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
  },
  error: null,
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

    case 'RESET_STATE':
      return initialState;

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
      dispatch({ type: 'SET_ERROR', payload: 'Gagal memuat data biaya operasional' });
    } finally {
      setLoading('costs', false);
    }
  }, [setLoading]);

  const createCost = useCallback(async (data: CostFormData): Promise<boolean> => {
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
      dispatch({ type: 'SET_ERROR', payload: 'Gagal menambahkan biaya operasional' });
      return false;
    }
  }, []);

  const updateCost = useCallback(async (id: string, data: Partial<CostFormData>): Promise<boolean> => {
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
      dispatch({ type: 'SET_ERROR', payload: 'Gagal memperbarui biaya operasional' });
      return false;
    }
  }, []);

  const deleteCost = useCallback(async (id: string): Promise<boolean> => {
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
      dispatch({ type: 'SET_ERROR', payload: 'Gagal menghapus biaya operasional' });
      return false;
    }
  }, []);

  // Allocation actions
  const loadAllocationSettings = useCallback(async () => {
    try {
      setLoading('allocation', true);
      const response = await allocationApi.getSettings();
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
      } else {
        dispatch({ type: 'SET_ALLOCATION_SETTINGS', payload: response.data });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Gagal memuat pengaturan alokasi' });
    } finally {
      setLoading('allocation', false);
    }
  }, [setLoading]);

  const saveAllocationSettings = useCallback(async (data: AllocationFormData): Promise<boolean> => {
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
      dispatch({ type: 'SET_ERROR', payload: 'Gagal menyimpan pengaturan alokasi' });
      return false;
    }
  }, []);

  // Calculation actions
  const calculateOverhead = useCallback(async (materialCost: number = 0) => {
    try {
      setLoading('overhead', true);
      const response = await calculationApi.calculateOverhead(materialCost);
      
      if (response.error) {
        dispatch({ type: 'SET_ERROR', payload: response.error });
      } else {
        dispatch({ type: 'SET_OVERHEAD_CALCULATION', payload: response.data });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Gagal menghitung overhead' });
    } finally {
      setLoading('overhead', false);
    }
  }, [setLoading]);

  // Filter actions
  const setFilters = useCallback((filters: CostFilters) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const clearFilters = useCallback(() => {
    dispatch({ type: 'SET_FILTERS', payload: {} });
  }, []);

  // Utility actions
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadCosts(state.filters),
      loadAllocationSettings(),
    ]);
  }, [loadCosts, loadAllocationSettings, state.filters]);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []); // Only run once on mount

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