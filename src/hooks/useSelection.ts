import { useState, useCallback, useMemo } from 'react';

export interface UseSelectionResult {
  selectedItems: string[];
  isSelectionMode: boolean;
  toggleSelection: (id: string) => void;
  selectAll: (allIds: string[]) => void;
  clearSelection: () => void;
  toggleSelectionMode: () => void;
  isSelected: (id: string) => boolean;
  selectAllCurrent: (currentIds: string[]) => void;
}

export const useSelection = (): UseSelectionResult => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((allIds: string[]) => {
    setSelectedItems(allIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
    setIsSelectionMode(false);
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      setSelectedItems([]);
    }
  }, [isSelectionMode]);

  const isSelected = useCallback((id: string) => {
    return selectedItems.includes(id);
  }, [selectedItems]);

  const selectAllCurrent = useCallback((currentIds: string[]) => {
    const allCurrentSelected = currentIds.every(id => selectedItems.includes(id));
    
    if (allCurrentSelected) {
      // Deselect all current items
      setSelectedItems(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      // Select all current items
      setSelectedItems(prev => {
        const newSelected = [...prev];
        currentIds.forEach(id => {
          if (!newSelected.includes(id)) {
            newSelected.push(id);
          }
        });
        return newSelected;
      });
    }
  }, [selectedItems]);

  return {
    selectedItems,
    isSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectionMode,
    isSelected,
    selectAllCurrent,
  };
};