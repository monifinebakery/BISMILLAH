// src/components/purchase/hooks/usePurchaseTable.ts

import { useState, useCallback, useMemo } from 'react';
import { Purchase, PurchaseStatus } from '../types/purchase.types';
import { 
  searchPurchases, 
  filterPurchasesByStatus, 
  sortPurchases,
  safeGetSupplierName
} from '../utils/purchaseHelpers';

interface UsePurchaseTableProps {
  purchases: Purchase[];
  suppliers?: Array<{ id: string; nama: string }>;
}

interface UsePurchaseTableReturn {
  // Filtered and processed data
  filteredPurchases: Purchase[];
  suppliers: Array<{ id: string; nama: string }>;
  
  // Filter and search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: PurchaseStatus | 'all';
  setStatusFilter: (status: PurchaseStatus | 'all') => void;
  
  // Sorting state
  sortField: 'tanggal' | 'total_nilai' | 'supplier' | 'status';
  sortOrder: 'asc' | 'desc';
  handleSort: (field: 'tanggal' | 'total_nilai' | 'supplier' | 'status') => void;
  
  // Helper functions
  getSupplierName: (supplierId: string) => string;
}

export const usePurchaseTable = ({
  purchases,
  suppliers = []
}: UsePurchaseTableProps): UsePurchaseTableReturn => {
  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseStatus | 'all'>('all');
  
  // Sorting state
  const [sortField, setSortField] = useState<'tanggal' | 'totalValue' | 'supplier' | 'status'>('tanggal');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtered and sorted purchases
  const filteredPurchases = useMemo(() => {
    let result = purchases;
    
    // Apply search filter
    if (searchQuery.trim()) {
      result = searchPurchases(result, searchQuery);
    }
    
    // Apply status filter
    result = filterPurchasesByStatus(result, statusFilter);
    
    // Apply sorting
    result = sortPurchases(result, sortField, sortOrder);
    
    return result;
  }, [purchases, searchQuery, statusFilter, sortField, sortOrder]);



  // Sorting handler
  const handleSort = useCallback((field: typeof sortField) => {
    if (field === sortField) {
      setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  }, [sortField]);



  // Helper function to get supplier name - using safe resolver
  const getSupplierName = useCallback((supplierId: string): string => {
    return safeGetSupplierName(supplierId, suppliers, 'Supplier Tidak Dikenal');
  }, [suppliers]);

  return {
    // Filtered data
    filteredPurchases,
    suppliers,
    
    // Filter and search state
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    
    // Sorting state
    sortField,
    sortOrder,
    handleSort,
    
    // Helper functions
    getSupplierName,
  };
};