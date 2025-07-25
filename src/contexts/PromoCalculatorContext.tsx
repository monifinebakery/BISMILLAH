// contexts/PromoCalculatorContext.tsx
import React, { 
  createContext, 
  useContext, 
  useReducer, 
  useCallback, 
  useMemo, 
  useEffect,
  ReactNode 
} from 'react';
import { toast } from 'sonner';

// 📊 Types
interface Recipe {
  id: string;
  namaResep: string;
  hppPerPorsi: number;
  hargaJualPorsi: number;
}

interface PromoEstimation {
  id: string;
  promo_name: string;
  promo_type: string;
  base_recipe_id: string;
  base_recipe_name: string;
  promo_details: any;
  original_price: number;
  original_hpp: number;
  promo_price_effective: number;
  estimated_margin_percent: number;
  estimated_margin_rp: number;
  created_at: string;
}

interface PromoCalculatorState {
  // 📊 Data
  recipes: Recipe[];
  promoEstimations: PromoEstimation[];
  
  // 🎛️ UI State
  selectedRecipeId: string;
  promoType: string;
  discountValue: number;
  bogoBuy: number;
  bogoGet: number;
  promoName: string;
  
  // 📋 Pagination & Selection
  currentPage: number;
  selectedPromos: Set<string>;
  
  // 🔄 Loading States
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  
  // ⚠️ Error States
  error: string | null;
  lastAction: string | null;
}

// 🎯 Action Types
type PromoCalculatorAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_DELETING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_RECIPES'; payload: Recipe[] }
  | { type: 'SET_PROMO_ESTIMATIONS'; payload: PromoEstimation[] }
  | { type: 'ADD_PROMO_ESTIMATION'; payload: PromoEstimation }
  | { type: 'REMOVE_PROMO_ESTIMATIONS'; payload: string[] }
  | { type: 'SET_SELECTED_RECIPE'; payload: string }
  | { type: 'SET_PROMO_TYPE'; payload: string }
  | { type: 'SET_DISCOUNT_VALUE'; payload: number }
  | { type: 'SET_BOGO_BUY'; payload: number }
  | { type: 'SET_BOGO_GET'; payload: number }
  | { type: 'SET_PROMO_NAME'; payload: string }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'SET_SELECTED_PROMOS'; payload: Set<string> }
  | { type: 'RESET_FORM' }
  | { type: 'SET_LAST_ACTION'; payload: string };

// 🏭 Initial State
const initialState: PromoCalculatorState = {
  recipes: [],
  promoEstimations: [],
  selectedRecipeId: '',
  promoType: 'discount_percent',
  discountValue: 0,
  bogoBuy: 2,
  bogoGet: 1,
  promoName: '',
  currentPage: 1,
  selectedPromos: new Set(),
  isLoading: false,
  isSaving: false,
  isDeleting: false,
  error: null,
  lastAction: null
};

// 🔄 Reducer
const promoCalculatorReducer = (
  state: PromoCalculatorState, 
  action: PromoCalculatorAction
): PromoCalculatorState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
      
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
      
    case 'SET_DELETING':
      return { ...state, isDeleting: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'SET_RECIPES':
      return { ...state, recipes: action.payload };
      
    case 'SET_PROMO_ESTIMATIONS':
      return { ...state, promoEstimations: action.payload };
      
    case 'ADD_PROMO_ESTIMATION':
      return { 
        ...state, 
        promoEstimations: [action.payload, ...state.promoEstimations],
        lastAction: 'add'
      };
      
    case 'REMOVE_PROMO_ESTIMATIONS':
      return { 
        ...state, 
        promoEstimations: state.promoEstimations.filter(
          promo => !action.payload.includes(promo.id)
        ),
        selectedPromos: new Set(),
        lastAction: 'delete'
      };
      
    case 'SET_SELECTED_RECIPE':
      return { ...state, selectedRecipeId: action.payload };
      
    case 'SET_PROMO_TYPE':
      return { 
        ...state, 
        promoType: action.payload,
        // Reset discount value when changing type
        discountValue: 0
      };
      
    case 'SET_DISCOUNT_VALUE':
      return { ...state, discountValue: action.payload };
      
    case 'SET_BOGO_BUY':
      return { ...state, bogoBuy: action.payload };
      
    case 'SET_BOGO_GET':
      return { ...state, bogoGet: action.payload };
      
    case 'SET_PROMO_NAME':
      return { ...state, promoName: action.payload };
      
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
      
    case 'SET_SELECTED_PROMOS':
      return { ...state, selectedPromos: action.payload };
      
    case 'RESET_FORM':
      return {
        ...state,
        selectedRecipeId: '',
        promoName: '',
        discountValue: 0,
        bogoBuy: 2,
        bogoGet: 1,
        currentPage: 1,
        selectedPromos: new Set(),
        lastAction: 'reset'
      };
      
    case 'SET_LAST_ACTION':
      return { ...state, lastAction: action.payload };
      
    default:
      return state;
  }
};

// 🎯 Context Interface
interface PromoCalculatorContextType {
  // 📊 State
  state: PromoCalculatorState;
  
  // 🎛️ Actions
  setSelectedRecipe: (recipeId: string) => void;
  setPromoType: (type: string) => void;
  setDiscountValue: (value: number) => void;
  setBogoBuy: (value: number) => void;
  setBogoGet: (value: number) => void;
  setPromoName: (name: string) => void;
  setCurrentPage: (page: number) => void;
  setSelectedPromos: (promos: Set<string>) => void;
  
  // 💾 Data Actions
  savePromoEstimation: (data: Omit<PromoEstimation, 'id' | 'created_at'>) => Promise<boolean>;
  deletePromoEstimations: (ids: string[]) => Promise<boolean>;
  loadRecipes: () => Promise<void>;
  loadPromoEstimations: () => Promise<void>;
  
  // 🔄 Utility Actions
  resetForm: () => void;
  refreshData: () => Promise<void>;
  
  // 📊 Computed Values
  selectedRecipe: Recipe | null;
  paginatedPromos: PromoEstimation[];
  totalPages: number;
}

// 🏗️ Context Creation
const PromoCalculatorContext = createContext<PromoCalculatorContextType | null>(null);

// 🎯 Provider Props
interface PromoCalculatorProviderProps {
  children: ReactNode;
  recipeService?: any; // Inject recipe service
  promoService?: any;  // Inject promo service  
  itemsPerPage?: number;
}

// 🏭 Provider Component
export const PromoCalculatorProvider: React.FC<PromoCalculatorProviderProps> = ({
  children,
  recipeService,
  promoService,
  itemsPerPage = 5
}) => {
  const [state, dispatch] = useReducer(promoCalculatorReducer, initialState);

  // 📊 Computed Values - Memoized for performance
  const selectedRecipe = useMemo(() => {
    return state.recipes.find(recipe => recipe.id === state.selectedRecipeId) || null;
  }, [state.recipes, state.selectedRecipeId]);

  const paginatedPromos = useMemo(() => {
    const startIndex = (state.currentPage - 1) * itemsPerPage;
    return state.promoEstimations.slice(startIndex, startIndex + itemsPerPage);
  }, [state.promoEstimations, state.currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(state.promoEstimations.length / itemsPerPage));
  }, [state.promoEstimations.length, itemsPerPage]);

  // 🎛️ Basic Actions - Memoized callbacks
  const setSelectedRecipe = useCallback((recipeId: string) => {
    dispatch({ type: 'SET_SELECTED_RECIPE', payload: recipeId });
  }, []);

  const setPromoType = useCallback((type: string) => {
    dispatch({ type: 'SET_PROMO_TYPE', payload: type });
  }, []);

  const setDiscountValue = useCallback((value: number) => {
    dispatch({ type: 'SET_DISCOUNT_VALUE', payload: value });
  }, []);

  const setBogoBuy = useCallback((value: number) => {
    dispatch({ type: 'SET_BOGO_BUY', payload: Math.max(1, value) });
  }, []);

  const setBogoGet = useCallback((value: number) => {
    dispatch({ type: 'SET_BOGO_GET', payload: Math.max(0, value) });
  }, []);

  const setPromoName = useCallback((name: string) => {
    dispatch({ type: 'SET_PROMO_NAME', payload: name });
  }, []);

  const setCurrentPage = useCallback((page: number) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: Math.max(1, Math.min(page, totalPages)) });
  }, [totalPages]);

  const setSelectedPromos = useCallback((promos: Set<string>) => {
    dispatch({ type: 'SET_SELECTED_PROMOS', payload: promos });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  // 📊 Data Loading Actions
  const loadRecipes = useCallback(async () => {
    if (!recipeService) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const recipes = await recipeService.getAllRecipes();
      dispatch({ type: 'SET_RECIPES', payload: recipes });
    } catch (error) {
      console.error('Failed to load recipes:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Gagal memuat data resep' });
      toast.error('Gagal memuat data resep');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [recipeService]);

  const loadPromoEstimations = useCallback(async () => {
    if (!promoService) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const promos = await promoService.getAllPromoEstimations();
      dispatch({ type: 'SET_PROMO_ESTIMATIONS', payload: promos });
    } catch (error) {
      console.error('Failed to load promo estimations:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Gagal memuat data estimasi promo' });
      toast.error('Gagal memuat data estimasi promo');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [promoService]);

  // 💾 Save Promo Estimation
  const savePromoEstimation = useCallback(async (
    data: Omit<PromoEstimation, 'id' | 'created_at'>
  ): Promise<boolean> => {
    if (!promoService) return false;
    
    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const savedPromo = await promoService.savePromoEstimation({
        ...data,
        created_at: new Date().toISOString()
      });
      
      dispatch({ type: 'ADD_PROMO_ESTIMATION', payload: savedPromo });
      return true;
    } catch (error) {
      console.error('Failed to save promo estimation:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Gagal menyimpan estimasi promo' });
      return false;
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  }, [promoService]);

  // 🗑️ Delete Promo Estimations
  const deletePromoEstimations = useCallback(async (ids: string[]): Promise<boolean> => {
    if (!promoService) return false;
    
    try {
      dispatch({ type: 'SET_DELETING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      await promoService.deletePromoEstimations(ids);
      dispatch({ type: 'REMOVE_PROMO_ESTIMATIONS', payload: ids });
      return true;
    } catch (error) {
      console.error('Failed to delete promo estimations:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Gagal menghapus estimasi promo' });
      return false;
    } finally {
      dispatch({ type: 'SET_DELETING', payload: false });
    }
  }, [promoService]);

  // 🔄 Refresh All Data
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadRecipes(),
      loadPromoEstimations()
    ]);
  }, [loadRecipes, loadPromoEstimations]);

  // 🚀 Initial Data Load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 📊 Context Value - Memoized for performance
  const contextValue = useMemo<PromoCalculatorContextType>(() => ({
    // State
    state,
    
    // Actions  
    setSelectedRecipe,
    setPromoType,
    setDiscountValue,
    setBogoBuy,
    setBogoGet,
    setPromoName,
    setCurrentPage,
    setSelectedPromos,
    
    // Data Actions
    savePromoEstimation,
    deletePromoEstimations,
    loadRecipes,
    loadPromoEstimations,
    
    // Utility Actions
    resetForm,
    refreshData,
    
    // Computed Values
    selectedRecipe,
    paginatedPromos,
    totalPages
  }), [
    state,
    setSelectedRecipe,
    setPromoType,
    setDiscountValue,
    setBogoBuy,
    setBogoGet,
    setPromoName,
    setCurrentPage,
    setSelectedPromos,
    savePromoEstimation,
    deletePromoEstimations,
    loadRecipes,
    loadPromoEstimations,
    resetForm,
    refreshData,
    selectedRecipe,
    paginatedPromos,
    totalPages
  ]);

  return (
    <PromoCalculatorContext.Provider value={contextValue}>
      {children}
    </PromoCalculatorContext.Provider>
  );
};

// 🎯 Hook to use context
export const usePromoCalculatorContext = (): PromoCalculatorContextType => {
  const context = useContext(PromoCalculatorContext);
  
  if (!context) {
    throw new Error(
      'usePromoCalculatorContext must be used within a PromoCalculatorProvider'
    );
  }
  
  return context;
};

// 🔍 Selector hooks for performance
export const usePromoCalculatorState = () => {
  const { state } = usePromoCalculatorContext();
  return state;
};

export const usePromoCalculatorActions = () => {
  const context = usePromoCalculatorContext();
  const { state, selectedRecipe, paginatedPromos, totalPages, ...actions } = context;
  return actions;
};

export const usePromoCalculatorData = () => {
  const { state, selectedRecipe, paginatedPromos, totalPages } = usePromoCalculatorContext();
  return { state, selectedRecipe, paginatedPromos, totalPages };
};

export default PromoCalculatorContext;