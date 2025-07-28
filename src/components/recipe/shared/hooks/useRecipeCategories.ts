import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { validateCategoryName } from '../utils/recipeValidators';

export const useRecipeCategories = () => {
  const { settings, saveSettings } = useUserSettings();
  const [isManaging, setIsManaging] = useState(false);

  const categories = useMemo(() => settings?.recipeCategories || [], [settings]);

  const addCategory = async (categoryName: string): Promise<boolean> => {
    const validation = validateCategoryName(categoryName, categories);
    
    if (!validation.isValid) {
      toast.error(validation.message);
      return false;
    }

    setIsManaging(true);
    try {
      const updatedCategories = [...categories, categoryName.trim()];
      await saveSettings({ recipeCategories: updatedCategories });
      toast.success(`Kategori "${categoryName.trim()}" berhasil ditambahkan`);
      return true;
    } catch (error) {
      toast.error('Gagal menambahkan kategori');
      return false;
    } finally {
      setIsManaging(false);
    }
  };

  const deleteCategory = async (categoryToDelete: string): Promise<boolean> => {
    setIsManaging(true);
    try {
      const updatedCategories = categories.filter(cat => cat !== categoryToDelete);
      await saveSettings({ recipeCategories: updatedCategories });
      toast.success(`Kategori "${categoryToDelete}" berhasil dihapus`);
      return true;
    } catch (error) {
      toast.error('Gagal menghapus kategori');
      return false;
    } finally {
      setIsManaging(false);
    }
  };

  const updateCategory = async (oldName: string, newName: string): Promise<boolean> => {
    const validation = validateCategoryName(
      newName, 
      categories.filter(cat => cat !== oldName)
    );
    
    if (!validation.isValid) {
      toast.error(validation.message);
      return false;
    }

    setIsManaging(true);
    try {
      const updatedCategories = categories.map(cat => 
        cat === oldName ? newName.trim() : cat
      );
      await saveSettings({ recipeCategories: updatedCategories });
      toast.success(`Kategori berhasil diubah ke "${newName.trim()}"`);
      return true;
    } catch (error) {
      toast.error('Gagal mengubah kategori');
      return false;
    } finally {
      setIsManaging(false);
    }
  };

  const isCategoryExists = (categoryName: string): boolean => {
    return categories.map(c => c.toLowerCase()).includes(categoryName.toLowerCase());
  };

  const getCategoryUsageCount = (categoryName: string, recipes: any[] = []): number => {
    return recipes.filter(recipe => recipe.kategoriResep === categoryName).length;
  };

  const getUnusedCategories = (recipes: any[] = []): string[] => {
    const usedCategories = new Set(
      recipes
        .map(recipe => recipe.kategoriResep)
        .filter(cat => cat && cat.trim() !== '')
    );
    
    return categories.filter(cat => !usedCategories.has(cat));
  };

  const getMostUsedCategories = (recipes: any[] = [], limit: number = 5): Array<{ name: string; count: number }> => {
    const categoryUsage = categories.map(cat => ({
      name: cat,
      count: getCategoryUsageCount(cat, recipes)
    }));

    return categoryUsage
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  };

  return {
    categories,
    addCategory,
    deleteCategory,
    updateCategory,
    isCategoryExists,
    isManaging,
    // Additional utility functions
    getCategoryUsageCount,
    getUnusedCategories,
    getMostUsedCategories,
    // Statistics
    totalCategories: categories.length,
    hasCategories: categories.length > 0
  };
};