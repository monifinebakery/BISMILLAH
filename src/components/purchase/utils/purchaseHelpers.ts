// src/components/purchase/utils/purchaseHelpers.ts

import { Purchase, PurchaseStats, PurchaseStatus } from '../types/purchase.types';

/**
 * Calculate purchase statistics from array of purchases
 */
export const calculatePurchaseStats = (purchases: Purchase[]): PurchaseStats => {
  if (!purchases || purchases.length === 0) {
    return {
      total: 0,
      total_nilai: 0,
      byStatus: {
        pending: 0,
        completed: 0,
        cancelled: 0,
      },
      completionRate: 0, // ✅ tambahkan agar selalu ada
    };
  }

  const stats = purchases.reduce(
    (acc, purchase) => {
      acc.total += 1;
      acc.total_nilai += purchase.total_nilai || 0;
      acc.byStatus[purchase.status] += 1;
      return acc;
    },
    {
      total: 0,
      total_nilai: 0,
      byStatus: {
        pending: 0,
        completed: 0,
        cancelled: 0,
      },
    }
  );

  return {
    ...stats,
    completionRate: stats.total > 0 ? (stats.byStatus.completed / stats.total) * 100 : 0, // ✅ hitung persen selesai
  };
};

/**
 * Filter purchases by status
 */
export const filterPurchasesByStatus = (
  purchases: Purchase[],
  status: PurchaseStatus | 'all'
): Purchase[] => {
  if (status === 'all') return purchases;
  return purchases.filter(purchase => purchase.status === status);
};

/**
 * Search purchases by supplier name or items
 */
export const searchPurchases = (purchases: Purchase[], query: string): Purchase[] => {
  if (!query.trim()) return purchases;

  const searchTerm = query.toLowerCase().trim();
  
  return purchases.filter(purchase => {
    // Search in supplier name
    if (purchase.supplier?.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Search in items
    return purchase.items?.some(item =>
      item.nama?.toLowerCase().includes(searchTerm) ||
      // item.catatan?.toLowerCase().includes(searchTerm) || // ❌ tidak ada di type
      item.keterangan?.toLowerCase().includes(searchTerm)    // ✅ gunakan field yang ada
    );
  });
};

/**
 * Sort purchases by different criteria
 */
export const sortPurchases = (
  purchases: Purchase[],
  sortBy: 'tanggal' | 'total_nilai' | 'supplier' | 'status',
  sortOrder: 'asc' | 'desc' = 'desc'
): Purchase[] => {
  const sortedPurchases = [...purchases].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'tanggal':
        comparison = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
        break;
      case 'total_nilai':
        comparison = (a.total_nilai || 0) - (b.total_nilai || 0);
        break;
      case 'supplier':
        comparison = (a.supplier || '').localeCompare(b.supplier || '');
        break;
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '');
        break;
      default:
        return 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return sortedPurchases;
};

/**
 * Get status display text in Indonesian
 */
export const getStatusDisplayText = (status: PurchaseStatus): string => {
  const statusMap: Record<PurchaseStatus, string> = {
    pending: 'Menunggu',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  };

  return statusMap[status] || status;
};

/**
 * Get status color variant for UI components
 */
export const getStatusColor = (status: PurchaseStatus): string => {
  const colorMap: Record<PurchaseStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };

  return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Calculate total items quantity in a purchase (returns sum of all quantities)
 */
export const calculateTotalItems = (purchase: Purchase): number => {
  if (!purchase.items || purchase.items.length === 0) return 0;
  return purchase.items.reduce((total, item) => total + (item.quantity || 0), 0);
};

/**
 * Get formatted total quantities by unit type (simplified)
 */
export const getFormattedTotalQuantities = (purchase: Purchase): string => {
  if (!purchase.items || purchase.items.length === 0) {
    return '0 item';
  }

  // Group quantities by satuan (unit type)
  const quantitiesBySatuan = purchase.items.reduce((acc, item) => {
    const satuan = item.satuan || 'unit';
    acc[satuan] = (acc[satuan] || 0) + (item.quantity || 0);
    return acc;
  }, {} as Record<string, number>);

  // Format: "Total 2 kg" or "Total 2 kg, 1.5 liter"
  const quantities = Object.entries(quantitiesBySatuan)
    .map(([satuan, total]) => `${total} ${satuan}`)
    .join(', ');

  return `Total ${quantities}`;
};

/**
 * Calculate total unique item types in a purchase
 */
export const calculateUniqueItemTypes = (purchase: Purchase): number => {
  return purchase.items?.length || 0;
};

/**
 * Generate purchase summary text with proper units
 */
export const generatePurchaseSummary = (purchase: Purchase): string => {
  if (!purchase.items || purchase.items.length === 0) {
    return 'Tidak ada item';
  }

  const itemCount = purchase.items.length;
  
  // Group quantities by satuan (unit type)
  const quantitiesBySatuan = purchase.items.reduce((acc, item) => {
    const satuan = item.satuan || 'unit'; // fallback to 'unit' if satuan is missing
    acc[satuan] = (acc[satuan] || 0) + (item.quantity || 0);
    return acc;
  }, {} as Record<string, number>);

  // Format the summary with actual units
  const quantitySummary = Object.entries(quantitiesBySatuan)
    .map(([satuan, total]) => `${total} ${satuan}`)
    .join(', ');

  return `${itemCount} jenis item, total ${quantitySummary}`;
};

/**
 * Group purchases by date range
 */
export const groupPurchasesByDateRange = (
  purchases: Purchase[],
  range: 'today' | 'week' | 'month' | 'year'
): Purchase[] => {
  const now = new Date();
  const startDate = new Date();

  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return purchases.filter(purchase => 
    new Date(purchase.tanggal) >= startDate
  );
};

/**
 * Check if purchase can be edited
 */
export const canEditPurchase = (purchase: Purchase): boolean => {
  return purchase.status !== 'cancelled';
};

/**
 * Check if purchase can be deleted
 */
export const canDeletePurchase = (purchase: Purchase): boolean => {
  return purchase.status !== 'completed';
};

/**
 * Validate purchase data before submission
 * @deprecated Use validatePurchase instead
 */
export const validatePurchaseData = (purchase: Partial<Purchase>): string[] => {
  const errors: string[] = [];

  if (!purchase.supplier?.trim()) {
    errors.push('Supplier harus dipilih');
  }

  if (!purchase.tanggal) {
    errors.push('Tanggal pembelian harus diisi');
  }

  if (!purchase.items || purchase.items.length === 0) {
    errors.push('Minimal satu item harus ditambahkan');
  }

  if (purchase.total_nilai === undefined || purchase.total_nilai <= 0) {
    errors.push('Total nilai harus lebih dari 0');
  }

  // Validate each item
  purchase.items?.forEach((item, index) => {
    if (!item.nama?.trim()) {
      errors.push(`Item ${index + 1}: Nama item harus diisi`);
    }
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`Item ${index + 1}: Kuantitas harus lebih dari 0`);
    }
    if (!item.unitPrice || item.unitPrice < 0) {
      errors.push(`Item ${index + 1}: Harga satuan tidak valid`);
    }
    if (!item.satuan?.trim()) {
      errors.push(`Item ${index + 1}: Satuan harus diisi`);
    }
  });

  return errors;
};

/**
 * Validate purchase data (newer version)
 */
export const validatePurchase = (purchase: Partial<Purchase>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors = validatePurchaseData(purchase);
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**\n * Calculate total value from items\n */
export const calculateTotalFromItems = (items: Purchase['items']): number => {
  if (!items || items.length === 0) return 0;
  
  return items.reduce((total, item) => {
    const itemTotal = (item.quantity || 0) * (item.unitPrice || 0);
    return total + itemTotal;
  }, 0);
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get item summary for preview
 */
export const getItemsPreview = (items: Purchase['items'], maxItems: number = 2): string => {
  if (!items || items.length === 0) {
    return 'Tidak ada item';
  }

  const preview = items
    .slice(0, maxItems)
    .map(item => `${item.nama} (${item.quantity} ${item.satuan})`)
    .join(', ');
  
  if (items.length > maxItems) {
    return `${preview}, +${items.length - maxItems} lainnya`;
  }
  
  return preview;
};

/**
 * Export purchases data to CSV format
 * Enhanced to show supplier names instead of IDs
 */
export const exportPurchasesToCSV = (
  purchases: Purchase[], 
  suppliers?: Array<{ id: string; nama: string }> | null
): string => {
  const headers = [
    'Tanggal',
    'Supplier', 
    'Total Nilai',
    'Status',
    'Jumlah Item',
    'Detail Kuantitas',
    'Dibuat'
  ];

  // Create supplier name resolver
  const getSupplierName = createSupplierNameResolver(suppliers);

  const rows = purchases.map(purchase => [
    new Date(purchase.tanggal).toLocaleDateString('id-ID'),
    getSupplierName(purchase.supplier),                    // ✅ FIXED: Show supplier name instead of ID
    (purchase.total_nilai ?? 0).toString(),                 // ✅ aman null/undefined
    getStatusDisplayText(purchase.status),
    (purchase.items?.length ?? 0).toString(),              // ✅ aman
    getFormattedTotalQuantities(purchase),
    new Date((purchase.createdAt ?? purchase.tanggal)).toLocaleDateString('id-ID') // ✅ fallback aman
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
};

/**
 * Get supplier name with fallback (basic version - for simple display)
 * NOTE: For proper supplier ID to name mapping, use the getSupplierName function
 * from PurchaseTableContext which has access to the suppliers list
 */
export const getSupplierName = (supplier?: string): string => {
  if (!supplier || typeof supplier !== 'string') return 'Tidak ada supplier';
  return supplier.trim() || 'Tidak ada supplier';
};

/**
 * Create supplier name resolver with suppliers list
 * This is used when you have access to the full suppliers list
 * Enhanced with robust error handling and validation
 */
export const createSupplierNameResolver = (suppliers?: Array<{ id: string; nama: string }> | null) => {
  return (supplierId?: string | null): string => {
    // Defensive checks for null/undefined/empty inputs
    if (!supplierId || typeof supplierId !== 'string') {
      return 'Tidak ada supplier';
    }
    
    const cleanSupplierId = supplierId.trim();
    if (!cleanSupplierId) {
      return 'Tidak ada supplier';
    }
    
    // Handle empty or invalid suppliers array
    if (!suppliers || !Array.isArray(suppliers) || suppliers.length === 0) {
      return cleanSupplierId; // Return ID as fallback if no suppliers list
    }
    
    try {
      // Find supplier by ID with safe property access
      const supplier = suppliers.find(s => {
        if (!s || typeof s !== 'object') return false;
        if (!s.id || typeof s.id !== 'string') return false;
        return s.id === cleanSupplierId;
      });
      
      if (supplier && supplier.nama && typeof supplier.nama === 'string') {
        const supplierName = supplier.nama.trim();
        return supplierName || cleanSupplierId; // Fallback to ID if name is empty
      }
      
      // If not found by exact ID match, try fuzzy match by name
      const fuzzyMatch = suppliers.find(s => {
        if (!s || !s.nama || typeof s.nama !== 'string') return false;
        return s.nama.toLowerCase().trim() === cleanSupplierId.toLowerCase();
      });
      
      if (fuzzyMatch && fuzzyMatch.nama) {
        return fuzzyMatch.nama.trim();
      }
      
      // Return ID as final fallback
      return cleanSupplierId;
    } catch (error) {
      // Log error but don't break the UI
      console.warn('Error in supplier name resolution:', error);
      return cleanSupplierId;
    }
  };
};

/**
 * Safe supplier name validator - checks if a supplier name/ID is valid
 */
export const isValidSupplier = (supplierId?: string | null): boolean => {
  return !!(supplierId && typeof supplierId === 'string' && supplierId.trim().length > 0);
};

/**
 * Safe supplier resolver that never throws errors
 * Always returns a string, even in case of complete failure
 */
export const safeGetSupplierName = (
  supplierId?: string | null, 
  suppliers?: Array<{ id: string; nama: string }> | null,
  fallback: string = 'Supplier Tidak Dikenal'
): string => {
  try {
    if (!isValidSupplier(supplierId)) return fallback;
    
    const resolver = createSupplierNameResolver(suppliers);
    const result = resolver(supplierId!);
    
    return result || fallback;
  } catch {
    return fallback;
  }
};

/**
 * Debounce function for search
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>; // ✅ cross-env (browser/node)
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
