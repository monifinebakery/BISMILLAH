// src/components/recipe/hooks/useRecipeStats.ts

import { useMemo } from 'react';
import { calculateRecipeStats } from '../services/recipeUtils';
import type { Recipe, RecipeStats } from '../types';

interface UseRecipeStatsProps {
  recipes: Recipe[];
}

export const useRecipeStats = ({ recipes }: UseRecipeStatsProps) => {
  // Calculate comprehensive statistics
  const stats = useMemo(() => {
    return calculateRecipeStats(recipes);
  }, [recipes]);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    const recipesWithProfit = recipes.filter(r => r.margin_keuntungan_persen > 0);
    
    return {
      profitableRecipes: recipesWithProfit.length,
      profitablePercentage: recipes.length > 0 
        ? (recipesWithProfit.length / recipes.length) * 100 
        : 0,
      averageMargin: recipesWithProfit.length > 0
        ? recipesWithProfit.reduce((sum, r) => sum + r.margin_keuntungan_persen, 0) / recipesWithProfit.length
        : 0,
      totalPotentialRevenue: recipes.reduce((sum, r) => sum + (r.harga_jual_porsi * r.jumlah_porsi), 0),
      totalCost: recipes.reduce((sum, r) => sum + r.total_hpp, 0),
    };
  }, [recipes]);

  // Category insights
  const categoryInsights = useMemo(() => {
    const insights = Object.entries(stats.categoriesDistribution).map(([category, count]) => {
      const categoryRecipes = recipes.filter(r => r.kategori_resep === category);
      const avgHpp = categoryRecipes.length > 0
        ? categoryRecipes.reduce((sum, r) => sum + r.hpp_per_porsi, 0) / categoryRecipes.length
        : 0;
      const avgMargin = categoryRecipes.length > 0
        ? categoryRecipes.reduce((sum, r) => sum + r.margin_keuntungan_persen, 0) / categoryRecipes.length
        : 0;

      return {
        category,
        count,
        percentage: (count / stats.totalRecipes) * 100,
        averageHpp: avgHpp,
        averageMargin: avgMargin,
        recipes: categoryRecipes,
      };
    });

    return insights.sort((a, b) => b.count - a.count);
  }, [recipes, stats]);

  // Cost analysis
  const costAnalysis = useMemo(() => {
    const recipesWithCost = recipes.filter(r => r.total_hpp > 0);
    
    if (recipesWithCost.length === 0) {
      return {
        totalCost: 0,
        averageCost: 0,
        medianCost: 0,
        costDistribution: { low: 0, medium: 0, high: 0 },
        costTrend: 'stable' as const,
      };
    }

    const costs = recipesWithCost.map(r => r.hpp_per_porsi).sort((a, b) => a - b);
    const totalCost = costs.reduce((sum, cost) => sum + cost, 0);
    const averageCost = totalCost / costs.length;
    const medianCost = costs[Math.floor(costs.length / 2)];

    // Cost distribution based on average
    const lowThreshold = averageCost * 0.7;
    const highThreshold = averageCost * 1.3;
    
    const costDistribution = recipesWithCost.reduce(
      (acc, recipe) => {
        const cost = recipe.hpp_per_porsi;
        if (cost < lowThreshold) acc.low++;
        else if (cost > highThreshold) acc.high++;
        else acc.medium++;
        return acc;
      },
      { low: 0, medium: 0, high: 0 }
    );

    // Simple trend analysis (comparing first half vs second half)
    const halfPoint = Math.floor(recipesWithCost.length / 2);
    const firstHalfAvg = recipesWithCost
      .slice(0, halfPoint)
      .reduce((sum, r) => sum + r.hpp_per_porsi, 0) / halfPoint;
    const secondHalfAvg = recipesWithCost
      .slice(halfPoint)
      .reduce((sum, r) => sum + r.hpp_per_porsi, 0) / (recipesWithCost.length - halfPoint);
    
    const costTrend = secondHalfAvg > firstHalfAvg * 1.1 ? 'increasing' :
                     secondHalfAvg < firstHalfAvg * 0.9 ? 'decreasing' : 'stable';

    return {
      totalCost,
      averageCost,
      medianCost,
      costDistribution,
      costTrend,
    };
  }, [recipes]);

  // Profitability insights
  const profitabilityInsights = useMemo(() => {
    const { high, medium, low } = stats.profitabilityStats;
    const total = high + medium + low;
    
    return {
      distribution: {
        high: { count: high, percentage: total > 0 ? (high / total) * 100 : 0 },
        medium: { count: medium, percentage: total > 0 ? (medium / total) * 100 : 0 },
        low: { count: low, percentage: total > 0 ? (low / total) * 100 : 0 },
      },
      topPerformers: recipes
        .filter(r => r.margin_keuntungan_persen >= 30)
        .sort((a, b) => b.margin_keuntungan_persen - a.margin_keuntungan_persen)
        .slice(0, 5),
      needsImprovement: recipes
        .filter(r => r.margin_keuntungan_persen < 15)
        .sort((a, b) => a.margin_keuntungan_persen - b.margin_keuntungan_persen)
        .slice(0, 5),
    };
  }, [recipes, stats.profitabilityStats]);

  // Ingredient insights
  const ingredientInsights = useMemo(() => {
    const allIngredients = recipes.flatMap(r => r.bahan_resep);
    const ingredientFrequency = allIngredients.reduce((acc, ingredient) => {
      acc[ingredient.nama] = (acc[ingredient.nama] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostUsedIngredients = Object.entries(ingredientFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const totalIngredientCost = allIngredients.reduce((sum, ing) => sum + ing.total_harga, 0);
    const averageIngredientCost = allIngredients.length > 0 ? totalIngredientCost / allIngredients.length : 0;

    return {
      totalUniqueIngredients: Object.keys(ingredientFrequency).length,
      mostUsedIngredients,
      averageIngredientCost,
      totalIngredientCost,
    };
  }, [recipes]);

  // Growth metrics (based on creation dates)
  const growthMetrics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentRecipes = recipes.filter(r => {
      const createdAt = new Date(r.created_at);
      return createdAt instanceof Date && !isNaN(createdAt.getTime()) && createdAt >= thirtyDaysAgo;
    });
    const thisWeekRecipes = recipes.filter(r => {
      const createdAt = new Date(r.created_at);
      return createdAt instanceof Date && !isNaN(createdAt.getTime()) && createdAt >= sevenDaysAgo;
    });

    return {
      totalRecipes: recipes.length,
      recentRecipes: recentRecipes.length,
      thisWeekRecipes: thisWeekRecipes.length,
      growthRate: recipes.length > 0 ? (recentRecipes.length / recipes.length) * 100 : 0,
      weeklyGrowthRate: recipes.length > 0 ? (thisWeekRecipes.length / recipes.length) * 100 : 0,
    };
  }, [recipes]);

  // Get recipe recommendations based on stats
  const getRecommendations = () => {
    const recommendations: string[] = [];

    // Profitability recommendations
    if (profitabilityInsights.distribution.low.percentage > 50) {
      recommendations.push('Banyak resep dengan margin rendah. Pertimbangkan untuk menaikkan harga jual atau mengurangi biaya.');
    }

    // Cost recommendations
    if (costAnalysis.costTrend === 'increasing') {
      recommendations.push('Biaya resep cenderung meningkat. Review supplier dan cari alternatif bahan yang lebih ekonomis.');
    }

    // Category recommendations
    if (stats.totalCategories < 3) {
      recommendations.push('Diversifikasi menu dengan menambah kategori resep baru untuk menarik lebih banyak pelanggan.');
    }

    // Volume recommendations
    if (stats.totalRecipes < 10) {
      recommendations.push('Tambahkan lebih banyak resep untuk memberikan variasi yang lebih luas kepada pelanggan.');
    }

    return recommendations;
  };

  // Export summary for reports
  const getStatsSummary = () => {
    return {
      overview: {
        totalRecipes: stats.totalRecipes,
        totalCategories: stats.totalCategories,
        averageHppPerPorsi: stats.average_hpp_per_porsi,
      },
      performance: performanceMetrics,
      costs: costAnalysis,
      profitability: profitabilityInsights,
      ingredients: ingredientInsights,
      growth: growthMetrics,
      recommendations: getRecommendations(),
    };
  };

  return {
    // Basic stats
    stats,
    
    // Detailed insights
    performanceMetrics,
    categoryInsights,
    costAnalysis,
    profitabilityInsights,
    ingredientInsights,
    growthMetrics,
    
    // Utilities
    getRecommendations,
    getStatsSummary,
  };
};