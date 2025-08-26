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
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="card-content-responsive">
          <div className="flex items-center gap-3">
            <div className="card-icon-container-responsive bg-orange-100">
              <ChefHat className="card-icon-responsive text-orange-600" />
            </div>
            <div>
              <p className="card-label-responsive text-orange-700 font-medium">Total Resep</p>
              <p className="card-value-responsive font-semibold text-orange-900 text-overflow-safe">{totalRecipes}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="card-content-responsive">
          <div className="flex items-center gap-3">
            <div className="card-icon-container-responsive bg-blue-100">
              <Tag className="card-icon-responsive text-blue-600" />
            </div>
            <div>
              <p className="card-label-responsive text-blue-700 font-medium">Terkategorisasi</p>
              <p className="card-value-responsive font-semibold text-blue-900 text-overflow-safe">{categorizedRecipes}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="border-green-200 bg-green-50">
        <CardContent className="card-content-responsive">
          <div className="flex items-center gap-3">
            <div className="card-icon-container-responsive bg-green-100">
              <BarChart3 className="card-icon-responsive text-green-600" />
            </div>
            <div>
              <p className="card-label-responsive text-green-700 font-medium">Total Kategori</p>
              <p className="card-value-responsive font-semibold text-green-900 text-overflow-safe">{totalCategories}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};