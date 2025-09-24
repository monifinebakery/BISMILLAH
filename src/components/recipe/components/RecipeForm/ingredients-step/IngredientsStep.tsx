// src/components/recipe/components/RecipeForm/ingredients-step/IngredientsStep.tsx

import React from 'react';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { RecipeFormStepProps } from '../../../types';
import { useWarehouseContext } from '@/components/warehouse/context/WarehouseContext';
import { useIngredientCalculation, useIngredientFormManager } from '../hooks';
import { useIngredientConversion, useIngredientSelection } from './hooks';
import {
  IngredientFormFields,
  IngredientTable,
  ConversionInfo,
  IngredientSummary,
} from './components';

interface IngredientsStepProps extends Omit<RecipeFormStepProps, 'onNext' | 'onPrevious'> {}

export const IngredientsStep: React.FC<IngredientsStepProps> = ({
  data,
  errors,
  onUpdate,
  isLoading = false,
}) => {
  const { bahanBaku: warehouseItems, loading: loadingWarehouse } = useWarehouseContext();

  const formManager = useIngredientFormManager({
    recipeData: data,
    warehouseItems,
    onUpdate,
    isLoading,
  });

  const conversion = useIngredientConversion();

  const ingredientSelection = useIngredientSelection({
    warehouseItems,
    conversion,
    onIngredientUpdate: (ingredient) => {
      formManager.setNewIngredientData(ingredient);
    },
  });

  const calculations = useIngredientCalculation({
    ingredients: data.bahanResep,
    recipeData: data,
  });

  const handleNewIngredientWarehouseSelect = (warehouseItemId: string) => {
    const updatedIngredient = ingredientSelection.handleWarehouseItemSelect(
      warehouseItemId,
      formManager.newIngredient,
    );

    if (updatedIngredient) {
      formManager.setNewIngredientData(updatedIngredient);
    }
  };

  const handleExistingIngredientWarehouseUpdate = (
    index: number,
    warehouseItemId: string,
  ) => {
    const currentIngredient = data.bahanResep[index];
    const updatedIngredient = ingredientSelection.handleExistingIngredientWarehouseUpdate(
      warehouseItemId,
      currentIngredient,
    );

    if (updatedIngredient) {
      const newIngredients = [...data.bahanResep];
      newIngredients[index] = updatedIngredient;
      onUpdate('bahanResep', newIngredients);
    }
  };

  const handleAddIngredient = () => {
    const success = formManager.handleAddIngredient();
    if (success) {
      ingredientSelection.resetConversionInfo();
    }
  };

  const availableWarehouseItems = ingredientSelection.getAvailableWarehouseItems();
  const costSummary = calculations.getCostSummaries();

  return (
    <div className="space-y-6">
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

      <IngredientFormFields
        newIngredient={formManager.newIngredient}
        warehouseItems={availableWarehouseItems}
        onWarehouseSelect={handleNewIngredientWarehouseSelect}
        onFieldChange={formManager.handleNewIngredientChange}
        onSubmit={handleAddIngredient}
        getConversionPreview={ingredientSelection.getConversionPreview}
        hasNewIngredientData={formManager.hasNewIngredientData()}
        totalPreview={calculations.formatCurrency(formManager.newIngredient.total_harga || 0)}
        isWarehouseLoading={loadingWarehouse}
        isDisabled={isLoading}
      >
        <ConversionInfo conversionInfo={ingredientSelection.conversionInfo} />
      </IngredientFormFields>

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

      <IngredientSummary
        costSummary={costSummary}
        isCalculationReady={calculations.isCalculationReady}
      />

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
