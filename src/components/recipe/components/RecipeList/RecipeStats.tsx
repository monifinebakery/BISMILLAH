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

// Define the props interface based on the hook structure
interface RecipeStatsProps {
  stats: {
    stats: {
      totalRecipes: number;
      totalCategories: number;
      averageHppPerPorsi: number;
      mostExpensiveRecipe: {
        namaResep: string;
        hppPerPorsi: number;
      } | null;
      cheapestRecipe: {
        namaResep: string;
        hppPerPorsi: number;
      } | null;
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

  // Main statistics cards configuration
  const statCards = [
    {
      title: 'Total Resep',
      value: basicStats.totalRecipes.toString(),
      subtitle: `${basicStats.totalCategories} kategori`,
      icon: ChefHat,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: 'Rata-rata HPP',
      value: formatCurrency(basicStats.averageHppPerPorsi),
      subtitle: 'per porsi',
      icon: DollarSign,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      title: 'Profitabilitas',
      value: formatPercentage(performanceMetrics.averageMargin),
      subtitle: `${performanceMetrics.profitableRecipes} resep menguntungkan`,
      icon: TrendingUp,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Potensi Revenue',
      value: formatCurrency(performanceMetrics.totalPotentialRevenue),
      subtitle: `Biaya: ${formatCurrency(performanceMetrics.totalCost)}`,
      icon: BarChart3,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

  // Get trend indicator configuration
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

  // Calculate profitability percentages safely
  const calculatePercentage = (value: number, total: number): number => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const highPercentage = calculatePercentage(basicStats.profitabilityStats.high, basicStats.totalRecipes);
  const mediumPercentage = calculatePercentage(basicStats.profitabilityStats.medium, basicStats.totalRecipes);
  const lowPercentage = calculatePercentage(basicStats.profitabilityStats.low, basicStats.totalRecipes);

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
                    ({highPercentage}%)
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
                    ({mediumPercentage}%)
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
                    ({lowPercentage}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 transition-all duration-300"
                  style={{ width: `${highPercentage}%` }}
                ></div>
                <div 
                  className="bg-yellow-500 transition-all duration-300"
                  style={{ width: `${mediumPercentage}%` }}
                ></div>
                <div 
                  className="bg-red-500 transition-all duration-300"
                  style={{ width: `${lowPercentage}%` }}
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

              {/* No data states */}
              {!basicStats.mostExpensiveRecipe && !basicStats.cheapestRecipe && basicStats.totalRecipes === 0 && (
                <div className="text-center py-4">
                  <ChefHat className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Belum ada data resep
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Performance Metrics */}
      {performanceMetrics.profitableRecipes > 0 && (
        <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Ringkasan Kinerja</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="text-sm text-green-600 font-medium mb-1">Resep Menguntungkan</p>
                <p className="text-2xl font-bold text-green-900">
                  {performanceMetrics.profitableRecipes}
                </p>
                <p className="text-xs text-green-700">
                  {formatPercentage(performanceMetrics.profitablePercentage)} dari total
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium mb-1">Rata-rata Margin</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatPercentage(performanceMetrics.averageMargin)}
                </p>
                <p className="text-xs text-blue-700">
                  Margin keuntungan
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-purple-200">
                <p className="text-sm text-purple-600 font-medium mb-1">Total Potensi</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(performanceMetrics.totalPotentialRevenue)}
                </p>
                <p className="text-xs text-purple-700">
                  Revenue maksimal
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-orange-200">
                <p className="text-sm text-orange-600 font-medium mb-1">Efisiensi Biaya</p>
                <p className="text-2xl font-bold text-orange-900">
                  {performanceMetrics.totalCost > 0 
                    ? formatPercentage((performanceMetrics.totalCost / performanceMetrics.totalPotentialRevenue) * 100)
                    : '0%'
                  }
                </p>
                <p className="text-xs text-orange-700">
                  Cost to revenue ratio
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecipeStats;