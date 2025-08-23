// src/components/invoice/components/TotalsSection.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/utils/formatUtils';
import type { Discount, Tax, InvoiceCalculations } from '../types';

interface TotalsSectionProps {
  calculations: InvoiceCalculations;
  discount: Discount;
  setDiscount: (discount: Discount) => void;
  tax: Tax;
  setTax: (tax: Tax) => void;
  shipping: number;
  setShipping: (shipping: number) => void;
  className?: string;
}

export const TotalsSection: React.FC<TotalsSectionProps> = ({
  calculations,
  discount,
  setDiscount,
  tax,
  setTax,
  shipping,
  setShipping,
  className = ''
}) => {
  return (
    <div className={className}>
      <div className="bg-gray-50 rounded-lg p-4 sm:p-6 border-2 border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
          Ringkasan Pembayaran
        </h3>
        
        <div className="space-y-3 sm:space-y-4">
          {/* Subtotal */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600 text-xs sm:text-sm">Subtotal</span>
            <span className="font-mono text-base sm:text-lg">
              {formatCurrency(calculations.subtotal)}
            </span>
          </div>
          
          {/* Discount */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1 sm:gap-2">
              <Label className="text-gray-600 text-xs sm:text-sm">Diskon</Label>
              <Input 
                type="number" 
                min="0"
                value={discount.value} 
                onChange={e => setDiscount({...discount, value: Number(e.target.value) || 0})} 
                className="w-16 sm:w-20 h-8 text-center text-xs sm:text-sm border-gray-300"
              />
              <span className="export-text text-xs sm:text-sm">
                ({discount.value}{discount.type === 'percent' ? '%' : ' Rp'})
              </span>
              <Select 
                value={discount.type} 
                onValueChange={(v: 'percent' | 'fixed') => setDiscount({...discount, type: v})}
              >
                <SelectTrigger className="w-12 sm:w-16 h-8 text-xs sm:text-sm border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">%</SelectItem>
                  <SelectItem value="fixed">Rp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="font-mono text-base sm:text-lg text-red-600">
              - {formatCurrency(calculations.discountAmount)}
            </span>
          </div>
          
          {/* Tax */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1 sm:gap-2">
              <Checkbox
                id="tax-enabled"
                checked={tax.value > 0}
                onCheckedChange={(checked) => setTax({ ...tax, value: checked ? (tax.value || 11) : 0 })}
              />
              <Label htmlFor="tax-enabled" className="text-gray-600 text-xs sm:text-sm">Pajak</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={tax.value > 0 ? tax.value : ''}
                onChange={e => setTax({...tax, value: Number(e.target.value) || 0})}
                disabled={tax.value <= 0}
                className="w-16 sm:w-20 h-8 text-center text-xs sm:text-sm border-gray-300"
              />
              <span className="text-xs sm:text-sm text-gray-600">%</span>
            </div>
            <span className="font-mono text-base sm:text-lg text-green-600">
              + {formatCurrency(calculations.taxAmount)}
            </span>
          </div>
          
          {/* Shipping */}
          <div className="flex justify-between items-center">
            <Label className="text-gray-600 text-xs sm:text-sm">Biaya Pengiriman</Label>
            <div>
              <Input 
                type="number" 
                min="0"
                value={shipping} 
                onChange={e => setShipping(Number(e.target.value) || 0)} 
                className="w-20 sm:w-32 h-8 text-right text-xs sm:text-sm font-mono border-gray-300"
              />
              <span className="export-text font-mono text-sm">
                {formatCurrency(shipping)}
              </span>
            </div>
          </div>
          
          {/* Grand Total */}
          <div className="border-t-2 border-gray-300 pt-3 sm:pt-4 mt-3 sm:mt-4">
            <div className="flex justify-between items-center bg-blue-50 p-3 sm:p-4 rounded-lg">
              <span className="text-base sm:text-xl font-bold text-gray-800">
                GRAND TOTAL
              </span>
              <span className="text-lg sm:text-2xl font-bold text-blue-600 font-mono">
                {formatCurrency(calculations.total)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};