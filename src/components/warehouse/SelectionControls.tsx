import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, X, Trash2, Loader2 } from 'lucide-react';

interface SelectionControlsProps {
  isSelectionMode: boolean;
  selectedItems: string[];
  isBulkDeleting: boolean;
  totalItems: number;
  onClearSelection: () => void;
  onSelectAll: () => void;
  onBulkDelete: () => void;
}

const SelectionControls: React.FC<SelectionControlsProps> = ({
  isSelectionMode,
  selectedItems,
  isBulkDeleting,
  totalItems,
  onClearSelection,
  onSelectAll,
  onBulkDelete
}) => {
  if (!isSelectionMode && selectedItems.length === 0) return null;

  return (
    <Card className="mb-6 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-700">Mode Pilih Multiple</span>
            </div>
            {selectedItems.length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1 font-semibold">
                {selectedItems.length} item dipilih
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              className="border-gray-300 hover:bg-gray-50"
              aria-label="Batalkan Pilihan"
            >
              <X className="h-4 w-4 mr-2" />
              Batalkan
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
              aria-label="Pilih Semua"
            >
              Pilih Semua ({totalItems})
            </Button>

            {selectedItems.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onBulkDelete}
                disabled={isBulkDeleting}
                className="bg-red-600 hover:bg-red-700"
                aria-label="Hapus Item Terpilih"
              >
                {isBulkDeleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Hapus {selectedItems.length} Item
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SelectionControls;