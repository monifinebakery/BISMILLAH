// src/components/warehouse/services/warehouseUtils.ts
// ✅ Updated for package content support and proper unit price calculations
/**
 * Warehouse Utility Functions - Enhanced Package Content Support
 * Simple helper functions with proper package calculation handling
 */

import type { 
  BahanBakuFrontend, 
  FilterState, 
  SortConfig, 
  ValidationResult, 
  PackageCalculation,
  StockAnalytics,
  BahanBakuFormData
} from '../types';

export const warehouseUtils = {
  // ✅ ENHANCED: Data filtering with package content awareness
  filterItems: (items: BahanBakuFrontend[], searchTerm: string, filters: FilterState): BahanBakuFrontend[] => {
    let filtered = [...items];

    // Search filter - enhanced to include package info
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.nama.toLowerCase().includes(term) ||
        item.kategori?.toLowerCase().includes(term) ||
        item.supplier?.toLowerCase().includes(term) ||
        item.satuan?.toLowerCase().includes(term) ||
        item.satuanKemasan?.toLowerCase().includes(term)
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

  // Data sorting (same as before)
  sortItems: (items: BahanBakuFrontend[], sortConfig: SortConfig): BahanBakuFrontend[] => {
    return [...items].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  },

  // Extract unique values for filters (same as before)
  getUniqueCategories: (items: BahanBakuFrontend[]): string[] => {
    const categories = new Set(items.map(item => item.kategori).filter(Boolean));
    return Array.from(categories).sort();
  },

  getUniqueSuppliers: (items: BahanBakuFrontend[]): string[] => {
    const suppliers = new Set(items.map(item => item.supplier).filter(Boolean));
    return Array.from(suppliers).sort();
  },

  // ✅ NEW: Get unique units
  getUniqueUnits: (items: BahanBakuFrontend[]): string[] => {
    const units = new Set(items.map(item => item.satuan).filter(Boolean));
    return Array.from(units).sort();
  },

  // Analysis functions (same as before)
  getLowStockItems: (items: BahanBakuFrontend[]): BahanBakuFrontend[] => {
    return items.filter(item => item.stok <= item.minimum);
  },

  getOutOfStockItems: (items: BahanBakuFrontend[]): BahanBakuFrontend[] => {
    return items.filter(item => item.stok === 0);
  },

  getExpiringItems: (items: BahanBakuFrontend[], days: number = 30): BahanBakuFrontend[] => {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);
    
    return items.filter(item => {
      if (!item.expiry) return false;
      const expiryDate = new Date(item.expiry);
      return expiryDate <= threshold && expiryDate > new Date();
    });
  },

  // ✅ NEW: Package analysis functions
  getItemsWithPackageInfo: (items: BahanBakuFrontend[]): BahanBakuFrontend[] => {
    return items.filter(item => 
      item.jumlahBeliKemasan && 
      item.isiPerKemasan && 
      item.hargaTotalBeliKemasan
    );
  },

  getItemsWithPriceInconsistency: (items: BahanBakuFrontend[], tolerance: number = 0.1): BahanBakuFrontend[] => {
    return items.filter(item => {
      if (!item.jumlahBeliKemasan || !item.isiPerKemasan || !item.hargaTotalBeliKemasan) {
        return false;
      }

      const calculatedPrice = warehouseUtils.calculateUnitPrice(
        item.jumlahBeliKemasan,
        item.isiPerKemasan,
        item.hargaTotalBeliKemasan
      );

      return Math.abs(calculatedPrice - item.harga) > item.harga * tolerance;
    });
  },

  // ✅ ENHANCED: Validation with package content support
  validateBahanBaku: (data: Partial<BahanBakuFrontend>): ValidationResult => {
    const errors: { field: string; message: string }[] = [];
    const warnings: { field: string; message: string }[] = [];

    // Basic field validation
    if (!data.nama?.trim()) {
      errors.push({ field: 'nama', message: 'Nama bahan baku harus diisi' });
    }

    if (!data.kategori?.trim()) {
      errors.push({ field: 'kategori', message: 'Kategori harus diisi' });
    }