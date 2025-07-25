// src/components/orders/hooks/useOrderSelection.ts
import { useState, useCallback, useMemo } from 'react';
import { Order } from '../types/order';

export interface UseOrderSelectionResult {
  selectedOrderIds: string[];
  isSelectionMode: boolean;
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
  toggleSelectionMode: () => void;
  toggleSelectOrder: (orderId: string, checked: boolean) => void;
  toggleSelectAll: (orders: Order[]) => void;
  clearSelection: () => void;
  getSelectedOrders: (orders: Order[]) => Order[];
}

export const useOrderSelection = (currentOrders: Order[]): UseOrderSelectionResult => {
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const allCurrentSelected = useMemo(() => {
    return currentOrders.length > 0 && currentOrders.every(order => 
      selectedOrderIds.includes(order.id)
    );
  }, [currentOrders, selectedOrderIds]);

  const someCurrentSelected = useMemo(() => {
    return currentOrders.some(order => selectedOrderIds.includes(order.id)) && !allCurrentSelected;
  }, [currentOrders, selectedOrderIds, allCurrentSelected]);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      setSelectedOrderIds([]);
    }
  }, [isSelectionMode]);

  const toggleSelectOrder = useCallback((orderId: string, checked: boolean) => {
    setSelectedOrderIds(prev => 
      checked 
        ? [...prev, orderId]
        : prev.filter(id => id !== orderId)
    );
  }, []);

  const toggleSelectAll = useCallback((orders: Order[]) => {
    const allIds = orders.map(order => order.id);
    
    if (allCurrentSelected) {
      // Deselect all current orders
      setSelectedOrderIds(prev => 
        prev.filter(id => !allIds.includes(id))
      );
    } else {
      // Select all current orders
      setSelectedOrderIds(prev => {
        const newIds = [...prev];
        allIds.forEach(id => {
          if (!newIds.includes(id)) {
            newIds.push(id);
          }
        });
        return newIds;
      });
    }
  }, [allCurrentSelected]);

  const clearSelection = useCallback(() => {
    setSelectedOrderIds([]);
    setIsSelectionMode(false);
  }, []);

  const getSelectedOrders = useCallback((orders: Order[]) => {
    return orders.filter(order => selectedOrderIds.includes(order.id));
  }, [selectedOrderIds]);

  return {
    selectedOrderIds,
    isSelectionMode,
    allCurrentSelected,
    someCurrentSelected,
    toggleSelectionMode,
    toggleSelectOrder,
    toggleSelectAll,
    clearSelection,
    getSelectedOrders
  };
};