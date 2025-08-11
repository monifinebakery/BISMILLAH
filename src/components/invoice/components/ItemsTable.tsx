// src/components/invoice/components/ItemsTable.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '@/utils/formatUtils';
import type { InvoiceItem } from '../types';

interface ItemsTableProps {
  items: InvoiceItem[];
  onItemChange: (id: number, field: keyof Omit<InvoiceItem, 'id'>, value: string | number) => void;
  onAddItem: () => void;
  onRemoveItem: (id: number) => void;
  className?: string;
}

export const ItemsTable: React.FC<ItemsTableProps> = ({
  items,
  onItemChange,
  onAddItem,
  onRemoveItem,
  className = ''
}) => {
  return (
    <div className={`mb-6 sm:mb-8 ${className}`}>
      <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
        Detail Items:
      </h3>
      
      {/* Table Header - Desktop */}
      <div className="hidden sm:grid grid-cols-12 gap-2 sm:gap-4 bg-gray-50 p-2 sm:p-4 rounded-t-lg border">
        <div className="col-span-5">
          <Label className="font-semibold text-gray-700 text-xs sm:text-sm">Deskripsi</Label>
        </div>
        <div className="col-span-2 text-center">
          <Label className="font-semibold text-gray-700 text-xs sm:text-sm">Jumlah</Label>
        </div>
        <div className="col-span-2 text-right">
          <Label className="font-semibold text-gray-700 text-xs sm:text-sm">Harga Satuan</Label>
        </div>
        <div className="col-span-2 text-right">
          <Label className="font-semibold text-gray-700 text-xs sm:text-sm">Total</Label>
        </div>
        <div className="col-span-1 print:hidden"></div>
      </div>
      
      {/* Table Items */}
      <div className="border border-t-0 rounded-b-lg">
        {items.map((item, index) => (
          <div 
            key={item.id} 
            className={`grid grid-cols-12 gap-2 sm:gap-4 p-2 sm:p-4 ${
              index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            } border-b last:border-b-0`}
          >
            {/* Description */}
            <div className="col-span-12 sm:col-span-5">
              <Label className="sm:hidden font-medium text-gray-600 mb-1 block text-xs">
                Deskripsi:
              </Label>
              <Textarea 
                placeholder="Deskripsi produk/jasa" 
                value={item.description} 
                onChange={e => onItemChange(item.id, 'description', e.target.value)} 
                className="resize-none border-gray-300 focus:border-blue-500 text-xs sm:text-sm print:hidden"
                rows={2}
              />
              <div className="hidden print:block text-sm whitespace-pre-line">
                {item.description}
              </div>
            </div>
            
            {/* Quantity */}
            <div className="col-span-4 sm:col-span-2">
              <Label className="sm:hidden font-medium text-gray-600 mb-1 block text-xs">
                Jumlah:
              </Label>
              <Input 
                type="number" 
                min="1"
                value={item.quantity} 
                onChange={e => onItemChange(item.id, 'quantity', e.target.value)} 
                className="text-center font-mono border-gray-300 focus:border-blue-500 text-xs sm:text-sm print:hidden"
              />
              <div className="hidden print:block text-center font-mono text-sm">
                {item.quantity}
              </div>
            </div>
            
            {/* Price */}
            <div className="col-span-4 sm:col-span-2">
              <Label className="sm:hidden font-medium text-gray-600 mb-1 block text-xs">
                Harga:
              </Label>
              <Input 
                type="number" 
                min="0"
                value={item.price} 
                onChange={e => onItemChange(item.id, 'price', e.target.value)} 
                className="text-right font-mono border-gray-300 focus:border-blue-500 text-xs sm:text-sm print:hidden"
              />
              <div className="hidden print:block text-right font-mono text-sm">
                {formatCurrency(item.price)}
              </div>
            </div>
            
            {/* Total */}
            <div className="col-span-3 sm:col-span-2 flex items-center justify-end">
              <Label className="sm:hidden font-medium text-gray-600 mr-1 text-xs print:hidden">
                Total:
              </Label>
              <span className="font-bold text-base sm:text-lg font-mono">
                {formatCurrency(item.quantity * item.price)}
              </span>
            </div>
            
            {/* Remove Button */}
            <div className="col-span-1 flex items-center justify-center print:hidden">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onRemoveItem(item.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                disabled={items.length === 1}
              >
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Add Item Button */}
      <Button 
        onClick={onAddItem} 
        variant="outline" 
        className="mt-3 sm:mt-4 w-full print:hidden hover:bg-blue-50 border-blue-200 text-blue-600 py-2 text-sm"
      >
        <Plus className="mr-2 h-4 w-4" />
        Tambah Item Baru
      </Button>
    </div>
  );
};