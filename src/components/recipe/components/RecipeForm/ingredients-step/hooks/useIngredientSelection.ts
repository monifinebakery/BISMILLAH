// src/components/recipe/components/RecipeForm/ingredients-step/hooks/useIngredientSelection.ts

import { useCallback } from 'react';
import { toast } from 'sonner';
import type { BahanResep } from '../../../../types';
import type { BahanBakuFrontend } from '@/components/warehouse/types';
// Remove old unitConversion imports
import { logger } from '@/utils/logger';
import type { IngredientConversionApi } from './useIngredientConversion';

interface UseIngredientSelectionProps {
  warehouseItems: BahanBakuFrontend[];
  onIngredientUpdate?: (ingredient: Partial<BahanResep>) => void;
  conversion: IngredientConversionApi;
}

export const useIngredientSelection = ({
  warehouseItems,
  onIngredientUpdate,
  conversion,
}: UseIngredientSelectionProps) => {
  const handleWarehouseItemSelect = useCallback((
    warehouseItemId: string,
    currentIngredient?: Partial<BahanResep>
  ): Partial<BahanResep> | null => {
    const selectedItem = warehouseItems.find(item => item.id === warehouseItemId);
    if (!selectedItem) {
      logger.warn('useIngredientSelection: Warehouse item not found', { warehouseItemId });
      return null;
    }

    const frontendItem = selectedItem as any as BahanBakuFrontend;

    logger.debug('useIngredientSelection: Selected item (before conversion):', {
      nama: frontendItem.nama,
      harga: frontendItem.harga,
      satuan: frontendItem.satuan,
      rawItem: frontendItem,
    });

    const conversionResult = conversion.applyConversion(frontendItem);

    logger.debug('useIngredientSelection: Unit conversion applied:', {
      from: conversionResult.originalUnit,
      to: conversionResult.convertedUnit,
      priceFrom: conversionResult.originalPrice,
      priceTo: conversionResult.convertedPrice,
      isConverted: conversionResult.isConverted,
      multiplier: conversionResult.conversionMultiplier,
    });

    const currentQuantity = Number(currentIngredient?.jumlah) || 0;
    const convertedPrice = Number(conversionResult.convertedPrice) || 0;

    // Ensure valid calculation to prevent NaN
    const totalHarga = isNaN(currentQuantity) || isNaN(convertedPrice) ? 0 : currentQuantity * convertedPrice;

    const updatedIngredient: Partial<BahanResep> = {
      ...currentIngredient,
      nama: frontendItem.nama,
      satuan: conversionResult.convertedUnit,
      harga_satuan: conversionResult.convertedPrice,
      warehouse_id: frontendItem.id,
      total_harga: totalHarga,
    };

    if (conversionResult.isConverted) {
      toast.success(
        `🆕 Satuan dikonversi: ${conversionResult.originalUnit} → ${conversionResult.convertedUnit}`,
        { duration: 3000 }
      );
    }

    if (onIngredientUpdate) {
      onIngredientUpdate(updatedIngredient);
    }

    return updatedIngredient;
  }, [warehouseItems, onIngredientUpdate, conversion]);

  const handleExistingIngredientWarehouseUpdate = useCallback((
    warehouseItemId: string,
    currentIngredient: BahanResep
  ): BahanResep | null => {
    const selectedItem = warehouseItems.find(item => item.id === warehouseItemId);
    if (!selectedItem) {
      logger.warn('useIngredientSelection: Warehouse item not found for existing ingredient', { warehouseItemId });
      return null;
    }

    const frontendItem = selectedItem as any as BahanBakuFrontend;
    const currentQuantity = Number(currentIngredient.jumlah) || 0;
    const conversionResult = conversion.applyConversion(frontendItem);

    logger.debug('useIngredientSelection: Updating existing ingredient with conversion:', {
      from: conversionResult.originalUnit,
      to: conversionResult.convertedUnit,
      priceFrom: conversionResult.originalPrice,
      priceTo: conversionResult.convertedPrice,
      isConverted: conversionResult.isConverted,
    });

    const updatedIngredient: BahanResep = {
      ...currentIngredient,
      nama: frontendItem.nama,
      satuan: conversionResult.convertedUnit,
      harga_satuan: conversionResult.convertedPrice,
      total_harga: isNaN(currentQuantity) || isNaN(Number(conversionResult.convertedPrice)) ? 0 : currentQuantity * Number(conversionResult.convertedPrice),
      warehouse_id: frontendItem.id,
    };

    if (conversionResult.isConverted) {
      toast.success(
        `🆕 Bahan "${frontendItem.nama}" dikonversi: ${conversionResult.originalUnit} → ${conversionResult.convertedUnit}`,
        { duration: 3000 }
      );
    }

    return updatedIngredient;
  }, [warehouseItems, conversion]);

  const getAvailableWarehouseItems = useCallback((excludeIds: string[] = []) => {
    return warehouseItems.filter(item => {
      if (excludeIds.length > 0) {
        return !excludeIds.includes(item.id);
      }
      return true;
    });
  }, [warehouseItems]);

  return {
    conversionInfo: conversion.conversionInfo,
    handleWarehouseItemSelect,
    handleExistingIngredientWarehouseUpdate,
    getConversionPreview: conversion.getConversionPreview,
    getAvailableWarehouseItems,
    resetConversionInfo: conversion.resetConversionInfo,
    hasConversion: conversion.conversionInfo?.isConverted || false,
  };
};
