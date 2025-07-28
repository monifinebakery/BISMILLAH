import { useState, useMemo, useCallback } from 'react';
import { Recipe } from '@/types/recipe';
import { RecipeSortOption, SortOrder } from '../../shared/constants';

interface UseRecipeFilteringProps {
  recipes: Recipe[];
}

export const useRecipeFiltering = ({ recipes }: UseRecipeFilteringProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<RecipeSortOption>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filteredAndSortedRecipes = useMemo(() => {
    let filtered = recipes.filter(recipe => {
      const matchesSearch = recipe.namaResep.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recipe.kategoriResep?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recipe.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || recipe.kategoriResep === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.namaResep.toLowerCase();
          bValue = b.namaResep.toLowerCase();
          break;
        case 'hpp':
          aValue = a.hppPerPorsi || 0;
          bValue = b.hppPerPorsi || 0;
          break;
        case 'profit':
          aValue = (a.hargaJualPorsi || 0) - (a.hppPerPorsi || 0);
          bValue = (b.hargaJualPorsi || 0) - (b.hppPerPorsi || 0);
          break;
        case 'created':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        default:
          aValue = a.namaResep.toLowerCase();
          bValue = b.namaResep.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [recipes, searchTerm, categoryFilter, sortBy, sortOrder]);

  const handleSort = useCallback((field: RecipeSortOption) => {
    if (sortBy === field) {
      setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  }, [sortBy]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSortBy('name');
    setSortOrder('asc');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    filteredAndSortedRecipes,
    handleSort,
    clearFilters,
    hasActiveFilters: searchTerm !== '' || categoryFilter !== 'all'
  };
};