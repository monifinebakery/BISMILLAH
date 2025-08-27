// src/components/recipe/components/RecipeList/RecipeCardView.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  ChefHat,
  TrendingUp,
  TrendingDown,
  Minus,
  Image as ImageIcon,
  Clock,
  Users,
} from 'lucide-react';
import { formatCurrency, formatPercentage, getProfitabilityLevel } from '../../services/recipeUtils';
import type { Recipe, RecipeSortField } from '../../types';

interface RecipeCardViewProps {
  recipes: Recipe[];
  onSort: (field: RecipeSortField) => void;
  sortBy: RecipeSortField;
  sortOrder: 'asc' | 'desc';
  onEdit: (recipe: Recipe) => void;
  onDuplicate: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  searchTerm: string;
  isLoading?: boolean;
  // Bulk operations props
  selectedIds?: Set<string>;
  onSelectionChange?: (recipeId: string) => void;
  isSelectionMode?: boolean;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
}

const RecipeCardView: React.FC<RecipeCardViewProps> = ({
  recipes,
  onSort,
  sortBy,
  sortOrder,
  onEdit,
  onDuplicate,
  onDelete,
  searchTerm,
  isLoading = false,
  selectedIds = new Set(),
  onSelectionChange,
  isSelectionMode = false,
  onSelectAll,
  isAllSelected = false,
}) => {
  // Safe highlight function
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    const safe = escapeRegExp(term.trim());
    const regex = new RegExp(`(${safe})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <mark key={i} className="rounded bg-yellow-200 px-1">
          {part}
        </mark>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    );
  };

  // Profitability badge
  const getProfitabilityBadge = (marginPersen: number) => {
    const level = getProfitabilityLevel(marginPersen);
    const config = {
      high: { color: 'bg-green-100 text-green-800', icon: TrendingUp, label: 'Tinggi' },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: Minus, label: 'Sedang' },
      low: { color: 'bg-red-100 text-red-800', icon: TrendingDown, label: 'Rendah' },
    } as const;

    const { color, icon: Icon, label } = config[level];
    return (
      <Badge variant="secondary" className={`${color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Get recipe image source
  const getImageSrc = (recipe: Recipe) => {
    return recipe.fotoBase64 || recipe.fotoUrl || null;
  };

  if (recipes.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Bulk selection header for card view */}
      {isSelectionMode && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={onSelectAll}
            aria-label="Pilih semua resep"
          />
          <span className="text-sm font-medium text-gray-700">
            Pilih semua ({recipes.length} resep)
          </span>
        </div>
      )}

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {recipes.map((recipe) => {
          const imageSrc = getImageSrc(recipe);
          
          return (
            <Card 
              key={recipe.id} 
              className={`transition-all duration-200 hover:shadow-md ${
                isSelectionMode && selectedIds.has(recipe.id) 
                  ? 'ring-2 ring-orange-500' 
                  : ''
              }`}
            >
              <CardContent className="p-0">
                {/* Selection checkbox */}
                {isSelectionMode && (
                  <div className="absolute top-3 left-3 z-10">
                    <Checkbox
                      checked={selectedIds.has(recipe.id)}
                      onCheckedChange={() => onSelectionChange?.(recipe.id)}
                      aria-label={`Pilih resep ${recipe.namaResep}`}
                      className="bg-white border-2 border-white shadow-sm"
                    />
                  </div>
                )}

                {/* Image section */}
                <div className="relative h-32 bg-gradient-to-br from-orange-50 to-orange-100 rounded-t-lg overflow-hidden">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={recipe.namaResep}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback placeholder */}
                  <div className={`${imageSrc ? 'hidden' : ''} absolute inset-0 flex items-center justify-center`}>
                    <div className="text-center">
                      <ImageIcon className="w-8 h-8 text-orange-300 mx-auto mb-2" />
                      <span className="text-xs text-orange-400 font-medium">
                        Foto Resep
                      </span>
                    </div>
                  </div>

                  {/* Actions dropdown */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="secondary" 
                          className="h-8 w-8 p-0 bg-white/80 hover:bg-white shadow-sm" 
                          disabled={isLoading}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          onClick={() => onEdit(recipe)} 
                          className="flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          Edit Resep
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onDuplicate(recipe)} 
                          className="flex items-center gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Duplikasi
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(recipe)}
                          className="flex items-center gap-2 text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Content section */}
                <div className="p-4 space-y-3">
                  {/* Title and category */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-900 text-sm overflow-hidden" style={{ 
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical' as const 
                    }}>
                      {highlightText(recipe.namaResep, searchTerm)}
                    </h3>
                    
                    {recipe.kategoriResep && (
                      <Badge variant="outline" className="text-xs">
                        {highlightText(recipe.kategoriResep, searchTerm)}
                      </Badge>
                    )}
                    
                    {recipe.deskripsi && (
                      <p className="text-xs text-gray-500 overflow-hidden" style={{ 
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical' as const 
                      }}>
                        {highlightText(recipe.deskripsi, searchTerm)}
                      </p>
                    )}
                  </div>

                  {/* Recipe metrics */}
                  <div className="space-y-2 text-xs">
                    {/* Portions */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="h-3 w-3" />
                      <span>{recipe.jumlahPorsi} porsi</span>
                      {recipe.jumlahPcsPerPorsi > 1 && (
                        <span className="text-gray-400">
                          ({recipe.jumlahPcsPerPorsi} pcs/porsi)
                        </span>
                      )}
                    </div>

                    {/* Ingredients count */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <ChefHat className="h-3 w-3" />
                      <span>{recipe.bahanResep.length} bahan</span>
                    </div>

                    {/* Created date */}
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(recipe.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Financial metrics */}
                  <div className="space-y-2 pt-2 border-t border-gray-400">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">HPP/Porsi:</span>
                      <span className="text-xs font-semibold">
                        {formatCurrency(recipe.hppPerPorsi)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Harga Jual:</span>
                      <span className="text-xs font-semibold text-green-600">
                        {formatCurrency(recipe.hargaJualPorsi)}
                      </span>
                    </div>

                    {/* Profitability */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Profit:</span>
                      <div className="flex items-center gap-1">
                        {getProfitabilityBadge(recipe.marginKeuntunganPersen)}
                        <span className="text-xs font-medium">
                          {formatPercentage(recipe.marginKeuntunganPersen)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center bg-white/80 z-50">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            Memproses...
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeCardView;
