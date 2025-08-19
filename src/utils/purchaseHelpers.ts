// utils/purchaseHelpers.ts - Helper & Utility Functions

import { 
  Purchase, 
  PurchaseItem, 
  PurchaseStatus, 
  SearchFilters, 
  SortConfig,
  PaginationInfo,
  PurchaseStatistics,
  MonthlyPurchaseData,
  SupplierPurchaseData,
  PURCHASE_STATUS_CONFIG
} from '../types';

// 🔍 Search & Filter Helpers
export const filterPurchases = (
  purchases: Purchase[],
  filters: SearchFilters,
  suppliers: Array<{ id: string; nama: string }> = []
): Purchase[] => {
  return purchases.filter(purchase => {
    // Search term filter (search in supplier name and items)
    if (filters.searchTerm) {
      const supplier = suppliers.find(s => s.id === purchase.supplier);
      const supplierName = supplier?.nama?.toLowerCase() || '';
      const searchTerm = filters.searchTerm.toLowerCase();
      
      const matchesSupplier = supplierName.includes(searchTerm);
      const matchesItems = purchase.items.some(item => 
        item.namaBarang.toLowerCase().includes(searchTerm)
      );
      
      if (!matchesSupplier && !matchesItems) {
        return false;
      }
    }

    // Status filter
    if (filters.statusFilter !== 'all' && purchase.status !== filters.statusFilter) {
      return false;
    }

    // Supplier filter
    if (filters.supplierFilter !== 'all' && purchase.supplier !== filters.supplierFilter) {
      return false;
    }

    // Date range filter
    if (filters.dateRangeFilter.start || filters.dateRangeFilter.end) {
      const purchaseDate = new Date(purchase.tanggal).getTime();
      
      if (filters.dateRangeFilter.start) {
        const startDate = new Date(filters.dateRangeFilter.start).getTime();
        if (purchaseDate < startDate) return false;
      }
      
      if (filters.dateRangeFilter.end) {
        const endDate = new Date(filters.dateRangeFilter.end).getTime();
        if (purchaseDate > endDate) return false;
      }
    }

    // Amount range filter
    if (filters.amountRangeFilter.min !== null || filters.amountRangeFilter.max !== null) {
      if (filters.amountRangeFilter.min !== null && purchase.totalNilai < filters.amountRangeFilter.min) {
        return false;
      }
      
      if (filters.amountRangeFilter.max !== null && purchase.totalNilai > filters.amountRangeFilter.max) {
        return false;
      }
    }

    return true;
  });
};

// 📊 Sorting Helpers
export const sortPurchases = (
  purchases: Purchase[],
  sortConfig: SortConfig,
  suppliers: Array<{ id: string; nama: string }> = []
): Purchase[] => {
  return [...purchases].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    if (sortConfig.field === 'supplierName') {
      const supplierA = suppliers.find(s => s.id === a.supplier);
      const supplierB = suppliers.find(s => s.id === b.supplier);
      aValue = supplierA?.nama || '';
      bValue = supplierB?.nama || '';
    } else {
      aValue = a[sortConfig.field];
      bValue = b[sortConfig.field];
    }

    // Handle Date objects
    if (aValue instanceof Date && bValue instanceof Date) {
      aValue = aValue.getTime();
      bValue = bValue.getTime();
    }

    // Handle string comparison (case insensitive)
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    let comparison = 0;
    if (aValue < bValue) {
      comparison = -1;
    } else if (aValue > bValue) {
      comparison = 1;
    }

    return sortConfig.direction === 'desc' ? -comparison : comparison;
  });
};

// 📄 Pagination Helpers
export const paginatePurchases = (
  purchases: Purchase[],
  currentPage: number,
  itemsPerPage: number
): { paginatedPurchases: Purchase[]; paginationInfo: PaginationInfo } => {
  const totalItems = purchases.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  const paginatedPurchases = purchases.slice(startIndex, endIndex);
  
  const paginationInfo: PaginationInfo = {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startItem: totalItems === 0 ? 0 : startIndex + 1,
    endItem: Math.min(endIndex, totalItems)
  };

  return { paginatedPurchases, paginationInfo };
};

// 🧮 Calculation Helpers
export const calculatePurchaseTotal = (items: PurchaseItem[]): number => {
  return items.reduce((total, item) => total + item.totalHarga, 0);
};

export const calculateItemTotal = (jumlah: number, hargaSatuan: number): number => {
  return jumlah * hargaSatuan;
};

export const calculateAverageOrderValue = (purchases: Purchase[]): number => {
  if (purchases.length === 0) return 0;
  const total = purchases.reduce((sum, purchase) => sum + purchase.totalNilai, 0);
  return total / purchases.length;
};

// 📊 Statistics Helpers
export const calculatePurchaseStatistics = (
  purchases: Purchase[],
  suppliers: Array<{ id: string; nama: string }> = []
): PurchaseStatistics => {
  const totalPurchases = purchases.length;
  const totalValue = purchases.reduce((sum, p) => sum + p.totalNilai, 0);
  const averageValue = totalPurchases > 0 ? totalValue / totalPurchases : 0;

  // Status breakdown
  const statusBreakdown = purchases.reduce(
    (acc, purchase) => {
      acc[purchase.status]++;
      return acc;
    },
    { pending: 0, completed: 0, cancelled: 0 }
  );

  // Monthly trend (last 12 months)
  const monthlyTrend = generateMonthlyTrend(purchases);

  // Top suppliers (top 5)
  const topSuppliers = generateTopSuppliers(purchases, suppliers);

  return {
    totalPurchases,
    totalValue,
    averageValue,
    statusBreakdown,
    monthlyTrend,
    topSuppliers
  };
};

const generateMonthlyTrend = (purchases: Purchase[]): MonthlyPurchaseData[] => {
  const monthlyData = new Map<string, { count: number; totalValue: number; month: string; year: number }>();
  
  purchases.forEach(purchase => {
    const date = new Date(purchase.tanggal);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    
    if (!monthlyData.has(key)) {
      monthlyData.set(key, {
        count: 0,
        totalValue: 0,
        month: date.toLocaleString('id-ID', { month: 'long' }),
        year: date.getFullYear()
      });
    }
    
    const data = monthlyData.get(key)!;
    data.count++;
    data.totalValue += purchase.totalNilai;
  });

  return Array.from(monthlyData.values())
    .sort((a, b) => new Date(a.year, parseInt(a.month)).getTime() - new Date(b.year, parseInt(b.month)).getTime())
    .slice(-12); // Last 12 months
};

const generateTopSuppliers = (
  purchases: Purchase[],
  suppliers: Array<{ id: string; nama: string }>
): SupplierPurchaseData[] => {
  const supplierData = new Map<string, {
    purchaseCount: number;
    totalValue: number;
    lastPurchaseDate: Date;
  }>();

  purchases.forEach(purchase => {
    if (!supplierData.has(purchase.supplier)) {
      supplierData.set(purchase.supplier, {
        purchaseCount: 0,
        totalValue: 0,
        lastPurchaseDate: new Date(purchase.tanggal)
      });
    }

    const data = supplierData.get(purchase.supplier)!;
    data.purchaseCount++;
    data.totalValue += purchase.totalNilai;
    
    const purchaseDate = new Date(purchase.tanggal);
    if (purchaseDate > data.lastPurchaseDate) {
      data.lastPurchaseDate = purchaseDate;
    }
  });

  return Array.from(supplierData.entries())
    .map(([supplierId, data]) => {
      const supplier = suppliers.find(s => s.id === supplierId);
      return {
        supplierId,
        supplierName: supplier?.nama || 'Unknown',
        ...data
      };
    })
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 5); // Top 5 suppliers
};

// 🎨 Display Helpers
export const getStatusDisplay = (status: PurchaseStatus) => {
  return PURCHASE_STATUS_CONFIG[status] || {
    label: status,
    color: 'bg-gray-100 text-gray-800',
    icon: '❓'
  };
};

export const getSupplierName = (
  supplierId: string,
  suppliers: Array<{ id: string; nama: string }>
): string => {
  const supplier = suppliers.find(
    s => s.id === supplierId || s.nama === supplierId
  );
  return supplier?.nama || supplierId || 'Unknown Supplier';
};

export const formatItemsDisplay = (items: PurchaseItem[]): string => {
  if (items.length === 0) return 'No items';
  if (items.length === 1) return `1 item: ${items[0].namaBarang}`;
  return `${items.length} items: ${items[0].namaBarang}${items.length > 1 ? `, +${items.length - 1} more` : ''}`;
};

// 📅 Date Helpers
export const formatPurchaseDate = (date: Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};

export const getRelativeDateString = (date: Date): string => {
  const now = new Date();
  const diffTime = now.getTime() - new Date(date).getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu yang lalu`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} bulan yang lalu`;
  return `${Math.floor(diffDays / 365)} tahun yang lalu`;
};

// 💰 Currency Helpers
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatCompactCurrency = (amount: number): string => {
  if (amount >= 1000000000) {
    return `${formatCurrency(amount / 1000000000)}M`;
  }
  if (amount >= 1000000) {
    return `${formatCurrency(amount / 1000000)}jt`;
  }
  if (amount >= 1000) {
    return `${formatCurrency(amount / 1000)}rb`;
  }
  return formatCurrency(amount);
};

// ✅ Validation Helpers
export const validatePurchaseForm = (formData: {
  supplier: string;
  tanggal: Date;
  items: PurchaseItem[];
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!formData.supplier.trim()) {
    errors.supplier = 'Supplier wajib dipilih';
  }

  if (!formData.tanggal) {
    errors.tanggal = 'Tanggal wajib diisi';
  } else {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (new Date(formData.tanggal) > today) {
      errors.tanggal = 'Tanggal tidak boleh di masa depan';
    }
  }

  if (!formData.items || formData.items.length === 0) {
    errors.items = 'Minimal satu item harus ditambahkan';
  } else {
    // Validate each item
    const hasInvalidItems = formData.items.some(item => 
      !item.namaBarang.trim() || 
      item.jumlah <= 0 || 
      item.hargaSatuan <= 0
    );
    
    if (hasInvalidItems) {
      errors.items = 'Semua item harus memiliki nama, jumlah > 0, dan harga > 0';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateItemForm = (itemData: {
  namaBarang: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!itemData.namaBarang.trim()) {
    errors.namaBarang = 'Nama barang wajib diisi';
  }

  if (!itemData.jumlah || itemData.jumlah <= 0) {
    errors.jumlah = 'Jumlah harus lebih dari 0';
  }

  if (!itemData.satuan.trim()) {
    errors.satuan = 'Satuan wajib diisi';
  }

  if (!itemData.hargaSatuan || itemData.hargaSatuan <= 0) {
    errors.hargaSatuan = 'Harga satuan harus lebih dari 0';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// 🔧 Utility Helpers
export const generatePurchaseId = (): string => {
  return `PUR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

export const generateItemId = (): string => {
  return `ITM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 📊 Export Helpers
export const preparePurchasesForExport = (
  purchases: Purchase[],
  suppliers: Array<{ id: string; nama: string }>,
  includeItems: boolean = false
) => {
  return purchases.map(purchase => {
    const supplier = suppliers.find(s => s.id === purchase.supplier);
    
    const baseData = {
      'ID': purchase.id,
      'Tanggal': formatPurchaseDate(purchase.tanggal),
      'Supplier': supplier?.nama || 'Unknown',
      'Total Nilai': formatCurrency(purchase.totalNilai),
      'Status': getStatusDisplay(purchase.status).label,
      'Jumlah Item': purchase.items.length,
      'Dibuat': formatPurchaseDate(purchase.createdAt),
      'Diperbarui': formatPurchaseDate(purchase.updatedAt)
    };

    if (includeItems) {
      const itemsData = purchase.items.map((item, index) => ({
        [`Item ${index + 1} - Nama`]: item.namaBarang,
        [`Item ${index + 1} - Jumlah`]: `${item.jumlah} ${item.satuan}`,
        [`Item ${index + 1} - Harga Satuan`]: formatCurrency(item.hargaSatuan),
        [`Item ${index + 1} - Total`]: formatCurrency(item.totalHarga)
      })).reduce((acc, item) => ({ ...acc, ...item }), {});

      return { ...baseData, ...itemsData };
    }

    return baseData;
  });
};

// 🔍 Search Optimization
export const createSearchIndex = (purchases: Purchase[], suppliers: Array<{ id: string; nama: string }>) => {
  return purchases.map(purchase => {
    const supplier = suppliers.find(s => s.id === purchase.supplier);
    const searchableText = [
      purchase.id,
      supplier?.nama || '',
      purchase.status,
      ...purchase.items.map(item => item.namaBarang),
      formatPurchaseDate(purchase.tanggal)
    ].join(' ').toLowerCase();

    return {
      ...purchase,
      _searchIndex: searchableText
    };
  });
};

export const quickSearch = (
  indexedPurchases: Array<Purchase & { _searchIndex: string }>,
  searchTerm: string
): Purchase[] => {
  if (!searchTerm.trim()) return indexedPurchases;
  
  const term = searchTerm.toLowerCase();
  return indexedPurchases.filter(purchase => 
    purchase._searchIndex.includes(term)
  );
};