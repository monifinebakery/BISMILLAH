import { useState, useMemo, useCallback, useEffect } from 'react';
import type { Order } from '@/components/orders/types/order';

export interface UseOrdersBulkActionsReturn {
  // Selection States
  selectedOrderIds: string[];
  isSelectionMode: boolean;
  
  // Selection Actions
  setSelectedOrderIds: (ids: string[]) => void;
  toggleSelectionMode: () => void;
  selectOrder: (orderId: string) => void;
  deselectOrder: (orderId: string) => void;
  toggleOrderSelection: (orderId: string) => void;
  selectMultipleOrders: (orderIds: string[]) => void;
  selectAllCurrentPage: (orders: Order[]) => void;
  selectAllFiltered: (orders: Order[]) => void;
  clearSelection: () => void;
  clearSelectionAndExitMode: () => void;
  
  // Computed Values
  selectedCount: number;
  hasSelection: boolean;
  allCurrentPageSelected: (orders: Order[]) => boolean;
  someCurrentPageSelected: (orders: Order[]) => boolean;
  isOrderSelected: (orderId: string) => boolean;
  
  // Bulk Operations Data
  getSelectedOrders: (allOrders: Order[]) => Order[];
  getBulkOperationSummary: (allOrders: Order[]) => {
    selectedOrders: Order[];
    totalSelected: number;
    previewItems: Order[];
    hasMore: boolean;
    totalValue: number;
    statusBreakdown: Record<string, number>;
  };
  
  // Advanced Selection
  selectByStatus: (allOrders: Order[], status: string) => void;
  selectByDateRange: (allOrders: Order[], startDate: Date, endDate: Date) => void;
  selectByCustomer: (allOrders: Order[], customerName: string) => void;
  invertSelection: (allOrders: Order[]) => void;
}

interface BulkActionsOptions {
  maxPreviewItems?: number;
  autoExitModeOnClear?: boolean;
  persistSelection?: boolean;
  enableKeyboardShortcuts?: boolean;
}

export const useOrdersBulkActions = (
  options: BulkActionsOptions = {}
): UseOrdersBulkActionsReturn => {
  
  const {
    maxPreviewItems = 5,
    autoExitModeOnClear = true,
    persistSelection = false,
    enableKeyboardShortcuts = true
  } = options;

  // 🎯 Initialize from localStorage if persistence enabled
  const getInitialSelection = (): string[] => {
    if (persistSelection && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('orders-bulk-selection');
        return saved ? JSON.parse(saved) : [];
      } catch (error) {
        console.warn('Failed to load saved selection:', error);
        return [];
      }
    }
    return [];
  };

  // 🎯 Selection States
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>(getInitialSelection);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // 💾 Persist selection to localStorage
  useEffect(() => {
    if (persistSelection && typeof window !== 'undefined') {
      try {
        localStorage.setItem('orders-bulk-selection', JSON.stringify(selectedOrderIds));
      } catch (error) {
        console.warn('Failed to save selection:', error);
      }
    }
  }, [selectedOrderIds, persistSelection]);

  // 📊 Computed Values
  const selectedCount = selectedOrderIds.length;
  const hasSelection = selectedCount > 0;

  // 🔄 Toggle Selection Mode
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      const newMode = !prev;
      // Clear selection when exiting selection mode
      if (!newMode) {
        setSelectedOrderIds([]);
      }
      return newMode;
    });
  }, []);

  // 🎯 Individual Selection Actions
  const selectOrder = useCallback((orderId: string) => {
    setSelectedOrderIds(prev => {
      if (!prev.includes(orderId)) {
        return [...prev, orderId];
      }
      return prev;
    });
  }, []);

  const deselectOrder = useCallback((orderId: string) => {
    setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
  }, []);

  const toggleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrderIds(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  }, []);

  // 🔢 Multiple Selection Actions
  const selectMultipleOrders = useCallback((orderIds: string[]) => {
    setSelectedOrderIds(prev => {
      const newIds = orderIds.filter(id => !prev.includes(id));
      return [...prev, ...newIds];
    });
  }, []);

  const selectAllCurrentPage = useCallback((orders: Order[]) => {
    const currentPageIds = orders.map(order => order.id);
    setSelectedOrderIds(prev => {
      const newIds = currentPageIds.filter(id => !prev.includes(id));
      return [...prev, ...newIds];
    });
  }, []);

  const selectAllFiltered = useCallback((orders: Order[]) => {
    const allFilteredIds = orders.map(order => order.id);
    setSelectedOrderIds(allFilteredIds);
  }, []);

  // 🧹 Clear Actions
  const clearSelection = useCallback(() => {
    setSelectedOrderIds([]);
  }, []);

  const clearSelectionAndExitMode = useCallback(() => {
    setSelectedOrderIds([]);
    if (autoExitModeOnClear) {
      setIsSelectionMode(false);
    }
  }, [autoExitModeOnClear]);

  // 🔍 Selection Checkers
  const allCurrentPageSelected = useCallback((orders: Order[]) => {
    if (orders.length === 0) return false;
    return orders.every(order => selectedOrderIds.includes(order.id));
  }, [selectedOrderIds]);

  const someCurrentPageSelected = useCallback((orders: Order[]) => {
    if (orders.length === 0) return false;
    return orders.some(order => selectedOrderIds.includes(order.id)) && !allCurrentPageSelected(orders);
  }, [selectedOrderIds, allCurrentPageSelected]);

  const isOrderSelected = useCallback((orderId: string) => {
    return selectedOrderIds.includes(orderId);
  }, [selectedOrderIds]);

  // 📋 Get Selected Orders Data
  const getSelectedOrders = useCallback((allOrders: Order[]) => {
    return allOrders.filter(order => selectedOrderIds.includes(order.id));
  }, [selectedOrderIds]);

  // 📊 Bulk Operation Summary with Enhanced Statistics
  const getBulkOperationSummary = useCallback((allOrders: Order[]) => {
    const selectedOrders = getSelectedOrders(allOrders);
    const previewItems = selectedOrders.slice(0, maxPreviewItems);
    
    // Calculate total value
    const totalValue = selectedOrders.reduce((sum, order) => sum + (order.totalPesanan || 0), 0);
    
    // Calculate status breakdown
    const statusBreakdown = selectedOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      selectedOrders,
      totalSelected: selectedOrders.length,
      previewItems,
      hasMore: selectedOrders.length > maxPreviewItems,
      totalValue,
      statusBreakdown
    };
  }, [getSelectedOrders, maxPreviewItems]);

  // 🎯 Advanced Selection Methods
  const selectByStatus = useCallback((allOrders: Order[], status: string) => {
    const ordersByStatus = allOrders
      .filter(order => order.status === status)
      .map(order => order.id);
    selectMultipleOrders(ordersByStatus);
  }, [selectMultipleOrders]);

  const selectByDateRange = useCallback((allOrders: Order[], startDate: Date, endDate: Date) => {
    const ordersInRange = allOrders
      .filter(order => {
        if (!order.tanggal) return false;
        const orderDate = new Date(order.tanggal);
        return orderDate >= startDate && orderDate <= endDate;
      })
      .map(order => order.id);
    selectMultipleOrders(ordersInRange);
  }, [selectMultipleOrders]);

  const selectByCustomer = useCallback((allOrders: Order[], customerName: string) => {
    const customerOrders = allOrders
      .filter(order => 
        order.namaPelanggan?.toLowerCase().includes(customerName.toLowerCase())
      )
      .map(order => order.id);
    selectMultipleOrders(customerOrders);
  }, [selectMultipleOrders]);

  const invertSelection = useCallback((allOrders: Order[]) => {
    const allOrderIds = allOrders.map(order => order.id);
    const newSelection = allOrderIds.filter(id => !selectedOrderIds.includes(id));
    setSelectedOrderIds(newSelection);
  }, [selectedOrderIds]);

  // 🎛️ Enhanced Set Function with Validation
  const handleSetSelectedOrderIds = useCallback((ids: string[]) => {
    // Filter out duplicates and invalid IDs
    const validIds = [...new Set(ids.filter(id => id && typeof id === 'string'))];
    setSelectedOrderIds(validIds);
  }, []);

  // ⌨️ Keyboard Shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if not in input field
      if ((event.target as HTMLElement)?.tagName.toLowerCase() === 'input') {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'a':
            if (isSelectionMode) {
              event.preventDefault();
              // This would need access to current orders - implement in parent component
            }
            break;
          case 'escape':
            event.preventDefault();
            clearSelectionAndExitMode();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, isSelectionMode, clearSelectionAndExitMode]);

  return {
    // States
    selectedOrderIds,
    isSelectionMode,
    
    // Actions
    setSelectedOrderIds: handleSetSelectedOrderIds,
    toggleSelectionMode,
    selectOrder,
    deselectOrder,
    toggleOrderSelection,
    selectMultipleOrders,
    selectAllCurrentPage,
    selectAllFiltered,
    clearSelection,
    clearSelectionAndExitMode,
    
    // Computed
    selectedCount,
    hasSelection,
    allCurrentPageSelected,
    someCurrentPageSelected,
    isOrderSelected,
    
    // Data Getters
    getSelectedOrders,
    getBulkOperationSummary,
    
    // Advanced Selection
    selectByStatus,
    selectByDateRange,
    selectByCustomer,
    invertSelection,
  };
};

// 🎯 Utility function for bulk operation confirmation text
export const getBulkActionConfirmationText = (
  action: 'delete' | 'edit' | 'export' | 'archive',
  selectedCount: number,
  previewItems: Order[]
) => {
  const actionTexts = {
    delete: {
      title: 'Konfirmasi Hapus Multiple Item',
      description: `Anda akan menghapus ${selectedCount} item pesanan`,
      warning: '⚠️ Tindakan ini tidak dapat dibatalkan!'
    },
    edit: {
      title: 'Edit Status Multiple Item', 
      description: `Anda akan mengubah status ${selectedCount} item pesanan`,
      warning: 'Pastikan status yang dipilih sudah benar.'
    },
    export: {
      title: 'Export Multiple Item',
      description: `Anda akan mengekspor ${selectedCount} item pesanan`,
      warning: 'File akan diunduh ke komputer Anda.'
    },
    archive: {
      title: 'Arsipkan Multiple Item',
      description: `Anda akan mengarsipkan ${selectedCount} item pesanan`,
      warning: 'Item yang diarsipkan dapat dipulihkan nanti.'
    }
  };

  return actionTexts[action];
};

// 🎯 Helper function to get selection statistics
export const getBulkSelectionStats = (
  selectedOrders: Order[],
  allOrders: Order[]
) => {
  const totalSelected = selectedOrders.length;
  const totalOrders = allOrders.length;
  const selectionPercentage = totalOrders > 0 ? (totalSelected / totalOrders) * 100 : 0;
  
  const totalValue = selectedOrders.reduce((sum, order) => sum + (order.totalPesanan || 0), 0);
  const averageValue = totalSelected > 0 ? totalValue / totalSelected : 0;
  
  const statusDistribution = selectedOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalSelected,
    totalOrders,
    selectionPercentage: Math.round(selectionPercentage),
    totalValue,
    averageValue,
    statusDistribution
  };
};

export default useOrdersBulkActions;