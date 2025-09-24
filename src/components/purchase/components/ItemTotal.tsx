// src/components/purchase/components/ItemTotal.tsx

import React from 'react';
import { useCurrency } from '@/contexts/CurrencyContext';


interface ItemTotalProps {
  total_nilai: number;
  variant: 'mobile' | 'desktop';
  isViewOnly: boolean;
}

export const ItemTotal: React.FC<ItemTotalProps> = ({
  total_nilai,
  variant,
  isViewOnly,
}) => {
  const { formatCurrency } = useCurrency();
  if (variant === 'mobile') {
    return (
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-900">Total Keseluruhan:</span>
          <span className="font-bold text-lg text-green-600">{formatCurrency(total_nilai)}</span>
        </div>
      </div>
    );
  }

  // Desktop variant (table footer)
  return (
    <tfoot className="bg-gray-50 font-semibold" role="rowgroup">
      <tr role="row">
        <td colSpan={isViewOnly ? 3 : 4} className="px-4 py-3 text-right text-gray-900" role="cell">
          Total
        </td>
        <td className="px-4 py-3 text-gray-900" role="cell" aria-label={`Grand total: ${formatCurrency(total_nilai)}`}>
          {formatCurrency(total_nilai)}
        </td>
        {!isViewOnly && <td role="cell"></td>}
      </tr>
    </tfoot>
  );
};
