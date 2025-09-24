// src/components/purchase/components/table/TableRow.tsx
// Extracted table row section from PurchaseTable

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Purchase } from '../../types/purchase.types';

import { getFormattedTotalQuantities } from '../../utils/purchaseHelpers';
import { StatusDropdown } from './StatusDropdown';
import { ActionButtons } from './ActionButtons';
import { UserFriendlyDate } from '@/utils/userFriendlyDate';

interface PurchaseTableRowProps {
  purchase: Purchase;
  isSelected: boolean;
  isEditingStatus: boolean;
  onToggleSelect: () => void;
  onStartEditStatus: () => void;
  onEdit: (purchase: Purchase) => void;
  onDelete: (purchase: Purchase) => void;
  onStatusChange: (purchaseId: string, newStatus: any) => Promise<void>;
  getSupplierName: (supplierId: string) => string;
}

export const PurchaseTableRow: React.FC<PurchaseTableRowProps> = ({
  const { formatCurrency } = useCurrency();  purchase,
  isSelected,
  isEditingStatus,
  onToggleSelect,
  onStartEditStatus,
  onEdit,
  onDelete,
  onStatusChange,
  getSupplierName,
}) => {
  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelect}
          aria-label={`Select purchase ${purchase.id}`}
        />
      </TableCell>

      <TableCell>
        <div>
          <div className="font-medium">
            {UserFriendlyDate.formatToLocalString(purchase.tanggal, {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </div>
          <div className="text-xs text-gray-500">
            {UserFriendlyDate.formatToLocalString(purchase.createdAt || purchase.tanggal)}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div>
          <div className="font-medium">
            {getSupplierName(purchase.supplier)}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div>
          <div className="font-medium text-base text-gray-900">
            {purchase.items && purchase.items.length === 1 ? (
              purchase.items[0].nama
            ) : purchase.items && purchase.items.length > 0 ? (
              `${purchase.items[0].nama}${purchase.items.length > 1 ? ` +${purchase.items.length - 1} lainnya` : ''}`
            ) : (
              'Tidak ada item'
            )}
          </div>
          
          <div className="text-sm text-gray-600 mt-1">
            {getFormattedTotalQuantities(purchase)}
          </div>
        </div>
      </TableCell>

      <TableCell className="text-right">
        <div className="font-bold text-green-600">
          {formatCurrency(((purchase as any).totalNilai ?? (purchase as any).total_nilai) as number)}
        </div>
      </TableCell>

      <TableCell>
        <StatusDropdown
          purchase={purchase}
          isEditing={isEditingStatus}
          onStartEdit={onStartEditStatus}
          onStatusChange={onStatusChange}
        />
      </TableCell>

      <TableCell>
        <ActionButtons 
          purchase={purchase}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
};
