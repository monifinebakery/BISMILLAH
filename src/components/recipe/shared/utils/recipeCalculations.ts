// src/components/recipe/shared/utils/recipeCalculations.ts

import { RECIPE_CALCULATION } from '../constants';

export interface IngredientCalculation {
  id: string;
  nama: string;
  jumlah: number;
  satuan: string;
  hargaPerSatuan: number;
  totalHarga: number;
}

export interface RecipeCalculationResult {
  totalHpp: number;
  hppPerPorsi: number;
  hppPerPcs?: number;
  profitPerPorsi: number;
  profitPerPcs?: number;
  marginPercentage: number;
  ingredients: IngredientCalculation[];
}

/**
 * Calculate HPP for a single ingredient
 */
export const calculateIngredientHpp = (
  jumlah: number,
  hargaPerSatuan: number
): number => {
  return Number((jumlah * hargaPerSatuan).toFixed(RECIPE_CALCULATION.PRECISION));
};

/**
 * Calculate total HPP from ingredients
 */
export const calculateTotalHpp = (ingredients: IngredientCalculation[]): number => {
  return Number(
    ingredients
      .reduce((total, ingredient) => total + ingredient.totalHarga, 0)
      .toFixed(RECIPE_CALCULATION.PRECISION)
  );
};

/**
 * Calculate HPP per portion
 */
export const calculateHppPerPorsi = (totalHpp: number, jumlahPorsi: number): number => {
  if (jumlahPorsi <= 0) return 0;
  return Number((totalHpp / jumlahPorsi).toFixed(RECIPE_CALCULATION.PRECISION));
};

/**
 * Calculate HPP per piece
 */
export const calculateHppPerPcs = (
  hppPerPorsi: number,
  jumlahPcsPerPorsi: number
): number => {
  if (jumlahPcsPerPorsi <= 0) return 0;
  return Number((hppPerPorsi / jumlahPcsPerPorsi).toFixed(RECIPE_CALCULATION.PRECISION));
};

/**
 * Calculate profit per portion
 */
export const calculateProfitPerPorsi = (
  hargaJualPorsi: number,
  hppPerPorsi: number
): number => {
  return Number((hargaJualPorsi - hppPerPorsi).toFixed(RECIPE_CALCULATION.PRECISION));
};

/**
 * Calculate profit per piece
 */
export const calculateProfitPerPcs = (
  hargaJualPerPcs: number,
  hppPerPcs: number
): number => {
  return Number((hargaJualPerPcs - hppPerPcs).toFixed(RECIPE_CALCULATION.PRECISION));
};

/**
 * Calculate profit margin percentage
 */
export const calculateMarginPercentage = (
  profit: number,
  hargaJual: number
): number => {
  if (hargaJual <= 0) return 0;
  return Number(((profit / hargaJual) * 100).toFixed(RECIPE_CALCULATION.PRECISION));
};

/**
 * Calculate recommended selling price based on desired margin
 */
export const calculateRecommendedPrice = (
  hpp: number,
  marginPercentage: number
): number => {
  const margin = marginPercentage / 100;
  return Number((hpp / (1 - margin)).toFixed(RECIPE_CALCULATION.PRECISION));
};

/**
 * Complete recipe calculation
 */
export const calculateRecipe = (
  ingredients: Array<{
    id: string;
    nama: string;
    jumlah: number;
    satuan: string;
    hargaPerSatuan: number;
  }>,
  jumlahPorsi: number,
  jumlahPcsPerPorsi: number = 0,
  hargaJualPorsi: number = 0,
  hargaJualPerPcs: number = 0
): RecipeCalculationResult => {
  // Calculate ingredient costs
  const calculatedIngredients: IngredientCalculation[] = ingredients.map(ingredient => ({
    ...ingredient,
    totalHarga: calculateIngredientHpp(ingredient.jumlah, ingredient.hargaPerSatuan)
  }));

  // Calculate totals
  const totalHpp = calculateTotalHpp(calculatedIngredients);
  const hppPerPorsi = calculateHppPerPorsi(totalHpp, jumlahPorsi);
  const hppPerPcs = jumlahPcsPerPorsi > 0 ? calculateHppPerPcs(hppPerPorsi, jumlahPcsPerPorsi) : undefined;

  // Calculate profits
  const profitPerPorsi = calculateProfitPerPorsi(hargaJualPorsi, hppPerPorsi);
  const profitPerPcs = hppPerPcs && hargaJualPerPcs ? calculateProfitPerPcs(hargaJualPerPcs, hppPerPcs) : undefined;
  
  // Calculate margin
  const marginPercentage = calculateMarginPercentage(profitPerPorsi, hargaJualPorsi);

  return {
    totalHpp,
    hppPerPorsi,
    hppPerPcs,
    profitPerPorsi,
    profitPerPcs,
    marginPercentage,
    ingredients: calculatedIngredients
  };
};

/**
 * Validate calculation inputs
 */
export const validateCalculationInputs = (
  ingredients: Array<{ jumlah: number; hargaPerSatuan: number }>,
  jumlahPorsi: number
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (jumlahPorsi <= 0) {
    errors.push('Jumlah porsi harus lebih dari 0');
  }

  if (ingredients.length === 0) {
    errors.push('Minimal harus ada 1 bahan');
  }

  ingredients.forEach((ingredient, index) => {
    if (ingredient.jumlah <= 0) {
      errors.push(`Jumlah bahan ${index + 1} harus lebih dari 0`);
    }
    if (ingredient.hargaPerSatuan < 0) {
      errors.push(`Harga bahan ${index + 1} tidak boleh negatif`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};