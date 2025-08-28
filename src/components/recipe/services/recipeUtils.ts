// src/components/recipe/services/recipeUtils.ts

import { logger } from '@/utils/logger';
import type { 
  Recipe, 
  NewRecipe, 
  BahanResep, 
  HPPCalculationResult, 
  ValidationResult,
  RecipeStats
} from '../types';

/**
 * Recipe Utilities and Calculations
 */

/**
 * Calculate ingredient total cost
 * Uses totalHarga if available, otherwise calculates from jumlah * hargaSatuan
 */
export const calculateIngredientCost = (bahanResep: BahanResep[]): number => {
  // FORCE console.log untuk debugging
  console.log('🔍 [DEBUG] calculateIngredientCost called with:', bahanResep);
  
  let totalCost = 0;
  let usedTotalHarga = 0;
  let usedCalculated = 0;
  
  bahanResep.forEach((bahan, index) => {
    console.log(`🔍 [DEBUG] Processing ingredient ${index + 1}:`, {
      nama: bahan.nama,
      jumlah: bahan.jumlah,
      hargaSatuan: bahan.hargaSatuan,
      totalHarga: bahan.totalHarga,
      totalHargaType: typeof bahan.totalHarga,
      totalHargaIsNaN: isNaN(bahan.totalHarga as number)
    });
    
    // Prioritize totalHarga if it exists and is valid
    if (typeof bahan.totalHarga === 'number' && !isNaN(bahan.totalHarga)) {
      totalCost += bahan.totalHarga;
      usedTotalHarga++;
      console.log(`✅ Using totalHarga: ${bahan.totalHarga}`);
      logger.debug(`RecipeUtils: Ingredient ${index + 1} (${bahan.nama}) using totalHarga: ${bahan.totalHarga}`);
    } else {
      // Fallback to manual calculation
      const calculated = bahan.jumlah * bahan.hargaSatuan;
      totalCost += calculated;
      usedCalculated++;
      console.log(`⚠️ Using calculated: ${bahan.jumlah} × ${bahan.hargaSatuan} = ${calculated}`);
      logger.debug(`RecipeUtils: Ingredient ${index + 1} (${bahan.nama}) calculated: ${bahan.jumlah} × ${bahan.hargaSatuan} = ${calculated}`);
    }
  });
  
  const summary = {
    totalIngredients: bahanResep.length,
    usedTotalHarga,
    usedCalculated,
    totalCost
  };
  
  console.log('🔍 [DEBUG] calculateIngredientCost FINAL RESULT:', summary);
  logger.debug(`RecipeUtils: calculateIngredientCost summary:`, summary);
  
  return totalCost;
};

/**
 * Main HPP calculation function
 */
export const calculateHPP = (
  bahanResep: BahanResep[],
  jumlahPorsi: number,
  biayaTenagaKerja: number,
  biayaOverhead: number,
  marginKeuntunganPersen: number,
  jumlahPcsPerPorsi: number = 1
): HPPCalculationResult => {
  // FORCE console.log untuk debugging HPP utama
  console.log('🏭 [DEBUG] calculateHPP called with parameters:', {
    bahanCount: bahanResep.length,
    jumlahPorsi,
    biayaTenagaKerja,
    biayaOverhead,
    marginKeuntunganPersen,
    jumlahPcsPerPorsi
  });
  
  logger.debug('RecipeUtils: Calculating HPP', {
    bahanCount: bahanResep.length,
    jumlahPorsi,
    biayaTenagaKerja,
    biayaOverhead,
    marginKeuntunganPersen,
    jumlahPcsPerPorsi
  });

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

  // 1. Calculate total ingredient cost
  const totalBahanBaku = calculateIngredientCost(bahanResep);
  console.log('🏭 [STEP 1] Total Bahan Baku:', totalBahanBaku);

  // 2. Calculate total HPP
  const totalHPP = totalBahanBaku + biayaTenagaKerja + biayaOverhead;
  console.log('🏭 [STEP 2] Total HPP calculation:', {
    totalBahanBaku,
    biayaTenagaKerja,
    biayaOverhead,
    totalHPP
  });

  // 3. Calculate HPP per portion
  const hppPerPorsi = totalHPP / jumlahPorsi;
  console.log('🏭 [STEP 3] HPP per porsi:', {
    totalHPP,
    jumlahPorsi,
    hppPerPorsi
  });

  // 4. Calculate HPP per piece
  const hppPerPcs = hppPerPorsi / jumlahPcsPerPorsi;
  console.log('🏭 [STEP 4] HPP per pcs:', {
    hppPerPorsi,
    jumlahPcsPerPorsi,
    hppPerPcs
  });

  // 5. Calculate margin amount
  const marginKeuntungan = (totalHPP * marginKeuntunganPersen) / 100;
  console.log('🏭 [STEP 5] Margin keuntungan:', {
    totalHPP,
    marginKeuntunganPersen,
    marginKeuntungan
  });

  // 6. Calculate selling prices
  const hargaJualPorsi = hppPerPorsi + (marginKeuntungan / jumlahPorsi);
  const hargaJualPerPcs = hppPerPcs + (marginKeuntungan / jumlahPorsi / jumlahPcsPerPorsi);
  console.log('🏭 [STEP 6] Harga jual:', {
    hargaJualPorsi,
    hargaJualPerPcs
  });

  // 7. Calculate profitability
  const profitabilitas = totalHPP > 0 ? (marginKeuntungan / totalHPP) * 100 : 0;
  console.log('🏭 [STEP 7] Profitabilitas:', profitabilitas);

  const result: HPPCalculationResult = {
    totalBahanBaku,
    biayaTenagaKerja,
    biayaOverhead,
    totalHPP,
    hppPerPorsi,
    hppPerPcs,
    marginKeuntungan,
    hargaJualPorsi,
    hargaJualPerPcs,
    profitabilitas
  };

  console.log('🏭 [FINAL] HPP calculation result:', result);
  logger.debug('RecipeUtils: HPP calculation result:', result);
  return result;
};

/**
 * Validate recipe data
 */
export const validateRecipeData = (recipe: Partial<NewRecipe>): ValidationResult => {
  const errors: string[] = [];

  // Basic validation
  if (!recipe.namaResep || recipe.namaResep.trim().length === 0) {
    errors.push('Nama resep wajib diisi');
  }

  if (!recipe.jumlahPorsi || recipe.jumlahPorsi <= 0) {
    errors.push('Jumlah porsi harus lebih dari 0');
  }

  if (!recipe.bahanResep || recipe.bahanResep.length === 0) {
    errors.push('Minimal harus ada 1 bahan resep');
  }

  // Validate ingredients
  if (recipe.bahanResep) {
    recipe.bahanResep.forEach((bahan, index) => {
      if (!bahan.nama || bahan.nama.trim().length === 0) {
        errors.push(`Bahan resep ke-${index + 1}: Nama bahan wajib diisi`);
      }
      if (!bahan.jumlah || bahan.jumlah <= 0) {
        errors.push(`Bahan resep ke-${index + 1}: Jumlah harus lebih dari 0`);
      }
      if (!bahan.hargaSatuan || bahan.hargaSatuan <= 0) {
        errors.push(`Bahan resep ke-${index + 1}: Harga satuan harus lebih dari 0`);
      }
      if (!bahan.satuan || bahan.satuan.trim().length === 0) {
        errors.push(`Bahan resep ke-${index + 1}: Satuan wajib diisi`);
      }
    });
  }

  // Validate costs
  if (recipe.biayaTenagaKerja !== undefined && recipe.biayaTenagaKerja < 0) {
    errors.push('Biaya tenaga kerja tidak boleh negatif');
  }

  if (recipe.biayaOverhead !== undefined && recipe.biayaOverhead < 0) {
    errors.push('Biaya overhead tidak boleh negatif');
  }

  if (recipe.marginKeuntunganPersen !== undefined && recipe.marginKeuntunganPersen < 0) {
    errors.push('Margin keuntungan tidak boleh negatif');
  }

  if (recipe.jumlahPcsPerPorsi !== undefined && recipe.jumlahPcsPerPorsi <= 0) {
    errors.push('Jumlah pcs per porsi harus lebih dari 0');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Calculate recipe statistics
 */
export const calculateRecipeStats = (recipes: Recipe[]): RecipeStats => {
  if (recipes.length === 0) {
    return {
      totalRecipes: 0,
      totalCategories: 0,
      averageHppPerPorsi: 0,
      mostExpensiveRecipe: null,
      cheapestRecipe: null,
      categoriesDistribution: {},
      profitabilityStats: { high: 0, medium: 0, low: 0 }
    };
  }

  // Basic stats
  const totalRecipes = recipes.length;
  const categories = new Set(recipes.map(r => r.kategoriResep).filter(Boolean));
  const totalCategories = categories.size;

  // HPP statistics
  const hppValues = recipes.map(r => r.hppPerPorsi).filter(hpp => hpp > 0);
  const averageHppPerPorsi = hppValues.length > 0 
    ? hppValues.reduce((sum, hpp) => sum + hpp, 0) / hppValues.length 
    : 0;

  // Most/least expensive recipes
  const recipesWithHpp = recipes.filter(r => r.hppPerPorsi > 0);
  const mostExpensiveRecipe = recipesWithHpp.length > 0
    ? recipesWithHpp.reduce((max, recipe) => recipe.hppPerPorsi > max.hppPerPorsi ? recipe : max)
    : null;
  
  const cheapestRecipe = recipesWithHpp.length > 0
    ? recipesWithHpp.reduce((min, recipe) => recipe.hppPerPorsi < min.hppPerPorsi ? recipe : min)
    : null;

  // Categories distribution
  const categoriesDistribution: { [key: string]: number } = {};
  recipes.forEach(recipe => {
    const category = recipe.kategoriResep || 'Tidak Berkategori';
    categoriesDistribution[category] = (categoriesDistribution[category] || 0) + 1;
  });

  // Profitability stats
  const profitabilityStats = { high: 0, medium: 0, low: 0 };
  recipes.forEach(recipe => {
    const profitability = recipe.marginKeuntunganPersen || 0;
    if (profitability >= 30) {
      profitabilityStats.high++;
    } else if (profitability >= 15) {
      profitabilityStats.medium++;
    } else {
      profitabilityStats.low++;
    }
  });

  return {
    totalRecipes,
    totalCategories,
    averageHppPerPorsi,
    mostExpensiveRecipe,
    cheapestRecipe,
    categoriesDistribution,
    profitabilityStats
  };
};

/**
 * Format currency value
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(value);
};

/**
 * Search recipes by query
 */
export const searchRecipes = (recipes: Recipe[], query: string): Recipe[] => {
  if (!query.trim()) return recipes;
  
  const lowercaseQuery = query.toLowerCase();
  return recipes.filter(recipe => 
    recipe.namaResep.toLowerCase().includes(lowercaseQuery) ||
    recipe.kategoriResep?.toLowerCase().includes(lowercaseQuery) ||
    recipe.deskripsi?.toLowerCase().includes(lowercaseQuery) ||
    recipe.bahanResep.some(bahan => 
      bahan.nama.toLowerCase().includes(lowercaseQuery)
    )
  );
};

/**
 * Filter recipes by category
 */
export const filterRecipesByCategory = (recipes: Recipe[], category: string): Recipe[] => {
  if (!category.trim()) return recipes;
  return recipes.filter(recipe => recipe.kategoriResep === category);
};

/**
 * Sort recipes by field
 */
export const sortRecipes = (
  recipes: Recipe[], 
  sortBy: keyof Recipe, 
  order: 'asc' | 'desc'
): Recipe[] => {
  return [...recipes].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    // Handle different data types
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return order === 'asc' ? comparison : -comparison;
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      const comparison = aValue - bValue;
      return order === 'asc' ? comparison : -comparison;
    }
    
    if (aValue instanceof Date && bValue instanceof Date) {
      const comparison = aValue.getTime() - bValue.getTime();
      return order === 'asc' ? comparison : -comparison;
    }
    
    return 0;
  });
};

/**
 * Get unique categories from recipes
 */
export const getUniqueCategories = (recipes: Recipe[]): string[] => {
  const categories = new Set(
    recipes
      .map(recipe => recipe.kategoriResep)
      .filter((category): category is string => Boolean(category))
  );
  return Array.from(categories).sort();
};

/**
 * Calculate profitability level
 */
export const getProfitabilityLevel = (marginPersen: number): 'high' | 'medium' | 'low' => {
  if (marginPersen >= 30) return 'high';
  if (marginPersen >= 15) return 'medium';
  return 'low';
};

/**
 * Get profitability color
 */
export const getProfitabilityColor = (marginPersen: number): string => {
  const level = getProfitabilityLevel(marginPersen);
  switch (level) {
    case 'high': return 'text-green-600 bg-green-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'low': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

/**
 * Generate recipe slug for URL
 */
export const generateRecipeSlug = (namaResep: string): string => {
  return namaResep
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim();
};

/**
 * Duplicate recipe with new name
 */
export const duplicateRecipe = (recipe: Recipe, newName: string): NewRecipe => {
  return {
    namaResep: newName,
    jumlahPorsi: recipe.jumlahPorsi,
    kategoriResep: recipe.kategoriResep,
    deskripsi: recipe.deskripsi,
    fotoUrl: recipe.fotoUrl,
    bahanResep: recipe.bahanResep.map(bahan => ({ ...bahan })), // Deep copy
    biayaTenagaKerja: recipe.biayaTenagaKerja,
    biayaOverhead: recipe.biayaOverhead,
    marginKeuntunganPersen: recipe.marginKeuntunganPersen,
    totalHpp: recipe.totalHpp,
    hppPerPorsi: recipe.hppPerPorsi,
    hargaJualPorsi: recipe.hargaJualPorsi,
    jumlahPcsPerPorsi: recipe.jumlahPcsPerPorsi,
    hppPerPcs: recipe.hppPerPcs,
    hargaJualPerPcs: recipe.hargaJualPerPcs,
  };
};

/**
 * Export recipes to CSV format
 */
export const exportRecipesToCSV = (recipes: Recipe[]): string => {
  const headers = [
    'Nama Resep',
    'Kategori',
    'Jumlah Porsi',
    'Total HPP',
    'HPP per Porsi',
    'Harga Jual per Porsi',
    'Margin (%)',
    'Profitabilitas',
    'Tanggal Dibuat'
  ];

  const rows = recipes.map(recipe => [
    recipe.namaResep,
    recipe.kategoriResep || '',
    recipe.jumlahPorsi.toString(),
    recipe.totalHpp.toString(),
    recipe.hppPerPorsi.toString(),
    recipe.hargaJualPorsi.toString(),
    recipe.marginKeuntunganPersen.toString(),
    getProfitabilityLevel(recipe.marginKeuntunganPersen),
    recipe.createdAt.toLocaleDateString('id-ID')
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
};

/**
 * Calculate recipe cost per serving
 */
export const calculateCostPerServing = (recipe: Recipe): number => {
  const totalIngredientCost = calculateIngredientCost(recipe.bahanResep);
  const totalCost = totalIngredientCost + recipe.biayaTenagaKerja + recipe.biayaOverhead;
  return totalCost / recipe.jumlahPorsi;
};

/**
 * Get most expensive ingredients
 */
export const getMostExpensiveIngredients = (
  bahanResep: BahanResep[], 
  limit: number = 5
): BahanResep[] => {
  return [...bahanResep]
    .sort((a, b) => b.totalHarga - a.totalHarga)
    .slice(0, limit);
};

/**
 * Calculate ingredient percentage contribution
 */
export const calculateIngredientPercentage = (
  bahan: BahanResep, 
  totalCost: number
): number => {
  return totalCost > 0 ? (bahan.totalHarga / totalCost) * 100 : 0;
};