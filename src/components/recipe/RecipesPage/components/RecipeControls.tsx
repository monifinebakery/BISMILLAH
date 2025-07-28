import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RecipeSortOption, SortOrder } from '../../shared/constants';

interface RecipeControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  categories: string[];
  sortBy: RecipeSortOption;
  onSortByChange: (value: RecipeSortOption) => void;
  sortOrder: SortOrder;
  onSortOrderToggle: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  totalResults: number;
}

export const RecipeControls: React.FC<RecipeControlsProps> = ({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderToggle,
  hasActiveFilters,
  onClearFilters,
  totalResults
}) => {
  const sortOptions = [
    { value: 'name', label: 'Nama Resep' },
    { value: 'hpp', label: 'HPP per Porsi' },
    { value: 'profit', label: 'Keuntungan' },
    { value: 'created', label: 'Tanggal Dibuat' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-semibold">
            Daftar Resep ({totalResults})
          </h3>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              <Filter className="h-3 w-3 mr-1" />
              Hapus Filter
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari nama resep..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 shadow-sm"
            />
          </div>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger className="w-full sm:w-48 shadow-sm">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={(value) => onSortByChange(value as RecipeSortOption)}>
            <SelectTrigger className="w-full sm:w-48 shadow-sm">
              <SelectValue placeholder="Urutkan" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Button
            variant="outline"
            size="icon"
            onClick={onSortOrderToggle}
            className="shadow-sm"
            title={`Urutkan ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};