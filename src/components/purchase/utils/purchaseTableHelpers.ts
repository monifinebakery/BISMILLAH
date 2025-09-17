// src/components/purchase/utils/purchaseTableHelpers.ts
// Helper functions specifically for PurchaseTable component

import { Purchase } from '../types/purchase.types';
import { UserFriendlyDate } from '@/utils/userFriendlyDate';

/**
 * Paginate array of purchases
 */
export const paginatePurchases = (
  purchases: Purchase[],
  currentPage: number,
  itemsPerPage: number
) => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPurchases = purchases.slice(startIndex, endIndex);
  
  return {
    currentPurchases,
    totalPages: Math.ceil(purchases.length / itemsPerPage),
    startIndex,
    endIndex,
    hasData: purchases.length > 0,
    showPagination: purchases.length > itemsPerPage
  };
};

/**
 * Sort purchases by field
 */
export const sortPurchasesByField = (
  purchases: Purchase[],
  field: keyof Purchase,
  order: 'asc' | 'desc'
): Purchase[] => {
  return [...purchases].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];
    
    if (aValue === null || aValue === undefined) return order === 'asc' ? -1 : 1;
    if (bValue === null || bValue === undefined) return order === 'asc' ? 1 : -1;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return order === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });
};

/**
 * Filter purchases for table display
 */
export const filterPurchasesForTable = (
  purchases: Purchase[],
  searchQuery: string,
  statusFilter: string
): Purchase[] => {
  let filtered = [...purchases];
  
  // Apply status filter
  if (statusFilter !== 'all') {
    filtered = filtered.filter(purchase => purchase.status === statusFilter);
  }
  
  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(purchase => 
      purchase.supplier.toLowerCase().includes(query) ||
      purchase.items.some(item => 
        item.nama.toLowerCase().includes(query) ||
        (item.keterangan && item.keterangan.toLowerCase().includes(query))
      )
    );
  }
  
  return filtered;
};

/**
 * Get supplier name with fallback
 */
export const getSupplierDisplayName = (supplierId: string, suppliers: Array<{ id: string; nama: string }>): string => {
  const supplier = suppliers.find(s => s.id === supplierId);
  return supplier ? supplier.nama : 'Supplier Tidak Dikenal';
};

/**
 * Format table cell data
 */
export const formatTableCellData = (value: any, type: 'date' | 'currency' | 'text' | 'number'): string => {
  switch (type) {
    case 'date':
      if (!value) return '-';
      return UserFriendlyDate.format(value);
    case 'currency':
      if (!value || isNaN(value)) return 'Rp0';
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(value);
    case 'number':
      if (!value || isNaN(value)) return '0';
      return value.toString();
    default:
      return value?.toString() || '-';
  }
};