import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Edit, Trash2, MoreHorizontal, Eye } from 'lucide-react';
import { Purchase } from '@/types/supplier';
import { formatDateForDisplay } from '@/utils/unifiedDateUtils';
import { formatCurrency } from '@/utils/formatUtils';
import { getStatusDisplayText, getStatusColorClass } from '../../services/purchaseTransformers';
import { cn } from '@/lib/utils';

interface PurchaseTableRowProps {
  purchase: Purchase;
  suppliers: any[];
  index: number;
  isSelected: boolean;
  isSelectionMode: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onEdit: (purchase: Purchase) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onView?: (purchase: Purchase) => void;
  className?: string;
}

const PurchaseTableRow: React.FC<PurchaseTableRowProps> = ({
  purchase,
  suppliers,
  index,
  isSelected,
  isSelectionMode,
  onSelect,
  onEdit,
  onDelete,
  onStatusChange,
  onView,
  className = '',
}) => {
  const supplierData = suppliers.find(s => s.id === purchase.supplier);

  const handleSelectionChange = (checked: boolean) => {
    onSelect(purchase.id, checked);
  };

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(purchase.id, newStatus);
  };

  const handleEdit = () => {
    onEdit(purchase);
  };

  const handleDelete = () => {
    onDelete(purchase.id);
  };

  const handleView = () => {
    onView?.(purchase);
  };

  return (
    <TableRow
      className={cn(
        "hover:bg-orange-50/50 transition-colors border-b border-gray-100",
        isSelected && "bg-blue-50 border-l-4 border-l-blue-500",
        index % 2 === 0 ? "bg-white" : "bg-gray-50/30",
        className
      )}
    >
      {/* Selection Checkbox */}
      <TableCell className="p-4 w-12">
        {isSelectionMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleSelectionChange}
            className="border-gray-400"
            aria-label={`Select purchase from ${supplierData?.nama || 'Unknown'}`}
          />
        )}
      </TableCell>

      {/* Date */}
      <TableCell className="font-medium text-gray-900 p-4">
        <div className="flex flex-col">
          <span className="font-semibold">
            {formatDateForDisplay(purchase.tanggal)}
          </span>
          <span className="text-xs text-gray-500">
            {new Date(purchase.tanggal).toLocaleDateString('id-ID', { weekday: 'short' })}
          </span>
        </div>
      </TableCell>

      {/* Supplier */}
      <TableCell className="p-4">
        <Badge 
          variant="outline" 
          className="bg-orange-50 text-orange-700 border-orange-200 font-medium hover:bg-orange-100 transition-colors"
        >
          {supplierData?.nama || 'N/A'}
        </Badge>
      </TableCell>

      {/* Total Value */}
      <TableCell className="text-right p-4">
        <div className="flex flex-col items-end">
          <span className="font-semibold text-green-600 text-base">
            {formatCurrency(purchase.totalNilai)}
          </span>
          {purchase.items && purchase.items.length > 0 && (
            <span className="text-xs text-gray-500">
              {purchase.items.length} item{purchase.items.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </TableCell>

      {/* Status */}
      <TableCell className="p-4">
        <Select 
          value={purchase.status} 
          onValueChange={handleStatusChange}
          disabled={isSelectionMode}
        >
          <SelectTrigger 
            className={cn(
              "h-8 border-none text-sm font-medium",
              getStatusColorClass(purchase.status)
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Pending
              </div>
            </SelectItem>
            <SelectItem value="completed">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Selesai
              </div>
            </SelectItem>
            <SelectItem value="cancelled">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Dibatalkan
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-center p-4 w-20">
        {!isSelectionMode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-gray-100"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onView && (
                <>
                  <DropdownMenuItem onClick={handleView} className="cursor-pointer">
                    <Eye className="h-4 w-4 mr-2" />
                    Lihat Detail
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TableCell>
    </TableRow>
  );
};

export default PurchaseTableRow;