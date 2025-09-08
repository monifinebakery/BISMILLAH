// src/components/profitAnalysis/components/MobileProfitSummary.tsx
// Mobile-optimized profit summary for better touch interaction

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowRight,
  BarChart3,
  Target,
  Minus,
  Info
} from 'lucide-react';
import { RealTimeProfitCalculation } from '../types/profitAnalysis.types';
import { formatCurrency, formatPercentage } from '../utils/profitTransformers';
import { safeCalculateMargins } from '@/utils/profitValidation';

interface MobileProfitSummaryProps {
  currentAnalysis: RealTimeProfitCalculation | null;
  previousAnalysis?: RealTimeProfitCalculation | null;
  effectiveCogs?: number;
  isLoading?: boolean;
  onViewDetails?: () => void;
  className?: string;
}

const MobileProfitSummary: React.FC<MobileProfitSummaryProps> = ({
  currentAnalysis,
  previousAnalysis,
  effectiveCogs,
  isLoading = false,
  onViewDetails,
  className = ''
}) => {
  if (!currentAnalysis && !isLoading) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <BarChart3 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Data</h3>
        <p className="text-sm text-gray-500">
          Tambahkan transaksi penjualan untuk melihat analisis profit
        </p>
      </div>
    );
  }

  const revenue = currentAnalysis?.revenue_data?.total ?? 0;
  const cogs = effectiveCogs ?? currentAnalysis?.cogs_data?.total ?? 0;
  const opex = currentAnalysis?.opex_data?.total ?? 0;
  
  const margins = safeCalculateMargins(revenue, cogs, opex);
  
  // Calculate changes
  const prevRevenue = previousAnalysis?.revenue_data?.total ?? 0;
  const prevCogs = effectiveCogs ?? previousAnalysis?.cogs_data?.total ?? 0;
  const prevOpex = previousAnalysis?.opex_data?.total ?? 0;
  const prevMargins = safeCalculateMargins(prevRevenue, prevCogs, prevOpex);
  
  const revenueChange = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
  const profitChange = prevMargins.netProfit > 0 ? ((margins.netProfit - prevMargins.netProfit) / prevMargins.netProfit) * 100 : 0;
  
  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };
  
  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getProfitStatus = () => {
    if (margins.netProfit > 0) {
      return { 
        label: 'UNTUNG', 
        color: 'bg-green-500 text-white',
        emoji: '💰'
      };
    } else if (margins.netProfit < 0) {
      return { 
        label: 'RUGI', 
        color: 'bg-red-500 text-white',
        emoji: '📉'
      };
    } else {
      return { 
        label: 'IMPAS', 
        color: 'bg-gray-500 text-white',
        emoji: '⚖️'
      };
    }
  };

  const profitStatus = getProfitStatus();

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Profit Card - Large and prominent for mobile */}
      <Card className="relative overflow-hidden">
        <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-lg ${profitStatus.color}`}>
          <span className="text-xs font-bold">{profitStatus.emoji} {profitStatus.label}</span>
        </div>
        
        <CardHeader className="pb-3 pt-8">
          <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-orange-500" />
            Profit Bersih Bulan Ini
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`text-3xl font-bold mb-2 ${margins.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(margins.netProfit)}
            </div>
            <div className="text-sm text-gray-600">
              Margin: <span className="font-semibold">{formatPercentage(margins.netMargin)}</span>
            </div>
          </div>

          {/* Change indicator */}
          {previousAnalysis && (
            <div className="flex items-center justify-center gap-2 pt-2 border-t">
              {getChangeIcon(profitChange)}
              <span className={`text-sm font-medium ${getChangeColor(profitChange)}`}>
                {formatPercentage(Math.abs(profitChange))} vs bulan lalu
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue and Breakdown - Grid for mobile */}
      <div className="grid grid-cols-2 gap-3">
        {/* Revenue Card */}
        <Card className="relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              Penjualan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-800 mb-1">
              {formatCurrency(revenue)}
            </div>
            {previousAnalysis && (
              <div className="flex items-center gap-1">
                {getChangeIcon(revenueChange)}
                <span className={`text-xs ${getChangeColor(revenueChange)}`}>
                  {formatPercentage(Math.abs(revenueChange))}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* COGS Card */}
        <Card className="relative">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <Target className="w-4 h-4 text-orange-500" />
              Modal Bahan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-gray-800 mb-1">
              {formatCurrency(cogs)}
            </div>
            <div className="text-xs text-gray-500">
              {revenue > 0 ? formatPercentage((cogs / revenue) * 100) : '0%'} dari penjualan
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-gray-500 mb-1">Untung Kotor</div>
              <div className={`text-sm font-bold ${margins.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(margins.grossProfit)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Biaya Operasional</div>
              <div className="text-sm font-bold text-gray-800">
                {formatCurrency(opex)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Margin Bersih</div>
              <div className={`text-sm font-bold ${margins.netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(margins.netMargin)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      {onViewDetails && (
        <Button 
          onClick={onViewDetails} 
          className="w-full h-12 text-base font-semibold"
          variant="outline"
        >
          Lihat Detail Lengkap
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}

      {/* Mobile-specific tip */}
      <div className="text-xs text-gray-500 text-center bg-blue-50 border border-blue-200 rounded-lg p-3">
        <Info className="w-4 h-4 inline mr-1" />
        💡 Geser ke kiri/kanan pada grafik untuk melihat detail periode lain
      </div>
    </div>
  );
};

export default MobileProfitSummary;
