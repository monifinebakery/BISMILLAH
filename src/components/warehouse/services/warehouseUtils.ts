// src/components/warehouse/services/warehouseUtils.ts
/**
 * Warehouse Utility Functions
 * Simple helper functions (~5KB)
 */

import type { BahanBaku, FilterState, SortConfig } from '../types';

export const warehouseUtils = {
  // Data filtering
  filterItems: (items: BahanBaku[], searchTerm: string, filters: FilterState): BahanBaku[] => {
    let filtered = [...items];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.nama.toLowerCase().includes(term) ||
        item.kategori?.toLowerCase().includes(term) ||
        item.supplier?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(item => item.kategori === filters.category);
    }

    // Supplier filter
    if (filters.supplier) {
      filtered = filtered.filter(item => item.supplier === filters.supplier);
    }

    // Stock level filter
    if (filters.stockLevel === 'low') {
      filtered = filtered.filter(item => item.stok <= item.minimum);
    } else if (filters.stockLevel === 'out') {
      filtered = filtered.filter(item => item.stok === 0);
    }

    // Expiry filter
    if (filters.expiry === 'expiring') {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + 30);
      filtered = filtered.filter(item => {
        if (!item.expiry) return false;
        const expiryDate = new Date(item.expiry);
        return expiryDate <= threshold && expiryDate > new Date();
      });
    } else if (filters.expiry === 'expired') {
      filtered = filtered.filter(item => {
        if (!item.expiry) return false;
        return new Date(item.expiry) < new Date();
      });
    }

    return filtered;
  },

  // Data sorting
  sortItems: (items: BahanBaku[], sortConfig: SortConfig): BahanBaku[] => {
    return [...items].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  },

  // Extract unique values for filters
  getUniqueCategories: (items: BahanBaku[]): string[] => {
    const categories = new Set(items.map(item => item.kategori).filter(Boolean));
    return Array.from(categories).sort();
  },

  getUniqueSuppliers: (items: BahanBaku[]): string[] => {
    const suppliers = new Set(items.map(item => item.supplier).filter(Boolean));
    return Array.from(suppliers).sort();
  },

  // Analysis functions
  getLowStockItems: (items: BahanBaku[]): BahanBaku[] => {
    return items.filter(item => item.stok <= item.minimum);
  },

  getOutOfStockItems: (items: BahanBaku[]): BahanBaku[] => {
    return items.filter(item => item.stok === 0);
  },

  getExpiringItems: (items: BahanBaku[], days: number = 30): BahanBaku[] => {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    
    return items.filter(item => {
      if (!item.expiry) return false;
      const expiryDate = new Date(item.expiry);
      return expiryDate <= threshold && expiryDate > new Date();
    });
  },

  // Validation
  validateBahanBaku: (data: Partial<BahanBaku>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.nama?.trim()) {
      errors.push('Nama bahan baku harus diisi');
    }

    if (!data.kategori?.trim()) {
      errors.push('Kategori harus diisi');
    }

    if (!data.supplier?.trim()) {
      errors.push('Supplier harus diisi');
    }

    if (typeof data.stok !== 'number' || data.stok < 0) {
      errors.push('Stok harus berupa angka positif');
    }

    if (typeof data.minimum !== 'number' || data.minimum < 0) {
      errors.push('Minimum stok harus berupa angka positif');
    }

    if (!data.satuan?.trim()) {
      errors.push('Satuan harus diisi');
    }

    if (typeof data.harga !== 'number' || data.harga < 0) {
      errors.push('Harga harus berupa angka positif');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Formatting helpers
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  },

  formatDate: (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(dateObj);
  },

  formatStockLevel: (current: number, minimum: number): {
    level: 'high' | 'medium' | 'low' | 'out';
    percentage: number;
    color: string;
  } => {
    if (current === 0) {
      return { level: 'out', percentage: 0, color: 'red' };
    }
    
    const percentage = (current / (minimum * 2)) * 100;
    
    if (current <= minimum) {
      return { level: 'low', percentage, color: 'red' };
    } else if (current <= minimum * 1.5) {
      return { level: 'medium', percentage, color: 'yellow' };
    } else {
      return { level: 'high', percentage, color: 'green' };
    }
  },

  // Export helpers
  prepareExportData: (items: BahanBaku[]) => {
    return items.map(item => ({
      'Nama': item.nama,
      'Kategori': item.kategori,
      'Supplier': item.supplier,
      'Stok': item.stok,
      'Minimum': item.minimum,
      'Satuan': item.satuan,
      'Harga': warehouseUtils.formatCurrency(item.harga),
      'Kadaluarsa': item.expiry ? warehouseUtils.formatDate(item.expiry) : '-',
      'Dibuat': warehouseUtils.formatDate(item.createdAt),
      'Diupdate': warehouseUtils.formatDate(item.updatedAt),
    }));
  },

  // Pagination helpers
  paginateItems: <T>(items: T[], page: number, itemsPerPage: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      items: items.slice(startIndex, endIndex),
      totalPages: Math.ceil(items.length / itemsPerPage),
      startIndex,
      endIndex: Math.min(endIndex, items.length),
      currentPage: page,
      totalItems: items.length,
    };
  },

  // Performance helpers
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  throttle: <T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let lastExecTime = 0;
    
    return (...args: Parameters<T>) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime >= delay) {
        func(...args);
        lastExecTime = currentTime;
      }
    };
  },
};

export default warehouseUtils;