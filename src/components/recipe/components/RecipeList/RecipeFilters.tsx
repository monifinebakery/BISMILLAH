// src/components/recipe/components/RecipeList/RecipeFilters.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  X,
  SortAsc,
  SortDesc,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import type { RecipeSortField } from '../../types';

// Updated props to include advanced filters
interface RecipeFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  categories: string[];
  sortBy: RecipeSortField;
  onSortByChange: (field: RecipeSortField) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  profitabilityFilter: string;
  onProfitabilityFilterChange: (value: string) => void;
  minHpp: string;
  onMinHppChange: (value: string) => void;
  maxHpp: string;
  onMaxHppChange: (value: string) => void;
  dateRangeFilter: string;
  onDateRangeFilterChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  totalResults: number;
  onSort: (field: RecipeSortField) => void;
}

const RecipeFilters: React.FC<RecipeFiltersProps> = ({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  profitabilityFilter,
  onProfitabilityFilterChange,
  minHpp,
  onMinHppChange,
  maxHpp,
  onMaxHppChange,
  dateRangeFilter,
  onDateRangeFilterChange,
  hasActiveFilters,
  onClearFilters,
  totalResults,
  onSort,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Sort options
  const sortOptions = [
    { value: 'namaResep', label: 'Nama Resep' },
    { value: 'kategoriResep', label: 'Kategori' },
    { value: 'createdAt', label: 'Tanggal Dibuat' },
    { value: 'hppPerPorsi', label: 'HPP per Porsi' },
    { value: 'totalHpp', label: 'Total HPP' },
    { value: 'profitabilitas', label: 'Profitabilitas' },
  ] as const;

  const getSortLabel = (field: RecipeSortField) => {
    return sortOptions.find(opt => opt.value === field)?.label || field;
  };
  
  // Helper to get label for date range filter badge
  const getDateRangeLabel = (value: string) => {
    const options: { [key: string]: string } = {
        'today': 'Hari Ini',
        'week': 'Minggu Ini',
        'month': 'Bulan Ini',
        'quarter': '3 Bulan Terakhir'
    };
    return options[value] || '';
  }

  return (
    <div className="space-y-4">
      {/* Main Filter Row */}
      <div className="flex flex-col sm:flex-row gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cari nama resep, kategori, atau bahan..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchChange('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-400"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Category Filter */}
        <div className="w-full sm:w-48">
          <Select value={categoryFilter || 'all'} onValueChange={onCategoryFilterChange}>
            <SelectTrigger>
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Dropdown */}
        <div className="w-full sm:w-48">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  {sortOrder === 'asc' ? (
                    <SortAsc className="h-4 w-4" />
                  ) : (
                    <SortDesc className="h-4 w-4" />
                  )}
                  <span className="truncate">
                    {getSortLabel(sortBy)}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Urutkan berdasarkan</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onSort(option.value)}
                  className="flex items-center justify-between"
                >
                  {option.label}
                  {sortBy === option.value && (
                    sortOrder === 'asc' ? (
                      <SortAsc className="h-4 w-4" />
                    ) : (
                      <SortDesc className="h-4 w-4" />
                    )
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Advanced Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className={isAdvancedOpen ? 'bg-orange-50 border-orange-200' : ''}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Advanced Filters (Collapsible) */}
      {isAdvancedOpen && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Filter Lanjutan</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdvancedOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Profitability Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tingkat Profitabilitas
              </label>
              <Select value={profitabilityFilter} onValueChange={onProfitabilityFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Level</SelectItem>
                  <SelectItem value="high">Tinggi (≥30%)</SelectItem>
                  <SelectItem value="medium">Sedang (15-29%)</SelectItem>
                  {/* FIX: Escaped the '<' character */}
                  <SelectItem value="low">Rendah (&lt;15%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* HPP Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Range HPP per Porsi
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minHpp}
                  onChange={(e) => onMinHppChange(e.target.value)}
                  className="w-full"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxHpp}
                  onChange={(e) => onMaxHppChange(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Dibuat
              </label>
              <Select value={dateRangeFilter} onValueChange={onDateRangeFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Waktu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Waktu</SelectItem>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="week">Minggu Ini</SelectItem>
                  <SelectItem value="month">Bulan Ini</SelectItem>
                  <SelectItem value="quarter">3 Bulan Terakhir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters & Results Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* Active Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Pencarian: "{searchTerm}"
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange('')}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {categoryFilter && categoryFilter !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Kategori: {categoryFilter}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCategoryFilterChange('all')}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {profitabilityFilter && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Profit: {profitabilityFilter}
              <Button
                variant="ghost" size="sm" onClick={() => onProfitabilityFilterChange('')} className="h-4 w-4 p-0 hover:bg-transparent"> <X className="h-3 w-3" /> </Button>
            </Badge>
          )}

          {(minHpp || maxHpp) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              HPP: {minHpp || '...'} - {maxHpp || '...'}
              <Button
                variant="ghost" size="sm" onClick={() => { onMinHppChange(''); onMaxHppChange(''); }} className="h-4 w-4 p-0 hover:bg-transparent"> <X className="h-3 w-3" /> </Button>
            </Badge>
          )}

          {dateRangeFilter && (
             <Badge variant="secondary" className="flex items-center gap-1">
              Tanggal: {getDateRangeLabel(dateRangeFilter)}
              <Button
                variant="ghost" size="sm" onClick={() => onDateRangeFilterChange('')} className="h-4 w-4 p-0 hover:bg-transparent"> <X className="h-3 w-3" /> </Button>
            </Badge>
          )}

          {(sortBy !== 'namaResep' || sortOrder !== 'asc') && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Urutan: {getSortLabel(sortBy)} ({sortOrder === 'asc' ? 'A-Z' : 'Z-A'})
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onSortByChange('namaResep');
                  onSortOrderChange('asc');
                }}
                className="h-4 w-4 p-0 hover:bg-transparent"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Bersihkan Semua
            </Button>
          )}
        </div>

        {/* Results Summary */}
        <div className="text-sm text-gray-600">
          {totalResults === 0 ? (
            'Tidak ada hasil'
          ) : totalResults === 1 ? (
            '1 resep ditemukan'
          ) : (
            `${totalResults} resep ditemukan`
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeFilters;