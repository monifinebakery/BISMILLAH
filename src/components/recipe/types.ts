// src/components/recipe/types.ts

export interface BahanResep {
  id?: string;
  nama: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
  warehouseId?: string; // Tambahkan ini
}

// Database format (snake_case)
export interface RecipeDB {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  nama_resep: string;
  jumlah_porsi: number;
  kategori_resep?: string;
  deskripsi?: string;
  foto_url?: string;
  foto_base64?: string;
  bahan_resep: BahanResep[];
  biaya_tenaga_kerja: number;
  biaya_overhead: number;
  margin_keuntungan_persen: number;
  total_hpp: number;
  hpp_per_porsi: number;
  harga_jual_porsi: number;
  jumlah_pcs_per_porsi: number;
  hpp_per_pcs: number;
  harga_jual_per_pcs: number;
}

// Frontend format (camelCase)
export interface Recipe {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  namaResep: string;
  jumlahPorsi: number;
  kategoriResep?: string;
  deskripsi?: string;
  fotoUrl?: string;
  fotoBase64?: string;
  bahanResep: BahanResep[];
  biayaTenagaKerja: number;
  biayaOverhead: number;
  marginKeuntunganPersen: number;
  totalHpp: number;
  hppPerPorsi: number;
  hargaJualPorsi: number;
  jumlahPcsPerPorsi: number;
  hppPerPcs: number;
  hargaJualPerPcs: number;
}

export interface NewRecipe {
  namaResep: string;
  jumlahPorsi: number | string; // Allow string for temporary empty state during editing
  kategoriResep?: string;
  deskripsi?: string;
  fotoUrl?: string;
  fotoBase64?: string;
  bahanResep: BahanResep[];
  biayaTenagaKerja: number;
  biayaOverhead: number;
  marginKeuntunganPersen: number;
  totalHpp?: number;
  hppPerPorsi?: number;
  hargaJualPorsi?: number;
  jumlahPcsPerPorsi?: number | string; // Allow string for temporary empty state during editing
  hppPerPcs?: number;
  hargaJualPerPcs?: number;
}

// HPP Calculation Result
export interface HPPCalculationResult {
  totalBahanBaku: number;
  biayaTenagaKerja: number;
  biayaOverhead: number;
  totalHPP: number;
  hppPerPorsi: number;
  hppPerPcs: number;
  marginKeuntungan: number;
  hargaJualPorsi: number;
  hargaJualPerPcs: number;
  profitabilitas: number;
}

// Form States
export interface RecipeFormData extends NewRecipe {}

export interface RecipeFormErrors {
  [key: string]: string | string[];
}

// Filter & Search
export interface RecipeFilters {
  searchTerm: string;
  categoryFilter: string;
  sortBy: RecipeSortField;
  sortOrder: 'asc' | 'desc';
}

export type RecipeSortField = 
  | 'namaResep' 
  | 'kategoriResep' 
  | 'createdAt' 
  | 'totalHpp' 
  | 'hppPerPorsi' 
  | 'profitabilitas';

// Statistics
export interface RecipeStats {
  totalRecipes: number;
  totalCategories: number;
  averageHppPerPorsi: number;
  mostExpensiveRecipe: Recipe | null;
  cheapestRecipe: Recipe | null;
  categoriesDistribution: { [key: string]: number };
  profitabilityStats: {
    high: number; // > 30%
    medium: number; // 15-30%
    low: number; // < 15%
  };
}

// Pagination
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}

// API Response
export interface RecipeApiResponse {
  data: Recipe[];
  error?: string;
}

// Validation Result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Dialog Props
export interface RecipeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface DeleteRecipeDialogProps extends RecipeDialogProps {
  recipe: Recipe | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export interface DuplicateRecipeDialogProps extends RecipeDialogProps {
  recipe: Recipe | null;
  onConfirm: (newName: string) => Promise<boolean>;
  isLoading?: boolean;
}

// Form Step
export type RecipeFormStep = 'basic' | 'ingredients' | 'costs' | 'review';

export interface RecipeFormStepProps {
  data: RecipeFormData;
  errors: RecipeFormErrors;
  onUpdate: (field: keyof RecipeFormData, value: any) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  isLoading?: boolean;
}

// ✅ UPDATED: No default categories - empty array
export const RECIPE_CATEGORIES: readonly string[] = [] as const;

// Units remain the same as they're more universal
export const RECIPE_UNITS = [
  'kg', 'gram', 'liter', 'ml', 'pcs', 'buah', 
  'bungkus', 'sachet', 'sendok', 'gelas', 'cup'
] as const;

export const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50] as const;

// ✅ UPDATED: Custom type for user-defined categories
export type RecipeCategory = string; // Changed from union type to plain string
export type RecipeUnit = typeof RECIPE_UNITS[number];

// ✅ NEW: Helper functions for category management
export const getCategoriesFromRecipes = (recipes: Recipe[]): string[] => {
  const categories = new Set(
    recipes
      .map(recipe => recipe.kategoriResep)
      .filter((category): category is string => Boolean(category?.trim()))
  );
  return Array.from(categories).sort();
};

export const getCustomCategories = (): string[] => {
  try {
    const saved = localStorage.getItem('recipe_custom_categories');
    if (saved) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch (error) {
    console.error('Error loading custom categories:', error);
    return [];
  }
};

export const saveCustomCategories = (categories: string[]): void => {
  try {
    localStorage.setItem('recipe_custom_categories', JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving custom categories:', error);
  }
};

export const getAllAvailableCategories = (recipes: Recipe[]): string[] => {
  const customCategories = getCustomCategories();
  const usedCategories = getCategoriesFromRecipes(recipes);
  
  // Combine custom and used categories, remove duplicates
  const combined = new Set([...customCategories, ...usedCategories]);
  return Array.from(combined).filter(cat => cat?.trim()).sort();
};

// ✅ NEW: Category validation helpers
export const isValidCategoryName = (name: string): boolean => {
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 50;
};

export const categoryExists = (name: string, existingCategories: string[]): boolean => {
  return existingCategories.some(cat => 
    cat.toLowerCase() === name.trim().toLowerCase()
  );
};