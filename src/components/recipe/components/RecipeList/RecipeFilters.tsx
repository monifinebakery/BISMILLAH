// src/components/recipe/components/RecipeList/RecipeFilters.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Filter, X, SortAsc, SortDesc, ChevronDown, RefreshCw } from 'lucide-react';
import type { RecipeSortField } from '../../types';

// Mendefinisikan tipe untuk filter lanjutan
type ProfitabilityLevel = 'high' | 'medium' | 'low' | '';
type DateRange = 'today' | 'week' | 'month' | 'quarter' | '';
type HppRange = { min?: number; max?: number };

interface RecipeFiltersProps {
  // Props yang sudah ada
  searchTerm: string;
  onSearchChange: (term: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (category: string) => void;
  categories: string[];
  sortBy: RecipeSortField;
  sortOrder: 'asc' | 'desc';
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  totalResults: number;
  onSort: (field: RecipeSortField) => void;

  // PERBAIKAN: Props baru untuk filter lanjutan
  profitabilityFilter: ProfitabilityLevel;
  onProfitabilityChange: (level: ProfitabilityLevel) => void;
  hppRange: HppRange;
  onHppRangeChange: (range: HppRange) => void;
  dateFilter: DateRange;
  onDateFilterChange: (range: DateRange) => void;
}

const RecipeFilters: React.FC<RecipeFiltersProps> = ({
  // Props yang sudah ada
  searchTerm, onSearchChange,
  categoryFilter, onCategoryFilterChange,
  categories, sortBy, sortOrder, hasActiveFilters, onClearFilters, totalResults, onSort,
  // PERBAIKAN: Props baru untuk filter lanjutan
  profitabilityFilter, onProfitabilityChange,
  hppRange, onHppRangeChange,
  dateFilter, onDateFilterChange
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const sortOptions = [
    { value: 'namaResep', label: 'Nama Resep' },
    { value: 'kategoriResep', label: 'Kategori' },
    { value: 'createdAt', label: 'Tanggal Dibuat' },
    { value: 'hppPerPorsi', label: 'HPP per Porsi' },
    { value: 'totalHpp', label: 'Total HPP' },
    { value: 'profitabilitas', label: 'Profitabilitas' },
  ] as const;

  const getSortLabel = (field: RecipeSortField) => sortOptions.find(opt => opt.value === field)?.label || field;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Cari nama resep, kategori, bahan..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
            <SelectTrigger><SelectValue placeholder="Semua Kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Semua Kategori</SelectItem>
              {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-48">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2 truncate">
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  {getSortLabel(sortBy)}
                </span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Urutkan berdasarkan</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((opt) => <DropdownMenuItem key={opt.value} onClick={() => onSort(opt.value)}>{opt.label}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button variant="outline" onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}>
          <Filter className="mr-2 h-4 w-4" /> Filter
        </Button>
      </div>

      {isAdvancedOpen && (
        <div className="space-y-4 rounded-lg bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* PERBAIKAN: Filter Profitabilitas dibuat controlled */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Tingkat Profitabilitas</label>
              <Select value={profitabilityFilter} onValueChange={(v) => onProfitabilityChange(v as ProfitabilityLevel)}>
                <SelectTrigger><SelectValue placeholder="Semua Level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua Level</SelectItem>
                  <SelectItem value="high">Tinggi (≥30%)</SelectItem>
                  <SelectItem value="medium">Sedang (15-29%)</SelectItem>
                  <SelectItem value="low">Rendah (&lt;15%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* PERBAIKAN: Filter HPP Range dibuat controlled */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Range HPP per Porsi</label>
              <div className="flex gap-2">
                <Input type="number" placeholder="Min" value={hppRange.min ?? ''} onChange={(e) => onHppRangeChange({ ...hppRange, min: e.target.valueAsNumber || undefined })} />
                <Input type="number" placeholder="Max" value={hppRange.max ?? ''} onChange={(e) => onHppRangeChange({ ...hppRange, max: e.target.valueAsNumber || undefined })} />
              </div>
            </div>
            {/* PERBAIKAN: Filter Tanggal dibuat controlled */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Tanggal Dibuat</label>
              <Select value={dateFilter} onValueChange={(v) => onDateFilterChange(v as DateRange)}>
                <SelectTrigger><SelectValue placeholder="Semua Waktu" /></SelectTrigger>
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

      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          {searchTerm && <Badge variant="secondary">Pencarian: "{searchTerm}"</Badge>}
          {categoryFilter && <Badge variant="secondary">Kategori: {categoryFilter}</Badge>}
          {profitabilityFilter && <Badge variant="secondary">Profit: {profitabilityFilter}</Badge>}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-gray-500 hover:text-gray-700">
              <RefreshCw className="mr-1 h-4 w-4" /> Bersihkan Filter
            </Button>
          )}
        </div>
        <div className="text-sm text-gray-600">
          {totalResults} resep ditemukan
        </div>
      </div>
    </div>
  );
};

export default RecipeFilters;