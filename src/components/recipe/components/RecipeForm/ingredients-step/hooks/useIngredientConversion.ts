// src/components/recipe/components/RecipeForm/ingredients-step/hooks/useIngredientConversion.ts

import { useCallback, useState } from 'react';
import type { BahanBakuFrontend } from '@/components/warehouse/types';
import {
  convertUnits,
  getBaseUnit,
  normalizeStockValue,
  formatWithUnit,
} from '@/utils/unitConversion';

// Updated interface to work with new unit conversion system
export interface IngredientConversionResult {
  originalUnit: string;
  convertedUnit: string;
  originalPrice: number;
  convertedPrice: number;
  conversionMultiplier: number;
  isConverted: boolean;
  baseUnit: string;
  normalizedValue: number;
}

export interface IngredientConversionApi {
  conversionInfo: IngredientConversionResult | null;
  applyConversion: (warehouseItem: BahanBakuFrontend) => IngredientConversionResult;
  getConversionPreview: (warehouseItem: BahanBakuFrontend) => IngredientConversionResult;
  resetConversionInfo: () => void;
}

export const useIngredientConversion = (): IngredientConversionApi => {
  const [conversionInfo, setConversionInfo] = useState<IngredientConversionResult | null>(null);

  const applyConversion = useCallback((warehouseItem: BahanBakuFrontend): IngredientConversionResult => {
    const warehousePrice = (warehouseItem as any).harga || 0;
    const warehouseUnit = warehouseItem.satuan || 'pcs';
    const baseUnit = getBaseUnit(warehouseUnit) || warehouseUnit;

    // Calculate conversion multiplier (1 warehouseUnit = X baseUnits)
    const conversionMultiplier = convertUnits(1, warehouseUnit, baseUnit) || 1;

    // Calculate converted price (price per base unit)
    const convertedPrice = warehousePrice / conversionMultiplier;

    const result: IngredientConversionResult = {
      originalUnit: warehouseUnit,
      convertedUnit: baseUnit,
      originalPrice: warehousePrice,
      convertedPrice: convertedPrice,
      conversionMultiplier: conversionMultiplier,
      isConverted: conversionMultiplier !== 1,
      baseUnit: baseUnit,
      normalizedValue: warehouseItem.stok * conversionMultiplier,
    };

    setConversionInfo(result);
    return result;
  }, []);

  const getConversionPreview = useCallback((warehouseItem: BahanBakuFrontend): IngredientConversionResult => {
    const warehousePrice = (warehouseItem as any).harga || 0;
    const warehouseUnit = warehouseItem.satuan || 'pcs';
    const baseUnit = getBaseUnit(warehouseUnit) || warehouseUnit;

    const conversionMultiplier = convertUnits(1, warehouseUnit, baseUnit) || 1;
    const convertedPrice = warehousePrice / conversionMultiplier;

    return {
      originalUnit: warehouseUnit,
      convertedUnit: baseUnit,
      originalPrice: warehousePrice,
      convertedPrice: convertedPrice,
      conversionMultiplier: conversionMultiplier,
      isConverted: conversionMultiplier !== 1,
      baseUnit: baseUnit,
      normalizedValue: warehouseItem.stok * conversionMultiplier,
    };
  }, []);

  const resetConversionInfo = useCallback(() => {
    setConversionInfo(null);
  }, []);

  return {
    conversionInfo,
    applyConversion,
    getConversionPreview,
    resetConversionInfo,
  };
};
