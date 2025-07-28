// src/components/recipe/shared/hooks/useRecipeActions.ts

import { useState } from 'react';
import { toast } from 'sonner';
import { useRecipe } from '@/contexts/RecipeContext';

export const useRecipeActions = () => {
  const { deleteRecipe, duplicateRecipe } = useRecipe();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);

  const handleDeleteRecipe = async (recipeId: string, recipeName: string) => {
    setIsDeleting(recipeId);
    try {
      const success = await deleteRecipe(recipeId);
      if (success) {
        toast.success(`Resep "${recipeName}" berhasil dihapus`);
      }
    } catch (error) {
      toast.error('Gagal menghapus resep');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDuplicateRecipe = async (
    recipeId: string, 
    newName: string,
    originalName: string
  ) => {
    if (!newName.trim()) {
      toast.error('Nama resep duplikat harus diisi');
      return false;
    }

    setIsDuplicating(recipeId);
    try {
      const success = await duplicateRecipe(recipeId, newName.trim());
      if (success) {
        toast.success(`Resep "${originalName}" berhasil diduplikasi`);
        return true;
      }
      return false;
    } catch (error) {
      toast.error('Gagal menduplikasi resep');
      return false;
    } finally {
      setIsDuplicating(null);
    }
  };

  return {
    handleDeleteRecipe,
    handleDuplicateRecipe,
    isDeleting,
    isDuplicating
  };
};

// src/components/recipe/shared/hooks/useRecipeCategories.ts

import { useState } from 'react';
import { toast } from 'sonner';
import { useUserSettings } from '@/contexts/UserSettingsContext';
import { validateCategoryName } from '../utils/recipeValidators';

export const useRecipeCategories = () => {
  const { settings, saveSettings } = useUserSettings();
  const [isManaging, setIsManaging] = useState(false);

  const categories = settings?.recipeCategories || [];

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

  return {
    categories,
    addCategory,
    deleteCategory,
    updateCategory,
    isCategoryExists,
    isManaging
  };
};