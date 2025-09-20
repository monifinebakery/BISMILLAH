// src/components/recipe/components/RecipeForm/components/IngredientTable.tsx

import React from 'react';
import { Input } from '@/components/ui/input';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, ChefHat, ShoppingCart } from 'lucide-react';
import type { BahanResep } from '../../../../types';
import type { BahanBakuFrontend } from '@/components/warehouse/types';
import { RECIPE_UNITS } from '../../../../types';
import { formatCurrency } from '../../../../services/recipeUtils';
import { convertIngredientUnit } from '@/utils/unitConversion';

interface IngredientTableProps {
  ingredients: BahanResep[];
  warehouseItems: BahanBakuFrontend[];
  onUpdateIngredient: (index: number, field: keyof BahanResep, value: any) => void;
  onUpdateIngredientFromWarehouse: (index: number, warehouseItemId: string) => void;
  onRemoveIngredient: (index: number) => void;
  getIngredientDisplayName: (ingredient: BahanResep) => string;
  totalCost: string;
  isLoading?: boolean;
  className?: string;
}

export const IngredientTable: React.FC<IngredientTableProps> = ({
  ingredients,
  warehouseItems,
  onUpdateIngredient,
  onUpdateIngredientFromWarehouse,
  onRemoveIngredient,
  getIngredientDisplayName,
  totalCost,
  isLoading = false,
  className = ""
}) => {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-600" />
            Daftar Bahan ({ingredients.length})
          </CardTitle>
          {ingredients.length > 0 && (
            <Badge className="bg-orange-100 text-orange-800 border-orange-300">
              Total: {totalCost}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {ingredients.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Belum ada bahan yang ditambahkan</p>
            <p className="text-sm text-gray-400">
              Gunakan form di atas untuk menambahkan bahan pertama
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Nama Bahan</TableHead>
                  <TableHead className="text-center min-w-[100px]">Jumlah</TableHead>
                  <TableHead className="text-center min-w-[100px]">Satuan</TableHead>
                  <TableHead className="text-right min-w-[120px]">Harga Satuan</TableHead>
                  <TableHead className="text-right min-w-[120px]">Total Harga</TableHead>
                  <TableHead className="text-center min-w-[80px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ingredient, index) => (
                  <TableRow key={ingredient.id || index}>
                    
                    {/* Name - Editable with dropdown */}
                    <TableCell className="min-w-[200px]">
                      <div className="space-y-1">
                        <Select 
                          value={ingredient.warehouseId || ''} 
                          onValueChange={(value) => onUpdateIngredientFromWarehouse(index, value)}
                        >
                          <SelectTrigger className="border-none focus:border-orange-300 bg-transparent">
                            <SelectValue 
                              placeholder={getIngredientDisplayName(ingredient)}
                            >
                              {getIngredientDisplayName(ingredient)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-w-[300px]">
                            {warehouseItems.map((item) => {
                              // Check if this item will be converted for table display
                              const warehousePrice = (item as any).harga || 0;
                              const warehouseUnit = item.satuan || 'pcs';
                              const conversion = convertIngredientUnit(warehouseUnit, warehousePrice);
                              
                              return (
                                <SelectItem key={item.id} value={item.id}>
                                  <div className="flex flex-col items-start gap-1">
                                    <span>{item.nama}</span>
                                    <div className="text-xs text-gray-500">
                                      {conversion.isConverted ? (
                                        <div className="space-y-1">
                                          <div>
                                            🆕 {formatCurrency(conversion.convertedPrice)}/{conversion.convertedUnit}
                                          </div>
                                          <div className="text-xs text-gray-400">
                                            (dari {formatCurrency(conversion.originalPrice)}/{conversion.originalUnit})
                                          </div>
                                        </div>
                                      ) : (
                                        formatCurrency(warehousePrice)
                                      )}
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>

                    {/* Quantity */}
                    <TableCell className="min-w-[100px]">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ingredient.jumlah}
                        onChange={(e) => onUpdateIngredient(index, 'jumlah', parseFloat(e.target.value) || 0)}
                        className="border-none focus:border-orange-300 bg-transparent text-center"
                        disabled={isLoading}
                      />
                    </TableCell>

                    {/* Unit */}
                    <TableCell className="min-w-[100px]">
                      <Select 
                        value={ingredient.satuan} 
                        onValueChange={(value) => onUpdateIngredient(index, 'satuan', value)}
                      >
                        <SelectTrigger className="border-none focus:border-orange-300 bg-transparent">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RECIPE_UNITS.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Unit Price */}
                    <TableCell className="min-w-[120px]">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs z-10">
                          Rp
                        </span>
                        <Input
                          type="number"
                          min="0"
                          value={ingredient.hargaSatuan}
                          onChange={(e) => onUpdateIngredient(index, 'hargaSatuan', parseFloat(e.target.value) || 0)}
                          className="border-none focus:border-orange-300 bg-transparent text-right pl-6"
                          disabled={isLoading}
                        />
                      </div>
                    </TableCell>

                    {/* Total Price */}
                    <TableCell className="text-right font-medium min-w-[120px]">
                      {formatCurrency(ingredient.totalHarga)}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-center min-w-[80px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveIngredient(index)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};