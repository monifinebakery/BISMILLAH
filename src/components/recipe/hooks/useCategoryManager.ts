// src/components/recipe/hooks/useCategoryManager.ts
// Custom hook for category management logic

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getCategoryStats, addCategory, editCategory, deleteCategory, refreshCategories } from '../services/categoryService';
import type { Recipe } from '../types';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface UseCategoryManagerProps {
  recipes: Recipe[];
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<boolean>;
  refreshRecipes: () => Promise<void>;
}

export const useCategoryManager = ({ recipes, updateRecipe, refreshRecipes }: UseCategoryManagerProps) => {
  // State management
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  // Load custom categories on mount
  useEffect(() => {
    const loadCategories = () => {
      const categories = refreshCategories();
      setCustomCategories(categories);
    };
    loadCategories();
  }, []);

  // Category statistics
  const categoryStats = useMemo(() => {
    return getCategoryStats(recipes, customCategories);
  }, [recipes, customCategories]);

  // Recipe statistics
  const recipeStats = useMemo(() => {
    const totalRecipes = recipes.length;
    const categorizedRecipes = recipes.filter(recipe => recipe.kategoriResep).length;
    return { totalRecipes, categorizedRecipes };
  }, [recipes]);

  // Add new category
  const handleAddCategory = useCallback(async (categoryName: string) => {
    setIsLoading(true);
    try {
      const result = await addCategory(categoryName, customCategories, recipes);
      
      if (result.success) {
        if (result.categories) {
          setCustomCategories(result.categories);
        }
        toast.success(result.message);
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      logger.error('Failed to add category:', error);
      toast.error('Gagal menambahkan kategori');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [customCategories, recipes]);

  // Start editing a category
  const startEditing = useCallback((categoryName: string, currentName: string) => {
    setEditingCategory(categoryName);
    setEditName(currentName);
  }, []);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingCategory(null);
    setEditName('');
  }, []);

  // Edit category
  const handleEditCategory = useCallback(async (oldName: string, newName: string) => {
    setIsLoading(true);
    try {
      const result = await editCategory(oldName, newName, customCategories, recipes, updateRecipe);
      
      if (result.success) {
        if (result.categories) {
          setCustomCategories(result.categories);
        }
        cancelEditing();
        await refreshRecipes();
        toast.success(result.message);
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      logger.error('Failed to edit category:', error);
      toast.error('Gagal memperbarui kategori');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [customCategories, recipes, updateRecipe, refreshRecipes, cancelEditing]);

  // Delete category
  const handleDeleteCategory = useCallback(async (categoryName: string) => {
    setIsLoading(true);
    try {
      const result = await deleteCategory(categoryName, customCategories, recipes);
      
      if (result.success) {
        if (result.categories) {
          setCustomCategories(result.categories);
        }
        setCategoryToDelete(null);
        await refreshRecipes();
        toast.success(result.message);
        return true;
      } else {
        toast.error(result.message);
        return false;
      }
    } catch (error) {
      logger.error('Failed to delete category:', error);
      toast.error('Gagal menghapus kategori');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [customCategories, recipes, refreshRecipes]);

  // Refresh categories
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const categories = refreshCategories();
      setCustomCategories(categories);
      await refreshRecipes();
      toast.success('Data kategori berhasil diperbarui');
    } catch (error) {
      logger.error('Failed to refresh categories:', error);
      toast.error('Gagal memperbarui data kategori');
    } finally {
      setIsLoading(false);
    }
  }, [refreshRecipes]);

  // Open delete confirmation
  const openDeleteConfirmation = useCallback((categoryName: string) => {
    console.log('🔔 Opening delete confirmation for:', categoryName);
    setCategoryToDelete(categoryName);
  }, []);

  // Close delete confirmation
  const closeDeleteConfirmation = useCallback(() => {
    setCategoryToDelete(null);
  }, []);

  return {
    // State
    customCategories,
    setCustomCategories,
    isLoading,
    setIsLoading,
    editingCategory,
    setEditingCategory,
    editName,
    setEditName,
    categoryToDelete,
    setCategoryToDelete,

    // Derived data
    categoryStats,
    recipeStats,

    // Handlers
    handleAddCategory,
    startEditing,
    cancelEditing,
    handleEditCategory,
    handleDeleteCategory,
    handleRefresh,
    openDeleteConfirmation,
    closeDeleteConfirmation
  };
};