// src/hooks/useOrdersManager.tsx
// 🎯 COMBINED ORDERS MANAGER HOOK - All-in-one hook for complex use cases

import { useMemo } from 'react';
import type { Order } from '@/types/order';

import { useOrdersFilters, type UseOrdersFiltersReturn } from './useOrdersFilters';
import { useOrdersPagination, type UseOrdersPaginationReturn } from './useOrdersPagination';
import { useOrdersBulkActions, type UseOrdersBulkActionsReturn } from './useOrdersBulkActions';

export interface UseOrdersManagerReturn {
  // Individual Hook Returns
  filters: UseOrdersFiltersReturn;
  pagination: UseOrdersPaginationReturn;
  bulkActions: UseOrdersBulkActionsReturn;
  
  // Combined Computed Values
  displayData: {
    currentItems: Order[];
    totalItems: number;
    filteredItems: number;
    selectedItems: number;
    hasActiveFilters: boolean;
    hasSelection: boolean;
    isLoading: boolean;
  };
  
  // Combined Statistics
  statistics: {
    totalOrders: number;
    filteredOrders: number;
    currentPageOrders: number;
    selectedOrders: number;
    filterEffectiveness: number;
    selectionRate: number;
    averageOrderValue: number;
    totalValue: number;
    selectedValue: number;
  };
  
  // Quick Actions
  actions: {
    resetAll: () => void;
    resetFilters: () => void;
    resetPagination: () => void;
    resetSelection: () => void;
    selectAllVisible: () => void;
    selectAllFiltered: () => void;
    clearAll: () => void;
  };
  
  // Advanced Features
  advanced: {
    exportCurrentPage: () => Order[];
    exportFiltered: () => Order[];
    exportSelected: () => Order[];
    getSelectionSummary: () => any;
    validateSelection: () => boolean;
  };
}

interface OrdersManagerOptions {
  // Filter Options
  defaultItemsPerPage?: number;
  enableAdvancedFilters?: boolean;
  persistFilters?: boolean;
  
  // Pagination Options
  maxVisiblePages?: number;
  autoResetOnFilterChange?: boolean;
  
  // Bulk Actions Options
  maxPreviewItems?: number;
  enableKeyboardShortcuts?: boolean;
  
  // Manager Options
  enableStatistics?: boolean;
  enableAdvancedFeatures?: boolean;
  debugMode?: boolean;
}

export const useOrdersManager = (
  orders: Order[] = [],
  options: OrdersManagerOptions = {}
): UseOrdersManagerReturn => {
  
  const {
    defaultItemsPerPage = 10,
    enableAdvancedFilters = true,
    persistFilters = false,
    maxVisiblePages = 5,
    autoResetOnFilterChange = true,
    maxPreviewItems = 5,
    enableKeyboardShortcuts = true,
    enableStatistics = true,
    enableAdvancedFeatures = true,
    debugMode = false
  } = options;

  // 🎣 Initialize Individual Hooks
  const filters = useOrdersFilters(orders, {
    includeArchived: enableAdvancedFilters,
    debounceSearch: 300
  });
  
  const pagination = useOrdersPagination(filters.filteredOrders, {
    defaultItemsPerPage,
    maxVisiblePages,
    autoResetOnFilterChange,
    persistInUrl: persistFilters
  });
  
  const bulkActions = useOrdersBulkActions({
    maxPreviewItems,
    enableKeyboardShortcuts,
    autoExitModeOnClear: true
  });

  // 📊 Combined Display Data
  const displayData = useMemo(() => ({
    currentItems: pagination.currentItems,
    totalItems: orders.length,
    filteredItems: filters.filteredOrders.length,
    selectedItems: bulkActions.selectedCount,
    hasActiveFilters: filters.hasActiveFilters,
    hasSelection: bulkActions.hasSelection,
    isLoading: false // This would come from context/props
  }), [
    pagination.currentItems,
    orders.length,
    filters.filteredOrders.length,
    filters.hasActiveFilters,
    bulkActions.selectedCount,
    bulkActions.hasSelection
  ]);

  // 📈 Combined Statistics
  const statistics = useMemo(() => {
    if (!enableStatistics) {
      return {
        totalOrders: 0,
        filteredOrders: 0,
        currentPageOrders: 0,
        selectedOrders: 0,
        filterEffectiveness: 0,
        selectionRate: 0,
        averageOrderValue: 0,
        totalValue: 0,
        selectedValue: 0
      };
    }

    const totalOrders = orders.length;
    const filteredOrders = filters.filteredOrders.length;
    const currentPageOrders = pagination.currentItems.length;
    const selectedOrders = bulkActions.selectedCount;
    
    const filterEffectiveness = totalOrders > 0 ? (filteredOrders / totalOrders) * 100 : 0;
    const selectionRate = filteredOrders > 0 ? (selectedOrders / filteredOrders) * 100 : 0;
    
    const totalValue = orders.reduce((sum, order) => sum + (order.totalPesanan || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;
    
    const selectedOrdersData = bulkActions.getSelectedOrders(orders);
    const selectedValue = selectedOrdersData.reduce((sum, order) => sum + (order.totalPesanan || 0), 0);

    return {
      totalOrders,
      filteredOrders,
      currentPageOrders,
      selectedOrders,
      filterEffectiveness: Math.round(filterEffectiveness),
      selectionRate: Math.round(selectionRate),
      averageOrderValue,
      totalValue,
      selectedValue
    };
  }, [
    orders,
    filters.filteredOrders,
    pagination.currentItems,
    bulkActions.selectedCount,
    bulkActions.getSelectedOrders,
    enableStatistics
  ]);

  // 🎯 Quick Actions
  const actions = useMemo(() => ({
    resetAll: () => {
      filters.clearFilters();
      pagination.setCurrentPage(1);
      bulkActions.clearSelectionAndExitMode();
    },
    
    resetFilters: () => {
      filters.clearFilters();
      pagination.setCurrentPage(1);
    },
    
    resetPagination: () => {
      pagination.setCurrentPage(1);
    },
    
    resetSelection: () => {
      bulkActions.clearSelection();
    },
    
    selectAllVisible: () => {
      bulkActions.selectAllCurrentPage(pagination.currentItems);
    },
    
    selectAllFiltered: () => {
      bulkActions.selectAllFiltered(filters.filteredOrders);
    },
    
    clearAll: () => {
      filters.clearFilters();
      pagination.setCurrentPage(1);
      pagination.setItemsPerPage(defaultItemsPerPage);
      bulkActions.clearSelectionAndExitMode();
    }
  }), [
    filters,
    pagination,
    bulkActions,
    defaultItemsPerPage
  ]);

  // 🚀 Advanced Features
  const advanced = useMemo(() => {
    if (!enableAdvancedFeatures) {
      return {
        exportCurrentPage: () => [],
        exportFiltered: () => [],
        exportSelected: () => [],
        getSelectionSummary: () => ({}),
        validateSelection: () => true
      };
    }

    return {
      exportCurrentPage: () => {
        return pagination.currentItems.map(order => ({
          ...order,
          exportedAt: new Date().toISOString(),
          exportType: 'current_page'
        }));
      },
      
      exportFiltered: () => {
        return filters.filteredOrders.map(order => ({
          ...order,
          exportedAt: new Date().toISOString(),
          exportType: 'filtered'
        }));
      },
      
      exportSelected: () => {
        const selectedOrders = bulkActions.getSelectedOrders(orders);
        return selectedOrders.map(order => ({
          ...order,
          exportedAt: new Date().toISOString(),
          exportType: 'selected'
        }));
      },
      
      getSelectionSummary: () => {
        const summary = bulkActions.getBulkOperationSummary(orders);
        return {
          ...summary,
          statistics,
          filters: filters.filterSummary,
          pagination: pagination.paginationInfo
        };
      },
      
      validateSelection: () => {
        const selectedOrders = bulkActions.getSelectedOrders(orders);
        return selectedOrders.every(order => order && order.id);
      }
    };
  }, [
    enableAdvancedFeatures,
    pagination.currentItems,
    filters.filteredOrders,
    filters.filterSummary,
    pagination.paginationInfo,
    bulkActions,
    orders,
    statistics
  ]);

  // 🐛 Debug Logging
  if (debugMode && typeof window !== 'undefined') {
    console.group('🎯 OrdersManager Debug Info');
    console.log('📊 Statistics:', statistics);
    console.log('🔍 Filters:', {
      searchTerm: filters.searchTerm,
      statusFilter: filters.statusFilter,
      dateRange: filters.dateRange,
      activeFiltersCount: filters.activeFiltersCount
    });
    console.log('📄 Pagination:', {
      currentPage: pagination.currentPage,
      totalPages: pagination.totalPages,
      itemsPerPage: pagination.itemsPerPage
    });
    console.log('🔧 Bulk Actions:', {
      isSelectionMode: bulkActions.isSelectionMode,
      selectedCount: bulkActions.selectedCount
    });
    console.groupEnd();
  }

  return {
    filters,
    pagination,
    bulkActions,
    displayData,
    statistics,
    actions,
    advanced
  };
};

// 🎯 Helper hook for simplified usage
export const useSimpleOrdersManager = (orders: Order[]) => {
  const manager = useOrdersManager(orders, {
    enableAdvancedFeatures: false,
    enableStatistics: false,
    debugMode: false
  });

  return {
    // Simplified API
    currentOrders: manager.displayData.currentItems,
    totalCount: manager.displayData.totalItems,
    
    // Filters
    searchTerm: manager.filters.searchTerm,
    setSearchTerm: manager.filters.setSearchTerm,
    statusFilter: manager.filters.statusFilter,
    setStatusFilter: manager.filters.setStatusFilter,
    clearFilters: manager.filters.clearFilters,
    
    // Pagination
    currentPage: manager.pagination.currentPage,
    totalPages: manager.pagination.totalPages,
    setCurrentPage: manager.pagination.setCurrentPage,
    
    // Selection
    selectedIds: manager.bulkActions.selectedOrderIds,
    isSelectionMode: manager.bulkActions.isSelectionMode,
    toggleSelectionMode: manager.bulkActions.toggleSelectionMode,
    selectOrder: manager.bulkActions.selectOrder,
    clearSelection: manager.bulkActions.clearSelection,
    
    // Quick actions
    resetAll: manager.actions.resetAll
  };
};

export default useOrdersManager;