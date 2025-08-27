// public/workers/hppCalculator.worker.js
// Web Worker untuk kalkulasi HPP yang kompleks

self.onmessage = function(e) {
  const { type, data } = e.data;

  try {
    switch (type) {
      case 'CALCULATE_HPP':
        const result = calculateHPP(data);
        self.postMessage({ type: 'HPP_CALCULATED', result });
        break;

      case 'BULK_HPP_CALCULATION':
        const bulkResults = calculateBulkHPP(data);
        self.postMessage({ type: 'BULK_HPP_CALCULATED', result: bulkResults });
        break;

      case 'OPTIMIZE_RECIPE_COSTS':
        const optimizedRecipes = optimizeRecipeCosts(data);
        self.postMessage({ type: 'RECIPE_COSTS_OPTIMIZED', result: optimizedRecipes });
        break;

      default:
        self.postMessage({ type: 'ERROR', error: 'Unknown operation type' });
    }
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message });
  }
};

// Fungsi kalkulasi HPP untuk satu resep
function calculateHPP(recipeData) {
  const { ingredients, portions, overheadPercentage = 0.15 } = recipeData;
  
  let totalCost = 0;
  const detailedCosts = [];

  // Kalkulasi biaya bahan
  for (const ingredient of ingredients) {
    const { nama_bahan, jumlah, satuan, harga_per_satuan } = ingredient;
    const cost = jumlah * harga_per_satuan;
    totalCost += cost;
    
    detailedCosts.push({
      nama_bahan,
      jumlah,
      satuan,
      harga_per_satuan,
      total_cost: cost
    });
  }

  // Tambahkan overhead
  const overheadCost = totalCost * overheadPercentage;
  const totalWithOverhead = totalCost + overheadCost;

  // HPP per porsi
  const hppPerPortion = totalWithOverhead / portions;

  return {
    total_ingredient_cost: totalCost,
    overhead_cost: overheadCost,
    total_cost: totalWithOverhead,
    hpp_per_portion: hppPerPortion,
    portions,
    detailed_costs: detailedCosts,
    calculated_at: new Date().toISOString()
  };
}

// Fungsi kalkulasi HPP untuk multiple resep
function calculateBulkHPP(recipesData) {
  const { recipes, globalOverhead = 0.15 } = recipesData;
  const results = [];
  
  let totalProcessed = 0;
  const totalRecipes = recipes.length;

  for (const recipe of recipes) {
    try {
      const hppResult = calculateHPP({
        ...recipe,
        overheadPercentage: globalOverhead
      });
      
      results.push({
        recipe_id: recipe.id,
        recipe_name: recipe.nama_resep,
        hpp_result: hppResult,
        status: 'success'
      });
    } catch (error) {
      results.push({
        recipe_id: recipe.id,
        recipe_name: recipe.nama_resep,
        error: error.message,
        status: 'error'
      });
    }
    
    totalProcessed++;
    
    // Kirim progress update setiap 10 resep
    if (totalProcessed % 10 === 0) {
      self.postMessage({
        type: 'PROGRESS_UPDATE',
        progress: {
          processed: totalProcessed,
          total: totalRecipes,
          percentage: Math.round((totalProcessed / totalRecipes) * 100)
        }
      });
    }
  }

  return {
    results,
    summary: {
      total_recipes: totalRecipes,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      total_cost: results
        .filter(r => r.status === 'success')
        .reduce((sum, r) => sum + r.hpp_result.total_cost, 0)
    }
  };
}

// Fungsi optimasi biaya resep
function optimizeRecipeCosts(optimizationData) {
  const { recipes, targetMargin = 0.30, maxPriceIncrease = 0.20 } = optimizationData;
  const optimizedRecipes = [];

  for (const recipe of recipes) {
    const currentHPP = calculateHPP(recipe);
    const currentSellingPrice = recipe.harga_jual || 0;
    const currentMargin = currentSellingPrice > 0 
      ? (currentSellingPrice - currentHPP.hpp_per_portion) / currentSellingPrice 
      : 0;

    // Hitung harga jual optimal
    const optimalPrice = currentHPP.hpp_per_portion / (1 - targetMargin);
    const maxAllowedPrice = currentSellingPrice * (1 + maxPriceIncrease);
    const recommendedPrice = Math.min(optimalPrice, maxAllowedPrice);
    
    // Analisis substitusi bahan
    const ingredientAnalysis = analyzeIngredientCosts(recipe.ingredients);
    
    optimizedRecipes.push({
      recipe_id: recipe.id,
      recipe_name: recipe.nama_resep,
      current_hpp: currentHPP.hpp_per_portion,
      current_price: currentSellingPrice,
      current_margin: currentMargin,
      recommended_price: recommendedPrice,
      optimal_price: optimalPrice,
      potential_savings: ingredientAnalysis.potential_savings,
      ingredient_recommendations: ingredientAnalysis.recommendations,
      price_adjustment_needed: recommendedPrice > currentSellingPrice,
      margin_improvement: (recommendedPrice - currentHPP.hpp_per_portion) / recommendedPrice
    });
  }

  return {
    optimized_recipes: optimizedRecipes,
    summary: {
      total_recipes: recipes.length,
      recipes_needing_price_adjustment: optimizedRecipes.filter(r => r.price_adjustment_needed).length,
      average_margin_improvement: optimizedRecipes.reduce((sum, r) => sum + r.margin_improvement, 0) / optimizedRecipes.length,
      total_potential_savings: optimizedRecipes.reduce((sum, r) => sum + r.potential_savings, 0)
    }
  };
}

// Analisis biaya bahan untuk optimasi
function analyzeIngredientCosts(ingredients) {
  const analysis = {
    total_cost: 0,
    potential_savings: 0,
    recommendations: []
  };

  const costThreshold = 0.1; // 10% dari total biaya
  const totalCost = ingredients.reduce((sum, ing) => sum + (ing.jumlah * ing.harga_per_satuan), 0);
  analysis.total_cost = totalCost;

  for (const ingredient of ingredients) {
    const ingredientCost = ingredient.jumlah * ingredient.harga_per_satuan;
    const costPercentage = ingredientCost / totalCost;

    // Identifikasi bahan dengan biaya tinggi
    if (costPercentage > costThreshold) {
      analysis.recommendations.push({
        ingredient_name: ingredient.nama_bahan,
        current_cost: ingredientCost,
        cost_percentage: costPercentage,
        recommendation: 'Pertimbangkan supplier alternatif atau substitusi bahan',
        priority: costPercentage > 0.25 ? 'high' : 'medium'
      });
      
      // Estimasi potensi penghematan (5-15% dari biaya bahan mahal)
      const potentialSaving = ingredientCost * (Math.random() * 0.1 + 0.05);
      analysis.potential_savings += potentialSaving;
    }
  }

  return analysis;
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount);
}

function roundToDecimal(number, decimals = 2) {
  return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
}