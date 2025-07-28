// src/components/recipe/RecipesPage/components/RecipeHeader.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Settings } from 'lucide-react';

interface RecipeHeaderProps {
  onAddRecipe: () => void;
  onManageCategories: () => void;
}

export const RecipeHeader: React.FC<RecipeHeaderProps> = ({
  onAddRecipe,
  onManageCategories
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-xl shadow-lg">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Manajemen Resep
          </h1>
          <p className="text-gray-600">
            Buat, kelola, dan analisis resep produk dengan kalkulasi HPP per porsi & per pcs
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
        <Button 
          variant="outline" 
          onClick={onManageCategories} 
          className="shadow-md"
        >
          <Settings className="h-4 w-4 mr-2" /> 
          Kelola Kategori
        </Button>
        <Button 
          onClick={onAddRecipe} 
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" /> 
          Tambah Resep
        </Button>
      </div>
    </div>
  );
};