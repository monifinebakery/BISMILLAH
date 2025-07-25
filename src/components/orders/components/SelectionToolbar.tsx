// src/components/orders/components/SelectionToolbar.tsx
import React from 'react';
import { CheckSquare, X, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SelectionToolbarProps {
  isSelectionMode: boolean;
  selectedCount: number;
  totalCount: number;
  onToggleSelectionMode: () => void;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBulkEdit?: () => void;
  onBulkDelete?: () => void;
  disabled?: boolean;
}

const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  isSelectionMode,
  selectedCount,
  totalCount,
  onToggleSelectionMode,
  onClearSelection,
  onSelectAll,
  onBulkEdit,
  onBulkDelete,
  disabled = false
}) => {
  if (!isSelectionMode && selectedCount === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-700">Mode Pilih Multiple</span>
            </div>
            {selectedCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 font-semibold">
                {selectedCount} item dipilih
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              disabled={disabled}
              className="border-gray-300 hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Batalkan
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              disabled={disabled}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              Pilih Semua ({totalCount})
            </Button>

            {selectedCount > 0 && (
              <>
                {onBulkEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBulkEdit}
                    disabled={disabled}
                    className="border-green-300 text-green-600 hover:bg-green-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Status {selectedCount} Item
                  </Button>
                )}
                
                {onBulkDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={onBulkDelete}
                    disabled={disabled}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus {selectedCount} Item
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectionToolbar;