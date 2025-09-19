// src/components/recipe/components/RecipeForm/hooks/useIngredientSelection.ts

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { BahanResep } from '../../../types';
import type { BahanBakuFrontend } from '@/components/warehouse/types';
import { 
  convertIngredientUnit, 
  getConversionDisplayText, 
  formatConvertedPrice,
  type ConvertedIngredient 
} from '@/utils/unitConversion';
import { logger } from '@/utils/logger';

interface UseIngredientSelectionProps {
  warehouseItems: BahanBakuFrontend[];
  onIngredientUpdate?: (ingredient: Partial<BahanResep>) => void;
}

export const useIngredientSelection = ({
  warehouseItems,
  onIngredientUpdate
}: UseIngredientSelectionProps) => {
  // Unit conversion state
  const [conversionInfo, setConversionInfo] = useState<ConvertedIngredient | null>(null);

  // Handle warehouse item selection with automatic unit conversion
  const handleWarehouseItemSelect = useCallback((
    warehouseItemId: string,
    currentIngredient?: Partial<BahanResep>
  ): Partial<BahanResep> | null => {
    const selectedItem = warehouseItems.find(item => item.id === warehouseItemId);
    if (!selectedItem) {
      logger.warn('useIngredientSelection: Warehouse item not found', { warehouseItemId });
      return null;
    }

    // Cast to BahanBakuFrontend since that's what the API actually returns
    const frontendItem = selectedItem as any as BahanBakuFrontend;
    
    logger.debug('useIngredientSelection: Selected item (before conversion):', {
      nama: frontendItem.nama,
      harga: frontendItem.harga,
      satuan: frontendItem.satuan,
      rawItem: frontendItem
    });
    
    // AUTO CONVERT: Convert warehouse unit to recipe-friendly smaller unit
    const warehousePrice = frontendItem.harga || 0;
    const warehouseUnit = frontendItem.satuan || 'pcs';
    const conversion = convertIngredientUnit(warehouseUnit, warehousePrice);
    
    logger.debug('useIngredientSelection: Unit conversion applied:', {
      from: conversion.originalUnit,
      to: conversion.convertedUnit,
      priceFrom: conversion.originalPrice,
      priceTo: conversion.convertedPrice,
      isConverted: conversion.isConverted,
      multiplier: conversion.conversionMultiplier,
      displayText: getConversionDisplayText(conversion)
    });
    
    // Calculate total with current quantity
    const currentQuantity = currentIngredient?.jumlah || 0;
    const totalHarga = currentQuantity * conversion.convertedPrice;
    
    // Create updated ingredient
    const updatedIngredient: Partial<BahanResep> = {
      ...currentIngredient,
      nama: frontendItem.nama,
      satuan: conversion.convertedUnit, // Use converted unit (gram instead of kg)
      hargaSatuan: conversion.convertedPrice, // Use converted price (per gram instead of per kg)
      warehouseId: frontendItem.id,
      totalHarga
    };
    
    // Store conversion info for display
    setConversionInfo(conversion);
    
    // Show conversion info to user
    if (conversion.isConverted) {
      toast.success(
        `🆕 Satuan dikonversi: ${conversion.originalUnit} → ${conversion.convertedUnit}\n` +
        `Harga disesuaikan: ${formatConvertedPrice(conversion)}`,
        { duration: 4000 }
      );
    }
    
    // Trigger callback if provided
    if (onIngredientUpdate) {
      onIngredientUpdate(updatedIngredient);
    }
    
    return updatedIngredient;
  }, [warehouseItems, onIngredientUpdate]);

  // Handle warehouse item selection for existing ingredients
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
    const currentQuantity = currentIngredient.jumlah;
    
    // AUTO CONVERT: Apply unit conversion for existing ingredients too
    const warehousePrice = frontendItem.harga || 0;
    const warehouseUnit = frontendItem.satuan || 'pcs';
    const conversion = convertIngredientUnit(warehouseUnit, warehousePrice);
    
    logger.debug('useIngredientSelection: Updating existing ingredient with conversion:', {
      from: conversion.originalUnit,
      to: conversion.convertedUnit,
      priceFrom: conversion.originalPrice,
      priceTo: conversion.convertedPrice,
      isConverted: conversion.isConverted
    });
    
    const updatedIngredient: BahanResep = {
      ...currentIngredient,
      nama: frontendItem.nama,
      satuan: conversion.convertedUnit, // Use converted unit
      hargaSatuan: conversion.convertedPrice, // Use converted price
      totalHarga: currentQuantity * conversion.convertedPrice,
      warehouseId: frontendItem.id,
    };
    
    // Show conversion info to user for existing ingredient updates
    if (conversion.isConverted) {
      toast.success(
        `🆕 Bahan "${frontendItem.nama}" dikonversi: ${conversion.originalUnit} → ${conversion.convertedUnit}`,
        { duration: 3000 }
      );
    }
    
    return updatedIngredient;
  }, [warehouseItems]);

  // Get preview conversion for dropdown display
  const getConversionPreview = useCallback((warehouseItem: BahanBakuFrontend) => {
    const warehousePrice = (warehouseItem as any).harga || 0;
    const warehouseUnit = warehouseItem.satuan || 'pcs';
    return convertIngredientUnit(warehouseUnit, warehousePrice);
  }, []);

  // Filter available warehouse items
  const getAvailableWarehouseItems = useCallback((excludeIds: string[] = []) => {
    return warehouseItems.filter(item => {
      // You can add logic here to filter out items that are already used
      // or show all items regardless
      if (excludeIds.length > 0) {
        return !excludeIds.includes(item.id);
      }
      return true;
    });
  }, [warehouseItems]);

  // Reset conversion info
  const resetConversionInfo = useCallback(() => {
    setConversionInfo(null);
  }, []);

  return {
    // State
    conversionInfo,
    
    // Actions
    handleWarehouseItemSelect,
    handleExistingIngredientWarehouseUpdate,
    getConversionPreview,
    getAvailableWarehouseItems,
    resetConversionInfo,
    
    // Helpers
    hasConversion: conversionInfo?.isConverted || false
  };
};