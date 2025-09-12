// 🎯 VirtualRecipeTable.tsx - Virtual Scrolling Implementation for Recipes
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChefHat,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import VirtualTable, { VirtualTableColumn } from '@/components/ui/VirtualTable';
import { formatCurrency, formatPercentage, getProfitabilityLevel } from '../../services/recipeUtils';
import type { Recipe, RecipeSortField } from '../../types';
import { cn } from '@/lib/utils';

interface VirtualRecipeTableProps {
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

// Recipe Row Actions Component
const RecipeRowActions: React.FC<{
  recipe: Recipe;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  disabled?: boolean;
}> = ({ recipe, onEdit, onDuplicate, onDelete, disabled = false }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-gray-100"
          disabled={disabled}
        >
          <span className="sr-only">Buka menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
          <Edit className="mr-2 h-4 w-4" />
          Edit Resep
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onDuplicate} className="cursor-pointer">
          <Copy className="mr-2 h-4 w-4" />
          Duplikat Resep
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={onDelete} 
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Hapus Resep
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Profitability Badge Component
const ProfitabilityBadge: React.FC<{ marginPersen: number }> = ({ marginPersen }) => {
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

// Text Highlight Component
const HighlightText: React.FC<{ text: string; searchTerm: string }> = ({ text, searchTerm }) => {
  if (!searchTerm.trim()) return <>{text}</>;
  
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const VirtualRecipeTable: React.FC<VirtualRecipeTableProps> = ({
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
  // Sort icon helper
  const getSortIcon = (field: RecipeSortField) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="h-4 w-4 text-orange-600" />
      : <ArrowDown className="h-4 w-4 text-orange-600" />;
  };

  // Handle selection changes
  const handleSelectionChange = (recipeId: string) => {
    onSelectionChange?.(recipeId);
  };

  const handleSelectAll = () => {
    onSelectAll?.();
  };

  // Define columns for virtual table
  const columns: VirtualTableColumn<Recipe>[] = useMemo(() => {
    const baseColumns: VirtualTableColumn<Recipe>[] = [
      {
        key: 'namaResep',
        header: (
          <Button
            variant="ghost"
            onClick={() => onSort('namaResep')}
            className="inline-flex h-auto items-center gap-1 p-0 font-semibold hover:bg-transparent"
          >
            Nama Resep
            {getSortIcon('namaResep')}
          </Button>
        ),
        width: 250,
        render: (recipe: Recipe) => (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100">
              <ChefHat className="h-4 w-4 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-gray-900">
                <HighlightText text={recipe.namaResep} searchTerm={searchTerm} />
              </div>
              <div className="mt-1 text-xs text-gray-400">
                {recipe.bahanResep.length} bahan
              </div>
            </div>
          </div>
        )
      },
      {
        key: 'kategoriResep',
        header: (
          <Button
            variant="ghost"
            onClick={() => onSort('kategoriResep')}
            className="inline-flex h-auto items-center gap-1 p-0 font-semibold hover:bg-transparent"
          >
            Kategori
            {getSortIcon('kategoriResep')}
          </Button>
        ),
        width: 120,
        render: (recipe: Recipe) => (
          recipe.kategoriResep ? (
            <Badge variant="outline" className="text-xs">
              <HighlightText text={recipe.kategoriResep} searchTerm={searchTerm} />
            </Badge>
          ) : (
            <span className="text-sm text-gray-400">-</span>
          )
        )
      },
      {
        key: 'jumlahPorsi',
        header: 'Porsi',
        width: 80,
        align: 'center' as const,
        render: (recipe: Recipe) => (
          <div className="text-center">
            <div className="text-sm font-medium">{recipe.jumlahPorsi}</div>
            {recipe.jumlahPcsPerPorsi > 1 && (
              <div className="text-xs text-gray-500">({recipe.jumlahPcsPerPorsi} pcs/porsi)</div>
            )}
          </div>
        )
      },
      {
        key: 'hppPerPorsi',
        header: (
          <Button
            variant="ghost"
            onClick={() => onSort('hppPerPorsi')}
            className="inline-flex h-auto items-center gap-1 p-0 font-semibold hover:bg-transparent"
          >
            HPP/Porsi
            {getSortIcon('hppPerPorsi')}
          </Button>
        ),
        width: 120,
        align: 'right' as const,
        render: (recipe: Recipe) => (
          <div className="text-right text-nowrap">
            <div className="font-semibold text-gray-900">{formatCurrency(recipe.hppPerPorsi)}</div>
            {recipe.hppPerPcs > 0 && recipe.jumlahPcsPerPorsi > 1 && (
              <div className="text-xs text-gray-500">{formatCurrency(recipe.hppPerPcs)}/pcs</div>
            )}
          </div>
        )
      },
      {
        key: 'hargaJualPorsi',
        header: 'Harga Jual',
        width: 120,
        align: 'right' as const,
        render: (recipe: Recipe) => (
          <div className="text-right text-nowrap">
            <div className="font-semibold text-green-600">
              {formatCurrency(recipe.hargaJualPorsi)}
            </div>
            {recipe.hargaJualPerPcs > 0 && recipe.jumlahPcsPerPorsi > 1 && (
              <div className="text-xs text-gray-500">{formatCurrency(recipe.hargaJualPerPcs)}/pcs</div>
            )}
          </div>
        )
      },
      {
        key: 'profitabilitas',
        header: (
          <Button
            variant="ghost"
            onClick={() => onSort('profitabilitas')}
            className="inline-flex h-auto items-center gap-1 p-0 font-semibold hover:bg-transparent"
          >
            Profitabilitas
            {getSortIcon('profitabilitas')}
          </Button>
        ),
        width: 140,
        align: 'center' as const,
        render: (recipe: Recipe) => (
          <div className="text-center">
            <ProfitabilityBadge marginPersen={recipe.marginKeuntunganPersen} />
            <div className="mt-1 text-xs text-gray-600">
              {formatPercentage(recipe.marginKeuntunganPersen)}
            </div>
          </div>
        )
      },
      {
        key: 'createdAt',
        header: (
          <Button
            variant="ghost"
            onClick={() => onSort('createdAt')}
            className="inline-flex h-auto items-center gap-1 p-0 font-semibold hover:bg-transparent"
          >
            Dibuat
            {getSortIcon('createdAt')}
          </Button>
        ),
        width: 120,
        align: 'center' as const,
        render: (recipe: Recipe) => (
          <div className="text-center text-sm text-gray-600">
            {new Date(recipe.createdAt).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </div>
        )
      },
      {
        key: 'actions',
        header: '',
        width: 70,
        align: 'center' as const,
        render: (recipe: Recipe) => (
          !isSelectionMode ? (
            <RecipeRowActions
              recipe={recipe}
              onEdit={() => onEdit(recipe)}
              onDuplicate={() => onDuplicate(recipe)}
              onDelete={() => onDelete(recipe)}
            />
          ) : null
        )
      }
    ];

    // Add selection column if in selection mode
    if (isSelectionMode) {
      return [
        {
          key: 'selection',
          header: (
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              className="h-4 w-4"
            />
          ) as any,
          width: 50,
          render: (recipe: Recipe) => (
            <Checkbox
              checked={selectedIds.has(recipe.id)}
              onCheckedChange={() => handleSelectionChange(recipe.id)}
              className="h-4 w-4"
              aria-label={`Pilih resep ${recipe.namaResep}`}
            />
          )
        },
        ...baseColumns
      ];
    }

    return baseColumns;
  }, [isSelectionMode, selectedIds, isAllSelected, sortBy, sortOrder, searchTerm, onEdit, onDuplicate, onDelete, onSort]);

  // Handle row click
  const handleRowClick = (recipe: Recipe) => {
    if (isSelectionMode) {
      handleSelectionChange(recipe.id);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
      <VirtualTable
        data={recipes}
        columns={columns}
        loading={isLoading}
        itemHeight={70}
        containerHeight={600}
        onRowClick={handleRowClick}
        className="w-full"
        emptyMessage="Tidak ada resep"
        hoverable={true}
        striped={true}
        getItemId={(recipe) => recipe.id}
      />
      
      {/* Selection Summary */}
      {isSelectionMode && selectedIds.size > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-200">
          <div className="text-sm text-blue-700">
            <span className="font-medium">{selectedIds.size}</span> resep dipilih
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualRecipeTable;