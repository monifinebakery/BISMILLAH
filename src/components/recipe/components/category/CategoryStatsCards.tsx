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
    <div className="responsive-grid">
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="card-content-responsive">
          <div className="flex items-center gap-3">
            <div className="card-icon-container-responsive bg-gray-100">
              <ChefHat className="card-icon-responsive text-gray-600" />
            </div>
            <div>
              <p className="card-label-responsive text-gray-700 font-medium">Total Resep</p>
              <p className="card-value-responsive font-semibold text-gray-900 text-overflow-safe">{totalRecipes}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="card-content-responsive">
          <div className="flex items-center gap-3">
            <div className="card-icon-container-responsive bg-gray-100">
              <Tag className="card-icon-responsive text-gray-600" />
            </div>
            <div>
              <p className="card-label-responsive text-gray-700 font-medium">Terkategorisasi</p>
              <p className="card-value-responsive font-semibold text-gray-900 text-overflow-safe">{categorizedRecipes}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="card-content-responsive">
          <div className="flex items-center gap-3">
            <div className="card-icon-container-responsive bg-gray-100">
              <BarChart3 className="card-icon-responsive text-gray-600" />
            </div>
            <div>
              <p className="card-label-responsive text-gray-700 font-medium">Total Kategori</p>
              <p className="card-value-responsive font-semibold text-gray-900 text-overflow-safe">{totalCategories}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};