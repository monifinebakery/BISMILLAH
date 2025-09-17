// src/components/orders/components/dialogs/OrderItemsSection.tsx
import React from 'react';
import { Plus, Trash2, ChefHat, Search, Zap, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Recipe } from '@/components/recipe/types';
import type { OrderItem } from '../../types';

interface OrderItemsSectionProps {
  items: OrderItem[];
  recipes: Recipe[];
  filteredRecipes: Recipe[];
  availableCategories: string[];
  isRecipeSelectOpen: boolean;
  setIsRecipeSelectOpen: (open: boolean) => void;
  recipeSearchTerm: string;
  setRecipeSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  addItemFromRecipe: (recipe: Recipe) => void;
  addCustomItem: () => void;
  updateItem: (itemId: string, field: string, value: any) => void;
  removeItem: (itemId: string) => void;
  getCalculationMethodIndicator: (recipe: Recipe) => { isEnhanced: boolean; label: string; className: string };
}

const OrderItemsSection: React.FC<OrderItemsSectionProps> = ({
  items,
  recipes,
  filteredRecipes,
  availableCategories,
  isRecipeSelectOpen,
  setIsRecipeSelectOpen,
  recipeSearchTerm,
  setRecipeSearchTerm,
  selectedCategory,
  setSelectedCategory,
  addItemFromRecipe,
  addCustomItem,
  updateItem,
  removeItem,
  getCalculationMethodIndicator,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <ChefHat className="h-5 w-5" />
        Item Pesanan
      </h3>

      <div className="flex items-center gap-2">
        <Popover open={isRecipeSelectOpen} onOpenChange={setIsRecipeSelectOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Dari Resep
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Command>
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <CommandInput 
                  placeholder="Cari resep..." 
                  value={recipeSearchTerm}
                  onValueChange={setRecipeSearchTerm}
                />
              </div>

              <div className="p-2 border-b">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Semua kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <CommandEmpty>Tidak ada resep ditemukan</CommandEmpty>

              <CommandGroup className="max-h-64 overflow-auto">
                {filteredRecipes.map((recipe) => {
                  const method = getCalculationMethodIndicator(recipe);
                  const anyRec: any = recipe as any;
                  const safeName = (anyRec.nama_resep ?? anyRec.namaResep ?? anyRec.nama ?? '') as string;
                  const displayName = typeof safeName === 'string' && safeName.trim() ? safeName : 'Item';
                  const rawPrice = (anyRec.harga_jual_porsi ?? anyRec.hargaJualPorsi) as number | undefined;
                  const safePrice = typeof rawPrice === 'number' && !isNaN(rawPrice) ? rawPrice : undefined;
                  const safeCategory = (anyRec.kategori_resep ?? anyRec.kategoriResep ?? '') as string;
                  const rawJumlah = (anyRec.jumlah_porsi ?? anyRec.jumlahPorsi) as number | undefined;
                  const jumlahPorsi = typeof rawJumlah === 'number' && rawJumlah > 0 ? rawJumlah : undefined;
                  const rawHpp = (anyRec.hpp_per_porsi ?? anyRec.hppPerPorsi) as number | undefined;
                  const hppPerPorsi = typeof rawHpp === 'number' && rawHpp > 0 ? rawHpp : undefined;

                  return (
                    <CommandItem key={anyRec.id} onSelect={() => addItemFromRecipe(recipe)} className="flex flex-col items-start gap-2 p-3">
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium">{displayName}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${method.className}`}>
                            {method.isEnhanced ? <Zap className="w-3 h-3 mr-1" /> : <Calculator className="w-3 h-3 mr-1" />}
                            {method.label}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {safePrice !== undefined ? `Rp ${safePrice.toLocaleString('id-ID')}` : 'Rp N/A'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500 w-full">
                        <span>{safeCategory}</span>
                        {jumlahPorsi ? (<><span>•</span><span>{jumlahPorsi} porsi</span></>) : null}
                        {hppPerPorsi !== undefined && (<><span>•</span><span>HPP: Rp {hppPerPorsi.toLocaleString('id-ID')}</span></>)}
                        {method.isEnhanced && (<><span>•</span><span className="text-blue-600 font-medium">Overhead Otomatis</span></>)}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        <Button type="button" onClick={addCustomItem} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Item Manual
        </Button>
      </div>

      {items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => {
            const recipe = (item as any).recipeId ? recipes.find((r: any) => r.id === (item as any).recipeId) : null;
            const methodIndicator = recipe ? getCalculationMethodIndicator(recipe) : null;
            return (
              <div key={item.id} className="p-4 border rounded-lg bg-gray-50 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Nama menu/item"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      disabled={!!(item as any).isFromRecipe}
                      className={`${(item as any).isFromRecipe ? 'bg-blue-50' : ''} flex-1`}
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)} className="text-red-600 hover:text-red-700 flex-shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(item as any).isFromRecipe && (
                      <Badge variant="outline" className="text-blue-600 border-blue-200">Resep</Badge>
                    )}
                    {methodIndicator && (
                      <Badge variant="outline" className={`text-xs ${methodIndicator.className}`}>{methodIndicator.label}</Badge>
                    )}
                    {(item as any).recipeCategory && <Badge variant="secondary" className="text-xs">{(item as any).recipeCategory}</Badge>}
                  </div>
                </div>

                {((item as any).isFromRecipe && (((item as any).pricePerPortion) || ((item as any).pricePerPiece))) ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <Label className="text-sm font-medium text-blue-900 mb-2 block">💰 Mode Harga Jual</Label>
                    <RadioGroup value={(item as any).pricingMode || 'per_portion'} onValueChange={(value) => updateItem(item.id, 'pricingMode', value)} className="flex flex-col sm:flex-row gap-3">
                      {(item as any).pricePerPortion && (
                        <div className="flex items-center space-x-2 bg-white p-2 rounded border">
                          <RadioGroupItem value="per_portion" id={`${item.id}-per_portion`} />
                          <Label htmlFor={`${item.id}-per_portion`} className="text-sm flex-1 cursor-pointer">
                            <div className="font-medium">Per Porsi</div>
                            <div className="text-xs text-gray-500">Rp {(item as any).pricePerPortion?.toLocaleString('id-ID')}</div>
                          </Label>
                        </div>
                      )}
                      {(item as any).pricePerPiece && (
                        <div className="flex items-center space-x-2 bg-white p-2 rounded border">
                          <RadioGroupItem value="per_piece" id={`${item.id}-per_piece`} />
                          <Label htmlFor={`${item.id}-per_piece`} className="text-sm flex-1 cursor-pointer">
                            <div className="font-medium">Per Pcs</div>
                            <div className="text-xs text-gray-500">Rp {(item as any).pricePerPiece?.toLocaleString('id-ID')}</div>
                          </Label>
                        </div>
                      )}
                    </RadioGroup>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs text-gray-500 font-medium">Jumlah</Label>
                    <Input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)} min="1" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 font-medium">Harga {(item as any).pricingMode === 'per_piece' ? 'Per Pcs' : 'Per Porsi'}</Label>
                    <Input type="number" placeholder="Harga" value={item.price} onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)} min="0" className="mt-1" disabled={!!item.isFromRecipe} />
                    {(item as any).isFromRecipe && (<p className="text-xs text-blue-600 mt-1">Harga dari resep ({(item as any).pricingMode === 'per_piece' ? 'per pcs' : 'per porsi'})</p>)}
                  </div>
                  <div className="sm:col-span-2 lg:col-span-2">
                    <Label className="text-xs text-gray-500 font-medium">Total Harga</Label>
                    <div className="mt-1 p-2 bg-white border rounded-md">
                      <div className="font-semibold text-lg text-green-700">Rp {item.total.toLocaleString('id-ID')}</div>
                      <div className="text-xs text-gray-500">{item.quantity} × Rp {item.price.toLocaleString('id-ID')} {(item as any).pricingMode === 'per_piece' ? '(per pcs)' : '(per porsi)'}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
          <ChefHat className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="mb-2">Belum ada item dalam pesanan</p>
          <p className="text-sm">Pilih dari resep yang ada atau tambah item manual</p>
        </div>
      )}
    </div>
  );
};

export default OrderItemsSection;
