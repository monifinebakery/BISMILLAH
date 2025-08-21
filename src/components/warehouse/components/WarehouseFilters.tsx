// ===== 1. UPDATE WarehouseFilters.tsx dengan useQuery =====
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
  Settings2,
  RefreshCw // ✅ TAMBAH: Import refresh icon
} from 'lucide-react';
// ✅ TAMBAH: Import useQuery
import { useQuery } from '@tanstack/react-query';
import { warehouseApi } from '../services/warehouseApi';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { FilterState } from '../types';
// Kategori default sinkron dengan analisis profit
import { FNB_COGS_CATEGORIES } from '@/components/profitAnalysis/constants/profitConstants';

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

// ✅ TAMBAH: Query keys for filter data
const filterQueryKeys = {
  categories: ['warehouse', 'categories'] as const,
  suppliers: ['warehouse', 'suppliers'] as const,
};

// ✅ TAMBAH: API functions for filter data
const fetchCategories = async (): Promise<string[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const service = await warehouseApi.createService('crud', {
      userId: user?.id,
      enableDebugLogs: import.meta.env.DEV
    });
    
    const items = await service.fetchBahanBaku();
    let categories = [...new Set(items.map(item => item.kategori).filter(Boolean))];
    if (categories.length === 0) categories = [...FNB_COGS_CATEGORIES];
    return categories.sort();
  } catch (error) {
    logger.error('Failed to fetch categories:', error);
    return [...FNB_COGS_CATEGORIES];
  }
};

const fetchSuppliers = async (): Promise<string[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // First, try to get actual supplier names from suppliers table
    if (user?.id) {
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, nama')
        .eq('user_id', user.id)
        .order('nama', { ascending: true });
      
      if (!suppliersError && suppliersData && suppliersData.length > 0) {
        // Create a map of supplier ID to supplier name
        const supplierMap = new Map<string, string>();
        suppliersData.forEach(supplier => {
          supplierMap.set(supplier.id, supplier.nama);
          supplierMap.set(supplier.nama, supplier.nama); // Also map name to name for direct matches
        });
        
        // Get bahan baku items and map supplier IDs to names
        const service = await warehouseApi.createService('crud', {
          userId: user.id,
          enableDebugLogs: import.meta.env.DEV
        });
        
        const items = await service.fetchBahanBaku();
        const supplierNames = new Set<string>();
        
        items.forEach(item => {
          if (item.supplier) {
            // Check if supplier is an ID that maps to a name
            const supplierName = supplierMap.get(item.supplier);
            if (supplierName) {
              supplierNames.add(supplierName);
            } else {
              // If no mapping, use the supplier field directly
              supplierNames.add(item.supplier);
            }
          }
        });
        
        return Array.from(supplierNames).sort();
      }
    }
    
    // Fallback to existing method if suppliers table is empty or unavailable
    const service = await warehouseApi.createService('crud', {
      userId: user?.id,
      enableDebugLogs: import.meta.env.DEV
    });
    
    const items = await service.fetchBahanBaku();
    const suppliers = [...new Set(items.map(item => item.supplier).filter(Boolean))];
    return suppliers.sort();
  } catch (error) {
    logger.error('Failed to fetch suppliers:', error);
    return [];
  }
};

/**
 * Warehouse Filters Component
 * ✅ ENHANCED: Added useQuery for categories & suppliers
 * ✅ ENHANCED: Added refresh functionality
 * ✅ ENHANCED: Fallback to props for backward compatibility
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
  availableCategories: propCategories,
  availableSuppliers: propSuppliers,
  activeFiltersCount,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // ✅ TAMBAH: useQuery for categories
  const {
    data: queriedCategories = [],
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: filterQueryKeys.categories,
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
    retry: 1,
  });

  // ✅ TAMBAH: useQuery for suppliers
  const {
    data: queriedSuppliers = [],
    isLoading: suppliersLoading,
    refetch: refetchSuppliers,
  } = useQuery({
    queryKey: filterQueryKeys.suppliers,
    queryFn: fetchSuppliers,
    staleTime: 10 * 60 * 1000, // 10 minutes - suppliers don't change often
    retry: 1,
  });

  // ✅ TAMBAH: Use queried data with fallback to props for backward compatibility
  const availableCategories = queriedCategories.length > 0 ? queriedCategories : propCategories;
  const availableSuppliers = queriedSuppliers.length > 0 ? queriedSuppliers : propSuppliers;

  // ✅ TAMBAH: Refresh filter data
  const handleRefreshFilters = async () => {
    try {
      await Promise.all([
        refetchCategories(),
        refetchSuppliers()
      ]);
      logger.info('Filter data refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh filter data:', error);
    }
  };

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
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg z-10 max-h-40 overflow-y-auto">
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

          {/* ✅ TAMBAH: Refresh filters button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshFilters}
            disabled={categoriesLoading || suppliersLoading}
            className="text-gray-500 hover:text-gray-700"
            title="Refresh kategori dan supplier"
          >
            <RefreshCw className={`w-4 h-4 ${categoriesLoading || suppliersLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh filter data</span>
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
              {categoriesLoading && (
                <span className="ml-2 text-xs text-gray-500">(memuat...)</span>
              )}
            </label>
            <select
              value={filters.category}
              onChange={(e) => updateFilter('category', e.target.value)}
              disabled={categoriesLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Semua Kategori</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {categoriesLoading && (
              <p className="text-xs text-gray-500 mt-1">Memuat kategori...</p>
            )}
          </div>

          {/* Supplier Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier
              {suppliersLoading && (
                <span className="ml-2 text-xs text-gray-500">(memuat...)</span>
              )}
            </label>
            <select
              value={filters.supplier}
              onChange={(e) => updateFilter('supplier', e.target.value)}
              disabled={suppliersLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Semua Supplier</option>
              {availableSuppliers.map((supplier) => (
                <option key={supplier} value={supplier}>
                  {supplier}
                </option>
              ))}
            </select>
            {suppliersLoading && (
              <p className="text-xs text-gray-500 mt-1">Memuat supplier...</p>
            )}
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