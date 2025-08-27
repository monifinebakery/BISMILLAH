// src/components/recipe/components/RecipeList/RecipeTable.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { formatCurrency, formatPercentage, getProfitabilityLevel } from '../../services/recipeUtils';
import type { Recipe, RecipeSortField } from '../../types';

interface RecipeTableProps {
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

const RecipeTable: React.FC<RecipeTableProps> = ({
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
  // Sort icon
  const getSortIcon = (field: RecipeSortField) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    return sortOrder === 'asc'
      ? <ArrowUp className="h-4 w-4 text-orange-600" />
      : <ArrowDown className="h-4 w-4 text-orange-600" />;
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

  // Safe highlight (escape regex + gunakan index ganjil)
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const highlightText = (text: string, term: string) => {
    if (!term.trim()) return text;
    const safe = escapeRegExp(term.trim());
    const regex = new RegExp(`(${safe})`, 'gi'); // capturing group
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

  if (recipes.length === 0) return null;

  return (
    <div className="relative overflow-x-auto rounded-lg border border-gray-300">
      <Table /* on small screens allow scroll */ className="min-w-[840px]">
        <TableHeader>
          <TableRow className="bg-gray-50">
            {/* Selection Checkbox */}
            {isSelectionMode && (
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Pilih semua resep"
                />
              </TableHead>
            )}
            
            <TableHead className="w-[320px]">
              <Button
                variant="ghost"
                onClick={() => onSort('namaResep')}
                className="inline-flex h-auto items-center gap-1 p-0 font-semibold hover:bg-transparent"
              >
                Nama Resep
                {getSortIcon('namaResep')}
              </Button>
            </TableHead>
            <TableHead className="w-[160px]">
              <Button
                variant="ghost"
                onClick={() => onSort('kategoriResep')}
                className="inline-flex h-auto items-center gap-1 p-0 font-semibold hover:bg-transparent"
              >
                Kategori
                {getSortIcon('kategoriResep')}
              </Button>
            </TableHead>
            <TableHead className="text-center">Porsi</TableHead>
            <TableHead className="text-right">
              <Button
                variant="ghost"
                onClick={() => onSort('hppPerPorsi')}
                className="inline-flex h-auto items-center gap-1 p-0 font-semibold hover:bg-transparent"
              >
                HPP/Porsi
                {getSortIcon('hppPerPorsi')}
              </Button>
            </TableHead>
            <TableHead className="text-right">Harga Jual</TableHead>
            <TableHead className="text-center">
              <Button
                variant="ghost"
                onClick={() => onSort('profitabilitas')}
                className="inline-flex h-auto items-center gap-1 p-0 font-semibold hover:bg-transparent"
              >
                Profitabilitas
                {getSortIcon('profitabilitas')}
              </Button>
            </TableHead>
            <TableHead className="text-center">
              <Button
                variant="ghost"
                onClick={() => onSort('createdAt')}
                className="inline-flex h-auto items-center gap-1 p-0 font-semibold hover:bg-transparent"
              >
                Dibuat
                {getSortIcon('createdAt')}
              </Button>
            </TableHead>
            <TableHead className="w-[70px]" />
          </TableRow>
        </TableHeader>

        <TableBody>
          {recipes.map((recipe) => (
            <TableRow key={recipe.id} className="transition-colors hover:bg-gray-50">
              {/* Selection Checkbox */}
              {isSelectionMode && (
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(recipe.id)}
                    onCheckedChange={() => onSelectionChange?.(recipe.id)}
                    aria-label={`Pilih resep ${recipe.namaResep}`}
                  />
                </TableCell>
              )}
              
              {/* Name */}
              <TableCell className="font-medium">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100">
                    <ChefHat className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-gray-900">
                      {highlightText(recipe.namaResep, searchTerm)}
                    </div>
                    {recipe.deskripsi && (
                      <div className="mt-1 truncate text-sm text-gray-500">
                        {highlightText(recipe.deskripsi, searchTerm)}
                      </div>
                    )}
                    <div className="mt-1 text-xs text-gray-400">
                      {recipe.bahanResep.length} bahan
                    </div>
                  </div>
                </div>
              </TableCell>

              {/* Category */}
              <TableCell>
                {recipe.kategoriResep ? (
                  <Badge variant="outline" className="text-xs">
                    {highlightText(recipe.kategoriResep, searchTerm)}
                  </Badge>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </TableCell>

              {/* Portions */}
              <TableCell className="text-center">
                <div className="text-sm font-medium">{recipe.jumlahPorsi}</div>
                {recipe.jumlahPcsPerPorsi > 1 && (
                  <div className="text-xs text-gray-500">({recipe.jumlahPcsPerPorsi} pcs/porsi)</div>
                )}
              </TableCell>

              {/* HPP per Portion */}
              <TableCell className="text-right text-nowrap">
                <div className="font-semibold text-gray-900">{formatCurrency(recipe.hppPerPorsi)}</div>
                {recipe.hppPerPcs > 0 && recipe.jumlahPcsPerPorsi > 1 && (
                  <div className="text-xs text-gray-500">{formatCurrency(recipe.hppPerPcs)}/pcs</div>
                )}
              </TableCell>

              {/* Selling Price */}
              <TableCell className="text-right text-nowrap">
                <div className="font-semibold text-green-600">
                  {formatCurrency(recipe.hargaJualPorsi)}
                </div>
                {recipe.hargaJualPerPcs > 0 && recipe.jumlahPcsPerPorsi > 1 && (
                  <div className="text-xs text-gray-500">{formatCurrency(recipe.hargaJualPerPcs)}/pcs</div>
                )}
              </TableCell>

              {/* Profitability */}
              <TableCell className="text-center">
                <div className="flex flex-col items-center gap-1">
                  {getProfitabilityBadge(recipe.marginKeuntunganPersen)}
                  <div className="text-xs text-gray-600">
                    {formatPercentage(recipe.marginKeuntunganPersen)}
                  </div>
                </div>
              </TableCell>

              {/* Created Date */}
              <TableCell className="text-center text-sm text-gray-500">
                {new Date(recipe.createdAt).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </TableCell>

              {/* Actions */}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={isLoading}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onEdit(recipe)} className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Resep
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(recipe)} className="flex items-center gap-2">
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Loading overlay */}
      {isLoading && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/80">
          <div className="flex items-center gap-2 text-gray-600">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            Memproses...
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeTable;
