// src/components/warehouse/hooks/useWarehouseSelection.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import type { BahanBakuFrontend } from '../types';

interface WarehouseSelectionResult {
  selectedItems: string[];
  toggleSelection: (id: string) => void;
  selectAllCurrent: () => void;
  isSelected: (id: string) => boolean;
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
  isRefreshing: boolean;
  handleRefresh: () => Promise<void> | void;
}

export function useWarehouseSelection(
  items: BahanBakuFrontend[],
  isSelectionMode: boolean,
  onRefresh?: () => Promise<void>
): WarehouseSelectionResult {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Clear selection when exiting selection mode
  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedItems([]);
    }
  }, [isSelectionMode]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  }, []);

  const selectAllCurrent = useCallback(() => {
    const currentIds = items.map(item => item.id);
    const allSelected = currentIds.every(id => selectedItems.includes(id));
    setSelectedItems(prev => {
      if (allSelected) {
        return prev.filter(id => !currentIds.includes(id));
      }
      const newSelection = new Set(prev);
      currentIds.forEach(id => newSelection.add(id));
      return Array.from(newSelection);
    });
  }, [items, selectedItems]);

  const isSelected = useCallback(
    (id: string) => selectedItems.includes(id),
    [selectedItems]
  );

  const allCurrentSelected = useMemo(
    () => items.length > 0 && items.every(item => selectedItems.includes(item.id)),
    [items, selectedItems]
  );

  const someCurrentSelected = useMemo(
    () => !allCurrentSelected && items.some(item => selectedItems.includes(item.id)),
    [items, selectedItems, allCurrentSelected]
  );

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  return {
    selectedItems,
    toggleSelection,
    selectAllCurrent,
    isSelected,
    allCurrentSelected,
    someCurrentSelected,
    isRefreshing,
    handleRefresh,
  };
}

export type { WarehouseSelectionResult };

