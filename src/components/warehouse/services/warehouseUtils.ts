// src/components/warehouse/services/warehouseUtils.ts
import type { BahanBakuFrontend, FilterState, SortConfig, ValidationResult } from '../types';

import { warehouseUtils } from '@/components/warehouse/services';

// Harga efektif: pakai WAC kalau ada, else harga input
const getEffectiveUnitPrice = (item: BahanBakuFrontend): number => {
  const wac = Number(item.hargaRataRata ?? 0);
  const base = Number(item.harga ?? 0);
  return wac > 0 ? wac : base;
};

const isUsingWac = (item: BahanBakuFrontend): boolean => Number(item.hargaRataRata ?? 0) > 0;

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

  getUniqueCategories: (items: BahanBakuFrontend[]) => Array.from(new Set(items.map(i => i.kategori).filter(Boolean))).sort(),
  getUniqueSuppliers:  (items: BahanBakuFrontend[]) => Array.from(new Set(items.map(i => i.supplier).filter(Boolean))).sort(),

  getLowStockItems: (items: BahanBakuFrontend[]) => items.filter(i => i.stok <= i.minimum),
  getOutOfStockItems: (items: BahanBakuFrontend[]) => items.filter(i => i.stok === 0),
  getExpiringItems: (items: BahanBakuFrontend[], days = 30) => {
    const threshold = new Date(); threshold.setDate(threshold.getDate() + days);
    return items.filter(i => i.expiry && new Date(i.expiry) <= threshold && new Date(i.expiry) > new Date());
  },

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

  formatCurrency: (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount),

  formatDate: (date: string | Date) =>
    new Intl.DateTimeFormat('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })
      .format(typeof date === 'string' ? new Date(date) : date),

  formatStockLevel: (current: number, minimum: number) => {
    if (current === 0) return { level: 'out' as const, percentage: 0, color: 'red' };
    const percentage = (current / (minimum * 2)) * 100;
    if (current <= minimum) return { level: 'low' as const, percentage, color: 'red' };
    if (current <= minimum * 1.5) return { level: 'medium' as const, percentage, color: 'yellow' };
    return { level: 'high' as const, percentage, color: 'green' };
  },

  // Export (pakai harga efektif)
  prepareExportData: (items: BahanBakuFrontend[]) => items.map(item => ({
    'Nama': item.nama,
    'Kategori': item.kategori,
    'Supplier': item.supplier,
    'Stok': item.stok,
    'Minimum': item.minimum,
    'Satuan': item.satuan,
    'Harga Satuan (Input)': warehouseUtils.formatCurrency(item.harga || 0),
    'Harga Rata-rata (WAC)': item.hargaRataRata != null ? warehouseUtils.formatCurrency(item.hargaRataRata) : '-',
    'Harga Efektif': warehouseUtils.formatCurrency(getEffectiveUnitPrice(item)),
    'Tanggal Kadaluarsa': item.expiry ? warehouseUtils.formatDate(item.expiry) : '-',
    'Dibuat': warehouseUtils.formatDate(item.createdAt),
    'Diupdate': warehouseUtils.formatDate(item.updatedAt),
  })),

  // Simple report (tanpa package efficiency)
  generateStockReport: (items: BahanBakuFrontend[]) => {
    const totalItems = items.length;
    const lowStockItems = warehouseUtils.getLowStockItems(items);
    const outOfStockItems = warehouseUtils.getOutOfStockItems(items);
    const expiringItems = warehouseUtils.getExpiringItems(items, 30);
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
