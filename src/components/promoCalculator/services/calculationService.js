// 🎯 Core calculation logic untuk setiap tipe promo

export const calculationService = {
  // BOGO Calculation
  calculateBogo: (data, recipes) => {
    const mainRecipe = recipes.find(r => r.id === data.resepUtama);
    const freeRecipe = recipes.find(r => r.id === data.resepGratis);
    
    if (!mainRecipe || !freeRecipe) {
      throw new Error('Resep tidak ditemukan');
    }

    // Normal: customer buys 1 main recipe at normal price
    const normalHpp = mainRecipe.hppPerPorsi;
    const normalPrice = mainRecipe.hargaJualPorsi;
    const normalProfit = normalPrice - normalHpp;
    const normalMargin = normalHpp > 0 ? (normalProfit / normalPrice) * 100 : 0;

    // BOGO: customer gets main + free recipe, pays only for main
    const promoHpp = mainRecipe.hppPerPorsi + freeRecipe.hppPerPorsi;
    const promoPrice = mainRecipe.hargaJualPorsi; // Customer pays normal price for main only
    const promoProfit = promoPrice - promoHpp;
    const promoMargin = promoPrice > 0 ? (promoProfit / promoPrice) * 100 : 0;

    return {
      type: 'bogo',
      normalHpp,
      normalPrice,
      normalProfit,
      normalMargin,
      promoHpp,
      promoPrice,
      promoProfit,
      promoMargin,
      effectiveDiscount: freeRecipe.hargaJualPorsi,
      mainRecipe: mainRecipe.namaResep,
      freeRecipe: freeRecipe.namaResep,
      minimalQty: data.minimalQty
    };
  },

  // Discount Calculation
  calculateDiscount: (data, recipes) => {
    const recipe = recipes.find(r => r.id === data.resep);
    
    if (!recipe) {
      throw new Error('Resep tidak ditemukan');
    }

    const normalHpp = recipe.hppPerPorsi;
    const normalPrice = recipe.hargaJualPorsi;
    const normalProfit = normalPrice - normalHpp;
    const normalMargin = normalHpp > 0 ? (normalProfit / normalPrice) * 100 : 0;

    // Calculate discount amount
    let discountAmount = 0;
    if (data.tipeDiskon === 'persentase') {
      discountAmount = (normalPrice * data.nilaiDiskon) / 100;
      // Apply maximum discount if specified
      if (data.maksimalDiskon && discountAmount > data.maksimalDiskon) {
        discountAmount = data.maksimalDiskon;
      }
    } else {
      discountAmount = data.nilaiDiskon;
    }

    const promoPrice = Math.max(0, normalPrice - discountAmount);
    const promoHpp = normalHpp; // HPP doesn't change
    const promoProfit = promoPrice - promoHpp;
    const promoMargin = promoPrice > 0 ? (promoProfit / promoPrice) * 100 : 0;

    return {
      type: 'discount',
      normalHpp,
      normalPrice,
      normalProfit,
      normalMargin,
      promoHpp,
      promoPrice,
      promoProfit,
      promoMargin,
      discountAmount,
      discountType: data.tipeDiskon,
      discountValue: data.nilaiDiskon,
      recipeName: recipe.namaResep,
      minimalPurchase: data.minimalPembelian || 0
    };
  },

  // Bundle Calculation
  calculateBundle: (data, recipes) => {
    if (!data.resepBundle || data.resepBundle.length < 2) {
      throw new Error('Bundle minimal harus memiliki 2 resep');
    }

    let totalNormalHpp = 0;
    let totalNormalPrice = 0;
    const bundleItems = [];

    // Calculate totals for all items in bundle
    data.resepBundle.forEach(item => {
      const recipe = recipes.find(r => r.id === item.resepId);
      if (!recipe) {
        throw new Error(`Resep dengan ID ${item.resepId} tidak ditemukan`);
      }

      const itemHpp = recipe.hppPerPorsi * item.quantity;
      const itemPrice = recipe.hargaJualPorsi * item.quantity;

      totalNormalHpp += itemHpp;
      totalNormalPrice += itemPrice;

      bundleItems.push({
        name: recipe.namaResep,
        quantity: item.quantity,
        hpp: itemHpp,
        normalPrice: itemPrice
      });
    });

    const bundlePrice = parseFloat(data.hargaBundle);
    const normalProfit = totalNormalPrice - totalNormalHpp;
    const normalMargin = totalNormalHpp > 0 ? (normalProfit / totalNormalPrice) * 100 : 0;

    const promoHpp = totalNormalHpp; // HPP doesn't change
    const promoPrice = bundlePrice;
    const promoProfit = promoPrice - promoHpp;
    const promoMargin = promoPrice > 0 ? (promoProfit / promoPrice) * 100 : 0;

    const savings = totalNormalPrice - bundlePrice;
    const savingsPercent = totalNormalPrice > 0 ? (savings / totalNormalPrice) * 100 : 0;

    return {
      type: 'bundle',
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
      bundleItems,
      itemCount: data.resepBundle.length
    };
  }
};