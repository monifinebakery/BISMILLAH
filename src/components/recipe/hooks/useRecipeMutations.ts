import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { recipeApi } from '../services/recipeApi';
import { logger } from '@/utils/logger';
import { RECIPE_QUERY_KEYS } from '../components/RecipeNavigationContainer';
import type { Recipe, NewRecipe } from '../types';

export const useRecipeMutations = () => {
  const queryClient = useQueryClient();

  // Delete mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: async (id: string) => {
      logger.component('RecipeMutations', 'Deleting recipe:', id);
      const result = await recipeApi.deleteRecipe(id);
      return { id, result };
    },
    onSuccess: ({ id }) => {
      // Update query data optimistically
      queryClient.setQueryData(
        RECIPE_QUERY_KEYS.lists(),
        (oldData: Recipe[] | undefined) => {
          if (!oldData) return [];
          return oldData.filter(recipe => recipe.id !== id);
        }
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.categories() });
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });

      const deletedRecipe = queryClient.getQueryData<Recipe[]>(RECIPE_QUERY_KEYS.lists())?.find(recipe => recipe.id === id) as any;
      const nama = deletedRecipe ? (deletedRecipe.nama_resep ?? deletedRecipe.namaResep ?? 'Unknown') : 'Unknown';
      toast.success(`Resep "${nama}" berhasil dihapus`);
    },
    onError: (error: Error) => {
      logger.error('Error deleting recipe:', error);
      toast.error(error.message || 'Gagal menghapus resep');
    },
  });

  // Duplicate mutation
  const duplicateRecipeMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      logger.component('RecipeMutations', 'Duplicating recipe:', { id, newName });
      const result = await recipeApi.duplicateRecipe(id, newName);

      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from duplicate API');
      }

      return result;
    },
    onSuccess: (newRecipe) => {
      // Update query data optimistically
      queryClient.setQueryData(
        RECIPE_QUERY_KEYS.lists(),
        (oldData: Recipe[] | undefined) => {
          if (!oldData) return [newRecipe];
          return [newRecipe, ...oldData];
        }
      );

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.categories() });
      queryClient.invalidateQueries({ queryKey: RECIPE_QUERY_KEYS.all });

      const anyRec: any = newRecipe as any;
      const namaBaru = anyRec.nama_resep ?? anyRec.namaResep ?? 'Berhasil';
      toast.success(`Resep "${namaBaru}" berhasil diduplikasi`);
    },
    onError: (error: Error) => {
      logger.error('Error duplicating recipe:', error);
      toast.error(error.message || 'Gagal menduplikasi resep');
    },
  });

  return {
    deleteRecipeMutation,
    duplicateRecipeMutation,
    isProcessing: deleteRecipeMutation.isPending || duplicateRecipeMutation.isPending,
  };
};
