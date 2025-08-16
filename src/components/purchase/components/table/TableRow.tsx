// src/components/purchase/components/table/TableRow.tsx
// Extracted table row section from PurchaseTable

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Purchase } from '../../types/purchase.types';
import { formatCurrency } from '@/utils/formatUtils';
import { getSupplierName, getFormattedTotalQuantities } from '../../utils/purchaseHelpers';
import { StatusDropdown } from './StatusDropdown';
import { ActionButtons } from './ActionButtons';

interface PurchaseTableRowProps {
  purchase: Purchase;
  isSelected: boolean;
  isEditingStatus: boolean;
  onToggleSelect: () => void;
  onStartEditStatus: () => void;
  onEdit: (purchase: Purchase) => void;
  onDelete: (purchase: Purchase) => void;
  onStatusChange: (purchaseId: string, newStatus: any) => Promise<void>;
}

export const PurchaseTableRow: React.FC<PurchaseTableRowProps> = ({
  purchase,
  isSelected,
  isEditingStatus,
  onToggleSelect,
  onStartEditStatus,
  onEdit,
  onDelete,
  onStatusChange,
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
            {new Date(purchase.tanggal).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(purchase.createdAt || purchase.tanggal).toLocaleDateString('id-ID')}
          </div>
        </div>
      </TableCell>

      <TableCell>
        <div>
          <div className="font-medium">
            {getSupplierName(purchase.supplier)}
          </div>
          <div className="text-xs text-gray-500">
            {purchase.metodePerhitungan}
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
          {formatCurrency(purchase.totalNilai)}
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
