// src/components/warehouse/components/WarehouseFilters.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown,
  CheckSquare,
  Square,
  RotateCcw,
  Settings2
} from 'lucide-react';
import type { FilterState } from '../types';

interface WarehouseFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onResetFilters: () => void;
  itemsPerPage: number;
  onItemsPerPageChange: (count: number) => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  availableCategories: string[];
  availableSuppliers: string[];
  activeFiltersCount: number;
}

/**
 * Warehouse Filters Component
 * 
 * Comprehensive filtering system with:
 * - Search functionality
 * - Category/Supplier filters
 * - Stock level filters
 * - Expiry filters
 * - Selection mode toggle
 * - Items per page control
 * 
 * Size: ~4KB
 */
const WarehouseFilters: React.FC<WarehouseFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  onResetFilters,
  itemsPerPage,
  onItemsPerPageChange,
  isSelectionMode,
  onToggleSelectionMode,
  availableCategories,
  availableSuppliers,
  activeFiltersCount,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Update individual filter
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      {/* Top Row - Search & Main Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className={`relative transition-all duration-200 ${
            searchFocused ? 'ring-2 ring-orange-500 ring-opacity-50' : ''
          }`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Cari nama, kategori, atau supplier..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="pl-10 pr-10 py-2 w-full border-gray-300 rounded-lg focus:border-orange-500 focus:ring-orange-500"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {/* Search Suggestions (if needed) */}
          {searchTerm && searchFocused && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
              <div className="p-2 text-sm text-gray-500">
                Pencarian: "{searchTerm}"
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          
          {/* Selection Mode Toggle */}
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={onToggleSelectionMode}
            className={`flex items-center gap-2 ${
              isSelectionMode ? 'bg-orange-500 hover:bg-orange-600' : ''
            }`}
          >
            {isSelectionMode ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isSelectionMode ? 'Keluar Mode Pilih' : 'Mode Pilih'}
            </span>
          </Button>

          {/* Filters Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 relative"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filter</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${
              showFilters ? 'rotate-180' : ''
            }`} />
            
            {/* Active Filters Badge */}
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {/* Reset Filters */}
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="sr-only">Reset filters</span>
            </Button>
          )}
        </div>
      </div>

      {/* Expandable Filters Section */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
          
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-sm"
            >
              <option value="">Semua Kategori</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier
            </label>
            <select
              value={filters.supplier}
              onChange={(e) => updateFilter('supplier', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-sm"
            >
              <option value="">Semua Supplier</option>
              {availableSuppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level Stok
            </label>
            <select
              value={filters.stockLevel}
              onChange={(e) => updateFilter('stockLevel', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-sm"
            >
              <option value="all">Semua Level</option>
              <option value="low">Stok Rendah</option>
              <option value="out">Stok Habis</option>
            </select>
          </div>

          {/* Expiry Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Kadaluarsa
            </label>
            <select
              value={filters.expiry}
              onChange={(e) => updateFilter('expiry', e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-sm"
            >
              <option value="all">Semua Status</option>
              <option value="expiring">Akan Kadaluarsa</option>
              <option value="expired">Sudah Kadaluarsa</option>
            </select>
          </div>
        </div>
      )}

      {/* Bottom Row - Results Info & Settings */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
        
        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Filter aktif:</span>
            
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                Search: "{searchTerm.length > 15 ? searchTerm.substring(0, 15) + '...' : searchTerm}"
                <button
                  onClick={() => onSearchChange('')}
                  className="text-orange-600 hover:text-orange-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.category && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Kategori: {filters.category}
                <button
                  onClick={() => updateFilter('category', '')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.supplier && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Supplier: {filters.supplier}
                <button
                  onClick={() => updateFilter('supplier', '')}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.stockLevel !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                Stok: {filters.stockLevel === 'low' ? 'Rendah' : 'Habis'}
                <button
                  onClick={() => updateFilter('stockLevel', 'all')}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            
            {filters.expiry !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                Expiry: {filters.expiry === 'expiring' ? 'Akan Kadaluarsa' : 'Kadaluarsa'}
                <button
                  onClick={() => updateFilter('expiry', 'all')}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Items Per Page Control */}
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Tampilkan:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-orange-500 focus:border-orange-500"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-600">per halaman</span>
        </div>
      </div>
    </div>
  );
};

export default WarehouseFilters;