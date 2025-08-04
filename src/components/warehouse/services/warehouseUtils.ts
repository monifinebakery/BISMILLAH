// src/components/warehouse/services/warehouseUtils.ts (Updated for new schema)
/**
 * Warehouse Utility Functions (Updated for exact Supabase schema)
 * Simple helper functions with database field mapping
 * Enhanced with last update tracking and helper functions
 */

import type { BahanBakuFrontend, FilterState, SortConfig, ValidationResult } from '../types';

export const warehouseUtils = {
  // Data filtering (updated for new field names)
  filterItems: (items: BahanBakuFrontend[], searchTerm: string, filters: FilterState): BahanBakuFrontend[] => {
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

    // Expiry filter (using tanggal_kadaluwarsa -> expiry)
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

  // Data sorting (updated for new field names)
  sortItems: (items: BahanBakuFrontend[], sortConfig: SortConfig): BahanBakuFrontend[] => {
    return [...items].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  },

  // Extract unique values for filters
  getUniqueCategories: (items: BahanBakuFrontend[]): string[] => {
    const categories = new Set(items.map(item => item.kategori).filter(Boolean));
    return Array.from(categories).sort();
  },

  getUniqueSuppliers: (items: BahanBakuFrontend[]): string[] => {
    const suppliers = new Set(items.map(item => item.supplier).filter(Boolean));
    return Array.from(suppliers).sort();
  },

  // Analysis functions (updated for new field names)
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

  // NEW: Enhanced stock level calculation with number conversion
  getStockLevel: (item: BahanBakuFrontend) => {
    const stok = Number(item.stok) || 0;
    const minimum = Number(item.minimum) || 0;
    
    if (stok <= 0) {
      return { level: 'out', color: 'red', label: 'Stok Habis' };
    } else if (stok <= minimum) {
      return { level: 'low', color: 'yellow', label: 'Stok Rendah' };
    } else if (stok <= minimum * 2) {
      return { level: 'medium', color: 'blue', label: 'Stok Sedang' };
    } else {
      return { level: 'good', color: 'green', label: 'Stok Baik' };
    }
  },

  // NEW: Check if item is expiring soon (within 7 days)
  isExpiringItem: (item: BahanBakuFrontend): boolean => {
    if (!item.expiry) return false;
    const expiryDate = new Date(item.expiry);
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + 7); // 7 days warning
    return expiryDate <= threshold && expiryDate > new Date();
  },

  // NEW: Check if item has low stock
  isLowStockItem: (item: BahanBakuFrontend): boolean => {
    const stok = Number(item.stok) || 0;
    const minimum = Number(item.minimum) || 0;
    return stok <= minimum && stok > 0;
  },

  // NEW: Check if item is out of stock
  isOutOfStockItem: (item: BahanBakuFrontend): boolean => {
    const stok = Number(item.stok) || 0;
    return stok <= 0;
  },

  // NEW: Format last update time with relative formatting
  formatLastUpdate: (timestamp?: string | Date): string => {
    if (!timestamp) return 'Tidak diketahui';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInMinutes < 1) {
      return 'Baru saja';
    } else if (diffInMinutes < 60) {
      const minutes = Math.floor(diffInMinutes);
      return `${minutes} menit yang lalu`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} jam yang lalu`;
    } else if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `${days} hari yang lalu`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} minggu yang lalu`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} bulan yang lalu`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `${years} tahun yang lalu`;
    }
  },

  // NEW: Format last update time (compact version for desktop)
  formatLastUpdateCompact: (timestamp?: string | Date): string => {
    if (!timestamp) return '-';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInMinutes < 1) {
      return 'Baru saja';
    } else if (diffInMinutes < 60) {
      const minutes = Math.floor(diffInMinutes);
      return `${minutes} menit lalu`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} jam lalu`;
    } else if (diffInDays < 7) {
      const days = Math.floor(diffInDays);
      return `${days} hari lalu`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} minggu lalu`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} bulan lalu`;
    } else {
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }).format(date);
    }
  },

  // NEW: Highlight search terms in text
  highlightText: (text: string, searchTerm: string): React.ReactNode => {
    if (!searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        React.createElement('mark', { key: index, className: 'bg-yellow-200 px-1 rounded' }, part)
      ) : part
    );
  },

  // NEW: Get stock level color class for styling
  getStockLevelColorClass: (item: BahanBakuFrontend): string => {
    const stockLevel = warehouseUtils.getStockLevel(item);
    
    const colorClasses = {
      out: 'bg-red-500',
      low: 'bg-yellow-500',
      medium: 'bg-blue-500',
      good: 'bg-green-500'
    };
    
    return colorClasses[stockLevel.level as keyof typeof colorClasses] || 'bg-gray-500';
  },

  // NEW: Get row background color class for table rows
  getRowBackgroundClass: (item: BahanBakuFrontend, isSelected: boolean): string => {
    const stockLevel = warehouseUtils.getStockLevel(item);
    
    if (isSelected) return 'bg-orange-50';
    if (stockLevel.level === 'out') return 'bg-red-50';
    if (stockLevel.level === 'low') return 'bg-yellow-50';
    return '';
  },

  // NEW: Get alert indicators for an item
  getItemAlerts: (item: BahanBakuFrontend): Array<{
    type: 'expiring' | 'outOfStock' | 'lowStock';
    message: string;
    color: string;
    priority: number;
  }> => {
    const alerts = [];
    
    if (warehouseUtils.isExpiringItem(item)) {
      alerts.push({
        type: 'expiring' as const,
        message: 'Akan kadaluarsa',
        color: 'text-red-600',
        priority: 1
      });
    }
    
    if (warehouseUtils.isOutOfStockItem(item)) {
      alerts.push({
        type: 'outOfStock' as const,
        message: 'Stok habis',
        color: 'text-red-600',
        priority: 1
      });
    } else if (warehouseUtils.isLowStockItem(item)) {
      alerts.push({
        type: 'lowStock' as const,
        message: 'Stok hampir habis',
        color: 'text-yellow-600',
        priority: 2
      });
    }
    
    return alerts.sort((a, b) => a.priority - b.priority);
  },

  // NEW: Debug helper for development
  debugItem: (item: BahanBakuFrontend): void => {
    if (process.env.NODE_ENV === 'development' && item.nama.includes('Debug')) {
      console.log('=== WAREHOUSE TABLE DEBUG ===');
      console.log('Item:', item.nama);
      console.log('Stok:', item.stok, typeof item.stok);
      console.log('Minimum:', item.minimum, typeof item.minimum);
      console.log('Harga:', item.harga, typeof item.harga);
      console.log('Stock Level:', warehouseUtils.getStockLevel(item));
      console.log('Low Stock:', warehouseUtils.isLowStockItem(item));
      console.log('Out of Stock:', warehouseUtils.isOutOfStockItem(item));
      console.log('Expiring:', warehouseUtils.isExpiringItem(item));
      console.log('Alerts:', warehouseUtils.getItemAlerts(item));
      console.log('Last Update:', warehouseUtils.formatLastUpdate(item.updatedAt));
      console.log('============================');
    }
  },

  // Validation (updated for new field names)
  validateBahanBaku: (data: Partial<BahanBakuFrontend>): ValidationResult => {
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
      errors.push('Harga satuan harus berupa angka positif');
    }

    // Validate expiry date if provided
    if (data.expiry && data.expiry.trim()) {
      const expiryDate = new Date(data.expiry);
      if (isNaN(expiryDate.getTime())) {
        errors.push('Format tanggal kadaluarsa tidak valid');
      }
    }

    // Validate packaging fields if provided
    if (data.jumlahBeliKemasan !== undefined && data.jumlahBeliKemasan < 0) {
      errors.push('Jumlah beli kemasan harus berupa angka positif');
    }

    if (data.hargaTotalBeliKemasan !== undefined && data.hargaTotalBeliKemasan < 0) {
      errors.push('Harga total beli kemasan harus berupa angka positif');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Formatting helpers (updated for new field names)
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

  // Export helpers (updated for new field names + last update)
  prepareExportData: (items: BahanBakuFrontend[]) => {
    return items.map(item => ({
      'Nama': item.nama,
      'Kategori': item.kategori,
      'Supplier': item.supplier,
      'Stok': item.stok,
      'Minimum': item.minimum,
      'Satuan': item.satuan,
      'Harga Satuan': warehouseUtils.formatCurrency(item.harga),
      'Tanggal Kadaluarsa': item.expiry ? warehouseUtils.formatDate(item.expiry) : '-',
      'Jumlah Beli Kemasan': item.jumlahBeliKemasan || '-',
      'Satuan Kemasan': item.satuanKemasan || '-',
      'Harga Total Beli Kemasan': item.hargaTotalBeliKemasan ? warehouseUtils.formatCurrency(item.hargaTotalBeliKemasan) : '-',
      'Dibuat': warehouseUtils.formatDate(item.createdAt),
      'Diupdate': warehouseUtils.formatDate(item.updatedAt),
      'Terakhir Diupdate': warehouseUtils.formatLastUpdate(item.updatedAt),
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

  // Calculate packaging metrics
  calculatePackagingMetrics: (item: BahanBakuFrontend) => {
    const metrics = {
      unitCostFromPackage: 0,
      packagingEfficiency: 0,
      totalValue: item.stok * item.harga,
    };

    // Calculate unit cost from packaging if data is available
    if (item.jumlahBeliKemasan && item.hargaTotalBeliKemasan && item.jumlahBeliKemasan > 0) {
      metrics.unitCostFromPackage = item.hargaTotalBeliKemasan / item.jumlahBeliKemasan;
      
      // Calculate efficiency (lower is better)
      if (item.harga > 0) {
        metrics.packagingEfficiency = (metrics.unitCostFromPackage / item.harga) * 100;
      }
    }

    return metrics;
  },

  // Stock management helpers
  suggestReorderQuantity: (item: BahanBakuFrontend, avgUsagePerDay: number = 1): number => {
    // Simple reorder calculation: enough for 30 days + safety stock
    const safetyStock = item.minimum;
    const thirtyDaysStock = avgUsagePerDay * 30;
    const currentShortfall = Math.max(0, item.minimum - item.stok);
    
    return Math.ceil(thirtyDaysStock + safetyStock + currentShortfall);
  },

  // Generate stock report data (enhanced with last update info)
  generateStockReport: (items: BahanBakuFrontend[]) => {
    const totalItems = items.length;
    const lowStockItems = warehouseUtils.getLowStockItems(items);
    const outOfStockItems = warehouseUtils.getOutOfStockItems(items);
    const expiringItems = warehouseUtils.getExpiringItems(items, 30);
    
    const totalValue = items.reduce((sum, item) => sum + (item.stok * item.harga), 0);
    const averageStockLevel = items.reduce((sum, item) => sum + item.stok, 0) / totalItems;
    
    const categoryBreakdown = items.reduce((acc, item) => {
      acc[item.kategori] = (acc[item.kategori] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // NEW: Find recently updated items (within last 24 hours)
    const recentlyUpdated = items.filter(item => {
      if (!item.updatedAt) return false;
      const updateTime = new Date(item.updatedAt);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return updateTime > yesterday;
    });

    return {
      summary: {
        totalItems,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
        expiringCount: expiringItems.length,
        recentlyUpdatedCount: recentlyUpdated.length,
        totalValue,
        averageStockLevel: Math.round(averageStockLevel),
      },
      categories: categoryBreakdown,
      alerts: {
        lowStock: lowStockItems,
        outOfStock: outOfStockItems,
        expiring: expiringItems,
        recentlyUpdated: recentlyUpdated,
      }
    };
  },
};

export default warehouseUtils;