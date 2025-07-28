// src/components/recipe/shared/components/RecipeCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryBadge } from './CategoryBadge';
import { PriceDisplay } from './PriceDisplay';
import { ActionButtons } from './ActionButtons';
import { formatPercentage, formatDate } from '../utils/recipeFormatters';

interface RecipeCardProps {
  recipe: {
    id: string;
    namaResep: string;
    kategoriResep?: string;
    deskripsi?: string;
    jumlahPorsi: number;
    hppPerPorsi: number;
    hppPerPcs?: number;
    hargaJualPorsi: number;
    hargaJualPerPcs?: number;
    createdAt: Date;
  };
  onEdit?: (recipe: any) => void;
  onDuplicate?: (recipe: any) => void;
  onDelete?: (recipe: any) => void;
  onView?: (recipe: any) => void;
  showActions?: boolean;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onEdit,
  onDuplicate,
  onDelete,
  onView,
  showActions = true
}) => {
  const profitPerPorsi = (recipe.hargaJualPorsi || 0) - (recipe.hppPerPorsi || 0);
  const marginPercent = (recipe.hargaJualPorsi || 0) > 0 
    ? (profitPerPorsi / (recipe.hargaJualPorsi || 1)) * 100 
    : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{recipe.namaResep}</CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <CategoryBadge category={recipe.kategoriResep} />
              <span className="text-sm text-gray-500">{recipe.jumlahPorsi} porsi</span>
            </div>
            {recipe.deskripsi && (
              <p className="text-sm text-gray-600 line-clamp-2">{recipe.deskripsi}</p>
            )}
          </div>
          {showActions && (
            <ActionButtons
              onView={onView ? () => onView(recipe) : undefined}
              onEdit={onEdit ? () => onEdit(recipe) : undefined}
              onDuplicate={onDuplicate ? () => onDuplicate(recipe) : undefined}
              onDelete={onDelete ? () => onDelete(recipe) : undefined}
              size="sm"
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">HPP per Porsi</p>
              <PriceDisplay amount={recipe.hppPerPorsi} colorClass="text-orange-600" />
            </div>
            {recipe.hppPerPcs && (
              <div>
                <p className="text-xs text-gray-500 mb-1">HPP per Pcs</p>
                <PriceDisplay amount={recipe.hppPerPcs} colorClass="text-orange-600" />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-500 mb-1">Harga Jual</p>
              <PriceDisplay amount={recipe.hargaJualPorsi} colorClass="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Profit</p>
              <div className="flex flex-col">
                <PriceDisplay amount={profitPerPorsi} />
                <span className="text-xs text-gray-500">
                  {formatPercentage(marginPercent / 100)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Dibuat: {formatDate(recipe.createdAt)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};