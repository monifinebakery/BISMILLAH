// src/components/recipe/components/RecipeForm/CostCalculationStep/components/ResultsCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, BarChart3, TrendingUp, Zap, Package, Utensils } from 'lucide-react';
import { formatCurrency, formatPercentage, getProfitabilityColors, getProfitabilityLabel, getProfitabilityRecommendations } from '../utils/formatters';
import type { CostBreakdown, ProfitAnalysis, OverheadCalculation } from '../utils/types';

interface ResultsCardProps {
  costBreakdown: CostBreakdown;
  profitAnalysis: ProfitAnalysis;
  jumlahPorsi: number;
  jumlahPcsPerPorsi: number;
  marginKeuntunganPersen: number;
  isUsingAutoOverhead?: boolean;
  overheadCalculation?: OverheadCalculation | null;
}

export const ResultsCard: React.FC<ResultsCardProps> = ({
  costBreakdown,
  profitAnalysis,
  jumlahPorsi,
  jumlahPcsPerPorsi,
  marginKeuntunganPersen,
  isUsingAutoOverhead = false,
  overheadCalculation,
}) => {
  const profitabilityColors = getProfitabilityColors(profitAnalysis.profitabilityLevel);
  const profitabilityLabel = getProfitabilityLabel(profitAnalysis.profitabilityLevel);
  const recommendations = getProfitabilityRecommendations(profitAnalysis.profitabilityLevel);

  // ✅ Calculate totals for better context
  const totalPieces = jumlahPorsi * jumlahPcsPerPorsi;
  const showPerPcsData = jumlahPcsPerPorsi > 1;

  return (
    <div className="space-y-6">
      
      {/* HPP Summary */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Hasil Kalkulasi HPP
            {/* ✅ NEW: Show total production info */}
            {showPerPcsData && (
              <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                {jumlahPorsi} porsi × {jumlahPcsPerPorsi} pcs = {totalPieces} pcs
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Total Production Cost Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Biaya Bahan:</span>
              <span className="font-medium text-purple-900">
                {formatCurrency(costBreakdown.ingredientCost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Biaya Tenaga Kerja:</span>
              <span className="font-medium text-purple-900">
                {formatCurrency(costBreakdown.laborCost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700 flex items-center gap-1">
                Biaya Overhead:
                {isUsingAutoOverhead && (
                  <Zap className="h-3 w-3 text-green-600" title="Auto-calculated" />
                )}
              </span>
              <span className="font-medium text-purple-900">
                {formatCurrency(costBreakdown.overheadCost)}
              </span>
            </div>
            <div className="border-t border-purple-200 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-purple-800">Total HPP:</span>
                <Badge className="bg-purple-200 text-purple-900 border-purple-300">
                  {formatCurrency(costBreakdown.totalProductionCost)}
                </Badge>
              </div>
            </div>
          </div>

          {/* ✅ ENHANCED: Per Unit Costs with Pcs Support */}
          <div className="grid grid-cols-1 gap-3">
            {/* Per Portion Cost */}
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-purple-900 flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  HPP per Porsi
                </h4>
                <Badge variant="outline" className="text-purple-700 border-purple-300">
                  {showPerPcsData ? `${jumlahPcsPerPorsi} pcs` : '1 unit'}
                </Badge>
              </div>
              <div className="text-xl font-bold text-purple-900 mb-1">
                {formatCurrency(costBreakdown.costPerPortion)}
              </div>
              <div className="text-xs text-purple-600">
                Biaya untuk membuat 1 porsi{showPerPcsData ? ` (${jumlahPcsPerPorsi} pieces)` : ''}
              </div>
            </div>

            {/* ✅ NEW: Per Piece Cost (conditional) */}
            {showPerPcsData && (
              <div className="bg-white rounded-lg p-3 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-purple-900 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    HPP per Pcs
                  </h4>
                  <Badge variant="outline" className="text-purple-700 border-purple-300">
                    1 pcs
                  </Badge>
                </div>
                <div className="text-xl font-bold text-purple-900 mb-1">
                  {formatCurrency(costBreakdown.costPerPiece)}
                </div>
                <div className="text-xs text-purple-600">
                  Biaya untuk membuat 1 piece (dari total {totalPieces} pcs)
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ✅ ENHANCED: Selling Price with Pcs Support */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Harga Jual Rekomendasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Margin Amount Summary */}
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-green-700">Total Margin Keuntungan:</span>
              <Badge className="bg-green-200 text-green-900 border-green-300">
                {formatCurrency(profitAnalysis.marginAmount)}
              </Badge>
            </div>
            <div className="text-xs text-green-600">
              {formatPercentage(marginKeuntunganPersen)} dari total HPP ({formatCurrency(costBreakdown.totalProductionCost)})
            </div>
            {showPerPcsData && (
              <div className="text-xs text-green-600 mt-1">
                Margin per pcs: {formatCurrency(profitAnalysis.marginAmount / totalPieces)}
              </div>
            )}
          </div>

          {/* ✅ ENHANCED: Selling Prices Grid */}
          <div className="grid grid-cols-1 gap-3">
            {/* Per Portion Selling Price */}
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-green-800 flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  Harga Jual per Porsi
                </h4>
                <Badge className="bg-green-100 text-green-800 border-green-300">
                  {showPerPcsData ? `${jumlahPcsPerPorsi} pcs` : '1 unit'}
                </Badge>
              </div>
              <div className="text-2xl font-bold text-green-900 mb-2">
                {formatCurrency(profitAnalysis.sellingPricePerPortion)}
              </div>
              <div className="text-xs text-green-600 space-y-1">
                <div className="flex justify-between">
                  <span>HPP per Porsi:</span>
                  <span className="font-medium">{formatCurrency(costBreakdown.costPerPortion)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Keuntungan:</span>
                  <span className="font-medium text-purple-700">{formatCurrency(profitAnalysis.profitPerPortion)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Margin:</span>
                  <span className="font-medium">{formatPercentage(marginKeuntunganPersen)}</span>
                </div>
              </div>
            </div>

            {/* ✅ NEW: Per Piece Selling Price (conditional) */}
            {showPerPcsData && (
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-green-800 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Harga Jual per Pcs
                  </h4>
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    1 pcs
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-green-900 mb-2">
                  {formatCurrency(profitAnalysis.sellingPricePerPiece)}
                </div>
                <div className="text-xs text-green-600 space-y-1">
                  <div className="flex justify-between">
                    <span>HPP per Pcs:</span>
                    <span className="font-medium">{formatCurrency(costBreakdown.costPerPiece)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Keuntungan:</span>
                    <span className="font-medium text-purple-700">{formatCurrency(profitAnalysis.profitPerPiece)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Margin:</span>
                    <span className="font-medium">{formatPercentage(marginKeuntunganPersen)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ✅ ENHANCED: Revenue Summary */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-500">
            <h4 className="font-medium text-gray-900 mb-3 text-sm">Ringkasan Revenue Potensi:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <div className="text-gray-600">Total Investasi:</div>
                <div className="font-bold text-gray-900">{formatCurrency(costBreakdown.totalProductionCost)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-gray-600">Revenue Jika Semua Terjual:</div>
                <div className="font-bold text-green-700">
                  {formatCurrency(profitAnalysis.sellingPricePerPortion * jumlahPorsi)}
                </div>
                {showPerPcsData && (
                  <div className="text-gray-500">
                    = {formatCurrency(profitAnalysis.sellingPricePerPiece)} × {totalPieces} pcs
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-gray-600">Total Profit:</div>
                <div className="font-bold text-purple-700">{formatCurrency(profitAnalysis.marginAmount)}</div>
                <div className="text-gray-500">{formatPercentage(marginKeuntunganPersen)} margin</div>
              </div>
            </div>
          </div>

          {/* ✅ NEW: Per-Unit Comparison Table (when pcs > 1) */}
          {showPerPcsData && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3 text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Perbandingan Penjualan
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-blue-200">
                      <th className="text-left py-2 text-blue-800">Unit</th>
                      <th className="text-right py-2 text-blue-800">HPP</th>
                      <th className="text-right py-2 text-blue-800">Harga Jual</th>
                      <th className="text-right py-2 text-blue-800">Profit</th>
                      <th className="text-right py-2 text-blue-800">Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-blue-100">
                      <td className="py-2 font-medium">Per Porsi ({jumlahPcsPerPorsi} pcs)</td>
                      <td className="text-right py-2">{formatCurrency(costBreakdown.costPerPortion)}</td>
                      <td className="text-right py-2 text-green-700 font-medium">{formatCurrency(profitAnalysis.sellingPricePerPortion)}</td>
                      <td className="text-right py-2 text-purple-700 font-medium">{formatCurrency(profitAnalysis.profitPerPortion)}</td>
                      <td className="text-right py-2">{formatPercentage(marginKeuntunganPersen)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Per Pcs</td>
                      <td className="text-right py-2">{formatCurrency(costBreakdown.costPerPiece)}</td>
                      <td className="text-right py-2 text-green-700 font-medium">{formatCurrency(profitAnalysis.sellingPricePerPiece)}</td>
                      <td className="text-right py-2 text-purple-700 font-medium">{formatCurrency(profitAnalysis.profitPerPiece)}</td>
                      <td className="text-right py-2">{formatPercentage(marginKeuntunganPersen)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                💡 <strong>Tips:</strong> Jual per porsi untuk margin lebih besar, atau per pcs untuk fleksibilitas pelanggan.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profitability Assessment - keeping existing */}
      <Card className={`border ${profitabilityColors.border} ${profitabilityColors.bg}`}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className={`h-5 w-5 ${
              profitAnalysis.profitabilityLevel === 'high' ? 'text-green-600' :
              profitAnalysis.profitabilityLevel === 'medium' ? 'text-yellow-600' :
              'text-red-600'
            }`} />
            Analisis Profitabilitas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            <Badge className={`text-lg px-4 py-2 ${profitabilityColors.badge}`}>
              {profitabilityLabel}
            </Badge>
            <p className="text-sm mt-2 text-gray-600">
              Margin {formatPercentage(marginKeuntunganPersen)}
              {showPerPcsData && (
                <span className="block text-xs text-gray-500 mt-1">
                  Berlaku untuk penjualan per porsi maupun per pcs
                </span>
              )}
            </p>
          </div>

          {/* Recommendations */}
          <div className={`p-3 rounded-lg border ${
            profitAnalysis.profitabilityLevel === 'high' ? 'bg-green-100 border-green-200' :
            profitAnalysis.profitabilityLevel === 'medium' ? 'bg-yellow-100 border-yellow-200' :
            'bg-red-100 border-red-200'
          }`}>
            <h4 className={`font-medium mb-2 ${
              profitAnalysis.profitabilityLevel === 'high' ? 'text-green-900' :
              profitAnalysis.profitabilityLevel === 'medium' ? 'text-yellow-900' :
              'text-red-900'
            }`}>
              Rekomendasi:
            </h4>
            <ul className={`text-sm space-y-1 ${
              profitAnalysis.profitabilityLevel === 'high' ? 'text-green-800' :
              profitAnalysis.profitabilityLevel === 'medium' ? 'text-yellow-800' :
              'text-red-800'
            }`}>
              {recommendations.map((recommendation, index) => (
                <li key={index}>• {recommendation}</li>
              ))}
              {/* ✅ NEW: Per-pcs specific recommendations */}
              {showPerPcsData && (
                <li>• Pertimbangkan strategi penjualan campuran (per porsi + per pcs) untuk maksimalkan revenue.</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; // <-- Penutup fungsi dan komponen

// Pastikan file berakhir dengan baris baru (tidak masalah jika tidak, tapi disarankan)