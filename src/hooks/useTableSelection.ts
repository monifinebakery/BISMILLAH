// src/hooks/useTableSelection.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import { logger } from '@/utils/logger';

/**
 * Generic interface untuk item yang memiliki id
 */
export interface SelectableItem {
  id: string;
  [key: string]: any;
}

/**
 * Interface untuk hasil table selection
 */
export interface TableSelectionResult<T extends SelectableItem = SelectableItem> {
  // Selection state
  selectedIds: string[];
  selectedItems: T[];
  isSelectionMode: boolean;
  isAllSelected: boolean;
  selectedCount: number;

  // Selection actions
  toggleItemSelection: (id: string) => void;
  selectAllItems: (items: T[]) => void;
  clearSelection: () => void;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;

  // Utility functions
  isSelected: (id: string) => boolean;
  getSelectedItems: (allItems: T[]) => T[];
}

/**
 * Generic Table Selection Hook
 * 
 * Hook yang dapat digunakan untuk semua jenis table selection:
 * - Single dan multiple selection
 * - Selection mode management
 * - Bulk operations support
 * - Consistent API across all tables
 * 
 * @param initialItems - Array item awal (opsional)
 * @returns Object dengan state dan fungsi untuk table selection
 */
export const useTableSelection = <T extends SelectableItem = SelectableItem>(
  initialItems: T[] = []
): TableSelectionResult<T> => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Clear selection when exiting selection mode
  useEffect(() => {
    if (!isSelectionMode) {
      setSelectedIds([]);
    }
  }, [isSelectionMode]);

  // Get selected items from current data
  const getSelectedItems = useCallback(
    (allItems: T[]): T[] => {
      return allItems.filter(item => selectedIds.includes(item.id));
    },
    [selectedIds]
  );

  // Memoized selected items based on initial items
  const selectedItems = useMemo(
    () => getSelectedItems(initialItems),
    [getSelectedItems, initialItems]
  );

  // Check if item is selected
  const isSelected = useCallback(
    (id: string): boolean => selectedIds.includes(id),
    [selectedIds]
  );

  // Toggle single item selection
  const toggleItemSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSelection = prev.includes(id)
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id];
      
      logger.debug('Table selection toggled:', {
        itemId: id,
        wasSelected: prev.includes(id),
        newSelectionCount: newSelection.length
      });
      
      return newSelection;
    });
  }, []);

  // Select all items from provided array
  const selectAllItems = useCallback((items: T[]) => {
    const itemIds = items.map(item => item.id);
    const allSelected = itemIds.every(id => selectedIds.includes(id));
    
    setSelectedIds(prev => {
      if (allSelected) {
        // Deselect all current items
        const newSelection = prev.filter(id => !itemIds.includes(id));
        logger.debug('Table selection: deselected all current items:', {
          deselectedCount: itemIds.length,
          remainingCount: newSelection.length
        });
        return newSelection;
      } else {
        // Select all current items
        const newSelection = Array.from(new Set([...prev, ...itemIds]));
        logger.debug('Table selection: selected all current items:', {
          selectedCount: itemIds.length,
          totalCount: newSelection.length
        });
        return newSelection;
      }
    });
  }, [selectedIds]);

  // Clear all selection
  const clearSelection = useCallback(() => {
    logger.debug('Table selection: cleared all selections');
    setSelectedIds([]);
  }, []);

  // Enter selection mode
  const enterSelectionMode = useCallback(() => {
    logger.debug('Table selection: entered selection mode');
    setIsSelectionMode(true);
  }, []);

  // Exit selection mode
  const exitSelectionMode = useCallback(() => {
    logger.debug('Table selection: exited selection mode');
    setIsSelectionMode(false);
    // Selection will be cleared by useEffect
  }, []);

  // Check if all current items are selected
  const isAllSelected = useMemo(() => {
    if (initialItems.length === 0) return false;
    return initialItems.every(item => selectedIds.includes(item.id));
  }, [initialItems, selectedIds]);

  // Get selected count
  const selectedCount = selectedIds.length;

  return {
    // Selection state
    selectedIds,
    selectedItems,
    isSelectionMode,
    isAllSelected,
    selectedCount,

    // Selection actions
    toggleItemSelection,
    selectAllItems,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,

    // Utility functions
    isSelected,
    getSelectedItems
  };
};

export default useTableSelection;