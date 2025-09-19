// src/components/recipe/components/IngredientsSection.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, RefreshCw, Package } from 'lucide-react';
import { BahanResep, NewRecipe } from '../types';
import { formatCurrency } from '@/utils/formatUtils';

interface BahanBakuItem {
  id: string;
  nama: string;
  satuan: string;
  hargaSatuan: number;
}

interface NewIngredient {
  selectedBahanId: string;
  jumlah: number;
}

interface IngredientsSectionProps {
  formData: NewRecipe;
  bahanBaku: BahanBakuItem[];
  newIngredient: NewIngredient;
  totalIngredientCost: number;
  onNewIngredientChange: React.Dispatch<React.SetStateAction<NewIngredient>>;
  onIngredientSelectionChange: (bahanId: string) => void;
  onAddIngredient: () => void;
  onRemoveIngredient: (ingredientId: string) => void;
  onUpdateIngredientQuantity: (ingredientId: string, newQuantity: number) => void;
  onRefreshIngredientPrices: () => void;
}

export const IngredientsSection: React.FC<IngredientsSectionProps> = ({
  formData,
  bahanBaku,
  newIngredient,
  totalIngredientCost,
  onNewIngredientChange,
  onIngredientSelectionChange,
  onAddIngredient,
  onRemoveIngredient,
  onUpdateIngredientQuantity,
  onRefreshIngredientPrices,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Daftar Bahan ({formData.bahanResep.length})
          </CardTitle>
          {formData.bahanResep.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefreshIngredientPrices}
              className="hover:bg-blue-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Perbarui Harga
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Ingredient Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50 rounded-lg">
          <div className="sm:col-span-2 md:col-span-2">
            <Label className="text-sm">Nama Bahan *</Label>
            <Select 
              value={newIngredient.selectedBahanId} 
              onValueChange={onIngredientSelectionChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Pilih bahan baku..." />
              </SelectTrigger>
              <SelectContent>
                {bahanBaku
                  .filter(b => !formData.bahanResep.some(item => item.id === b.id))
                  .map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{item.nama}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          {formatCurrency(item.hargaSatuan)}/{item.satuan}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm">Jumlah *</Label>
            <Input
              type="number"
              step="0.1"
              min="0"
              value={newIngredient.jumlah || ''}
              onChange={(e) => onNewIngredientChange(prev => ({
                ...prev,
                jumlah: parseFloat(e.target.value) || 0
              }))}
              placeholder="0"
              mobileOptimized
              className="mt-1"
            />
          </div>
          
          <div className="flex items-end">
            <Button
              type="button"
              onClick={onAddIngredient}
              className="w-full bg-green-600 hover:bg-green-700"
              size="sm"
              disabled={!newIngredient.selectedBahanId || newIngredient.jumlah <= 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah
            </Button>
          </div>
        </div>

        {/* Ingredients Table */}
        {formData.bahanResep.length > 0 ? (
          <div className="border rounded-lg overflow-x-auto">
            <Table className="recipe-ingredients-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Bahan</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Harga Satuan</TableHead>
                  <TableHead>Total Harga</TableHead>
                  <TableHead className="w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.bahanResep.map((ingredient) => (
                  <TableRow key={ingredient.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {ingredient.nama}
                        {/* Always show inventory badge for ingredients */}
                        <Badge variant="secondary" className="text-xs">
                          Inventory
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={ingredient.jumlah}
                          onChange={(e) => onUpdateIngredientQuantity(ingredient.id!, parseFloat(e.target.value) || 0)}
                          mobileOptimized
                          className="w-20 sm:w-20 min-w-[60px] flex-shrink-0"
                        />
                        <span className="text-sm text-gray-500 flex-shrink-0">{ingredient.satuan}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(ingredient.hargaSatuan)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(ingredient.totalHarga)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemoveIngredient(ingredient.id!)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p>Belum ada bahan yang ditambahkan</p>
          </div>
        )}

        {formData.bahanResep.length > 0 && (
          <div className="flex justify-end">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-700">
                <span className="font-medium">Total Biaya Bahan:</span>
                <span className="font-bold ml-2">{formatCurrency(totalIngredientCost)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};