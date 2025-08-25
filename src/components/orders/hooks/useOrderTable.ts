// src/components/orders/hooks/useOrderTable.ts
import { useState, useCallback, useMemo } from 'react';
import type { Order } from '../types';

interface UseOrderTableReturn {
  // Selection state
  selectedIds: string[];
  selectedOrders: Order[];
  isSelectionMode: boolean;
  isAllSelected: boolean;
  
  // Selection actions
  toggleOrderSelection: (orderId: string) => void;
  selectAllOrders: (orders: Order[]) => void;
  clearSelection: () => void;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
}

export const useOrderTable = (orders: Order[] = []): UseOrderTableReturn => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Memoized selected orders
  const selectedOrders = useMemo(() => {
    return orders.filter(order => selectedIds.includes(order.id));
  }, [orders, selectedIds]);

  // Check if all orders are selected
  const isAllSelected = useMemo(() => {
    return orders.length > 0 && selectedIds.length === orders.length;
  }, [orders.length, selectedIds.length]);

  // Toggle individual order selection
  const toggleOrderSelection = useCallback((orderId: string) => {
    setSelectedIds(prev => {
      if (prev.includes(orderId)) {
        const newSelection = prev.filter(id => id !== orderId);
        // Exit selection mode if no items selected
        if (newSelection.length === 0) {
          setIsSelectionMode(false);
        }
        return newSelection;
      } else {
        // Enter selection mode when selecting first item
        if (prev.length === 0) {
          setIsSelectionMode(true);
        }
        return [...prev, orderId];
      }
    });
  }, []);

  // Select all orders
  const selectAllOrders = useCallback((ordersToSelect: Order[]) => {
    const allIds = ordersToSelect.map(order => order.id);
    setSelectedIds(allIds);
    if (allIds.length > 0) {
      setIsSelectionMode(true);
    }
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setIsSelectionMode(false);
  }, []);

  // Enter selection mode
  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  // Exit selection mode
  const exitSelectionMode = useCallback(() => {
    setSelectedIds([]);
    setIsSelectionMode(false);
  }, []);

  return {
    // State
    selectedIds,
    selectedOrders,
    isSelectionMode,
    isAllSelected,
    
    // Actions
    toggleOrderSelection,
    selectAllOrders,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
  };
};

export default useOrderTable;