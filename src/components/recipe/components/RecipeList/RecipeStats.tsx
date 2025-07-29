// src/components/recipe/components/RecipeList/RecipeStats.tsx

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  ChefHat,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Target,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../services/recipeUtils';

interface RecipeStatsProps {
  stats: {
    stats: {
      totalRecipes: number;
      totalCategories: number;
      averageHppPerPorsi: number;
      mostExpensiveRecipe: any;
      cheapestRecipe: any;
      profitabilityStats: {
        high: number;
        medium: number;
        low: number;
      };
    };
    performanceMetrics: {
      profitableRecipes: number;
      profitablePercentage: number;
      averageMargin: number;
      totalPotentialRevenue: number;
      totalCost: number;
    };
    costAnalysis: {
      averageCost: number;
      costTrend: 'increasing' | 'decreasing' | 'stable';
    };
  };
}

const RecipeStats: React.FC<RecipeStatsProps> = ({ stats }) => {
  const { stats: basicStats, performanceMetrics, costAnalysis } = stats;

  const statCards = [
    {
      title: 'Total Resep',
      value: basicStats.totalRecipes.toString(),
      subtitle: `${basicStats.totalCategories} kategori`,
      icon: ChefHat,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Rata-rata HPP',
      value: formatCurrency(basicStats.averageHppPerPorsi),
      subtitle: 'per porsi',
      icon: DollarSign,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Profitabilitas',
      value: formatPercentage(performanceMetrics.averageMargin),
      subtitle: `${performanceMetrics.profitableRecipes} resep menguntungkan`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Potensi Revenue',
      value: formatCurrency(performanceMetrics.totalPotentialRevenue),
      subtitle: `Biaya: ${formatCurrency(performanceMetrics.totalCost)}`,
      icon: BarChart3,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

  // Get trend indicator
  const getTrendIndicator = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return {
          icon: TrendingUp,
          color: 'text-red-500',
          text: 'Biaya meningkat',
        };
      case 'decreasing':
        return {
          icon: TrendingDown,
          color: 'text-green-500',
          text: 'Biaya menurun',
        };
      default:
        return {
          icon: Target,
          color: 'text-blue-500',
          text: 'Biaya stabil',
        };
    }
  };

  const trendIndicator = getTrendIndicator(costAnalysis.costTrend);

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500">
                    {card.subtitle}
                  </p>
                </div>
                <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <card.icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profitability Breakdown */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">Profitabilitas</h3>
            </div>
            
            <div className="space-y-3">
              {/* High Profitability */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Tinggi (≥30%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{basicStats.profitabilityStats.high}</span>
                  <span className="text-xs text-gray-500">
                    ({basicStats.totalRecipes > 0 ? Math.round((basicStats.profitabilityStats.high / basicStats.totalRecipes) * 100) : 0}%)
                  </span>
                </div>
              </div>

              {/* Medium Profitability */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Sedang (15-29%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{basicStats.profitabilityStats.medium}</span>
                  <span className="text-xs text-gray-500">
                    ({basicStats.totalRecipes > 0 ? Math.round((basicStats.profitabilityStats.medium / basicStats.totalRecipes) * 100) : 0}%)
                  </span>
                </div>
              </div>

              {/* Low Profitability */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Rendah (<15%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{basicStats.profitabilityStats.low}</span>
                  <span className="text-xs text-gray-500">
                    ({basicStats.totalRecipes > 0 ? Math.round((basicStats.profitabilityStats.low / basicStats.totalRecipes) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 transition-all duration-300"
                  style={{ 
                    width: basicStats.totalRecipes > 0 
                      ? `${(basicStats.profitabilityStats.high / basicStats.totalRecipes) * 100}%` 
                      : '0%' 
                  }}
                ></div>
                <div 
                  className="bg-yellow-500 transition-all duration-300"
                  style={{ 
                    width: basicStats.totalRecipes > 0 
                      ? `${(basicStats.profitabilityStats.medium / basicStats.totalRecipes) * 100}%` 
                      : '0%' 
                  }}
                ></div>
                <div 
                  className="bg-red-500 transition-all duration-300"
                  style={{ 
                    width: basicStats.totalRecipes > 0 
                      ? `${(basicStats.profitabilityStats.low / basicStats.totalRecipes) * 100}%` 
                      : '0%' 
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cost Trend */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <trendIndicator.icon className={`w-5 h-5 ${trendIndicator.color}`} />
              <h3 className="font-semibold text-gray-900">Tren Biaya</h3>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(costAnalysis.averageCost)}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Rata-rata HPP per porsi
              </p>
              
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                costAnalysis.costTrend === 'increasing' ? 'bg-red-50 text-red-700' :
                costAnalysis.costTrend === 'decreasing' ? 'bg-green-50 text-green-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                <trendIndicator.icon className="w-4 h-4" />
                {trendIndicator.text}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Performa Resep</h3>
            </div>
            
            <div className="space-y-4">
              {/* Most Expensive */}
              {basicStats.mostExpensiveRecipe && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Termahal
                  </p>
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {basicStats.mostExpensiveRecipe.namaResep}
                  </p>
                  <p className="text-sm text-red-600">
                    {formatCurrency(basicStats.mostExpensiveRecipe.hppPerPorsi)}
                  </p>
                </div>
              )}

              {/* Cheapest */}
              {basicStats.cheapestRecipe && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Termurah
                  </p>
                  <p className="font-medium text-gray-900 text-sm truncate">
                    {basicStats.cheapestRecipe.namaResep}
                  </p>
                  <p className="text-sm text-green-600">
                    {formatCurrency(basicStats.cheapestRecipe.hppPerPorsi)}
                  </p>
                </div>
              )}

              {/* Alert for low profitability */}
              {basicStats.profitabilityStats.low > basicStats.profitabilityStats.high && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <p className="text-xs text-yellow-800 font-medium">
                      Perhatian: Banyak resep dengan profitabilitas rendah
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RecipeStats;