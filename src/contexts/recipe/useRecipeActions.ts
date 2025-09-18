import { useCallback } from 'react';
import { toast } from 'sonner';

import type {
  Recipe,
  NewRecipe,
  HPPCalculationResult,
  BahanResep,
} from '@/components/recipe/types';
import { getAllAvailableCategories } from '@/components/recipe/types';
import { logger } from '@/utils/logger';

import type { RecipeMutations } from './useRecipeMutations';

type CalculateHPP = (
  bahanResep: BahanResep[],
  jumlahPorsi: number,
  biayaTenagaKerja: number,
  biayaOverhead: number,
  marginKeuntunganPersen: number,
  jumlahPcsPerPorsi?: number
) => HPPCalculationResult;

type ValidateRecipeData = (recipe: Partial<NewRecipe>) => { isValid: boolean; errors: string[] };

type UseRecipeActionsParams = {
  userId?: string;
  recipes: Recipe[];
  refetch: () => Promise<any>;
  calculateHPP: CalculateHPP;
  validateRecipeData: ValidateRecipeData;
  mutations: RecipeMutations;
};

type UseRecipeActionsResult = {
  addRecipe: (recipe: NewRecipe) => Promise<boolean>;
  updateRecipe: (id: string, updates: Partial<NewRecipe>, skipAutoCalculation?: boolean) => Promise<boolean>;
  deleteRecipe: (id: string) => Promise<boolean>;
  duplicateRecipe: (id: string, newName: string) => Promise<boolean>;
  bulkDeleteRecipes: (ids: string[]) => Promise<boolean>;
  searchRecipes: (query: string) => Recipe[];
  getRecipesByCategory: (category: string) => Recipe[];
  getUniqueCategories: () => string[];
  getRecipeStats: () => {
    totalRecipes: number;
    totalCategories: number;
    averageHppPerPorsi: number;
    mostExpensiveRecipe: Recipe | null;
    cheapestRecipe: Recipe | null;
    profitabilityStats: { high: number; medium: number; low: number };
  };
  refreshRecipes: () => Promise<void>;
  clearError: () => void;
  isMutating: boolean;
};

export const useRecipeActions = ({
  userId,
  recipes,
  refetch,
  calculateHPP,
  validateRecipeData,
  mutations,
}: UseRecipeActionsParams): UseRecipeActionsResult => {
  const {
    addMutation,
    updateMutation,
    deleteMutation,
    duplicateMutation,
    bulkDeleteMutation,
  } = mutations;

  const addRecipe = useCallback(async (recipeData: NewRecipe): Promise<boolean> => {
    if (!userId) {
      toast.error('User tidak ditemukan');
      return false;
    }

    const validation = validateRecipeData(recipeData);
    if (!validation.isValid) {
      const errorMessage = `Data resep tidak valid: ${validation.errors.join(', ')}`;
      toast.error(errorMessage);
      return false;
    }

    let finalRecipeData = { ...recipeData };
    if (!finalRecipeData.totalHpp || !finalRecipeData.hppPerPorsi) {
      try {
        const { calculateEnhancedHPP, getCurrentAppSettings } = await import(
          '@/components/operational-costs/utils/enhancedHppCalculations'
        );
        const settings = await getCurrentAppSettings();
        const hasOperationalCosts =
          (settings?.overhead_per_pcs && settings.overhead_per_pcs > 0) ||
          (settings?.operasional_per_pcs && settings.operasional_per_pcs > 0);

        if (hasOperationalCosts) {
          logger.info('💡 Using operational costs for recipe calculation');

          const enhancedResult = await calculateEnhancedHPP(
            (finalRecipeData.bahanResep || []).map(bahan => ({
              nama: bahan.nama,
              jumlah: bahan.jumlah,
              satuan: bahan.satuan,
              hargaSatuan: bahan.hargaSatuan,
              totalHarga: bahan.totalHarga,
              warehouseId: bahan.warehouseId,
            })),
            finalRecipeData.jumlahPorsi || 1,
            finalRecipeData.jumlahPcsPerPorsi || 1,
            {
              mode: 'markup',
              percentage: finalRecipeData.marginKeuntunganPersen || 0,
            },
            true
          );

          finalRecipeData = {
            ...finalRecipeData,
            totalHpp: enhancedResult.totalHPP,
            hppPerPorsi: enhancedResult.hppPerPorsi,
            hargaJualPorsi: enhancedResult.hargaJualPerPorsi,
            hppPerPcs: enhancedResult.hppPerPcs,
            hargaJualPerPcs: enhancedResult.hargaJualPerPcs,
            biayaOverhead: enhancedResult.overheadPerPcs,
            biayaTenagaKerja: 0,
          };
        } else {
          logger.info('⚠️ No operational costs configured, using legacy calculation');
          const calculation = calculateHPP(
            finalRecipeData.bahanResep || [],
            finalRecipeData.jumlahPorsi || 1,
            finalRecipeData.biayaTenagaKerja || 0,
            finalRecipeData.biayaOverhead || 0,
            finalRecipeData.marginKeuntunganPersen || 0,
            finalRecipeData.jumlahPcsPerPorsi || 1
          );

          finalRecipeData = {
            ...finalRecipeData,
            totalHpp: calculation.totalHPP,
            hppPerPorsi: calculation.hppPerPorsi,
            hargaJualPorsi: calculation.hargaJualPorsi,
            hppPerPcs: calculation.hppPerPcs,
            hargaJualPerPcs: calculation.hargaJualPerPcs,
          };
        }
      } catch (error) {
        logger.warn('Enhanced calculation failed, using legacy calculation:', error);
        const calculation = calculateHPP(
          finalRecipeData.bahanResep || [],
          finalRecipeData.jumlahPorsi || 1,
          finalRecipeData.biayaTenagaKerja || 0,
          finalRecipeData.biayaOverhead || 0,
          finalRecipeData.marginKeuntunganPersen || 0,
          finalRecipeData.jumlahPcsPerPorsi || 1
        );

        finalRecipeData = {
          ...finalRecipeData,
          totalHpp: calculation.totalHPP,
          hppPerPorsi: calculation.hppPerPorsi,
          hargaJualPorsi: calculation.hargaJualPorsi,
          hppPerPcs: calculation.hppPerPcs,
          hargaJualPerPcs: calculation.hargaJualPerPcs,
        };
      }
    }

    try {
      await addMutation.mutateAsync(finalRecipeData);
      return true;
    } catch (error) {
      return false;
    }
  }, [userId, addMutation, calculateHPP, validateRecipeData]);

  const updateRecipe = useCallback(
    async (
      id: string,
      updates: Partial<NewRecipe>,
      skipAutoCalculation: boolean = false
    ): Promise<boolean> => {
      if (!userId) {
        toast.error('User tidak ditemukan');
        return false;
      }

      let finalUpdates = { ...updates };
      const existingRecipe = recipes.find(r => r.id === id);

      if (
        !skipAutoCalculation &&
        existingRecipe &&
        (
          updates.bahanResep !== undefined ||
          updates.jumlahPorsi !== undefined ||
          updates.biayaTenagaKerja !== undefined ||
          updates.biayaOverhead !== undefined ||
          updates.marginKeuntunganPersen !== undefined ||
          updates.jumlahPcsPerPorsi !== undefined
        )
      ) {
        const bahanResep = updates.bahanResep ?? existingRecipe.bahanResep;
        const jumlahPorsi = updates.jumlahPorsi ?? existingRecipe.jumlahPorsi;
        const biayaTenagaKerja = updates.biayaTenagaKerja ?? existingRecipe.biayaTenagaKerja;
        const biayaOverhead = updates.biayaOverhead ?? existingRecipe.biayaOverhead;
        const marginKeuntunganPersen =
          updates.marginKeuntunganPersen ?? existingRecipe.marginKeuntunganPersen;
        const jumlahPcsPerPorsi = updates.jumlahPcsPerPorsi ?? existingRecipe.jumlahPcsPerPorsi;

        try {
          const { calculateEnhancedHPP, getCurrentAppSettings } = await import(
            '@/components/operational-costs/utils/enhancedHppCalculations'
          );
          const settings = await getCurrentAppSettings();
          const hasOperationalCosts =
            (settings?.overhead_per_pcs && settings.overhead_per_pcs > 0) ||
            (settings?.operasional_per_pcs && settings.operasional_per_pcs > 0);

          if (hasOperationalCosts) {
            logger.info('💡 Auto-updating recipe with operational costs');

            const enhancedResult = await calculateEnhancedHPP(
              (bahanResep || []).map(bahan => ({
                nama: bahan.nama,
                jumlah: bahan.jumlah,
                satuan: bahan.satuan,
                hargaSatuan: bahan.hargaSatuan,
                totalHarga: bahan.totalHarga,
                warehouseId: bahan.warehouseId,
              })),
              jumlahPorsi,
              jumlahPcsPerPorsi,
              {
                mode: 'markup',
                percentage: marginKeuntunganPersen,
              },
              true
            );

            finalUpdates = {
              ...finalUpdates,
              totalHpp: enhancedResult.totalHPP,
              hppPerPorsi: enhancedResult.hppPerPorsi,
              hargaJualPorsi: enhancedResult.hargaJualPerPorsi,
              hppPerPcs: enhancedResult.hppPerPcs,
              hargaJualPerPcs: enhancedResult.hargaJualPerPcs,
              biayaOverhead: enhancedResult.overheadPerPcs,
              biayaTenagaKerja: 0,
            };
          } else {
            const calculation = calculateHPP(
              bahanResep,
              jumlahPorsi,
              biayaTenagaKerja,
              biayaOverhead,
              marginKeuntunganPersen,
              jumlahPcsPerPorsi
            );

            finalUpdates = {
              ...finalUpdates,
              totalHpp: calculation.totalHPP,
              hppPerPorsi: calculation.hppPerPorsi,
              hargaJualPorsi: calculation.hargaJualPorsi,
              hppPerPcs: calculation.hppPerPcs,
              hargaJualPerPcs: calculation.hargaJualPerPcs,
            };
          }
        } catch (error) {
          logger.warn('Auto-calculation failed, using legacy calculation:', error);
          const calculation = calculateHPP(
            bahanResep,
            jumlahPorsi,
            biayaTenagaKerja,
            biayaOverhead,
            marginKeuntunganPersen,
            jumlahPcsPerPorsi
          );

          finalUpdates = {
            ...finalUpdates,
            totalHpp: calculation.totalHPP,
            hppPerPorsi: calculation.hppPerPorsi,
            hargaJualPorsi: calculation.hargaJualPorsi,
            hppPerPcs: calculation.hppPerPcs,
            hargaJualPerPcs: calculation.hargaJualPerPcs,
          };
        }
      }

      try {
        await updateMutation.mutateAsync({ id, data: finalUpdates });
        return true;
      } catch (error) {
        return false;
      }
    },
    [userId, recipes, updateMutation, calculateHPP]
  );

  const deleteRecipe = useCallback(
    async (id: string): Promise<boolean> => {
      if (!userId) {
        toast.error('User tidak ditemukan');
        return false;
      }

      try {
        await deleteMutation.mutateAsync(id);
        return true;
      } catch (error) {
        return false;
      }
    },
    [userId, deleteMutation]
  );

  const duplicateRecipe = useCallback(
    async (id: string, newName: string): Promise<boolean> => {
      if (!userId) {
        toast.error('User tidak ditemukan');
        return false;
      }

      try {
        await duplicateMutation.mutateAsync({ id, newName });
        return true;
      } catch (error) {
        return false;
      }
    },
    [userId, duplicateMutation]
  );

  const bulkDeleteRecipes = useCallback(
    async (ids: string[]): Promise<boolean> => {
      if (!userId) {
        toast.error('User tidak ditemukan');
        return false;
      }

      if (ids.length === 0) {
        toast.error('Tidak ada resep yang dipilih');
        return false;
      }

      try {
        await bulkDeleteMutation.mutateAsync(ids);
        return true;
      } catch (error) {
        return false;
      }
    },
    [userId, bulkDeleteMutation]
  );

  const searchRecipes = useCallback(
    (query: string): Recipe[] => {
      if (!query.trim()) return recipes;
      const q = query.toLowerCase();
      return recipes.filter((r: any) => {
        const nama = (r.nama_resep ?? r.namaResep ?? '').toString().toLowerCase();
        const kategori = (r.kategori_resep ?? r.kategoriResep ?? '').toString().toLowerCase();
        const deskripsi = (r.deskripsi ?? '').toString().toLowerCase();
        const bahanArr = (r.bahan_resep ?? r.bahanResep ?? []) as Array<any>;
        const bahanMatch =
          Array.isArray(bahanArr) &&
          bahanArr.some(b => String(b?.nama ?? '').toLowerCase().includes(q));
        return nama.includes(q) || kategori.includes(q) || deskripsi.includes(q) || !!bahanMatch;
      });
    },
    [recipes]
  );

  const getRecipesByCategory = useCallback(
    (category: string): Recipe[] => {
      if (!category.trim()) return recipes;
      return recipes.filter((r: any) => (r.kategori_resep ?? r.kategoriResep) === category);
    },
    [recipes]
  );

  const getUniqueCategories = useCallback((): string[] => {
    return getAllAvailableCategories(recipes);
  }, [recipes]);

  const getRecipeStats = useCallback(() => {
    const totalRecipes = recipes.length;
    const categories = getUniqueCategories();
    const totalCategories = categories.length;

    const hppValues = recipes
      .map((r: any) => (r.hpp_per_porsi ?? r.hppPerPorsi) as number)
      .filter((hpp: any) => Number(hpp) > 0);
    const averageHppPerPorsi =
      hppValues.length > 0 ? hppValues.reduce((sum, hpp) => sum + hpp, 0) / hppValues.length : 0;

    const recipesWithHpp = recipes.filter(
      (r: any) => Number(r.hpp_per_porsi ?? r.hppPerPorsi) > 0
    ) as any[];
    const mostExpensiveRecipe =
      recipesWithHpp.length > 0
        ? recipesWithHpp.reduce((max: any, recipe: any) =>
            (recipe.hpp_per_porsi ?? recipe.hppPerPorsi) > (max.hpp_per_porsi ?? max.hppPerPorsi)
              ? recipe
              : max
          )
        : null;

    const cheapestRecipe =
      recipesWithHpp.length > 0
        ? recipesWithHpp.reduce((min: any, recipe: any) =>
            (recipe.hpp_per_porsi ?? recipe.hppPerPorsi) < (min.hpp_per_porsi ?? min.hppPerPorsi)
              ? recipe
              : min
          )
        : null;

    const profitabilityStats = { high: 0, medium: 0, low: 0 };
    recipes.forEach((recipe: any) => {
      const profitability = (recipe.margin_keuntungan_persen ?? recipe.marginKeuntunganPersen ?? 0) as number;
      if (profitability >= 30) {
        profitabilityStats.high++;
      } else if (profitability >= 15) {
        profitabilityStats.medium++;
      } else {
        profitabilityStats.low++;
      }
    });

    return {
      totalRecipes,
      totalCategories,
      averageHppPerPorsi,
      mostExpensiveRecipe,
      cheapestRecipe,
      profitabilityStats,
    };
  }, [recipes, getUniqueCategories]);

  const refreshRecipes = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const clearError = useCallback(() => {
    // Placeholder for compatibility with previous API
  }, []);

  const isMutating =
    addMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    duplicateMutation.isPending ||
    bulkDeleteMutation.isPending;

  return {
    addRecipe,
    updateRecipe,
    deleteRecipe,
    duplicateRecipe,
    bulkDeleteRecipes,
    searchRecipes,
    getRecipesByCategory,
    getUniqueCategories,
    getRecipeStats,
    refreshRecipes,
    clearError,
    isMutating,
  };
};
