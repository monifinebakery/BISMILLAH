import { useQuery } from '@tanstack/react-query';
import { recipeApi } from '../services/recipeApi';
import { logger } from '@/utils/logger';
import { RECIPE_QUERY_KEYS } from './RecipeNavigationContainer';

export const useRecipeQueries = () => {
  // Recipe data query
  const recipesQuery = useQuery({
    queryKey: RECIPE_QUERY_KEYS.lists(),
    queryFn: async () => {
      try {
        logger.component('RecipeQueries', 'Fetching recipes...');
        const result = await recipeApi.getRecipes();

        const recipes = Array.isArray(result) ? result :
                       result?.data ? (Array.isArray(result.data) ? result.data : []) : [];

        logger.success('Recipes fetched:', { count: recipes.length });
        return recipes;
      } catch (error) {
        logger.error('Failed to fetch recipes:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to load recipes');
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  // Categories query
  const categoriesQuery = useQuery({
    queryKey: RECIPE_QUERY_KEYS.categories(),
    queryFn: async () => {
      try {
        logger.component('RecipeQueries', 'Fetching categories...');
        const result = await recipeApi.getUniqueCategories();

        const categories = Array.isArray(result) ? result :
                          result?.data ? (Array.isArray(result.data) ? result.data : []) :
                          [];

        logger.success('Categories fetched:', { count: categories.length });
        return categories;
      } catch (error) {
        logger.error('Failed to fetch categories:', error);
        return [];
      }
    },
    enabled: recipesQuery.isSuccess,
    staleTime: 10 * 60 * 1000,
  });

  return {
    recipesQuery,
    categoriesQuery,
    recipes: recipesQuery.data || [],
    categories: categoriesQuery.data || [],
    isLoading: recipesQuery.isLoading,
    error: recipesQuery.error?.message,
  };
};
