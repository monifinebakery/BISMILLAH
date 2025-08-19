// src/components/recipe/components/category/CategoryStatsCards.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ChefHat, Tag, BarChart3 } from 'lucide-react';

interface CategoryStatsCardsProps {
  totalRecipes: number;
  categorizedRecipes: number;
  totalCategories: number;
}

export const CategoryStatsCards: React.FC<CategoryStatsCardsProps> = ({
  totalRecipes,
  categorizedRecipes,
  totalCategories
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-orange-700 font-medium">Total Resep</p>
              <p className="text-2xl font-semibold text-orange-900">{totalRecipes}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Tag className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Terkategorisasi</p>
              <p className="text-2xl font-semibold text-blue-900">{categorizedRecipes}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-700 font-medium">Total Kategori</p>
              <p className="text-2xl font-semibold text-green-900">{totalCategories}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};