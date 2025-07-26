export const calculations = {
  // Calculate BOGO impact
  calculateBogo: (mainRecipe, freeRecipe, quantity = 1) => {
    if (!mainRecipe || !freeRecipe) {
      throw new Error('Resep utama dan gratis harus dipilih');
    }

    const normalHpp = mainRecipe.hppPerPorsi * quantity;
    const normalPrice = mainRecipe.hargaJualPorsi * quantity;
    const normalProfit = normalPrice - normalHpp;
    const normalMargin = normalPrice > 0 ? (normalProfit / normalPrice) * 100 : 0;

    // BOGO: Customer pays normal price but gets extra product (additional HPP)
    const promoHpp = normalHpp + (freeRecipe.hppPerPorsi * quantity);
    const promoPrice = normalPrice; // Customer pays same price
    const promoProfit = promoPrice - promoHpp;
    const promoMargin = promoPrice > 0 ? (promoProfit / promoPrice) * 100 : 0;

    const effectiveDiscount = freeRecipe.hargaJualPorsi * quantity;
    const marginImpact = promoMargin - normalMargin;

    return {
      normalHpp,
      normalPrice,
      normalProfit,
      normalMargin,
      promoHpp,
      promoPrice,
      promoProfit,
      promoMargin,
      effectiveDiscount,
      marginImpact,
      isMarginPositive: promoMargin > 0,
      mainRecipe: mainRecipe.namaResep,
      freeRecipe: freeRecipe.namaResep,
      quantity
    };
  },

  // Calculate discount impact
  calculateDiscount: (recipe, discountType, discountValue, maxDiscount = null) => {
    if (!recipe) {
      throw new Error('Resep harus dipilih');
    }

    if (!discountValue || discountValue <= 0) {
      throw new Error('Nilai diskon harus lebih dari 0');
    }

    const normalHpp = recipe.hppPerPorsi;
    const normalPrice = recipe.hargaJualPorsi;
    const normalProfit = normalPrice - normalHpp;
    const normalMargin = normalPrice > 0 ? (normalProfit / normalPrice) * 100 : 0;

    // Calculate discount amount
    let discountAmount = 0;
    if (discountType === 'persentase') {
      if (discountValue > 100) {
        throw new Error('Diskon persentase tidak boleh lebih dari 100%');
      }
      discountAmount = (normalPrice * discountValue) / 100;
      
      // Apply maximum discount if specified
      if (maxDiscount && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else {
      discountAmount = discountValue;
    }

    const promoPrice = Math.max(0, normalPrice - discountAmount);
    const promoHpp = normalHpp; // HPP doesn't change
    const promoProfit = promoPrice - promoHpp;
    const promoMargin = promoPrice > 0 ? (promoProfit / promoPrice) * 100 : 0;
    const marginImpact = promoMargin - normalMargin;

    return {
      normalHpp,
      normalPrice,
      normalProfit,
      normalMargin,
      promoHpp,
      promoPrice,
      promoProfit,
      promoMargin,
      discountAmount,
      discountType,
      discountValue,
      marginImpact,
      isMarginPositive: promoMargin > 0,
      recipeName: recipe.namaResep,
      maxDiscount
    };
  },

  // Calculate bundle impact
  calculateBundle: (bundleItems, bundlePrice, recipes) => {
    if (!bundleItems || bundleItems.length < 2) {
      throw new Error('Bundle minimal harus memiliki 2 resep');
    }

    if (!bundlePrice || bundlePrice <= 0) {
      throw new Error('Harga bundle harus lebih dari 0');
    }

    let totalNormalHpp = 0;
    let totalNormalPrice = 0;
    const items = [];

    // Calculate totals for all items in bundle
    bundleItems.forEach((item, index) => {
      const recipe = recipes.find(r => r.id === item.resepId);
      if (!recipe) {
        throw new Error(`Resep untuk item ke-${index + 1} tidak ditemukan`);
      }

      const itemHpp = recipe.hppPerPorsi * item.quantity;
      const itemPrice = recipe.hargaJualPorsi * item.quantity;

      totalNormalHpp += itemHpp;
      totalNormalPrice += itemPrice;

      items.push({
        name: recipe.namaResep,
        quantity: item.quantity,
        hpp: itemHpp,
        normalPrice: itemPrice,
        recipe
      });
    });

    const normalProfit = totalNormalPrice - totalNormalHpp;
    const normalMargin = totalNormalPrice > 0 ? (normalProfit / totalNormalPrice) * 100 : 0;

    const promoHpp = totalNormalHpp; // HPP doesn't change
    const promoPrice = bundlePrice;
    const promoProfit = promoPrice - promoHpp;
    const promoMargin = promoPrice > 0 ? (promoProfit / promoPrice) * 100 : 0;

    const savings = totalNormalPrice - bundlePrice;
    const savingsPercent = totalNormalPrice > 0 ? (savings / totalNormalPrice) * 100 : 0;
    const marginImpact = promoMargin - normalMargin;

    return {
      normalHpp: totalNormalHpp,
      normalPrice: totalNormalPrice,
      normalProfit,
      normalMargin,
      promoHpp,
      promoPrice,
      promoProfit,
      promoMargin,
      savings,
      savingsPercent,
      marginImpact,
      isMarginPositive: promoMargin > 0,
      bundleItems: items,
      itemCount: bundleItems.length
    };
  },

  // Calculate profit warnings
  calculateWarnings: (calculationResult) => {
    const warnings = [];

    if (calculationResult.promoMargin < 0) {
      warnings.push({
        type: 'error',
        message: 'Margin negatif! Promo ini akan menyebabkan kerugian.',
        severity: 'high'
      });
    } else if (calculationResult.promoMargin < 10) {
      warnings.push({
        type: 'warning',
        message: 'Margin sangat rendah. Pertimbangkan untuk menaikkan harga atau mengurangi diskon.',
        severity: 'medium'
      });
    }

    if (calculationResult.marginImpact < -20) {
      warnings.push({
        type: 'warning',
        message: 'Penurunan margin lebih dari 20%. Pastikan volume penjualan dapat mengkompensasi.',
        severity: 'medium'
      });
    }

    if (calculationResult.promoPrice < calculationResult.promoHpp) {
      warnings.push({
        type: 'error',
        message: 'Harga jual lebih rendah dari HPP!',
        severity: 'high'
      });
    }

    return warnings;
  },

  // Calculate breakeven analysis
  calculateBreakeven: (calculationResult) => {
    if (!calculationResult.normalProfit || calculationResult.normalProfit <= 0) {
      return null;
    }

    const profitLoss = calculationResult.normalProfit - calculationResult.promoProfit;
    
    if (profitLoss <= 0) {
      return {
        additionalSalesNeeded: 0,
        message: 'Promo ini tidak mengurangi profit per unit'
      };
    }

    // Calculate additional sales needed to cover profit loss
    const additionalSalesNeeded = Math.ceil(profitLoss / calculationResult.promoProfit);
    
    return {
      additionalSalesNeeded,
      profitLoss,
      message: `Butuh ${additionalSalesNeeded} penjualan tambahan untuk menutupi penurunan profit`
    };
  }
};