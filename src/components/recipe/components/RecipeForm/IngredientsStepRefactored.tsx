// src/components/recipe/components/RecipeForm/IngredientsStepRefactored.tsx

import React from 'react';
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
import {
  Plus,
  ShoppingCart,
  AlertCircle
} from 'lucide-react';
import type {
  NewRecipe,
  RecipeFormStepProps,
} from '../../types';
import { RECIPE_UNITS } from '../../types';

// Import warehouse related hooks/services
import { useWarehouseContext } from '@/components/warehouse/context/WarehouseContext';

// Import refactored hooks
import {
  useIngredientSelection,
  useIngredientCalculation,
  useIngredientFormManager
} from './hooks';

// Import refactored components
import {
  IngredientSelector,
  IngredientTable,
  ConversionInfoPanel,
  IngredientSummary
} from './components';

interface IngredientsStepRefactoredProps extends Omit<RecipeFormStepProps, 'onNext' | 'onPrevious'> {}

const IngredientsStepRefactored: React.FC<IngredientsStepRefactoredProps> = ({
  data,
  errors,
  onUpdate,
  isLoading = false,
}) => {
  // Use warehouse context directly
  const { bahanBaku: warehouseItems, loading: loadingWarehouse } = useWarehouseContext();

  // Hook for ingredient form management
  const formManager = useIngredientFormManager({
    recipeData: data,
    warehouseItems,
    onUpdate,
    isLoading
  });

  // Hook for ingredient selection and unit conversion
  const ingredientSelection = useIngredientSelection({
    warehouseItems,
    onIngredientUpdate: (ingredient) => {
      formManager.setNewIngredientData(ingredient);
    }
  });

  // Hook for cost calculations
  const calculations = useIngredientCalculation({
    ingredients: data.bahanResep,
    recipeData: data
  });

  // Handle warehouse item selection for new ingredient
  const handleNewIngredientWarehouseSelect = (warehouseItemId: string) => {
    const updatedIngredient = ingredientSelection.handleWarehouseItemSelect(
      warehouseItemId,
      formManager.newIngredient
    );
    if (updatedIngredient) {
      formManager.setNewIngredientData(updatedIngredient);
    }
  };

  // Handle warehouse item selection for existing ingredients
  const handleExistingIngredientWarehouseUpdate = (index: number, warehouseItemId: string) => {
    const currentIngredient = data.bahanResep[index];
    const updatedIngredient = ingredientSelection.handleExistingIngredientWarehouseUpdate(
      warehouseItemId,
      currentIngredient
    );
    if (updatedIngredient) {
      const newIngredients = [...data.bahanResep];
      newIngredients[index] = updatedIngredient;
      onUpdate('bahanResep', newIngredients);
    }
  };

  // Handle add ingredient
  const handleAddIngredient = () => {
    const success = formManager.handleAddIngredient();
    if (success) {
      // Reset conversion info after successful add
      ingredientSelection.resetConversionInfo();
    }
  };

  // Get available warehouse items
  const availableWarehouseItems = ingredientSelection.getAvailableWarehouseItems();

  // Get cost summaries
  const costSummary = calculations.getCostSummaries();

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="text-center pb-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
          <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 text-overflow-safe">
          Daftar Bahan-bahan
        </h2>
        <p className="text-sm sm:text-base text-gray-600 text-overflow-safe">
          Pilih bahan dari warehouse untuk memastikan sinkronisasi harga dan stok
        </p>
      </div>

      {/* Add New Ingredient Form */}
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
              <IngredientSelector
                selectedWarehouseId={formManager.newIngredient.warehouseId}
                warehouseItems={availableWarehouseItems}
                onSelect={handleNewIngredientWarehouseSelect}
                onConversionPreview={ingredientSelection.getConversionPreview}
                isLoading={loadingWarehouse}
                isDisabled={isLoading}
              />
            </div>

            {/* Row 2: Quantity, Unit, Price, and Action */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Quantity */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Jumlah *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formManager.newIngredient.jumlah || ''}
                  onChange={(e) => formManager.handleNewIngredientChange('jumlah', parseFloat(e.target.value) || 0)}
                  placeholder="500"
                  disabled={isLoading}
                  className="w-full input-mobile-safe"
                />
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Satuan *</Label>
                <Select 
                  value={formManager.newIngredient.satuan || ''} 
                  onValueChange={(value) => formManager.handleNewIngredientChange('satuan', value)}
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
                    value={formManager.newIngredient.hargaSatuan || ''}
                    onChange={(e) => formManager.handleNewIngredientChange('hargaSatuan', parseFloat(e.target.value) || 0)}
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
            {formManager.hasNewIngredientData() && (
              <div className="mt-4 p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total harga bahan ini:</span>
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {calculations.formatCurrency(formManager.newIngredient.totalHarga || 0)}
                  </Badge>
                </div>
              </div>
            )}
            
            {/* Unit Conversion Info */}
            <ConversionInfoPanel conversionInfo={ingredientSelection.conversionInfo} />
            
          </div>
        </CardContent>
      </Card>

      {/* Ingredients Table */}
      <IngredientTable
        ingredients={formManager.ingredients}
        warehouseItems={availableWarehouseItems}
        onUpdateIngredient={formManager.handleUpdateIngredient}
        onUpdateIngredientFromWarehouse={handleExistingIngredientWarehouseUpdate}
        onRemoveIngredient={formManager.handleRemoveIngredient}
        getIngredientDisplayName={formManager.getIngredientDisplayName}
        totalCost={costSummary.totalCost}
        isLoading={isLoading}
      />

      {/* Summary & Tips */}
      <IngredientSummary
        costSummary={costSummary}
        isCalculationReady={calculations.isCalculationReady}
      />

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

export default IngredientsStepRefactored;