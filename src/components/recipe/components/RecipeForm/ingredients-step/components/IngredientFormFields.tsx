// src/components/recipe/components/RecipeForm/ingredients-step/components/IngredientFormFields.tsx

import React, { type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BahanResep } from '../../../../types';
import type { BahanBakuFrontend } from '@/components/warehouse/types';
import type { IngredientConversionResult } from '../hooks/useIngredientConversion';
import { RECIPE_UNITS } from '../../../../types';
import { IngredientSelector } from './IngredientSelector';

interface IngredientFormFieldsProps {
  newIngredient: Partial<BahanResep>;
  warehouseItems: BahanBakuFrontend[];
  onWarehouseSelect: (warehouseItemId: string) => void;
  onFieldChange: (field: keyof BahanResep, value: any) => void;
  onSubmit: () => void;
  getConversionPreview: (warehouseItem: BahanBakuFrontend) => IngredientConversionResult;
  hasNewIngredientData: boolean;
  totalPreview: string;
  isWarehouseLoading?: boolean;
  isDisabled?: boolean;
  children?: ReactNode;
}

export const IngredientFormFields: React.FC<IngredientFormFieldsProps> = ({
  newIngredient,
  warehouseItems,
  onWarehouseSelect,
  onFieldChange,
  onSubmit,
  getConversionPreview,
  hasNewIngredientData,
  totalPreview,
  isWarehouseLoading = false,
  isDisabled = false,
  children,
}) => {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="h-5 w-5 text-green-600" />
          Tambah Bahan Baru
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <IngredientSelector
              selectedWarehouseId={newIngredient.warehouse_id}
              warehouseItems={warehouseItems}
              onSelect={onWarehouseSelect}
              onConversionPreview={getConversionPreview}
              isLoading={isWarehouseLoading}
              isDisabled={isDisabled}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Jumlah *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newIngredient.jumlah ?? ''}
                onChange={(event) =>
                  onFieldChange('jumlah', parseFloat(event.target.value) || 0)
                }
                placeholder="500"
                disabled={isDisabled}
                className="w-full input-mobile-safe"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Satuan *</Label>
              <Select
                value={newIngredient.satuan ?? ''}
                onValueChange={(value) => onFieldChange('satuan', value)}
                disabled={isDisabled}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih satuan" />
                </SelectTrigger>
                <SelectContent>
                  {RECIPE_UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Harga Satuan *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm z-10">
                  Rp
                </span>
                <Input
                  type="number"
                  min="0"
                  value={newIngredient.harga_satuan ?? ''}
                  onChange={(event) =>
                    onFieldChange('harga_satuan', parseFloat(event.target.value) || 0)
                  }
                  placeholder="12000"
                  className="pl-8 w-full"
                  disabled={isDisabled}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium opacity-0">Action</Label>
              <Button
                type="button"
                onClick={onSubmit}
                disabled={isDisabled}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah
              </Button>
            </div>
          </div>

          {hasNewIngredientData && (
            <div className="mt-4 p-3 bg-white rounded-lg border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total harga bahan ini:</span>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  {totalPreview}
                </Badge>
              </div>
            </div>
          )}

          {children}
        </div>
      </CardContent>
    </Card>
  );
};
