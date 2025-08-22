// src/components/recipe/components/RecipeForm/IngredientsStep.tsx

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Plus,
  Trash2,
  ShoppingCart,
  Calculator,
  Info,
  AlertCircle,
  ChefHat,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import {
  RECIPE_UNITS,
  type NewRecipe,
  type RecipeFormStepProps,
  type BahanResep,
} from '../../types';
import { formatCurrency } from '../../services/recipeUtils';
import { logger } from '@/utils/logger';

// Import warehouse related hooks/services
import { useWarehouseContext } from '@/components/warehouse/context/WarehouseContext';
import type { BahanBakuFrontend } from '@/components/warehouse/types'; // Use BahanBakuFrontend type

interface IngredientsStepProps extends Omit<RecipeFormStepProps, 'onNext' | 'onPrevious'> {}

const IngredientsStep: React.FC<IngredientsStepProps> = ({
  data,
  errors,
  onUpdate,
  isLoading = false,
}) => {
  // Get warehouse items using existing warehouse context
  const { bahanBaku: warehouseItems, loading: loadingWarehouse } = useWarehouseContext();

  // DEBUG: Log raw warehouse data
  useEffect(() => {
    logger.debug('=== WAREHOUSE DEBUG ===');
    logger.debug('Loading:', loadingWarehouse);
    logger.debug('Total items:', warehouseItems.length);
    
    if (warehouseItems.length > 0) {
      logger.debug('First item raw data:', warehouseItems[0]);
      logger.debug('All field names:', Object.keys(warehouseItems[0]));
      
      // Check specific price fields
      warehouseItems.slice(0, 3).forEach((item, index) => {
        logger.debug(`Item ${index + 1} - ${item.nama}:`, {
          harga_satuan: item.harga_satuan,
          typeof_harga_satuan: typeof item.harga_satuan,
          all_price_related_fields: {
            harga_satuan: item.harga_satuan,
            // Check if there are other price fields
            ...Object.fromEntries(
              Object.entries(item).filter(([key]) => 
                key.toLowerCase().includes('harga') || 
                key.toLowerCase().includes('price')
              )
            )
          }
        });
      });
    }
  }, [warehouseItems, loadingWarehouse]);
  
  // New ingredient form
  const [newIngredient, setNewIngredient] = useState<Partial<BahanResep>>({
    nama: '',
    jumlah: 0,
    satuan: '',
    hargaSatuan: 0,
    totalHarga: 0,
  });

  // Calculate total ingredient cost
  const totalIngredientCost = data.bahanResep.reduce((sum, ingredient) => sum + ingredient.totalHarga, 0);

  // Handle warehouse item selection
  const handleWarehouseItemSelect = (warehouseItemId: string) => {
    const selectedItem = warehouseItems.find(item => item.id === warehouseItemId);
    if (selectedItem) {
      // Cast to BahanBakuFrontend since that's what the API actually returns
      const frontendItem = selectedItem as any as BahanBakuFrontend;
      
      console.log('Selected item (corrected):', {
        nama: frontendItem.nama,
        harga: frontendItem.harga, // This should be the correct field
        rawItem: selectedItem
      });
      
      setNewIngredient(prev => ({
        ...prev,
        nama: frontendItem.nama,
        satuan: frontendItem.satuan || prev.satuan,
        hargaSatuan: frontendItem.harga || 0, // Use 'harga' field from BahanBakuFrontend
        warehouseId: frontendItem.id,
        totalHarga: (prev.jumlah || 0) * (frontendItem.harga || 0)
      }));
    }
  };

  // Add new ingredient
  const handleAddIngredient = () => {
    if (!newIngredient.nama?.trim()) {
      toast.error('Nama bahan harus dipilih');
      return;
    }
    if (!newIngredient.satuan?.trim()) {
      toast.error('Satuan harus dipilih');
      return;
    }
    if ((newIngredient.jumlah || 0) <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }
    if ((newIngredient.hargaSatuan || 0) <= 0) {
      toast.error('Harga satuan harus lebih dari 0');
      return;
    }

    const ingredient: BahanResep = {
      id: Date.now().toString(),
      nama: newIngredient.nama!,
      jumlah: newIngredient.jumlah!,
      satuan: newIngredient.satuan!,
      hargaSatuan: newIngredient.hargaSatuan!,
      totalHarga: newIngredient.jumlah! * newIngredient.hargaSatuan!,
      warehouseId: newIngredient.warehouseId, // Store warehouse reference
    };

    onUpdate('bahanResep', [...data.bahanResep, ingredient]);
    
    // Reset form
    setNewIngredient({
      nama: '',
      jumlah: 0,
      satuan: '',
      hargaSatuan: 0,
      totalHarga: 0,
    });

    toast.success('Bahan berhasil ditambahkan');
  };

  // Remove ingredient
  const handleRemoveIngredient = (index: number) => {
    const newIngredients = data.bahanResep.filter((_, i) => i !== index);
    onUpdate('bahanResep', newIngredients);
    toast.success('Bahan berhasil dihapus');
  };

  // Update existing ingredient
  const handleUpdateIngredient = (index: number, field: keyof BahanResep, value: any) => {
    const newIngredients = [...data.bahanResep];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value,
    };

    // Recalculate total if quantity or unit price changes
    if (field === 'jumlah' || field === 'hargaSatuan') {
      newIngredients[index].totalHarga = newIngredients[index].jumlah * newIngredients[index].hargaSatuan;
    }

    onUpdate('bahanResep', newIngredients);
  };

  // Update existing ingredient with warehouse data
  const handleUpdateIngredientFromWarehouse = (index: number, warehouseItemId: string) => {
    const selectedItem = warehouseItems.find(item => item.id === warehouseItemId);
    if (selectedItem) {
      const frontendItem = selectedItem as any as BahanBakuFrontend;
      const newIngredients = [...data.bahanResep];
      const currentQuantity = newIngredients[index].jumlah;
      
      newIngredients[index] = {
        ...newIngredients[index],
        nama: frontendItem.nama,
        satuan: frontendItem.satuan || newIngredients[index].satuan,
        hargaSatuan: frontendItem.harga || newIngredients[index].hargaSatuan,
        totalHarga: currentQuantity * (frontendItem.harga || newIngredients[index].hargaSatuan),
        warehouseId: frontendItem.id,
      };

      onUpdate('bahanResep', newIngredients);
    }
  };

  // Update new ingredient form
  const handleNewIngredientChange = (field: keyof BahanResep, value: any) => {
    const updated = { ...newIngredient, [field]: value };
    
    // Auto-calculate total
    if (field === 'jumlah' || field === 'hargaSatuan') {
      const jumlah = field === 'jumlah' ? (value || 0) : (updated.jumlah || 0);
      const harga = field === 'hargaSatuan' ? (value || 0) : (updated.hargaSatuan || 0);
      updated.totalHarga = jumlah * harga;
    }
    
    setNewIngredient(updated);
  };

  // Filter available warehouse items (exclude already used ones if needed)
  const availableWarehouseItems = warehouseItems.filter(item => {
    // You can add logic here to filter out items that are already used
    // or show all items regardless
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="text-center pb-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Daftar Bahan-bahan
        </h2>
        <p className="text-gray-600">
          Pilih bahan dari warehouse atau tambahkan manual beserta takaran dan harganya
        </p>
      </div>

      {/* Add New Ingredient Form - FIXED LAYOUT */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            Tambah Bahan Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            
            {/* Row 1: Ingredient Name */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nama Bahan *</Label>
                <Select 
                  value={newIngredient.warehouseId || ''} 
                  onValueChange={handleWarehouseItemSelect}
                  disabled={isLoading || loadingWarehouse}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingWarehouse ? "Loading..." : "Pilih dari warehouse"} />
                  </SelectTrigger>
                  <SelectContent className="max-w-[400px]">
                    <div className="px-2 py-1 text-xs text-gray-500 border-b mb-1">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        Dari Warehouse
                      </div>
                    </div>
                    {availableWarehouseItems.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="cursor-pointer">
                        <div className="flex flex-col items-start gap-1 py-1">
                          <span className="font-medium">{item.nama}</span>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>{item.satuan}</span>
                            <span>•</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency((item as any).harga || 0)}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {availableWarehouseItems.length === 0 && !loadingWarehouse && (
                      <div className="px-2 py-4 text-center text-gray-500 text-sm">
                        Belum ada bahan di warehouse
                      </div>
                    )}
                  </SelectContent>
                </Select>
                
                {/* Manual input option */}
                <div className="relative">
                  <Input
                    type="text"
                    value={newIngredient.nama || ''}
                    onChange={(e) => handleNewIngredientChange('nama', e.target.value)}
                    placeholder="Atau ketik nama bahan manual"
                    disabled={isLoading}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Quantity, Unit, Price, and Action */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Quantity */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Jumlah *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newIngredient.jumlah || ''}
                  onChange={(e) => handleNewIngredientChange('jumlah', parseFloat(e.target.value) || 0)}
                  placeholder="500"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Satuan *</Label>
                <Select 
                  value={newIngredient.satuan || ''} 
                  onValueChange={(value) => handleNewIngredientChange('satuan', value)}
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

              {/* Unit Price */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Harga Satuan *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm z-10">
                    Rp
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={newIngredient.hargaSatuan || ''}
                    onChange={(e) => handleNewIngredientChange('hargaSatuan', parseFloat(e.target.value) || 0)}
                    placeholder="12000"
                    className="pl-8 w-full"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Add Button */}
              <div className="space-y-2">
                <Label className="text-sm font-medium opacity-0">Action</Label>
                <Button
                  type="button"
                  onClick={handleAddIngredient}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah
                </Button>
              </div>
            </div>

            {/* Preview Total */}
            {newIngredient.jumlah && newIngredient.hargaSatuan && (
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total harga bahan ini:</span>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {formatCurrency(newIngredient.totalHarga || 0)}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ingredients List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-orange-600" />
              Daftar Bahan ({data.bahanResep.length})
            </CardTitle>
            {totalIngredientCost > 0 && (
              <Badge className="bg-orange-100 text-orange-800 border-orange-300">
                Total: {formatCurrency(totalIngredientCost)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data.bahanResep.length === 0 ? (
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
                  {data.bahanResep.map((ingredient, index) => (
                    <TableRow key={ingredient.id || index}>
                      
                      {/* Name - Now editable with dropdown */}
                      <TableCell className="min-w-[200px]">
                        <div className="space-y-1">
                          <Select 
                            value={ingredient.warehouseId || ''} 
                            onValueChange={(value) => handleUpdateIngredientFromWarehouse(index, value)}
                          >
                            <SelectTrigger className="border-none focus:border-orange-300 bg-transparent">
                              <SelectValue placeholder="Pilih dari warehouse" />
                            </SelectTrigger>
                            <SelectContent className="max-w-[300px]">
                              {availableWarehouseItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  <div className="flex flex-col items-start gap-1">
                                    <span>{item.nama}</span>
                                    <div className="text-xs text-gray-500">
                                      {formatCurrency((item as any).harga || 0)}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="text"
                            value={ingredient.nama}
                            onChange={(e) => handleUpdateIngredient(index, 'nama', e.target.value)}
                            className="border-none focus:border-orange-300 bg-transparent text-sm"
                            placeholder="Atau edit manual"
                            disabled={isLoading}
                          />
                        </div>
                      </TableCell>

                      {/* Quantity */}
                      <TableCell className="min-w-[100px]">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ingredient.jumlah}
                          onChange={(e) => handleUpdateIngredient(index, 'jumlah', parseFloat(e.target.value) || 0)}
                          className="border-none focus:border-orange-300 bg-transparent text-center"
                          disabled={isLoading}
                        />
                      </TableCell>

                      {/* Unit */}
                      <TableCell className="min-w-[100px]">
                        <Select 
                          value={ingredient.satuan} 
                          onValueChange={(value) => handleUpdateIngredient(index, 'satuan', value)}
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
                            onChange={(e) => handleUpdateIngredient(index, 'hargaSatuan', parseFloat(e.target.value) || 0)}
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
                          onClick={() => handleRemoveIngredient(index)}
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

      {/* Summary & Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Cost Summary */}
        {data.bahanResep.length > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Ringkasan Biaya Bahan</h4>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Total Biaya Bahan:</span>
                  <span className="font-semibold text-blue-900">
                    {formatCurrency(totalIngredientCost)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-blue-700">Biaya per Porsi:</span>
                  <span className="font-semibold text-blue-900">
                    {formatCurrency(data.jumlahPorsi > 0 ? totalIngredientCost / data.jumlahPorsi : 0)}
                  </span>
                </div>

                {data.jumlahPcsPerPorsi > 1 && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">Biaya per Pcs:</span>
                    <span className="font-semibold text-blue-900">
                      {formatCurrency(
                        data.jumlahPorsi > 0 && data.jumlahPcsPerPorsi > 0 
                          ? totalIngredientCost / (data.jumlahPorsi * data.jumlahPcsPerPorsi)
                          : 0
                      )}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Info className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-orange-900 mb-2">
                  Tips Menambah Bahan
                </h4>
                <ul className="text-sm text-orange-800 space-y-1">
                  <li>• Pilih bahan dari warehouse untuk sinkronisasi harga otomatis</li>
                  <li>• Atau ketik manual jika bahan belum ada di warehouse</li>
                  <li>• Harga akan otomatis terisi dari data warehouse</li>
                  <li>• Update data warehouse untuk akurasi harga terbaru</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Validation Errors */}
      {errors.bahanResep && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">{errors.bahanResep}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IngredientsStep;