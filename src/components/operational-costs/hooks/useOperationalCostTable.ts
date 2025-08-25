// src/components/operational-costs/hooks/useOperationalCostTable.ts
import { useState, useMemo } from 'react';
import type { OperationalCost } from '../types/operationalCost.types';

export const useOperationalCostTable = (costs: OperationalCost[]) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Get selected costs data
  const selectedCosts = useMemo(() => {
    return costs.filter(cost => selectedIds.includes(cost.id));
  }, [costs, selectedIds]);

  // Check if all costs are selected
  const isAllSelected = useMemo(() => {
    return costs.length > 0 && selectedIds.length === costs.length;
  }, [costs.length, selectedIds.length]);

  // Toggle selection for a single cost
  const toggleCostSelection = (costId: string) => {
    setSelectedIds(prev => {
      const newSelection = prev.includes(costId)
        ? prev.filter(id => id !== costId)
        : [...prev, costId];
      
      // Auto-exit selection mode if no items selected
      if (newSelection.length === 0) {
        setIsSelectionMode(false);
      } else if (!isSelectionMode) {
        setIsSelectionMode(true);
      }
      
      return newSelection;
    });
  };

  // Select all costs
  const selectAllCosts = () => {
    const allIds = costs.map(cost => cost.id);
    setSelectedIds(allIds);
    setIsSelectionMode(true);
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  // Enter selection mode
  const enterSelectionMode = () => {
    setIsSelectionMode(true);
  };

  // Exit selection mode
  const exitSelectionMode = () => {
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setIsSelectionMode(prev => {
      const next = !prev;
      if (!next) {
        // Clear selections when turning off selection mode
        setSelectedIds([]);
      }
      return next;
    });
  };

  return {
    // State
    selectedIds,
    selectedCosts,
    isSelectionMode,
    isAllSelected,
    
    // Actions
    toggleCostSelection,
    selectAllCosts,
    clearSelection,
    enterSelectionMode,
    exitSelectionMode,
    toggleSelectionMode,
  };
};
