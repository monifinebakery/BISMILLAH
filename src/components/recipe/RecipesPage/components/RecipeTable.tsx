import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { RecipeTableRow } from './RecipeTableRow';
import { Recipe } from '@/types/recipe';
import { RecipeSortOption, SortOrder } from '../../shared/constants';
import { EmptyRecipeState, NoSearchResultsState } from '../../shared/components/LoadingStates';

interface RecipeTableProps {
  recipes: Recipe[];
  onSort: (field: RecipeSortOption) => void;
  sortBy: RecipeSortOption;
  sortOrder: SortOrder;
  onEdit: (recipe: Recipe) => void;
  onDuplicate: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  isLoading?: boolean;
  searchTerm?: string;
  onClearSearch?: () => void;
  onCreateFirst?: () => void;
}

export const RecipeTable: React.FC<RecipeTableProps> = ({
  recipes,
  onSort,
  sortBy,
  sortOrder,
  onEdit,
  onDuplicate,
  onDelete,
  isLoading = false,
  searchTerm = '',
  onClearSearch,
  onCreateFirst
}) => {
  const getSortIcon = (field: RecipeSortOption) => {
    if (sortBy !== field) return '';
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const handleSort = (field: RecipeSortOption) => {
    onSort(field);
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              {Array.from({ length: 9 }).map((_, i) => (
                <TableHead key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 9 }).map((_, j) => (
                  <td key={j} className="p-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  </td>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (recipes.length === 0) {
    if (searchTerm && onClearSearch) {
      return (
        <NoSearchResultsState 
          searchTerm={searchTerm} 
          onClearSearch={onClearSearch} 
        />
      );
    }
    
    if (onCreateFirst) {
      return <EmptyRecipeState onCreateFirst={onCreateFirst} />;
    }
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="font-semibold">
              <Button 
                variant="ghost" 
                onClick={() => handleSort('name')} 
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                Nama Resep{getSortIcon('name')}
              </Button>
            </TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Porsi</TableHead>
            <TableHead className="text-right">
              <Button 
                variant="ghost" 
                onClick={() => handleSort('hpp')} 
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                HPP/Porsi{getSortIcon('hpp')}
              </Button>
            </TableHead>
            <TableHead className="text-right">HPP/Pcs</TableHead>
            <TableHead className="text-right">Harga Jual/Porsi</TableHead>
            <TableHead className="text-right">Harga Jual/Pcs</TableHead>
            <TableHead className="text-right">
              <Button 
                variant="ghost" 
                onClick={() => handleSort('profit')} 
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                Profit{getSortIcon('profit')}
              </Button>
            </TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipes.map(recipe => (
            <RecipeTableRow
              key={recipe.id}
              recipe={recipe}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};