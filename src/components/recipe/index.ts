/ Main components with lazy loading
export { default as RecipesPage } from './RecipesPage/RecipesPage.lazy';
export { RecipeFormLazy as RecipeForm } from './RecipeForm/RecipeForm.lazy';

// Shared components
export { CategoryBadge } from './shared/components/CategoryBadge';
export { PriceDisplay } from './shared/components/PriceDisplay';
export { ActionButtons } from './shared/components/ActionButtons';
export { RecipeCard } from './shared/components/RecipeCard';

// Loading states
export {
  RecipePageLoadingState,
  RecipeTableSkeleton,
  StatsCardsSkeleton,
  RecipeFormSkeleton,
  EmptyRecipeState,
  NoSearchResultsState,
  ErrorState,
  LoadingSpinner,
  ButtonLoadingState
} from './shared/components/LoadingStates';

// Hooks
export { useRecipeActions } from './shared/hooks/useRecipeActions';
export { useRecipeCategories } from './shared/hooks/useRecipeCategories';
export { useRecipeFiltering } from './RecipesPage/hooks/useRecipeFiltering';
export { useRecipePagination } from './RecipesPage/hooks/useRecipePagination';
export { useRecipeStats } from './RecipesPage/hooks/useRecipeStats';

// Utilities
export { formatCurrency, formatPercentage, formatNumber } from './shared/utils/recipeFormatters';
export { 
  calculateRecipe, 
  calculateHppPerPorsi, 
  calculateProfitPerPorsi 
} from './shared/utils/recipeCalculations';
export { 
  validateRecipe, 
  validateIngredient, 
  hasValidationErrors 
} from './shared/utils/recipeValidators';

// Constants
export { 
  RECIPE_SORT_OPTIONS, 
  SORT_ORDERS, 
  PAGINATION_OPTIONS,
  RECIPE_VALIDATION 
} from './shared/constants';

// Types
export type { 
  RecipeSortOption, 
  SortOrder, 
  RecipeFormStep 
} from './shared/constants';
export type { 
  RecipeStats 
} from './RecipesPage/hooks/useRecipeStats';
export type {
  RecipeFilters,
  RecipePaginationState,
  RecipeViewState,
  RecipeDialogState,
  RecipePageActions
} from './RecipesPage/types';

// Components for individual use
export { RecipeHeader } from './RecipesPage/components/RecipeHeader';
export { RecipeStatsCards } from './RecipesPage/components/RecipeStatsCards';
export { RecipeControls } from './RecipesPage/components/RecipeControls';
export { RecipeTable } from './RecipesPage/components/RecipeTable';
export { RecipeTableRow } from './RecipesPage/components/RecipeTableRow';
export { RecipePagination } from './RecipesPage/components/RecipePagination';

// Dialogs
export { DuplicateRecipeDialog } from './dialogs/DuplicateRecipeDialog';
export { CategoryManagerDialog } from './dialogs/CategoryManagerDialog';