// src/components/warehouse/components/MobileSelectionHeader.tsx
import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface MobileSelectionHeaderProps {
  isSelectionMode: boolean;
  allCurrentSelected: boolean;
  someCurrentSelected: boolean;
  selectedItems: string[];
  onSelectAllCurrent: () => void;
}

/**
 * Mobile Selection Header Component
 * 
 * Features:
 * - Select all functionality
 * - Visual feedback for selection state
 * - Touch-friendly design
 * - Selection count display
 * 
 * Size: ~1KB
 */
const MobileSelectionHeader: React.FC<MobileSelectionHeaderProps> = ({
  isSelectionMode,
  allCurrentSelected,
  someCurrentSelected,
  selectedItems,
  onSelectAllCurrent,
}) => {
  if (!isSelectionMode) return null;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
      <button
        onClick={onSelectAllCurrent}
        className="flex items-center justify-center w-6 h-6 rounded border-2 border-gray-300 hover:border-orange-500 transition-colors"
        aria-label={allCurrentSelected ? 'Deselect all' : 'Select all'}
      >
        {allCurrentSelected ? (
          <CheckSquare className="w-5 h-5 text-orange-500" />
        ) : someCurrentSelected ? (
          <div className="w-3 h-3 bg-orange-500 rounded-sm" />
        ) : (
          <Square className="w-5 h-5 text-gray-400" />
        )}
      </button>
      <span className="text-sm font-medium text-gray-700">
        {selectedItems.length > 0 
          ? `${selectedItems.length} item dipilih`
          : 'Pilih semua item'
        }
      </span>
    </div>
  );
};

export default MobileSelectionHeader;