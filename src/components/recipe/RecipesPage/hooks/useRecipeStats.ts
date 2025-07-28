import { useMemo } from 'react';
import { Recipe } from '@/types/recipe';

interface UseRecipeStatsProps {
  recipes: Recipe[];
}

export interface RecipeStats {
  totalRecipes: number;
  totalHPP: number;
  avgHppPerPorsi: number;
  avgHppPerPcs: number;
  avgProfit: number;
  avgProfitMargin: number;
  totalValue: number;
  categoriesCount: number;
  mostExpensiveRecipe?: Recipe;
  cheapestRecipe?: Recipe;
  highestProfitRecipe?: Recipe;
  lowestProfitRecipe?: Recipe;
}

export const useRecipeStats = ({ recipes }: UseRecipeStatsProps): RecipeStats => {
  return useMemo(() => {
    if (recipes.length === 0) {
      return {
        totalRecipes: 0,
        totalHPP: 0,
        avgHppPerPorsi: 0,
        avgHppPerPcs: 0,
        avgProfit: 0,
        avgProfitMargin: 0,
        totalValue: 0,
        categoriesCount: 0
      };
    }

    const totalRecipes = recipes.length;
    
    // Calculate totals
    const totalHPP = recipes.reduce((sum, recipe) => sum + (recipe.totalHpp || 0), 0);
    const totalHppPerPorsi = recipes.reduce((sum, recipe) => sum + (recipe.hppPerPorsi || 0), 0);
    const totalHppPerPcs = recipes.reduce((sum, recipe) => sum + (recipe.hppPerPcs || 0), 0);
    const totalProfit = recipes.reduce((sum, recipe) => {
      return sum + ((recipe.hargaJualPorsi || 0) - (recipe.hppPerPorsi || 0));
    }, 0);
    const totalValue = recipes.reduce((sum, recipe) => sum + (recipe.hargaJualPorsi || 0), 0);

    // Calculate averages
    const avgHppPerPorsi = totalHppPerPorsi / totalRecipes;
    const avgHppPerPcs = totalHppPerPcs / totalRecipes;
    const avgProfit = totalProfit / totalRecipes;
    const avgProfitMargin = totalValue > 0 ? (totalProfit / totalValue) * 100 : 0;

    // Get unique categories count
    const categoriesCount = new Set(
      recipes
        .map(recipe => recipe.kategoriResep)
        .filter(category => category && category.trim() !== '')
    ).size;

    // Find extreme values
    const recipesWithProfit = recipes.map(recipe => ({
      ...recipe,
      profit: (recipe.hargaJualPorsi || 0) - (recipe.hppPerPorsi || 0)
    }));

    const mostExpensiveRecipe = recipes.reduce((prev, current) => 
      (current.hppPerPorsi || 0) > (prev.hppPerPorsi || 0) ? current : prev
    );

    const cheapestRecipe = recipes.reduce((prev, current) => 
      (current.hppPerPorsi || 0) < (prev.hppPerPorsi || 0) ? current : prev
    );

    const highestProfitRecipe = recipesWithProfit.reduce((prev, current) => 
      current.profit > prev.profit ? current : prev
    );

    const lowestProfitRecipe = recipesWithProfit.reduce((prev, current) => 
      current.profit < prev.profit ? current : prev
    );

    return {
      totalRecipes,
      totalHPP,
      avgHppPerPorsi,
      avgHppPerPcs,
      avgProfit,
      avgProfitMargin,
      totalValue,
      categoriesCount,
      mostExpensiveRecipe,
      cheapestRecipe,
      highestProfitRecipe,
      lowestProfitRecipe
    };
  }, [recipes]);
};