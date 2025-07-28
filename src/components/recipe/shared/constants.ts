// src/components/recipe/shared/constants.ts

export const RECIPE_SORT_OPTIONS = {
  NAME: 'name',
  HPP: 'hpp',
  PROFIT: 'profit',
  CREATED: 'created'
} as const;

export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc'
} as const;

export const PAGINATION_OPTIONS = [10, 25, 50, 100] as const;

export const DEFAULT_PAGINATION = {
  ITEMS_PER_PAGE: 10,
  CURRENT_PAGE: 1
} as const;

export const RECIPE_VALIDATION = {
  MIN_NAME_LENGTH: 3,
  MAX_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 0,
  MAX_DESCRIPTION_LENGTH: 500,
  MIN_PORTIONS: 1,
  MAX_PORTIONS: 1000,
  MIN_PRICE: 0,
  MAX_PRICE: 10000000
} as const;

export const RECIPE_CALCULATION = {
  PRECISION: 2,
  DEFAULT_MARGIN: 0.3 // 30%
} as const;

export const UI_CONSTANTS = {
  SEARCH_DEBOUNCE_MS: 300,
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 200
} as const;

export const RECIPE_FORM_STEPS = {
  BASIC_INFO: 'basic-info',
  INGREDIENTS: 'ingredients',
  PRICING: 'pricing',
  PREVIEW: 'preview'
} as const;

export type RecipeSortOption = typeof RECIPE_SORT_OPTIONS[keyof typeof RECIPE_SORT_OPTIONS];
export type SortOrder = typeof SORT_ORDERS[keyof typeof SORT_ORDERS];
export type RecipeFormStep = typeof RECIPE_FORM_STEPS[keyof typeof RECIPE_FORM_STEPS];