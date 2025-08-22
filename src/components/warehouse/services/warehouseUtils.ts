// src/components/warehouse/services/warehouseUtils.ts
import type { BahanBakuFrontend, FilterState, SortConfig, ValidationResult } from '../types';
// Note: Avoid importing the barrel (../services/index.ts) here to prevent circular dependencies
import { logger } from '@/utils/logger';
// Default kategori untuk sinkron dengan analisis profit
import { FNB_COGS_CATEGORIES } from '@/components/profitAnalysis/constants/profitConstants';

/**
 * Get effective unit price using weighted average cost (WAC) if available
 * 
 * Priority:
 * 1. WAC (hargaRataRata) - Most accurate, calculated from purchase history
 * 2. Base unit price (harga) - User input/fallback
 * 
 * @param item Warehouse item
 * @returns Effective unit price to use for calculations
 */
const getEffectiveUnitPrice = (item: BahanBakuFrontend): number => {
  if (!item) return 0;
  
  const wac = Number(item.hargaRataRata ?? 0);
  const base = Number(item.harga ?? 0);
  const price = wac > 0 ? wac : base;
  
  if (wac > 0 && Math.abs(wac - base) > base * 0.2) {
    // Log significant price difference for debugging (> 20% difference)
    logger.debug(`WAC price differs significantly from base price for item ${item.nama}:`, {
      wac,
      base,
      difference: Math.abs(wac - base),
      percentDiff: Math.abs(wac - base) / base * 100
    });
  }
  
  return price;
};

/**
 * Check if an item is using WAC pricing
 * This helps UI components indicate which pricing model is active
 */
const isUsingWac = (item: BahanBakuFrontend): boolean => {
  return item && Number(item.hargaRataRata ?? 0) > 0;
};

// Helper functions defined upfront to avoid self-referencing within object literal
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
    .format(typeof date === 'string' ? new Date(date) : date);

const getLowStockItems = (items: BahanBakuFrontend[]) => items.filter(i => i.stok <= i.minimum);
const getOutOfStockItems = (items: BahanBakuFrontend[]) => items.filter(i => i.stok === 0);
const getExpiringItems = (items: BahanBakuFrontend[], days = 30) => {
  const threshold = new Date(); threshold.setDate(threshold.getDate() + days);
  return items.filter(i => i.expiry && new Date(i.expiry) <= threshold && new Date(i.expiry) > new Date());
};

export const warehouseUtils = {
  getEffectiveUnitPrice,
  isUsingWac,

  filterItems: (items: BahanBakuFrontend[], searchTerm: string, filters: FilterState): BahanBakuFrontend[] => {
    let filtered = [...items];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.nama.toLowerCase().includes(term) ||
        item.kategori?.toLowerCase().includes(term) ||
        item.supplier?.toLowerCase().includes(term)
      );
    }
    if (filters.category) filtered = filtered.filter(item => item.kategori === filters.category);
    if (filters.supplier) filtered = filtered.filter(item => item.supplier === filters.supplier);
    if (filters.stockLevel === 'low') filtered = filtered.filter(item => item.stok <= item.minimum);
    if (filters.stockLevel === 'out') filtered = filtered.filter(item => item.stok === 0);

    if (filters.expiry === 'expiring') {
      const threshold = new Date(); threshold.setDate(threshold.getDate() + 30);
      filtered = filtered.filter(item => item.expiry && new Date(item.expiry) <= threshold && new Date(item.expiry) > new Date());
    } else if (filters.expiry === 'expired') {
      filtered = filtered.filter(item => item.expiry && new Date(item.expiry) < new Date());
    }
    return filtered;
  },

  sortItems: (items: BahanBakuFrontend[], sortConfig: SortConfig): BahanBakuFrontend[] => {
    const key = sortConfig.key;
    return [...items].sort((a, b) => {
      let av: any = a[key as keyof BahanBakuFrontend];
      let bv: any = b[key as keyof BahanBakuFrontend];

      if (key === 'harga' || key === 'hargaRataRata') {
        av = getEffectiveUnitPrice(a);
        bv = getEffectiveUnitPrice(b);
      }
      const na = typeof av === 'number' ? av : (av ? String(av).toLowerCase() : '');
      const nb = typeof bv === 'number' ? bv : (bv ? String(bv).toLowerCase() : '');
      if (na < nb) return sortConfig.direction === 'asc' ? -1 : 1;
      if (na > nb) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  },

  getUniqueCategories: (items: BahanBakuFrontend[]) => {
    const categories = Array.from(new Set(items.map(i => i.kategori).filter(Boolean)));
    return categories.length > 0 ? categories.sort() : [...FNB_COGS_CATEGORIES];
  },
  getUniqueSuppliers:  (items: BahanBakuFrontend[]) => Array.from(new Set(items.map(i => i.supplier).filter(Boolean))).sort(),

  // Expose helpers via object (no self-reference inside initializer)
  getLowStockItems,
  getOutOfStockItems,
  getExpiringItems,

  // Validation (tanpa kemasan)
  validateBahanBaku: (data: Partial<BahanBakuFrontend>): ValidationResult => {
    const errors: string[] = [];
    if (!data.nama?.trim()) errors.push('Nama bahan baku harus diisi');
    if (!data.kategori?.trim()) errors.push('Kategori harus diisi');
    if (!data.supplier?.trim()) errors.push('Supplier harus diisi');
    if (typeof data.stok !== 'number' || data.stok < 0) errors.push('Stok harus berupa angka positif');
    if (typeof data.minimum !== 'number' || data.minimum < 0) errors.push('Minimum stok harus berupa angka positif');
    if (!data.satuan?.trim()) errors.push('Satuan harus diisi');
    if (typeof data.harga !== 'number' || data.harga < 0) errors.push('Harga satuan harus berupa angka positif');
    if (data.expiry?.trim()) {
      const d = new Date(data.expiry);
      if (isNaN(d.getTime())) errors.push('Format tanggal kadaluarsa tidak valid');
    }
    return { isValid: errors.length === 0, errors };
  },

  formatCurrency,
  formatDate,

  formatStockLevel: (current: number, minimum: number) => {
    if (current === 0) return { level: 'out' as const, percentage: 0, color: 'red' };
    const percentage = (current / (minimum * 2)) * 100;
    if (current <= minimum) return { level: 'low' as const, percentage, color: 'red' };
    if (current <= minimum * 1.5) return { level: 'medium' as const, percentage, color: 'yellow' };
    return { level: 'high' as const, percentage, color: 'green' };
  },
  
  /**
   * Calculates total value of stock using effective price
   * This considers WAC when available for accurate valuation
   */
  calculateStockValue: (items: BahanBakuFrontend[]): number => {
    if (!items || !Array.isArray(items)) return 0;
    
    return items.reduce((sum, item) => {
      const price = getEffectiveUnitPrice(item);
      const quantity = Number(item.stok || 0);
      return sum + (price * quantity);
    }, 0);
  },

  /**
   * Prepare data for export with clear distinction between price types
   * This helps user understand which price is being used in calculations
   */
  prepareExportData: (items: BahanBakuFrontend[]) => items.map(item => {
    const isUsingWacPrice = isUsingWac(item);
    return {
      'Nama': item.nama,
      'Kategori': item.kategori,
      'Supplier': item.supplier,
      'Stok': item.stok,
      'Minimum': item.minimum,
      'Satuan': item.satuan,
      'Harga Satuan (Input)': formatCurrency(item.harga || 0),
      'Harga Rata-rata (WAC)': item.hargaRataRata != null ? formatCurrency(item.hargaRataRata) : '-',
      'Harga Efektif': formatCurrency(getEffectiveUnitPrice(item)),
      'Metode Harga': isUsingWacPrice ? 'Rata-rata Tertimbang (WAC)' : 'Harga Input',
      'Nilai Total Stok': formatCurrency(getEffectiveUnitPrice(item) * (item.stok || 0)),
      'Tanggal Kadaluarsa': item.expiry ? formatDate(item.expiry) : '-',
      'Dibuat': formatDate(item.createdAt),
      'Diupdate': formatDate(item.updatedAt),
    };
  }),

  // Simple report (tanpa package efficiency)
  generateStockReport: (items: BahanBakuFrontend[]) => {
    const totalItems = items.length;
    const lowStockItems = getLowStockItems(items);
    const outOfStockItems = getOutOfStockItems(items);
    const expiringItems = getExpiringItems(items, 30);
    const totalValue = items.reduce((s, it) => s + it.stok * getEffectiveUnitPrice(it), 0);
    const averageStockLevel = totalItems ? Math.round(items.reduce((s, it) => s + it.stok, 0) / totalItems) : 0;
    const categories = items.reduce((acc, it) => { acc[it.kategori] = (acc[it.kategori] || 0) + 1; return acc; }, {} as Record<string, number>);
    return {
      summary: { totalItems, lowStockCount: lowStockItems.length, outOfStockCount: outOfStockItems.length, expiringCount: expiringItems.length, totalValue, averageStockLevel },
      categories,
      alerts: { lowStock: lowStockItems, outOfStock: outOfStockItems, expiring: expiringItems }
    };
  },

  // small helpers
  paginateItems<T>(items: T[], page: number, perPage: number) {
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return { items: items.slice(start, end), totalPages: Math.ceil(items.length / perPage), startIndex: start, endIndex: Math.min(end, items.length), currentPage: page, totalItems: items.length };
  },

  debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
    let t: NodeJS.Timeout; return (...args: Parameters<T>) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  },

  throttle<T extends (...args: any[]) => any>(fn: T, delay: number) {
    let last = 0; return (...args: Parameters<T>) => { const now = Date.now(); if (now - last >= delay) { fn(...args); last = now; } };
  },
};

export default warehouseUtils;
