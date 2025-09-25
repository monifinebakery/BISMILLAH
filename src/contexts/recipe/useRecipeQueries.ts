import { useQuery } from '@tanstack/react-query';

import { recipeApi } from '@/components/recipe/services/recipeApi';
import { recipeQueryKeys } from './queryKeys';

export const useRecipesQuery = (userId?: string) => {
  return useQuery({
    queryKey: recipeQueryKeys.list(),
    queryFn: () => recipeApi.getRecipes(),
    enabled: !!userId,
    staleTime: 15 * 60 * 1000, // 15 minutes - reduced excessive fetching
    gcTime: 20 * 60 * 1000, // 20 minutes - longer cache retention
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 2; // Reduced retries for performance
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 15000),
  });
};
