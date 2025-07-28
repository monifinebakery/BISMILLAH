// src/components/recipe/shared/utils/recipeValidators.ts

import { RECIPE_VALIDATION } from '../constants';

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface FieldValidationResult {
  [key: string]: ValidationResult;
}

/**
 * Validate recipe name
 */
export const validateRecipeName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: 'Nama resep tidak boleh kosong' };
  }

  if (name.trim().length < RECIPE_VALIDATION.MIN_NAME_LENGTH) {
    return { 
      isValid: false, 
      message: `Nama resep minimal ${RECIPE_VALIDATION.MIN_NAME_LENGTH} karakter` 
    };
  }

  if (name.trim().length > RECIPE_VALIDATION.MAX_NAME_LENGTH) {
    return { 
      isValid: false, 
      message: `Nama resep maksimal ${RECIPE_VALIDATION.MAX_NAME_LENGTH} karakter` 
    };
  }

  return { isValid: true };
};

/**
 * Validate recipe description
 */
export const validateDescription = (description?: string): ValidationResult => {
  if (!description) {
    return { isValid: true }; // Description is optional
  }

  if (description.length > RECIPE_VALIDATION.MAX_DESCRIPTION_LENGTH) {
    return { 
      isValid: false, 
      message: `Deskripsi maksimal ${RECIPE_VALIDATION.MAX_DESCRIPTION_LENGTH} karakter` 
    };
  }

  return { isValid: true };
};

/**
 * Validate number of portions
 */
export const validatePortions = (portions: number): ValidationResult => {
  if (!portions || portions <= 0) {
    return { isValid: false, message: 'Jumlah porsi harus lebih dari 0' };
  }

  if (portions < RECIPE_VALIDATION.MIN_PORTIONS) {
    return { 
      isValid: false, 
      message: `Jumlah porsi minimal ${RECIPE_VALIDATION.MIN_PORTIONS}` 
    };
  }

  if (portions > RECIPE_VALIDATION.MAX_PORTIONS) {
    return { 
      isValid: false, 
      message: `Jumlah porsi maksimal ${RECIPE_VALIDATION.MAX_PORTIONS}` 
    };
  }

  return { isValid: true };
};

/**
 * Validate price value
 */
export const validatePrice = (price: number, fieldName: string = 'Harga'): ValidationResult => {
  if (price < RECIPE_VALIDATION.MIN_PRICE) {
    return { isValid: false, message: `${fieldName} tidak boleh negatif` };
  }

  if (price > RECIPE_VALIDATION.MAX_PRICE) {
    return { 
      isValid: false, 
      message: `${fieldName} terlalu besar (maksimal ${RECIPE_VALIDATION.MAX_PRICE})` 
    };
  }

  return { isValid: true };
};

/**
 * Validate ingredient data
 */
export const validateIngredient = (ingredient: {
  nama: string;
  jumlah: number;
  satuan: string;
  hargaPerSatuan: number;
}): FieldValidationResult => {
  const result: FieldValidationResult = {};

  // Validate name
  if (!ingredient.nama || ingredient.nama.trim().length === 0) {
    result.nama = { isValid: false, message: 'Nama bahan tidak boleh kosong' };
  } else {
    result.nama = { isValid: true };
  }

  // Validate quantity
  if (!ingredient.jumlah || ingredient.jumlah <= 0) {
    result.jumlah = { isValid: false, message: 'Jumlah harus lebih dari 0' };
  } else {
    result.jumlah = { isValid: true };
  }

  // Validate unit
  if (!ingredient.satuan || ingredient.satuan.trim().length === 0) {
    result.satuan = { isValid: false, message: 'Satuan tidak boleh kosong' };
  } else {
    result.satuan = { isValid: true };
  }

  // Validate price per unit
  const priceValidation = validatePrice(ingredient.hargaPerSatuan, 'Harga per satuan');
  result.hargaPerSatuan = priceValidation;

  return result;
};

/**
 * Validate all ingredients
 */
export const validateIngredients = (ingredients: Array<{
  nama: string;
  jumlah: number;
  satuan: string;
  hargaPerSatuan: number;
}>): ValidationResult => {
  if (!ingredients || ingredients.length === 0) {
    return { isValid: false, message: 'Minimal harus ada 1 bahan' };
  }

  for (let i = 0; i < ingredients.length; i++) {
    const ingredientValidation = validateIngredient(ingredients[i]);
    const hasError = Object.values(ingredientValidation).some(v => !v.isValid);
    
    if (hasError) {
      return { isValid: false, message: `Bahan ${i + 1} memiliki data yang tidak valid` };
    }
  }

  return { isValid: true };
};

/**
 * Validate complete recipe data
 */
export const validateRecipe = (recipe: {
  namaResep: string;
  deskripsi?: string;
  jumlahPorsi: number;
  jumlahPcsPerPorsi?: number;
  hargaJualPorsi?: number;
  hargaJualPerPcs?: number;
  ingredients: Array<{
    nama: string;
    jumlah: number;
    satuan: string;
    hargaPerSatuan: number;
  }>;
}): FieldValidationResult => {
  const result: FieldValidationResult = {};

  // Validate recipe name
  result.namaResep = validateRecipeName(recipe.namaResep);

  // Validate description
  result.deskripsi = validateDescription(recipe.deskripsi);

  // Validate portions
  result.jumlahPorsi = validatePortions(recipe.jumlahPorsi);

  // Validate pieces per portion (if provided)
  if (recipe.jumlahPcsPerPorsi !== undefined) {
    if (recipe.jumlahPcsPerPorsi <= 0) {
      result.jumlahPcsPerPorsi = { 
        isValid: false, 
        message: 'Jumlah pcs per porsi harus lebih dari 0' 
      };
    } else {
      result.jumlahPcsPerPorsi = { isValid: true };
    }
  }

  // Validate selling prices
  if (recipe.hargaJualPorsi !== undefined) {
    result.hargaJualPorsi = validatePrice(recipe.hargaJualPorsi, 'Harga jual per porsi');
  }

  if (recipe.hargaJualPerPcs !== undefined) {
    result.hargaJualPerPcs = validatePrice(recipe.hargaJualPerPcs, 'Harga jual per pcs');
  }

  // Validate ingredients
  result.ingredients = validateIngredients(recipe.ingredients);

  return result;
};

/**
 * Check if validation result has any errors
 */
export const hasValidationErrors = (validationResult: FieldValidationResult): boolean => {
  return Object.values(validationResult).some(result => !result.isValid);
};

/**
 * Get all validation error messages
 */
export const getValidationErrors = (validationResult: FieldValidationResult): string[] => {
  return Object.values(validationResult)
    .filter(result => !result.isValid)
    .map(result => result.message || 'Error tidak diketahui');
};

/**
 * Validate category name
 */
export const validateCategoryName = (name: string, existingCategories: string[] = []): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: 'Nama kategori tidak boleh kosong' };
  }

  if (existingCategories.map(c => c.toLowerCase()).includes(name.trim().toLowerCase())) {
    return { isValid: false, message: 'Kategori ini sudah ada' };
  }

  return { isValid: true };
};