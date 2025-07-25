// types/promo.ts - Interface & Type Definitions

// 🍽️ Recipe Types
export interface Recipe {
  id: string;
  namaResep: string;
  hppPerPorsi: number;
  hargaJualPorsi: number;
  kategori?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// 🎯 Promo Types
export type PromoType = 'discount_percent' | 'discount_rp' | 'bogo';

export interface BasePromoDetails {
  type: PromoType;
}

export interface DiscountPercentDetails extends BasePromoDetails {
  type: 'discount_percent';
  value: number; // 0-100
}

export interface DiscountRpDetails extends BasePromoDetails {
  type: 'discount_rp';
  value: number; // Amount in Rupiah
}

export interface BOGODetails extends BasePromoDetails {
  type: 'bogo';
  buy: number;
  get: number;
}

export type PromoDetails = DiscountPercentDetails | DiscountRpDetails | BOGODetails;

// 📊 Promo Estimation
export interface PromoEstimation {
  id: string;
  promo_name: string;
  promo_type: PromoType;
  base_recipe_id: string;
  base_recipe_name: string;
  promo_details: PromoDetails;
  original_price: number;
  original_hpp: number;
  promo_price_effective: number;
  estimated_margin_percent: number;
  estimated_margin_rp: number;
  created_at: string;
}

// 🔢 Calculation Types
export interface CalculationInput {
  originalPrice: number;
  originalHpp: number;
  promoType: PromoType;
  discountValue: number;
  bogoBuy: number;
  bogoGet: number;
}

export interface CalculationResult {
  price: number;
  marginRp: number;
  marginPercent: number;
  details: PromoDetails;
  isNegativeMargin: boolean;
  discountAmount?: number;
  discountPercent?: number;
}

// 🎛️ Form State Types
export interface PromoFormState {
  selectedRecipeId: string;
  promoType: PromoType;
  discountValue: number;
  bogoBuy: number;
  bogoGet: number;
  promoName: string;
}

export interface FormErrors {
  [key: string]: string | undefined;
}

// 📄 Pagination Types
export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationData<T> {
  items: T[];
  pagination: PaginationState;
  hasNext: boolean;
  hasPrev: boolean;
}

// ✅ Selection Types
export interface SelectionState<T = string> {
  selectedItems: Set<T>;
  isAllSelected: boolean;
  selectedCount: number;
}

// 🔄 Loading States
export interface LoadingState {
  isLoading: boolean;
  isCalculating: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  error?: string | null;
}

// 📊 Component Props Types
export interface ProductSelectionProps {
  recipes: Recipe[];
  selectedRecipeId: string;
  onRecipeSelect: (recipeId: string) => void;
  loading?: boolean;
}

export interface PromoConfigurationProps {
  promoType: PromoType;
  discountValue: number;
  bogoBuy: number;
  bogoGet: number;
  onPromoTypeChange: (type: PromoType) => void;
  onDiscountValueChange: (value: number) => void;
  onBOGOChange: (buy: number, get: number) => void;
  disabled?: boolean;
}

export interface CalculationResultsProps {
  result: CalculationResult | null;
  recipe: Recipe | null;
  promoName: string;
  onPromoNameChange: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

export interface PromoHistoryTableProps {
  estimations: PromoEstimation[];
  selectedItems: SelectionState<string>;
  onSelectionChange: (selection: SelectionState<string>) => void;
  onDelete: (ids: string[]) => void;
  loading?: boolean;
}

export interface PaginationControlsProps {
  pagination: PaginationState;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

// 🎯 Hook Return Types
export interface UsePromoStateReturn {
  formState: PromoFormState;
  updateFormState: (updates: Partial<PromoFormState>) => void;
  resetForm: () => void;
  errors: FormErrors;
  isValid: boolean;
}

export interface UsePaginationReturn<T> {
  paginatedData: PaginationData<T>;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setItemsPerPage: (count: number) => void;
}

export interface UseSelectionReturn<T> {
  selection: SelectionState<T>;
  toggleItem: (item: T) => void;
  toggleAll: (items: T[]) => void;
  clearSelection: () => void;
  selectItems: (items: T[]) => void;
}

// 🔧 Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 🎨 Theme Types
export interface PromoTheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

// Type Guards
export const isDiscountPercent = (details: PromoDetails): details is DiscountPercentDetails => {
  return details.type === 'discount_percent';
};

export const isDiscountRp = (details: PromoDetails): details is DiscountRpDetails => {
  return details.type === 'discount_rp';
};

export const isBOGO = (details: PromoDetails): details is BOGODetails => {
  return details.type === 'bogo';
};