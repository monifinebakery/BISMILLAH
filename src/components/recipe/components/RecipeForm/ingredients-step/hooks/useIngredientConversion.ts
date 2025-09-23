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
    const warehousePrice = Number((warehouseItem as any).harga) || 0;
    const warehouseUnit = warehouseItem.satuan || 'pcs';
    const baseUnit = getBaseUnit(warehouseUnit) || warehouseUnit;

    // Calculate conversion multiplier (1 warehouseUnit = X baseUnits)
    const conversionMultiplier = convertUnits(1, warehouseUnit, baseUnit) || 1;

    // Validate inputs to prevent NaN
    if (warehousePrice <= 0 || isNaN(warehousePrice)) {
      // If price is invalid, keep original price and unit
      const result: IngredientConversionResult = {
        originalUnit: warehouseUnit,
        convertedUnit: warehouseUnit,
        originalPrice: warehousePrice,
        convertedPrice: warehousePrice,
        conversionMultiplier: 1,
        isConverted: false,
        baseUnit: warehouseUnit,
        normalizedValue: Number(warehouseItem.stok) || 0,
      };
      setConversionInfo(result);
      return result;
    }

    // Calculate converted price (price per base unit)
    const convertedPrice = warehousePrice / conversionMultiplier;

    // Ensure converted price is valid
    const finalConvertedPrice = isNaN(convertedPrice) ? warehousePrice : convertedPrice;

    const result: IngredientConversionResult = {
      originalUnit: warehouseUnit,
      convertedUnit: baseUnit,
      originalPrice: warehousePrice,
      convertedPrice: finalConvertedPrice,
      conversionMultiplier: conversionMultiplier,
      isConverted: conversionMultiplier !== 1,
      baseUnit: baseUnit,
      normalizedValue: (Number(warehouseItem.stok) || 0) * conversionMultiplier,
    };

    setConversionInfo(result);
    return result;
  }, []);

  const getConversionPreview = useCallback((warehouseItem: BahanBakuFrontend): IngredientConversionResult => {
    const warehousePrice = Number((warehouseItem as any).harga) || 0;
    const warehouseUnit = warehouseItem.satuan || 'pcs';
    const baseUnit = getBaseUnit(warehouseUnit) || warehouseUnit;

    const conversionMultiplier = convertUnits(1, warehouseUnit, baseUnit) || 1;

    // Validate inputs to prevent NaN
    if (warehousePrice <= 0 || isNaN(warehousePrice)) {
      // If price is invalid, keep original price and unit
      return {
        originalUnit: warehouseUnit,
        convertedUnit: warehouseUnit,
        originalPrice: warehousePrice,
        convertedPrice: warehousePrice,
        conversionMultiplier: 1,
        isConverted: false,
        baseUnit: warehouseUnit,
        normalizedValue: Number(warehouseItem.stok) || 0,
      };
    }

    const convertedPrice = warehousePrice / conversionMultiplier;
    const finalConvertedPrice = isNaN(convertedPrice) ? warehousePrice : convertedPrice;

    return {
      originalUnit: warehouseUnit,
      convertedUnit: baseUnit,
      originalPrice: warehousePrice,
      convertedPrice: finalConvertedPrice,
      conversionMultiplier: conversionMultiplier,
      isConverted: conversionMultiplier !== 1,
      baseUnit: baseUnit,
      normalizedValue: (Number(warehouseItem.stok) || 0) * conversionMultiplier,
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
