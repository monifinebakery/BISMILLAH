// src/components/recipe/components/RecipeForm/CostCalculationStep/components/ResultsCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, BarChart3, TrendingUp, Zap } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      
      {/* HPP Summary */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Hasil Kalkulasi HPP
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Total Production Cost */}
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

          {/* Per Unit Costs */}
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <h4 className="font-medium text-purple-900 mb-2">HPP per Unit</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">HPP per Porsi:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(costBreakdown.costPerPortion)}
                </span>
              </div>
              {jumlahPcsPerPorsi > 1 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">HPP per Pcs:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(costBreakdown.costPerPiece)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selling Price */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Harga Jual Rekomendasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Margin Amount */}
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-green-700">Margin Keuntungan:</span>
              <Badge className="bg-green-200 text-green-900 border-green-300">
                {formatCurrency(profitAnalysis.marginAmount)}
              </Badge>
            </div>
            <div className="text-xs text-green-600">
              {formatPercentage(marginKeuntunganPersen)} dari total HPP
            </div>
          </div>

          {/* Selling Prices */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-green-800">Harga Jual per Porsi:</span>
              </div>
              <div className="text-xl font-bold text-green-900">
                {formatCurrency(profitAnalysis.sellingPricePerPortion)}
              </div>
              <div className="text-xs text-green-600 space-y-1">
                <div>HPP per Porsi: {formatCurrency(costBreakdown.costPerPortion)}</div>
                <div>Keuntungan: {formatCurrency(profitAnalysis.profitPerPortion)}</div>
              </div>
            </div>

            {jumlahPcsPerPorsi > 1 && (
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-green-800">Harga Jual per Pcs:</span>
                </div>
                <div className="text-xl font-bold text-green-900">
                  {formatCurrency(profitAnalysis.sellingPricePerPiece)}
                </div>
                <div className="text-xs text-green-600 space-y-1">
                  <div>HPP per Pcs: {formatCurrency(costBreakdown.costPerPiece)}</div>
                  <div>Keuntungan: {formatCurrency(profitAnalysis.profitPerPiece)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Summary Per Unit Breakdown */}
          {jumlahPcsPerPorsi > 1 && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2 text-sm">Ringkasan Unit:</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="text-gray-600">Per Porsi ({jumlahPcsPerPorsi} pcs):</div>
                  <div className="font-medium">HPP: {formatCurrency(costBreakdown.costPerPortion)}</div>
                  <div className="font-medium">Jual: {formatCurrency(profitAnalysis.sellingPricePerPortion)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-gray-600">Per Pcs:</div>
                  <div className="font-medium">HPP: {formatCurrency(costBreakdown.costPerPiece)}</div>
                  <div className="font-medium">Jual: {formatCurrency(profitAnalysis.sellingPricePerPiece)}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profitability Assessment */}
      <Card className={`border-2 ${profitabilityColors.border} ${profitabilityColors.bg}`}>
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
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};