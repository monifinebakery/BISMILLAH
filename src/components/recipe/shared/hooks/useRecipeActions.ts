import { useState } from 'react';
import { toast } from 'sonner';
import { useRecipe } from '@/contexts/RecipeContext';
import { Recipe } from '@/types/recipe';

export const useRecipeActions = () => {
  const { deleteRecipe, duplicateRecipe } = useRecipe();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);

  const handleDeleteRecipe = async (recipeId: string, recipeName: string): Promise<boolean> => {
    setIsDeleting(recipeId);
    try {
      const success = await deleteRecipe(recipeId);
      if (success) {
        toast.success(`Resep "${recipeName}" berhasil dihapus`);
        return true;
      }
      return false;
    } catch (error) {
      toast.error('Gagal menghapus resep');
      return false;
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDuplicateRecipe = async (
    recipeId: string, 
    newName: string,
    originalName: string
  ): Promise<boolean> => {
    if (!newName.trim()) {
      toast.error('Nama resep duplikat harus diisi');
      return false;
    }

    setIsDuplicating(recipeId);
    try {
      const success = await duplicateRecipe(recipeId, newName.trim());
      if (success) {
        toast.success(`Resep "${originalName}" berhasil diduplikasi menjadi "${newName.trim()}"`);
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

  const isRecipeDeleting = (recipeId: string): boolean => {
    return isDeleting === recipeId;
  };

  const isRecipeDuplicating = (recipeId: string): boolean => {
    return isDuplicating === recipeId;
  };

  const isAnyActionInProgress = (): boolean => {
    return isDeleting !== null || isDuplicating !== null;
  };

  return {
    handleDeleteRecipe,
    handleDuplicateRecipe,
    isRecipeDeleting,
    isRecipeDuplicating,
    isAnyActionInProgress,
    // Backwards compatibility
    isDeleting,
    isDuplicating
  };
};