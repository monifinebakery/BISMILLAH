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
  totalBahanBaku: number;          // Total cost bahan baku
  biayaTenagaKerja: number;        // Labor cost
  biayaOverhead: number;           // Overhead cost
  totalHpp: number;                // Total HPP
  hppPerPorsi: number;             // HPP per serving
  hppPerPcs: number;               // HPP per piece (if applicable)
  marginKeuntungan: number;        // Profit margin amount
  hargaJualPorsi: number;          // Selling price per serving
  hargaJualPerPcs: number;         // Selling price per piece (if applicable)
  profitPerPorsi: number;          // Profit per serving
  profitPerPcs: number;            // Profit per piece
  marginPersentase: number;        // Profit margin percentage
  ingredients: IngredientCalculation[];
}

export interface RecipeCalculationInput {
  bahanResep: Array<{
    id?: string;
    nama: string;
    jumlah: number;
    satuan: string;
    hargaPerSatuan: number;
  }>;
  jumlahPorsi: number;
  jumlahPcsPerPorsi?: number;
  biayaTenagaKerja?: number;
  biayaOverhead?: number;
  marginKeuntunganPersen?: number;
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
 * Calculate total cost from ingredients
 */
export const calculateTotalIngredientCost = (ingredients: IngredientCalculation[]): number => {
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
  const marginMultiplier = 1 + (marginPercentage / 100);
  return Number((hpp * marginMultiplier).toFixed(RECIPE_CALCULATION.PRECISION));
};

/**
 * Main recipe calculation function - matches RecipeContext interface
 */
export const calculateRecipe = (
  bahanResep: Array<{
    id?: string;
    nama: string;
    jumlah: number;
    satuan: string;
    hargaPerSatuan: number;
  }>,
  jumlahPorsi: number,
  biayaTenagaKerja: number = 0,
  biayaOverhead: number = 0,
  marginKeuntunganPersen: number = 30,
  jumlahPcsPerPorsi: number = 1
): RecipeCalculationResult => {
  
  // Validate inputs
  if (jumlahPorsi <= 0) {
    throw new Error('Jumlah porsi harus lebih dari 0');
  }
  if (jumlahPcsPerPorsi <= 0) {
    throw new Error('Jumlah pcs per porsi harus lebih dari 0');
  }
  if (marginKeuntunganPersen < 0) {
    throw new Error('Margin keuntungan tidak boleh negatif');
  }

  // Calculate ingredient costs
  const calculatedIngredients: IngredientCalculation[] = bahanResep.map((ingredient, index) => ({
    id: ingredient.id || `ingredient-${index}`,
    nama: ingredient.nama,
    jumlah: ingredient.jumlah,
    satuan: ingredient.satuan,
    hargaPerSatuan: ingredient.hargaPerSatuan,
    totalHarga: calculateIngredientHpp(ingredient.jumlah, ingredient.hargaPerSatuan)
  }));

  // 1. Calculate total bahan baku cost
  const totalBahanBaku = calculateTotalIngredientCost(calculatedIngredients);

  // 2. Calculate total HPP
  const totalHpp = totalBahanBaku + biayaTenagaKerja + biayaOverhead;

  // 3. Calculate HPP per porsi
  const hppPerPorsi = calculateHppPerPorsi(totalHpp, jumlahPorsi);

  // 4. Calculate HPP per pcs
  const hppPerPcs = calculateHppPerPcs(hppPerPorsi, jumlahPcsPerPorsi);

  // 5. Calculate recommended selling prices
  const hargaJualPorsi = calculateRecommendedPrice(hppPerPorsi, marginKeuntunganPersen);
  const hargaJualPerPcs = calculateRecommendedPrice(hppPerPcs, marginKeuntunganPersen);

  // 6. Calculate profits
  const profitPerPorsi = calculateProfitPerPorsi(hargaJualPorsi, hppPerPorsi);
  const profitPerPcs = calculateProfitPerPcs(hargaJualPerPcs, hppPerPcs);

  // 7. Calculate margin amount and percentage
  const marginKeuntungan = (totalHpp * marginKeuntunganPersen) / 100;
  const marginPersentase = calculateMarginPercentage(profitPerPorsi, hargaJualPorsi);

  return {
    totalBahanBaku,
    biayaTenagaKerja,
    biayaOverhead,
    totalHpp,
    hppPerPorsi,
    hppPerPcs,
    marginKeuntungan,
    hargaJualPorsi,
    hargaJualPerPcs,
    profitPerPorsi,
    profitPerPcs,
    marginPersentase,
    ingredients: calculatedIngredients
  };
};

/**
 * Enhanced calculation with custom selling prices
 */
export const calculateRecipeWithCustomPrices = (
  bahanResep: Array<{
    id?: string;
    nama: string;
    jumlah: number;
    satuan: string;
    hargaPerSatuan: number;
  }>,
  jumlahPorsi: number,
  hargaJualPorsi: number,
  hargaJualPerPcs: number = 0,
  biayaTenagaKerja: number = 0,
  biayaOverhead: number = 0,
  jumlahPcsPerPorsi: number = 1
): RecipeCalculationResult => {
  
  // Get base calculation first
  const baseCalc = calculateRecipe(
    bahanResep,
    jumlahPorsi,
    biayaTenagaKerja,
    biayaOverhead,
    0, // No margin for base calculation
    jumlahPcsPerPorsi
  );

  // Calculate profits with custom prices
  const profitPerPorsi = calculateProfitPerPorsi(hargaJualPorsi, baseCalc.hppPerPorsi);
  const profitPerPcs = hargaJualPerPcs > 0 
    ? calculateProfitPerPcs(hargaJualPerPcs, baseCalc.hppPerPcs)
    : 0;

  // Calculate actual margin percentage
  const marginPersentase = calculateMarginPercentage(profitPerPorsi, hargaJualPorsi);
  const marginKeuntungan = profitPerPorsi * jumlahPorsi;

  return {
    ...baseCalc,
    hargaJualPorsi,
    hargaJualPerPcs,
    profitPerPorsi,
    profitPerPcs,
    marginKeuntungan,
    marginPersentase
  };
};

/**
 * Calculate just ingredient cost (for quick calculations)
 */
export const calculateIngredientCost = (bahanResep: Array<{
  jumlah: number;
  hargaPerSatuan: number;
}>): number => {
  return bahanResep.reduce((total, bahan) => {
    return total + calculateIngredientHpp(bahan.jumlah, bahan.hargaPerSatuan);
  }, 0);
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

/**
 * Calculate break-even price (minimum selling price to cover costs)
 */
export const calculateBreakEvenPrice = (
  totalHpp: number,
  jumlahPorsi: number
): number => {
  return calculateHppPerPorsi(totalHpp, jumlahPorsi);
};

/**
 * Calculate margin needed to reach target profit
 */
export const calculateRequiredMargin = (
  hpp: number,
  targetProfit: number
): number => {
  if (hpp <= 0) return 0;
  return Number(((targetProfit / hpp) * 100).toFixed(RECIPE_CALCULATION.PRECISION));
};

/**
 * Batch calculation for multiple recipes
 */
export const calculateMultipleRecipes = (
  recipes: RecipeCalculationInput[]
): RecipeCalculationResult[] => {
  return recipes.map(recipe => 
    calculateRecipe(
      recipe.bahanResep,
      recipe.jumlahPorsi,
      recipe.biayaTenagaKerja || 0,
      recipe.biayaOverhead || 0,
      recipe.marginKeuntunganPersen || 30,
      recipe.jumlahPcsPerPorsi || 1
    )
  );
};