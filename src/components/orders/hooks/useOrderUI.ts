// 🎯 150 lines - Filters + Selection + Pagination + UI state
import { useState, useMemo, useCallback } from 'react';
import type { Order, OrderFilters, UseOrderUIReturn } from '../types';

const initialFilters: OrderFilters = {
  search: '',
  status: 'all',
  dateFrom: null,
  dateTo: null,
  minAmount: null,
  maxAmount: null
};

export const useOrderUI = (orders: Order[], defaultItemsPerPage: number = 10): UseOrderUIReturn => {
  // Filter state dengan logika asli
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);

  // Selection state dengan logika asli
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Pagination state dengan logika asli
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  // Filter logic dengan semua fitur asli
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter - improved with null handling and trim
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase().trim();
        const matchesSearch = 
          order.nomorPesanan.toLowerCase().includes(searchTerm) ||
          order.namaPelanggan.toLowerCase().includes(searchTerm) ||
          (order.teleponPelanggan?.toLowerCase().includes(searchTerm)) ||
          (order.emailPelanggan?.toLowerCase().includes(searchTerm));
        
        if (!matchesSearch) return false;
      }

      // Status filter - dari kode asli
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false;
      }

      // Date range filter - dari kode asli
      if (filters.dateFrom && order.tanggal < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && order.tanggal > filters.dateTo) {
        return false;
      }

      // Amount range filter - improved with null/undefined handling
      if (filters.minAmount !== null && filters.minAmount !== undefined && order.totalPesanan < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== null && filters.maxAmount !== undefined && order.totalPesanan > filters.maxAmount) {
        return false;
      }

      return true;
    });
  }, [orders, filters]);

  // Pagination logic dengan semua fitur asli
  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const currentOrders = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, validCurrentPage, itemsPerPage]);

  // Selection logic dengan semua fitur asli
  const allCurrentSelected = useMemo(() => {
    if (currentOrders.length === 0) return false;
    return currentOrders.every(order => selectedOrderIds.includes(order.id));
  }, [currentOrders, selectedOrderIds]);

  const someCurrentSelected = useMemo(() => {
    if (currentOrders.length === 0) return false;
    return currentOrders.some(order => selectedOrderIds.includes(order.id)) && !allCurrentSelected;
  }, [currentOrders, selectedOrderIds, allCurrentSelected]);

  // Filter functions dengan logika asli
  const updateFilters = useCallback((newFilters: Partial<OrderFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filtering
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.status !== 'all' ||
      filters.dateFrom !== null ||
      filters.dateTo !== null ||
      filters.minAmount !== null ||
      filters.maxAmount !== null
    );
  }, [filters]);

  // Selection functions dengan logika asli
  const toggleSelectOrder = useCallback((orderId: string, forceValue?: boolean) => {
    setSelectedOrderIds(prev => {
      const isSelected = prev.includes(orderId);
      const shouldSelect = forceValue !== undefined ? forceValue : !isSelected;
      
      if (shouldSelect && !isSelected) {
        return [...prev, orderId];
      } else if (!shouldSelect && isSelected) {
        return prev.filter(id => id !== orderId);
      }
      return prev;
    });
  }, []);

  const toggleSelectAll = useCallback((orders: Order[]) => {
    const orderIds = orders.map(order => order.id);
    const allSelected = orderIds.every(id => selectedOrderIds.includes(id));
    
    if (allSelected) {
      // Deselect all current orders
      setSelectedOrderIds(prev => prev.filter(id => !orderIds.includes(id)));
    } else {
      // Select all current orders
      setSelectedOrderIds(prev => {
        const newIds = orderIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  }, [selectedOrderIds]);

  const clearSelection = useCallback(() => {
    setSelectedOrderIds([]);
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      if (prev) {
        // Exiting selection mode, clear selections
        setSelectedOrderIds([]);
      }
      return !prev;
    });
  }, []);

  const getSelectedOrders = useCallback((allOrders: Order[]) => {
    return allOrders.filter(order => selectedOrderIds.includes(order.id));
  }, [selectedOrderIds]);

  // Pagination functions dengan logika asli
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    const currentFirstItemIndex = (validCurrentPage - 1) * itemsPerPage;
    const newPage = Math.floor(currentFirstItemIndex / newItemsPerPage) + 1;
    
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(newPage);
  }, [validCurrentPage, itemsPerPage]);

  return {
    // Filters
    filters,
    filteredOrders,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    
    // Selection
    selectedOrderIds,
    isSelectionMode,
    allCurrentSelected,
    someCurrentSelected,
    toggleSelectOrder,
    toggleSelectAll,
    clearSelection,
    toggleSelectionMode,
    getSelectedOrders,
    
    // Pagination
    currentPage: validCurrentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    currentOrders,
    setCurrentPage: handlePageChange,
    setItemsPerPage: handleItemsPerPageChange,
  };
};