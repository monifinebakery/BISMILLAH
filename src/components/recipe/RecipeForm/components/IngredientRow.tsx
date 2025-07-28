import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../shared/utils/recipeFormatters';

interface BahanResep {
  id: string;
  nama: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
}

interface IngredientRowProps {
  ingredient: BahanResep;
  index: number;
  onUpdate: (index: number, field: keyof BahanResep, value: any) => void;
  onRemove: (index: number) => void;
  errors?: Record<string, string>;
  canRemove?: boolean;
}

export const IngredientRow: React.FC<IngredientRowProps> = ({
  ingredient,
  index,
  onUpdate,
  onRemove,
  errors = {},
  canRemove = true
}) => {
  const errorPrefix = `ingredient-${index}`;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
        {/* Nama Bahan */}
        <div className="md:col-span-2 space-y-1">
          <Input
            value={ingredient.nama}
            onChange={(e) => onUpdate(index, 'nama', e.target.value)}
            placeholder="Nama bahan"
            className={errors[`${errorPrefix}-nama`] ? 'border-red-500' : ''}
          />
          {errors[`${errorPrefix}-nama`] && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              {errors[`${errorPrefix}-nama`]}
            </div>
          )}
        </div>

        {/* Jumlah */}
        <div className="space-y-1">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={ingredient.jumlah || ''}
            onChange={(e) => onUpdate(index, 'jumlah', Number(e.target.value))}
            placeholder="0"
            className={errors[`${errorPrefix}-jumlah`] ? 'border-red-500' : ''}
          />
          {errors[`${errorPrefix}-jumlah`] && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              {errors[`${errorPrefix}-jumlah`]}
            </div>
          )}
        </div>

        {/* Satuan */}
        <div className="space-y-1">
          <Input
            value={ingredient.satuan}
            onChange={(e) => onUpdate(index, 'satuan', e.target.value)}
            placeholder="kg/ltr/pcs"
            className={errors[`${errorPrefix}-satuan`] ? 'border-red-500' : ''}
          />
          {errors[`${errorPrefix}-satuan`] && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              {errors[`${errorPrefix}-satuan`]}
            </div>
          )}
        </div>

        {/* Harga per Satuan */}
        <div className="space-y-1">
          <Input
            type="number"
            min="0"
            value={ingredient.hargaSatuan || ''}
            onChange={(e) => onUpdate(index, 'hargaSatuan', Number(e.target.value))}
            placeholder="0"
            className={errors[`${errorPrefix}-hargaSatuan`] ? 'border-red-500' : ''}
          />
          {errors[`${errorPrefix}-hargaSatuan`] && (
            <div className="flex items-center gap-1 text-xs text-red-600">
              <AlertCircle className="h-3 w-3" />
              {errors[`${errorPrefix}-hargaSatuan`]}
            </div>
          )}
        </div>

        {/* Total & Action */}
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-green-600 min-w-[80px]">
            {formatCurrency(ingredient.totalHarga || 0)}
          </div>
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              className="h-8 w-8 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};