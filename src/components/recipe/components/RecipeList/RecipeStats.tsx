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

  // Konfigurasi kartu statistik utama
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
      title: 'Rata-rata Profitabilitas',
      value: formatPercentage(performanceMetrics.averageMargin),
      subtitle: `${performanceMetrics.profitableRecipes} resep menguntungkan`,
      icon: TrendingUp,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Potensi Revenue',
      value: formatCurrency(performanceMetrics.totalPotentialRevenue),
      subtitle: `Total Biaya: ${formatCurrency(performanceMetrics.totalCost)}`,
      icon: BarChart3,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

  // Konfigurasi indikator tren biaya
  const getTrendIndicator = (trend: 'increasing' | 'decreasing' | 'stable') => {
    switch (trend) {
      case 'increasing':
        return { icon: TrendingUp, color: 'text-red-500', text: 'Biaya Meningkat' };
      case 'decreasing':
        return { icon: TrendingDown, color: 'text-green-500', text: 'Biaya Menurun' };
      default:
        return { icon: Target, color: 'text-blue-500', text: 'Biaya Stabil' };
    }
  };

  const trendIndicator = getTrendIndicator(costAnalysis.costTrend);

  // Kalkulasi persentase profitabilitas dengan aman
  const calculatePercentage = (value: number, total: number): number => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  const highPercentage = calculatePercentage(basicStats.profitabilityStats.high, basicStats.totalRecipes);
  const mediumPercentage = calculatePercentage(basicStats.profitabilityStats.medium, basicStats.totalRecipes);
  const lowPercentage = calculatePercentage(basicStats.profitabilityStats.low, basicStats.totalRecipes);

  return (
    <div className="space-y-6">
      {/* Grid Statistik Utama */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const CardIcon = card.icon;
          return (
            <Card key={card.title} className="border-0 shadow-md transition-shadow hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="mb-1 text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="mb-1 text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className="text-xs text-gray-500">{card.subtitle}</p>
                  </div>
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${card.bgColor}`}>
                    <CardIcon className={`h-6 w-6 ${card.textColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Wawasan Detail */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Rincian Profitabilitas */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold text-gray-900">Rincian Profitabilitas</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Tinggi (≥30%)', value: basicStats.profitabilityStats.high, percentage: highPercentage, color: 'bg-green-500' },
                { label: 'Sedang (15-29%)', value: basicStats.profitabilityStats.medium, percentage: mediumPercentage, color: 'bg-yellow-500' },
                { label: 'Rendah (<15%)', value: basicStats.profitabilityStats.low, percentage: lowPercentage, color: 'bg-red-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm text-gray-600">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{item.value}</span>
                    <span className="text-xs text-gray-500">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
                <div className="bg-green-500 transition-all duration-300" style={{ width: `${highPercentage}%` }} />
                <div className="bg-yellow-500 transition-all duration-300" style={{ width: `${mediumPercentage}%` }} />
                <div className="bg-red-500 transition-all duration-300" style={{ width: `${lowPercentage}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tren Biaya */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              {(() => {
                const TrendIcon = trendIndicator.icon;
                return <TrendIcon className={`h-5 w-5 ${trendIndicator.color}`} />;
              })()}
              <h3 className="font-semibold text-gray-900">Tren Biaya</h3>
            </div>
            <div className="text-center">
              <p className="mb-2 text-2xl font-bold text-gray-900">{formatCurrency(costAnalysis.averageCost)}</p>
              <p className="mb-4 text-sm text-gray-600">Rata-rata HPP per porsi</p>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                costAnalysis.costTrend === 'increasing' ? 'bg-red-50 text-red-700' :
                costAnalysis.costTrend === 'decreasing' ? 'bg-green-50 text-green-700' :
                'bg-blue-50 text-blue-700'
              }`}>
                {(() => {
                  const TrendIcon = trendIndicator.icon;
                  return <TrendIcon className="h-4 w-4" />;
                })()}
                {trendIndicator.text}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performa Resep */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900">Performa Resep</h3>
            </div>
            <div className="space-y-4">
              {basicStats.mostExpensiveRecipe && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Termahal</p>
                  <p className="truncate text-sm font-medium text-gray-900">{basicStats.mostExpensiveRecipe.namaResep}</p>
                  <p className="text-sm text-red-600">{formatCurrency(basicStats.mostExpensiveRecipe.hppPerPorsi)}</p>
                </div>
              )}
              {basicStats.cheapestRecipe && (
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">Termurah</p>
                  <p className="truncate text-sm font-medium text-gray-900">{basicStats.cheapestRecipe.namaResep}</p>
                  <p className="text-sm text-green-600">{formatCurrency(basicStats.cheapestRecipe.hppPerPorsi)}</p>
                </div>
              )}
              {basicStats.profitabilityStats.low > basicStats.profitabilityStats.high && (
                <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <p className="text-xs font-medium text-yellow-800">Perhatian: Banyak resep berprofitabilitas rendah.</p>
                  </div>
                </div>
              )}
              {!basicStats.mostExpensiveRecipe && !basicStats.cheapestRecipe && basicStats.totalRecipes === 0 && (
                <div className="py-4 text-center">
                  <ChefHat className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500">Belum ada data resep</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrik Kinerja Tambahan */}
      {performanceMetrics.profitableRecipes > 0 && (
        <Card className="border-0 bg-gradient-to-r from-green-50 to-blue-50 shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Ringkasan Kinerja</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: 'Resep Menguntungkan', value: performanceMetrics.profitableRecipes, subtitle: `${formatPercentage(performanceMetrics.profitablePercentage)} dari total`, theme: 'green' },
                { title: 'Rata-rata Margin', value: formatPercentage(performanceMetrics.averageMargin), subtitle: 'Margin keuntungan', theme: 'blue' },
                { title: 'Total Potensi Revenue', value: formatCurrency(performanceMetrics.totalPotentialRevenue), subtitle: 'Revenue maksimal', theme: 'purple' },
                // PERBAIKAN: Pengecekan diubah ke totalPotentialRevenue > 0
              { title: 'Efisiensi Biaya', value: performanceMetrics.totalPotentialRevenue > 0 ? formatPercentage((performanceMetrics.totalCost / performanceMetrics.totalPotentialRevenue) * 100) : 'N/A', subtitle: 'Rasio biaya ke revenue', theme: 'orange' },
              ].map(metric => {
                const getMetricClasses = (theme: string) => {
                  const classMap = {
                    green: {
                      border: 'border-green-200',
                      text: 'text-green-600',
                      textBold: 'text-green-900',
                      textSubtle: 'text-green-700'
                    },
                    blue: {
                      border: 'border-blue-200', 
                      text: 'text-blue-600',
                      textBold: 'text-blue-900',
                      textSubtle: 'text-blue-700'
                    },
                    purple: {
                      border: 'border-purple-200',
                      text: 'text-purple-600', 
                      textBold: 'text-purple-900',
                      textSubtle: 'text-purple-700'
                    },
                    orange: {
                      border: 'border-orange-200',
                      text: 'text-orange-600',
                      textBold: 'text-orange-900', 
                      textSubtle: 'text-orange-700'
                    }
                  };
                  return classMap[theme as keyof typeof classMap] || classMap.green;
                };
                const classes = getMetricClasses(metric.theme);
                return (
                  <div key={metric.title} className={`rounded-lg border ${classes.border} bg-white p-4`}>
                    <p className={`mb-1 text-sm font-medium ${classes.text}`}>{metric.title}</p>
                    <p className={`text-2xl font-bold ${classes.textBold}`}>{metric.value}</p>
                    <p className={`text-xs ${classes.textSubtle}`}>{metric.subtitle}</p>
                  </div>
                );
              })
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecipeStats;