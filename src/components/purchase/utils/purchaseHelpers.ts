// src/components/purchase/utils/purchaseHelpers.ts

import { Purchase, PurchaseStatus } from '../types/purchase.types';

// Status display mapping
export const getStatusDisplayText = (status: PurchaseStatus): string => {
  const statusMap: Record<PurchaseStatus, string> = {
    pending: 'Menunggu',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
  };
  return statusMap[status] || status;
};

// Status color mapping
export const getStatusColor = (status: PurchaseStatus): string => {
  const colorMap: Record<PurchaseStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// ✅ FIXED: Generate purchase summary with correct units
export const generatePurchaseSummary = (purchase: Purchase): string => {
  if (!purchase.items || purchase.items.length === 0) {
    return 'Tidak ada item';
  }

  const totalItems = purchase.items.length;
  
  // Calculate total quantity with proper units
  const totalQuantityBySatuan = purchase.items.reduce((acc, item) => {
    const satuan = item.satuan || 'unit'; // fallback to 'unit' if satuan is missing
    acc[satuan] = (acc[satuan] || 0) + (item.kuantitas || 0);
    return acc;
  }, {} as Record<string, number>);

  // Format the summary
  const quantitySummary = Object.entries(totalQuantityBySatuan)
    .map(([satuan, total]) => `${total} ${satuan}`)
    .join(', ');

  if (totalItems === 1) {
    return `1 jenis item, total ${quantitySummary}`;
  } else {
    return `${totalItems} jenis item, total ${quantitySummary}`;
  }
};

// Search purchases
export const searchPurchases = (purchases: Purchase[], query: string): Purchase[] => {
  if (!query.trim()) return purchases;
  
  const lowercaseQuery = query.toLowerCase();
  
  return purchases.filter(purchase => {
    // Search in supplier name/ID
    const supplierMatch = purchase.supplier?.toLowerCase().includes(lowercaseQuery) ||
                         purchase.supplierId?.toLowerCase().includes(lowercaseQuery);
    
    // Search in item names
    const itemsMatch = purchase.items?.some(item => 
      item.nama?.toLowerCase().includes(lowercaseQuery) ||
      item.bahanBakuId?.toLowerCase().includes(lowercaseQuery) ||
      item.catatan?.toLowerCase().includes(lowercaseQuery)
    );
    
    // Search in notes
    const notesMatch = purchase.catatan?.toLowerCase().includes(lowercaseQuery);
    
    // Search in purchase ID
    const idMatch = purchase.id?.toLowerCase().includes(lowercaseQuery);
    
    return supplierMatch || itemsMatch || notesMatch || idMatch;
  });
};

// Filter purchases by status
export const filterPurchasesByStatus = (
  purchases: Purchase[], 
  status: PurchaseStatus | 'all'
): Purchase[] => {
  if (status === 'all') return purchases;
  return purchases.filter(purchase => purchase.status === status);
};

// Sort purchases
export const sortPurchases = (
  purchases: Purchase[],
  field: 'tanggal' | 'totalNilai' | 'supplier' | 'status',
  order: 'asc' | 'desc'
): Purchase[] => {
  return [...purchases].sort((a, b) => {
    let comparison = 0;
    
    switch (field) {
      case 'tanggal':
        comparison = new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime();
        break;
      case 'totalNilai':
        comparison = (a.totalNilai || 0) - (b.totalNilai || 0);
        break;
      case 'supplier':
        comparison = (a.supplier || '').localeCompare(b.supplier || '');
        break;
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '');
        break;
      default:
        comparison = 0;
    }
    
    return order === 'desc' ? -comparison : comparison;
  });
};

// Export purchases to CSV
export const exportPurchasesToCSV = (purchases: Purchase[]): string => {
  const headers = [
    'ID',
    'Tanggal',
    'Supplier',
    'Status', 
    'Total Nilai',
    'Jumlah Item',
    'Detail Item',
    'Catatan'
  ];

  const rows = purchases.map(purchase => {
    const detailItem = purchase.items
      .map(item => `${item.nama} (${item.kuantitas} ${item.satuan})`)
      .join('; ');
    
    return [
      purchase.id,
      new Date(purchase.tanggal).toLocaleDateString('id-ID'),
      purchase.supplier || '',
      getStatusDisplayText(purchase.status),
      purchase.totalNilai.toLocaleString('id-ID'),
      purchase.items.length,
      detailItem,
      purchase.catatan || ''
    ];
  });

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
};

// Validate purchase data
export const validatePurchase = (purchase: Partial<Purchase>): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!purchase.supplier) {
    errors.push('Supplier harus dipilih');
  }

  if (!purchase.tanggal) {
    errors.push('Tanggal harus diisi');
  }

  if (!purchase.items || purchase.items.length === 0) {
    errors.push('Minimal harus ada 1 item');
  } else {
    purchase.items.forEach((item, index) => {
      if (!item.nama) {
        errors.push(`Item ${index + 1}: Nama harus diisi`);
      }
      if (!item.kuantitas || item.kuantitas <= 0) {
        errors.push(`Item ${index + 1}: Kuantitas harus lebih dari 0`);
      }
      if (!item.satuan) {
        errors.push(`Item ${index + 1}: Satuan harus diisi`);
      }
      if (!item.hargaSatuan || item.hargaSatuan <= 0) {
        errors.push(`Item ${index + 1}: Harga satuan harus lebih dari 0`);
      }
    });
  }

  if (!purchase.totalNilai || purchase.totalNilai <= 0) {
    errors.push('Total nilai harus lebih dari 0');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Calculate total value from items
export const calculateTotalFromItems = (items: Purchase['items']): number => {
  if (!items || items.length === 0) return 0;
  
  return items.reduce((total, item) => {
    const itemTotal = (item.kuantitas || 0) * (item.hargaSatuan || 0);
    return total + itemTotal;
  }, 0);
};

// Format currency for display
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Get item summary for preview
export const getItemsPreview = (items: Purchase['items'], maxItems: number = 2): string => {
  if (!items || items.length === 0) {
    return 'Tidak ada item';
  }

  const preview = items
    .slice(0, maxItems)
    .map(item => `${item.nama} (${item.kuantitas} ${item.satuan})`)
    .join(', ');
  
  if (items.length > maxItems) {
    return `${preview}, +${items.length - maxItems} lainnya`;
  }
  
  return preview;
}