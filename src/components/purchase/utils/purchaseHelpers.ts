import { Purchase, PurchaseItem } from '@/types/supplier';
import { formatCurrency } from '@/utils/formatUtils';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';

/**
 * Calculate purchase summary statistics
 */
export const calculatePurchaseStats = (purchases: Purchase[]) => {
  const stats = {
    total: purchases.length,
    totalValue: 0,
    averageValue: 0,
    byStatus: {
      pending: 0,
      completed: 0,
      cancelled: 0,
    },
    byMonth: {} as Record<string, number>,
    topSuppliers: [] as Array<{ id: string; count: number; value: number }>,
  };

  purchases.forEach(purchase => {
    // Total value
    stats.totalValue += purchase.totalNilai;

    // Status counts
    if (purchase.status in stats.byStatus) {
      stats.byStatus[purchase.status as keyof typeof stats.byStatus]++;
    }

    // Monthly breakdown
    const monthKey = new Date(purchase.tanggal).toISOString().substring(0, 7); // YYYY-MM
    stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + purchase.totalNilai;
  });

  // Calculate average
  stats.averageValue = stats.total > 0 ? stats.totalValue / stats.total : 0;

  return stats;
};

/**
 * Group purchases by supplier
 */
export const groupPurchasesBySupplier = (purchases: Purchase[], suppliers: any[]) => {
  const groups: Record<string, {
    supplier: any;
    purchases: Purchase[];
    totalValue: number;
    count: number;
  }> = {};

  purchases.forEach(purchase => {
    const supplier = suppliers.find(s => s.id === purchase.supplier);
    if (!groups[purchase.supplier]) {
      groups[purchase.supplier] = {
        supplier,
        purchases: [],
        totalValue: 0,
        count: 0,
      };
    }

    groups[purchase.supplier].purchases.push(purchase);
    groups[purchase.supplier].totalValue += purchase.totalNilai;
    groups[purchase.supplier].count++;
  });

  return Object.values(groups).sort((a, b) => b.totalValue - a.totalValue);
};

/**
 * Filter purchases by date range
 */
export const filterPurchasesByDateRange = (
  purchases: Purchase[],
  startDate: Date,
  endDate: Date
) => {
  return purchases.filter(purchase => {
    const purchaseDate = new Date(purchase.tanggal);
    return purchaseDate >= startDate && purchaseDate <= endDate;
  });
};

/**
 * Get purchases for current month
 */
export const getCurrentMonthPurchases = (purchases: Purchase[]) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  
  return filterPurchasesByDateRange(purchases, startOfMonth, endOfMonth);
};

/**
 * Get recent purchases (last 7 days)
 */
export const getRecentPurchases = (purchases: Purchase[], days: number = 7) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return purchases.filter(purchase => new Date(purchase.tanggal) >= cutoffDate);
};

/**
 * Find duplicate purchases (same supplier, similar date, similar amount)
 */
export const findDuplicatePurchases = (purchases: Purchase[]) => {
  const duplicates: Purchase[][] = [];
  const tolerance = 0.01; // 1% tolerance for amount comparison
  const dayTolerance = 1; // 1 day tolerance for date comparison

  for (let i = 0; i < purchases.length; i++) {
    const group: Purchase[] = [purchases[i]];
    
    for (let j = i + 1; j < purchases.length; j++) {
      const p1 = purchases[i];
      const p2 = purchases[j];
      
      // Same supplier
      if (p1.supplier !== p2.supplier) continue;
      
      // Similar date (within day tolerance)
      const dateDiff = Math.abs(new Date(p1.tanggal).getTime() - new Date(p2.tanggal).getTime());
      const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
      if (daysDiff > dayTolerance) continue;
      
      // Similar amount (within tolerance)
      const amountDiff = Math.abs(p1.totalNilai - p2.totalNilai) / Math.max(p1.totalNilai, p2.totalNilai);
      if (amountDiff > tolerance) continue;
      
      group.push(p2);
    }
    
    if (group.length > 1) {
      duplicates.push(group);
    }
  }

  return duplicates;
};

/**
 * Calculate total items across all purchases
 */
export const calculateTotalItems = (purchases: Purchase[]) => {
  return purchases.reduce((total, purchase) => {
    return total + (purchase.items?.reduce((itemTotal, item) => itemTotal + item.jumlah, 0) || 0);
  }, 0);
};

/**
 * Get most purchased items
 */
export const getMostPurchasedItems = (purchases: Purchase[], limit: number = 10) => {
  const itemCounts: Record<string, { 
    name: string; 
    totalQuantity: number; 
    totalValue: number; 
    purchaseCount: number;
  }> = {};

  purchases.forEach(purchase => {
    purchase.items?.forEach(item => {
      if (!itemCounts[item.namaBarang]) {
        itemCounts[item.namaBarang] = {
          name: item.namaBarang,
          totalQuantity: 0,
          totalValue: 0,
          purchaseCount: 0,
        };
      }

      itemCounts[item.namaBarang].totalQuantity += item.jumlah;
      itemCounts[item.namaBarang].totalValue += item.totalHarga;
      itemCounts[item.namaBarang].purchaseCount++;
    });
  });

  return Object.values(itemCounts)
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);
};

/**
 * Generate purchase report data
 */
export const generatePurchaseReport = (purchases: Purchase[], suppliers: any[]) => {
  const stats = calculatePurchaseStats(purchases);
  const supplierGroups = groupPurchasesBySupplier(purchases, suppliers);
  const mostPurchased = getMostPurchasedItems(purchases);
  const duplicates = findDuplicatePurchases(purchases);

  return {
    summary: {
      totalPurchases: stats.total,
      totalValue: formatCurrency(stats.totalValue),
      averageValue: formatCurrency(stats.averageValue),
      statusBreakdown: stats.byStatus,
    },
    suppliers: supplierGroups.map(group => ({
      name: group.supplier?.nama || 'Unknown',
      purchaseCount: group.count,
      totalValue: formatCurrency(group.totalValue),
      averageValue: formatCurrency(group.totalValue / group.count),
    })),
    topItems: mostPurchased.map(item => ({
      name: item.name,
      quantity: item.totalQuantity,
      value: formatCurrency(item.totalValue),
      purchaseCount: item.purchaseCount,
    })),
    monthlyTrend: Object.entries(stats.byMonth).map(([month, value]) => ({
      month,
      value: formatCurrency(value),
      numericValue: value,
    })),
    insights: {
      duplicatesFound: duplicates.length,
      mostActiveMonth: Object.entries(stats.byMonth).reduce((a, b) => 
        stats.byMonth[a[0]] > stats.byMonth[b[0]] ? a : b
      )?.[0],
      topSupplier: supplierGroups[0]?.supplier?.nama || 'None',
    }
  };
};

/**
 * Export purchases to CSV format
 */
export const exportPurchasesToCSV = (purchases: Purchase[], suppliers: any[]) => {
  const headers = [
    'Tanggal',
    'Supplier',
    'Total Nilai',
    'Status',
    'Jumlah Item',
    'Metode Perhitungan'
  ];

  const rows = purchases.map(purchase => {
    const supplier = suppliers.find(s => s.id === purchase.supplier);
    return [
      formatDateForDisplay(purchase.tanggal),
      supplier?.nama || 'Unknown',
      purchase.totalNilai.toString(),
      purchase.status,
      purchase.items?.length.toString() || '0',
      purchase.metodePerhitungan || 'FIFO'
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
};

/**
 * Create purchase comparison
 */
export const comparePurchases = (purchase1: Purchase, purchase2: Purchase) => {
  const differences: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    type: 'added' | 'removed' | 'changed';
  }> = [];

  // Compare basic fields
  const fields: (keyof Purchase)[] = ['supplier', 'totalNilai', 'tanggal', 'status'];
  
  fields.forEach(field => {
    if (purchase1[field] !== purchase2[field]) {
      differences.push({
        field: field as string,
        oldValue: purchase1[field],
        newValue: purchase2[field],
        type: 'changed',
      });
    }
  });

  // Compare items
  const items1 = purchase1.items || [];
  const items2 = purchase2.items || [];

  if (items1.length !== items2.length) {
    differences.push({
      field: 'items',
      oldValue: `${items1.length} items`,
      newValue: `${items2.length} items`,
      type: 'changed',
    });
  }

  return differences;
};

/**
 * Validate purchase consistency
 */
export const validatePurchaseConsistency = (purchase: Purchase): string[] => {
  const errors: string[] = [];

  // Check if total value matches sum of items
  const calculatedTotal = purchase.items?.reduce((sum, item) => sum + item.totalHarga, 0) || 0;
  if (Math.abs(calculatedTotal - purchase.totalNilai) > 0.01) {
    errors.push(`Total nilai tidak sesuai: ${formatCurrency(purchase.totalNilai)} vs ${formatCurrency(calculatedTotal)}`);
  }

  // Check if items have valid calculations
  purchase.items?.forEach((item, index) => {
    const expectedTotal = item.jumlah * item.hargaSatuan;
    if (Math.abs(expectedTotal - item.totalHarga) > 0.01) {
      errors.push(`Item ${index + 1} (${item.namaBarang}): total harga tidak sesuai`);
    }
  });

  // Check date validity
  const purchaseDate = new Date(purchase.tanggal);
  if (purchaseDate > new Date()) {
    errors.push('Tanggal pembelian tidak boleh di masa depan');
  }

  return errors;
};