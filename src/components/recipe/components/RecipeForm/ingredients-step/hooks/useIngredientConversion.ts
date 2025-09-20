// src/components/recipe/components/RecipeForm/ingredients-step/hooks/useIngredientConversion.ts

import { useCallback, useState } from 'react';
import type { BahanBakuFrontend } from '@/components/warehouse/types';
import {
  convertIngredientUnit,
  type ConvertedIngredient,
} from '@/utils/unitConversion';

export interface IngredientConversionApi {
  conversionInfo: ConvertedIngredient | null;
  applyConversion: (warehouseItem: BahanBakuFrontend) => ConvertedIngredient;
  getConversionPreview: (warehouseItem: BahanBakuFrontend) => ConvertedIngredient;
  resetConversionInfo: () => void;
}

export const useIngredientConversion = (): IngredientConversionApi => {
  const [conversionInfo, setConversionInfo] = useState<ConvertedIngredient | null>(null);

  const applyConversion = useCallback((warehouseItem: BahanBakuFrontend) => {
    const warehousePrice = (warehouseItem as any).harga || 0;
    const warehouseUnit = warehouseItem.satuan || 'pcs';

    const conversion = convertIngredientUnit(warehouseUnit, warehousePrice);
    setConversionInfo(conversion);

    return conversion;
  }, []);

  const getConversionPreview = useCallback((warehouseItem: BahanBakuFrontend) => {
    const warehousePrice = (warehouseItem as any).harga || 0;
    const warehouseUnit = warehouseItem.satuan || 'pcs';

    return convertIngredientUnit(warehouseUnit, warehousePrice);
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
