// src/components/recipe/components/RecipeForm/components/IngredientSelector.tsx

import React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package } from 'lucide-react';
import type { BahanBakuFrontend } from '@/components/warehouse/types';
import { formatCurrency } from '../../../../services/recipeUtils';
import type { IngredientConversionResult } from '../hooks/useIngredientConversion';

interface IngredientSelectorProps {
  selectedWarehouseId?: string;
  warehouseItems: BahanBakuFrontend[];
  onSelect: (warehouseItemId: string) => void;
  onConversionPreview?: (warehouseItem: BahanBakuFrontend) => IngredientConversionResult;
  isLoading?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  label?: string;
  className?: string;
}

export const IngredientSelector: React.FC<IngredientSelectorProps> = ({
  selectedWarehouseId,
  warehouseItems,
  onSelect,
  onConversionPreview,
  isLoading = false,
  isDisabled = false,
  placeholder = "Pilih dari warehouse",
  label = "Nama Bahan *",
  className = ""
}) => {
  
  const loadingPlaceholder = isLoading ? "Loading..." : placeholder;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-sm font-medium">{label}</Label>
      <Select 
        value={selectedWarehouseId || ''} 
        onValueChange={onSelect}
        disabled={isDisabled || isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={loadingPlaceholder} />
        </SelectTrigger>
        <SelectContent className="max-w-[400px]">
          <div className="px-2 py-1 text-xs text-gray-500 border-b mb-1">
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              Dari Warehouse
            </div>
          </div>
          {warehouseItems.map((item) => {
            // Get conversion preview if function provided
            const conversion = onConversionPreview ? onConversionPreview(item) : null;
            const warehousePrice = (item as any).harga || 0;
            
            return (
              <SelectItem key={item.id} value={item.id} className="cursor-pointer">
                <div className="flex flex-col items-start gap-1 py-1">
                  <span className="font-medium">{item.nama}</span>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    {conversion?.isConverted ? (
                      <>
                        <span className="line-through text-gray-400">{conversion.originalUnit}</span>
                        <span className="text-green-600 font-medium">🆕 {conversion.convertedUnit}</span>
                        <span>•</span>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(conversion.convertedPrice)}/{conversion.convertedUnit}
                        </span>
                        <span className="text-xs text-gray-400">
                          (dari {formatCurrency(conversion.originalPrice)}/{conversion.originalUnit})
                        </span>
                      </>
                    ) : (
                      <>
                        <span>{item.satuan}</span>
                        <span>•</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(warehousePrice)}
                        </span>
                      </>
                    )}
                  </div>
                  {conversion?.isConverted && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1">
                      🆕 Auto-convert ke satuan lebih kecil untuk kemudahan resep
                    </div>
                  )}
                </div>
              </SelectItem>
            );
          })}
          {warehouseItems.length === 0 && !isLoading && (
            <div className="px-2 py-4 text-center text-gray-500 text-sm">
              Belum ada bahan di warehouse
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};