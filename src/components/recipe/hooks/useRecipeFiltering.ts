// src/components/recipe/hooks/useRecipeFiltering.ts

import { useState, useMemo, useCallback } from 'react';
import { searchRecipes, filterRecipesByCategory, sortRecipes } from '../services/recipeUtils';
import type { Recipe, RecipeSortField } from '../types';

interface UseRecipeFilteringProps {
  recipes: Recipe[];
}

export const useRecipeFiltering = ({ recipes }: UseRecipeFilteringProps) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<RecipeSortField>('namaResep');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return searchTerm.trim() !== '' || categoryFilter !== 'all';
  }, [searchTerm, categoryFilter]);

  // Apply all filters and sorting
  const filteredAndSortedRecipes = useMemo(() => {
    let result = [...recipes];

    // Apply search filter
    if (searchTerm.trim()) {
      result = searchRecipes(result, searchTerm);
    }

    // Apply category filter
    if (categoryFilter && categoryFilter !== 'all') {
      result = filterRecipesByCategory(result, categoryFilter);
    }

    // Apply sorting
    result = sortRecipes(result, sortBy, sortOrder);

    return result;
  }, [recipes, searchTerm, categoryFilter, sortBy, sortOrder]);

  // Handle sorting
  const handleSort = useCallback((field: RecipeSortField) => {
    if (field === sortBy) {
      // Toggle sort order if same field
      setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with ascending order
      setSortBy(field);
      setSortOrder('asc');
    }
  }, [sortBy]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSortBy('namaResep');
    setSortOrder('asc');
  }, []);

  // Set search term with debounce effect
  const setSearchTermDebounced = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Filter by specific category
  const filterByCategory = useCallback((category: string) => {
    setCategoryFilter(category === '' ? 'all' : category);
  }, []);

  // Get unique categories from current recipes
  const availableCategories = useMemo(() => {
    const categories = new Set(
      recipes
        .map(recipe => recipe.kategoriResep)
        .filter((category): category is string => Boolean(category))
    );
    return Array.from(categories).sort();
  }, [recipes]);

  // Search within current filtered results
  const searchInResults = useCallback((query: string) => {
    if (!query.trim()) return filteredAndSortedRecipes;
    return searchRecipes(filteredAndSortedRecipes, query);
  }, [filteredAndSortedRecipes]);

  // Get recipes matching search term in specific fields
  const searchByField = useCallback((
    query: string, 
    field: 'namaResep' | 'kategoriResep' | 'deskripsi' | 'bahanResep'
  ) => {
    if (!query.trim()) return recipes;

    const lowercaseQuery = query.toLowerCase();
    
    return recipes.filter(recipe => {
      switch (field) {
        case 'namaResep':
          return recipe.namaResep.toLowerCase().includes(lowercaseQuery);
        case 'kategoriResep':
          return recipe.kategoriResep?.toLowerCase().includes(lowercaseQuery);
        case 'deskripsi':
          return recipe.deskripsi?.toLowerCase().includes(lowercaseQuery);
        case 'bahanResep':
          return recipe.bahanResep.some(bahan => 
            bahan.nama.toLowerCase().includes(lowercaseQuery)
          );
        default:
          return false;
      }
    });
  }, [recipes]);

  // Advanced filter options
  const filterByProfitability = useCallback((level: 'high' | 'medium' | 'low') => {
    return filteredAndSortedRecipes.filter(recipe => {
      const margin = recipe.marginKeuntunganPersen || 0;
      switch (level) {
        case 'high': return margin >= 30;
        case 'medium': return margin >= 15 && margin < 30;
        case 'low': return margin < 15;
        default: return true;
      }
    });
  }, [filteredAndSortedRecipes]);

  const filterByHppRange = useCallback((min: number, max: number) => {
    return filteredAndSortedRecipes.filter(recipe => 
      recipe.hppPerPorsi >= min && recipe.hppPerPorsi <= max
    );
  }, [filteredAndSortedRecipes]);

  const filterByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return filteredAndSortedRecipes.filter(recipe => 
      recipe.createdAt >= startDate && recipe.createdAt <= endDate
    );
  }, [filteredAndSortedRecipes]);

  // Get filter summary
  const getFilterSummary = useCallback(() => {
    const summary: string[] = [];
    
    if (searchTerm.trim()) {
      summary.push(`Pencarian: "${searchTerm}"`);
    }
    
    if (categoryFilter) {
      summary.push(`Kategori: ${categoryFilter}`);
    }
    
    if (sortBy !== 'namaResep' || sortOrder !== 'asc') {
      const sortLabel = sortBy === 'namaResep' ? 'Nama' :
                       sortBy === 'kategoriResep' ? 'Kategori' :
                       sortBy === 'createdAt' ? 'Tanggal' :
                       sortBy === 'totalHpp' ? 'Total HPP' :
                       sortBy === 'hppPerPorsi' ? 'HPP/Porsi' : 'Profitabilitas';
      const orderLabel = sortOrder === 'asc' ? 'A-Z' : 'Z-A';
      summary.push(`Urutkan: ${sortLabel} (${orderLabel})`);
    }
    
    return summary;
  }, [searchTerm, categoryFilter, sortBy, sortOrder]);

  return {
    // Current filter states
    searchTerm,
    categoryFilter,
    sortBy,
    sortOrder,
    hasActiveFilters,
    
    // Filtered results
    filteredAndSortedRecipes,
    availableCategories,
    
    // Filter actions
    setSearchTerm: setSearchTermDebounced,
    setCategoryFilter,
    setSortBy,
    setSortOrder,
    handleSort,
    clearFilters,
    filterByCategory,
    
    // Advanced filtering
    searchInResults,
    searchByField,
    filterByProfitability,
    filterByHppRange,
    filterByDateRange,
    
    // Utilities
    getFilterSummary,
  };
};