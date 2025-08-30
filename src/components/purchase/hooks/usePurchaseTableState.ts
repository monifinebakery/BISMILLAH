// src/components/purchase/hooks/usePurchaseTableState.ts
import { useState, useCallback, useMemo } from 'react';
import { Purchase } from '../types/purchase.types';
import { paginatePurchases, sortPurchasesByField, filterPurchasesForTable } from '../utils/purchaseTableHelpers';
import { safeGetSupplierName } from '../utils/purchaseHelpers';

interface UsePurchaseTableStateProps {
  initialPurchases: Purchase[];
  suppliers: Array<{ id: string; nama: string }>;
}

export const usePurchaseTableState = ({ initialPurchases, suppliers }: UsePurchaseTableStateProps) => {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<keyof Purchase>('tanggal');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  // Filter and sort purchases
  const processedPurchases = useMemo(() => {
    let filtered = filterPurchasesForTable(initialPurchases, searchQuery, statusFilter);
    
    // Apply sorting
    filtered = sortPurchasesByField(filtered, sortField, sortOrder);
    
    return filtered;
  }, [initialPurchases, searchQuery, statusFilter, sortField, sortOrder]);

  // Pagination
  const paginationData = useMemo(() => {
    return paginatePurchases(processedPurchases, currentPage, itemsPerPage);
  }, [processedPurchases, currentPage, itemsPerPage]);

  // Selection handlers
  const toggleSelectItem = useCallback((id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedItems.length === paginationData.currentPurchases.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginationData.currentPurchases.map(p => p.id));
    }
  }, [selectedItems.length, paginationData.currentPurchases]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  // Sorting handlers
  const handleSort = useCallback((field: keyof Purchase) => {
    setSortField(field);
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setCurrentPage(1); // Reset to first page when sorting changes
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setCurrentPage(1);
  }, []);

  // Get supplier name - using safe resolver
  const getSupplierName = useCallback((supplierId: string): string => {
    return safeGetSupplierName(supplierId, suppliers, 'Supplier Tidak Dikenal');
  }, [suppliers]);

  return {
    // State
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    selectedItems,
    setSelectedItems,
    editingStatusId,
    setEditingStatusId,

    // Derived data
    processedPurchases,
    paginationData,

    // Handlers
    toggleSelectItem,
    toggleSelectAll,
    clearSelection,
    handleSort,
    resetFilters,
    getSupplierName
  };
};