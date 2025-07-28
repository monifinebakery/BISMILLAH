// src/components/recipe/shared/components/CategoryBadge.tsx

import React from 'react';
import { Badge } from '@/components/ui/badge';

interface CategoryBadgeProps {
  category?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ 
  category, 
  variant = 'secondary', 
  className = '' 
}) => {
  if (!category) {
    return <span className="text-gray-400 text-sm">-</span>;
  }

  return (
    <Badge 
      variant={variant} 
      className={`bg-orange-100 text-orange-800 hover:bg-orange-200 ${className}`}
    >
      {category}
    </Badge>
  );
};



// src/components/recipe/shared/components/ActionButtons.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Edit, Trash2, Eye } from 'lucide-react';

interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  showView?: boolean;
  showEdit?: boolean;
  showDuplicate?: boolean;
  showDelete?: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  showView = false,
  showEdit = true,
  showDuplicate = true,
  showDelete = true,
  isLoading = false,
  size = 'md'
}) => {
  const buttonSize = size === 'sm' ? 'icon' : 'icon';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        {showView && onView && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size={buttonSize} 
                onClick={onView}
                disabled={isLoading}
                className="h-8 w-8"
              >
                <Eye className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Lihat Detail</TooltipContent>
          </Tooltip>
        )}

        {showDuplicate && onDuplicate && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size={buttonSize} 
                onClick={onDuplicate}
                disabled={isLoading}
                className="h-8 w-8"
              >
                <Copy className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Duplikasi Resep</TooltipContent>
          </Tooltip>
        )}

        {showEdit && onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size={buttonSize} 
                onClick={onEdit}
                disabled={isLoading}
                className="h-8 w-8"
              >
                <Edit className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit Resep</TooltipContent>
          </Tooltip>
        )}

        {showDelete && onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size={buttonSize} 
                onClick={onDelete}
                disabled={isLoading}
                className="h-8 w-8 text-red-500 hover:text-red-700"
              >
                <Trash2 className={iconSize} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Hapus Resep</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};

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