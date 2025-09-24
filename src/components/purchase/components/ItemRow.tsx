// src/components/purchase/components/ItemRow.tsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Edit3, Trash2 } from 'lucide-react';

import { PurchaseItem } from '../types/purchase.types';

interface ItemRowProps {
  item: PurchaseItem;
  index: number;
  isViewOnly: boolean;
  isSubmitting: boolean;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  variant: 'mobile' | 'desktop';
}

export const ItemRow: React.FC<ItemRowProps> = React.memo(({
  const { formatCurrency } = useCurrency();  item,
  index,
  isViewOnly,
  isSubmitting,
  onEdit,
  onDelete,
  variant,
}) => {
  const key = item.bahanBakuId || `item-${index}`;
  const { formatCurrency } = useCurrency();
  // ✅ PERFORMANCE: Memoized action buttons to prevent unnecessary re-renders
  const actionButtons = React.useMemo(() => {
  const { formatCurrency } = useCurrency();    if (isViewOnly) return null;

    return (
      <div 
        className={`flex items-center gap-2 ${variant === 'mobile' ? 'ml-4 flex-shrink-0' : 'justify-end gap-2'}`}
        role="group"
        aria-label={`Actions for ${item.nama}`}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={() => onEdit(index)}
          disabled={isSubmitting}
          className="h-11 w-11 p-0 border-gray-300 hover:bg-orange-50 active:bg-orange-100 transition-colors"
          aria-label={`Edit item ${item.nama}`}
          title={`Edit ${item.nama}`}
        >
          <Edit3 className="h-4 w-4 text-gray-600" aria-hidden="true" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDelete(index)}
          disabled={isSubmitting}
          className="h-11 w-11 p-0 border-red-300 hover:bg-red-50 active:bg-red-100 transition-colors"
          aria-label={`Delete item ${item.nama}`}
          title={`Delete ${item.nama}`}
        >
          <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
        </Button>
      </div>
    );
  }, [isViewOnly, variant, item.nama, index, isSubmitting, onEdit, onDelete]);

  // ✅ PERFORMANCE: Memoized item info to prevent unnecessary re-renders
  const itemInfo = React.useMemo(() => (
    <>
      <div className="font-medium text-gray-900">{item.nama}</div>
      <div className={`text-sm text-gray-500 ${variant === 'mobile' ? '' : ''}`}>{item.satuan}</div>
      {item.keterangan && (
        <div className={`text-gray-400 mt-1 ${variant === 'mobile' ? 'text-xs line-clamp-2' : 'text-xs'}`}>
          {item.keterangan}
        </div>
      )}
    </>
  ), [item.nama, item.satuan, item.keterangan, variant]);

  // ✅ PERFORMANCE: Memoized item details
  const itemDetails = React.useMemo(() => (
    <>
      <div className={variant === 'mobile' ? 'text-gray-500' : 'text-gray-900'}>
        {variant === 'mobile' ? 'Kuantitas:' : ''} {item.quantity} {item.satuan}
      </div>
      <div className={variant === 'mobile' ? 'font-medium text-gray-900' : 'text-gray-900'}>
        {variant === 'mobile' ? 'Harga Satuan:' : ''} {formatCurrency(item.unitPrice)}
      </div>
    </>
  ), [variant, item.quantity, item.satuan, item.unitPrice]);

  const subtotalDisplay = React.useMemo(() => (
    <span className="font-bold text-green-600">{formatCurrency(item.subtotal)}</span>
  ), [item.subtotal]);

  if (variant === 'mobile') {
    return (
      <div 
        key={key} 
        className="border-b border-gray-200 last:border-b-0 p-4 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors"
        role="row"
        aria-label={`Purchase item: ${item.nama}`}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0 pr-3" role="cell">
            {itemInfo}
          </div>
          {actionButtons}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm pl-1" role="row">
          <div role="cell" className="text-gray-600">
            <span className="block text-xs text-gray-500 mb-1">Kuantitas</span>
            <span className="font-medium">{item.quantity} {item.satuan}</span>
          </div>
          <div role="cell" className="text-gray-600">
            <span className="block text-xs text-gray-500 mb-1">Harga Satuan</span>
            <span className="font-medium">{formatCurrency(item.unitPrice)}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100" role="cell">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Subtotal:</span>
            <span className="font-bold text-green-600 text-lg" aria-label={`Subtotal: ${formatCurrency(item.subtotal)}`}>
              {subtotalDisplay}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Desktop variant (table row)
  return (
    <tr 
      key={key} 
      className="hover:bg-gray-50"
      role="row"
      aria-label={`Purchase item: ${item.nama}`}
    >
      <td className="px-4 py-3" role="cell">
        {itemInfo}
      </td>
      <td className="px-4 py-3 text-gray-900" role="cell" aria-label={`Quantity: ${item.quantity} ${item.satuan}`}>
        {item.quantity} {item.satuan}
      </td>
      <td className="px-4 py-3 text-gray-900" role="cell" aria-label={`Unit price: ${formatCurrency(item.unitPrice)}`}>
        {formatCurrency(item.unitPrice)}
      </td>
      <td className="px-4 py-3 font-medium text-gray-900" role="cell" aria-label={`Subtotal: ${formatCurrency(item.subtotal)}`}>
        {formatCurrency(item.subtotal)}
      </td>
      {!isViewOnly && (
        <td className="px-4 py-3 text-right" role="cell">
          <div className="flex items-center justify-end gap-2">
            {actionButtons}
          </div>
        </td>
      )}
    </tr>
  );
});

ItemRow.displayName = 'ItemRow';
