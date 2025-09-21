import React from 'react';
import { LazyComponentWrapper, DeleteRecipeDialog, DuplicateRecipeDialog, CategoryManagerDialog } from './RecipeLazyComponents';
import type { Recipe, NewRecipe } from '../types';

interface RecipeDialogsProps {
  navigationState: {
    dialogType?: 'none' | 'delete' | 'duplicate' | 'category';
    selectedRecipe?: Recipe | null;
  };
  handlers: {
    closeDialog: () => void;
    handleConfirmDelete: () => Promise<void>;
    handleConfirmDuplicate: (newName: string) => Promise<boolean>;
  };
  mutations: {
    deleteRecipeMutation: { isPending: boolean };
    duplicateRecipeMutation: { isPending: boolean };
  };
  recipes: Recipe[];
  updateRecipe?: (id: string, data: Partial<NewRecipe>) => Promise<boolean>;
  refreshRecipes?: () => void;
}

const RecipeDialogs: React.FC<RecipeDialogsProps> = ({
  navigationState,
  handlers,
  mutations,
  recipes,
  updateRecipe,
  refreshRecipes,
}) => {
  return (
    <>
      {/* Delete Dialog */}
      {navigationState.dialogType === 'delete' && (
        <LazyComponentWrapper>
          <DeleteRecipeDialog
            isOpen={true}
            onOpenChange={handlers.closeDialog}
            recipe={navigationState.selectedRecipe}
            onConfirm={handlers.handleConfirmDelete}
            isLoading={mutations.deleteRecipeMutation.isPending}
          />
        </LazyComponentWrapper>
      )}

      {/* Duplicate Dialog */}
      {navigationState.dialogType === 'duplicate' && (
        <LazyComponentWrapper>
          <DuplicateRecipeDialog
            isOpen={true}
            onOpenChange={handlers.closeDialog}
            recipe={navigationState.selectedRecipe}
            onConfirm={handlers.handleConfirmDuplicate}
            isLoading={mutations.duplicateRecipeMutation.isPending}
          />
        </LazyComponentWrapper>
      )}

      {/* Category Manager Dialog */}
      {navigationState.dialogType === 'category' && (
        <LazyComponentWrapper>
          <CategoryManagerDialog
            isOpen={true}
            onOpenChange={handlers.closeDialog}
            recipes={recipes}
            updateRecipe={updateRecipe || (async () => true)}
            refreshRecipes={refreshRecipes || (() => {})}
          />
        </LazyComponentWrapper>
      )}
    </>
  );
};

export default RecipeDialogs;
