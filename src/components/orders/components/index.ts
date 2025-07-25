// src/components/orders/components/index.ts
// Complete barrel export for all orders components

// ===========================================
// ERROR & LOADING COMPONENTS
// ===========================================

export { 
  ErrorBoundary, 
  PageLoading, 
  TableSkeleton, 
  CardSkeleton, 
  DialogLoader 
} from './ErrorBoundary';

// ===========================================
// DATA & UTILITY COMPONENTS
// ===========================================

export { default as DatePresets } from './DatePresets';
export { default as EmptyState } from './EmptyState';
export { default as LoadingStates } from './LoadingStates';

// ===========================================
// FILTER & SEARCH COMPONENTS
// ===========================================

export { default as FilterBar } from './FilterBar';
export { default as OrdersFilters } from './OrdersFilters';

// ===========================================
// TABLE COMPONENTS
// ===========================================

export { default as OrderTable } from './OrderTable';
export { default as OrderStatusCell } from './OrderStatusCell';
export { default as TableControls } from './TableControls';
export { default as PaginationControls } from './PaginationControls';

// ===========================================
// SELECTION & BULK ACTIONS
// ===========================================

export { default as SelectionToolbar } from './SelectionToolbar';
export { default as OrdersBulkActions } from './OrdersBulkActions';

// ===========================================
// PAGINATION
// ===========================================

export { default as OrdersPagination } from './OrdersPagination';

// ===========================================
// HOOKS
// ===========================================

import React from 'react';

export const useOrderFilters = (orders: any[]) => {
  const [filters, setFilters] = React.useState({
    search: '',
    status: 'all',
    dateRange: null
  });

  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          order.nomorPesanan?.toLowerCase().includes(searchLower) ||
          order.namaPelanggan?.toLowerCase().includes(searchLower) ||
          order.produk?.some((p: any) => p.nama?.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.dateRange) {
        const orderDate = new Date(order.tanggal);
        const { from, to } = filters.dateRange;
        if (from && orderDate < from) return false;
        if (to && orderDate > to) return false;
      }

      return true;
    });
  }, [orders, filters]);

  return {
    filters,
    filteredOrders,
    hasActiveFilters: filters.search !== '' || filters.status !== 'all' || filters.dateRange !== null,
    updateFilters: setFilters,
    clearFilters: () => setFilters({ search: '', status: 'all', dateRange: null })
  };
};

export const useOrderSelection = (orders: any[]) => {
  const [selectedOrderIds, setSelectedOrderIds] = React.useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);

  const allCurrentSelected = orders.length > 0 && selectedOrderIds.length === orders.length;
  const someCurrentSelected = selectedOrderIds.length > 0 && selectedOrderIds.length < orders.length;

  return {
    selectedOrderIds,
    isSelectionMode,
    allCurrentSelected,
    someCurrentSelected,
    toggleSelectOrder: (id: string, selected: boolean) => {
      if (selected) {
        setSelectedOrderIds(prev => [...prev, id]);
      } else {
        setSelectedOrderIds(prev => prev.filter(orderId => orderId !== id));
      }
    },
    toggleSelectAll: (currentOrders: any[]) => {
      if (allCurrentSelected) {
        setSelectedOrderIds([]);
      } else {
        setSelectedOrderIds(currentOrders.map(o => o.id));
      }
    },
    toggleSelectionMode: () => {
      setIsSelectionMode(prev => !prev);
      if (isSelectionMode) {
        setSelectedOrderIds([]);
      }
    },
    clearSelection: () => {
      setSelectedOrderIds([]);
      setIsSelectionMode(false);
    },
    getSelectedOrders: (allOrders: any[]) => {
      return allOrders.filter(order => selectedOrderIds.includes(order.id));
    }
  };
};

export const useOrderPagination = (items: any[], itemsPerPage: number = 10) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPageState, setItemsPerPageState] = React.useState(itemsPerPage);

  const totalPages = Math.ceil(items.length / itemsPerPageState);
  const currentOrders = React.useMemo(() => {
    const firstItem = (currentPage - 1) * itemsPerPageState;
    return items.slice(firstItem, firstItem + itemsPerPageState);
  }, [items, currentPage, itemsPerPageState]);

  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [items.length, totalPages, currentPage]);

  return {
    currentPage,
    totalPages,
    totalItems: items.length,
    itemsPerPage: itemsPerPageState,
    currentOrders,
    setCurrentPage,
    setItemsPerPage: setItemsPerPageState
  };
};

// ===========================================
// TYPE DEFINITIONS
// ===========================================

export interface OrderFilters {
  search: string;
  status: string;
  dateRange: { from: Date; to: Date } | null;
}

export interface OrderSelectionState {
  selectedOrderIds: string[];
  isSelectionMode: boolean;
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  currentOrders: any[];
}