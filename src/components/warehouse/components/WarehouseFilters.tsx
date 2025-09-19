// src/components/warehouse/components/WarehouseFilters.tsx - Using Shared Filter Components
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Filter, 
  ChevronDown,
  CheckSquare,
  Square,
  Settings2,
  RefreshCw,
  RotateCcw,
  X
} from 'lucide-react';
// ✅ USING SHARED FILTER COMPONENTS
import { SearchInput, StatusFilter, DateRangeFilter } from '@/components/shared/filters';
import type { FilterOption, DateRange as SharedDateRange } from '@/components/shared/filters/types';
import { useQuery } from '@tanstack/react-query';
import { toNumber } from '../utils/typeUtils';
import { warehouseApi } from '../services/warehouseApi';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';
import type { FilterState } from '../types';
// Kategori default sinkron dengan analisis profit
import { FNB_COGS_CATEGORIES } from '@/components/profitAnalysis/constants/profitConstants';
// ✅ FIX: Import supabase client for direct supplier lookup
import { supabase } from '@/integrations/supabase/client';

// Define DateRange interface for backward compatibility with existing DateRangePicker
interface LegacyDateRange {
  from: Date;
  to: Date;
}

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
  dateRange?: LegacyDateRange;
  onDateRangeChange?: (range: LegacyDateRange | undefined) => void;
}

// ✅ Query keys for filter data  
const filterQueryKeys = {
  categories: ['warehouse', 'categories'] as const,
  suppliers: ['warehouse', 'suppliers'] as const,
};

// ✅ API functions for filter data
const fetchCategories = async (): Promise<FilterOption[]> => {
  try {
    return FNB_COGS_CATEGORIES.map(category => ({
      label: category,
      value: category
    }));
  } catch (error) {
    logger.error('Failed to fetch categories:', error);
    return FNB_COGS_CATEGORIES.map(category => ({
      label: category,
      value: category
    }));
  }
};

const fetchSuppliers = async (userId?: string): Promise<FilterOption[]> => {
  try {
    // First, try to get actual supplier names from suppliers table
    if (userId) {
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id, nama')
        .eq('user_id', userId)
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
          userId,
          enableDebugLogs: import.meta.env.DEV
        });
        
        const items = await (service as any).fetchBahanBaku();
        const supplierNames = new Set<string>();
        
        items.forEach((item: any) => {
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
        
        return Array.from(supplierNames).sort().map(supplier => ({
          label: supplier,
          value: supplier
        }));
      }
    }
    
    // Fallback to existing method if suppliers table is empty or unavailable
    const service = await warehouseApi.createService('crud', {
      userId,
      enableDebugLogs: import.meta.env.DEV
    });
    
    const items = await (service as any).fetchBahanBaku();
    const suppliers = [...new Set(items.map((item: any) => item.supplier).filter(Boolean))] as string[];
    return suppliers.sort().map(supplier => ({
      label: supplier,
      value: supplier
    }));
  } catch (error) {
    logger.error('Failed to fetch suppliers:', error);
    return [];
  }
};

// Stock level options for warehouse
const STOCK_LEVEL_OPTIONS: FilterOption[] = [
  { label: 'Semua Level', value: 'all' },
  { label: 'Stok Rendah', value: 'low' },
  { label: 'Stok Habis', value: 'out' }
];

// Expiry status options for warehouse
const EXPIRY_OPTIONS: FilterOption[] = [
  { label: 'Semua Status', value: 'all' },
  { label: 'Akan Kadaluarsa', value: 'expiring' },
  { label: 'Sudah Kadaluarsa', value: 'expired' }
];

/**
 * Warehouse Filters Component using Shared Filter Components
 * ✅ ENHANCED: Uses shared SearchInput, StatusFilter, DateRangeFilter
 * ✅ ENHANCED: Added useQuery for categories & suppliers
 * ✅ ENHANCED: Added refresh functionality
 * ✅ ENHANCED: Maintains backward compatibility with existing interfaces
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
  availableCategories: propCategories = [],
  availableSuppliers: propSuppliers = [],
  activeFiltersCount,
  dateRange,
  onDateRangeChange,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();

  // ✅ useQuery for categories
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

  // ✅ useQuery for suppliers
  const {
    data: queriedSuppliers = [],
    isLoading: suppliersLoading,
    refetch: refetchSuppliers,
  } = useQuery({
    queryKey: [...filterQueryKeys.suppliers, user?.id],
    queryFn: () => fetchSuppliers(user?.id),
    staleTime: 10 * 60 * 1000, // 10 minutes - suppliers don't change often
    retry: 1,
  });

  // ✅ Convert string arrays to FilterOption arrays for backward compatibility
  const categoryOptions = useMemo(() => {
    if (queriedCategories.length > 0) {
      return queriedCategories;
    }
    return propCategories.map(cat => ({ label: cat, value: cat }));
  }, [queriedCategories, propCategories]);

  const supplierOptions = useMemo(() => {
    if (queriedSuppliers.length > 0) {
      return queriedSuppliers;
    }
    return propSuppliers.map(sup => ({ label: sup, value: sup }));
  }, [queriedSuppliers, propSuppliers]);

  // ✅ Refresh filter data
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

  // Convert legacy DateRange to shared DateRange format
  const sharedDateRange: SharedDateRange = useMemo(() => {
    if (dateRange) {
      return {
        start: dateRange.from.toISOString().split('T')[0],
        end: dateRange.to.toISOString().split('T')[0]
      };
    }
    return {};
  }, [dateRange]);

  // Handle shared date range change
  const handleSharedDateRangeChange = (range: SharedDateRange) => {
    if (onDateRangeChange) {
      if (range.start && range.end) {
        onDateRangeChange({
          from: new Date(range.start),
          to: new Date(range.end)
        });
      } else {
        onDateRangeChange(undefined);
      }
    }
  };

  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      {/* Top Row - Search & Main Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
        
        {/* Search Bar using shared SearchInput */}
        <div className="flex-1 max-w-md">
          <SearchInput
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Cari nama, kategori, atau supplier..."
          />
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

      {/* Expandable Filters Section using shared components */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg border">
          
          {/* Category Filter using shared StatusFilter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              Kategori
              {categoriesLoading && (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              )}
            </label>
            <StatusFilter
              value={filters.category || ''}
              onChange={(value) => updateFilter('category', value)}
              options={categoryOptions}
              placeholder="Semua Kategori"
              disabled={categoriesLoading}
            />
          </div>

          {/* Supplier Filter using shared StatusFilter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              Supplier
              {suppliersLoading && (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              )}
            </label>
            <StatusFilter
              value={filters.supplier || ''}
              onChange={(value) => updateFilter('supplier', value)}
              options={supplierOptions}
              placeholder="Semua Supplier"
              disabled={suppliersLoading}
            />
          </div>

          {/* Stock Level Filter using shared StatusFilter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Level Stok
            </label>
            <StatusFilter
              value={filters.stockLevel === 'all' ? '' : filters.stockLevel}
              onChange={(value) => updateFilter('stockLevel', value === '' ? 'all' : value as any)}
              options={STOCK_LEVEL_OPTIONS.filter(opt => opt.value !== 'all')}
              placeholder="Semua Level"
            />
          </div>

          {/* Expiry Filter using shared StatusFilter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Status Kadaluarsa
            </label>
            <StatusFilter
              value={filters.expiry === 'all' ? '' : filters.expiry}
              onChange={(value) => updateFilter('expiry', value === '' ? 'all' : value as any)}
              options={EXPIRY_OPTIONS.filter(opt => opt.value !== 'all')}
              placeholder="Semua Status"
            />
          </div>

          {/* Date Range Filter using shared DateRangeFilter */}
          {onDateRangeChange && (
            <div className="space-y-2">
              <DateRangeFilter
                value={sharedDateRange}
                onChange={handleSharedDateRangeChange}
              />
            </div>
          )}
        </div>
      )}

      {/* Bottom Row - Results Info & Settings */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4 pt-4 border-t border-gray-100">
        
        {/* Active Filters Display - Consistent with shared filter pattern */}
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
                Stok: {STOCK_LEVEL_OPTIONS.find(opt => opt.value === filters.stockLevel)?.label || filters.stockLevel}
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
                Expiry: {EXPIRY_OPTIONS.find(opt => opt.value === filters.expiry)?.label || filters.expiry}
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
            onChange={(e) => onItemsPerPageChange(toNumber(e.target.value))}
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
