// src/components/operational-costs/components/BulkActions.tsx
import React from 'react';
import { Trash2, Edit3, X, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '../utils/costHelpers';
import { useOperationalCostBulk, type OperationalCost } from '../hooks/useOperationalCostBulk';

interface BulkActionsProps {
  selectedCosts: OperationalCost[];
  selectedIds: string[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  totalCount: number;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCosts,
  selectedIds,
  onClearSelection,
  onSelectAll,
  isAllSelected,
  totalCount,
}) => {
  const { openDialog } = useOperationalCostBulk();

  const selectedCount = selectedIds.length;
  const totalSelectedAmount = selectedCosts.reduce((sum, cost) => sum + cost.jumlah_per_bulan, 0);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={isAllSelected ? onClearSelection : onSelectAll}
              className="h-8 px-2"
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </Button>
            <span className="text-sm font-medium text-blue-900">
              {selectedCount} dari {totalCount} biaya dipilih
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Total: {formatCurrency(totalSelectedAmount)}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDialog('edit')}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Edit Massal
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDialog('delete')}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Hapus ({selectedCount})
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-gray-600 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Summary of selected costs */}
      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="text-xs text-blue-700">
          <span className="font-medium">Ringkasan:</span>
          {' '}
          {selectedCosts.filter(c => c.group === 'HPP').length > 0 && (
            <span className="mr-3">
              HPP: {selectedCosts.filter(c => c.group === 'HPP').length} item
            </span>
          )}
          {selectedCosts.filter(c => c.group === 'OPERASIONAL').length > 0 && (
            <span>
              Operasional: {selectedCosts.filter(c => c.group === 'OPERASIONAL').length} item
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkActions;
export type { BulkActionsProps };