// 🎯 150 lines - Filters + Selection + Pagination + UI state
import { useState, useMemo, useCallback } from 'react';
import type { Order, OrderFilters, UseOrderUIReturn } from '../types';

const initialFilters: OrderFilters = {
  search: '',
  status: 'all',
  date_from: null,
  date_to: null,
  min_amount: null,
  max_amount: null
};

export const useOrderUI = (orders: Order[], defaultItemsPerPage: number = 10): UseOrderUIReturn => {
  // Filter state dengan logika asli
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);

  // Selection state dengan logika asli
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Pagination state - hanya aktif jika ada filter atau data banyak
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  // Filter logic dengan semua fitur asli
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter - improved with null handling and trim
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.toLowerCase().trim();
        const nomor = (order as any).nomor_pesanan || (order as any)['nomorPesanan'] || (order as any).order_number || '';
        const nama = (order as any).nama_pelanggan || (order as any)['namaPelanggan'] || (order as any).customer_name || '';
        const telp = (order as any).telepon_pelanggan || (order as any)['teleponPelanggan'] || (order as any).customer_phone || '';
        const email = (order as any).email_pelanggan || (order as any)['emailPelanggan'] || (order as any).customer_email || '';
        const matchesSearch = 
          String(nomor).toLowerCase().includes(searchTerm) ||
          String(nama).toLowerCase().includes(searchTerm) ||
          String(telp).toLowerCase().includes(searchTerm) ||
          String(email).toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
      }

      // Status filter - dari kode asli
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false;
      }

      // Date range filter - dari kode asli
      if (filters.date_from && order.tanggal < filters.date_from) {
        return false;
      }
      if (filters.date_to && order.tanggal > filters.date_to) {
        return false;
      }

      // Amount range filter - improved with null/undefined handling
      const total = (order as any).total_pesanan ?? (order as any)['totalPesanan'] ?? 0;
      if (filters.min_amount !== null && filters.min_amount !== undefined && total < filters.min_amount) {
        return false;
      }
      if (filters.max_amount !== null && filters.max_amount !== undefined && total > filters.max_amount) {
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
      filters.date_from !== null ||
      filters.date_to !== null ||
      filters.min_amount !== null ||
      filters.max_amount !== null
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
