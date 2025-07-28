import { useState, useMemo, useCallback } from 'react';
import { Recipe } from '@/types/recipe';
import { useRecipe } from '@/contexts/RecipeContext';

interface UseRecipeSearchProps {
  recipes?: Recipe[];
}

export const useRecipeSearch = ({ recipes: externalRecipes }: UseRecipeSearchProps = {}) => {
  const { recipes: contextRecipes, searchRecipes, getRecipesByCategory } = useRecipe();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const recipes = externalRecipes || contextRecipes;

  // Advanced search with multiple criteria
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return recipes;

    setIsSearching(true);
    
    const query = searchQuery.toLowerCase().trim();
    const results = recipes.filter(recipe => {
      // Search in recipe name
      if (recipe.namaResep.toLowerCase().includes(query)) return true;
      
      // Search in category
      if (recipe.kategoriResep?.toLowerCase().includes(query)) return true;
      
      // Search in description
      if (recipe.deskripsi?.toLowerCase().includes(query)) return true;
      
      // Search in ingredients
      if (recipe.bahanResep?.some(bahan => 
        bahan.nama.toLowerCase().includes(query)
      )) return true;

      return false;
    });

    setIsSearching(false);
    return results;
  }, [recipes, searchQuery]);

  // Search by specific field
  const searchByField = useCallback((field: keyof Recipe, query: string): Recipe[] => {
    if (!query.trim()) return recipes;
    
    const searchTerm = query.toLowerCase().trim();
    return recipes.filter(recipe => {
      const fieldValue = recipe[field];
      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(searchTerm);
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.some(item => 
          typeof item === 'string' && item.toLowerCase().includes(searchTerm)
        );
      }
      return false;
    });
  }, [recipes]);

  // Search by HPP range
  const searchByHppRange = useCallback((minHpp: number, maxHpp: number): Recipe[] => {
    return recipes.filter(recipe => 
      recipe.hppPerPorsi >= minHpp && recipe.hppPerPorsi <= maxHpp
    );
  }, [recipes]);

  // Search by profit range
  const searchByProfitRange = useCallback((minProfit: number, maxProfit: number): Recipe[] => {
    return recipes.filter(recipe => {
      const profit = (recipe.hargaJualPorsi || 0) - (recipe.hppPerPorsi || 0);
      return profit >= minProfit && profit <= maxProfit;
    });
  }, [recipes]);

  // Get search suggestions based on current query
  const getSearchSuggestions = useCallback((query: string, limit: number = 5): string[] => {
    if (!query.trim()) return [];

    const suggestions = new Set<string>();
    const searchTerm = query.toLowerCase();

    // Add recipe name suggestions
    recipes.forEach(recipe => {
      if (recipe.namaResep.toLowerCase().includes(searchTerm)) {
        suggestions.add(recipe.namaResep);
      }
    });

    // Add category suggestions
    recipes.forEach(recipe => {
      if (recipe.kategoriResep?.toLowerCase().includes(searchTerm)) {
        suggestions.add(recipe.kategoriResep);
      }
    });

    // Add ingredient suggestions
    recipes.forEach(recipe => {
      recipe.bahanResep?.forEach(bahan => {
        if (bahan.nama.toLowerCase().includes(searchTerm)) {
          suggestions.add(bahan.nama);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }, [recipes]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const hasResults = searchResults.length > 0;
  const hasQuery = searchQuery.trim().length > 0;

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    hasResults,
    hasQuery,
    // Advanced search functions
    searchByField,
    searchByHppRange,
    searchByProfitRange,
    getSearchSuggestions,
    clearSearch,
    // Context functions (from RecipeContext)
    searchRecipes,
    getRecipesByCategory,
    // Statistics
    totalResults: searchResults.length,
    originalTotal: recipes.length
  };
};