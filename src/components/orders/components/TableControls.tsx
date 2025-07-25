// src/components/orders/components/TableControls.tsx
import React from 'react';
import { CheckSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ITEMS_PER_PAGE_OPTIONS } from '../constants/orderConstants';

interface TableControlsProps {
  itemsPerPage: number;
  onItemsPerPageChange: (value: number) => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  disabled?: boolean;
}

const TableControls: React.FC<TableControlsProps> = ({
  itemsPerPage,
  onItemsPerPageChange,
  isSelectionMode,
  onToggleSelectionMode,
  disabled = false
}) => {
  const handleItemsPerPageChange = (value: string) => {
    onItemsPerPageChange(Number(value));
  };

  return (
    <div className="p-4 sm:p-6 border-b border-gray-200 bg-gray-50/50">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Items per page selector */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Label htmlFor="show-entries" className="whitespace-nowrap font-medium">
              Show
            </Label>
            <Select 
              value={String(itemsPerPage)} 
              onValueChange={handleItemsPerPageChange}
              disabled={disabled}
            >
              <SelectTrigger className="w-20 border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="font-medium">entries</span>
          </div>

          {/* Selection mode toggle */}
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            size="sm"
            onClick={onToggleSelectionMode}
            disabled={disabled}
            className={
              isSelectionMode 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "border-blue-300 text-blue-600 hover:bg-blue-50"
            }
          >
            {isSelectionMode ? (
              <>
                <X className="h-4 w-4 mr-2" />
                Keluar Mode Pilih
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4 mr-2" />
                Mode Pilih
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TableControls;