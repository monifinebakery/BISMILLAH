// src/components/recipe/components/RecipeForm/CostCalculationStep/components/ResultsCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, BarChart3, TrendingUp, Zap } from 'lucide-react';
import { 
  formatCurrency, 
  formatPercentage, 
  getProfitabilityColors, 
  getProfitabilityLabel, 
  getProfitabilityRecommendations 
} from '../utils/formatters';
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
  // ✅ SAFE: Handle potential undefined values
  const safeMarginPersen = marginKeuntunganPersen || 0;
  const safeProfitabilityLevel = profitAnalysis?.profitabilityLevel || 'low';
  
  const profitabilityColors = getProfitabilityColors(safeProfitabilityLevel);
  const profitabilityLabel = getProfitabilityLabel(safeProfitabilityLevel);
  const recommendations = getProfitabilityRecommendations(safeProfitabilityLevel);

  // ✅ SAFE: Validate data before rendering
  if (!costBreakdown || !profitAnalysis) {
    return (
      <div className="space-y-6">
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <p>Data kalkulasi tidak tersedia</p>
              <p className="text-sm">Lengkapi form untuk melihat hasil perhitungan</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                {formatCurrency(costBreakdown.ingredientCost || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-purple-700">Biaya Tenaga Kerja:</span>
              <span className="font-medium text-purple-900">
                {formatCurrency(costBreakdown.laborCost || 0)}
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
                {formatCurrency(costBreakdown.overheadCost || 0)}
              </span>
            </div>
            
            {/* ✅ ADDED: Overhead percentage info if auto-calculated */}
            {isUsingAutoOverhead && overheadCalculation && (
              <div className="text-xs text-gray-600">Markup</div>
            </div>
          </div>

          {/* Recommendations */}
          <div className={`p-3 rounded-lg border ${
            safeProfitabilityLevel === 'high' ? 'bg-green-100 border-green-200' :
            safeProfitabilityLevel === 'medium' ? 'bg-yellow-100 border-yellow-200' :
            'bg-red-100 border-red-200'
          }`}>
            <h4 className={`font-medium mb-2 ${
              safeProfitabilityLevel === 'high' ? 'text-green-900' :
              safeProfitabilityLevel === 'medium' ? 'text-yellow-900' :
              'text-red-900'
            }`}>
              Rekomendasi:
            </h4>
            <ul className={`text-sm space-y-1 ${
              safeProfitabilityLevel === 'high' ? 'text-green-800' :
              safeProfitabilityLevel === 'medium' ? 'text-yellow-800' :
              'text-red-800'
            }`}>
              {recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-xs mt-1">•</span>
                  <span>{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ✅ ADDED: Market positioning insights */}
          <div className="mt-4 bg-white rounded-lg p-3 border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Posisi Pasar</h4>
            <div className="text-sm text-gray-600 space-y-1">
              {(() => {
                const marginPersen = safeMarginPersen;
                if (marginPersen >= 50) {
                  return (
                    <>
                      <p>🎯 <strong>Premium Segment:</strong> Produk dengan margin tinggi, cocok untuk pasar premium</p>
                      <p>💡 Fokus pada kualitas dan branding yang kuat</p>
                    </>
                  );
                } else if (marginPersen >= 25) {
                  return (
                    <>
                      <p>🎯 <strong>Mid-Market:</strong> Margin sehat untuk kompetisi menengah</p>
                      <p>💡 Balance antara kualitas dan harga kompetitif</p>
                    </>
                  );
                } else if (marginPersen >= 15) {
                  return (
                    <>
                      <p>🎯 <strong>Mass Market:</strong> Margin minimal untuk volume tinggi</p>
                      <p>💡 Fokus pada efisiensi operasional dan volume penjualan</p>
                    </>
                  );
                } else {
                  return (
                    <>
                      <p>⚠️ <strong>Risk Zone:</strong> Margin sangat rendah, sulit untuk sustainable</p>
                      <p>💡 Perlu review strategi pricing atau cost reduction</p>
                    </>
                  );
                }
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ ADDED: Additional insights card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Insight Tambahan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          
          {/* Unit economics */}
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Unit Economics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Cost per serving:</span>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(costBreakdown.costPerPortion || 0)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Revenue per serving:</span>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(profitAnalysis.sellingPricePerPortion || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Batch economics */}
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Ekonomi per Batch</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total batch cost:</span>
                <span className="font-semibold">
                  {formatCurrency((costBreakdown.totalProductionCost || 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total batch revenue:</span>
                <span className="font-semibold">
                  {formatCurrency((profitAnalysis.sellingPricePerPortion || 0) * jumlahPorsi)}
                </span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-2">
                <span className="text-gray-600">Total batch profit:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(((profitAnalysis.sellingPricePerPortion || 0) * jumlahPorsi) - (costBreakdown.totalProductionCost || 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Quick tips */}
          <div className="bg-blue-100 rounded-lg p-3 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">💡 Tips Optimasi</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Review harga bahan baku secara berkala</li>
              <li>• Pertimbangkan pembelian dalam jumlah besar untuk diskon</li>
              <li>• Monitor kompetitor untuk benchmark pricing</li>
              <li>• Track actual vs planned costs untuk akurasi</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};-purple-600 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Auto-calculated: {formatPercentage(overheadCalculation.percentage || 10)} dari biaya bahan + tenaga kerja
              </div>
            )}
            
            <div className="border-t border-purple-200 pt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-purple-800">Total HPP:</span>
                <Badge className="bg-purple-200 text-purple-900 border-purple-300">
                  {formatCurrency(costBreakdown.totalProductionCost || 0)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Per Unit Costs */}
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <h4 className="font-medium text-purple-900 mb-2">HPP per Unit</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Per Porsi:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(costBreakdown.costPerPortion || 0)}
                </span>
              </div>
              {jumlahPcsPerPorsi > 1 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Per Pcs:</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(costBreakdown.costPerPiece || 0)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ✅ ADDED: Cost breakdown percentage */}
          <div className="bg-white rounded-lg p-3 border border-purple-200">
            <h4 className="font-medium text-purple-900 mb-2">Komposisi Biaya</h4>
            <div className="space-y-1">
              {(() => {
                const total = costBreakdown.totalProductionCost || 1; // Avoid division by zero
                const ingredientPercentage = ((costBreakdown.ingredientCost || 0) / total) * 100;
                const laborPercentage = ((costBreakdown.laborCost || 0) / total) * 100;
                const overheadPercentage = ((costBreakdown.overheadCost || 0) / total) * 100;
                
                return (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Bahan:</span>
                      <span className="text-gray-800">{formatPercentage(ingredientPercentage)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Tenaga Kerja:</span>
                      <span className="text-gray-800">{formatPercentage(laborPercentage)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Overhead:</span>
                      <span className="text-gray-800">{formatPercentage(overheadPercentage)}</span>
                    </div>
                  </>
                );
              })()}
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
                {formatCurrency(profitAnalysis.marginAmount || 0)}
              </Badge>
            </div>
            <div className="text-xs text-green-600">
              {formatPercentage(safeMarginPersen)} dari total HPP
            </div>
          </div>

          {/* Selling Prices */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-green-800">Harga Jual per Porsi:</span>
              </div>
              <div className="text-xl font-bold text-green-900">
                {formatCurrency(profitAnalysis.sellingPricePerPortion || 0)}
              </div>
              <div className="text-xs text-green-600">
                Keuntungan: {formatCurrency(profitAnalysis.profitPerPortion || 0)}
              </div>
            </div>

            {jumlahPcsPerPorsi > 1 && (
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-green-800">Harga Jual per Pcs:</span>
                </div>
                <div className="text-xl font-bold text-green-900">
                  {formatCurrency(profitAnalysis.sellingPricePerPiece || 0)}
                </div>
                <div className="text-xs text-green-600">
                  Keuntungan: {formatCurrency(profitAnalysis.profitPerPiece || 0)}
                </div>
              </div>
            )}
          </div>

          {/* ✅ ADDED: Break-even analysis */}
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">Break-even Analysis</h4>
            <div className="text-xs text-green-600 space-y-1">
              <div>Harga minimum (break-even): {formatCurrency(costBreakdown.costPerPortion || 0)}</div>
              <div>Margin di atas break-even: {formatCurrency((profitAnalysis.sellingPricePerPortion || 0) - (costBreakdown.costPerPortion || 0))}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profitability Assessment */}
      <Card className={`border-2 ${profitabilityColors.border} ${profitabilityColors.bg}`}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className={`h-5 w-5 ${
              safeProfitabilityLevel === 'high' ? 'text-green-600' :
              safeProfitabilityLevel === 'medium' ? 'text-yellow-600' :
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
              Margin {formatPercentage(safeMarginPersen)}
            </p>
          </div>

          {/* ✅ IMPROVED: Enhanced profitability metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {formatPercentage(((profitAnalysis.marginAmount || 0) / (profitAnalysis.sellingPricePerPortion || 1)) * 100)}
              </div>
              <div className="text-xs text-gray-600">Profit Margin</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {formatPercentage(((profitAnalysis.sellingPricePerPortion || 0) / (costBreakdown.costPerPortion || 1) - 1) * 100)}
              </div>
              <div className="text-xs text