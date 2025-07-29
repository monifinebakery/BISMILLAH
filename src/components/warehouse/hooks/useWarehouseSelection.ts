// src/components/warehouse/hooks/useWarehouseSelection.ts
import { useState, useCallback, useMemo } from 'react';
import { BahanBaku } from '../types/warehouse';

interface UseWarehouseSelectionReturn {
  selectedItems: string[];
  isSelectionMode: boolean;
  toggleSelection: (id: string) => void;
  selectAll: (items: BahanBaku[]) => void;
  clearSelection: () => void;
  toggleSelectionMode: () => void;
  isSelected: (id: string) => boolean;
  getSelectedItems: (allItems: BahanBaku[]) => BahanBaku[];
  selectPage: (pageItems: BahanBaku[]) => void;
  isPageSelected: (pageItems: BahanBaku[]) => boolean;
  isPagePartiallySelected: (pageItems: BahanBaku[]) => boolean;
  selectedCount: number;
}

export const useWarehouseSelection = (): UseWarehouseSelectionReturn => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      const isCurrentlySelected = prev.includes(id);
      if (isCurrentlySelected) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const selectAll = useCallback((items: BahanBaku[]) => {
    setSelectedItems(items.map(item => item.id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => {
      if (prev) {
        setSelectedItems([]);
      }
      return !prev;
    });
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedItems.includes(id);
  }, [selectedItems]);

  const getSelectedItems = useCallback((allItems: BahanBaku[]) => {
    return allItems.filter(item => selectedItems.includes(item.id));
  }, [selectedItems]);

  const selectPage = useCallback((pageItems: BahanBaku[]) => {
    const pageIds = pageItems.map(item => item.id);
    setSelectedItems(prev => {
      const newSelection = new Set([...prev, ...pageIds]);
      return Array.from(newSelection);
    });
  }, []);

  const isPageSelected = useCallback((pageItems: BahanBaku[]) => {
    if (pageItems.length === 0) return false;
    return pageItems.every(item => selectedItems.includes(item.id));
  }, [selectedItems]);

  const isPagePartiallySelected = useCallback((pageItems: BahanBaku[]) => {
    if (pageItems.length === 0) return false;
    const selectedInPage = pageItems.filter(item => selectedItems.includes(item.id));
    return selectedInPage.length > 0 && selectedInPage.length < pageItems.length;
  }, [selectedItems]);

  const selectedCount = useMemo(() => selectedItems.length, [selectedItems]);

  return {
    selectedItems,
    isSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectionMode,
    isSelected,
    getSelectedItems,
    selectPage,
    isPageSelected,
    isPagePartiallySelected,
    selectedCount,
  };
};