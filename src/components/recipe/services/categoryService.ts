// src/components/recipe/services/categoryService.ts
// Service for category operations

import { 
  getAllAvailableCategories,
  getCustomCategories,
  saveCustomCategories,
  isValidCategoryName,
  categoryExists
} from '../types';
import type { Recipe } from '../types';
import { logger } from '@/utils/logger';

interface CategoryStats {
  name: string;
  count: number;
  isCustom: boolean;
  canDelete: boolean;
  canEdit: boolean;
  recipes: Recipe[];
}

/**
 * Get all available categories with statistics
 */
export const getCategoryStats = (recipes: Recipe[], customCategories: string[]): CategoryStats[] => {
  console.log('📊 getCategoryStats called with:', {
    recipesCount: recipes.length,
    customCategories,
    customCount: customCategories.length
  });
  
  // Get all categories used in recipes
  const categoryGroups = new Map<string, Recipe[]>();
  
  recipes.forEach((recipe) => {
    if (recipe.kategoriResep) {
      const existing = categoryGroups.get(recipe.kategoriResep) || [];
      categoryGroups.set(recipe.kategoriResep, [...existing, recipe]);
    }
  });

  // Get all available categories
  const allCategories = getAllAvailableCategories(recipes);
  console.log('🏷️ All available categories:', allCategories);
  
  // Build stats for each category
  const stats = allCategories.map((categoryName) => {
    const recipesInCategory = categoryGroups.get(categoryName) || [];
    const isCustom = customCategories.includes(categoryName);
    const canDelete = isCustom && recipesInCategory.length === 0;
    
    const stat = {
      name: categoryName,
      count: recipesInCategory.length,
      isCustom,
      canDelete,
      canEdit: isCustom,
      recipes: recipesInCategory,
    };
    
    console.log(`📊 Category "${categoryName}":`, {
      isCustom,
      count: recipesInCategory.length,
      canDelete,
      canEdit: isCustom
    });
    
    return stat;
  });
  
  console.log('📊 Final category stats:', stats);
  return stats;
};

/**
 * Add a new category
 */
export const addCategory = async (
  categoryName: string,
  customCategories: string[],
  recipes: Recipe[]
): Promise<{ success: boolean; message: string; categories?: string[] }> => {
  try {
    const trimmedName = categoryName.trim();
    
    // Validate category name
    if (!trimmedName) {
      return { success: false, message: 'Nama kategori tidak boleh kosong' };
    }
    
    if (trimmedName.length > 50) {
      return { success: false, message: 'Nama kategori terlalu panjang (maksimal 50 karakter)' };
    }
    
    if (!isValidCategoryName(trimmedName)) {
      return { success: false, message: 'Nama kategori mengandung karakter tidak valid' };
    }
    
    // Check if category already exists
    const existingCategories = getAllAvailableCategories(recipes);
    if (categoryExists(trimmedName, existingCategories)) {
      return { success: false, message: 'Kategori dengan nama ini sudah ada' };
    }
    
    // Add to custom categories
    const newCustomCategories = [...customCategories, trimmedName];
    saveCustomCategories(newCustomCategories);
    
    return { 
      success: true, 
      message: 'Kategori berhasil ditambahkan',
      categories: newCustomCategories
    };
  } catch (error) {
    logger.error('Failed to add category:', error);
    return { success: false, message: 'Gagal menambahkan kategori' };
  }
};

/**
 * Edit an existing category
 */
export const editCategory = async (
  oldName: string,
  newName: string,
  customCategories: string[],
  recipes: Recipe[],
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<boolean>
): Promise<{ success: boolean; message: string; categories?: string[] }> => {
  try {
    const trimmedNewName = newName.trim();
    
    // Validate new name
    if (!trimmedNewName) {
      return { success: false, message: 'Nama kategori tidak boleh kosong' };
    }
    
    if (trimmedNewName.length > 50) {
      return { success: false, message: 'Nama kategori terlalu panjang (maksimal 50 karakter)' };
    }
    
    if (!isValidCategoryName(trimmedNewName)) {
      return { success: false, message: 'Nama kategori mengandung karakter tidak valid' };
    }
    
    // Check if new name is the same as old name
    if (trimmedNewName === oldName) {
      return { success: true, message: 'Nama kategori tidak berubah' };
    }
    
    // Check if new name already exists
    if (categoryExists(trimmedNewName, recipes)) {
      return { success: false, message: 'Kategori dengan nama ini sudah ada' };
    }
    
    // Update all recipes with this category
    const recipesToUpdate = recipes.filter(recipe => recipe.kategoriResep === oldName);
    let updateSuccess = true;
    
    for (const recipe of recipesToUpdate) {
      const success = await updateRecipe(recipe.id, { kategoriResep: trimmedNewName });
      if (!success) {
        updateSuccess = false;
      }
    }
    
    if (!updateSuccess) {
      return { success: false, message: 'Gagal memperbarui beberapa resep' };
    }
    
    // Update custom categories list
    const updatedCategories = customCategories
      .filter(cat => cat !== oldName)
      .concat(trimmedNewName);
    
    saveCustomCategories(updatedCategories);
    
    return { 
      success: true, 
      message: 'Kategori berhasil diperbarui',
      categories: updatedCategories
    };
  } catch (error) {
    logger.error('Failed to edit category:', error);
    return { success: false, message: 'Gagal memperbarui kategori' };
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (
  categoryName: string,
  customCategories: string[],
  recipes: Recipe[]
): Promise<{ success: boolean; message: string; categories?: string[] }> => {
  try {
    // Check if category exists
    const categoryExists = customCategories.includes(categoryName);
    if (!categoryExists) {
      return { success: false, message: 'Kategori tidak ditemukan' };
    }
    
    // Check if category is in use
    const recipesInCategory = recipes.filter(recipe => recipe.kategoriResep === categoryName);
    if (recipesInCategory.length > 0) {
      return { success: false, message: 'Tidak dapat menghapus kategori yang masih digunakan' };
    }
    
    // Remove from custom categories
    const updatedCategories = customCategories.filter(cat => cat !== categoryName);
    saveCustomCategories(updatedCategories);
    
    return { 
      success: true, 
      message: 'Kategori berhasil dihapus',
      categories: updatedCategories
    };
  } catch (error) {
    logger.error('Failed to delete category:', error);
    return { success: false, message: 'Gagal menghapus kategori' };
  }
};

/**
 * Refresh categories from storage
 */
export const refreshCategories = (): string[] => {
  return getCustomCategories();
};