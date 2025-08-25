// src/components/orders/components/BulkActions.tsx
import React from 'react';
import { Trash2, Edit3, X, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/formatUtils';
import { useOrderBulk } from '../hooks/useOrderBulk';
import { getStatusText, getStatusColor } from '../constants';
import type { Order, OrderStatus } from '../types';

interface BulkActionsProps {
  selectedOrders: Order[];
  selectedIds: string[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  totalCount: number;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  selectedOrders,
  selectedIds,
  onClearSelection,
  onSelectAll,
  isAllSelected,
  totalCount,
}) => {
  const { openDialog } = useOrderBulk();

  const selectedCount = selectedIds.length;
  const totalSelectedAmount = selectedOrders.reduce((sum, order) => sum + order.totalPesanan, 0);

  if (selectedCount === 0) {
    return null;
  }

  // Group orders by status
  const statusGroups = selectedOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<OrderStatus, number>);

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
              {selectedCount} dari {totalCount} pesanan dipilih
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
      
      {/* Summary of selected orders */}
      <div className="mt-3 pt-3 border-t border-blue-200">
        <div className="text-xs text-blue-700">
          <span className="font-medium">Ringkasan Status:</span>
          {' '}
          {Object.entries(statusGroups).map(([status, count], index) => (
            <span key={status} className="mr-3">
              {index > 0 && ' • '}
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(status as OrderStatus)}`}>
                {getStatusText(status as OrderStatus)}
              </span>
              : {count} pesanan
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BulkActions;
export type { BulkActionsProps };