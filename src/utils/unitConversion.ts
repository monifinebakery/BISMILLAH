// src/utils/unitConversion.ts

export interface UnitConversion {
  from: string;
  to: string;
  multiplier: number;
  category: 'weight' | 'volume' | 'piece';
}

export interface ConvertedIngredient {
  originalUnit: string;
  convertedUnit: string;
  originalPrice: number;
  convertedPrice: number;
  conversionMultiplier: number;
  isConverted: boolean;
}

// Unit conversion mappings - from larger to smaller units
export const UNIT_CONVERSIONS: UnitConversion[] = [
  // Weight conversions
  { from: 'kg', to: 'gram', multiplier: 1000, category: 'weight' },
  { from: 'kilogram', to: 'gram', multiplier: 1000, category: 'weight' },
  { from: 'gr', to: 'gram', multiplier: 1, category: 'weight' },
  
  // Volume conversions  
  { from: 'liter', to: 'ml', multiplier: 1000, category: 'volume' },
  { from: 'litre', to: 'ml', multiplier: 1000, category: 'volume' },
  { from: 'l', to: 'ml', multiplier: 1000, category: 'volume' },
  
  // No conversion needed for piece units
  { from: 'pcs', to: 'pcs', multiplier: 1, category: 'piece' },
  { from: 'buah', to: 'buah', multiplier: 1, category: 'piece' },
  { from: 'bungkus', to: 'bungkus', multiplier: 1, category: 'piece' },
  { from: 'sachet', to: 'sachet', multiplier: 1, category: 'piece' },
  { from: 'sendok', to: 'sendok', multiplier: 1, category: 'piece' },
  { from: 'gelas', to: 'gelas', multiplier: 1, category: 'piece' },
  { from: 'cup', to: 'cup', multiplier: 1, category: 'piece' },
];

/**
 * Find the best smaller unit for a given warehouse unit
 * @param warehouseUnit - The unit from warehouse
 * @returns Conversion info or null if no conversion needed
 */
export const findBestConversion = (warehouseUnit: string): UnitConversion | null => {
  const conversion = UNIT_CONVERSIONS.find(conv => 
    conv.from.toLowerCase() === warehouseUnit.toLowerCase()
  );
  
  // Only suggest conversion if it results in a smaller unit (multiplier > 1)
  return conversion && conversion.multiplier > 1 ? conversion : null;
};

/**
 * Convert warehouse ingredient to recipe-friendly smaller unit with adjusted price
 * @param warehouseUnit - Original unit from warehouse
 * @param warehousePrice - Original price per warehouse unit
 * @returns Converted ingredient info
 */
export const convertIngredientUnit = (
  warehouseUnit: string, 
  warehousePrice: number
): ConvertedIngredient => {
  const conversion = findBestConversion(warehouseUnit);
  
  if (!conversion) {
    // No conversion needed - keep original unit and price
    return {
      originalUnit: warehouseUnit,
      convertedUnit: warehouseUnit,
      originalPrice: warehousePrice,
      convertedPrice: warehousePrice,
      conversionMultiplier: 1,
      isConverted: false,
    };
  }
  
  // Convert to smaller unit with proportional price adjustment
  const convertedPrice = warehousePrice / conversion.multiplier;
  
  return {
    originalUnit: warehouseUnit,
    convertedUnit: conversion.to,
    originalPrice: warehousePrice,
    convertedPrice: convertedPrice,
    conversionMultiplier: conversion.multiplier,
    isConverted: true,
  };
};

/**
 * Get display text for conversion info
 * @param conversion - Conversion result
 * @returns Human-readable conversion description
 */
export const getConversionDisplayText = (conversion: ConvertedIngredient): string => {
  if (!conversion.isConverted) {
    return `Menggunakan satuan asli: ${conversion.originalUnit}`;
  }
  
  return `Dikonversi dari ${conversion.originalUnit} ke ${conversion.convertedUnit} (1 ${conversion.originalUnit} = ${conversion.conversionMultiplier} ${conversion.convertedUnit})`;
};

/**
 * Format price with conversion info
 * @param conversion - Conversion result
 * @returns Formatted price string with conversion info
 */
export const formatConvertedPrice = (conversion: ConvertedIngredient): string => {
  if (!conversion.isConverted) {
    return `Rp ${conversion.originalPrice.toLocaleString('id-ID')}`;
  }
  
  return `Rp ${conversion.convertedPrice.toLocaleString('id-ID')}/${conversion.convertedUnit} (dari Rp ${conversion.originalPrice.toLocaleString('id-ID')}/${conversion.originalUnit})`;
};

/**
 * Check if a unit should be converted for easier recipe input
 * @param unit - Unit to check
 * @returns True if conversion is recommended
 */
export const shouldConvertUnit = (unit: string): boolean => {
  const conversion = findBestConversion(unit);
  return conversion !== null && conversion.multiplier > 1;
};

/**
 * Get recommended unit for recipe input
 * @param warehouseUnit - Original warehouse unit
 * @returns Recommended unit for recipe (converted if beneficial)
 */
export const getRecommendedRecipeUnit = (warehouseUnit: string): string => {
  const conversion = findBestConversion(warehouseUnit);
  return conversion ? conversion.to : warehouseUnit;
};