import { useEffect } from 'react';
import type { QueryClient } from '@tanstack/react-query';

import { recipeApi } from '@/components/recipe/services/recipeApi';
import { logger } from '@/utils/logger';

import { recipeQueryKeys } from './queryKeys';

export const useRecipeRealtimeSync = (userId: string | undefined, queryClient: QueryClient) => {
  useEffect(() => {
    if (!userId) return;

    logger.debug('RecipeContext: Setting up real-time subscription for user:', userId);

    const unsubscribe = recipeApi.setupRealtimeSubscription(
      () => {
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });
      },
      () => {
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });
      },
      () => {
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
        queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });
      }
    );

    return () => {
      logger.debug('RecipeContext: Cleaning up real-time subscription');
      unsubscribe();
    };
  }, [userId, queryClient]);
};
