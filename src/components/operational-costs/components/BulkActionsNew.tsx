// src/components/operational-costs/components/BulkActionsNew.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, AlertTriangle, X, CheckSquare, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '../utils/costHelpers';
import type { OperationalCost } from '../types/operationalCost.types';

interface BulkActionsNewProps {
  selectedCosts: OperationalCost[];
  selectedIds: string[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  totalCount: number;
  onBulkEdit: () => void;
  onBulkDelete: () => void;
  isProcessing: boolean;
}

const BulkActionsNew: React.FC<BulkActionsNewProps> = ({
  selectedCosts,
  selectedIds,
  onClearSelection,
  onSelectAll,
  isAllSelected,
  totalCount,
  onBulkEdit,
  onBulkDelete,
  isProcessing
}) => {
  const selectedCount = selectedIds.length;
  const totalSelectedAmount = selectedCosts.reduce((sum, cost) => sum + cost.jumlah_per_bulan, 0);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4 mb-6">
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={isAllSelected ? onClearSelection : onSelectAll}
              className="h-8 w-8 p-0"
              disabled={isProcessing}
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4 text-orange-600" />
              ) : (
                <Square className="h-4 w-4 text-gray-500" />
              )}
            </Button>
            <span className="font-medium text-orange-900 text-sm sm:text-base">
              {selectedCount} dari {totalCount} biaya dipilih
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              Total: {formatCurrency(totalSelectedAmount)}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button 
            onClick={onBulkEdit} 
            variant="outline" 
            size="sm" 
            className="flex items-center justify-center gap-2 text-xs sm:text-sm h-8 sm:h-9" 
            disabled={isProcessing || selectedCount === 0}
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Edit Massal</span>
            <span className="sm:hidden">Edit</span>
          </Button>
          
          <Button 
            onClick={onBulkDelete} 
            variant="outline" 
            size="sm" 
            className="flex items-center justify-center gap-2 text-red-600 hover:text-red-700 text-xs sm:text-sm h-8 sm:h-9" 
            disabled={isProcessing || selectedCount === 0}
          >
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Hapus Semua</span>
            <span className="sm:hidden">Hapus</span>
          </Button>
          
          <Button 
            onClick={onClearSelection} 
            variant="ghost" 
            size="sm" 
            className="text-gray-600 text-xs sm:text-sm h-8 sm:h-9"
            disabled={isProcessing}
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
      
      {/* Summary of selected costs */}
      <div className="mt-3 pt-3 border-t border-orange-200">
        <div className="text-xs text-orange-700">
          <span className="font-medium">Ringkasan:</span>
          {' '}
          {selectedCosts.filter(c => c.group === 'hpp').length > 0 && (
            <span className="mr-3">
              HPP: {selectedCosts.filter(c => c.group === 'hpp').length} item
            </span>
          )}
          {selectedCosts.filter(c => c.group === 'operasional').length > 0 && (
            <span>
              Operasional: {selectedCosts.filter(c => c.group === 'operasional').length} item
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkActionsNew;