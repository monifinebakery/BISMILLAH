// src/components/warehouse/hooks/useWarehouseFilters.ts
import { useState, useMemo, useCallback } from 'react';
import { BahanBaku, FilterOptions, SortConfig } from '../types/warehouse';

interface UseWarehouseFiltersProps {
  items: BahanBaku[];
}

interface UseWarehouseFiltersReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: FilterOptions;
  setFilters: (filters: Partial<FilterOptions>) => void;
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig) => void;
  filteredItems: BahanBaku[];
  resetFilters: () => void;
  activeFiltersCount: number;
  availableCategories: string[];
  availableSuppliers: string[];
}

const defaultFilters: FilterOptions = {
  kategori: [],
  supplier: [],
  stokRendah: false,
  hampirExpired: false,
  dateRange: {
    start: null,
    end: null,
  },
};

export const useWarehouseFilters = ({ 
  items 
}: UseWarehouseFiltersProps): UseWarehouseFiltersReturn => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFiltersState] = useState<FilterOptions>(defaultFilters);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: 'nama', 
    direction: 'asc' 
  });

  // Get available filter options from data
  const availableCategories = useMemo(() => {
    const categories = items.map(item => item.kategori).filter(Boolean);
    return Array.from(new Set(categories)).sort();
  }, [items]);

  const availableSuppliers = useMemo(() => {
    const suppliers = items.map(item => item.supplier).filter(Boolean);
    return Array.from(new Set(suppliers)).sort();
  }, [items]);

  // Helper functions for filtering
  const isLowStock = useCallback((item: BahanBaku) => {
    return item.stok <= item.minimum;
  }, []);

  const isExpiringSoon = useCallback((item: BahanBaku, days: number = 7) => {
    if (!item.tanggalKadaluwarsa) return false;
    const today = new Date();
    const expiryDate = new Date(item.tanggalKadaluwarsa);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days && diffDays > 0;
  }, []);

  const isInDateRange = useCallback((item: BahanBaku, start: Date | null, end: Date | null) => {
    if (!start && !end) return true;
    if (!item.tanggalKadaluwarsa) return !start && !end;
    
    const itemDate = new Date(item.tanggalKadaluwarsa);
    
    if (start && itemDate < start) return false;
    if (end && itemDate > end) return false;
    
    return true;
  }, []);

  // Apply search filter
  const searchFilteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    
    const term = searchTerm.toLowerCase().trim();
    return items.filter(item => 
      item.nama.toLowerCase().includes(term) ||
      item.kategori.toLowerCase().includes(term) ||
      item.supplier.toLowerCase().includes(term) ||
      item.satuan.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  // Apply filters
  const filteredItems = useMemo(() => {
    let result = searchFilteredItems;

    // Category filter
    if (filters.kategori.length > 0) {
      result = result.filter(item => filters.kategori.includes(item.kategori));
    }

    // Supplier filter
    if (filters.supplier.length > 0) {
      result = result.filter(item => filters.supplier.includes(item.supplier));
    }

    // Low stock filter
    if (filters.stokRendah) {
      result = result.filter(isLowStock);
    }

    // Expiring soon filter
    if (filters.hampirExpired) {
      result = result.filter(item => isExpiringSoon(item));
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      result = result.filter(item => 
        isInDateRange(item, filters.dateRange.start, filters.dateRange.end)
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof BahanBaku];
        const bValue = b[sortConfig.key as keyof BahanBaku];

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue == null) return sortConfig.direction === 'asc' ? -1 : 1;

        // Handle dates
        if (aValue instanceof Date && bValue instanceof Date) {
          const comparison = aValue.getTime() - bValue.getTime();
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }

        // Handle numbers
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          const comparison = aValue - bValue;
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }

        // Handle strings
        const comparison = String(aValue).localeCompare(String(bValue));
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [searchFilteredItems, filters, sortConfig, isLowStock, isExpiringSoon, isInDateRange]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.kategori.length > 0) count++;
    if (filters.supplier.length > 0) count++;
    if (filters.stokRendah) count++;
    if (filters.hampirExpired) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    return count;
  }, [filters]);

  // Handlers
  const setFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
    setSearchTerm('');
    setSortConfig({ key: 'nama', direction: 'asc' });
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    sortConfig,
    setSortConfig,
    filteredItems,
    resetFilters,
    activeFiltersCount,
    availableCategories,
    availableSuppliers,
  };
};