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
  jumlahPorsi: number;
  kategoriResep?: string;
  deskripsi?: string;
  fotoUrl?: string;
  bahanResep: BahanResep[];
  biayaTenagaKerja: number;
  biayaOverhead: number;
  marginKeuntunganPersen: number;
  totalHpp?: number;
  hppPerPorsi?: number;
  hargaJualPorsi?: number;
  jumlahPcsPerPorsi?: number;
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

// Constants
export const RECIPE_CATEGORIES = [
  'Makanan Utama',
  'Makanan Ringan',
  'Minuman',
  'Dessert',
  'Appetizer',
  'Sup',
  'Salad',
  'Kue',
  'Roti',
  'Lainnya'
] as const;

export const RECIPE_UNITS = [
  'kg', 'gram', 'liter', 'ml', 'pcs', 'buah', 
  'bungkus', 'sachet', 'sendok', 'gelas', 'cup'
] as const;

export const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50] as const;

export type RecipeCategory = typeof RECIPE_CATEGORIES[number];
export type RecipeUnit = typeof RECIPE_UNITS[number];