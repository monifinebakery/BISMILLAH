import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Package } from 'lucide-react';
import { IngredientRow } from './IngredientRow';
import { formatCurrency } from '../../shared/utils/recipeFormatters';

interface BahanResep {
  id: string;
  nama: string;
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  totalHarga: number;
}

interface RecipeIngredientsProps {
  ingredients: BahanResep[];
  onAddIngredient: () => void;
  onUpdateIngredient: (index: number, field: keyof BahanResep, value: any) => void;
  onRemoveIngredient: (index: number) => void;
  totalCost: number;
  errors?: Record<string, string>;
}

export const RecipeIngredients: React.FC<RecipeIngredientsProps> = ({
  ingredients,
  onAddIngredient,
  onUpdateIngredient,
  onRemoveIngredient,
  totalCost,
  errors = {}
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Bahan-bahan</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Daftar bahan yang dibutuhkan untuk resep ini
            </p>
          </div>
          <Button type="button" onClick={onAddIngredient} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Bahan
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header Row */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 text-sm font-medium text-gray-700 border-b pb-2">
          <div className="md:col-span-2">Nama Bahan</div>
          <div>Jumlah</div>
          <div>Satuan</div>
          <div>Harga/Satuan</div>
          <div>Total</div>
        </div>

        {/* Ingredients List */}
        {ingredients.length > 0 ? (
          <div className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <IngredientRow
                key={ingredient.id}
                ingredient={ingredient}
                index={index}
                onUpdate={onUpdateIngredient}
                onRemove={onRemoveIngredient}
                errors={errors}
                canRemove={ingredients.length > 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">Belum ada bahan yang ditambahkan</p>
            <Button type="button" onClick={onAddIngredient} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Bahan Pertama
            </Button>
          </div>
        )}

        {/* Total Cost */}
        {ingredients.length > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total Biaya Bahan:</span>
              <span className="text-orange-600">{formatCurrency(totalCost)}</span>
            </div>
          </div>
        )}

        {errors.ingredients && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {errors.ingredients}
          </div>
        )}
      </CardContent>
    </Card>
  );
};