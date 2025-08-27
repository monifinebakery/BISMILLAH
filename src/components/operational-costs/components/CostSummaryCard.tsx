// src/components/operational-costs/components/CostSummaryCard.tsx

import React from 'react';
import { 
  DollarSign, 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Minus,
  ChartBar,
} from 'lucide-react';
import { CostSummary } from '../types';
import { formatCurrency, calculatePercentage } from '../utils/costHelpers';

interface CostSummaryCardProps {
  summary: CostSummary;
  loading?: boolean;
  className?: string;
  showBreakdown?: boolean;
  previousSummary?: CostSummary;
}

const CostSummaryCard: React.FC<CostSummaryCardProps> = ({
  summary,
  loading = false,
  className = '',
  showBreakdown = true,
  previousSummary,
}) => {
  // Calculate trend if previous data available
  const getTrend = () => {
    if (!previousSummary) return null;
    
    const currentTotal = summary.total_biaya_aktif;
    const previousTotal = previousSummary.total_biaya_aktif;
    const difference = currentTotal - previousTotal;
    const percentage = previousTotal > 0 ? Math.abs(difference / previousTotal) * 100 : 0;
    
    if (Math.abs(percentage) < 1) return null; // Only show significant changes
    
    return {
      type: difference > 0 ? 'increase' : 'decrease',
      percentage: percentage.toFixed(1),
      amount: Math.abs(difference),
    };
  };

  const trend = getTrend();

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 bg-gray-300 rounded w-1/3"></div>
            <div className="h-8 bg-gray-300 rounded-full w-8"></div>
          </div>
          <div className="h-8 bg-gray-300 rounded w-1/2 mb-6"></div>
          {showBreakdown && (
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Total Biaya Operasional</h3>
        <div className="p-2 bg-blue-50 rounded-full">
          <DollarSign className="h-6 w-6 text-blue-600" />
        </div>
      </div>

      {/* Main Amount */}
      <div className="mb-6">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {formatCurrency(summary.total_biaya_aktif)}
        </div>
        
        {/* Trend indicator */}
        {trend && (
          <div className={`flex items-center text-sm ${
            trend.type === 'increase' ? 'text-red-600' : 'text-green-600'
          }`}>
            {trend.type === 'increase' ? (
              <TrendingUp className="h-4 w-4 mr-1" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-1" />
            )}
            <span>
              {trend.type === 'increase' ? '+' : '-'}{trend.percentage}% 
              ({formatCurrency(trend.amount)})
            </span>
          </div>
        )}
        
        {/* Status info */}
        <div className="text-sm text-gray-500 mt-1">
          {summary.jumlah_biaya_aktif} biaya aktif
          {summary.jumlah_biaya_nonaktif > 0 && (
            <span>, {summary.jumlah_biaya_nonaktif} non-aktif</span>
          )}
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && (
        <div className="space-y-4">
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <ChartBar className="h-4 w-4 mr-2" />
              Rincian Biaya
            </h4>
            
            <div className="space-y-3">
              {/* Fixed Costs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Biaya Tetap</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(summary.total_biaya_tetap)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {calculatePercentage(
                      summary.total_biaya_tetap, 
                      summary.total_biaya_aktif
                    ).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Variable Costs */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-600">Biaya Variabel</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(summary.total_biaya_variabel)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {calculatePercentage(
                      summary.total_biaya_variabel, 
                      summary.total_biaya_aktif
                    ).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual breakdown bar */}
          {summary.total_biaya_aktif > 0 && (
            <div className="border-t pt-4">
              <div className="flex rounded-full overflow-hidden h-2 bg-gray-200">
                <div
                  className="bg-blue-500 transition-all duration-300"
                  style={{
                    width: `${calculatePercentage(
                      summary.total_biaya_tetap,
                      summary.total_biaya_aktif
                    )}%`,
                  }}
                ></div>
                <div
                  className="bg-orange-500 transition-all duration-300"
                  style={{
                    width: `${calculatePercentage(
                      summary.total_biaya_variabel,
                      summary.total_biaya_aktif
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {summary.total_biaya_aktif === 0 && (
        <div className="text-center py-4">
          <Minus className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Belum ada biaya operasional aktif</p>
        </div>
      )}
    </div>
  );
};

export default CostSummaryCard;