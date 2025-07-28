// src/components/recipe/RecipesPage/types.ts

import { Recipe } from '@/types/recipe';
import { RecipeSortOption, SortOrder } from '../shared/constants';

export interface RecipeFilters {
  searchTerm: string;
  categoryFilter: string;
  sortBy: RecipeSortOption;
  sortOrder: SortOrder;
}

export interface RecipePaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

export interface RecipeViewState {
  filters: RecipeFilters;
  pagination: RecipePaginationState;
  selectedRecipes: string[];
  viewMode: 'table' | 'cards';
}

export interface RecipeDialogState {
  isFormOpen: boolean;
  isCategoryDialogOpen: boolean;
  isDuplicateDialogOpen: boolean;
  editingRecipe: Recipe | null;
  duplicatingRecipe: Recipe | null;
}

export interface RecipePageActions {
  // Form actions
  openRecipeForm: (recipe?: Recipe) => void;
  closeRecipeForm: () => void;
  
  // Category actions
  openCategoryDialog: () => void;
  closeCategoryDialog: () => void;
  
  // Duplicate actions
  openDuplicateDialog: (recipe: Recipe) => void;
  closeDuplicateDialog: () => void;
  
  // Recipe CRUD actions
  handleSaveRecipe: (recipeData: any) => Promise<void>;
  handleDeleteRecipe: (recipe: Recipe) => Promise<void>;
  handleDuplicateRecipe: (newName: string) => Promise<boolean>;
  
  // Filter actions
  handleSearchChange: (term: string) => void;
  handleCategoryFilterChange: (category: string) => void;
  handleSortChange: (field: RecipeSortOption) => void;
  clearFilters: () => void;
  
  // Pagination actions
  handlePageChange: (page: number) => void;
  handleItemsPerPageChange: (itemsPerPage: number) => void;
  
  // Selection actions
  handleSelectRecipe: (recipeId: string) => void;
  handleSelectAll: () => void;
  clearSelection: () => void;
  
  // View actions
  handleViewModeChange: (mode: 'table' | 'cards') => void;
}

export interface RecipeTableColumn {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (recipe: Recipe) => React.ReactNode;
}

export interface RecipeCardData {
  id: string;
  title: string;
  category?: string;
  description?: string;
  portions: number;
  hppPerPortion: number;
  hppPerPiece?: number;
  sellingPricePerPortion: number;
  sellingPricePerPiece?: number;
  profit: number;
  profitMargin: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeBulkAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  action: (recipeIds: string[]) => Promise<void>;
  confirmationMessage?: string;
  requiresConfirmation?: boolean;
  variant?: 'default' | 'destructive';
}

export interface RecipeExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeIngredients: boolean;
  includeCalculations: boolean;
  includePricing: boolean;
  selectedRecipes?: string[];
}

export interface RecipeImportResult {
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    message: string;
  }>;
  duplicates: Array<{
    name: string;
    action: 'skip' | 'overwrite' | 'rename';
  }>;
}