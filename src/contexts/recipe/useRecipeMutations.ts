import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAuth } from '@/contexts/AuthContext';
import { recipeApi } from '@/components/recipe/services/recipeApi';
import type { Recipe, NewRecipe } from '@/components/recipe/types';
import { logger } from '@/utils/logger';

import { recipeQueryKeys } from './queryKeys';

export const useRecipeMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const addMutation = useMutation({
    mutationFn: (data: NewRecipe) => recipeApi.createRecipe(data),
    onMutate: async newRecipe => {
      await queryClient.cancelQueries({
        queryKey: recipeQueryKeys.lists(),
      });

      const previousRecipes = queryClient.getQueryData(recipeQueryKeys.list());

      const optimisticRecipe: Recipe = {
        id: `temp-${Date.now()}`,
        userId: user?.id || '',
        createdAt: new Date(),
        updatedAt: new Date(),
        namaResep: newRecipe.namaResep,
        jumlahPorsi: newRecipe.jumlahPorsi,
        kategoriResep: newRecipe.kategoriResep || '',
        deskripsi: newRecipe.deskripsi || '',
        fotoUrl: newRecipe.fotoUrl || '',
        bahanResep: newRecipe.bahanResep,
        biayaTenagaKerja: newRecipe.biayaTenagaKerja,
        biayaOverhead: newRecipe.biayaOverhead,
        marginKeuntunganPersen: newRecipe.marginKeuntunganPersen,
        totalHpp: newRecipe.totalHpp || 0,
        hppPerPorsi: newRecipe.hppPerPorsi || 0,
        hargaJualPorsi: newRecipe.hargaJualPorsi || 0,
        jumlahPcsPerPorsi: newRecipe.jumlahPcsPerPorsi || 1,
        hppPerPcs: newRecipe.hppPerPcs || 0,
        hargaJualPerPcs: newRecipe.hargaJualPerPcs || 0,
      };

      queryClient.setQueryData(
        recipeQueryKeys.list(),
        (old: Recipe[] = []) =>
          [optimisticRecipe, ...old].sort((a, b) => a.namaResep.localeCompare(b.namaResep))
      );

      return { previousRecipes };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(recipeQueryKeys.list(), context.previousRecipes);
      }

      const errorMessage = error?.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal menambahkan resep: ${errorMessage}`);
    },
    onSuccess: newRecipe => {
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });

      toast.success('Resep berhasil ditambahkan!');
      logger.debug('RecipeContext: Successfully added recipe:', newRecipe.id);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewRecipe> }) =>
      recipeApi.updateRecipe(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: recipeQueryKeys.lists() });

      const previousRecipes = queryClient.getQueryData(recipeQueryKeys.list());

      queryClient.setQueryData(
        recipeQueryKeys.list(),
        (old: Recipe[] = []) =>
          old.map(recipe =>
            recipe.id === id
              ? { ...recipe, ...data, updatedAt: new Date() }
              : recipe
          )
      );

      return { previousRecipes };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(recipeQueryKeys.list(), context.previousRecipes);
      }

      const errorMessage = error?.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal memperbarui resep: ${errorMessage}`);
    },
    onSuccess: updatedRecipe => {
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });

      toast.success('Resep berhasil diperbarui!');
      logger.debug('RecipeContext: Successfully updated recipe:', updatedRecipe.id);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => recipeApi.deleteRecipe(id),
    onMutate: async id => {
      await queryClient.cancelQueries({ queryKey: recipeQueryKeys.lists() });

      const previousRecipes = queryClient.getQueryData(recipeQueryKeys.list()) as Recipe[];
      const recipeToDelete = previousRecipes?.find(r => r.id === id);

      queryClient.setQueryData(
        recipeQueryKeys.list(),
        (old: Recipe[] = []) => old.filter(r => r.id !== id)
      );

      return { previousRecipes, recipeToDelete };
    },
    onError: (error: any, _id, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(recipeQueryKeys.list(), context.previousRecipes);
      }

      const errorMessage = error?.message || 'Terjadi kesalahan sistem';
      toast.error(`Gagal menghapus resep: ${errorMessage}`);
    },
    onSuccess: (_result, id, context) => {
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });

      if (context?.recipeToDelete) {
        toast.success(`Resep "${context.recipeToDelete.namaResep}" berhasil dihapus`);
      } else {
        toast.success('Resep berhasil dihapus');
      }

      logger.debug('RecipeContext: Successfully deleted recipe:', id);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) =>
      recipeApi.duplicateRecipe(id, newName),
    onSuccess: (duplicatedRecipe, { newName }) => {
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });

      toast.success(`Resep "${newName}" berhasil diduplikasi`);
      logger.debug('RecipeContext: Successfully duplicated recipe:', duplicatedRecipe.id);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Gagal menduplikasi resep';
      toast.error(errorMessage);
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => recipeApi.bulkDeleteRecipes(ids),
    onMutate: async ids => {
      await queryClient.cancelQueries({ queryKey: recipeQueryKeys.lists() });

      const previousRecipes = queryClient.getQueryData(recipeQueryKeys.list()) as Recipe[];

      queryClient.setQueryData(
        recipeQueryKeys.list(),
        (old: Recipe[] = []) => old.filter(r => !ids.includes(r.id))
      );

      return { previousRecipes };
    },
    onError: (error: any, _ids, context) => {
      if (context?.previousRecipes) {
        queryClient.setQueryData(recipeQueryKeys.list(), context.previousRecipes);
      }

      const errorMessage = error?.message || 'Gagal menghapus resep';
      toast.error(errorMessage);
    },
    onSuccess: (_result, ids) => {
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.categories() });
      queryClient.invalidateQueries({ queryKey: recipeQueryKeys.stats() });

      toast.success(`${ids.length} resep berhasil dihapus`);
      logger.debug('RecipeContext: Successfully bulk deleted recipes:', ids.length);
    },
  });

  return {
    addMutation,
    updateMutation,
    deleteMutation,
    duplicateMutation,
    bulkDeleteMutation,
  };
};

export type RecipeMutations = ReturnType<typeof useRecipeMutations>;
