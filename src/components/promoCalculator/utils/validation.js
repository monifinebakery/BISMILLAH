export const validation = {
  // Validate recipe data
  validateRecipe: (recipe) => {
    const errors = [];

    if (!recipe) {
      errors.push('Resep tidak ditemukan');
      return { isValid: false, errors };
    }

    if (!recipe.namaResep || !recipe.namaResep.trim()) {
      errors.push('Nama resep tidak boleh kosong');
    }

    if (typeof recipe.hppPerPorsi !== 'number' || recipe.hppPerPorsi < 0) {
      errors.push('HPP per porsi tidak valid');
    }

    if (typeof recipe.hargaJualPorsi !== 'number' || recipe.hargaJualPorsi < 0) {
      errors.push('Harga jual per porsi tidak valid');
    }

    if (recipe.hargaJualPorsi <= recipe.hppPerPorsi) {
      errors.push('Harga jual harus lebih tinggi dari HPP');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate BOGO configuration
  validateBogoConfig: (mainRecipeId, freeRecipeId, recipes, minQty = 1) => {
    const errors = [];

    if (!mainRecipeId) {
      errors.push('Resep utama harus dipilih');
    }

    if (!freeRecipeId) {
      errors.push('Resep gratis harus dipilih');
    }

    if (mainRecipeId === freeRecipeId) {
      errors.push('Resep utama dan gratis tidak boleh sama');
    }

    if (minQty < 1) {
      errors.push('Minimal quantity harus lebih dari 0');
    }

    // Validate recipes exist and are valid
    const mainRecipe = recipes.find(r => r.id === mainRecipeId);
    const freeRecipe = recipes.find(r => r.id === freeRecipeId);

    if (mainRecipeId && !mainRecipe) {
      errors.push('Resep utama tidak ditemukan');
    }

    if (freeRecipeId && !freeRecipe) {
      errors.push('Resep gratis tidak ditemukan');
    }

    // Validate individual recipes
    if (mainRecipe) {
      const mainValidation = validation.validateRecipe(mainRecipe);
      if (!mainValidation.isValid) {
        errors.push(...mainValidation.errors.map(e => `Resep utama: ${e}`));
      }
    }

    if (freeRecipe) {
      const freeValidation = validation.validateRecipe(freeRecipe);
      if (!freeValidation.isValid) {
        errors.push(...freeValidation.errors.map(e => `Resep gratis: ${e}`));
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      mainRecipe,
      freeRecipe
    };
  },

  // Validate discount configuration
  validateDiscountConfig: (recipeId, discountType, discountValue, recipes, maxDiscount = null) => {
    const errors = [];

    if (!recipeId) {
      errors.push('Resep harus dipilih');
    }

    if (!discountType || !['persentase', 'nominal'].includes(discountType)) {
      errors.push('Tipe diskon tidak valid');
    }

    if (!discountValue || discountValue <= 0) {
      errors.push('Nilai diskon harus lebih dari 0');
    }

    if (discountType === 'persentase' && discountValue > 100) {
      errors.push('Diskon persentase tidak boleh lebih dari 100%');
    }

    if (maxDiscount && maxDiscount < 0) {
      errors.push('Maksimal diskon tidak boleh negatif');
    }

    // Validate recipe
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipeId && !recipe) {
      errors.push('Resep tidak ditemukan');
    }

    if (recipe) {
      const recipeValidation = validation.validateRecipe(recipe);
      if (!recipeValidation.isValid) {
        errors.push(...recipeValidation.errors);
      }

      // Check if discount would result in negative price
      let discountAmount = 0;
      if (discountType === 'persentase') {
        discountAmount = (recipe.hargaJualPorsi * discountValue) / 100;
        if (maxDiscount && discountAmount > maxDiscount) {
          discountAmount = maxDiscount;
        }
      } else {
        discountAmount = discountValue;
      }

      if (discountAmount >= recipe.hargaJualPorsi) {
        errors.push('Diskon terlalu besar, akan menghasilkan harga negatif');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      recipe
    };
  },

  // Validate bundle configuration
  validateBundleConfig: (bundleItems, bundlePrice, recipes) => {
    const errors = [];

    if (!bundleItems || !Array.isArray(bundleItems)) {
      errors.push('Bundle items tidak valid');
      return { isValid: false, errors };
    }

    if (bundleItems.length < 2) {
      errors.push('Bundle minimal harus memiliki 2 resep');
    }

    if (!bundlePrice || bundlePrice <= 0) {
      errors.push('Harga bundle harus lebih dari 0');
    }

    // Validate each bundle item
    bundleItems.forEach((item, index) => {
      if (!item.resepId) {
        errors.push(`Item ke-${index + 1}: Resep harus dipilih`);
      }

      if (!item.quantity || item.quantity < 1) {
        errors.push(`Item ke-${index + 1}: Quantity harus lebih dari 0`);
      }

      // Check if recipe exists
      const recipe = recipes.find(r => r.id === item.resepId);
      if (item.resepId && !recipe) {
        errors.push(`Item ke-${index + 1}: Resep tidak ditemukan`);
      }

      // Validate recipe
      if (recipe) {
        const recipeValidation = validation.validateRecipe(recipe);
        if (!recipeValidation.isValid) {
          errors.push(...recipeValidation.errors.map(e => `Item ke-${index + 1}: ${e}`));
        }
      }
    });

    // Check for duplicate recipes
    const recipeIds = bundleItems.map(item => item.resepId).filter(Boolean);
    const uniqueIds = [...new Set(recipeIds)];
    if (recipeIds.length !== uniqueIds.length) {
      errors.push('Tidak boleh ada resep yang sama dalam bundle');
    }

    return {
      isValid: errors.length === 0,
      errors,
      bundleItems
    };
  },

  // Validate date range
  validateDateRange: (startDate, endDate) => {
    const errors = [];

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime())) {
        errors.push('Tanggal mulai tidak valid');
      }

      if (isNaN(end.getTime())) {
        errors.push('Tanggal selesai tidak valid');
      }

      if (start >= end) {
        errors.push('Tanggal selesai harus setelah tanggal mulai');
      }

      // Optional: warn if start date is in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (start < today) {
        errors.push('Tanggal mulai sebaiknya tidak di masa lalu');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Validate promo name
  validatePromoName: (name, existingPromos = []) => {
    const errors = [];

    if (!name || !name.trim()) {
      errors.push('Nama promo wajib diisi');
    } else {
      if (name.trim().length < 3) {
        errors.push('Nama promo minimal 3 karakter');
      }

      if (name.trim().length > 100) {
        errors.push('Nama promo maksimal 100 karakter');
      }

      // Check for duplicate names
      const duplicatePromo = existingPromos.find(promo => 
        promo.namaPromo?.toLowerCase().trim() === name.toLowerCase().trim()
      );
      
      if (duplicatePromo) {
        errors.push('Nama promo sudah digunakan');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};