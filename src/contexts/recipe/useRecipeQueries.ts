import { useQuery } from '@tanstack/react-query';

import { recipeApi } from '@/components/recipe/services/recipeApi';
import { recipeQueryKeys } from './queryKeys';

export const useRecipesQuery = (userId?: string) => {
  return useQuery({
    queryKey: recipeQueryKeys.list(),
    queryFn: () => recipeApi.getRecipes(),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
