// src/components/recipe/services/recipeUtils.ts

import { logger } from '@/utils/logger';
import { useCurrency } from '@/contexts/CurrencyContext';
import type {
  Recipe,
  NewRecipe,
  BahanResep,
  HPPCalculationResult,
  ValidationResult,
  RecipeStats
} from '../types';
import { formatCurrency as formatCurrencyShared } from '@/lib/shared/formatters';

/**
 * Recipe Utilities and Calculations
 */

/**
 * Normalisasi data bahan resep agar konsisten menggunakan snake_case
 * sekaligus memastikan nilai numerik selalu bertipe number.
 */
export const normalizeBahanResep = (ingredients: any[] | null | undefined): BahanResep[] => {
  if (!Array.isArray(ingredients)) {
    return [];
  }

  return ingredients.map((ingredient, index) => {
    const rawNama = ingredient?.nama ?? ingredient?.name ?? '';
    const nama = typeof rawNama === 'string' && rawNama.trim().length > 0
      ? rawNama
      : `Bahan ${index + 1}`;

    const jumlahValue = Number(
      ingredient?.jumlah ?? ingredient?.quantity ?? ingredient?.qty ?? 0
    );
    const jumlah = Number.isFinite(jumlahValue) ? jumlahValue : 0;

    const rawSatuan = ingredient?.satuan ?? ingredient?.unit ?? ingredient?.uom ?? '';
    const satuan = typeof rawSatuan === 'string'
      ? rawSatuan
      : String(rawSatuan ?? '');

    const hargaSatuanValue = Number(
      ingredient?.harga_satuan ??
      ingredient?.hargaSatuan ??
      ingredient?.harga ??
      ingredient?.price ??
      ingredient?.price_per_unit ??
      0
    );
    const harga_satuan = Number.isFinite(hargaSatuanValue) ? hargaSatuanValue : 0;

    const totalHargaValue = Number(
      ingredient?.total_harga ??
      ingredient?.totalHarga ??
      ingredient?.total ??
      ingredient?.harga_total ??
      ingredient?.total_price ??
      ingredient?.totalPrice ??
      NaN
    );
    const calculatedTotal = jumlah * harga_satuan;
    const total_harga = Number.isFinite(totalHargaValue) && totalHargaValue > 0
      ? totalHargaValue
      : (Number.isFinite(calculatedTotal) ? calculatedTotal : 0);

    const rawWarehouseId = ingredient?.warehouse_id ?? ingredient?.warehouseId ?? ingredient?.bahan_baku_id;
    const warehouse_id = rawWarehouseId ? String(rawWarehouseId) : undefined;

    const rawId = ingredient?.id ?? ingredient?.ingredient_id ?? ingredient?.bahan_id;
    const id = rawId ? String(rawId) : undefined;

    const normalized: BahanResep = {
      ...(id ? { id } : {}),
      nama,
      jumlah,
      satuan,
      harga_satuan,
      total_harga,
      ...(warehouse_id ? { warehouse_id } : {}),
    };

    return normalized;
  });
};

/**
 * Calculate ingredient total cost
 * Uses totalHarga if available, otherwise calculates from jumlah * hargaSatuan
 */
export const calculateIngredientCost = (bahanResep: Array<any>): number => {
  // FORCE console.log untuk debugging
  console.log('🔍 [DEBUG] calculateIngredientCost called with:', bahanResep);
  
  let totalCost = 0;
  let usedTotalHarga = 0;
  let usedCalculated = 0;
  
  bahanResep.forEach((bahan, index) => {
    const totalHarga = typeof bahan.totalHarga === 'number' ? bahan.totalHarga : bahan.total_harga;
    const hargaSatuan = typeof bahan.hargaSatuan === 'number' ? bahan.hargaSatuan : bahan.harga_satuan;
    console.log(`🔍 [DEBUG] Processing ingredient ${index + 1}:`, {
      nama: bahan.nama,
      jumlah: bahan.jumlah,
      hargaSatuan,
      totalHarga,
      totalHargaType: typeof totalHarga,
      totalHargaIsNaN: isNaN(totalHarga as number)
    });
    
    // Prioritize totalHarga if it exists and is valid
    if (typeof totalHarga === 'number' && !isNaN(totalHarga)) {
      totalCost += totalHarga;
      usedTotalHarga++;
      console.log(`✅ Using totalHarga: ${totalHarga}`);
      logger.debug(`RecipeUtils: Ingredient ${index + 1} (${bahan.nama}) using totalHarga: ${totalHarga}`);
    } else {
      // Fallback to manual calculation
      const calculated = (Number(bahan.jumlah) || 0) * (Number(hargaSatuan) || 0);
      totalCost += calculated;
      usedCalculated++;
      console.log(`⚠️ Using calculated: ${bahan.jumlah} × ${hargaSatuan} = ${calculated}`);
      logger.debug(`RecipeUtils: Ingredient ${index + 1} (${bahan.nama}) calculated: ${bahan.jumlah} × ${hargaSatuan} = ${calculated}`);
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
export const validateRecipeData = (recipe: Partial<NewRecipe> | any): ValidationResult => {
  const errors: string[] = [];
  // Support both camelCase and snake_case inputs
  const namaResep = (recipe as any).nama_resep ?? (recipe as any).namaResep;
  const bahanList = (recipe as any).bahan_resep ?? (recipe as any).bahanResep;
  const jumlah_porsi_val = (recipe as any).jumlah_porsi ?? (recipe as any).jumlahPorsi;
  const jumlah_pcs_per_porsi_val = (recipe as any).jumlah_pcs_per_porsi ?? (recipe as any).jumlahPcsPerPorsi;

  // Name validation
  if (!namaResep || typeof namaResep !== 'string' || namaResep.trim().length === 0) {
    errors.push('Nama resep wajib diisi');
  }

  // Portion count
  const jumlahPorsi = typeof jumlah_porsi_val === 'string'
    ? (jumlah_porsi_val === '' ? 0 : parseInt(jumlah_porsi_val))
    : (Number(jumlah_porsi_val) || 0);
  if (!jumlahPorsi || jumlahPorsi <= 0) {
    errors.push('Jumlah porsi harus lebih dari 0');
  }

  // Ingredients
  if (!Array.isArray(bahanList) || bahanList.length === 0) {
    errors.push('Minimal harus ada 1 bahan resep');
  } else {
    bahanList.forEach((bahan: any, index: number) => {
      if (!bahan?.nama || String(bahan.nama).trim().length === 0) {
        errors.push(`Bahan resep ke-${index + 1}: Nama bahan wajib diisi`);
      }
      const jumlah = Number(bahan?.jumlah) || 0;
      if (jumlah <= 0) {
        errors.push(`Bahan resep ke-${index + 1}: Jumlah harus lebih dari 0`);
      }
      const harga = Number(bahan?.hargaSatuan ?? bahan?.harga_satuan) || 0;
      if (harga <= 0) {
        errors.push(`Bahan resep ke-${index + 1}: Harga satuan harus lebih dari 0`);
      }
      if (!bahan?.satuan || String(bahan.satuan).trim().length === 0) {
        errors.push(`Bahan resep ke-${index + 1}: Satuan wajib diisi`);
      }
    });
  }

  // Costs
  const biayaTKL = (recipe as any).biaya_tenaga_kerja ?? (recipe as any).biayaTenagaKerja;
  const biayaOverhead = (recipe as any).biaya_overhead ?? (recipe as any).biayaOverhead;
  const marginPersen = (recipe as any).margin_keuntungan_persen ?? (recipe as any).marginKeuntunganPersen;

  if (biayaTKL !== undefined && Number(biayaTKL) < 0) {
    errors.push('Biaya tenaga kerja tidak boleh negatif');
  }
  if (biayaOverhead !== undefined && Number(biayaOverhead) < 0) {
    errors.push('Biaya overhead tidak boleh negatif');
  }
  if (marginPersen !== undefined && Number(marginPersen) < 0) {
    errors.push('Margin keuntungan tidak boleh negatif');
  }

  // Pieces per portion
  if (jumlah_pcs_per_porsi_val !== undefined) {
    const jumlahPcsPerPorsi = typeof jumlah_pcs_per_porsi_val === 'string'
      ? (jumlah_pcs_per_porsi_val === '' ? 0 : parseInt(jumlah_pcs_per_porsi_val))
      : (Number(jumlah_pcs_per_porsi_val) || 0);
    if (jumlahPcsPerPorsi <= 0) {
      errors.push('Jumlah pcs per porsi harus lebih dari 0');
    }
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
  const categories = new Set(recipes.map(r => r.kategori_resep).filter(Boolean));
  const totalCategories = categories.size;

  // HPP statistics
  const hppValues = recipes.map(r => r.hpp_per_porsi).filter(hpp => hpp > 0);
  const averageHppPerPorsi = hppValues.length > 0 
    ? hppValues.reduce((sum, hpp) => sum + hpp, 0) / hppValues.length 
    : 0;

  // Most/least expensive recipes
  const recipesWithHpp = recipes.filter(r => r.hpp_per_porsi > 0);
  const mostExpensiveRecipe = recipesWithHpp.length > 0
    ? recipesWithHpp.reduce((max, recipe) => recipe.hpp_per_porsi > max.hpp_per_porsi ? recipe : max)
    : null;
  
  const cheapestRecipe = recipesWithHpp.length > 0
    ? recipesWithHpp.reduce((min, recipe) => recipe.hpp_per_porsi < min.hpp_per_porsi ? recipe : min)
    : null;

  // Categories distribution
  const categoriesDistribution: { [key: string]: number } = {};
  recipes.forEach(recipe => {
    const category = recipe.kategori_resep || 'Tidak Berkategori';
    categoriesDistribution[category] = (categoriesDistribution[category] || 0) + 1;
  });

  // Profitability stats
  const profitabilityStats = { high: 0, medium: 0, low: 0 };
  recipes.forEach(recipe => {
    const profitability = recipe.margin_keuntungan_persen || 0;
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
 * Format currency value - DEPRECATED
 * Use useCurrency hook instead for dynamic currency formatting
 */
export const formatCurrency = (amount: number): string => {
  return formatCurrencyShared(amount);
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
    recipe.nama_resep.toLowerCase().includes(lowercaseQuery) ||
    recipe.kategori_resep?.toLowerCase().includes(lowercaseQuery) ||
    recipe.deskripsi?.toLowerCase().includes(lowercaseQuery) ||
    recipe.bahan_resep.some(bahan => 
      bahan.nama.toLowerCase().includes(lowercaseQuery)
    )
  );
};

/**
 * Filter recipes by category
 */
export const filterRecipesByCategory = (recipes: Recipe[], category: string): Recipe[] => {
  if (!category.trim()) return recipes;
  return recipes.filter(recipe => recipe.kategori_resep === category);
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
      .map(recipe => recipe.kategori_resep)
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
    jumlahPorsi: recipe.jumlah_porsi,
    kategoriResep: recipe.kategori_resep,
    deskripsi: recipe.deskripsi,
    fotoUrl: recipe.foto_url,
    fotoBase64: recipe.foto_base64,
    bahanResep: recipe.bahan_resep.map(bahan => ({ ...bahan })), // Deep copy
    biayaTenagaKerja: recipe.biaya_tenaga_kerja,
    biayaOverhead: recipe.biaya_overhead,
    marginKeuntunganPersen: recipe.margin_keuntungan_persen,
    totalHpp: recipe.total_hpp,
    hppPerPorsi: recipe.hpp_per_porsi,
    hargaJualPorsi: recipe.harga_jual_porsi,
    jumlahPcsPerPorsi: recipe.jumlah_pcs_per_porsi,
    hppPerPcs: recipe.hpp_per_pcs,
    hargaJualPerPcs: recipe.harga_jual_per_pcs,
  };
};

/**
 * Export recipes to CSV format
 */
export const exportRecipesToCSV = (
  recipes: Array<any>,
  suppliers?: Array<{ id: string; nama: string }>
): string => {
  const headers = [
    'Nama Resep',
    'Jumlah Porsi',
    'Kategori',
    'Deskripsi',
    'Bahan Resep',
    'Biaya Tenaga Kerja (Rp)',
    'Biaya Overhead (Rp)',
    'Margin (%)',
    'Total HPP (Rp)',
    'HPP per Porsi (Rp)',
    'Harga Jual per Porsi (Rp)',
    'Jumlah Pcs per Porsi',
    'HPP per Pcs (Rp)',
    'Harga Jual per Pcs (Rp)'
  ];

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const resolveSupplierName = (bahan: any): string => {
    const raw = bahan?.supplier_name ?? bahan?.supplierName ?? bahan?.supplier ?? bahan?.supplier_id ?? bahan?.supplierId ?? '';
    if (!raw) return '';
    if (typeof raw === 'string' && !uuidRegex.test(raw)) return raw;
    const id = String(raw);
    const found = suppliers?.find(s => s.id === id);
    return found?.nama || id;
  };

  const rows = recipes.map((recipe) => {
    const nama = recipe.nama_resep ?? recipe.namaResep ?? '';
    const kategori = recipe.kategori_resep ?? recipe.kategoriResep ?? '';
    const deskripsi = recipe.deskripsi ?? recipe.deskripsi_resep ?? '';
    const jumlahPorsiNum = Number(recipe.jumlah_porsi ?? recipe.jumlahPorsi ?? 0) || 0;
    const jumlahPorsi = String(jumlahPorsiNum);

    const biayaTKLNum = Number(recipe.biaya_tenaga_kerja ?? recipe.biayaTenagaKerja ?? 0) || 0;
    const biayaOverheadNum = Number(recipe.biaya_overhead ?? recipe.biayaOverhead ?? 0) || 0;
    const marginNum = Number(recipe.margin_keuntungan_persen ?? recipe.marginKeuntunganPersen ?? 0) || 0;

    const totalHppNum = Number(recipe.total_hpp ?? recipe.totalHpp ?? 0) || 0;
    const hppPerPorsiNum = Number(recipe.hpp_per_porsi ?? recipe.hppPerPorsi ?? 0) || 0;
    const hargaJualPorsiNum = Number(recipe.harga_jual_porsi ?? recipe.hargaJualPorsi ?? 0) || 0;
    const jumlahPcsPerPorsiNum = Number(recipe.jumlah_pcs_per_porsi ?? recipe.jumlahPcsPerPorsi ?? 0) || 0;
    const hppPerPcsNum = Number(recipe.hpp_per_pcs ?? recipe.hppPerPcs ?? 0) || 0;
    const hargaJualPerPcsNum = Number(recipe.harga_jual_per_pcs ?? recipe.hargaJualPerPcs ?? 0) || 0;

    const bahanList: any[] = Array.isArray(recipe.bahan_resep ?? recipe.bahanResep)
      ? (recipe.bahan_resep ?? recipe.bahanResep)
      : [];
    const bahanSummary = bahanList
      .map((b: any) => {
        const namaBahan = b?.nama ?? '';
        const qty = Number(b?.jumlah ?? 0) || 0;
        const satuan = b?.satuan ?? '';
        const supplierName = resolveSupplierName(b);
        return supplierName
          ? `${namaBahan} (${qty} ${satuan}) [Supplier: ${supplierName}]`
          : `${namaBahan} (${qty} ${satuan})`;
      })
      .join('; ');

    return [
      nama,
      jumlahPorsi,
      kategori,
      deskripsi,
      bahanSummary,
      formatCurrencyShared(biayaTKLNum),
      formatCurrencyShared(biayaOverheadNum),
      String(marginNum),
      formatCurrencyShared(totalHppNum),
      formatCurrencyShared(hppPerPorsiNum),
      formatCurrencyShared(hargaJualPorsiNum),
      String(jumlahPcsPerPorsiNum),
      formatCurrencyShared(hppPerPcsNum),
      formatCurrencyShared(hargaJualPerPcsNum)
    ];
  });

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return csvContent;
};

/**
 * Calculate recipe cost per serving
 */
export const calculateCostPerServing = (recipe: Recipe): number => {
  const totalIngredientCost = calculateIngredientCost(recipe.bahan_resep as any[]);
  const totalCost = totalIngredientCost + recipe.biaya_tenaga_kerja + recipe.biaya_overhead;
  return totalCost / recipe.jumlah_porsi;
};

/**
 * Get most expensive ingredients
 */
export const getMostExpensiveIngredients = (
  bahanResep: BahanResep[], 
  limit: number = 5
): BahanResep[] => {
  const list = Array.isArray(bahanResep) ? bahanResep : [];
  return [...list]
    .sort((a: any, b: any) => (b.total_harga ?? b.totalHarga ?? 0) - (a.total_harga ?? a.totalHarga ?? 0))
    .slice(0, limit);
};

/**
 * Calculate ingredient percentage contribution
 */
export const calculateIngredientPercentage = (
  bahan: BahanResep, 
  totalCost: number
): number => {
  const th = (bahan as any).total_harga ?? (bahan as any).totalHarga ?? 0;
  return totalCost > 0 ? (Number(th) / totalCost) * 100 : 0;
};
