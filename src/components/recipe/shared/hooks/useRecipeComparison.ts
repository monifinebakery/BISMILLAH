import { useMemo } from 'react';
import { Recipe } from '@/types/recipe';

interface RecipeComparison {
  recipe: Recipe;
  hppDifference: number;
  profitDifference: number;
  marginDifference: number;
  isMoreExpensive: boolean;
  isProfitable: boolean;
  recommendation: string;
}

export const useRecipeComparison = (recipes: Recipe[]) => {
  
  const compareRecipes = useMemo(() => (recipeIds: string[]): RecipeComparison[] => {
    const selectedRecipes = recipes.filter(recipe => recipeIds.includes(recipe.id));
    
    if (selectedRecipes.length < 2) return [];

    // Calculate averages for comparison
    const avgHpp = selectedRecipes.reduce((sum, recipe) => sum + recipe.hppPerPorsi, 0) / selectedRecipes.length;
    const avgProfit = selectedRecipes.reduce((sum, recipe) => {
      const profit = (recipe.hargaJualPorsi || 0) - recipe.hppPerPorsi;
      return sum + profit;
    }, 0) / selectedRecipes.length;

    return selectedRecipes.map(recipe => {
      const profit = (recipe.hargaJualPorsi || 0) - recipe.hppPerPorsi;
      const margin = recipe.hargaJualPorsi > 0 ? (profit / recipe.hargaJualPorsi) * 100 : 0;
      const avgMargin = selectedRecipes.reduce((sum, r) => {
        const p = (r.hargaJualPorsi || 0) - r.hppPerPorsi;
        const m = r.hargaJualPorsi > 0 ? (p / r.hargaJualPorsi) * 100 : 0;
        return sum + m;
      }, 0) / selectedRecipes.length;

      let recommendation = '';
      if (recipe.hppPerPorsi > avgHpp && profit < avgProfit) {
        recommendation = 'Pertimbangkan untuk mengurangi biaya atau menaikkan harga';
      } else if (recipe.hppPerPorsi < avgHpp && profit > avgProfit) {
        recommendation = 'Resep ini memiliki efisiensi biaya yang baik';
      } else if (profit < 0) {
        recommendation = 'Resep ini merugi, perlu review harga jual';
      } else {
        recommendation = 'Performa resep dalam rata-rata';
      }

      return {
        recipe,
        hppDifference: recipe.hppPerPorsi - avgHpp,
        profitDifference: profit - avgProfit,
        marginDifference: margin - avgMargin,
        isMoreExpensive: recipe.hppPerPorsi > avgHpp,
        isProfitable: profit > 0,
        recommendation
      };
    });
  }, [recipes]);

  const findSimilarRecipes = useMemo(() => (targetRecipe: Recipe, tolerance: number = 0.1): Recipe[] => {
    const targetHpp = targetRecipe.hppPerPorsi;
    const minHpp = targetHpp * (1 - tolerance);
    const maxHpp = targetHpp * (1 + tolerance);

    return recipes.filter(recipe => 
      recipe.id !== targetRecipe.id && 
      recipe.hppPerPorsi >= minHpp && 
      recipe.hppPerPorsi <= maxHpp
    );
  }, [recipes]);

  const getBestPerformingRecipes = useMemo(() => (limit: number = 5): Recipe[] => {
    return recipes
      .map(recipe => ({
        ...recipe,
        profit: (recipe.hargaJualPorsi || 0) - recipe.hppPerPorsi,
        margin: recipe.hargaJualPorsi > 0 ? 
          (((recipe.hargaJualPorsi || 0) - recipe.hppPerPorsi) / recipe.hargaJualPorsi) * 100 : 0
      }))
      .filter(recipe => recipe.profit > 0)
      .sort((a, b) => b.margin - a.margin)
      .slice(0, limit);
  }, [recipes]);

  const getWorstPerformingRecipes = useMemo(() => (limit: number = 5): Recipe[] => {
    return recipes
      .map(recipe => ({
        ...recipe,
        profit: (recipe.hargaJualPorsi || 0) - recipe.hppPerPorsi,
        margin: recipe.hargaJualPorsi > 0 ? 
          (((recipe.hargaJualPorsi || 0) - recipe.hppPerPorsi) / recipe.hargaJualPorsi) * 100 : 0
      }))
      .sort((a, b) => a.margin - b.margin)
      .slice(0, limit);
  }, [recipes]);

  return {
    compareRecipes,
    findSimilarRecipes,
    getBestPerformingRecipes,
    getWorstPerformingRecipes
  };
};